import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../api";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getCurrentUser,
  getCustomerOrders,
  useGlobalContext,
} from "../../Context/GlobalProvider";
import { useTheme } from "../../Context/ThemeProvider";

const { width } = Dimensions.get("window");

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { themeStyles } = useTheme();
  const { user } = useGlobalContext();

  // Nile Flow design system theme
  const premiumColors = {
    primary: "#D97706", // nile-gold-600 — gold accent
    secondary: "#B45309", // nile-gold-700 — bronze
    accent: "#16A34A", // nile-green-600 — green action
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    textSecondary: "#6B7280",
  };

  const CURRENCY_SYMBOLS = {
    KES: "KSh",
    UGX: "UGX",
    TZS: "TSh",
    ETB: "ETB",
    NGN: "₦",
    GHS: "GH₵",
    RWF: "RWF",
    SSP: "SSP",
    USD: "$",
    GBP: "£",
    EUR: "€",
  };
  const CURRENCY_DECIMALS = {
    KES: 0,
    UGX: 0,
    TZS: 0,
    RWF: 0,
    SSP: 0,
    ETB: 2,
    NGN: 2,
    GHS: 2,
    USD: 2,
    GBP: 2,
    EUR: 2,
  };

  const fmtOrderAmount = (amount, currency) => {
    const code = (currency || "KES").toUpperCase();
    const symbol = CURRENCY_SYMBOLS[code] || code;
    const decimals = CURRENCY_DECIMALS[code] ?? 2;
    const n = typeof amount === "number" ? amount : parseFloat(amount) || 0;
    return `${symbol} ${n.toLocaleString("en", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return ["#10b981", "#059669"]; // emerald
      case "shipped":
        return ["#3b82f6", "#1d4ed8"]; // blue
      case "processing":
        return ["#f59e0b", "#d97706"]; // amber
      case "pending":
        return ["#eab308", "#ca8a04"]; // yellow
      case "cancelled":
        return ["#ef4444", "#dc2626"]; // red
      default:
        return ["#6b7280", "#4b5563"]; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "check-circle";
      case "shipped":
        return "local-shipping";
      case "processing":
        return "refresh";
      case "pending":
        return "schedule";
      case "cancelled":
        return "cancel";
      default:
        return "package";
    }
  };

  const getStatusProgress = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return 100;
      case "shipped":
        return 75;
      case "processing":
        return 50;
      case "pending":
        return 25;
      default:
        return 0;
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const ordersData = await getCustomerOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("❌ Error fetching orders:", error.message);
      Alert.alert("Error", "Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.id);
      } catch (error) {
        console.error("Error fetching user:", error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Filter orders by status
  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter(
          (order) =>
            order.status?.toLowerCase() === selectedStatus.toLowerCase(),
        );

  // Status counts for filter badges
  const statusCounts = {
    all: orders.length,
    delivered: orders.filter((o) => o.status?.toLowerCase() === "delivered")
      .length,
    shipped: orders.filter((o) => o.status?.toLowerCase() === "shipped").length,
    processing: orders.filter((o) => o.status?.toLowerCase() === "processing")
      .length,
    pending: orders.filter((o) => o.status?.toLowerCase() === "pending").length,
    cancelled: orders.filter((o) => o.status?.toLowerCase() === "cancelled")
      .length,
  };

  const handleTrackOrder = (order) => {
    const estimatedDelivery = moment(order.createdAt)
      .add(2, "days")
      .format("MMMM Do YYYY");

    router.push({
      pathname: "/(Screens)/TrackOrder",
      params: {
        orderId: order.$id,
        orderTime: new Date(order.createdAt).toLocaleString(),
        paymentTime: new Date(order.createdAt).toLocaleString(),
        orderStatus: order.status || "Processing",
        estimatedDelivery: estimatedDelivery,
      },
    });
  };

  const CANCEL_REASONS = [
    "Changed my mind",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Delivery taking too long",
  ];

  const submitCancellation = async (order, reason) => {
    try {
      setLoading(true);
      const response = await axiosClient.post("/api/orders/cancel-request", {
        orderId: order.$id,
        reason,
        customerEmail: user?.email,
        customerName: user?.username || user?.name,
      });
      if (response.data?.success) {
        Alert.alert(
          "Request Submitted",
          response.data.message ||
            "Your cancellation request has been submitted. Our team will review it within 24 hours.",
          [{ text: "OK" }],
        );
        await fetchOrders();
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Failed to submit cancellation request.",
        );
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Failed to submit cancellation request. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const showCancelReasons = (order) => {
    Alert.alert("Select Reason", "Why are you cancelling this order?", [
      ...CANCEL_REASONS.map((reason) => ({
        text: reason,
        onPress: () => submitCancellation(order, reason),
      })),
      { text: "Back", style: "cancel" },
    ]);
  };

  const handleCancelOrder = (order) => {
    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel order #${order.$id?.slice(-8)}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Continue",
          style: "destructive",
          onPress: () => showCancelReasons(order),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[premiumColors.primary]}
              tintColor={premiumColors.primary}
            />
          }
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.premiumBadge,
                { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
              ]}
            >
              <MaterialIcons
                name="inventory"
                size={18}
                color={premiumColors.primary}
              />
              <Text style={styles.badgeText}>Your Orders</Text>
              <MaterialIcons name="auto-awesome" size={16} color="#D97706" />
            </View>

            <Text style={styles.heroTitle}>
              Your <Text style={styles.heroTitleAccent}>Orders</Text>
            </Text>

            <Text style={styles.heroSubtitle}>Purchase History</Text>

            <Text style={styles.heroDescription}>
              Track and manage your African product purchases with our exclusive
              order tracking system.
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons
                  name="shopping-bag"
                  size={20}
                  color={premiumColors.primary}
                />
                <Text style={styles.statValue}>{orders.length}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
                ]}
              >
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={premiumColors.accent}
                />
                <Text style={styles.statValue}>{statusCounts.delivered}</Text>
                <Text style={styles.statLabel}>Delivered</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
                ]}
              >
                <MaterialIcons
                  name="local-shipping"
                  size={20}
                  color="#3b82f6"
                />
                <Text style={styles.statValue}>{statusCounts.shipped}</Text>
                <Text style={styles.statLabel}>In Transit</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                ]}
              >
                <MaterialIcons name="schedule" size={20} color="#ef4444" />
                <Text style={styles.statValue}>{statusCounts.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {Object.entries(statusCounts).map(([status, count]) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  style={[
                    styles.filterButton,
                    selectedStatus === status && styles.filterButtonActive,
                  ]}
                >
                  <LinearGradient
                    colors={
                      selectedStatus === status
                        ? getStatusColor(status)
                        : ["#F9FAFB", "#F3F4F6"]
                    }
                    style={styles.filterButtonGradient}
                  >
                    <MaterialIcons
                      name={getStatusIcon(status)}
                      size={16}
                      color={
                        selectedStatus === status
                          ? "white"
                          : premiumColors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedStatus === status &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>({count})</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Loading State */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={premiumColors.primary} />
                <Text style={styles.loadingTitle}>Loading Your Orders</Text>
                <Text style={styles.loadingDescription}>
                  Retrieving your purchase history...
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={[
                      "rgba(251, 191, 36, 0.1)",
                      "rgba(16, 185, 129, 0.1)",
                    ]}
                    style={styles.emptyIcon}
                  >
                    <MaterialIcons
                      name="inventory"
                      size={40}
                      color={premiumColors.primary}
                    />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>
                    {selectedStatus === "all"
                      ? "No Orders Found"
                      : `No ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Orders`}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {selectedStatus === "all"
                      ? "Your orders will appear here. Start your African shopping journey with our exclusive collection."
                      : `You don't have any ${selectedStatus} orders at the moment.`}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() =>
                      Alert.alert("Shop", "Redirecting to products...")
                    }
                  >
                    <LinearGradient
                      colors={[premiumColors.primary, premiumColors.secondary]}
                      style={styles.emptyButtonGradient}
                    >
                      <MaterialIcons
                        name="shopping-bag"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.emptyButtonText}>
                        Explore Products
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ordersContainer}>
                  {filteredOrders.map((order, index) => {
                    const estimatedDelivery = moment(order.createdAt)
                      .add(2, "days")
                      .format("MMMM Do YYYY");

                    const statusColors = getStatusColor(order.status);
                    const progress = getStatusProgress(order.status);

                    return (
                      <View key={order.$id} style={styles.orderCard}>
                        <View style={styles.orderCardGradient}>
                          {/* Order Header */}
                          <View style={styles.orderHeader}>
                            <View style={styles.orderHeaderLeft}>
                              <LinearGradient
                                colors={statusColors}
                                style={styles.statusIcon}
                              >
                                <MaterialIcons
                                  name={getStatusIcon(order.status)}
                                  size={20}
                                  color="white"
                                />
                              </LinearGradient>
                              <View style={styles.orderHeaderInfo}>
                                <Text style={styles.orderTitle}>
                                  Order #{order.$id?.slice(-8)}
                                </Text>
                                <Text style={styles.orderDate}>
                                  {moment(order.createdAt).format(
                                    "MMM D, YYYY",
                                  )}
                                </Text>
                              </View>
                            </View>

                            <LinearGradient
                              colors={[
                                `${statusColors[0]}30`,
                                `${statusColors[1]}20`,
                              ]}
                              style={styles.statusBadge}
                            >
                              <Text style={styles.statusBadgeText}>
                                {order.status?.charAt(0).toUpperCase() +
                                  order.status?.slice(1)}
                              </Text>
                            </LinearGradient>
                          </View>

                          {/* Progress Bar */}
                          <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                              <Text style={styles.progressLabel}>
                                Order Progress
                              </Text>
                              <Text style={styles.progressPercentage}>
                                {progress}%
                              </Text>
                            </View>
                            <View style={styles.progressBar}>
                              <LinearGradient
                                colors={statusColors}
                                style={[
                                  styles.progressFill,
                                  { width: `${progress}%` },
                                ]}
                              />
                            </View>
                          </View>

                          {/* Order Details */}
                          <View style={styles.orderDetails}>
                            <View style={styles.orderDetailsRow}>
                              <View style={styles.orderDetail}>
                                <MaterialIcons
                                  name="credit-card"
                                  size={16}
                                  color={premiumColors.primary}
                                />
                                <View style={styles.orderDetailText}>
                                  <Text style={styles.orderDetailLabel}>
                                    Amount
                                  </Text>
                                  <Text style={styles.orderDetailValue}>
                                    {fmtOrderAmount(
                                      order.amount,
                                      order.currency,
                                    )}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.orderDetail}>
                                <MaterialIcons
                                  name="location-on"
                                  size={16}
                                  color={premiumColors.accent}
                                />
                                <View style={styles.orderDetailText}>
                                  <Text style={styles.orderDetailLabel}>
                                    Delivery
                                  </Text>
                                  <Text style={styles.orderDetailValue}>
                                    {order.status === "delivered"
                                      ? "Delivered"
                                      : "In Progress"}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Estimated Delivery */}
                            {order.status !== "delivered" &&
                              order.status !== "cancelled" && (
                                <LinearGradient
                                  colors={[
                                    "rgba(251, 191, 36, 0.1)",
                                    "rgba(217, 119, 6, 0.05)",
                                  ]}
                                  style={styles.deliveryInfo}
                                >
                                  <MaterialIcons
                                    name="schedule"
                                    size={16}
                                    color={premiumColors.primary}
                                  />
                                  <View style={styles.deliveryInfoText}>
                                    <Text style={styles.deliveryInfoLabel}>
                                      Estimated Delivery
                                    </Text>
                                    <Text style={styles.deliveryInfoValue}>
                                      {estimatedDelivery}
                                    </Text>
                                  </View>
                                </LinearGradient>
                              )}
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.orderActions}>
                            <TouchableOpacity
                              style={styles.primaryAction}
                              onPress={() => handleTrackOrder(order)}
                            >
                              <LinearGradient
                                colors={[
                                  premiumColors.primary,
                                  premiumColors.secondary,
                                ]}
                                style={styles.primaryActionGradient}
                              >
                                <MaterialIcons
                                  name="local-shipping"
                                  size={18}
                                  color="white"
                                />
                                <Text style={styles.primaryActionText}>
                                  Track Order
                                </Text>
                              </LinearGradient>
                            </TouchableOpacity>

                            {/* Cancel Button for eligible orders */}
                            {(order.status?.toLowerCase() === "pending" ||
                              order.status?.toLowerCase() === "processing") && (
                              <TouchableOpacity
                                style={styles.secondaryAction}
                                onPress={() => handleCancelOrder(order)}
                              >
                                <LinearGradient
                                  colors={["#ef4444", "#dc2626"]}
                                  style={styles.secondaryActionGradient}
                                >
                                  <MaterialIcons
                                    name="cancel"
                                    size={18}
                                    color="white"
                                  />
                                  <Text style={styles.secondaryActionText}>
                                    Cancel
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.moreAction}>
                              <MaterialIcons
                                name="chevron-right"
                                size={20}
                                color={premiumColors.primary}
                              />
                            </TouchableOpacity>
                          </View>

                          {/* Premium Badge for high-value orders */}
                          {order.amount > 100 && (
                            <View style={styles.premiumOrderBadge}>
                              <LinearGradient
                                colors={[
                                  premiumColors.primary,
                                  premiumColors.secondary,
                                ]}
                                style={styles.premiumBadgeGradient}
                              >
                                <MaterialIcons
                                  name="star"
                                  size={12}
                                  color="white"
                                />
                                <Text style={styles.premiumBadgeText}>
                                  Top Order
                                </Text>
                              </LinearGradient>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Order Summary */}
              <View
                style={[
                  styles.summaryContainer,
                  {
                    backgroundColor: "#F0FDF4",
                    borderColor: "#BBF7D0",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryGrid}>
                  <View
                    style={[
                      styles.summaryCard,
                      {
                        backgroundColor: "#FFFBEB",
                        borderColor: "#FDE68A",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="security"
                      size={24}
                      color={premiumColors.primary}
                    />
                    <Text style={styles.summaryCardTitle}>
                      Order Protection
                    </Text>
                    <Text style={styles.summaryCardDescription}>
                      All orders are protected
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.summaryCard,
                      {
                        backgroundColor: "#F0FDF4",
                        borderColor: "#BBF7D0",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="local-shipping"
                      size={24}
                      color={premiumColors.accent}
                    />
                    <Text style={styles.summaryCardTitle}>
                      Express Shipping
                    </Text>
                    <Text style={styles.summaryCardDescription}>
                      Fast delivery across Africa
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.summaryCard,
                      {
                        backgroundColor: "#EFF6FF",
                        borderColor: "#BFDBFE",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="support-agent"
                      size={24}
                      color="#3b82f6"
                    />
                    <Text style={styles.summaryCardTitle}>
                      Customer Support
                    </Text>
                    <Text style={styles.summaryCardDescription}>
                      24/7 order assistance
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Orders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Hero Section
  heroSection: {
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  badgeText: {
    color: "#D97706",
    fontFamily: "Poppins-SemiBold",
    marginHorizontal: 8,
    fontSize: 14,
  },
  heroTitle: {
    fontSize: width > 400 ? 36 : 32,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#14532D",
  },
  heroTitleAccent: {
    color: "#D97706",
  },
  heroSubtitle: {
    fontSize: 20,
    color: "#D97706",
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
    fontFamily: "Poppins-Regular",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  filterButton: {
    marginRight: 12,
    borderRadius: 16,
  },
  filterButtonActive: {
    elevation: 4,
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  filterButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  filterButtonText: {
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  filterBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "600",
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
    marginTop: 20,
    textAlign: "center",
  },
  loadingDescription: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  emptyButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  // Orders Container
  ordersContainer: {
    paddingHorizontal: 20,
  },
  orderCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  orderCardGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  // Order Header
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  orderHeaderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#374151",
  },
  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  progressPercentage: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Order Details
  orderDetails: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  orderDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderDetailText: {
    marginLeft: 8,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  orderDetailValue: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginTop: 2,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  deliveryInfoText: {
    marginLeft: 8,
  },
  deliveryInfoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  deliveryInfoValue: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#D97706",
    marginTop: 2,
  },
  // Order Actions
  orderActions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 0,
  },
  primaryAction: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryActionText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryAction: {
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  secondaryActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryActionText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  moreAction: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  // Premium Badge
  premiumOrderBadge: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  premiumBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  premiumBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  // Summary Container
  summaryContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  summaryCardTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginLeft: 12,
    flex: 1,
  },
  summaryCardDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 12,
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
});
