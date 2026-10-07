import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import {
  getCustomerNotification,
  useGlobalContext,
} from "../../Context/GlobalProvider";
import { useNotification } from "../../Context/NotificationContext";
import NetworkErrorFallback from "../components/NetworkErrorFallback";
import {
  applyMuteSetting,
  MUTE_SOUND_KEY,
} from "../../hooks/usePushNotifications";

const NotificationsSkeleton = () => (
  <SafeAreaView
    edges={["top"]}
    style={{ flex: 1, backgroundColor: "#FFFFFF" }}
  >
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Controls bar skeleton */}
      <View
        style={{
          marginHorizontal: 12,
          marginVertical: 12,
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          backgroundColor: "#F9FAFB",
        }}
      >
        {/* Filter buttons row */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {[90, 80, 100].map((w, i) => (
            <View
              key={i}
              style={{
                width: w,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#E5E7EB",
              }}
            />
          ))}
        </View>
        {/* Action buttons row */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 38,
              borderRadius: 9,
              backgroundColor: "#E5E7EB",
            }}
          />
          <View
            style={{
              flex: 1,
              height: 38,
              borderRadius: 9,
              backgroundColor: "#E5E7EB",
            }}
          />
        </View>
      </View>

      {/* Notification card skeletons — 3 items */}
      <View style={{ paddingHorizontal: 12, gap: 10 }}>
        {[0, 1, 2].map((idx) => (
          <View
            key={idx}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              backgroundColor: "#FFFFFF",
              padding: 10,
              flexDirection: "row",
              gap: 10,
            }}
          >
            {/* Icon placeholder */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: "#E5E7EB",
              }}
            />
            {/* Content */}
            <View style={{ flex: 1 }}>
              {/* First line: title + timestamp */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    width: "55%",
                    height: 13,
                    borderRadius: 4,
                    backgroundColor: "#E5E7EB",
                  }}
                />
                <View
                  style={{
                    width: 72,
                    height: 10,
                    borderRadius: 4,
                    backgroundColor: "#E5E7EB",
                  }}
                />
              </View>
              {/* Description line */}
              <View
                style={{
                  width: "75%",
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: "#E5E7EB",
                  marginBottom: 8,
                }}
              />
              {/* Action buttons row */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    width: 100,
                    height: 24,
                    borderRadius: 7,
                    backgroundColor: "#E5E7EB",
                  }}
                />
                <View
                  style={{
                    width: 70,
                    height: 24,
                    borderRadius: 7,
                    backgroundColor: "#E5E7EB",
                  }}
                />
              </View>
            </View>
            {/* Status dot */}
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#E5E7EB",
                position: "absolute",
                top: 12,
                right: 12,
              }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

export default function MyNotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const { setNotificationCount, requestPushPermission } = useNotification();
  const { user } = useGlobalContext();
  const userId = user?.id || user?.userId || user?.$id;
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, important, promotions
  const [hasError, setHasError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [muteSound, setMuteSound] = useState(false);
  const [marketingPushEnabled, setMarketingPushEnabled] = useState(false);
  const [marketingPreferenceLoading, setMarketingPreferenceLoading] = useState(false);
  const [marketingPreferenceSaving, setMarketingPreferenceSaving] = useState(false);
  const notificationRequestId = useRef(0);

  // Load persisted mute preference on mount
  useEffect(() => {
    AsyncStorage.getItem(MUTE_SOUND_KEY).then((val) => {
      if (val === "true") setMuteSound(true);
    });
  }, []);

  const handleToggleMute = async (newValue) => {
    setMuteSound(newValue);
    await applyMuteSetting(newValue);
  };

  useEffect(() => {
    let active = true;
    if (!userId) {
      setMarketingPushEnabled(false);
      return undefined;
    }
    setMarketingPreferenceLoading(true);
    axiosClient
      .get("/api/v1/customer/notification-preferences")
      .then(({ data }) => {
        if (active) setMarketingPushEnabled(data.marketingPushEnabled === true);
      })
      .catch((error) => {
        if (active) {
          Alert.alert(
            "Settings unavailable",
            error.response?.data?.message ||
              "Your promotion preference could not be loaded. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setMarketingPreferenceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const handleMarketingPushChange = async () => {
    if (!userId || marketingPreferenceLoading || marketingPreferenceSaving) return;
    const nextValue = !marketingPushEnabled;
    setMarketingPreferenceSaving(true);
    try {
      const permissionGranted = nextValue
        ? await requestPushPermission()
        : true;
      const { data } = await axiosClient.patch(
        "/api/v1/customer/notification-preferences",
        { marketingPushEnabled: nextValue },
      );
      setMarketingPushEnabled(data.marketingPushEnabled === true);
      if (nextValue && !permissionGranted) {
        Alert.alert(
          "Notifications are not enabled",
          "Your promotion choice is saved. Allow notifications in your device settings and register a device token to receive promotions.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Could not save setting",
        error.response?.data?.message ||
          "Your promotion preference was not changed. Please retry.",
      );
    } finally {
      setMarketingPreferenceSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const markAllAsRead = async () => {
        if (!userId) return;

        try {
          await axiosClient.post("/api/customernotifications/mark-read");
          setNotificationCount(0);
        } catch (error) {
          console.error(
            "❌ Error marking notifications as read:",
            error.message,
          );
        }
      };
      markAllAsRead();
    }, [userId, setNotificationCount]),
  );

  // Refresh notifications list every time the screen comes into focus
  // This is the SINGLE source of truth for notification fetching.
  // The mount useEffect below has been removed to prevent double-fetch storms.
  const loadNotifications = useCallback(async () => {
    const requestId = ++notificationRequestId.current;
    setNotifications([]);
    setNotificationCount(0);
    setHasError(false);

    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getCustomerNotification();
      if (notificationRequestId.current !== requestId) return;

      const ownedNotifications = data.filter(
        (notification) => notification.userId === userId,
      );
      setNotifications(ownedNotifications);
      setNotificationCount(ownedNotifications.length);
    } catch {
      if (notificationRequestId.current !== requestId) return;
      setHasError(true);
      setNotifications([]);
    } finally {
      if (notificationRequestId.current === requestId) setLoading(false);
    }
  }, [userId, setNotificationCount]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      return () => {
        notificationRequestId.current += 1;
      };
    }, [loadNotifications]),
  );

  const handleRetry = () => {
    loadNotifications();
  };

  // Helper functions
  const handleMarkAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((note) =>
        note.$id === notificationId ? { ...note, read: true } : note,
      ),
    );

    try {
      await axiosClient.post(
        `/api/customernotifications/${notificationId}/read`,
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));

    try {
      await axiosClient.post("/api/customernotifications/mark-all-read");
      setNotificationCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setNotifications((prev) =>
              prev.filter((note) => note.$id !== notificationId),
            );
            try {
              await axiosClient.delete(
                `/api/customernotifications/${notificationId}`,
              );
            } catch (error) {
              console.error("Failed to delete notification:", error);
            }
          },
        },
      ],
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setNotifications([]);
            try {
              await axiosClient.post("/api/customernotifications/clear-all");
              setNotificationCount(0);
            } catch (error) {
              console.error("Failed to clear all:", error);
            }
          },
        },
      ],
    );
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    if (filter === "important") return notification.priority === "high";
    if (filter === "promotions") return notification.type === "promotion";
    return true;
  });

  const getNotificationIcon = (type, priority) => {
    if (priority === "high") return "priority-high";
    if (type === "order" || type === "userNotification")
      return "local-shipping";
    if (type === "promotion") return "local-offer";
    if (type === "message") return "message";
    return "notifications";
  };

  // ── Show skeleton while initial data is loading ──
  if (loading) {
    return <NotificationsSkeleton />;
  }

  if (!loading && hasError) {
    return <NetworkErrorFallback onRetry={handleRetry} />;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Controls Bar */}
        <View style={styles.controlsBar}>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              onPress={() => setFilter("all")}
              style={[
                styles.filterButton,
                filter === "all" && styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "all" && styles.activeFilterButtonText,
                ]}
              >
                All Notifications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter("unread")}
              style={[
                styles.filterButton,
                filter === "unread" && styles.activeFilterButtonUnread,
              ]}
            >
              <MaterialIcons
                name="visibility"
                size={14}
                color={filter === "unread" ? "#ffffff" : "#6B7280"}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "unread" && styles.activeFilterButtonText,
                ]}
              >
                Unread
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter("important")}
              style={[
                styles.filterButton,
                filter === "important" && styles.activeFilterButtonImportant,
              ]}
            >
              <MaterialIcons
                name="stars"
                size={14}
                color={filter === "important" ? "#ffffff" : "#6B7280"}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "important" && styles.activeFilterButtonText,
                ]}
              >
                Important
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => setShowSettings(!showSettings)}
              style={styles.settingsButton}
            >
              <MaterialIcons name="settings" size={18} color="#16A34A" />
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
            >
              <MaterialIcons name="done-all" size={18} color="#ffffff" />
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Panel */}
          {showSettings && (
            <View style={styles.settingsPanel}>
              <View style={styles.settingsGrid}>
                <View style={styles.settingCard}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingTitle}>Notification Sound</Text>
                    <TouchableOpacity
                      onPress={() => handleToggleMute(!muteSound)}
                      style={[
                        styles.soundToggle,
                        muteSound
                          ? styles.soundToggleMuted
                          : styles.soundToggleActive,
                      ]}
                    >
                      <MaterialIcons
                        name={muteSound ? "volume-off" : "volume-up"}
                        size={18}
                        color={muteSound ? "#ef4444" : "#10b981"}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.settingDescription}>
                    {muteSound ? "Sounds are muted" : "Sounds are enabled"}
                  </Text>
                </View>

                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>Quick Actions</Text>
                  <TouchableOpacity
                    onPress={handleClearAll}
                    style={styles.clearButton}
                  >
                    <MaterialIcons
                      name="delete-sweep"
                      size={16}
                      color="#fca5a5"
                    />
                    <Text style={styles.clearButtonText}>
                      Clear All Notifications
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.notificationsContainer}>
          {/* Notifications List */}
          <View style={styles.notificationsList}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <View
                  key={notification.$id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadNotificationCard,
                  ]}
                >
                  <View style={styles.notificationContent}>
                    {/* Notification Icon */}
                    <View
                      style={[
                        styles.notificationIcon,
                        notification.read
                          ? styles.readNotificationIcon
                          : styles.unreadNotificationIcon,
                      ]}
                    >
                      <MaterialIcons
                        name={getNotificationIcon(
                          notification.type,
                          notification.priority,
                        )}
                        size={20}
                        color={notification.read ? "#6B7280" : "#ffffff"}
                      />
                    </View>

                    {/* Message Content */}
                    <View style={styles.messageContent}>
                      <View style={styles.messageHeader}>
                        <Text
                          style={[
                            styles.messageText,
                            notification.read
                              ? styles.readMessageText
                              : styles.unreadMessageText,
                          ]}
                        >
                          {notification.message}
                        </Text>
                        <View style={styles.messageTimestamp}>
                          <MaterialIcons
                            name="access-time"
                            size={11}
                            color="#9ca3af"
                          />
                          <Text style={styles.timestampText}>
                            {new Date(
                              notification.timestamp || notification.$createdAt,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.messageDescription}>
                        {notification.description ||
                          "Premium African marketplace update"}
                      </Text>

                      {!notification.read && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={styles.notificationActions}>
                        {!notification.read && (
                          <TouchableOpacity
                            onPress={() => handleMarkAsRead(notification.$id)}
                            style={styles.markReadButton}
                          >
                            <MaterialIcons
                              name="done"
                              size={14}
                              color="#ffffff"
                            />
                            <Text style={styles.markReadButtonText}>
                              Mark as Read
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteNotification(notification.$id)
                          }
                          style={styles.deleteButton}
                        >
                          <MaterialIcons
                            name="delete"
                            size={14}
                            color="#fca5a5"
                          />
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Status Indicator */}
                    <View
                      style={[
                        styles.statusIndicator,
                        notification.read
                          ? styles.readStatusIndicator
                          : styles.unreadStatusIndicator,
                      ]}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialIcons
                    name="notifications"
                    size={32}
                    color="#16A34A"
                  />
                </View>
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyDescription}>
                  {filter === "all"
                    ? "You're all caught up! Check back later for updates on your orders and exclusive African product deals."
                    : `No ${filter} notifications at the moment.`}
                </Text>
                {filter !== "all" && (
                  <TouchableOpacity
                    onPress={() => setFilter("all")}
                    style={styles.viewAllButton}
                  >
                    <Text style={styles.viewAllButtonText}>
                      View All Notifications
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalSettingItem}>
                <View style={styles.modalSettingInfo}>
                  <Text style={styles.modalSettingTitle}>
                    Sound Notifications
                  </Text>
                  <Text style={styles.modalSettingDescription}>
                    Play sound when new notifications arrive
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleMute(!muteSound)}
                  style={[
                    styles.modalToggle,
                    muteSound ? styles.modalToggleOff : styles.modalToggleOn,
                  ]}
                >
                  <MaterialIcons
                    name={muteSound ? "volume-off" : "volume-up"}
                    size={20}
                    color={muteSound ? "#ef4444" : "#10b981"}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.modalSettingItem}>
                <View style={styles.modalSettingInfo}>
                  <Text style={styles.modalSettingTitle}>
                    Promotional Push Notifications
                  </Text>
                  <Text style={styles.modalSettingDescription}>
                    Receive promotions and exclusive deals. You can change this
                    choice at any time. Notifications also need device
                    permission and a registered token.
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="switch"
                  accessibilityState={{
                    checked: marketingPushEnabled,
                    disabled:
                      marketingPreferenceLoading || marketingPreferenceSaving,
                  }}
                  disabled={
                    marketingPreferenceLoading || marketingPreferenceSaving
                  }
                  onPress={handleMarketingPushChange}
                  style={[
                    styles.modalToggle,
                    marketingPushEnabled
                      ? styles.modalToggleOn
                      : styles.modalToggleOff,
                  ]}
                >
                  <MaterialIcons
                    name={
                      marketingPushEnabled
                        ? "notifications-active"
                        : "notifications-off"
                    }
                    size={20}
                    color={marketingPushEnabled ? "#10b981" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  controlsBar: {
    marginHorizontal: 12,
    marginVertical: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 12,
  },
  filterButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
  activeFilterButtonUnread: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  activeFilterButtonImportant: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    color: "#374151",
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  activeFilterButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  settingsButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  settingsButtonText: {
    color: "#16A34A",
    fontFamily: "Poppins-SemiBold",
    marginLeft: 6,
    fontSize: 12,
  },
  markAllButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#16A34A",
    borderRadius: 9,
  },
  markAllButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
    marginLeft: 6,
    fontSize: 12,
  },
  settingsPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  settingsGrid: {
    gap: 10,
  },
  settingCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  settingTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  soundToggle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  soundToggleMuted: {
    backgroundColor: "#FEF2F2",
  },
  soundToggleActive: {
    backgroundColor: "#F0FDF4",
  },
  settingDescription: {
    color: "#374151",
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
  },
  clearButtonText: {
    color: "#DC2626",
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  loadingSpinner: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingIcon: {
    position: "absolute",
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginTop: 32,
  },
  loadingDescription: {
    color: "#6B7280",
    marginTop: 8,
    fontFamily: "Poppins-Regular",
  },
  notificationsContainer: {
    paddingHorizontal: 12,
  },
  notificationsList: {
    gap: 10,
  },
  notificationCard: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  unreadNotificationCard: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  notificationContent: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    position: "relative",
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  readNotificationIcon: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unreadNotificationIcon: {
    backgroundColor: "#16A34A",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    flex: 1,
    marginRight: 8,
  },
  readMessageText: {
    color: "#6B7280",
  },
  unreadMessageText: {
    color: "#111827",
  },
  messageTimestamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timestampText: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "Poppins-Regular",
  },
  messageDescription: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 17,
    fontFamily: "Poppins-Regular",
  },
  newBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  newBadgeText: {
    color: "#16A34A",
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  notificationActions: {
    flexDirection: "row",
    gap: 8,
  },
  markReadButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 38,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "#16A34A",
    borderRadius: 8,
  },
  markReadButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 38,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 11,
    marginLeft: 6,
    fontFamily: "Poppins-Regular",
  },
  statusIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readStatusIndicator: {
    backgroundColor: "#D1D5DB",
  },
  unreadStatusIndicator: {
    backgroundColor: "#16A34A",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 8,
  },
  emptyDescription: {
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 16,
    lineHeight: 19,
    fontFamily: "Poppins-Regular",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: "#16A34A",
    borderRadius: 10,
  },
  viewAllButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  modalBody: {
    gap: 14,
  },
  modalSettingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalSettingInfo: {
    flex: 1,
    marginRight: 16,
  },
  modalSettingTitle: {
    color: "#111827",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 3,
  },
  modalSettingDescription: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Poppins-Regular",
  },
  modalToggle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalToggleOff: {
    backgroundColor: "#FEF2F2",
  },
  modalToggleOn: {
    backgroundColor: "#F0FDF4",
  },
};
