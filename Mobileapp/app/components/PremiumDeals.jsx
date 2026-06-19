import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import { premiumService } from "../../utils/premiumService";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const PremiumDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isPremium, loading: statusLoading } = usePremiumStatus();

  const fetchPremiumDeals = async () => {
    if (!isPremium) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await premiumService.getPremiumDeals();
      setDeals(data);
    } catch (error) {
      console.error("Failed to fetch premium deals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!statusLoading) {
      fetchPremiumDeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, statusLoading]);

  const renderDeal = ({ item, index }) => {
    const productGradients = [
      ["rgba(168, 85, 247, 0.3)", "rgba(147, 51, 234, 0.3)"],
      ["rgba(245, 158, 11, 0.3)", "rgba(251, 191, 36, 0.3)"],
      ["rgba(16, 185, 129, 0.3)", "rgba(5, 150, 105, 0.3)"],
      ["rgba(239, 68, 68, 0.3)", "rgba(220, 38, 38, 0.3)"],
      ["rgba(59, 130, 246, 0.3)", "rgba(37, 99, 235, 0.3)"],
      ["rgba(6, 182, 212, 0.3)", "rgba(8, 145, 178, 0.3)"],
    ];

    const gradient = productGradients[index % productGradients.length];

    return (
      <TouchableOpacity
        style={[styles.dealCard, { width: cardWidth }]}
        onPress={() =>
          router.push({
            pathname: "/(Screens)/ProductDetails",
            params: { item: JSON.stringify(item) },
          })
        }
        activeOpacity={0.9}
      >
        <View style={styles.dealGradient}>
          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <View
              style={[styles.badgeGradient, { backgroundColor: "#7C3AED" }]}
            >
              <Ionicons name="diamond" size={12} color="#FFF" />
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          </View>

          {/* Discount Badge */}
          {item.discount && (
            <View style={styles.discountBadge}>
              <View
                style={[
                  styles.discountGradient,
                  { backgroundColor: "#DC2626" },
                ]}
              >
                <Text style={styles.discountText}>-{item.discount}%</Text>
              </View>
            </View>
          )}

          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: imageForSize(
                  item.image || item.images?.[0],
                  IMAGE_SIZE.MEDIUM,
                ),
              }}
              style={styles.dealImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              recyclingKey={`premium-deal-${item.$id || item.id}`}
            />
          </View>

          {/* Product Info */}
          <View style={styles.dealInfo}>
            <Text
              style={[styles.dealName, { color: "#111827" }]}
              numberOfLines={2}
            >
              {item.productName || item.name}
            </Text>

            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                {item.originalPrice && (
                  <Text style={styles.originalPrice}>
                    ${item.originalPrice.toFixed(2)}
                  </Text>
                )}
                <Text style={styles.premiumPrice}>
                  ${(item.price || 0).toFixed(2)}
                </Text>
              </View>
              {item.reviewCount > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {item.averageRating?.toFixed(1) || "5.0"}
                  </Text>
                </View>
              )}
            </View>

            {/* Premium Perks */}
            <View style={styles.perksContainer}>
              <View style={styles.perk}>
                <Ionicons name="flash" size={10} color="#10B981" />
                <Text style={styles.perkText}>Priority</Text>
              </View>
              <View style={styles.perk}>
                <Ionicons name="star" size={10} color="#F59E0B" />
                <Text style={styles.perkText}>2x Miles</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Don't show component if not premium or if loading premium status
  if (statusLoading || (!isPremium && !loading)) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Loading Premium Deals</Text>
          <Text style={styles.loadingSubtext}>
            Discovering exclusive offers...
          </Text>
        </View>
      </View>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: "#7C3AED" }]}>
            <Ionicons name="diamond" size={20} color="#FFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Premium Deals</Text>
            <Text style={styles.headerSubtitle}>Exclusive member offers</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(Screens)/PremiumDeals")}
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="arrow-forward" size={16} color="#A855F7" />
        </TouchableOpacity>
      </View>

      {/* Premium Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerGradient}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="sparkles" size={16} color="#A855F7" />
          </View>
          <Text style={[styles.infoBannerText, { color: "#1F2937" }]}>
            <Text style={styles.infoBannerHighlight}>Premium Perks:</Text>{" "}
            Priority delivery + 2x Nile Miles on all items
          </Text>
        </View>
      </View>

      {/* Deals Grid */}
      <FlatList
        data={deals.slice(0, 4)} // Show first 4 deals
        renderItem={renderDeal}
        keyExtractor={(item, index) => item.$id || item.id || index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4C1D95",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#A3A3A3",
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#A855F7",
    fontWeight: "600",
  },
  infoBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.2)",
    backgroundColor: "#F5F3FF",
  },
  infoBannerIcon: {
    marginRight: 8,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  infoBannerHighlight: {
    fontWeight: "bold",
    color: "#A855F7",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dealCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  dealGradient: {
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFF",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  discountGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFF",
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
  },
  dealImage: {
    width: "100%",
    height: "100%",
  },
  dealInfo: {
    padding: 12,
  },
  dealName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  premiumPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#A855F7",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  perksContainer: {
    flexDirection: "row",
    gap: 8,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perkText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#7C3AED",
  },
  loadingContainer: {
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A855F7",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
});

export default PremiumDeals;
