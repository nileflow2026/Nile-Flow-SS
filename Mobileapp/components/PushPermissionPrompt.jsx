import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSegments } from "expo-router";
import { useGlobalContext } from "../Context/GlobalProvider";
import { useNotification } from "../Context/NotificationContext";
import {
  getPermissionPromptSnooze,
  snoozePermissionPrompt,
} from "../services/notificationPreferences";
import {
  getPushPermissionState,
  isPushNotificationPromptSupported,
} from "../hooks/usePushNotifications";

export default function PushPermissionPrompt() {
  const {
    isLogged,
    isGuest,
    loading: sessionLoading,
    sessionInitialized,
    user,
    pickupAddress,
    pickupAddressLoading,
    pickupAddressError,
  } = useGlobalContext();
  const { requestPushPermission } = useNotification();
  const segments = useSegments();
  const userId = user?.id || user?.userId || user?.$id;
  const onSetupRoute =
    segments[0] === "(auth)" ||
    (segments[0] === "(Screens)" && segments[1] === "pickup-address");
  const hasPickupAddress =
    typeof pickupAddress === "string"
      ? pickupAddress.trim().length > 0
      : Boolean(
          pickupAddress &&
            typeof pickupAddress === "object" &&
            Object.keys(pickupAddress).length > 0,
        );
  const accountReady =
    Boolean(userId) &&
    isLogged &&
    !isGuest &&
    !sessionLoading &&
    sessionInitialized &&
    !pickupAddressLoading &&
    !pickupAddressError &&
    hasPickupAddress;
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [showSettingsAction, setShowSettingsAction] = useState(false);
  const [registrationFailed, setRegistrationFailed] = useState(false);
  const [dismissedForSession, setDismissedForSession] = useState(false);
  const [now, setNow] = useState(0);
  const promptLoadId = useRef(0);

  const loadPromptState = useCallback(async () => {
    const currentLoadId = ++promptLoadId.current;
    if (
      !accountReady ||
      !appActive ||
      onSetupRoute ||
      !isPushNotificationPromptSupported()
    ) {
      return;
    }
    setPreferencesLoaded(false);
    setLoadError(null);
    try {
      const [deadline, permission] = await Promise.all([
        getPermissionPromptSnooze(),
        getPushPermissionState(),
      ]);
      if (promptLoadId.current !== currentLoadId) return;
      setSnoozedUntil(deadline);
      setPermissionGranted(permission.granted);
      if (permission.granted) setShowSettingsAction(false);
      setPreferencesLoaded(true);
      setNow(Date.now());
    } catch (error) {
      if (promptLoadId.current !== currentLoadId) return;
      console.error(
        "[PushPrompt] Could not load notification reminder state:",
        error.response?.data?.message || error.message,
      );
      setLoadError(
        "We could not check your notification settings. Please try again.",
      );
    }
  }, [accountReady, appActive, onSetupRoute]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
      if (state === "active") setNow(Date.now());
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    setPreferencesLoaded(false);
    setSnoozedUntil(null);
    setPermissionGranted(false);
    setLoadError(null);
    setActionError(null);
    setShowSettingsAction(false);
    setRegistrationFailed(false);
    setDismissedForSession(false);
  }, [userId]);

  useEffect(() => {
    loadPromptState();
    return () => {
      promptLoadId.current += 1;
    };
  }, [loadPromptState]);

  useEffect(() => {
    if (!snoozedUntil) return undefined;
    const remaining = Date.parse(snoozedUntil) - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return undefined;
    }
    const timeout = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(timeout);
  }, [snoozedUntil]);

  const onAccountRoute = accountReady && !onSetupRoute;
  const snoozeExpired =
    !snoozedUntil || Date.parse(snoozedUntil) <= now;
  const shouldShowPrompt =
    onAccountRoute &&
    appActive &&
    (showSettingsAction ||
      registrationFailed ||
      (preferencesLoaded &&
        !loadError &&
        !permissionGranted &&
        snoozeExpired &&
        !dismissedForSession));

  const saveSnooze = async ({ keepSettingsAction = false } = {}) => {
    setActionBusy(true);
    setActionError(null);
    try {
      const deadline = await snoozePermissionPrompt();
      setSnoozedUntil(deadline);
      setNow(Date.now());
      setPreferencesLoaded(true);
      setLoadError(null);
      setDismissedForSession(false);
      setShowSettingsAction(keepSettingsAction);
      return true;
    } catch (error) {
      console.error(
        "[PushPrompt] Could not save notification reminder snooze:",
        error.response?.data?.message || error.message,
      );
      setActionError(
        "Your reminder choice was not saved. Check your connection and try again.",
      );
      if (keepSettingsAction) setShowSettingsAction(true);
      return false;
    } finally {
      setActionBusy(false);
    }
  };

  const handleNotNow = () => {
    if (registrationFailed) {
      setRegistrationFailed(false);
      setDismissedForSession(true);
      return;
    }
    return saveSnooze();
  };

  const handleAllow = async () => {
    if (!requestPushPermission || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const result = await requestPushPermission();
      if (result.status === "registered") {
        setPermissionGranted(true);
        setShowSettingsAction(false);
        setRegistrationFailed(false);
        setActionError(null);
        return;
      }
      if (result.status === "denied") {
        setRegistrationFailed(false);
        const saved = await saveSnooze({
          keepSettingsAction: !result.canAskAgain,
        });
        if (saved && !result.canAskAgain) {
          setActionError(
            "Your device will not show the permission request again. You can enable notifications in device settings.",
          );
        }
        return;
      }
      if (result.status === "settings_required") {
        setRegistrationFailed(false);
        const saved = await saveSnooze({ keepSettingsAction: true });
        if (saved) {
          setActionError(
            "Your device will not show the permission request again. You can enable notifications in device settings.",
          );
        }
        return;
      }
      if (result.status === "registration_failed") {
        setPermissionGranted(true);
        setRegistrationFailed(true);
        setActionError(
          "Permission is on, but this device could not register for push alerts. You can retry now.",
        );
        return;
      }
      setRegistrationFailed(false);
      setActionError(
        "Push notifications are not available on this device build.",
      );
    } catch (error) {
      console.error(
        "[PushPrompt] Could not request notification permission:",
        error.message,
      );
      setActionError(
        "We could not update notification permission. Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenSettings = async () => {
    setActionError(null);
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error(
        "[PushPrompt] Could not open device settings:",
        error.message,
      );
      setActionError("Device settings could not be opened. Please open them manually.");
    }
  };

  const handleRetry = async () => {
    if (permissionGranted) {
      await handleAllow();
      return;
    }
    await loadPromptState();
  };

  if (!shouldShowPrompt) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleNotNow}
    >
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          style={styles.card}
        >
          <Text style={styles.title}>
            {registrationFailed
              ? "Finish setting up notifications"
              : showSettingsAction
                ? "Enable notifications in settings"
                : "Stay up to date"}
          </Text>
          <Text style={styles.description}>
            {registrationFailed
              ? "Notification permission is on, but this device still needs to register before Nile Flow can send push alerts."
              : showSettingsAction
                ? "Your device needs permission in system settings before Nile Flow can send push alerts."
                : "Allow notifications for order updates, rewards, and important service news. You can change notification choices any time in Settings."}
          </Text>
          {actionError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {actionError}
            </Text>
          ) : null}
          {actionBusy ? (
            <ActivityIndicator color="#16A34A" style={styles.spinner} />
          ) : null}
          {showSettingsAction ? (
            <PromptButton
              title="Open device settings"
              onPress={handleOpenSettings}
              disabled={actionBusy}
            />
          ) : registrationFailed ? (
            <PromptButton
              title="Retry registration"
              onPress={handleRetry}
              disabled={actionBusy}
            />
          ) : (
            <PromptButton
              title="Allow notifications"
              onPress={handleAllow}
              disabled={actionBusy}
            />
          )}
          <Pressable
            accessibilityRole="button"
            disabled={actionBusy}
            onPress={handleNotNow}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PromptButton({ title, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.disabledButton]}
    >
      <Text style={styles.primaryLabel}>{title}</Text>
    </Pressable>
  );
}

const styles = {
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    gap: 16,
    padding: 24,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#111827",
    fontSize: 21,
    fontFamily: "Poppins-SemiBold",
  },
  description: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  error: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Poppins-Medium",
  },
  spinner: {
    alignSelf: "center",
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: "#16A34A",
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    color: "#6B7280",
    fontSize: 15,
    fontFamily: "Poppins-Medium",
  },
};
