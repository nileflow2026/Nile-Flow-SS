/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import axiosClient from "@/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import * as mime from "react-native-mime-types";

const GlobalContext = createContext({
  isLogged: false,
  setIsLogged: () => {},
  user: null,
  setUser: () => {},
  loading: true,
  sessionInitialized: false,
  sessionError: false,
  retrySessionCheck: async () => {},
  pickupAddress: null,
  pickupAddressLoading: true,
  pickupAddressError: false,
  retryPickupAddressCheck: async () => {},
  savePickupAddress: async () => {},
  isGuest: false,
  setIsGuest: () => {},
  startGuestSessionFlow: () => Promise.resolve(),
  handleLogout: () => {},
});

export const useGlobalContext = () => useContext(GlobalContext);

// ── In-memory user cache to prevent redundant getCurrentUser() calls ──
let _userCache = null;
let _userCachePromise = null;
const USER_CACHE_TTL = 60 * 1000; // 1 minute

const getCachedUser = () => {
  if (_userCache && Date.now() - _userCache.ts < USER_CACHE_TTL) {
    return _userCache.user;
  }
  return null;
};

const setCachedUser = (user) => {
  _userCache = { user, ts: Date.now() };
};

export const invalidateUserCache = () => {
  _userCache = null;
  _userCachePromise = null;
};

const getOrCreateDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = Math.random().toString(36).substr(2, 16);
    await AsyncStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

const migrateLegacyOAuthTokens = async () => {
  const legacyTokens = await AsyncStorage.multiGet([
    "oauthAccessToken",
    "oauthRefreshToken",
  ]);
  const accessToken = legacyTokens[0][1];
  const refreshToken = legacyTokens[1][1];

  if (accessToken) {
    await SecureStore.setItemAsync("oauthAccessToken", accessToken);
  }
  if (refreshToken) {
    await SecureStore.setItemAsync("oauthRefreshToken", refreshToken);
  }
  if (accessToken || refreshToken) {
    await AsyncStorage.multiRemove([
      "oauthAccessToken",
      "oauthRefreshToken",
    ]);
  }
};

export const getCurrentUser = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCachedUser();
    if (cached) {
      console.log("📦 [getCurrentUser] Returning cached user");
      return cached;
    }
  }

  // Deduplicate in-flight requests
  if (_userCachePromise) {
    console.log("⏳ [getCurrentUser] In-flight request detected, awaiting...");
    return _userCachePromise;
  }

  console.log("Checking the current customer session.");
  _userCachePromise = (async () => {
    try {
      const response = await axiosClient.get(
        "/api/v1/customerauth/getCustomerProfile",
      );

      const user = response.data?.user || response.data;

      if (!user || typeof user !== "object") {
        console.warn("⚠️ [getCurrentUser] Invalid user object:", user);
        return null;
      }

      const sanitizedUser = {
        ...user,
        avatar: Array.isArray(user.avatar)
          ? user.avatar.length > 0
            ? user.avatar[0]
            : null
          : user.avatar,
        avatarUrl: Array.isArray(user.avatarUrl)
          ? user.avatarUrl.length > 0
            ? user.avatarUrl[0]
            : null
          : user.avatarUrl,
      };

      console.log("✅ [getCurrentUser] Successfully fetched user");
      setCachedUser(sanitizedUser);
      return sanitizedUser;
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) return null;
      console.error(
        "Customer session check failed:",
        error.response?.data?.error || error.message,
      );
      throw error;
    } finally {
      _userCachePromise = null;
    }
  })();
  return _userCachePromise;
};

export const signUp = async (
  email,
  password,
  username,
  phone,
) => {
  try {
    const deviceId = await getOrCreateDeviceId();

    const response = await axiosClient.post(
      "/api/v1/customerauth/signup/customer",
      {
        email,
        password,
        username,
        phone, // If you want to send a hardcoded phone or get it from props
        deviceId,
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Signup error:",
      error.response?.data?.error || error.message || error,
    );
    // Rethrow a simplified error message for the UI
    const authError = new Error(
      error.response?.data?.error || "Signup failed. Please try again.",
    );
    authError.code = error.response?.data?.code;
    authError.verificationRequired =
      error.response?.data?.verificationRequired === true;
    authError.resendAfterSeconds = error.response?.data?.resendAfterSeconds;
    throw authError;
  }
};

export const verifyEmailCode = async (email, verificationCode) => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const response = await axiosClient.post("/api/v1/customerauth/verify", {
      email,
      verificationCode,
      deviceId,
    });
    invalidateUserCache();
    return response.data;
  } catch (error) {
    const authError = new Error(
      error.response?.data?.error ||
        "Verification could not be completed. Please try again.",
    );
    authError.code = error.response?.data?.code;
    throw authError;
  }
};

export const resendEmailVerificationCode = async (email) => {
  try {
    const response = await axiosClient.post(
      "/api/v1/customerauth/resend-code",
      { email },
    );
    return response.data;
  } catch (error) {
    const authError = new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Could not resend the verification code.",
    );
    authError.code = error.response?.data?.code;
    authError.resendAfterSeconds = error.response?.data?.resendAfterSeconds;
    throw authError;
  }
};

export const getPickupAddress = async () => {
  try {
    const response = await axiosClient.get(
      "/api/v1/customerauth/pickup-address",
    );
    return response.data?.address || null;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const saveCustomerPickupAddress = async (address) => {
  const response = await axiosClient.post(
    "/api/v1/customerauth/pickup-address",
    address,
  );
  return response.data?.address || address;
};

export const exchangeOAuthCode = async (code) => {
  const deviceId = await getOrCreateDeviceId();
  const response = await axiosClient.post(
    "/api/v1/customerauth/oauth/exchange",
    { code, deviceId },
  );
  const { accessToken, refreshToken, user } = response.data || {};
  if (!accessToken || !refreshToken || !user) {
    throw new Error("Secure sign in returned an incomplete session.");
  }

  await SecureStore.setItemAsync("oauthAccessToken", accessToken);
  await SecureStore.setItemAsync("oauthRefreshToken", refreshToken);
  await AsyncStorage.setItem("user", JSON.stringify(user));
  await AsyncStorage.removeItem("isGuest");
  invalidateUserCache();
  return user;
};

export const signIn = async (email, password) => {
  try {
    const deviceId = await getOrCreateDeviceId();

    // Send login credentials to your backend API
    const response = await axiosClient.post(
      "/api/v1/customerauth/signin/customer",
      {
        email,
        password,
        deviceId,
      },
    );

    // Backend response structure: { message, user: { userId, email, username, role, avatar } }
    // Note: tokens are set as HTTP cookies, not in response body
    const { user } = response.data;

    // Clear guest status upon successful login
    await AsyncStorage.removeItem("isGuest");
    // Store the received user data
    await AsyncStorage.setItem("user", JSON.stringify(user));

    console.log("✅ Signin successful for user:", user.email);
    // Return the relevant data to the calling context
    return { user };
  } catch (error) {
    console.error(
      "Signin error details:",
      error.response?.data || error.message || error,
    );
    // Re-throw a specific error message from the backend or a generic one
    const authError = new Error(
      error.response?.data?.error ||
        "Signin failed. Please check your credentials.",
    );
    authError.code = error.response?.data?.code;
    authError.verificationRequired =
      error.response?.data?.verificationRequired === true;
    throw authError;
  }
};

const unregisterPushToken = async () => {
  try {
    await axiosClient.delete("/api/customernotifications/register-token");
  } catch (error) {
    console.warn(
      "Could not unregister the push token during sign out:",
      error.response?.data?.error || error.message,
    );
  }
};

export const signOut = async () => {
  try {
    await unregisterPushToken();
    const refreshToken = await SecureStore.getItemAsync("oauthRefreshToken");
    await axiosClient.post(
      "/api/v1/customerauth/logoutCustomer",
      refreshToken ? { refreshToken } : {},
    );
    await AsyncStorage.multiRemove([
      "user",
      "isGuest",
      "deviceId",
      "oauthAccessToken",
      "oauthRefreshToken",
    ]);
    await SecureStore.deleteItemAsync("oauthAccessToken");
    await SecureStore.deleteItemAsync("oauthRefreshToken");
    invalidateUserCache();
  } catch (error) {
    throw new Error("Sign-out failed. Your session is still active. Please retry.");
  }
};

export const createGuestSession = async () => {
  try {
    const response = await axiosClient.post("/api/customerauth/guest-session");
    await AsyncStorage.setItem("isGuest", "true");
    return response.data.session || response.data;
  } catch (error) {
    console.error("Error creating guest session:", error);
    throw new Error("Failed to create guest session.");
  }
};

export const isGuestUser = async () => {
  const value = await AsyncStorage.getItem("isGuest");
  return value === "true";
};

export const getGuestUser = async () => {
  if (await isGuestUser()) {
    try {
      const response = await axiosClient.get("/api/customerauth/guest-session");
      return response.data.user || response.data;
    } catch (error) {
      console.error("Error getting guest user:", error);
      return null;
    }
  }
  return null;
};

export const createNotification = async ({
  message,
  type,
  username,
  email,
  userId,
}) => {
  try {
    const response = await axiosClient.post(
      "/api/customernotifications/createnotification",
      {
        message,
        type,
        username,
        email,
        userId,
      },
    );

    return response.data.notification;
  } catch (error) {
    console.error("❌ Failed to send notification:", error.message);
    throw error;
  }
};

export const saveRecentSearch = async (userId, query) => {
  try {
    // The userId is now passed as an argument, so you don't need fetchUserId() here.
    console.log("Saving recent search for userId:", userId, "query:", query);

    const response = await axiosClient.post(
      `/api/customerprofile/customer-searches`,
      {
        userId,
        query,
      },
    );

    console.log(response.data.message);
  } catch (error) {
    console.error("Failed to save recent search:", error.message);
    throw error; // Re-throw the error so it can be caught in the component
  }
};

export const getRecentSearches = async () => {
  try {
    const userId = await fetchUserId();
    const response = await axiosClient.get(
      "/api/customerprofile/customer-recent-search",
      {
        params: {
          userId: userId, // 👈 send userId as a query parameter
        },
      },
    );
    return response.data.searches || [];
  } catch (error) {
    console.error(
      "Error fetching recent searches:",
      error.response?.data || error.message,
    );
    return [];
  }
};

export const clearRecentSearches = async () => {
  try {
    const response = await axiosClient.delete(
      "/api/customerprofile/clear-recent-search",
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error clearing recent searches:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getCustomerNotification = async () => {
  /* console.log("➡️ getCustomerNotification called..."); */

  try {
    /* console.log(
      "➡️ Making GET request to /api/customernotifications/customernotification...",
    ); */

    const response = await axiosClient.get(
      "/api/customernotifications/customernotification",
    );

    /* console.log("⬅️ Notification response received:", response.data); */

    const notifications = response.data?.result;

    if (!Array.isArray(notifications)) {
      /* console.warn("⚠️ Invalid notifications data received:", notifications); */
      throw new Error("Invalid notifications data received");
    }

    /* console.log("✅ Notifications processed:", notifications.length, "items"); */
    return notifications; // ✅ Return just the array
  } catch (error) {
    console.error("❌ Error fetching userNotifications:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });

    throw error;
  }
};

export const submitReview = async ({
  productId,
  reviewText,
  rating,
  imageFileId,
}) => {
  const response = await axiosClient.post(
    "/api/customerprofile/submit-review",
    {
      productId,
      reviewText,
      rating,
      imageId: imageFileId || "",
    },
  );

  return response.data;
};

export const incrementProductRatingsCount = async (productId) => {
  try {
    const response = await axiosClient.post(
      "/api/customerprofile/increment-rating",
      { productId }, // Request body
    );

    console.log("Ratings count updated:", response.data.ratingsCount);
    return response.data;
  } catch (error) {
    console.error(
      "Error incrementing product ratings count:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getCustomerOrders = async () => {
  const response = await axiosClient.get(
    "/api/customerprofile/customer-orders",
  );
  return response.data.orders;
};

export const getCustomerOrdersPage = async ({
  page = 1,
  limit = 100,
  status,
} = {}) => {
  const response = await axiosClient.get("/api/orders/mine", {
    params: { page, limit, ...(status ? { status } : {}) },
  });
  const orders = response.data?.orders || response.data?.response;
  const total = Number(response.data?.total);
  if (!Array.isArray(orders) || !Number.isSafeInteger(total) || total < 0) {
    throw new Error("Invalid customer orders response received");
  }

  return {
    orders,
    total,
  };
};

export const fetchReviews = async (productId) => {
  try {
    const response = await axiosClient.get(
      `/api/customerprofile/fetch-reviews/${productId}`,
    );
    /* console.log('Review data:', response.data) */
    return response.data;
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return [];
  }
};

export const fetchUserId = async () => {
  try {
    const user = await getCurrentUser(); // Fetch the authenticated user
    if (!user) {
      console.log("No user logged in - returning null");
      return null; // Return null instead of throwing error
    }
    return user.id; // Return the user ID from correct field (id, not userId)
  } catch (error) {
    console.error("Error fetching user ID:", error);
    return null; // Return null instead of throwing error
  }
};

export const fetchUserName = async () => {
  try {
    const user = await getCurrentUser(); // Get the logged-in user details
    if (!user) {
      return "Guest";
    }
    console.log("user", user);
    return user.username || "Guest";
  } catch (error) {
    console.error("Error fetching user name:", error);
    return "Anonymous";
  }
};

/* export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.log("❌ Notification permission denied.");
    return;
  }
};
requestNotificationPermissions();

export const sendNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💰 Exchange Rates Updated!",
      body: "Currency rates have been refreshed.",
    },
    trigger: null,
  });
}; */

export const updateCurrencyRates = async () => {
  try {
    console.log("Updating currency rates...");
    const response = await axiosClient.get(
      "/api/update-currencies/update-currencies",
    );

    /* sendNotification(); */
    return response.data;
  } catch (error) {
    console.error("❌ Error updating currency rates:", error);
  }
};

const uploadImageToStorage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: imageFile.uri,
      type: imageFile.type || "image/jpeg",
      name: imageFile.name || "upload.jpg",
    });

    const response = await axiosClient.post(
      "/api/customerprofile/upload-file",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data.fileId || response.data.$id;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};

export async function uploadFile(file) {
  if (!file) {
    console.warn("uploadFile: No file provided.");
    return null;
  }

  const { uri, name } = file;
  const mimeType = mime.lookup(uri) || "image/jpeg";

  try {
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: mimeType,
      name,
    });

    const response = await axiosClient.post(
      `/api/customerprofile/upload-avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const uploadedFile = response.data;
    return uploadedFile.$id || uploadedFile.fileId;
  } catch (error) {
    console.error("uploadFile: Error uploading file:", error);
    Alert.alert(
      "Upload Error",
      "Failed to upload the image. Please try again.",
    );
    return null;
  }
}

// Get File Preview
const getImageViewURL = (fileId) => {
  if (!fileId) {
    return null;
  }
  // Return a URL that will be resolved by the backend
  return `/api/files/${fileId}/view`;
};

export const getlatestProducts = async () => {
  try {
    const response = await axiosClient.get(
      "/api/customerprofile/fetch-product-mobile?limit=5",
    );
    return response.data.products || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ✅ New fetchProducts aligned with backend controller
export const fetchProducts = async (
  category = "",
  searchTerm = "",
  setLoading, // Pass setLoading from component
) => {
  try {
    if (typeof setLoading === "function") setLoading(true);

    // Build query params dynamically
    const params = new URLSearchParams();
    if (category && category.trim() !== "" && category !== "all") {
      params.append("category", category.trim());
    }
    if (searchTerm && searchTerm.trim() !== "") {
      params.append("search", searchTerm.trim());
    }

    const response = await axiosClient.get(
      `/api/customerprofile/fetch-product-mobile?${params.toString()}`,
    );

    const data = response.data;

    if (!data.success || !Array.isArray(data.products)) {
      console.error("Invalid backend response:", data);
      return [];
    }

    return data.products; // ✅ Backend returns all products
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  } finally {
    if (typeof setLoading === "function") setLoading(false);
  }
};

// fetchProducts.js
// Pagination-ready + backward compatible with your current backend

export const fetchProduct = async ({
  category = "",
  searchTerm = "",
  limit = 20,
  cursor = null,
  signal, // optional: AbortController for debouncing/cancellation
}) => {
  try {
    const params = new URLSearchParams();

    // Filters
    if (
      category &&
      category.trim() !== "" &&
      category.toLowerCase() !== "all"
    ) {
      params.append("category", category.trim());
    }
    if (searchTerm && searchTerm.trim() !== "") {
      params.append("search", searchTerm.trim());
    }

    // Pagination (requires backend change I outlined)
    if (limit) params.append("limit", String(limit));
    if (cursor) params.append("cursor", cursor);

    const url = `/api/customerprofile/fetch-product-mobile?${params.toString()}`;
    const response = await axiosClient.get(url, { signal });

    // Support both the new (paginated) and old (all-in-one) payloads
    const data = response.data || {};
    if (data.success && Array.isArray(data.products)) {
      return {
        products: data.products,
        nextCursor: data.nextCursor ?? null, // null when backend hasn’t been upgraded yet
        total: data.total ?? data.products.length,
      };
    }

    console.error("Invalid backend response:", data);
    return { products: [], nextCursor: null, total: 0 };
  } catch (error) {
    // If aborted, just return quietly
    if (error?.name === "CanceledError" || error?.name === "AbortError") {
      return { products: [], nextCursor: null, total: 0 };
    }
    console.error("Error fetching products:", error);
    return { products: [], nextCursor: null, total: 0 };
  }
};

export const getProducts = async () => {
  try {
    const response = await axiosClient.get(
      "/api/customerprofile/fetch-product",
    );

    if (response.data.success) {
      /* console.log("✅ Products fetched:", response.data.products.length); */
      return response.data.products; // <-- return array directly
    } else {
      console.warn("⚠️ Failed to fetch products:", response.data.error);
      return [];
    }
  } catch (error) {
    console.error("❌ Error in fetchProducts:", error);
    return [];
  }
};

const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [pickupAddressLoading, setPickupAddressLoading] = useState(true);
  const [pickupAddressError, setPickupAddressError] = useState(false);

  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        const guest = await AsyncStorage.getItem("isGuest");
        setIsGuest(guest === "true");
      } catch (error) {
        console.error("Error checking guest status:", error);
      }
    };
    checkGuestStatus();
  }, []);

  const retryPickupAddressCheck = async () => {
    setPickupAddressLoading(true);
    setPickupAddressError(false);
    try {
      const address = await getPickupAddress();
      setPickupAddress(address);
      return address;
    } catch (error) {
      console.error(
        "Pickup address check failed:",
        error.response?.data?.error || error.message,
      );
      setPickupAddressError(true);
      throw error;
    } finally {
      setPickupAddressLoading(false);
    }
  };

  const savePickupAddress = async (address) => {
    const savedAddress = await saveCustomerPickupAddress(address);
    setPickupAddress(savedAddress);
    setPickupAddressError(false);
    return savedAddress;
  };

  useEffect(() => {
    if (!isLogged) {
      setPickupAddress(null);
      setPickupAddressLoading(true);
      setPickupAddressError(false);
      return;
    }
    retryPickupAddressCheck().catch(() => {});
  }, [isLogged, user?.id]);

  useEffect(() => {
    const fetchUser = async () => {
      console.log("🔄 [GlobalProvider] Starting fetchUser");
      try {
        await migrateLegacyOAuthTokens();
        const currentUser = await getCurrentUser();
        console.log(
          "✅ [GlobalProvider] getCurrentUser returned:",
          currentUser ? "User object" : "null",
        );

        if (currentUser) {
          setSessionError(false);
          setIsLogged(true);

          // Handle any user object key renaming if needed here
          if (currentUser.key) {
            const { key, ...rest } = currentUser;
            setUser({ ...rest, appwriteKey: key });
          } else {
            setUser(currentUser);
          }

          setIsGuest(false); // User is logged in, not guest
        } else {
          setSessionError(false);
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        console.error("❌ [GlobalProvider] fetchUser error:", error.message);
        const storedUser = await AsyncStorage.getItem("user")
          .then((value) => (value ? JSON.parse(value) : null))
          .catch(() => null);
        setIsLogged(Boolean(storedUser));
        setUser(storedUser);
        setSessionError(true);
      } finally {
        console.log("✅ [GlobalProvider] Setting loading = false");
        setLoading(false);
        setSessionInitialized(true);
      }
    };

    fetchUser();
  }, []);

  const retrySessionCheck = async () => {
    setLoading(true);
    try {
      await migrateLegacyOAuthTokens();
      const currentUser = await getCurrentUser(true);
      setUser(currentUser);
      setIsLogged(Boolean(currentUser));
      setIsGuest(false);
      setSessionError(false);
      return currentUser;
    } catch (error) {
      console.error("Customer session retry failed:", error.message);
      setSessionError(true);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // A new function to check for an existing session
  const checkActiveAppwriteSession = async () => {
    try {
      const user = await getGuestUser(); // Attempt to get the current user
      return user; // Return the user object if successful
    } catch (error) {
      // If there's an error, it likely means no active session
      console.warn("No active Appwrite session found.");
      return null; // Return null to indicate no session
    }
  };

  const startGuestSessionFlow = async () => {
    // No longer automatically create guest sessions
    // Users can browse without authentication
    setLoading(true);
    try {
      // 1. Check for an active session first
      const activeSessionUser = await checkActiveAppwriteSession();

      if (activeSessionUser) {
        // 2. If a session is found, handle the user state
        console.log("Active session already exists. Handling user data.");
        setIsLogged(true);
        setUser(activeSessionUser);
        // Determine if the existing session is a guest session
        setIsGuest(activeSessionUser.provider === "anonymous");
        return activeSessionUser;
      } else {
        // 3. No session found - user can browse without authentication
        console.log(
          "No active session. User can browse without authentication.",
        );
        setIsLogged(false);
        setIsGuest(false);
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Failed to handle user session:", error);
      // Don't throw error - allow browsing without auth
      setIsLogged(false);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /*  const startGuestSessionFlow = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser.provider === 'anonymous') {
        await AsyncStorage.setItem('isGuest', 'true');
        setIsGuest(true);
      }

      return currentUser;
      
    } catch (error) {
      try {
      const guestSession = await createGuestSession();
      setIsGuest(true);
      return guestSession;

      } catch (error) {
      throw new Error('Failed to Create a new guest Session.')
    }
  }

} */

  /*   const startGuestSessionFlow = async () => {
    try {
      const currentUser = await account.get();
      if (currentUser && currentUser.provider !== 'anonymous') {
        console.log('Regular user session active. Consider prompting logout.');
        throw new Error('Regular user session active.');
      } else if (currentUser && currentUser.provider === 'anonymous') {
        console.log('Existing anonymous session found. Reusing.');
        await AsyncStorage.setItem('isGuest', 'true');
        setIsGuest(true);
        return currentUser;
      } else {
        // Implement your guest session creation logic here:
        // const guestUser = await createGuestSession();
        // await AsyncStorage.setItem('isGuest', 'true');
        // setIsGuest(true);
        // return guestUser;
        throw new Error('Guest session creation not implemented.');
      }
    } catch (error) {
      console.error('Error starting guest session flow:', error);
      throw error;
    }
  }; */

  const handleLogout = async () => {
    try {
      await unregisterPushToken();
      const refreshToken = await SecureStore.getItemAsync("oauthRefreshToken");
      await axiosClient.post(
        "/api/v1/customerauth/logoutCustomer",
        refreshToken ? { refreshToken } : {},
      );

      // Clear local storage
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("isGuest");
      await AsyncStorage.multiRemove(["oauthAccessToken", "oauthRefreshToken"]);
      await SecureStore.deleteItemAsync("oauthAccessToken");
      await SecureStore.deleteItemAsync("oauthRefreshToken");

      setIsLogged(false);
      setUser(null);
      setIsGuest(false);
      setPickupAddress(null);

      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
      throw new Error("Sign out failed. Your session is still active. Please retry.");
    }
  };

  const contextValue = useMemo(
    () => ({
      isLogged,
      setIsLogged,
      user,
      setUser,
      loading,
      sessionInitialized,
      sessionError,
      retrySessionCheck,
      pickupAddress,
      pickupAddressLoading,
      pickupAddressError,
      retryPickupAddressCheck,
      savePickupAddress,
      isGuest,
      setIsGuest,
      startGuestSessionFlow,
      handleLogout,
    }),
    [
      isLogged,
      user,
      loading,
      sessionInitialized,
      sessionError,
      retrySessionCheck,
      isGuest,
      pickupAddress,
      pickupAddressLoading,
      pickupAddressError,
    ],
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
