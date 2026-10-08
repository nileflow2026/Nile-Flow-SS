"use strict";

const SOUND_REGISTRY = Object.freeze({
  coreflow_1: "coreflow_1.wav",
  kalimba_1: "kalimba_1.wav",
  kalimba_2: "kalimba_2.wav",
  kalimba_3: "kalimba_3.wav",
  kalimba_4: "kalimba_4.wav",
  nile_miles_1: "nile_miles_1.wav",
  nile_miles_2: "nile_miles_2.wav",
  nile_miles_3: "nile_miles_3.wav",
  nile_miles_4: "nile_miles_4.wav",
  sonic_logo_1: "sonic_logo_1.wav",
  sonic_logo_2: "sonic_logo_2.wav",
});

const CATEGORY_SOUNDS = Object.freeze({
  order: ["coreflow_1", "silent"],
  promotion: ["kalimba_1", "kalimba_2", "kalimba_3", "kalimba_4", "silent"],
  loyalty: ["nile_miles_1", "nile_miles_2", "nile_miles_3", "nile_miles_4", "silent"],
  system: ["sonic_logo_1", "sonic_logo_2", "silent"],
});

const DEFAULT_PREFERENCES = Object.freeze({
  order: Object.freeze({ push: true, soundId: "coreflow_1" }),
  promotion: Object.freeze({ soundId: "kalimba_1" }),
  loyalty: Object.freeze({ push: true, soundId: "nile_miles_1" }),
  system: Object.freeze({ push: true, soundId: "sonic_logo_1" }),
  soundMuted: false,
});

class NotificationPreferenceError extends Error {}

function readStoredPreferences(value) {
  if (value === undefined || value === null || value === "") return {};

  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("Stored notification preferences are not valid JSON.");
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stored notification preferences must be an object.");
  }
  return parsed;
}

function validateStoredPreferences(preferences) {
  for (const [category, allowedSounds] of Object.entries(CATEGORY_SOUNDS)) {
    const settings = preferences[category];
    if (settings === undefined) continue;
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new Error(`Stored ${category} notification preferences are invalid.`);
    }
    if (settings.push !== undefined && typeof settings.push !== "boolean") {
      throw new Error(`Stored ${category} push preference is invalid.`);
    }
    if (
      settings.soundId !== undefined &&
      !allowedSounds.includes(settings.soundId)
    ) {
      throw new Error(`Stored ${category} notification sound is invalid.`);
    }
  }
  if (
    preferences.soundMuted !== undefined &&
    typeof preferences.soundMuted !== "boolean"
  ) {
    throw new Error("Stored notification mute preference is invalid.");
  }
  if (
    preferences.pushPermissionPromptSnoozedUntil !== undefined &&
    preferences.pushPermissionPromptSnoozedUntil !== null &&
    (typeof preferences.pushPermissionPromptSnoozedUntil !== "string" ||
      !Number.isFinite(Date.parse(preferences.pushPermissionPromptSnoozedUntil)))
  ) {
    throw new Error("Stored notification prompt snooze deadline is invalid.");
  }
}

function normalizePreferences(preferences) {
  validateStoredPreferences(preferences);
  return {
    order: {
      push: preferences.order?.push ?? DEFAULT_PREFERENCES.order.push,
      soundId: preferences.order?.soundId ?? DEFAULT_PREFERENCES.order.soundId,
    },
    promotion: {
      soundId:
        preferences.promotion?.soundId ?? DEFAULT_PREFERENCES.promotion.soundId,
    },
    loyalty: {
      push: preferences.loyalty?.push ?? DEFAULT_PREFERENCES.loyalty.push,
      soundId:
        preferences.loyalty?.soundId ?? DEFAULT_PREFERENCES.loyalty.soundId,
    },
    system: {
      push: preferences.system?.push ?? DEFAULT_PREFERENCES.system.push,
      soundId:
        preferences.system?.soundId ?? DEFAULT_PREFERENCES.system.soundId,
    },
    soundMuted: preferences.soundMuted ?? DEFAULT_PREFERENCES.soundMuted,
    pushPermissionPromptSnoozedUntil:
      preferences.pushPermissionPromptSnoozedUntil ?? null,
  };
}

function validatePreferencePatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new NotificationPreferenceError("Notification preferences must be an object.");
  }

  const keys = Object.keys(body);
  if (
    keys.length === 0 ||
    keys.some(
      (key) => key !== "marketingPushEnabled" && key !== "notificationPreferences",
    )
  ) {
    throw new NotificationPreferenceError("The preference update contains an invalid field.");
  }
  if (
    Object.hasOwn(body, "marketingPushEnabled") &&
    typeof body.marketingPushEnabled !== "boolean"
  ) {
    throw new NotificationPreferenceError("marketingPushEnabled must be a Boolean.");
  }

  const patch = body.notificationPreferences;
  if (patch === undefined) return;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new NotificationPreferenceError("notificationPreferences must be an object.");
  }

  const allowedCategories = new Set(Object.keys(CATEGORY_SOUNDS));
  for (const [category, settings] of Object.entries(patch)) {
    if (category === "soundMuted") {
      if (typeof settings !== "boolean") {
        throw new NotificationPreferenceError("soundMuted must be a Boolean.");
      }
      continue;
    }
    if (!allowedCategories.has(category)) {
      throw new NotificationPreferenceError(`Unknown notification category: ${category}.`);
    }
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new NotificationPreferenceError(`${category} preferences must be an object.`);
    }

    const allowedFields =
      category === "promotion" ? new Set(["soundId"]) : new Set(["push", "soundId"]);
    for (const [key, value] of Object.entries(settings)) {
      if (!allowedFields.has(key)) {
        throw new NotificationPreferenceError(`Unknown ${category} preference: ${key}.`);
      }
      if (
        key === "push" &&
        typeof value !== "boolean"
      ) {
        throw new NotificationPreferenceError(`${category}.push must be a Boolean.`);
      }
      if (
        key === "soundId" &&
        !CATEGORY_SOUNDS[category].includes(value)
      ) {
        throw new NotificationPreferenceError(`Unknown ${category} notification sound.`);
      }
    }
    if (Object.keys(settings).length === 0) {
      throw new NotificationPreferenceError(`${category} preferences cannot be empty.`);
    }
  }
  if (Object.keys(patch).length === 0) {
    throw new NotificationPreferenceError("notificationPreferences cannot be empty.");
  }
}

function mergePreferences(current, patch) {
  const merged = { ...current };
  for (const [category, value] of Object.entries(patch || {})) {
    if (category === "soundMuted") {
      merged.soundMuted = value;
    } else if (category === "pushPermissionPromptSnoozedUntil") {
      merged.pushPermissionPromptSnoozedUntil = value;
    } else {
      merged[category] = { ...(current[category] || {}), ...value };
    }
  }
  validateStoredPreferences(merged);
  return merged;
}

function categoryForType(type) {
  const normalized = typeof type === "string" ? type.toLowerCase() : "";
  if (normalized.includes("welcome")) return "welcome";
  if (
    normalized.includes("security") ||
    normalized.includes("password") ||
    normalized.includes("email_changed")
  ) {
    return "security";
  }
  if (
    normalized.includes("order") ||
    normalized.includes("payment") ||
    normalized.includes("delivery")
  ) {
    return "order";
  }
  if (
    normalized.includes("promotion") ||
    normalized.includes("deal") ||
    normalized.includes("flash") ||
    normalized.includes("sale")
  ) {
    return "promotion";
  }
  if (
    normalized.includes("loyalty") ||
    normalized.includes("reward") ||
    normalized.includes("miles") ||
    normalized.includes("referral")
  ) {
    return "loyalty";
  }
  if (
    normalized.includes("system") ||
    normalized.includes("appupdate") ||
    normalized.includes("policy") ||
    normalized.includes("news")
  ) {
    return "system";
  }
  return null;
}

function resolvePushSettings(type, storedPreferences, marketingPushEnabled) {
  const preferences = readStoredPreferences(storedPreferences);
  validateStoredPreferences(preferences);
  const category = categoryForType(type);
  const locked = category === "security" || category === "welcome";
  const categorySettings = preferences[category] || {};
  const enabled =
    category === "promotion"
      ? marketingPushEnabled === true
      : locked || !category || categorySettings.push !== false;
  const soundId = locked
    ? "coreflow_1"
    : category
      ? categorySettings.soundId || DEFAULT_PREFERENCES[category].soundId
      : null;
  const muted = preferences.soundMuted === true;
  const silent = muted || soundId === "silent";

  return {
    category,
    enabled,
    soundId: silent ? null : soundId,
    sound: silent ? null : soundId ? SOUND_REGISTRY[soundId] : "default",
    channelId: silent
      ? category
        ? `nf-${category}-silent`
        : "nf-customer-silent"
      : category
        ? `nf-${category}-${soundId}`
        : "default",
  };
}

module.exports = {
  CATEGORY_SOUNDS,
  DEFAULT_PREFERENCES,
  NotificationPreferenceError,
  SOUND_REGISTRY,
  categoryForType,
  mergePreferences,
  normalizePreferences,
  readStoredPreferences,
  resolvePushSettings,
  validatePreferencePatch,
};
