import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { useGlobalContext } from "./GlobalProvider";
import { usePushNotifications } from "../hooks/usePushNotifications";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const { isLogged, isGuest, loading, user } = useGlobalContext();
  const router = useRouter();
  const userId =
    isLogged && !isGuest && !loading
      ? user?.id || user?.userId || user?.$id
      : null;

  const handleNotificationReceived = useCallback(() => {
    if (userId) setNotificationCount((previousCount) => previousCount + 1);
  }, [userId]);

  const handleNotificationResponse = useCallback(() => {
    try {
      router.push("/(Screens)/MyNotificationsScreen");
    } catch (error) {
      console.warn(
        "[NotificationContext] Could not open notifications:",
        error.message,
      );
    }
  }, [router]);

  usePushNotifications(
    userId,
    handleNotificationReceived,
    handleNotificationResponse,
  );

  useEffect(() => {
    setNotificationCount(0);
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{ notificationCount, setNotificationCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
