import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../api";

export const MUTE_SOUND_KEY = "notificationSoundMuted";
const PREFERENCE_ACCOUNT_KEY = "notificationPreferencesAccountId";

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  order: { push: true, soundId: "coreflow_1" },
  promotion: { soundId: "kalimba_1" },
  loyalty: { push: true, soundId: "nile_miles_1" },
  system: { push: true, soundId: "sonic_logo_1" },
  soundMuted: false,
};

export async function getPermissionPromptSnooze() {
  const { data } = await axiosClient.get(
    "/api/v1/customer/notification-preferences",
  );
  const snoozedUntil =
    data.notificationPreferences?.pushPermissionPromptSnoozedUntil ?? null;
  if (
    snoozedUntil !== null &&
    (typeof snoozedUntil !== "string" || !Number.isFinite(Date.parse(snoozedUntil)))
  ) {
    throw new Error("The Backend returned an invalid reminder deadline.");
  }
  return snoozedUntil;
}

export async function snoozePermissionPrompt() {
  const { data } = await axiosClient.post(
    "/api/v1/customer/notification-permission-prompt/snooze",
  );
  const snoozedUntil =
    data.notificationPreferences?.pushPermissionPromptSnoozedUntil;
  if (
    typeof snoozedUntil !== "string" ||
    !Number.isFinite(Date.parse(snoozedUntil))
  ) {
    throw new Error("The Backend returned an invalid reminder deadline.");
  }
  return snoozedUntil;
}

export async function syncAccountNotificationPreferences(userId) {
  if (!userId) throw new Error("A signed in customer is required.");

  let { data } = await axiosClient.get(
    "/api/v1/customer/notification-preferences",
  );
  if (data.soundMutedConfigured !== true) {
    const [legacyMute, previousAccountId] = await Promise.all([
      AsyncStorage.getItem(MUTE_SOUND_KEY),
      AsyncStorage.getItem(PREFERENCE_ACCOUNT_KEY),
    ]);
    const shouldUseLegacyMute =
      !previousAccountId || previousAccountId === userId;
    const migration = await axiosClient.patch(
      "/api/v1/customer/notification-preferences",
      {
        notificationPreferences: {
          soundMuted: shouldUseLegacyMute && legacyMute === "true",
        },
      },
    );
    data = migration.data;
  }

  if (
    typeof data.notificationPreferences?.soundMuted !== "boolean" ||
    !data.notificationPreferences
  ) {
    throw new Error("The Backend returned invalid notification preferences.");
  }

  await Promise.all([
    AsyncStorage.setItem(
      MUTE_SOUND_KEY,
      data.notificationPreferences.soundMuted ? "true" : "false",
    ),
    AsyncStorage.setItem(PREFERENCE_ACCOUNT_KEY, userId),
  ]);
  return data;
}
