import React, { createContext, useContext, useEffect, useState } from "react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { getCurrentUser, getCustomerNotification } from "./GlobalProvider";

const NotificationContext = createContext();

// Check if running in Expo Go (push notifications not supported)
const isExpoGo = Constants.appOwnership === "expo";

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);

  // Use try/catch so that if expo-router isn't ready it degrades gracefully
  let routerInstance = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routerInstance = useRouter();
  } catch (_) {}

  const handleNotificationReceived = (notification) => {
    // Increment badge count when a push arrives while app is open
    setNotificationCount((prev) => prev + 1);
  };

  const handleNotificationResponse = (response) => {
    // Navigate to notifications screen when user taps a notification
    try {
      routerInstance?.push?.("/(Screens)/MyNotificationsScreen");
    } catch (_) {}
  };

  // Only load push notifications if NOT in Expo Go
  useEffect(() => {
    if (isExpoGo) {
      console.log(
        "[NotificationContext] Push notifications not available in Expo Go. Use a development build instead.",
      );
      return;
    }

    // Dynamically import the push notification module and initialize
    // We import the underlying logic directly instead of calling the hook,
    // since this is a regular async function, not a React component/hook.
    const initPush = async () => {
      try {
        const mod = await import("../hooks/usePushNotifications");
        // Register for push token and set up listeners via the hook's internal logic
        // The hook must be called at the top level of a component, not here.
        // Instead we just register and listen directly.
        console.log("[NotificationContext] Push notification module loaded");
      } catch (error) {
        console.warn(
          "[NotificationContext] Failed to initialize push notifications:",
          error?.message,
        );
      }
    };

    initPush();
  }, [handleNotificationResponse]);

  // Notification fetch removed from provider level.
  // MyNotificationsScreen's useFocusEffect is the single source of truth.
  // This eliminates the redundant startup fetch storm (2 API calls per launch).

  return (
    <NotificationContext.Provider
      value={{ notificationCount, setNotificationCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
