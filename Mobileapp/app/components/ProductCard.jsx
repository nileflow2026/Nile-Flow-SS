import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import images from "../../constants/images";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../../Context/CartContext_NEW";
import { useFavorites } from "../../Context/FavoritesContext";
import { fetchReviews, useGlobalContext } from "../../Context/GlobalProvider";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const ProductCard = ({
  product,
  id,
  title,
  price,
  image,
  onPress,
  premium = false,
}) => {
  const [totalRatings, setTotalRatings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [stockStatus, setStockStatus] = useState("");
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useGlobalContext();

  const productId = id || product?.$id || product?.id;
  const productData = product || {
    productName: title,
    price,
    image,
    $id: id,
    id,
  };
  const isWishlisted = isFavorite(productId);
  const { addToCart } = useCart();

  useEffect(() => {
    // Map either field variation coming from your mobile/search endpoints safely
    const count = productData.reviewCount ?? productData.totalRatings ?? 0;
    const avg = productData.avgRating ?? 0;

    setTotalRatings(count);
    setAverageRating(avg);
  }, [
    productData.reviewCount,
    productData.totalRatings,
    productData.avgRating,
  ]);

  useEffect(() => {
    const stock = productData.stock || 10;
    if (stock <= 0) {
      setStockStatus("Out of Stock");
    } else if (stock <= 5) {
      setStockStatus(`Only ${stock} left`);
    } else {
      setStockStatus("In Stock");
    }
  }, [productData.stock]);

  const handleWishlistClick = () => {
    toggleFavorite({ ...productData, $id: productId, id: productId });
  };

  const flowScale = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const handleAddToCart = () => {
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.5);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(flowScale, {
          toValue: 0.91,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(flowScale, {
          toValue: 1,
          friction: 3,
          tension: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 3,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    addToCart({ ...productData, $id: productId, id: productId }, user?.id);
  };

  const getProductGradient = (id) => {
    const gradients = [
      ["#F59E0B", "#FB923C"],
      ["#10B981", "#14B8A6"],
      ["#EF4444", "#F43F5E"],
      ["#3B82F6", "#6366F1"],
      ["#8B5CF6", "#A855F7"],
      ["#06B6D4", "#0EA5E9"],
    ];
    const hash = id
      ? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : 0;
    return gradients[hash % gradients.length];
  };

  const gradientColors = getProductGradient(productId);
  const stockColor =
    productData.stock <= 0
      ? ["#DC2626", "#B91C1C"]
      : productData.stock <= 5
        ? ["#F59E0B", "#D97706"]
        : ["#10B981", "#059669"];

  const productTitle =
    title || productData?.productName || productData?.name || "Product";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View ${productTitle}`}
    >
      <View style={styles.card}>
        {/* Badges Container - Top Left */}
        <View style={styles.badgesContainer}>
          {productData.isOnSale && (
            <View style={[styles.badge, { backgroundColor: "#DC2626" }]}>
              <Ionicons name="flash" size={10} color="#FFF" />
              <Text style={styles.badgeText}>SALE</Text>
            </View>
          )}

          {premium && (
            <View style={[styles.badge, { backgroundColor: "#D97706" }]}>
              <Ionicons name="trophy" size={10} color="#FFF" />
              <Text style={styles.badgeText}>PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Wishlist Button - Top Right */}
        <TouchableOpacity
          onPress={handleWishlistClick}
          style={[
            styles.wishlistButton,
            isWishlisted && styles.wishlistButtonActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isWishlisted
              ? `Remove ${productTitle} from wishlist`
              : `Add ${productTitle} to wishlist`
          }
          accessibilityState={{ selected: isWishlisted }}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isWishlisted
                  ? "#DC2626"
                  : "rgba(249,250,251,0.95)",
              },
            ]}
          />
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={16}
            color={isWishlisted ? "#FFF" : "#9CA3AF"}
          />
        </TouchableOpacity>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image || productData.image }}
            placeholder={images.Nilelogo}
            placeholderContentFit="contain"
            style={styles.productImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            recyclingKey={productId}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          />

          {/* Stock Status Badge */}
          <View style={[styles.stockBadge, { backgroundColor: stockColor[0] }]}>
            <Text style={styles.stockText}>{stockStatus}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {title || productData.productName}
          </Text>

          {premium && productData.description && (
            <Text style={styles.description} numberOfLines={2}>
              {productData.description}
            </Text>
          )}

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < averageRating ? "star" : "star-outline"}
                  size={12}
                  color={index < averageRating ? "#FCD34D" : "#6B7280"}
                />
              ))}
              <Text style={styles.ratingCount}>({totalRatings})</Text>
            </View>

            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#D97706" />
              <Text style={styles.ratingScore}>{averageRating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {(() => {
                  const raw = price ?? productData.price;
                  if (raw && typeof raw === "object") {
                    // Prefer displayValue (e.g. "KSh 1,500"), fall back to formatting with currency symbol
                    if (raw.displayValue) return raw.displayValue;
                    const symbol =
                      {
                        KES: "KSh",
                        UGX: "UGX",
                        TZS: "TSh",
                        ETB: "Br",
                        NGN: "₦",
                        GHS: "GH₵",
                        RWF: "RWF",
                        SSP: "SSP",
                        ZMW: "ZK",
                        MZN: "MT",
                        BWP: "P",
                        ZAR: "R",
                        USD: "$",
                        EUR: "€",
                        GBP: "£",
                      }[raw.currency] || "$";
                    return `${symbol} ${(parseFloat(raw.convertedPrice ?? raw.raw ?? 0) || 0).toLocaleString(undefined, { minimumFractionDigits: raw.currency === "KES" || raw.currency === "UGX" ? 0 : 2, maximumFractionDigits: raw.currency === "KES" || raw.currency === "UGX" ? 0 : 2 })}`;
                  }
                  // Legacy fallback: plain number — detect currency from global header or default to KSh
                  return `KSh ${(parseFloat(raw) || 0).toLocaleString()}`;
                })()}
              </Text>
              {productData.originalPrice && (
                <View style={styles.discountContainer}>
                  <Text style={styles.originalPrice}>
                    ${(parseFloat(productData.originalPrice) || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.discountBadge}>
                    {Math.round(
                      (1 - productData.price / productData.originalPrice) * 100,
                    )}
                    % OFF
                  </Text>
                </View>
              )}
            </View>
            {productData.shipping && (
              <View style={styles.shippingContainer}>
                <Ionicons name="car" size={10} color="#6EE7B7" />
                <Text style={styles.shippingText}>Free shipping</Text>
              </View>
            )}
          </View>

          {/* Features Badges */}
          {premium && (
            <View style={styles.featuresContainer}>
              <View style={styles.featureBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#16A34A" />
                <Text style={styles.featureText}>Authentic</Text>
              </View>
              <View style={styles.featureBadge}>
                <Ionicons name="car" size={10} color="#2563EB" />
                <Text style={styles.featureText}>Fast Ship</Text>
              </View>
              <View style={styles.featureBadge}>
                <Ionicons name="sparkles" size={10} color="#D97706" />
                <Text style={styles.featureText}>Premium</Text>
              </View>
            </View>
          )}

          {/* Add to Cart Button */}
          <TouchableOpacity onPress={handleAddToCart} activeOpacity={0.85}>
            <Animated.View
              style={[
                styles.cartButton,
                premium
                  ? { backgroundColor: "#D97706" }
                  : { backgroundColor: "#16A34A" },
                { transform: [{ scale: flowScale }], overflow: "hidden" },
              ]}
            >
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  },
                ]}
              />
              <Ionicons name="bag-handle" size={14} color="#FFF" />
              <Text style={styles.cartButtonText}>Let It Flow</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom Accent Line */}
        <LinearGradient
          colors={["#16A34A", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F9FAFB",
  },
  badgesContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  wishlistButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  wishlistButtonActive: {
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  imageContainer: {
    height: 180,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  stockBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  stockText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    minHeight: 36,
  },
  description: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingCount: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FEF3C7",
    gap: 3,
  },
  ratingScore: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  priceSection: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  originalPrice: {
    fontSize: 11,
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F87171",
  },
  shippingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  shippingText: {
    fontSize: 11,
    color: "#16A34A",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    gap: 3,
  },
  featureText: {
    fontSize: 9,
    color: "#374151",
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    overflow: "hidden",
  },
  ripple: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  cartButtonBorder: {
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  cartButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  cartButtonTextAlt: {
    color: "#FFF",
  },
  accentLine: {
    height: 2,
    width: "75%",
    alignSelf: "center",
    borderRadius: 1,
  },
});

export default ProductCard;
