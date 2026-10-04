import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import axiosClient from "@/api";

const NOTIFICATION_SOUND_MUTED_KEY = "notificationSoundMuted";
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
            (await AsyncStorage.getItem(NOTIFICATION_SOUND_MUTED_KEY)) ===
            "true";
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

const registerPushTokenWithBackend = async (pushToken) => {
  await axiosClient.post("/api/customernotifications/register-token", {
    pushToken,
  });
};

const configureNotificationChannels = async (isMuted) => {
  if (Platform.OS !== "android" || !Notifications) return;

  const sound = isMuted ? null : "default";
  await Promise.all([
    Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound,
    }),
    Notifications.setNotificationChannelAsync("orders", {
      name: "Order Updates",
      importance: Notifications.AndroidImportance.HIGH,
      sound,
    }),
    Notifications.setNotificationChannelAsync("promotions", {
      name: "Promotions",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound,
    }),
  ]);
};

export const applyMuteSetting = async (isMuted) => {
  await AsyncStorage.setItem(
    NOTIFICATION_SOUND_MUTED_KEY,
    isMuted ? "true" : "false",
  );
  await configureNotificationChannels(isMuted);
};

export const usePushNotifications = (
  userId,
  onNotificationReceived,
  onNotificationResponse,
) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const lastResponseId = useRef(null);

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
    let isRegistering = false;

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
      if (!userId || !Device?.isDevice || isRegistering) return;

      isRegistering = true;
      try {
        const isMuted =
          (await AsyncStorage.getItem(NOTIFICATION_SOUND_MUTED_KEY)) ===
          "true";
        await configureNotificationChannels(isMuted);

        const permission = await Notifications.getPermissionsAsync();
        let finalStatus = permission.status;

        if (finalStatus !== "granted") {
          const requestedPermission =
            await Notifications.requestPermissionsAsync();
          finalStatus = requestedPermission.status;
        }

        if (!isMounted || finalStatus !== "granted") return;

        const projectId = getProjectId();
        if (!projectId) {
          throw new Error("The Expo EAS project ID is not configured.");
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        const token = tokenResponse.data;
        if (!isMounted || !token || token === registeredToken) return;

        await registerPushTokenWithBackend(token);
        if (!isMounted) return;

        registeredToken = token;
        setExpoPushToken(token);
      } catch (error) {
        console.warn(
          "[Push] Device registration failed. It will retry when the app becomes active:",
          error.response?.data?.message || error.message,
        );
      } finally {
        isRegistering = false;
      }
    };

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
      receivedSubscription.remove();
      responseSubscription.remove();
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [userId, onNotificationReceived, onNotificationResponse]);

  return { expoPushToken };
};
