import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { getCustomerNotification, useGlobalContext } from "./GlobalProvider";
import { usePushNotifications } from "../hooks/usePushNotifications";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationLoadId = useRef(0);
  const { isLogged, isGuest, loading, user } = useGlobalContext();
  const router = useRouter();
  const userId =
    isLogged && !isGuest && !loading
      ? user?.id || user?.userId || user?.$id
      : null;

  const handleNotificationReceived = useCallback(() => {
    if (userId) setNotificationCount((previousCount) => previousCount + 1);
  }, [userId]);

  const handleNotificationResponse = useCallback((response) => {
    try {
      const route = response?.notification?.request?.content?.data?.route;
      const allowedRoutes = new Set([
        "/(tabs)/BottomTabs",
        "/(Screens)/MyNotificationsScreen",
        "/(Screens)/OrdersScreen",
        "/(Screens)/Deals",
        "/(Screens)/Settings",
        "/(Screens)/Profile",
      ]);
      router.push(
        typeof route === "string" && allowedRoutes.has(route)
          ? route
          : "/(Screens)/MyNotificationsScreen",
      );
    } catch (error) {
      console.warn(
        "[NotificationContext] Could not open notifications:",
        error.message,
      );
    }
  }, [router]);

  const { requestPushPermission } = usePushNotifications(
    userId,
    handleNotificationReceived,
    handleNotificationResponse,
  );

  useEffect(() => {
    setNotificationCount(0);
    const loadId = ++notificationLoadId.current;
    let active = true;

    if (!userId) {
      return () => {
        active = false;
      };
    }

    const loadUnreadNotificationCount = async () => {
      try {
        const notifications = await getCustomerNotification();
        if (!active || notificationLoadId.current !== loadId) return;

        setNotificationCount(
          notifications.filter((notification) => !notification.read).length,
        );
      } catch (error) {
        if (!active || notificationLoadId.current !== loadId) return;
        console.error(
          "Failed to load unread notification count:",
          error.response?.data || error.message,
        );
      }
    };

    loadUnreadNotificationCount();

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        notificationCount,
        setNotificationCount,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
