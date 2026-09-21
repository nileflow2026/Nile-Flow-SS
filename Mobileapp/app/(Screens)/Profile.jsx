/* eslint-disable no-unused-vars */
import { FontAwesome5 } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import {
  Award,
  Camera,
  ChevronRight,
  CreditCard,
  Crown,
  Gift,
  Heart,
  History,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  User,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";
import { useFavorites } from "../../Context/FavoritesContext";
import {
  getCustomerOrders,
  useGlobalContext,
} from "../../Context/GlobalProvider";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import i18n, { useLanguage } from "../../i18n";
import NetworkErrorFallback from "../components/NetworkErrorFallback";
import PremiumMonthlySummary from "./PremiumMonthlySummary";
import { usePostHog } from "posthog-react-native";

const { width, height } = Dimensions.get("window");

const ProfilePage = () => {
  useLanguage(); // re-render when locale changes
  const { user, setUser, isLogged, setIsLogged } = useGlobalContext();
  const { favorites } = useFavorites();
  const { isPremium } = usePremiumStatus();
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [nileMilesData, setNileMilesData] = useState({
    currentMiles: 0,
    earnedHistory: [],
    redeemed: [],
    tier: "Bronze",
  });
  const [nileMilesLoading, setNileMilesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const posthog = usePostHog();

  // Responsive sizing
  const sectionTitleFontSize = width < 350 ? 16 : 18;
  const itemTextFontSize = width < 350 ? 14 : 16;
  const itemPadding = width < 350 ? 12 : 16;
  const iconSize = width < 350 ? 18 : 20;
  const logoutPadding = width < 350 ? 12 : 16;
  const logoutFontSize = width < 350 ? 14 : 16;

  const fetchNileMiles = useCallback(async () => {
    if (!user || !user.id) {
      console.warn("⚠️ No user ID found, skipping Nile Miles fetch.");
      return;
    }

    try {
      /* console.log("📡 Fetching with userId:", user.id); */
      const res = await axiosClient.get(
        `/api/nilemiles/nilemiles/status?userId=${user.id}`,
      );
      /* console.log("✅ Raw response:", res);
      console.log("📦 Data:", res.data); */
      setNileMilesData(res.data);
    } catch (error) {
      console.error("❌ Failed to load Nile Miles:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNileMiles();
  }, [fetchNileMiles, retryKey]);

  useFocusEffect(
    useCallback(() => {
      posthog.screen("/BottomTabs/Profile");
    }, [posthog]),
  );

  const handleRetry = () => {
    setHasError(false);
    setOrdersLoading(true);
    setRetryKey((k) => k + 1);
  };

  // Fetch actual orders data
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isLogged) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      try {
        setOrdersLoading(true);
        const customerOrders = await getCustomerOrders();
        setOrders(customerOrders || []);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        setOrders([]);
        setHasError(true);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [isLogged, retryKey]);

  const handleImagePicker = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow photo library access.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      // Show picked image immediately
      setPreviewImage(uri);

      // Upload to backend
      setIsUploading(true);

      const formData = new FormData();
      formData.append("avatar", {
        uri,
        type: "image/jpeg",
        name: `avatar_${user?.id || "unknown"}_${Date.now()}.jpg`,
      });
      formData.append("userId", user?.id || "");

      console.log("🔄 Uploading avatar for user ID:", user?.id);

      // Test connectivity first
      try {
        await axiosClient.get("/api/customerauth/getCustomerProfile");
      } catch (connectError) {
        throw new Error(
          "Cannot connect to server. Please check your network connection.",
        );
      }

      const res = await axiosClient.post(
        `/api/customerprofile/updatedAvatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (user) {
        const updatedUser = {
          ...user,
          avatarUrl: res.data.avatarUrl,
          avatarFileId: res.data.avatarFileId,
        };
        setUser(updatedUser);
      }

      Alert.alert("Profile Updated", "Your profile picture has been updated.");
    } catch (error) {
      console.error("❌ Upload failed:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      let errorMessage = "Could not update profile picture.";

      if (error.message === "Network Error") {
        errorMessage =
          "Network connection failed. Please check if the server is running and try again.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "Upload endpoint not found. Please check the server configuration.";
      } else if (error.response?.status === 400) {
        errorMessage =
          "Invalid upload data. Please try selecting the image again.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) {
      Alert.alert("No Image Selected", "Please select an image first.");
      return;
    }

    setIsUploading(true);
    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update user with new image
      const updatedUser = {
        ...user,
        avatarUrl: profileImage.uri,
      };
      setUser(updatedUser);

      // Clear preview
      setProfileImage(null);
      setPreviewImage(null);

      Alert.alert("Success", "Profile image updated successfully!");
    } catch (error) {
      console.error("Failed to upload image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Gold":
        return ["#D97706", "#B45309"];
      case "Silver":
        return ["#9CA3AF", "#6B7280"];
      case "Bronze":
        return ["#92400E", "#EAB308"];
      default:
        return ["#D97706", "#EAB308"];
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    // Refresh Nile Miles data
    await fetchNileMiles();

    // Refresh orders data if user is logged in
    if (isLogged) {
      try {
        const customerOrders = await getCustomerOrders();
        setOrders(customerOrders || []);
      } catch (error) {
        console.error("Error refreshing customer orders:", error);
      }
    }

    setRefreshing(false);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem(`@cart_items_${user?.$id}`);

      setUser(null);
      setIsLogged(false);

      router.replace("/sign-in");
    } catch (error) {
      Alert.alert("Logout Failed", "Something went wrong. Please try again.");
      console.error("Logout error:", error);
    }
  };

  // Create user data with fallbacks for non-logged users
  const demoUser = {
    name: isLogged && user?.username ? user.username : "Guest User",
    email: isLogged && user?.email ? user.email : "guest@nileflow.com",
    profileImage:
      previewImage ||
      (isLogged &&
      user?.avatarUrl &&
      typeof user.avatarUrl === "string" &&
      user.avatarUrl.trim() !== ""
        ? user.avatarUrl
        : null) ||
      (isLogged &&
      user?.profileImage &&
      typeof user.profileImage === "string" &&
      user.profileImage.trim() !== ""
        ? user.profileImage
        : null) ||
      "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/695439130011158bb8af/view?project=6926c7df002fa7831d94",
    phone: isLogged && user?.phone ? user.phone : "+254 700 000 000",
    address:
      isLogged && user?.address
        ? user.address
        : "Nile Flow Hub, Nairobi, Kenya",
  };

  const TabButton = ({ title, isActive, onPress, icon: Icon }) => (
    <TouchableOpacity onPress={onPress} style={styles.tabContainer}>
      <View
        style={[
          styles.tabButton,
          isActive && styles.activeTab,
          { backgroundColor: isActive ? "#16A34A" : "#F3F4F6" },
        ]}
      >
        {Icon && <Icon size={16} color={isActive ? "white" : "#6B7280"} />}
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Nile Miles Card */}
      {/* <LinearGradient
        colors={["rgba(17, 24, 39, 0.8)", "rgba(0, 0, 0, 0.8)"]}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <LinearGradient
              colors={["#D97706", "#B45309"]}
              style={styles.iconContainer}
            >
              <TrendingUp size={24} color="white" />
            </LinearGradient>
            <View>
              <Text style={styles.cardTitle}>Nile Miles</Text>
              <Text style={styles.cardSubtitle}>Premium Loyalty Program</Text>
            </View>
          </View>
          <LinearGradient
            colors={getTierColor(nileMilesData?.tier || "Bronze")}
            style={styles.tierBadge}
          >
            <Award size={20} color="white" />
            <Text style={styles.tierText}>
              {nileMilesData?.tier || "Bronze"} Tier
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.milesStats}>
          <LinearGradient
            colors={["rgba(217, 119, 6, 0.3)", "rgba(180, 83, 9, 0.2)"]}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {nileMilesData?.currentMiles || 0}
            </Text>
            <Text style={styles.statLabel}>Current Miles</Text>
          </LinearGradient>
          <LinearGradient
            colors={["rgba(5, 150, 105, 0.3)", "rgba(4, 120, 87, 0.2)"]}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {nileMilesData?.earnedHistory?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </LinearGradient>
          <LinearGradient
            colors={["rgba(37, 99, 235, 0.3)", "rgba(29, 78, 216, 0.2)"]}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {nileMilesData?.redeemed?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </LinearGradient>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress to Gold Tier</Text>
            <Text style={styles.progressPercent}>
              {(((nileMilesData?.currentMiles || 0) / 5000) * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={["#EAB308", "#F59E0B"]}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(((nileMilesData?.currentMiles || 0) / 5000) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => router.push("/Redeem")}
        >
          <LinearGradient
            colors={["#D97706", "#B45309"]}
            style={styles.redeemGradient}
          >
            <Gift size={20} color="white" />
            <Text style={styles.redeemText}>Redeem Miles</Text>
            <ChevronRight size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient> */}

      {/* Order History */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#7C3AED" }]}
            >
              <History size={24} color="white" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Order History</Text>
              <Text style={styles.cardSubtitle}>Recent premium orders</Text>
            </View>
          </View>
          <Text style={styles.orderCount}>
            {isLogged
              ? `${orders?.length || 0} orders`
              : "Sign in to view orders"}
          </Text>
        </View>

        <View style={styles.ordersContainer}>
          {isLogged && orders && orders.length > 0 ? (
            orders.slice(0, 3).map((order, index) => (
              <View
                key={order.$id || order.id || index}
                style={styles.orderItem}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Package size={16} color="#D97706" />
                    <Text style={styles.orderId}>
                      {(order.$id || order.id || `order_${index}`)
                        .toString()
                        .slice(-8)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      (order.status || order.orderStatus) === "Delivered" &&
                        styles.deliveredBadge,
                      (order.status || order.orderStatus) === "Shipped" &&
                        styles.shippedBadge,
                      (order.status || order.orderStatus) === "Processing" &&
                        styles.processingBadge,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {order.status || order.orderStatus || "Processing"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.orderDate}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Date not available"}
                </Text>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderAmount}>
                    {order.currency || "USD"}{" "}
                    {(order.amount || order.total || 0).toFixed
                      ? (order.amount || order.total || 0).toFixed(2)
                      : parseFloat(order.amount || order.total || 0).toFixed(2)}
                  </Text>
                  <View style={styles.orderStatusContainer}>
                    <Truck size={16} color="#60A5FA" />
                    <Text style={styles.orderStatus}>
                      {order.orderStatus ||
                        order.shipping_status ||
                        "In Progress"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <ShoppingBag size={64} color="rgba(234, 179, 8, 0.3)" />
              <Text style={styles.emptyOrdersTitle}>
                {isLogged ? "No Orders Yet" : "Sign In to View Orders"}
              </Text>
              <Text style={styles.emptyOrdersText}>
                {isLogged
                  ? "Start your premium African shopping journey"
                  : "Please sign in to access your order history and start shopping"}
              </Text>
              <TouchableOpacity
                style={styles.startShoppingButton}
                onPress={() => router.push(isLogged ? "/" : "/sign-in")}
              >
                <View style={styles.startShoppingGradient}>
                  {isLogged ? (
                    <Sparkles size={20} color="white" />
                  ) : (
                    <User size={20} color="white" />
                  )}
                  <Text style={styles.startShoppingText}>
                    {isLogged ? "Start Shopping" : "Sign In"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderWishlistTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#DC2626" }]}
            >
              <Heart size={24} color="white" />
            </View>
            <View>
              <Text style={styles.cardTitle}>My Wishlist</Text>
              <Text style={styles.cardSubtitle}>
                {favorites?.length || 0}{" "}
                {(favorites?.length || 0) === 1 ? "item" : "items"} saved
              </Text>
            </View>
          </View>
        </View>

        {favorites && favorites.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.wishlistScroll}
          >
            {favorites.map((product) => (
              <View key={product.$id || product.id} style={styles.wishlistItem}>
                <ExpoImage
                  source={{
                    uri: imageForSize(
                      product.image || product.thumbnail,
                      IMAGE_SIZE.MEDIUM,
                    ),
                  }}
                  style={styles.wishlistImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
                <Text style={styles.wishlistTitle} numberOfLines={2}>
                  {product.title || product.name}
                </Text>
                <Text style={styles.wishlistPrice}>
                  ${product.price || "0.00"}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyWishlistContainer}>
            <Heart size={64} color="rgba(220, 38, 38, 0.3)" />
            <Text style={styles.emptyWishlistTitle}>
              Your Wishlist is Empty
            </Text>
            <Text style={styles.emptyWishlistText}>
              Save your favorite items by clicking the heart icon on any product
            </Text>
            <TouchableOpacity
              style={styles.startShoppingButton}
              onPress={() => router.push("/")}
            >
              <View style={styles.startShoppingGradient}>
                <ShoppingBag size={20} color="white" />
                <Text style={styles.startShoppingText}>Start Shopping</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderOrdersTab = () => (
    <View style={styles.tabContent}>
      {/* Order History */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#7C3AED" }]}
            >
              <History size={24} color="white" />
            </View>
            <View>
              <Text style={styles.cardTitle}>My Orders</Text>
              <Text style={styles.cardSubtitle}>Complete order history</Text>
            </View>
          </View>
          <Text style={styles.orderCount}>
            {isLogged
              ? `${orders?.length || 0} orders`
              : "Sign in to view orders"}
          </Text>
        </View>

        <View style={styles.ordersContainer}>
          {isLogged && orders && orders.length > 0 ? (
            orders.map((order, index) => (
              <View
                key={order.$id || order.id || index}
                style={styles.orderItem}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Package size={16} color="#D97706" />
                    <Text style={styles.orderId}>
                      {(order.$id || order.id || `order_${index}`)
                        .toString()
                        .slice(-8)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      (order.status || order.orderStatus) === "Delivered" &&
                        styles.deliveredBadge,
                      (order.status || order.orderStatus) === "Shipped" &&
                        styles.shippedBadge,
                      (order.status || order.orderStatus) === "Processing" &&
                        styles.processingBadge,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {order.status || order.orderStatus || "Processing"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.orderDate}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Date not available"}
                </Text>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderAmount}>
                    {order.currency || "USD"}{" "}
                    {(order.amount || order.total || 0).toFixed
                      ? (order.amount || order.total || 0).toFixed(2)
                      : parseFloat(order.amount || order.total || 0).toFixed(2)}
                  </Text>
                  <View style={styles.orderStatusContainer}>
                    <Truck size={16} color="#60A5FA" />
                    <Text style={styles.orderStatus}>
                      {order.orderStatus ||
                        order.shipping_status ||
                        "In Progress"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <ShoppingBag size={64} color="rgba(234, 179, 8, 0.3)" />
              <Text style={styles.emptyOrdersTitle}>
                {isLogged ? "No Orders Yet" : "Sign In to View Orders"}
              </Text>
              <Text style={styles.emptyOrdersText}>
                {isLogged
                  ? "Start your premium African shopping journey"
                  : "Please sign in to access your order history and start shopping"}
              </Text>
              <TouchableOpacity
                style={styles.startShoppingButton}
                onPress={() => router.push(isLogged ? "/" : "/sign-in")}
              >
                <View style={styles.startShoppingGradient}>
                  {isLogged ? (
                    <Sparkles size={20} color="white" />
                  ) : (
                    <User size={20} color="white" />
                  )}
                  <Text style={styles.startShoppingText}>
                    {isLogged ? "Start Shopping" : "Sign In"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  /*   const renderMilesTab = () => (
    <View style={styles.tabContent}>
       Nile Miles Card 
      <LinearGradient
        colors={["rgba(17, 24, 39, 0.8)", "rgba(0, 0, 0, 0.8)"]}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <LinearGradient
              colors={["#D97706", "#B45309"]}
              style={styles.iconContainer}
            >
              <TrendingUp size={24} color="white" />
            </LinearGradient>
            <View>
              <Text style={styles.cardTitle}>Nile Miles</Text>
              <Text style={styles.cardSubtitle}>Premium Loyalty Program</Text>
            </View>
          </View>
          <LinearGradient
            colors={getTierColor(nileMilesData?.tier || "Bronze")}
            style={styles.tierBadge}
          >
            <Award size={20} color="white" />
            <Text style={styles.tierText}>
              {nileMilesData?.tier || "Bronze"} Tier
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.milesStats}>
          <LinearGradient
            colors={["rgba(217, 119, 6, 0.3)", "rgba(180, 83, 9, 0.2)"]}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {nileMilesData?.currentMiles || 0}
            </Text>
            <Text style={styles.statLabel}>Current Miles</Text>
          </LinearGradient>
          <LinearGradient
            colors={["rgba(5, 150, 105, 0.3)", "rgba(4, 120, 87, 0.2)"]}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {nileMilesData?.earnedHistory?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </LinearGradient>
          <LinearGradient
            colors={["rgba(37, 99, 235, 0.3)", "rgba(29, 78, 216, 0.2)"]}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {nileMilesData?.redeemed?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </LinearGradient>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress to Gold Tier</Text>
            <Text style={styles.progressPercent}>
              {(((nileMilesData?.currentMiles || 0) / 5000) * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={["#EAB308", "#F59E0B"]}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(((nileMilesData?.currentMiles || 0) / 5000) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => router.push("/redeem")}
        >
          <LinearGradient
            colors={["#D97706", "#B45309"]}
            style={styles.redeemGradient}
          >
            <Gift size={20} color="white" />
            <Text style={styles.redeemText}>Redeem Miles</Text>
            <ChevronRight size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

       Miles History 
      <LinearGradient
        colors={["rgba(17, 24, 39, 0.8)", "rgba(0, 0, 0, 0.8)"]}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <LinearGradient
              colors={["#059669", "#047857"]}
              style={styles.iconContainer}
            >
              <Award size={24} color="white" />
            </LinearGradient>
            <View>
              <Text style={styles.cardTitle}>Miles History</Text>
              <Text style={styles.cardSubtitle}>
                Earned and redeemed points
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ordersContainer}>
          {nileMilesData?.earnedHistory &&
          nileMilesData.earnedHistory.length > 0 ? (
            nileMilesData.earnedHistory.slice(0, 5).map((history, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Sparkles size={16} color="#10B981" />
                    <Text style={styles.orderId}>
                      +{history.points || history.miles || 0} Miles
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, styles.deliveredBadge]}>
                    <Text style={styles.statusText}>Earned</Text>
                  </View>
                </View>

                <Text style={styles.orderDate}>
                  {history.date
                    ? new Date(history.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Date not available"}
                </Text>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderAmount}>
                    {history.reason || history.description || "Purchase reward"}
                  </Text>
                  <View style={styles.orderStatusContainer}>
                    <TrendingUp size={16} color="#10B981" />
                    <Text
                      style={[
                        styles.orderStatus,
                        { color: "rgba(16, 185, 129, 0.7)" },
                      ]}
                    >
                      Active
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <TrendingUp size={64} color="rgba(217, 119, 6, 0.3)" />
              <Text style={styles.emptyOrdersTitle}>
                {isLogged ? "No Miles History Yet" : "Sign In to View Miles"}
              </Text>
              <Text style={styles.emptyOrdersText}>
                {isLogged
                  ? "Start earning miles by making purchases and engaging with our platform"
                  : "Please sign in to access your miles history and start earning rewards"}
              </Text>
              <TouchableOpacity
                style={styles.startShoppingButton}
                onPress={() => router.push(isLogged ? "/" : "/sign-in")}
              >
                <LinearGradient
                  colors={["#D97706", "#B45309"]}
                  style={styles.startShoppingGradient}
                >
                  {isLogged ? (
                    <Sparkles size={20} color="white" />
                  ) : (
                    <User size={20} color="white" />
                  )}
                  <Text style={styles.startShoppingText}>
                    {isLogged ? "Start Earning" : "Sign In"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  ); */

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <View style={{ marginBottom: 32 }}>
          <View style={{ marginTop: 40, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: sectionTitleFontSize,
                fontWeight: "600",
                color: "#14532D",
                marginBottom: 16,
              }}
            >
              Account
            </Text>
            {[
              {
                title: "Orders",
                route: "/Orders",
                icon: require("../../assets/icons/order.png"),
              },
              {
                title: "Payment Methods",
                route: "/PaymentMethods",
                icon: require("../../assets/icons/payment.png"),
              },
              {
                title: "Addresses",
                route: "/Addresses",
                icon: require("../../assets/icons/address.png"),
              },
            ].map(({ title, route, icon }, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(route)}
                style={{
                  borderRadius: 12,
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  padding: itemPadding,
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Image
                  source={icon}
                  style={{
                    width: 24,
                    height: 24,
                    marginRight: 12,
                    tintColor: "#374151",
                  }}
                />
                <Text
                  style={{
                    fontSize: itemTextFontSize,
                    color: "#374151",
                  }}
                >
                  {title}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: sectionTitleFontSize,
                fontWeight: "600",
                color: "#14532D",
                marginBottom: 16,
              }}
            >
              {"Preferences"}
            </Text>
            {[
              {
                title: "Return Policy",
                route: "/ReturnPolicy",
                icon: "assignment-return",
              },
              {
                title: "Language",
                route: "/Language",
                icon: "language",
              },
              {
                title: "Currency",
                route: "/Currency",
                icon: "currency-exchange",
              },
            ].map(({ title, route, icon }, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(route)}
                style={{
                  borderRadius: 12,
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  padding: itemPadding,
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <MaterialIcons
                  name={icon}
                  size={iconSize}
                  color="#374151"
                  style={{ marginRight: 16 }}
                />
                <Text
                  style={{
                    fontSize: itemTextFontSize,
                    color: "#374151",
                  }}
                >
                  {title}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: sectionTitleFontSize,
                fontWeight: "600",
                color: "#14532D",
                marginBottom: 16,
              }}
            >
              {i18n.t("Support")}
            </Text>
            {[
              {
                title: "Help Center",
                route: "/HelpCenter",
                icon: "question-circle",
              },
              {
                title: "Report a Problem",
                route: "/ReportaProblem",
                icon: "exclamation-triangle",
              },
              { title: "About", route: "/About", icon: "info-circle" },
            ].map(({ title, route, icon }, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(route)}
                style={{
                  borderRadius: 12,
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  padding: itemPadding,
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <FontAwesome5
                  name={icon}
                  size={iconSize}
                  color="#374151"
                  style={{ marginRight: 16 }}
                />
                <Text
                  style={{
                    fontSize: itemTextFontSize,
                    color: "#374151",
                  }}
                >
                  {title}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={{ marginTop: 24, paddingHorizontal: 16, marginBottom: 40 }}
          >
            <TouchableOpacity
              onPress={logout}
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 12,
                padding: logoutPadding,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: logoutFontSize,
                }}
              >
                Log out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.rightColumn}>
      {/* Profile Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Information</Text>
        </View>

        <View style={styles.profileInfoContainer}>
          <View style={styles.profileInfoItem}>
            <View
              style={[styles.profileInfoIcon, { backgroundColor: "#D97706" }]}
            >
              <User size={24} color="white" />
            </View>
            <View style={styles.profileInfoText}>
              <Text style={styles.profileInfoLabel}>Full Name</Text>
              <Text style={styles.profileInfoValue}>{demoUser.name}</Text>
            </View>
          </View>

          <View style={styles.profileInfoItem}>
            <View
              style={[styles.profileInfoIcon, { backgroundColor: "#059669" }]}
            >
              <Mail size={24} color="white" />
            </View>
            <View style={styles.profileInfoText}>
              <Text style={styles.profileInfoLabel}>Email Address</Text>
              <Text style={styles.profileInfoValue}>{demoUser.email}</Text>
            </View>
          </View>

          <View style={styles.profileInfoItem}>
            <View
              style={[styles.profileInfoIcon, { backgroundColor: "#2563EB" }]}
            >
              <Phone size={24} color="white" />
            </View>
            <View style={styles.profileInfoText}>
              <Text style={styles.profileInfoLabel}>Phone Number</Text>
              <Text style={styles.profileInfoValue}>{demoUser.phone}</Text>
            </View>
          </View>

          <View style={styles.profileInfoItem}>
            <View
              style={[styles.profileInfoIcon, { backgroundColor: "#DC2626" }]}
            >
              <MapPin size={24} color="white" />
            </View>
            <View style={styles.profileInfoText}>
              <Text style={styles.profileInfoLabel}>Location</Text>
              <Text style={styles.profileInfoValue}>{demoUser.address}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => router.push("/EditProfile")}
        >
          <View style={styles.editProfileGradient}>
            <Settings size={20} color="#16A34A" />
            <Text style={styles.editProfileText}>Edit Profile Information</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>

        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setActiveTab("wishlist")}
          >
            <View style={styles.quickActionLeft}>
              <View
                style={[styles.quickActionIcon, { backgroundColor: "#DC2626" }]}
              >
                <Heart size={20} color="white" />
              </View>
              <Text style={styles.quickActionText}>Wishlist</Text>
            </View>
            <ChevronRight size={20} color="#D97706" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push("/PaymentMethods")}
          >
            <View style={styles.quickActionLeft}>
              <View
                style={[styles.quickActionIcon, { backgroundColor: "#2563EB" }]}
              >
                <CreditCard size={20} color="white" />
              </View>
              <Text style={styles.quickActionText}>Payment Methods</Text>
            </View>
            <ChevronRight size={20} color="#60A5FA" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push("/Security")}
          >
            <View style={styles.quickActionLeft}>
              <View
                style={[styles.quickActionIcon, { backgroundColor: "#059669" }]}
              >
                <Shield size={20} color="white" />
              </View>
              <Text style={styles.quickActionText}>Security</Text>
            </View>
            <ChevronRight size={20} color="#10B981" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push("/AccountSettings")}
          >
            <View style={styles.quickActionLeft}>
              <View
                style={[styles.quickActionIcon, { backgroundColor: "#7C3AED" }]}
              >
                <Settings size={20} color="white" />
              </View>
              <Text style={styles.quickActionText}>Account Settings</Text>
            </View>
            <ChevronRight size={20} color="#A855F7" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!ordersLoading && hasError) {
    return <NetworkErrorFallback onRetry={handleRetry} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                <View
                  style={[
                    styles.profileImageGlow,
                    { backgroundColor: "#16A34A", opacity: 0.2 },
                  ]}
                />
                <ExpoImage
                  source={{ uri: demoUser.profileImage }}
                  style={styles.profileImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={
                    isLogged ? handleImagePicker : () => router.push("/sign-in")
                  }
                >
                  <View
                    style={[
                      styles.cameraGradient,
                      { backgroundColor: "#16A34A" },
                    ]}
                  >
                    <Camera size={20} color="white" />
                  </View>
                </TouchableOpacity>
                {isUploading && (
                  <ActivityIndicator
                    style={{ position: "absolute", top: "40%", left: "40%" }}
                    color="#16A34A"
                  />
                )}
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{demoUser.name}</Text>
                  {isLogged ? (
                    <View
                      style={[
                        styles.premiumBadge,
                        { backgroundColor: "#16A34A" },
                      ]}
                    >
                      <Text style={styles.premiumText}>PREMIUM</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => router.push("/sign-in")}>
                      <View
                        style={[
                          styles.premiumBadge,
                          { backgroundColor: "#DC2626" },
                        ]}
                      >
                        <Text style={styles.premiumText}>SIGN IN</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.userEmail}>{demoUser.email}</Text>
                <Text style={styles.memberSince}>
                  Member since{" "}
                  {isLogged && user?.createdAt
                    ? new Date(user.createdAt).getFullYear()
                    : new Date().getFullYear()}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {isLogged ? orders?.length || 0 : "-"}
                </Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {isLogged ? nileMilesData?.currentMiles || 0 : "-"}
                </Text>
                <Text style={styles.statLabel}>Miles</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isLogged ? "100%" : "-"}</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            <TabButton
              title="overview"
              isActive={activeTab === "overview"}
              onPress={() => setActiveTab("overview")}
            />
            <TabButton
              title="orders"
              isActive={activeTab === "orders"}
              onPress={() => setActiveTab("orders")}
            />
            {/* <TabButton
              title="miles"
              isActive={activeTab === "miles"}
              onPress={() => setActiveTab("miles")}
            />
            <TabButton
              title="premium"
              isActive={activeTab === "premium"}
              onPress={() => setActiveTab("premium")}
              icon={Crown}
            /> */}
            <TabButton
              title="settings"
              isActive={activeTab === "settings"}
              onPress={() => setActiveTab("settings")}
            />
            <TabButton
              title="wishlist"
              isActive={activeTab === "wishlist"}
              onPress={() => setActiveTab("wishlist")}
            />
          </ScrollView>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {activeTab === "overview" ? (
              // Show two-column layout for overview
              <>
                <View style={styles.leftColumn}>{renderOverviewTab()}</View>
                {renderProfileInfo()}
              </>
            ) : (
              // Show full-width layout for other tabs
              <View style={styles.fullWidthColumn}>
                {activeTab === "wishlist" && renderWishlistTab()}
                {activeTab === "orders" && renderOrdersTab()}
                {/* {activeTab === "miles" && renderMilesTab()} */}
                {activeTab === "premium" &&
                  (isPremium ? (
                    <PremiumMonthlySummary />
                  ) : (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <View
                            style={[
                              styles.iconContainer,
                              { backgroundColor: "#EAB308" },
                            ]}
                          >
                            <Crown size={24} color="white" />
                          </View>
                          <View>
                            <Text style={styles.cardTitle}>
                              Premium Required
                            </Text>
                            <Text style={styles.cardSubtitle}>
                              Upgrade to access premium features
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text
                        style={{
                          color: "#9CA3AF",
                          textAlign: "center",
                          marginTop: 16,
                        }}
                      >
                        Subscribe to Premium to view your monthly savings
                        summary and exclusive insights.
                      </Text>
                    </View>
                  ))}
                {activeTab === "settings" && renderSettingsTab()}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  heroSection: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 16,
    backgroundColor: "#F0FDF4",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 24,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImageGlow: {
    position: "absolute",
    inset: -8,
    borderRadius: 80,
    opacity: 0.3,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  cameraGradient: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 12,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  premiumBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  premiumText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 18,
    color: "#374151",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D97706",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  tabsContainer: {
    marginBottom: 32,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  activeTab: {
    borderColor: "#16A34A",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "capitalize",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  leftColumn: {
    marginBottom: 32,
  },
  fullWidthColumn: {
    width: "100%",
  },
  rightColumn: {
    gap: 32,
  },
  tabContent: {
    gap: 32,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#14532D",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  tierText: {
    color: "white",
    fontWeight: "bold",
  },
  milesStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    color: "#D97706",
    fontSize: 16,
  },
  progressPercent: {
    color: "#D97706",
    fontSize: 16,
    fontWeight: "bold",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  redeemButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  redeemGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  redeemText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageUploadContainer: {
    gap: 24,
  },
  imagePreviewContainer: {
    alignItems: "center",
    position: "relative",
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(234, 179, 8, 0.3)",
    borderStyle: "dashed",
  },
  checkIcon: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  imageUploadControls: {
    gap: 16,
  },
  selectImageButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  selectImageGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  selectImageText: {
    color: "white",
    fontWeight: "bold",
  },
  imageHelpText: {
    fontSize: 14,
    color: "rgba(254, 243, 199, 0.7)",
    textAlign: "center",
  },
  uploadButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  uploadText: {
    color: "white",
    fontWeight: "bold",
  },
  uploadTextDisabled: {
    color: "#9CA3AF",
  },
  orderCount: {
    color: "#6B7280",
    fontSize: 16,
  },
  ordersContainer: {
    gap: 16,
  },
  orderItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    color: "#D97706",
    fontFamily: "monospace",
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  deliveredBadge: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  shippedBadge: {
    backgroundColor: "#DBEAFE",
    borderColor: "#93C5FD",
  },
  processingBadge: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  orderDate: {
    color: "#6B7280",
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D97706",
  },
  orderStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderStatus: {
    color: "#6B7280",
    fontSize: 14,
  },
  emptyOrdersContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  emptyOrdersTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  emptyOrdersText: {
    color: "#9CA3AF",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  startShoppingButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 16,
  },
  startShoppingGradient: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
  },
  startShoppingText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  wishlistScroll: {
    marginBottom: 16,
  },
  wishlistItem: {
    width: 160,
    marginRight: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  wishlistImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  wishlistTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  wishlistPrice: {
    color: "#D97706",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyWishlistContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  emptyWishlistTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  emptyWishlistText: {
    color: "#9CA3AF",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  profileInfoContainer: {
    gap: 24,
    marginBottom: 24,
  },
  profileInfoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 16,
  },
  profileInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfoText: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14532D",
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 14,
    color: "#6B7280",
  },
  editProfileButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  editProfileGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  editProfileText: {
    color: "#16A34A",
    fontWeight: "600",
  },
  quickActionsContainer: {
    gap: 16,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    color: "#14532D",
    fontWeight: "600",
  },
  settingsIconButton: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)", // Added for debugging
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
});

export default ProfilePage;
