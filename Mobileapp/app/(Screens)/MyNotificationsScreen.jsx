import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
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
import { min } from "moment";

export default function MyNotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const { setNotificationCount } = useNotification();
  const { user } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, important, promotions
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [muteSound, setMuteSound] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      const markAllAsRead = async () => {
        if (!user) return;

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
    }, [user, setNotificationCount]),
  );

  // Refresh notifications list every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getCustomerNotification()
        .then((data) => setNotifications(data))
        .catch(() => {});
    }, [user]),
  );

  useEffect(() => {
    const initNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const notificationsData = await getCustomerNotification();
        setNotifications(notificationsData);
        setNotificationCount(notificationsData.length);
      } catch (error) {
        console.error("❌ Failed to fetch notifications:", error.message);
        setHasError(true);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    initNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setNotificationCount, retryKey]);

  const handleRetry = () => {
    setHasError(false);
    setLoading(true);
    setRetryKey((k) => k + 1);
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

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return ["#dc2626", "#991b1b"];
    if (type === "order" || type === "userNotification")
      return ["#d97706", "#92400e"];
    if (type === "promotion") return ["#ca8a04", "#a16207"];
    if (type === "message") return ["#2563eb", "#1d4ed8"];
    return ["#059669", "#047857"];
  };

  if (!loading && hasError) {
    return <NetworkErrorFallback onRetry={handleRetry} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <ScrollView
        style={styles.scrollView}
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
                size={16}
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
                size={16}
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
              <MaterialIcons name="settings" size={20} color="#16A34A" />
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
            >
              <MaterialIcons name="done-all" size={20} color="#ffffff" />
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
                        size={20}
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

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#16A34A" />
              <MaterialIcons
                name="notifications"
                size={40}
                color="#16A34A"
                style={styles.loadingIcon}
              />
            </View>
            <Text style={styles.loadingTitle}>Loading Notifications</Text>
            <Text style={styles.loadingDescription}>
              Fetching your premium alerts...
            </Text>
          </View>
        ) : (
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
                          size={24}
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
                              size={12}
                              color="#9ca3af"
                            />
                            <Text style={styles.timestampText}>
                              {new Date(
                                notification.timestamp ||
                                  notification.$createdAt,
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
                                size={16}
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
                              size={16}
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
                      size={48}
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
        )}
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
    marginBottom: 50,
  },
  scrollView: {
    flex: 1,
  },
  controlsBar: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
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
    marginRight: 8,
  },
  filterButtonText: {
    color: "#374151",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  activeFilterButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  settingsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  settingsButtonText: {
    color: "#16A34A",
    fontFamily: "Poppins-SemiBold",
    marginLeft: 8,
  },
  markAllButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#16A34A",
    borderRadius: 12,
  },
  markAllButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
    marginLeft: 8,
  },
  settingsPanel: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  settingsGrid: {
    gap: 16,
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  soundToggle: {
    width: 48,
    height: 48,
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
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 12,
  },
  clearButtonText: {
    color: "#DC2626",
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 128,
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
    fontSize: 24,
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
    paddingHorizontal: 16,
  },
  notificationsList: {
    gap: 16,
  },
  notificationCard: {
    borderRadius: 16,
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
    padding: 16,
    gap: 16,
    position: "relative",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
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
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  messageDescription: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  newBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  newBadgeText: {
    color: "#16A34A",
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  notificationActions: {
    flexDirection: "row",
    gap: 10,
  },
  markReadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#16A34A",
    borderRadius: 8,
  },
  markReadButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 13,
    marginLeft: 6,
    fontFamily: "Poppins-Regular",
  },
  statusIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  readStatusIndicator: {
    backgroundColor: "#D1D5DB",
  },
  unreadStatusIndicator: {
    backgroundColor: "#16A34A",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 12,
  },
  emptyDescription: {
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#16A34A",
    borderRadius: 12,
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
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  modalBody: {
    gap: 20,
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
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 4,
  },
  modalSettingDescription: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Poppins-Regular",
  },
  modalToggle: {
    width: 48,
    height: 48,
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
