"use strict";

const crypto = require("crypto");
const { ID, Permission, Query, Role } = require("node-appwrite");
const { env } = require("../src/env");
const { instrumentedDb } = require("./appwriteService");
const { notificationsQueue, connection } = require("../src/jobs/queues");
const { sendQueuedPush } = require("./pushNotificationService");
const {
  campaignDeliveryJobId,
  campaignPageJobId,
} = require("./pushBroadcastJobIds");
const {
  CATEGORIES,
  PushBroadcastError,
  idempotencyKey,
  normalizePayload,
  payloadHash,
  userEligible,
} = require("./pushBroadcastRules");

const PAGE_SIZE = 100;
const RETRYABLE_ERRORS = new Set([
  "http_429",
  "http_5xx",
  "MessageRateExceeded",
  "MessageServerUnavailable",
  "InternalServerError",
]);
const TERMINAL_DELIVERY_STATUSES = [
  "accepted",
  "rejected",
  "unresolved",
  "skipped",
];

function withIndexAliases(document, aliases) {
  const indexedDocument = { ...document };
  for (const [source, indexed] of Object.entries(aliases)) {
    if (Object.hasOwn(document, source)) indexedDocument[indexed] = document[source];
  }
  return indexedDocument;
}

const withCampaignIndexAliases = (document) =>
  withIndexAliases(document, {
    createdBy: "createdByIndex",
    idempotencyKey: "idempotencyKeyIndex",
    status: "statusIndex",
    createdAt: "createdAtIndex",
  });

const withDeliveryIndexAliases = (document) =>
  withIndexAliases(document, {
    campaignId: "campaignIdIndex",
    userId: "userIdIndex",
    status: "statusIndex",
    createdAt: "createdAtIndex",
  });

function collectionIds() {
  const ids = {
    campaigns: env.APPWRITE_PUSH_BROADCASTS_COLLECTION_ID,
    deliveries: env.APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID,
  };
  if (!ids.campaigns || !ids.deliveries) {
    throw new Error("Push broadcast collections are not configured.");
  }
  return ids;
}

function assertEnabled() {
  if (env.PUSH_NOTIFICATIONS_V2_ENABLED !== true) {
    throw new PushBroadcastError(503, "Push broadcasts are not enabled.");
  }
  if (!env.REDIS_URL && env.NODE_ENV === "production") {
    throw new PushBroadcastError(503, "Push broadcasts require durable Redis.");
  }
}

function candidateQueries({ snapshotAt, cursor, limit = PAGE_SIZE }) {
  const queries = [
    Query.isNotNull("pushTokenFirstRegisteredAtIndex"),
    Query.lessThanEqual("pushTokenFirstRegisteredAtIndex", snapshotAt),
    Query.orderAsc("$id"),
    Query.limit(limit),
  ];
  if (cursor) queries.push(Query.cursorAfter(cursor));
  return queries;
}

async function countEligible(category, snapshotAt = new Date().toISOString()) {
  let cursor = null;
  let count = 0;
  while (true) {
    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      candidateQueries({ snapshotAt, cursor }),
    );
    if (!result.documents.length) return count;
    count += result.documents.filter((user) =>
      userEligible(user, category, snapshotAt),
    ).length;
    cursor = result.documents[result.documents.length - 1].$id;
    if (result.documents.length < PAGE_SIZE) return count;
  }
}

async function previewCampaign(input) {
  assertEnabled();
  const payload = normalizePayload(input);
  const estimatedRecipientCount = await countEligible(payload.category);
  return { ...payload, estimatedRecipientCount };
}

async function findCampaignByIdempotencyKey(createdBy, key) {
  const { campaigns } = collectionIds();
  const result = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    campaigns,
    [
      Query.equal("createdByIndex", createdBy),
      Query.equal("idempotencyKeyIndex", key),
      Query.limit(1),
    ],
  );
  return result.documents[0] || null;
}

async function enqueueCampaignPage(campaignId, cursor) {
  const jobId = campaignPageJobId(campaignId, cursor);
  const existing = await notificationsQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state !== "failed" && state !== "completed") return existing;
    await existing.remove();
  }
  return notificationsQueue.add(
    "push-broadcast-page",
    {
      type: "push-broadcast-page",
      payload: { campaignId },
    },
    {
      jobId,
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );
}

async function createCampaign(input, createdBy, headerKey) {
  assertEnabled();
  const payload = normalizePayload(input);
  const key = idempotencyKey(headerKey);
  const hash = payloadHash(payload);
  const existing = await findCampaignByIdempotencyKey(createdBy, key);
  if (existing) {
    if (existing.payloadHash !== hash) {
      throw new PushBroadcastError(409, "This idempotency key was already used for different campaign content.");
    }
    const active = existing.status === "queued" || existing.status === "sending";
    if (existing.status === "queued") {
      try {
        await enqueueCampaignPage(existing.$id, existing.lastProcessedUserId || null);
      } catch {
        throw new PushBroadcastError(
          503,
          `Campaign ${existing.$id} is saved but could not be queued. Retry with the same Idempotency-Key.`,
        );
      }
    }
    return { campaign: existing, replay: true, queued: active };
  }

  const now = new Date();
  const estimatedRecipientCount = await countEligible(payload.category, now.toISOString());
  if (estimatedRecipientCount < 1) {
    throw new PushBroadcastError(422, "There are no eligible recipients for this campaign.");
  }
  const { campaigns } = collectionIds();
  let campaign;
  try {
    campaign = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      campaigns,
      ID.unique(),
      withCampaignIndexAliases({
        ...payload,
        destinationRoute: payload.destinationRoute || "",
        createdBy,
        idempotencyKey: key,
        payloadHash: hash,
        status: "queued",
        expiresAt: new Date(now.getTime() + CATEGORIES[payload.category].expiresMs).toISOString(),
        recipientSnapshotAt: "",
        lastProcessedUserId: "",
        estimatedRecipientCount,
        targetedCount: 0,
        recipientPreparationComplete: false,
        acceptedCount: 0,
        rejectedCount: 0,
        unresolvedCount: 0,
        skippedCount: 0,
        createdAt: now.toISOString(),
        startedAt: "",
        completedAt: "",
        cancelledAt: "",
      }),
    );
  } catch (error) {
    if (error.code !== 409) throw error;
    campaign = await findCampaignByIdempotencyKey(createdBy, key);
    if (!campaign) throw error;
    if (campaign.payloadHash !== hash) {
      throw new PushBroadcastError(409, "This idempotency key was already used for different campaign content.");
    }
    if (campaign.status === "queued") {
      try {
        await enqueueCampaignPage(campaign.$id, campaign.lastProcessedUserId || null);
      } catch {
        throw new PushBroadcastError(
          503,
          `Campaign ${campaign.$id} is saved but could not be queued. Retry with the same Idempotency-Key.`,
        );
      }
    }
    return {
      campaign,
      replay: true,
      queued: campaign.status === "queued" || campaign.status === "sending",
    };
  }

  try {
    await enqueueCampaignPage(campaign.$id, null);
  } catch (error) {
    const queueError = new PushBroadcastError(
      503,
      `Campaign ${campaign.$id} was saved but could not be queued. Retry with the same Idempotency-Key.`,
    );
    queueError.campaignId = campaign.$id;
    queueError.queued = false;
    throw queueError;
  }
  return { campaign, replay: false, queued: true };
}

async function getCampaign(campaignId) {
  const { campaigns } = collectionIds();
  try {
    return await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      campaigns,
      campaignId,
    );
  } catch (error) {
    if (error.code === 404) throw new PushBroadcastError(404, "Campaign was not found.");
    throw error;
  }
}

async function listCampaigns(page = 1, limit = 20) {
  assertEnabled();
  const pageNum = Number(page);
  const limitNum = Number(limit);
  if (
    !Number.isInteger(pageNum) ||
    pageNum < 1 ||
    !Number.isInteger(limitNum) ||
    limitNum < 1 ||
    limitNum > 100
  ) {
    throw new PushBroadcastError(400, "Page must be positive and limit must be between 1 and 100.");
  }
  const { campaigns } = collectionIds();
  const result = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    campaigns,
    [
      Query.orderDesc("createdAtIndex"),
      Query.orderDesc("$id"),
      Query.limit(limitNum),
      Query.offset((pageNum - 1) * limitNum),
    ],
  );
  return {
    page: pageNum,
    limit: limitNum,
    total: result.total,
    campaigns: result.documents.map(toSummary),
  };
}

function toSummary(campaign) {
  const outcomes =
    (campaign.acceptedCount || 0) +
    (campaign.rejectedCount || 0) +
    (campaign.unresolvedCount || 0) +
    (campaign.skippedCount || 0);
  const pendingCount =
    campaign.recipientPreparationComplete === true
      ? Math.max(0, campaign.targetedCount - outcomes)
      : null;
  return {
    id: campaign.$id,
    title: campaign.title,
    category: campaign.category,
    status: campaign.status,
    createdAt: campaign.createdAt,
    estimatedRecipientCount: campaign.estimatedRecipientCount,
    targetedCount:
      campaign.recipientPreparationComplete === true
        ? campaign.targetedCount
        : null,
    acceptedCount: campaign.acceptedCount || 0,
    rejectedCount: campaign.rejectedCount || 0,
    unresolvedCount: campaign.unresolvedCount || 0,
    skippedCount: campaign.skippedCount || 0,
    pendingCount,
  };
}

async function getCampaignDetail(campaignId) {
  assertEnabled();
  const campaign = await getCampaign(campaignId);
  const summary = toSummary(campaign);
  return {
    ...summary,
    body: campaign.body,
    destinationRoute: campaign.destinationRoute || null,
    expiresAt: campaign.expiresAt,
    startedAt: campaign.startedAt || null,
    completedAt: campaign.completedAt || null,
    cancelledAt: campaign.cancelledAt || null,
  };
}

async function withCampaignLock(campaignId, callback) {
  const lockKey = `nf:push-broadcast-lock:${campaignId}`;
  const lockToken = crypto.randomUUID();
  const locked = await connection.set(lockKey, lockToken, "EX", 120, "NX");
  if (locked !== "OK") throw new PushBroadcastError(409, "Campaign is being processed. Retry shortly.");
  try {
    return await callback();
  } finally {
    await connection.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      lockKey,
      lockToken,
    );
  }
}

async function cancelCampaign(campaignId) {
  assertEnabled();
  return withCampaignLock(campaignId, async () => {
    const campaign = await getCampaign(campaignId);
    if (campaign.status !== "queued" || campaign.recipientSnapshotAt) {
      throw new PushBroadcastError(409, "Only a queued campaign that has not started can be cancelled.");
    }
    const cancelledAt = new Date().toISOString();
    return instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      collectionIds().campaigns,
      campaignId,
      withCampaignIndexAliases({ status: "cancelled", cancelledAt }),
    );
  });
}

async function createDelivery(campaign, user) {
  const { deliveries } = collectionIds();
  const deliveryId = crypto
    .createHash("sha256")
    .update(`${campaign.$id}:${user.$id}`)
    .digest("hex")
    .slice(0, 32);
  const eligible = userEligible(
    user,
    campaign.category,
    campaign.recipientSnapshotAt,
  );
  const data = withDeliveryIndexAliases({
    campaignId: campaign.$id,
    userId: user.$id,
    status: eligible ? "pending" : "skipped",
    attemptCount: 0,
    manualRetryCount: 0,
    ticketId: "",
    errorCategory: eligible ? "" : "ineligible_at_snapshot",
    inAppNotificationId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAttemptAt: "",
  });
  let delivery;
  try {
    delivery = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      deliveries,
      deliveryId,
      data,
    );
  } catch (error) {
    if (error.code !== 409) throw error;
    delivery = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      deliveries,
      deliveryId,
    );
  }
  if (delivery.status !== "pending") return;
  if (!eligible) {
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      deliveries,
      deliveryId,
      withDeliveryIndexAliases({
        status: "skipped",
        errorCategory: "consent_or_token_removed",
        updatedAt: new Date().toISOString(),
      }),
    );
    return;
  }
  await enqueueDelivery(deliveryId, delivery.manualRetryCount || 0);
}

async function enqueueDelivery(deliveryId, manualRetryCount) {
  const jobId = campaignDeliveryJobId(deliveryId, manualRetryCount);
  const existing = await notificationsQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state !== "failed") return existing;
    await existing.remove();
  }
  return notificationsQueue.add(
    "push-broadcast-delivery",
    { type: "push-broadcast-delivery", payload: { deliveryId } },
    {
      jobId,
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );
}

async function processCampaignPage(campaignId) {
  assertEnabled();
  return withCampaignLock(campaignId, async () => {
    let campaign = await getCampaign(campaignId);
    if (campaign.status === "cancelled" || campaign.status === "complete" || campaign.status === "complete_with_issues") {
      return { status: campaign.status };
    }

    const now = new Date().toISOString();
    if (!campaign.recipientSnapshotAt) {
      campaign = await instrumentedDb.updateDocument(
        env.APPWRITE_DATABASE_ID,
        collectionIds().campaigns,
        campaignId,
        withCampaignIndexAliases({
          status: "sending",
          recipientSnapshotAt: now,
          startedAt: now,
        }),
      );
    }

    const { deliveries } = collectionIds();
    const pendingDeliveries = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      deliveries,
      [
        Query.equal("campaignIdIndex", campaignId),
        Query.equal("statusIndex", "pending"),
        Query.limit(1),
      ],
    );
    if (pendingDeliveries.documents.length) {
      return { status: "sending", waitingForDelivery: true };
    }

    const users = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      candidateQueries({
        snapshotAt: campaign.recipientSnapshotAt,
        cursor: campaign.lastProcessedUserId || null,
      }),
    );
    if (!users.documents.length) {
      const deliveryCount = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        deliveries,
        [Query.equal("campaignIdIndex", campaignId), Query.limit(1)],
      );
      await instrumentedDb.updateDocument(
        env.APPWRITE_DATABASE_ID,
        collectionIds().campaigns,
        campaignId,
        {
          targetedCount: deliveryCount.total,
          recipientPreparationComplete: true,
        },
      );
      await refreshCampaignCounts(campaignId);
      return { status: "sending", targetedCount: deliveryCount.total };
    }

    for (const user of users.documents) await createDelivery(campaign, user);
    const lastProcessedUserId =
      users.documents[users.documents.length - 1].$id;
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      collectionIds().campaigns,
      campaignId,
      { lastProcessedUserId },
    );
    const pendingAfterPage = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      deliveries,
      [
        Query.equal("campaignIdIndex", campaignId),
        Query.equal("statusIndex", "pending"),
        Query.limit(1),
      ],
    );
    if (!pendingAfterPage.documents.length) {
      await enqueueCampaignPage(campaignId, lastProcessedUserId);
    }
    return { status: "sending", prepared: users.documents.length };
  });
}

async function getDelivery(deliveryId) {
  try {
    return await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      collectionIds().deliveries,
      deliveryId,
    );
  } catch (error) {
    if (error.code === 404) return null;
    throw error;
  }
}

async function createCampaignNotice(campaign, delivery) {
  const notificationId = crypto
    .createHash("sha256")
    .update(`campaign-notice:${campaign.$id}:${delivery.userId}`)
    .digest("hex")
    .slice(0, 32);
  const type = CATEGORIES[campaign.category].type;
  try {
    await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      notificationId,
      {
        userId: delivery.userId,
        message: campaign.body,
        title: campaign.title,
        type,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false,
        metadata: JSON.stringify({
          route: campaign.destinationRoute || "",
          campaignId: campaign.$id,
        }),
      },
      [
        Permission.read(Role.user(delivery.userId)),
        Permission.update(Role.user(delivery.userId)),
        Permission.delete(Role.user(delivery.userId)),
      ],
    );
  } catch (error) {
    if (error.code !== 409) throw error;
  }
  await instrumentedDb.updateDocument(
    env.APPWRITE_DATABASE_ID,
    collectionIds().deliveries,
    delivery.$id,
    { inAppNotificationId: notificationId, updatedAt: new Date().toISOString() },
  );
}

async function finishDelivery(delivery, status, fields = {}) {
  await instrumentedDb.updateDocument(
    env.APPWRITE_DATABASE_ID,
    collectionIds().deliveries,
    delivery.$id,
    withDeliveryIndexAliases({
      status,
      ...fields,
      updatedAt: new Date().toISOString(),
    }),
  );
  await refreshCampaignCounts(delivery.campaignId);
}

async function processCampaignDelivery(deliveryId, attemptsMade = 0) {
  assertEnabled();
  const delivery = await getDelivery(deliveryId);
  if (!delivery || delivery.status !== "pending") return { status: delivery?.status || "missing" };
  const campaign = await getCampaign(delivery.campaignId);
  if (campaign.status === "cancelled") {
    return finishDelivery(delivery, "skipped", { errorCategory: "campaign_cancelled" });
  }
  const remainingSeconds = Math.floor(
    (new Date(campaign.expiresAt).getTime() - Date.now()) / 1000,
  );
  if (remainingSeconds <= 0) {
    return finishDelivery(delivery, "skipped", { errorCategory: "expired" });
  }

  const user = await instrumentedDb.getDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_USER_COLLECTION_ID,
    delivery.userId,
  );
  await createCampaignNotice(campaign, delivery);
  const currentDelivery = await getDelivery(deliveryId);
  if (!userEligible(user, campaign.category, campaign.recipientSnapshotAt)) {
    return finishDelivery(currentDelivery, "skipped", {
      errorCategory: "consent_or_token_removed",
    });
  }
  const category = CATEGORIES[campaign.category];
  try {
    const outcome = await sendQueuedPush({
      userId: delivery.userId,
      title: campaign.title,
      message: campaign.body,
      type: category.type,
      data: { route: campaign.destinationRoute || "" },
      expiresAfter: remainingSeconds,
    });
    const deliveryStatus =
      outcome.status === "accepted"
        ? "accepted"
        : outcome.status === "skipped"
          ? "skipped"
          : "rejected";
    return finishDelivery(currentDelivery, deliveryStatus, {
      ticketId: outcome.ticketId || "",
      errorCategory: outcome.reason || "",
      attemptCount: (delivery.attemptCount || 0) + 1,
      lastAttemptAt: new Date().toISOString(),
    });
  } catch (error) {
    const attemptCount = (delivery.attemptCount || 0) + 1;
    if (error.retryable && attemptsMade < 4) {
      await instrumentedDb.updateDocument(
        env.APPWRITE_DATABASE_ID,
        collectionIds().deliveries,
        deliveryId,
        { attemptCount, lastAttemptAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      );
      throw error;
    }
    const ambiguous = !error.statusCode && !error.errorCategory;
    const status = ambiguous ? "unresolved" : "rejected";
    const errorCategory =
      error.errorCategory ||
      (error.retryable ? "transient_provider_error" : "ambiguous_provider_result");
    return finishDelivery(currentDelivery, status, {
      attemptCount,
      lastAttemptAt: new Date().toISOString(),
      errorCategory,
    });
  }
}

async function refreshCampaignCounts(campaignId) {
  const { campaigns, deliveries } = collectionIds();
  const counts = {};
  for (const status of ["accepted", "rejected", "unresolved", "skipped"]) {
    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      deliveries,
      [
        Query.equal("campaignIdIndex", campaignId),
        Query.equal("statusIndex", status),
        Query.limit(1),
      ],
    );
    counts[`${status}Count`] = result.total;
  }
  const campaign = await getCampaign(campaignId);
  const outcomeCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const complete =
    campaign.recipientPreparationComplete === true &&
    Number.isInteger(campaign.targetedCount) &&
    campaign.targetedCount >= 0 &&
    outcomeCount === campaign.targetedCount;
  const anyIssue =
    counts.rejectedCount > 0 ||
    counts.unresolvedCount > 0 ||
    counts.skippedCount > 0;
  await instrumentedDb.updateDocument(
    env.APPWRITE_DATABASE_ID,
    campaigns,
    campaignId,
    withCampaignIndexAliases({
      ...counts,
      ...(complete
        ? {
            status: anyIssue ? "complete_with_issues" : "complete",
            completedAt: new Date().toISOString(),
          }
        : {}),
    }),
  );
}

async function retryCampaign(campaignId) {
  assertEnabled();
  return withCampaignLock(campaignId, async () => {
    const campaign = await getCampaign(campaignId);
    let cursor = null;
    let retried = 0;
    while (true) {
      const queries = [
        Query.equal("campaignIdIndex", campaignId),
        Query.equal("statusIndex", "rejected"),
        Query.orderAsc("$id"),
        Query.limit(PAGE_SIZE),
      ];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const result = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        collectionIds().deliveries,
        queries,
      );
      if (!result.documents.length) break;
      for (const delivery of result.documents) {
        cursor = delivery.$id;
        if (
          delivery.manualRetryCount !== 0 ||
          !RETRYABLE_ERRORS.has(delivery.errorCategory)
        ) {
          continue;
        }
        await instrumentedDb.updateDocument(
          env.APPWRITE_DATABASE_ID,
          collectionIds().deliveries,
          delivery.$id,
          withDeliveryIndexAliases({
            status: "pending",
            manualRetryCount: 1,
            errorCategory: "",
            updatedAt: new Date().toISOString(),
          }),
        );
        if (
          retried === 0 &&
          (campaign.status === "complete" ||
            campaign.status === "complete_with_issues")
        ) {
          await instrumentedDb.updateDocument(
            env.APPWRITE_DATABASE_ID,
            collectionIds().campaigns,
            campaignId,
            withCampaignIndexAliases({ status: "sending", completedAt: "" }),
          );
        }
        await enqueueDelivery(delivery.$id, 1);
        retried += 1;
      }
      if (result.documents.length < PAGE_SIZE) break;
    }
    if (!retried) {
      throw new PushBroadcastError(409, "There are no confirmed transient failures available for retry.");
    }
    await refreshCampaignCounts(campaignId);
    return { retried };
  });
}

async function recoverCampaigns() {
  if (env.PUSH_NOTIFICATIONS_V2_ENABLED !== true) return 0;
  const { campaigns, deliveries } = collectionIds();
  let cursor = null;
  let count = 0;
  while (true) {
    const queries = [
      Query.equal("statusIndex", ["queued", "sending"]),
      Query.orderAsc("$id"),
      Query.limit(PAGE_SIZE),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      campaigns,
      queries,
    );
    if (!page.documents.length) break;
    for (const campaign of page.documents) {
      cursor = campaign.$id;
      if (!campaign.recipientPreparationComplete) {
        await enqueueCampaignPage(
          campaign.$id,
          campaign.lastProcessedUserId || null,
        );
      }

      let deliveryCursor = null;
      while (true) {
        const deliveryQueries = [
          Query.equal("campaignIdIndex", campaign.$id),
          Query.equal("statusIndex", "pending"),
          Query.orderAsc("$id"),
          Query.limit(PAGE_SIZE),
        ];
        if (deliveryCursor) deliveryQueries.push(Query.cursorAfter(deliveryCursor));
        const pending = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          deliveries,
          deliveryQueries,
        );
        if (!pending.documents.length) break;
        for (const delivery of pending.documents) {
          deliveryCursor = delivery.$id;
          await enqueueDelivery(delivery.$id, delivery.manualRetryCount || 0);
        }
        if (pending.documents.length < PAGE_SIZE) break;
      }
      await refreshCampaignCounts(campaign.$id);
      count += 1;
    }
    if (page.documents.length < PAGE_SIZE) break;
  }
  return count;
}

async function pruneExpiredPushDetails() {
  if (env.PUSH_NOTIFICATIONS_V2_ENABLED !== true) return { deliveries: 0, receipts: 0 };
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const ids = collectionIds();
  const receiptCollection = env.APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID;
  if (!receiptCollection) throw new Error("Push event receipt collection is not configured.");
  const deleted = { deliveries: 0, receipts: 0 };

  for (const [collectionId, key] of [
    [ids.deliveries, "deliveries"],
    [receiptCollection, "receipts"],
  ]) {
    let cursor = null;
    while (true) {
      const queries = [
        Query.equal("statusIndex", TERMINAL_DELIVERY_STATUSES),
        Query.lessThan("createdAtIndex", cutoff),
        Query.orderAsc("$id"),
        Query.limit(PAGE_SIZE),
      ];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const page = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        collectionId,
        queries,
      );
      if (!page.documents.length) break;
      for (const document of page.documents) {
        await instrumentedDb.deleteDocument(
          env.APPWRITE_DATABASE_ID,
          collectionId,
          document.$id,
        );
        deleted[key] += 1;
      }
      cursor = page.documents[page.documents.length - 1].$id;
      if (page.documents.length < PAGE_SIZE) break;
    }
  }
  return deleted;
}

module.exports = {
  PushBroadcastError,
  cancelCampaign,
  createCampaign,
  getCampaignDetail,
  listCampaigns,
  previewCampaign,
  processCampaignDelivery,
  processCampaignPage,
  pruneExpiredPushDetails,
  recoverCampaigns,
  retryCampaign,
};
