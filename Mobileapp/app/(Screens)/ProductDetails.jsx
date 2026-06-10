/* eslint-disable no-unused-vars */
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  BackHandler,
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
  useEffect(() => {
    const onBackPress = () => {
      // In production (APK), router.back() may fail silently if there's no
      // previous route in the native stack. When that happens, navigate
      // to the tabs home instead of letting the app exit.
      try {
        router.back();
      } catch (_) {
        router.replace("/(tabs)/BottomTabs");
      }
      return true; // prevent default behavior (exit app)
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [router]);
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
  const { user, isLogged } = useGlobalContext();

  // Debug: Log navigation params
  useEffect(() => {
    console.log("=== ProductDetails Params ===");
    console.log("Full params:", params);
    console.log("item param:", item);
    console.log("item type:", typeof item);
  }, [item, params]);
  /* console.log("User in ProductDetails:", user); // Log user object for debugging */
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
    const fetchRelatedData = async () => {
      // Step 1: Fetch related products (no category query param — avoids Appwrite index requirement)
      let related = [];
      try {
        const response = await axiosClient.get(
          `/api/customerprofile/fetch-product-mobile`,
          {
            params: {
              limit: 20,
            },
          },
        );
        if (Array.isArray(response.data?.products)) {
          // Filter by same category and exclude the current product client-side
          related = response.data.products
            .filter(
              (p) => p.category === product.category && p.$id !== product.$id,
            )
            .slice(0, 10);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
        // On error, related remains an empty array
      }

      // Step 2: Use bundled avgRating/totalRatings from fetch-product-mobile (no extra API calls)
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
              marginTop: 60,
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
                      source={{ uri: img }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="contain"
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

            {/* Premium Badge */}
            <View
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 10,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#D97706",
                }}
              >
                <MaterialIcons name="star" size={16} color="#fff" />
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                >
                  PREMIUM
                </Text>
              </View>
            </View>

            {/* Arrow buttons (complement swipe; hidden for single images) */}
            {allImages.length > 1 && (
              <>
                <TouchableOpacity
                  onPress={() => handleImageNavigation("prev")}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "40%",
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="chevron-left" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleImageNavigation("next")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "40%",
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="chevron-right" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}

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

            {/* Brand */}
            {product?.brand && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                  marginBottom: 16,
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
          {/* ── Group Buying Section ────────────────────────────────── */}
          {/* <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <View
              style={{
                backgroundColor: "#1a2e1a",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#2d4f2d",
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
                <MaterialIcons name="groups" size={20} color="#f59e0b" />
                <Text
                  style={{ color: "#f59e0b", fontSize: 16, fontWeight: "bold" }}
                >
                  Group Buying
                </Text>
              </View>

              {productGroups.length > 0 ? (
                <>
                  <Text
                    style={{ color: "#9ca3af", fontSize: 13, marginBottom: 10 }}
                  >
                    {productGroups.length} active group
                    {productGroups.length > 1 ? "s" : ""} — join and save up to{" "}
                    {productGroups[0].savingsPercent || ""}
                  </Text>
                  {productGroups.slice(0, 3).map((g) => (
                    <GroupBuyCard
                      key={g.$id}
                      group={g}
                      onPress={() =>
                        router.push({
                          pathname: "/(Screens)/GroupOrderPage",
                          params: { orderId: g.$id },
                        })
                      }
                      onJoin={() =>
                        router.push({
                          pathname: "/(Screens)/GroupOrderPage",
                          params: { orderId: g.$id },
                        })
                      }
                    />
                  ))}
                  <TouchableOpacity
                    onPress={() => setShowGroupStarter(true)}
                    style={{ marginTop: 8, alignItems: "center" }}
                  >
                    <Text
                      style={{
                        color: "#f59e0b",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      + Start a new group
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text
                    style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}
                  >
                    No active groups yet. Start one and invite friends to unlock
                    a group price!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGroupStarter(true)}
                    style={{
                      backgroundColor: "#f59e0b",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <MaterialIcons name="add" size={18} color="#000" />
                    <Text
                      style={{
                        color: "#000",
                        fontWeight: "bold",
                        fontSize: 15,
                      }}
                    >
                      Start a Group Buy
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <GroupBuyStarter
            visible={showGroupStarter}
            onClose={() => setShowGroupStarter(false)}
            product={product}
            onCreated={(group) => {
              setShowGroupStarter(false);
              router.push({
                pathname: "/(Screens)/GroupOrderPage",
                params: { orderId: group.$id },
              });
            }}
          /> */}

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
          bottom: 20,
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
              addToCart(product, user.id, user.userName);
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
              const shareMessage = `${product?.productName || product?.name || "Product"}\n\n${product?.description || product?.details || ""}\n\nCheck it out here: ${product?.url || "https://nileflowafrica.com"}\n\nImage: ${product?.image || ""}`;
              if (Platform.OS === "ios") {
                // iOS handles URL better when passed separately
                await Share.share({
                  message: shareMessage,
                  url: product?.imageUrl || product?.image, // May be previewed in iMessage
                });
              } else {
                // Android works best with full text in one message
                await Share.share({
                  message: shareMessage,
                });
              }
            } catch (error) {
              console.log("Error sharing product:", error);
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
