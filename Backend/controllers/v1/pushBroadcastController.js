"use strict";

const {
  PushBroadcastError,
  cancelCampaign,
  createCampaign,
  getCampaignDetail,
  listCampaigns,
  previewCampaign,
  retryCampaign,
} = require("../../services/pushBroadcastService");
const { logAuditFromRequest } = require("../../utils/auditLogger");

function sendError(res, error) {
  const status = error instanceof PushBroadcastError ? error.statusCode : 503;
  if (!(error instanceof PushBroadcastError)) {
    console.error("Push broadcast request failed:", error.message);
  }
  return res.status(status).json({
    success: false,
    message: error.message || "Push broadcast service is unavailable.",
    ...(error.campaignId ? { campaignId: error.campaignId, queued: false } : {}),
  });
}

async function preview(req, res) {
  try {
    const campaign = await previewCampaign(req.body);
    return res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    return sendError(res, error);
  }
}

async function create(req, res) {
  try {
    const result = await createCampaign(
      req.body,
      req.user.userId,
      req.get("Idempotency-Key"),
    );
    if (!result.replay) {
      await logAuditFromRequest(
        req,
        "PUSH_BROADCAST_CREATED",
        "PUSH_BROADCAST",
        result.campaign.$id,
        { category: result.campaign.category },
      );
    }
    return res.status(202).json({
      success: true,
      queued: result.queued,
      replay: result.replay,
      campaign: {
        id: result.campaign.$id,
        status: result.campaign.status,
        createdAt: result.campaign.createdAt,
        estimatedRecipientCount: result.campaign.estimatedRecipientCount,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function list(req, res) {
  try {
    const data = await listCampaigns(req.query.page, req.query.limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

async function detail(req, res) {
  try {
    const data = await getCampaignDetail(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

async function cancel(req, res) {
  try {
    const campaign = await cancelCampaign(req.params.id);
    await logAuditFromRequest(
      req,
      "PUSH_BROADCAST_CANCELLED",
      "PUSH_BROADCAST",
      campaign.$id,
    );
    return res.status(200).json({ success: true, status: campaign.status });
  } catch (error) {
    return sendError(res, error);
  }
}

async function retry(req, res) {
  try {
    const result = await retryCampaign(req.params.id);
    await logAuditFromRequest(
      req,
      "PUSH_BROADCAST_RETRIED",
      "PUSH_BROADCAST",
      req.params.id,
      { retried: result.retried },
    );
    return res.status(202).json({ success: true, ...result });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { cancel, create, detail, list, preview, retry };
