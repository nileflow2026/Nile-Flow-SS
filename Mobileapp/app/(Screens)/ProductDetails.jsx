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
  Animated,
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
import images from "../../constants/images";
import { useCart } from "../../Context/CartContext_NEW";
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

const COLOR_SWATCHES = {
  black: "#111827",
  white: "#FFFFFF",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#FACC15",
  orange: "#F97316",
  purple: "#A855F7",
  pink: "#EC4899",
  brown: "#92400E",
  gold: "#D4AF37",
  goldbrown: "#B8860B",
  "gold brown": "#B8860B",
  grey: "#6B7280",
  gray: "#6B7280",
  silver: "#C0C0C0",
  beige: "#D6C6A5",
  cream: "#FFFDD0",
  "light blue": "#ADD8E6",
  lightblue: "#ADD8E6",
  navy: "#1E3A8A",
  maroon: "#7F1D1D",
};

const getColorSwatch = (value) => {
  const normalized = String(value).trim().toLowerCase();
  const compact = normalized.replace(/[\s_-]+/g, "");
  if (/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(normalized)) return normalized;
  return COLOR_SWATCHES[normalized] || COLOR_SWATCHES[compact] || "#D1D5DB";
};

const parseProductAttributes = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

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
 /*  useEffect(() => {
    console.log("=== ProductDetails Params ===");
    console.log("Full params:", params);
    console.log("item param:", item);
    console.log("item type:", typeof item);
  }, [item, params]); */
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
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [purchaseAction, setPurchaseAction] = useState(null);
  const purchaseProgress = useRef(new Animated.Value(0)).current;
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

  if (
    fetchedProduct &&
    String(fetchedProduct.$id || fetchedProduct.id) ===
      String(product?.$id || product?.id)
  ) {
    product = fetchedProduct;
  }

  const attributes = parseProductAttributes(product?.attributes);
  const productAttributes =
    Object.keys(attributes).length > 0
      ? attributes
      : parseProductAttributes(product?.specifications);
  const variantOptions = Object.entries(productAttributes)
    .filter(([key, value]) => ["color", "size"].includes(key.toLowerCase()) && value)
    .reduce((options, [key, value]) => {
      const values = Array.isArray(value) ? value : String(value).split(",");
      const normalizedValues = values
        .map((option) => String(option).trim())
        .filter(Boolean);
      if (normalizedValues.length > 0) options[key] = normalizedValues;
      return options;
    }, {});
  const colorVariant = Object.entries(variantOptions).find(
    ([key]) => key.toLowerCase() === "color",
  );
  const sizeVariant = Object.entries(variantOptions).find(
    ([key]) => key.toLowerCase() === "size",
  );

  // Log final product state for debugging
  /* useEffect(() => {
    console.log("=== Product State ===");
    console.log("product:", product);
    console.log("product?.$id:", product?.$id);
    console.log("product?.productName:", product?.productName);
  }, [product]); */

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
    const pid = product?.$id || product?.id;
    if (!pid) return;

    let cancelled = false;
    const fetchFullProductDetails = async () => {
      try {
        console.log(`📥 Fetching full product details for $id: ${pid}`);
        const response = await axiosClient.get(
          "/api/customerprofile/fetch-product",
          { params: { productId: pid } },
        );

        if (cancelled) return;

        const fullProduct = response.data?.products?.[0];
        if (
          fullProduct &&
          String(fullProduct.$id || fullProduct.id) === String(pid)
        ) {
          setFetchedProduct(fullProduct);
          console.log("✅ Full product data loaded");
        } else {
          console.warn(`⚠️ No full product details returned for $id: ${pid}`);
        }
      } catch (error) {
        console.warn("⚠️ Could not fetch full product details:", error.message);
        // Non-fatal because navigation already provides a product summary.
      }
    };

    fetchFullProductDetails();
    return () => {
      cancelled = true;
    };
  }, [product?.$id, product?.id]);

  const handleShareProduct = useCallback(async () => {
    try {
      const imageUrl = product?.imageUrl || product?.image;
      const productName = product?.productName || product?.name || "Product";
      const productDesc = product?.description || product?.details || "";
      const fallbackStoreUrl =
        "https://play.google.com/store/apps/details?id=com.nileflowafrica&pcampaignid=web_share";
      const appLinkUrl = product?.url || fallbackStoreUrl;
      const completeCaption = `${productName}\n\n${productDesc}\n\nCheck it out here: ${appLinkUrl}`;

      if (imageUrl) {
        const cleanFileExtension =
          imageUrl.split(".").pop()?.split("?")[0] || "jpg";
        const sanitizedSystemTitle = productName
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 20);
        const storageDestinationUri = `${FileSystem.cacheDirectory}${sanitizedSystemTitle}.${cleanFileExtension}`;
        const fileAssetResult = await FileSystem.downloadAsync(
          imageUrl,
          storageDestinationUri,
        );

        if (Platform.OS === "ios") {
          await Share.share({
            message: completeCaption,
            url: fileAssetResult.uri,
          });
        } else {
          await Sharing.shareAsync(fileAssetResult.uri, {
            dialogTitle: completeCaption,
            mimeType: `image/${cleanFileExtension}`,
          });
        }
      } else {
        await Share.share({ message: completeCaption });
      }
    } catch (error) {
      console.error("Error sharing product:", error?.message || error);
      Alert.alert("Unable to share", "Please try sharing this product again.");
    }
  }, [product]);

  useEffect(() => {
    if (!purchaseAction) {
      purchaseProgress.stopAnimation();
      purchaseProgress.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(purchaseProgress, {
          toValue: 0.82,
          duration: 1120,
          useNativeDriver: false,
        }),
        Animated.timing(purchaseProgress, {
          toValue: 0.94,
          duration: 480,
          useNativeDriver: false,
        }),
        Animated.timing(purchaseProgress, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [purchaseAction, purchaseProgress]);

  const handleAddProductToCart = useCallback(async () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to your cart.");
      return;
    }
    if (!product?.$id && !product?.id) {
      Alert.alert("Error", "Product information is not available.");
      return;
    }

    const missingVariant = Object.keys(variantOptions).find(
      (key) => !selectedVariants[key],
    );
    if (missingVariant) {
      Alert.alert(
        "Select an option",
        `Please select a ${missingVariant} before adding this product.`,
      );
      return;
    }

    setPurchaseAction("adding");
    try {
      await addToCart(product, user.id, user.userName, selectedVariants);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      Alert.alert("Unable to add to cart", "Please try again.");
    } finally {
      setPurchaseAction(null);
    }
  }, [user, product, variantOptions, selectedVariants, addToCart]);

  const handleBuyNow = useCallback(async () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to purchase this product.");
      return;
    }
    if (!product?.$id && !product?.id) {
      Alert.alert("Error", "Product information is not available.");
      return;
    }

    const missingVariant = Object.keys(variantOptions).find(
      (key) => !selectedVariants[key],
    );
    if (missingVariant) {
      Alert.alert(
        "Select an option",
        `Please select a ${missingVariant} before purchasing this product.`,
      );
      return;
    }

    setPurchaseAction("buying");
    try {
      const added = await addToCart(
        product,
        user.id,
        user.userName,
        selectedVariants,
      );
      if (added) router.push("/(Screens)/Cart");
    } catch (error) {
      console.error("Error preparing product purchase:", error);
      Alert.alert("Unable to buy now", "Please try again.");
    } finally {
      setPurchaseAction(null);
    }
  }, [user, product, variantOptions, selectedVariants, addToCart, router]);

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

  const handleThumbnailPress = useCallback(
    (index) => {
      setCurrentImageIndex(index);
      setActiveImage(allImages[index]);
      imageScrollRef.current?.scrollTo({
        x: index * (width - 32),
        animated: true,
      });
    },
    [allImages],
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

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShareProduct}
              accessibilityRole="button"
              accessibilityLabel="Share product"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                width: 40,
                height: 40,
                backgroundColor: "rgba(0,0,0,0.8)",
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="share" size={22} color="#FFFFFF" />
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
          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 2,
              }}
              style={{ marginTop: 12 }}
            >
              {allImages.map((img, index) => {
                const isSelected = index === currentImageIndex;
                return (
                  <TouchableOpacity
                    key={`${img}-${index}`}
                    onPress={() => handleThumbnailPress(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select image ${index + 1}`}
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? "#D97706" : "#E5E7EB",
                      overflow: "hidden",
                      opacity: isSelected ? 1 : 0.72,
                    }}
                  >
                    <Image
                      source={{ uri: imageForSize(img, IMAGE_SIZE.SMALL) }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={`pd-thumb-${img}`}
                      accessible={false}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
         <View style={{ padding: 16,  }}>
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

          </View>

          <CustomAlertReview
            isVisible={isSignUpModalVisible}
            onClose={closeSignUpModal}
            onSignUp={navigateToSignUp}
          />
          {/*Product Info */}
          <View style={{ padding: 16,  }}>

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

            {/* Available Product Colors */}
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
                  <MaterialIcons name="palette" size={24} color="#16A34A" />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#14532D",
                    }}
                  >
                    Available Options
                  </Text>
                </View>
                {colorVariant ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {colorVariant[1].map((color) => {
                      const isSelected =
                        selectedVariants[colorVariant[0]] === color;
                      return (
                        <TouchableOpacity
                          key={color}
                          onPress={() =>
                            setSelectedVariants((current) => ({
                              ...current,
                              [colorVariant[0]]: color,
                            }))
                          }
                          accessibilityRole="radio"
                          accessibilityLabel={`Select color ${color}`}
                          accessibilityState={{ checked: isSelected }}
                          style={{
                            minHeight: 44,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 22,
                            borderWidth: 1,
                            borderColor: isSelected ? "#16A34A" : "#E5E7EB",
                            backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
                          }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: getColorSwatch(color),
                              borderWidth: 1,
                              borderColor: "#D1D5DB",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && (
                              <MaterialIcons
                                name="check"
                                size={15}
                                color={
                                  ["white", "yellow", "cream", "beige"].includes(
                                    color.toLowerCase(),
                                  )
                                    ? "#111827"
                                    : "#FFFFFF"
                                }
                              />
                            )}
                          </View>
                          <Text
                            style={{
                              color: "#374151",
                              fontSize: 14,
                              fontWeight: isSelected ? "600" : "400",
                            }}
                          >
                            {color}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text
                    style={{ color: "#6B7280", fontSize: 14, lineHeight: 20 }}
                  >
                    No color options are listed for this product.
                  </Text>
                )}
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#BBF7D0",
                  }}
                >
                  <Text
                    style={{
                      color: "#14532D",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 10,
                    }}
                  >
                    Available Sizes
                  </Text>
                  {sizeVariant ? (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      {sizeVariant[1].map((size) => {
                        const isSelected =
                          selectedVariants[sizeVariant[0]] === size;
                        return (
                          <TouchableOpacity
                            key={size}
                            onPress={() =>
                              setSelectedVariants((current) => ({
                                ...current,
                                [sizeVariant[0]]: size,
                              }))
                            }
                            accessibilityRole="radio"
                            accessibilityLabel={`Select size ${size}`}
                            accessibilityState={{ checked: isSelected }}
                            style={{
                              minWidth: 48,
                              minHeight: 44,
                              paddingHorizontal: 14,
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isSelected ? "#16A34A" : "#E5E7EB",
                              backgroundColor: isSelected
                                ? "#16A34A"
                                : "#FFFFFF",
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? "#FFFFFF" : "#374151",
                                fontSize: 14,
                                fontWeight: isSelected ? "600" : "500",
                              }}
                            >
                              {size}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      No size options are listed for this product.
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View
              style={{
                padding: 16,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#BBF7D0",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#DCFCE7",
                  }}
                  accessible={false}
                >
                  <MaterialIcons name="lock" size={16} color="#15803D" />
                </View>
                <Text
                  style={{
                    color: "#111827",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Secure checkout with
                </Text>
              </View>

              <View
                accessibilityLabel="Accepted payment methods"
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {[
                  { source: images.visa, label: "Visa" },
                  { source: images.mastercard, label: "Mastercard" },
                  { source: images.mpesa, label: "M Pesa" },
                  { source: images.pesapal, label: "Pesapal" },
                ].map((paymentMethod) => (
                  <View
                    key={paymentMethod.label}
                    style={{
                      height: 36,
                      minWidth: 56,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor:
                        paymentMethod.label === "Pesapal"
                          ? "#FFEDD5"
                          : "#F1F5F9",
                      backgroundColor: "#FFFFFF",
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Image
                      source={paymentMethod.source}
                      style={{ width: 72, height: 26 }}
                      contentFit="contain"
                      accessible
                      accessibilityLabel={paymentMethod.label}
                    />
                  </View>
                ))}
              </View>

              <Text
                style={{
                  color: "#6B7280",
                  fontSize: 12,
                  marginTop: 12,
                  lineHeight: 18,
                }}
              >
                Your payment information is protected with encrypted processing.
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

      {/* Action Buttons */}
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
          onPress={handleAddProductToCart}
          disabled={Boolean(purchaseAction)}
          accessibilityRole="button"
          accessibilityState={{
            disabled: Boolean(purchaseAction),
            busy: Boolean(purchaseAction),
          }}
          style={{
            flex: 1,
            overflow: "hidden",
            borderRadius: 12,
            backgroundColor: purchaseAction ? "#D1D5DB" : "#16A34A",
          }}
        >
          {(purchaseAction === "adding" || purchaseAction === "buying") && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: purchaseProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "94%"],
                }),
                backgroundColor: "#16A34A",
              }}
            />
          )}
          <View
            style={{
              paddingVertical: 16,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MaterialIcons
              name="shopping-bag"
              size={20}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {purchaseAction ? "Adding to cart..." : "Add To Cart"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBuyNow}
          disabled={Boolean(purchaseAction)}
          accessibilityRole="button"
          accessibilityState={{
            disabled: Boolean(purchaseAction),
            busy: purchaseAction === "buying",
          }}
          style={{
            flex: 1,
            overflow: "hidden",
            borderRadius: 12,
            paddingVertical: 16,
            backgroundColor: purchaseAction ? "#F3F4F6" : "#15803D",
          }}
        >
          {purchaseAction === "buying" && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: purchaseProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "94%"],
                }),
                backgroundColor: "#D97706",
              }}
            />
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MaterialIcons
              name="flash-on"
              size={20}
              color={
                purchaseAction === "buying"
                  ? "#FFFFFF"
                  : purchaseAction
                    ? "#374151"
                    : "#FFFFFF"
              }
            />
            <Text
              style={{
                color:
                  purchaseAction === "buying"
                    ? "#FFFFFF"
                    : purchaseAction
                      ? "#374151"
                      : "#FFFFFF",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {purchaseAction === "buying" ? "Preparing checkout..." : "Buy Now"}
            </Text>
          </View>
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
