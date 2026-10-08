import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import axiosClient from "@/api";
import {
  NOTIFICATION_SOUND_FILES,
  NOTIFICATION_SOUND_GROUPS,
} from "../constants/notificationSounds";
import {
  MUTE_SOUND_KEY,
  syncAccountNotificationPreferences,
} from "../services/notificationPreferences";

export { MUTE_SOUND_KEY };
const isExpoGo = Constants.appOwnership === "expo";
const isSupportedPlatform = Platform.OS !== "web" && !isExpoGo;

let Notifications = null;
let Device = null;

if (isSupportedPlatform) {
  try {
    Notifications = require("expo-notifications");
    Device = require("expo-device");
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        let isMuted = false;
        try {
          isMuted =
            (await AsyncStorage.getItem(MUTE_SOUND_KEY)) === "true";
        } catch (error) {
          console.warn(
            "[Push] Could not read notification sound preference:",
            error.message,
          );
        }

        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: !isMuted,
          shouldSetBadge: true,
        };
      },
    });
  } catch (error) {
    console.error("[Push] Could not load notification modules:", error.message);
  }
}

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId;
const PUSH_VIBRATION_PATTERN = [0, 250, 150, 250];

export const isPushNotificationPromptSupported = () =>
  isSupportedPlatform && Boolean(Notifications) && Device?.isDevice === true;

export const getPushPermissionState = async () => {
  if (!isPushNotificationPromptSupported()) {
    return { supported: false, granted: false, canAskAgain: false };
  }

  const permission = await Notifications.getPermissionsAsync();
  return {
    supported: true,
    granted: permission.status === "granted",
    canAskAgain: permission.canAskAgain === true,
  };
};

const registerPushTokenWithBackend = async (pushToken) => {
  await axiosClient.post("/api/customernotifications/register-token", {
    pushToken,
  });
};

const unregisterPushTokenWithBackend = async () => {
  await axiosClient.delete("/api/customernotifications/register-token");
};

const configureNotificationChannels = async () => {
  if (Platform.OS !== "android" || !Notifications) return;

  const definitions = [
    {
      id: "nf-customer-default-v2",
      name: "General, vibrates",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: PUSH_VIBRATION_PATTERN,
    },
    {
      id: "orders",
      name: "Order Updates",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: PUSH_VIBRATION_PATTERN,
    },
    {
      id: "promotions",
      name: "Promotions",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: PUSH_VIBRATION_PATTERN,
    },
    {
      id: "nf-customer-silent-v2",
      name: "Other alerts, silent, vibrates",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: true,
      vibrationPattern: PUSH_VIBRATION_PATTERN,
    },
  ];
  for (const [category, options] of Object.entries(
    NOTIFICATION_SOUND_GROUPS,
  )) {
    for (const option of options) {
      const locked = category === "order" && option.id === "coreflow_1";
      definitions.push({
        id: `nf-${category}-${option.id}-v2`,
        name: `${category} ${option.label}, vibrates`,
        importance:
          category === "order"
            ? Notifications.AndroidImportance.HIGH
            : Notifications.AndroidImportance.DEFAULT,
        sound:
          option.id === "silent"
            ? null
            : NOTIFICATION_SOUND_FILES[option.id],
        enableVibrate: true,
        vibrationPattern: PUSH_VIBRATION_PATTERN,
      });
      if (locked) {
        for (const lockedCategory of ["security", "welcome"]) {
          definitions.push({
            id: `nf-${lockedCategory}-coreflow_1-v2`,
            name: `${lockedCategory} CoreFlow, vibrates`,
            importance: Notifications.AndroidImportance.HIGH,
            sound: NOTIFICATION_SOUND_FILES.coreflow_1,
            enableVibrate: true,
            vibrationPattern: PUSH_VIBRATION_PATTERN,
          });
          definitions.push({
            id: `nf-${lockedCategory}-silent-v2`,
            name: `${lockedCategory}, silent, vibrates`,
            importance: Notifications.AndroidImportance.HIGH,
            sound: null,
            enableVibrate: true,
            vibrationPattern: PUSH_VIBRATION_PATTERN,
          });
        }
      }
    }
  }

  await Promise.all(
    definitions.map(async ({ id, ...definition }) => {
      const existingChannel =
        await Notifications.getNotificationChannelAsync(id);
      if (!existingChannel) {
        await Notifications.setNotificationChannelAsync(id, definition);
      }
    }),
  );
};

export const applyMuteSetting = async (isMuted) => {
  await AsyncStorage.setItem(MUTE_SOUND_KEY, isMuted ? "true" : "false");
};

export const usePushNotifications = (
  userId,
  onNotificationReceived,
  onNotificationResponse,
) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const lastResponseId = useRef(null);
  const registerDeviceRef = useRef(null);

  const requestPushPermission = async () => {
    if (!userId || !isPushNotificationPromptSupported()) {
      return { status: "unsupported" };
    }

    try {
      const permission = await Notifications.getPermissionsAsync();
      let finalPermission = permission;
      if (permission.status !== "granted") {
        if (!permission.canAskAgain) return { status: "settings_required" };
        finalPermission = await Notifications.requestPermissionsAsync();
      }
      if (finalPermission.status !== "granted") {
        return {
          status: "denied",
          canAskAgain: finalPermission.canAskAgain === true,
        };
      }

      const registration = await registerDeviceRef.current?.();
      if (registration?.status !== "registered") {
        return { status: "registration_failed" };
      }
      return { status: "registered" };
    } catch (error) {
      console.warn(
        "[Push] Could not request notification permission:",
        error.message,
      );
      return { status: "registration_failed" };
    }
  };

  useEffect(() => {
    setExpoPushToken(null);

    if (!Notifications) {
      if (isExpoGo) {
        console.info(
          "[Push] Remote notifications need an EAS development or production build.",
        );
      }
      return undefined;
    }

    let isMounted = true;
    let registeredToken = null;
    let registrationPromise = null;
    let permissionWasGranted = null;

    const handleResponse = (response) => {
      const responseId = response?.notification?.request?.identifier;
      if (!response || !responseId || lastResponseId.current === responseId) {
        return;
      }

      lastResponseId.current = responseId;
      onNotificationResponse?.(response);
      Notifications.clearLastNotificationResponseAsync().catch((error) => {
        console.warn(
          "[Push] Could not clear handled notification response:",
          error.message,
        );
      });
    };

    const registerDevice = async () => {
      if (!userId || !Device?.isDevice) return { status: "unsupported" };
      if (registrationPromise) return registrationPromise;

      registrationPromise = (async () => {
        let registrationStage = "sync_preferences";
        try {
          try {
            await syncAccountNotificationPreferences(userId);
          } catch (error) {
            console.warn(
              "[Push] Could not sync notification preferences:",
              error.response?.data?.message || error.message,
            );
          }
          registrationStage = "configure_channels";
          await configureNotificationChannels();

          registrationStage = "check_permission";
          const permission = await Notifications.getPermissionsAsync();
          if (!isMounted) return { status: "unavailable" };
          if (permission.status !== "granted") {
            if (permissionWasGranted !== false) {
              await unregisterPushTokenWithBackend();
            }
            permissionWasGranted = false;
            registeredToken = null;
            setExpoPushToken(null);
            return {
              status: "permission_required",
              canAskAgain: permission.canAskAgain === true,
            };
          }
          permissionWasGranted = true;

          registrationStage = "resolve_project_id";
          const projectId = getProjectId();
          if (!projectId) {
            throw new Error("The Expo EAS project ID is not configured.");
          }

          registrationStage = "get_expo_push_token";
          const tokenResponse = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          const token = tokenResponse.data;
          if (!token) {
            console.warn("[Push] Expo did not return a device push token.", {
              stage: registrationStage,
            });
            return { status: "token_unavailable" };
          }
          if (!isMounted) return { status: "unavailable" };
          if (token === registeredToken) return { status: "registered" };

          registrationStage = "register_with_backend";
          await registerPushTokenWithBackend(token);
          if (!isMounted) return { status: "unavailable" };

          registeredToken = token;
          setExpoPushToken(token);
          return { status: "registered" };
        } catch (error) {
          console.warn("[Push] Device registration failed.", {
            stage: registrationStage,
            status: error.response?.status || null,
            correlationId:
              error.response?.headers?.["x-correlation-id"] || null,
            error:
              error.response?.data?.error ||
              error.response?.data?.message ||
              error.message,
          });
          return { status: "registration_failed" };
        }
      })();

      try {
        return await registrationPromise;
      } finally {
        registrationPromise = null;
      }
    };

    registerDeviceRef.current = registerDevice;
    const receivedSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        onNotificationReceived?.(notification);
      });
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      if (userId) registerDevice();
    });
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") registerDevice();
      },
    );

    Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch((error) => {
        console.warn(
          "[Push] Could not read the launch notification:",
          error.message,
        );
      });

    registerDevice();

    return () => {
      isMounted = false;
      if (registerDeviceRef.current === registerDevice) {
        registerDeviceRef.current = null;
      }
      receivedSubscription.remove();
      responseSubscription.remove();
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [userId, onNotificationReceived, onNotificationResponse]);

  return { expoPushToken, requestPushPermission };
};
