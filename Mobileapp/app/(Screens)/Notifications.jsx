import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";
import { useGlobalContext } from "../../Context/GlobalProvider";
import { useNotification } from "../../Context/NotificationContext";
import { applyMuteSetting } from "../../hooks/usePushNotifications";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  syncAccountNotificationPreferences,
} from "../../services/notificationPreferences";
import {
  NOTIFICATION_SOUND_ASSETS,
  NOTIFICATION_SOUND_GROUPS,
} from "../../constants/notificationSounds";

const NOTIFICATION_CATEGORIES = [
  {
    key: "order",
    title: "Order updates",
    description: "Order confirmation, preparation, delivery, and cancellation.",
  },
  {
    key: "promotion",
    title: "Promotions",
    description: "Deals, offers, and promotional announcements.",
  },
  {
    key: "loyalty",
    title: "Nile Miles and rewards",
    description: "Miles earned and reward activity.",
  },
  {
    key: "system",
    title: "App and service updates",
    description: "Important changes to Nile Flow and its services.",
  },
];

function SoundPreviewButton({ soundId }) {
  const player = useAudioPlayer(NOTIFICATION_SOUND_ASSETS[soundId]);

  const playPreview = async () => {
    try {
      await player.seekTo(0);
      await player.play();
    } catch (error) {
      Alert.alert(
        "Sound unavailable",
        error.message || "This sound could not be played.",
      );
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Preview selected notification sound"
      onPress={playPreview}
      style={styles.previewButton}
    >
      <MaterialIcons name="play-arrow" size={22} color="#16A34A" />
    </TouchableOpacity>
  );
}

export default function Notifications() {
  const { user } = useGlobalContext();
  const userId = user?.id || user?.userId || user?.$id;
  const { requestPushPermission } = useNotification();
  const [marketingPushEnabled, setMarketingPushEnabled] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);

  const loadPreferences = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    if (!userId) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    setLoading(true);
    setLoadError(false);
    try {
      const data = await syncAccountNotificationPreferences(userId);
      if (requestId.current !== currentRequestId) return;
      setMarketingPushEnabled(data.marketingPushEnabled === true);
      setNotificationPreferences(data.notificationPreferences);
    } catch {
      if (requestId.current === currentRequestId) setLoadError(true);
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
      return () => {
        requestId.current += 1;
      };
    }, [loadPreferences]),
  );

  const savePreference = async ({
    notificationPreferences: preferencePatch,
    marketingPushEnabled: marketingPatch,
    requestPermission = false,
  }) => {
    if (!userId || loading || saving) return;
    setSaving(true);
    try {
      const permissionResult =
        requestPermission && requestPushPermission
          ? await requestPushPermission()
          : { status: "registered" };
      const payload = {};
      if (preferencePatch) {
        payload.notificationPreferences = preferencePatch;
      }
      if (typeof marketingPatch === "boolean") {
        payload.marketingPushEnabled = marketingPatch;
      }

      const { data } = await axiosClient.patch(
        "/api/v1/customer/notification-preferences",
        payload,
      );
      if (
        !data.notificationPreferences ||
        typeof data.notificationPreferences.soundMuted !== "boolean"
      ) {
        throw new Error("The server returned invalid notification settings.");
      }
      setMarketingPushEnabled(data.marketingPushEnabled === true);
      setNotificationPreferences(data.notificationPreferences);
      await applyMuteSetting(data.notificationPreferences.soundMuted);
      if (requestPermission && permissionResult.status !== "registered") {
        const canOpenSettings =
          permissionResult.status === "settings_required" ||
          (permissionResult.status === "denied" &&
            !permissionResult.canAskAgain);
        Alert.alert(
          "Notifications are not enabled",
          permissionResult.status === "registration_failed"
            ? "Permission is enabled, but this device could not register for push alerts. Retry from notification settings."
            : "Your choice is saved. Enable notifications and register a device token to receive push alerts.",
          canOpenSettings
            ? [
                { text: "Not now", style: "cancel" },
                {
                  text: "Open settings",
                  onPress: () =>
                    Linking.openSettings().catch((error) => {
                      Alert.alert(
                        "Could not open settings",
                        error.message ||
                          "Open device settings to allow notifications.",
                      );
                    }),
                },
              ]
            : undefined,
        );
      }
    } catch (error) {
      Alert.alert(
        "Could not save setting",
        error.response?.data?.message ||
          error.message ||
          "Your notification preference was not changed. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notification Settings",
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#14532D",
          headerTitleStyle: { fontFamily: "Poppins-SemiBold" },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <MaterialIcons name="notifications-active" size={24} color="#16A34A" />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Choose what reaches you</Text>
            <Text style={styles.description}>
              Manage push alerts and sounds for each type of update.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color="#16A34A" size="large" />
            <Text style={styles.description}>Loading your settings…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateCard}>
            <MaterialIcons name="cloud-off" size={28} color="#DC2626" />
            <Text style={styles.stateMessage} selectable>
              Your settings could not be loaded. Check your connection and try
              again.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={loadPreferences}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.card, styles.muteCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.title}>Mute all sounds</Text>
                  <Text style={styles.description}>
                    Keep push alerts on, but silence their sounds.
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Mute all notification sounds"
                  value={notificationPreferences.soundMuted}
                  disabled={saving}
                  onValueChange={(value) =>
                    savePreference({
                      notificationPreferences: { soundMuted: value },
                    })
                  }
                  trackColor={{ false: "#D1D5DB", true: "#16A34A" }}
                />
              </View>
            </View>

            {NOTIFICATION_CATEGORIES.map((category) => {
              const setting =
                notificationPreferences[category.key] ||
                DEFAULT_NOTIFICATION_PREFERENCES[category.key];
              const enabled =
                category.key === "promotion"
                  ? marketingPushEnabled
                  : setting.push;
              const soundChoices = NOTIFICATION_SOUND_GROUPS[category.key];

              return (
                <View key={category.key} style={styles.card}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.title}>{category.title}</Text>
                      <Text style={styles.description}>
                        {category.description}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={`${category.title} push notifications`}
                      value={enabled}
                      disabled={saving}
                      onValueChange={(value) =>
                        savePreference(
                          category.key === "promotion"
                            ? {
                                marketingPushEnabled: value,
                                requestPermission: value,
                              }
                            : {
                                notificationPreferences: {
                                  [category.key]: { push: value },
                                },
                                requestPermission: value,
                              },
                        )
                      }
                      trackColor={{ false: "#D1D5DB", true: "#16A34A" }}
                    />
                  </View>

                  <View style={styles.soundSection}>
                    <Text style={styles.description}>Notification sound</Text>
                    <View style={styles.soundChoices}>
                      {soundChoices.map((choice) => {
                        const selected = setting.soundId === choice.id;
                        return (
                          <TouchableOpacity
                            key={choice.id}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            accessibilityLabel={`${choice.label} sound`}
                            disabled={saving}
                            onPress={() =>
                              savePreference({
                                notificationPreferences: {
                                  [category.key]: { soundId: choice.id },
                                },
                              })
                            }
                            style={[
                              styles.soundChoice,
                              selected && styles.selectedSoundChoice,
                            ]}
                          >
                            <Text
                              style={[
                                styles.soundChoiceText,
                                selected && styles.selectedSoundChoiceText,
                              ]}
                            >
                              {choice.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {setting.soundId !== "silent" && (
                      <View style={styles.previewRow}>
                        <SoundPreviewButton
                          key={setting.soundId}
                          soundId={setting.soundId}
                        />
                        <Text style={styles.description}>
                          Preview{" "}
                          {
                            soundChoices.find(
                              (choice) => choice.id === setting.soundId,
                            )?.label
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.securityNote}>
              <MaterialIcons name="verified-user" size={20} color="#16A34A" />
              <Text style={styles.description}>
                Security and welcome alerts always stay on.
              </Text>
            </View>
            {saving && (
              <View style={styles.savingState}>
                <ActivityIndicator color="#16A34A" size="small" />
                <Text style={styles.description}>Saving your choice…</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    padding: 16,
  },
  introText: {
    flex: 1,
    gap: 4,
  },
  introTitle: {
    color: "#14532D",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 14,
    gap: 13,
  },
  muteCard: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#111827",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  description: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Poppins-Regular",
  },
  soundSection: {
    gap: 9,
  },
  soundChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  soundChoice: {
    minHeight: 38,
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  selectedSoundChoice: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  soundChoiceText: {
    color: "#374151",
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  selectedSoundChoiceText: {
    color: "#14532D",
    fontFamily: "Poppins-SemiBold",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  previewButton: {
    minHeight: 40,
    minWidth: 46,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  savingState: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  stateContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  stateCard: {
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  stateMessage: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  retryButton: {
    minHeight: 42,
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#16A34A",
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },
};