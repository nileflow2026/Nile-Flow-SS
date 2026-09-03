/* eslint-disable no-unused-vars */
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";
import { useCart } from "../../Context/CartContext_NEW";
import { useFavorites } from "../../Context/FavoritesContext";
import { useGroupBuy } from "../../Context/GroupBuyContext";
import {
  fetchReviews,
  fetchUserId,
  fetchUserName,
  submitReview,
  useGlobalContext,
} from "../../Context/GlobalProvider";
import CustomAlertReview from "../components/CustomAlertReview";
import RatingModal from "../components/RatingModal";
import RelatedProducts from "../components/RelatedProducts";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import * as FileSystem from "expo-file-system/";
import * as Sharing from "expo-sharing";

/* import GroupBuyCard from "../components/GroupBuyCard";
import GroupBuyStarter from "../components/GroupBuyStarter"; */

const { width } = Dimensions.get("window");

// Premium StarRating Component
const StarRating = ({
  rating,
  size = "md",
  interactive = false,
  onRatingSelect,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
    xl: { width: 40, height: 40 },
  };

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onRatingSelect?.(star)}
            onPressIn={() => interactive && setHoverRating(star)}
            onPressOut={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <MaterialIcons
              name={isFilled ? "star" : "star-border"}
              size={sizes[size].width}
              color={isFilled ? "#D97706" : "#6b7280"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ProductDetails = () => {
  const router = useRouter();

  const params = useLocalSearchParams();
  const { item } = params;
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const initialReviewCount = 2;
  // Memoize displayedReviews to avoid recalculation on every render
  const displayedReviews = useMemo(() => {
    return showAllReviews
      ? reviews
      : reviews
        ? reviews.slice(0, initialReviewCount)
        : [];
  }, [showAllReviews, reviews, initialReviewCount]);
  const { user, isLogged } =
    useGlobalContext(); /* console.log("User in ProductDetails:", user); // Log user object for debugging */

  // Debug: Log navigation params
  useEffect(() => {
    console.log("=== ProductDetails Params ===");
    console.log("Full params:", params);
    console.log("item param:", item);
    console.log("item type:", typeof item);
  }, [item, params]);
  const [ratings, setRatings] = useState({});
  const [selectedRating, setSelectedRating] = useState(null);
  const [isSignUpModalVisible, setIsSignUpModalVisible] = useState(false);
  const { fetchActiveGroups, productGroups } = useGroupBuy();
  /* const [showGroupStarter, setShowGroupStarter] = useState(false); */
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(null);
  const [fetchedImages, setFetchedImages] = useState(null); // null = not yet fetched
  const [selectedVariants, setSelectedVariants] = useState({});
  const imageScrollRef = useRef(null);

  let product = item;
  // Check if item is a string and parse it to object

  if (typeof item === "string") {
    try {
      product = JSON.parse(item); // Try parsing if it's a string
      console.log("✅ Successfully parsed product from item string");
    } catch (error) {
      console.error("❌ Error parsing product:", error);
      product = null; // Set to null in case of parsing error
    }
  }

  // Ensure product is always an object (never undefined)
  if (!product) {
    product = null;
  }

  const productAttributes = typeof product?.specifications === "string"
    ? (() => {
        try { return JSON.parse(product.specifications); } catch { return {}; }
      })()
    : (product?.attributes || {});
  const variantOptions = Object.entries(productAttributes)
    .filter(([key, value]) => ["color", "size"].includes(key) && value)
    .reduce((options, [key, value]) => ({
      ...options,
      [key]: String(value).split(",").map((option) => option.trim()).filter(Boolean),
    }), {});

  // Log final product state for debugging
  useEffect(() => {
    console.log("=== Product State ===");
    console.log("product:", product);
    console.log("product?.$id:", product?.$id);
    console.log("product?.productName:", product?.productName);
  }, [product]);

  // Numeric base price (KES) — handles both plain number and enriched price object
  const numericPrice = useMemo(() => {
    if (!product?.price) return 0;
    if (typeof product.price === "object")
      return product.price.raw ?? product.price.basePrice ?? 0;
    return parseFloat(product.price) || 0;
  }, [product?.price]);

  // Real average rating computed from fetched reviews
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  }, [reviews]);

  // All images for the gallery — prefers server-fetched data, normalizes objects to URL strings
  const allImages = useMemo(() => {
    // Helper: extract URL string from an image that may be:
    //   - a plain URL string
    //   - a JSON-stringified object like '{"url":"http://..."}'
    //   - an object like { url, id, filename, ... }
    const toUrl = (img) => {
      if (!img) return null;
      if (typeof img === "object") return img.url ?? null;
      if (typeof img === "string") {
        // Try JSON parse — Appwrite sometimes stores uploaded image objects as JSON strings
        try {
          const parsed = JSON.parse(img);
          if (parsed && typeof parsed === "object" && parsed.url)
            return parsed.url;
        } catch (_) {}
        return img; // It's a plain URL string
      }
      return null;
    };

    // Prefer freshly fetched images (from the /product/:id/images endpoint)
    if (fetchedImages && fetchedImages.length > 0) return fetchedImages;

    // Fall back to what was passed via navigation params
    if (product?.images?.length > 0) {
      const normalized = product.images.map(toUrl).filter(Boolean);
      if (normalized.length > 0) return normalized;
    }
    if (product?.image) return [product.image];
    return [];
  }, [fetchedImages, product]);

  // Now you can safely use 'product' (it will be an object or null)
  useEffect(() => {
    if (user) {
      console.log("User ID in useEffect:", user.id);
    }
  }, [user]); // Logs whenever user changes

  // Load initial reviews for the product
  useEffect(() => {
    const loadReviews = async () => {
      if (product?.$id) {
        try {
          const productReviews = await fetchReviews(product.$id);
          console.log("Raw reviews data:", productReviews); // Debug log

          // Transform reviews to ensure proper field mapping
          const transformedReviews = (productReviews || []).map((review) => {
            const userName =
              review.userName ||
              review.username ||
              review.user_name ||
              "Anonymous";

            return {
              id: review._id || review.$id || review.id,
              userName,
              text:
                review.reviewText || review.text || review.review_text || "",
              rating: review.rating || 0,
              date:
                review.date ||
                (review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString()
                  : new Date().toLocaleDateString()),
              avatarUrl:
                review.avatarUrl || review.avatar_url || review.avatar || null,
            };
          });

          setReviews(transformedReviews);
        } catch (error) {
          console.error("Error loading initial reviews:", error);
          setReviews([]);
        }
      }
    };
    loadReviews();
  }, [product?.$id]); // Only run when product ID changes

  // A new useEffect to handle related products' ratings
  useEffect(() => {
    if (product?.$id) {
      fetchActiveGroups(product.$id).catch(() => {});
    }
    // This is a single, combined function to handle all related product logic
    // This optimized function handles clean server-side scoped filtering
    const fetchRelatedData = async () => {
      if (!product?.categoryId) return;

      let related = [];
      try {
        const response = await axiosClient.get(
          `/api/customerprofile/fetch-product-mobile`,
          {
            params: {
              limit: 15, // Ask for slightly fewer items since it's already filtered
              category: product.categoryId, // Prefilter directly on the database level!
            },
          },
        );

        if (Array.isArray(response.data?.products)) {
          // Exclude only the current active item out of the structured list
          related = response.data.products
            .filter((p) => p.$id !== product.$id)
            .slice(0, 10);
        }
      } catch (error) {
        console.error("❌ Error fetching optimized related products:", error);
      }

      // Use pre-bundled data fields with zero additional iteration
      const ratingsData = {};
      related.forEach((p) => {
        ratingsData[p.$id] = {
          averageRating: p.avgRating ?? 0,
          totalCount: p.totalRatings ?? 0,
        };
      });

      setRelatedProducts(related);
      setRatings(ratingsData);
    };

    if (product?.category && product?.$id) {
      fetchRelatedData();
    }
  }, [product, fetchActiveGroups]);

  // Removed duplicate fetchAllRatings useEffect - ratings are already fetched for related products above

  // Derived price string — computed directly, no setState in effect needed
  const convertedPrice = useMemo(() => {
    if (!product?.price) return "";
    // Handle enriched price object from the backend currency middleware
    if (typeof product.price === "object" && product.price.displayValue) {
      return product.price.displayValue;
    }
    return `$${(parseFloat(product.price) || 0).toFixed(2)}`;
  }, [product?.price]);

  // Fetch all images for this product from the server (main + vendor collections)
  useEffect(() => {
    if (!product?.$id) return;
    axiosClient
      .get(`/api/customerprofile/product/${product.$id}/images`)
      .then((res) => {
        if (res.data?.images?.length > 0) {
          setFetchedImages(res.data.images);
        }
      })
      .catch(() => {
        // Non-fatal — gallery falls back to navigation param images
      });
  }, [product?.$id]);

  // Fetch full product details from API when product ID changes
  // This ensures we have all fields (price, details, brand, stock, etc.)
  useEffect(() => {
    const pid = product?.$id;
    if (!pid) return;

    let cancelled = false;
    const fetchFullProductDetails = async () => {
      try {
        console.log(`📥 Fetching full product details for $id: ${pid}`);
        const response = await axiosClient.get(
          `/api/customerprofile/product/${pid}`,
        );

        if (cancelled) return;

        if (response.data?.product) {
          console.log("✅ Full product data loaded");
        }
      } catch (error) {
        console.warn("⚠️ Could not fetch full product details:", error.message);
        // Non-fatal - use what we have from navigation params
      }
    };

    fetchFullProductDetails();
    return () => {
      cancelled = true;
    };
  }, [product?.$id]);

  const handletogglefavorite = useCallback(() => {
    if (!product?.$id) {
      Alert.alert("Error", "Product information is not available.");
      return;
    }
    if (isFavorite(product.$id)) {
      removeFromFavorites(product.$id);
    } else {
      addToFavorites(product);
    }
  }, [product, isFavorite, removeFromFavorites, addToFavorites]);

  const handleImageNavigation = useCallback(
    (direction) => {
      if (allImages.length <= 1) return;

      let newIndex;
      if (direction === "next") {
        newIndex = (currentImageIndex + 1) % allImages.length;
      } else {
        newIndex =
          currentImageIndex === 0
            ? allImages.length - 1
            : currentImageIndex - 1;
      }

      setCurrentImageIndex(newIndex);
      setActiveImage(allImages[newIndex]);
      imageScrollRef.current?.scrollTo({
        x: newIndex * (width - 32),
        animated: true,
      });
    },
    [currentImageIndex, allImages],
  );

  const handleRatingSubmit = useCallback(
    async (rating) => {
      if (!isLogged) {
        setIsSignUpModalVisible(true); // Show sign-up modal for rating
        return;
      }
      try {
        const userName = await fetchUserName();
        const userId = await fetchUserId();

        if (!userId) {
          console.error("Failed to fetch user ID. Review cannot be submitted.");
          return;
        }
        if (!user) {
          Alert.alert(
            "Login Required",
            "You need to log in to rate this product.",
          );
          return;
        }

        const selectedRating = parseInt(rating, 10) || 5;
        const token = await AsyncStorage.getItem("accessToken");

        // Construct review object
        const reviewData = {
          productId: product.$id || "unknown",
          userId: String(userId) || "unknown",
          userName: userName || "Anonymous",
          reviewText,
          rating: selectedRating,
          createdAt: new Date().toISOString(),
        };

        console.log("Review Data being sent:", reviewData);

        // Validate before sending
        if (!reviewData.productId || !reviewData.userId || !reviewData.rating) {
          console.error("Missing required fields:", reviewData);
          Alert.alert("Error", "Missing required review details.");
          return;
        }

        // Submit the review to Appwrite
        const response = await axiosClient.post(
          "/api/customerprofile/sumbitRating",
          reviewData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("Review submitted successfully:", response);

        if (response) {
          Alert.alert(
            "Thank You",
            `You rated this product ${selectedRating} stars.`,
          );
          const updatedReviews = await fetchReviews(product.$id);

          // Transform reviews after refresh
          const transformedReviews = (updatedReviews || []).map((review) => ({
            id: review._id || review.$id || review.id,
            userName:
              review.userName ||
              review.username ||
              review.user_name ||
              "Anonymous",
            text: review.reviewText || review.text || review.review_text || "",
            rating: review.rating || 0,
            date:
              review.date ||
              (review.createdAt
                ? new Date(review.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString()),
            avatarUrl:
              review.avatarUrl || review.avatar_url || review.avatar || null,
          }));

          setReviews(transformedReviews);
        }
      } catch (error) {
        console.error("Failed to submit rating:", error);
        Alert.alert(
          "Error",
          "An error occurred while submitting your rating. Please try again.",
        );
      }
    },
    [isLogged, user, product, reviewText],
  );

  const handleAddReview = useCallback(async () => {
    if (!isLogged) {
      setIsSignUpModalVisible(true); // Show sign-up modal for review5
      return;
    }
    try {
      console.log(
        "Product ID:",
        product && product.$id ? product.$id : "Product ID is missing",
      );
      const userId = user?.$id || (await fetchUserId());

      if (!userId) {
        console.error("User is not logged in or ID is missing");
        Alert.alert("Login Required", "You need to log in to post a review.");
        return;
      }

      if (!product || !product.$id) {
        console.error("Product is missing or ID is undefined");
        return;
      }

      const cleanedReviewText = reviewText.trim();
      let imageFileId = null;

      // Image upload temporarily disabled - can be re-enabled when uploadFile is implemented
      // if (selectedImage) {
      //   const file = {
      //     uri: selectedImage,
      //     mimeType: "image/jpeg",
      //     name: "review_image.jpg",
      //   };
      //   try {
      //     const uploadedFileId = await uploadFile(file, "image");
      //     if (uploadedFileId) {
      //       imageFileId = uploadedFileId;
      //     }
      //   } catch (error) {
      //     console.error("Error uploading file:", error);
      //   }
      // }

      // Rating processing and validation
      let validatedRating = null;
      if (selectedRating !== null && selectedRating !== undefined) {
        const parsedRating = Number(selectedRating);
        if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
          validatedRating = parsedRating;
        } else {
          console.warn(
            "Invalid selected rating:",
            selectedRating,
            ". Review submitted without rating.",
          );
        }
      }
      await submitReview({
        productId: product.$id,
        reviewText: cleanedReviewText,
        rating: validatedRating,
        imageFileId, // shorthand for imageFileId: imageFileId
      });

      setReviewText("");
      setSelectedImage(null);

      // Refresh reviews
      const updatedReviews = await fetchReviews(product.$id);

      // Transform reviews after refresh
      const transformedReviews = (updatedReviews || []).map((review) => ({
        id: review._id || review.$id || review.id,
        userName:
          review.userName || review.username || review.user_name || "Anonymous",
        text: review.reviewText || review.text || review.review_text || "",
        rating: review.rating || 0,
        date:
          review.date ||
          (review.createdAt
            ? new Date(review.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString()),
        avatarUrl:
          review.avatarUrl || review.avatar_url || review.avatar || null,
      }));

      setReviews(transformedReviews);
    } catch (error) {
      console.error("Failed to add review:", error);
    }
  }, [isLogged, user, product, reviewText, selectedRating]);

  // Edit and delete handlers are defined when ReviewList component supports onEdit/onDelete props

  const handleIPickimage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Adjust quality as needed
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const closeSignUpModal = () => {
    setIsSignUpModalVisible(false);
  };

  const navigateToSignUp = () => {
    router.push("/(auth)/sign-up"); // Replace "SignUpScreen" with your actual sign-up route
    setIsSignUpModalVisible(false);
  };

  // Memoize responsive styles for better performance
  const responsiveStyles = useMemo(
    () => ({
      titleFontSize: width < 350 ? 18 : 20,
      priceFontSize: width < 350 ? 16 : 18,
      descFontSize: width < 350 ? 14 : 16,
      reviewFontSize: width < 350 ? 14 : 16,
      buttonFontSize: width < 350 ? 16 : 11,
      buttonFont: width < 350 ? 16 : 13,
      paddingHorizontal: width < 350 ? 12 : 16,
      paddingVertical: width < 350 ? 8 : 12,
      paddingVerticalButton: width < 350 ? 8 : 10,
      marginVertical: width < 350 ? 8 : 12,
    }),
    [],
  );

  // Guard: Show error if product is not available
  if (!product) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#111827",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Product Not Found
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#6B7280",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          The product information could not be loaded. Please go back and try
          again.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#16A34A",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Product Details</Text>
          <Text style={styles.headerSubtitle}> Premium African Products</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="w-full">
          {/* Swipeable Image Gallery */}
          <View
            style={{
              height: 400,
              backgroundColor: "#F3F4F6",
              borderRadius: 24,
              overflow: "hidden",
              marginHorizontal: 16,
              marginTop: 1,
            }}
          >
            {/* Horizontal paged ScrollView — swipe between images */}
            <ScrollView
              ref={imageScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={allImages.length > 1}
              nestedScrollEnabled={true}
              disableScrollViewPanResponder={true}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(
                  e.nativeEvent.contentOffset.x / (width - 32),
                );
                if (newIndex !== currentImageIndex) {
                  setCurrentImageIndex(newIndex);
                  setActiveImage(allImages[newIndex]);
                }
              }}
              style={{ flex: 1 }}
            >
              {allImages.length > 0 ? (
                allImages.map((img, index) => (
                  <View
                    key={index}
                    style={{
                      width: width - 32,
                      height: 400,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={{ uri: imageForSize(img, IMAGE_SIZE.LARGE) }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                      recyclingKey={`pd-img-${img}`}
                    />
                  </View>
                ))
              ) : (
                <View
                  style={{
                    width: width - 32,
                    height: 400,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons
                    name="image-not-supported"
                    size={64}
                    color="#374151"
                  />
                </View>
              )}
            </ScrollView>

            {/* Wishlist Button */}
            <TouchableOpacity
              onPress={handletogglefavorite}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                width: 40,
                height: 40,
                backgroundColor:
                  product?.$id && isFavorite(product.$id)
                    ? "#dc2626"
                    : "rgba(0,0,0,0.8)",
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons
                name={
                  product?.$id && isFavorite(product.$id)
                    ? "favorite"
                    : "favorite-border"
                }
                size={22}
                color={
                  product?.$id && isFavorite(product.$id) ? "#fff" : "#D97706"
                }
              />
            </TouchableOpacity>

            {/* Dot indicators — only shown when there are multiple images */}
            {allImages.length > 1 && (
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 6,
                  zIndex: 10,
                }}
              >
                {allImages.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === currentImageIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        i === currentImageIndex
                          ? "#D97706"
                          : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </View>
            )}
          </View>
          <CustomAlertReview
            isVisible={isSignUpModalVisible}
            onClose={closeSignUpModal}
            onSignUp={navigateToSignUp}
          />
          {/* Premium Product Info */}
          <View style={{ padding: 16, marginTop: 16 }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                alignSelf: "flex-start",
                marginBottom: 16,
                backgroundColor: "#FEF3C7",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <MaterialIcons name="stars" size={16} color="#D97706" />
                <Text
                  style={{ color: "#D97706", fontSize: 12, fontWeight: "bold" }}
                >
                  Premium Collection
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              {product?.productName || product?.name || "Product"}
            </Text>

            {/* Rating */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <StarRating rating={averageRating} size="lg" />
              <Text style={{ color: "#374151" }}>
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </Text>
            </View>

            {/* Vendor / Brand Info */}
            {(product?.vendorName || product?.brand) && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {product?.brand && (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: "#F0FDF4",
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                    }}
                  >
                    <Text
                      style={{ color: "#16A34A", fontSize: 14, fontWeight: "600" }}
                    >
                      Brand: {product.brand}
                    </Text>
                  </View>
                )}
                {/* Visit Store CTA */}
                {(product?.vendorId) && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(Screens)/VendorStore",
                        params: { vendorId: product.vendorId },
                      })
                    }
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: "#FEF3C7",
                      borderWidth: 1,
                      borderColor: "#FDE68A",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MaterialIcons name="store" size={16} color="#D97706" />
                    <Text style={{ color: "#D97706", fontSize: 13, fontWeight: "600" }}>
                      Visit Store
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Description */}
            <Text
              style={{
                color: "#374151",
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 16,
              }}
            >
              {product?.details ||
                product?.description ||
                "Premium product with quality craftsmanship"}
            </Text>

            {/* Price Section */}
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ fontSize: 32, fontWeight: "bold", color: "#D97706" }}
                >
                  {convertedPrice || "Loading..."}
                </Text>
                {product?.originalPrice && (
                  <Text
                    style={{
                      fontSize: 18,
                      color: "#9ca3af",
                      textDecorationLine: "line-through",
                    }}
                  >
                    ${product.originalPrice.toFixed(2)}
                  </Text>
                )}
              </View>

              {product?.originalPrice && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    alignSelf: "flex-start",
                    backgroundColor: "#FEE2E2",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MaterialIcons name="flash-on" size={16} color="#EF4444" />
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Save ${(product.originalPrice - numericPrice).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Quantity Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: "#D97706",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Quantity
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: "#F3F4F6",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  >
                    <Text
                      style={{
                        color: "#D97706",
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      -
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      color: "#111827",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQuantity(quantity + 1)}
                    style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  >
                    <Text
                      style={{
                        color: "#D97706",
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                  {product?.stock || "Limited"} items available
                </Text>
              </View>
            </View>

            {/* Features Grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[
                {
                  icon: "local-shipping",
                  text: "Free Shipping",
                  color: "#2563EB",
                },
                { icon: "verified", text: "Authentic", color: "#16A34A" },
                { icon: "refresh", text: "30 Days Return", color: "#D97706" },
                { icon: "security", text: "Secure Payment", color: "#7C3AED" },
              ].map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    padding: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <MaterialIcons
                    name={feature.icon}
                    size={20}
                    color={feature.color}
                  />
                  <View>
                    <Text
                      style={{
                        color: feature.color,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {feature.text.split(" ")[0]}
                    </Text>
                    <Text style={{ color: `${feature.color}80`, fontSize: 10 }}>
                      {feature.text.split(" ").slice(1).join(" ")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          {/* Modern Description Section */}
          <View style={{ padding: 16, marginTop: 16 }}>
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <MaterialIcons name="description" size={24} color="#16A34A" />
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: "#14532D" }}
                >
                  Description
                </Text>
              </View>
              <Text style={{ color: "#374151", fontSize: 16, lineHeight: 24 }}>
                {product?.details ||
                  "Premium African product with authentic craftsmanship and superior quality."}
              </Text>
            </View>
          </View>
          {/* Modern Reviews Section */}
          <View style={{ padding: 16, marginTop: 16 }}>
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                marginBottom: 20,
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialIcons name="reviews" size={24} color="#D97706" />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#14532D",
                    }}
                  >
                    Customer Reviews
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#D97706",
                    }}
                  >
                    {averageRating.toFixed(1)}
                  </Text>
                  <Text style={{ color: "#374151", fontSize: 12 }}>
                    Average Rating
                  </Text>
                </View>
              </View>

              {/* Review Form */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 16,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <MaterialIcons name="edit" size={20} color="#D97706" />
                  <Text
                    style={{
                      color: "#14532D",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Share Your Experience
                  </Text>
                </View>
                <ReviewForm
                  reviewText={reviewText}
                  setReviewText={setReviewText}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  onImagePick={handleIPickimage}
                  handleAddReview={handleAddReview}
                  onSubmit={() => {}}
                />
              </View>

              <ReviewList
                reviews={displayedReviews}
                reviewFontSize={responsiveStyles.reviewFontSize}
                showAllReviews={showAllReviews}
                setShowAllReviews={setShowAllReviews}
                initialReviewCount={initialReviewCount}
              />
            </View>
          </View>
          {Object.entries(variantOptions).length > 0 && (
            <View style={{ padding: 16 }}>
              <View
                style={{
                  padding: 20,
                  borderRadius: 20,
                  marginBottom: 16,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                {Object.entries(variantOptions).map(([key, options]) => (
                  <View key={key} style={{ marginBottom: 16 }}>
                    <Text style={{ color: "#111827", fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
                      Select {key}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {options.map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => setSelectedVariants((current) => ({ ...current, [key]: option }))}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: selectedVariants[key] === option ? "#16A34A" : "#E5E7EB",
                            backgroundColor: selectedVariants[key] === option ? "#16A34A" : "#F9FAFB",
                          }}
                        >
                          <Text style={{ color: selectedVariants[key] === option ? "#FFFFFF" : "#374151" }}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
          {/* Modern Specifications Section */}
          <View style={{ padding: 16 }}>
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#F0FDF4",
                borderWidth: 1,
                borderColor: "#BBF7D0",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <MaterialIcons name="build" size={24} color="#16A34A" />
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: "#14532D" }}
                >
                  Specifications
                </Text>
              </View>
              <Text style={{ color: "#374151", fontSize: 16, lineHeight: 24 }}>
                {product?.specifications ||
                  "Premium quality materials and craftsmanship. Authentic African design with modern functionality."}
              </Text>
            </View>
          </View>
          {/* Modern Rating Section */}
          <View style={{ padding: 16 }}>
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                marginBottom: 16,
                alignItems: "center",
                backgroundColor: "#FEF3C7",
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <MaterialIcons name="star-rate" size={24} color="#D97706" />
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: "#B45309" }}
                >
                  Rate This Product
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsRatingModalVisible(true)}
                style={{
                  backgroundColor: "#D97706",
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="star" size={20} color="#FFF" />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Rate Product
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <RatingModal
            visible={isRatingModalVisible}
            onClose={() => setIsRatingModalVisible(false)}
            onSubmit={handleRatingSubmit}
          />

          <RelatedProducts
            relatedProducts={relatedProducts}
            ratings={ratings}
          />
        </View>
      </ScrollView>

      {/* Premium Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 60,
          left: 16,
          right: 16,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (!user) {
              Alert.alert(
                "Login Required",
                "Please log in to add items to your cart.",
              );
              return;
            }
            if (product?.$id) {
              const missingVariant = Object.keys(variantOptions).find(
                (key) => !selectedVariants[key],
              );
              if (missingVariant) {
                Alert.alert("Select an option", `Please select a ${missingVariant} before adding this product.`);
                return;
              }
              addToCart(product, user.id, user.userName, selectedVariants);
            } else {
              Alert.alert("Error", "Product information is not available.");
            }
          }}
          style={{ flex: 1 }}
        >
          <View
            style={{
              paddingVertical: 16,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#16A34A",
            }}
          >
            <MaterialIcons name="shopping-bag" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              Let it Flow
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            try {
              const imageUrl = product?.imageUrl || product?.image;
              const productName =
                product?.productName || product?.name || "Product";
              const productDesc =
                product?.description || product?.details || "";
              const fallbackStoreUrl = "https://play.google.com/store/apps/details?id=com.nileflowafrica&pcampaignid=web_share";

              const appLinkUrl = product?.url || fallbackStoreUrl;
              const completeCaption = `${productName}\n\n${productDesc}\n\nCheck it out here: ${appLinkUrl}`;

              if (imageUrl) {
                // 1. Get the image file extension and sanitize the title for a safe filename
                const cleanFileExtension =
                  imageUrl.split(".").pop()?.split("?")[0] || "jpg";
                const sanitizedSystemTitle = productName
                  .replace(/[^a-zA-Z0-9]/g, "_")
                  .substring(0, 20);

                // 2. Download the image locally to the device cache as a temporary file
                const storageDestinationUri = `${FileSystem.cacheDirectory}${sanitizedSystemTitle}.${cleanFileExtension}`;
                const fileAssetResult = await FileSystem.downloadAsync(
                  imageUrl,
                  storageDestinationUri,
                );

                // 3. Share the downloaded image asset using the simplest native methods available
                if (Platform.OS === "ios") {
                  // iOS native share sheet handles the file URI and text message perfectly together
                  await Share.share({
                    message: completeCaption,
                    url: fileAssetResult.uri, // This forces the actual image to show up
                  });
                } else {
                  // Android shares the file via expo-sharing, using the title text as the bubble caption
                  await Sharing.shareAsync(fileAssetResult.uri, {
                    dialogTitle: completeCaption, // Becomes the shared caption in WhatsApp/Telegram
                    mimeType: `image/${cleanFileExtension}`,
                  });
                }
              } else {
                // Fallback simple share if there is no image at all
                await Share.share({
                  message: completeCaption,
                });
              }
            } catch (error) {
              console.log("Error sharing product:", error?.message || error);
            }
          }}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderWidth: 2,
            borderColor: "#16A34A",
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialIcons name="share" size={20} color="#16A34A" />
          <Text style={{ color: "#16A34A", fontSize: 16, fontWeight: "bold" }}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: width < 350 ? 18 : 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
});
