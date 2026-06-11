 
/* eslint-disable react-hooks/exhaustive-deps */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import { premiumService } from "../../utils/premiumService";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

/**
 * PremiumDeals Screen - Exclusive deals for premium members
 * Protected screen - shows upgrade CTA if not premium
 */
const PremiumDeals = () => {
  const router = useRouter();
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [router]);
  const { isPremium, loading: statusLoading } = usePremiumStatus();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!statusLoading) {
      fetchDeals();
    }
  }, [statusLoading, isPremium]);

  const fetchDeals = async () => {
    if (!isPremium) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await premiumService.getPremiumDeals();
      setDeals(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  };

  const renderDeal = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        router.push({
          pathname: "/(Screens)/ProductDetails",
          params: { item: JSON.stringify(item) },
        })
      }
      activeOpacity={0.9}
    >
      <View style={styles.productGradient}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.image ||
                item.images?.[0] ||
                "https://via.placeholder.com/300",
            }}
            style={styles.productImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            recyclingKey={`deal-${item.$id || item.id}`}
          />

          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color="#FFF" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>

          {/* Discount Badge */}
          {item.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discount}%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName || item.name}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              {item.originalPrice && (
                <Text style={styles.originalPrice}>
                  KES{item.originalPrice.toFixed(2)}
                </Text>
              )}
              <Text style={styles.premiumPrice}>
                KES{(item.price || 0).toFixed(2)}
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

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              router.push({
                pathname: "/(Screens)/ProductDetails",
                params: { item: JSON.stringify(item) },
              })
            }
          >
            <Text style={styles.addButtonText}>View Deal</Text>
            <Ionicons name="arrow-forward" size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (statusLoading || loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.loadingText}>Loading Premium Deals</Text>
            <Text style={styles.loadingSubtext}>
              Discovering exclusive offers...
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Non-premium user - show upgrade CTA
  if (!isPremium) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.upgradeContainer}>
          <View style={styles.upgradeCard}>
            {/* Lock Icon */}
            <View style={styles.lockContainer}>
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={32} color="#FFF" />
              </View>
            </View>

            {/* Content */}
            <Text style={styles.upgradeTitle}>
              Premium Deals Are Members-Only
            </Text>
            <Text style={styles.upgradeSubtitle}>
              Unlock exclusive discounts, priority delivery, and 2x Nile Miles
              with Nile Premium for just{" "}
              <Text style={styles.priceHighlight}>200 Ksh/month</Text>
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefit}>
                <View style={styles.benefitIcon}>
                  <Text style={styles.benefitEmoji}>🏷️</Text>
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>Up to 40% Off</Text>
                  <Text style={styles.benefitDesc}>Premium-only deals</Text>
                </View>
              </View>
              <View style={styles.benefit}>
                <View style={styles.benefitIcon}>
                  <Text style={styles.benefitEmoji}>🚀</Text>
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>Priority Delivery</Text>
                  <Text style={styles.benefitDesc}>Get it in 1-2 days</Text>
                </View>
              </View>
              <View style={styles.benefit}>
                <View style={styles.benefitIcon}>
                  <Text style={styles.benefitEmoji}>⭐</Text>
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>2x Miles</Text>
                  <Text style={styles.benefitDesc}>Double rewards</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={() => router.push("/(Screens)/SubscriptionSettings")}
              activeOpacity={0.9}
            >
              <View style={styles.upgradeButton}>
                <Ionicons name="diamond" size={20} color="#FFF" />
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.finePrint}>
              Try it risk-free. Cancel anytime.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Error state
  if (error) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Failed to Load Premium Deals</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              onPress={fetchDeals}
              style={styles.retryButton}
              activeOpacity={0.9}
            >
              <View style={styles.retryGradient}>
                <Text style={styles.retryText}>Try Again</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Premium user - show deals
  return (
    <View style={styles.container}>
      <FlatList
        data={deals}
        renderItem={renderDeal}
        keyExtractor={(item, index) => item.$id || item.id || index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <View style={styles.premiumTag}>
                    <Ionicons name="diamond" size={14} color="#16A34A" />
                    <Text style={styles.premiumTagText}>
                      Premium Collection
                    </Text>
                  </View>

                  <Text style={styles.categoryTitle}>Premium Deals</Text>

                  <Text style={styles.categoryDescription}>
                    Discover exclusive deals only for premium members
                  </Text>
                  <Text style={styles.productCount}>
                    {deals.length} premium deals available
                  </Text>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Ionicons name="diamond" size={14} color="#A855F7" />
                      <Text style={styles.statText}>Premium Only</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Ionicons name="flash" size={14} color="#10B981" />
                      <Text style={styles.statText}>Priority Delivery</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.statText}>2x Miles</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBannerContainer}>
              <View style={styles.infoBannerGradient}>
                <View style={styles.infoBannerIcon}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#10B981"
                  />
                </View>
                <View style={styles.infoBannerContent}>
                  <Text style={styles.infoBannerText}>
                    <Text style={styles.infoBannerHighlight}>
                      Premium Perk:
                    </Text>{" "}
                    All items here qualify for priority delivery and earn 2x
                    Nile Miles
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A855F7" />
              <Text style={styles.loadingText}>Loading Premium Deals...</Text>
              <Text style={styles.loadingSubtext}>
                Discovering exclusive offers for you
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>🎁</Text>
              </View>
              <Text style={styles.emptyTitle}>New Deals Coming Soon</Text>
              <Text style={styles.emptyText}>
                Check back later for exclusive premium discounts
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  premiumTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 12,
    gap: 6,
    backgroundColor: "#F0FDF4",
  },
  premiumTagText: {
    color: "#16A34A",
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  categoryTitle: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  productCount: {
    fontSize: 12,
    color: "#16A34A",
    opacity: 0.8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  statText: {
    color: "#374151",
    fontSize: 11,
  },
  infoBannerContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  infoBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  infoBannerIcon: {
    marginRight: 12,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  infoBannerHighlight: {
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productCard: {
    width: cardWidth,
    borderRadius: 24,
    overflow: "hidden",
  },
  productGradient: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    backgroundColor: "#16A34A",
  },
  premiumText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Poppins-Bold",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EF4444",
  },
  discountText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    color: "#FFF",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 8,
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
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "Poppins-SemiBold",
  },
  perksContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perkText: {
    fontSize: 9,
    fontFamily: "Poppins-SemiBold",
    color: "#16A34A",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  // Loading states
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  // Upgrade CTA
  upgradeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  upgradeCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  lockContainer: {
    marginBottom: 20,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16A34A",
  },
  upgradeTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#111827",
  },
  upgradeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    color: "#6B7280",
  },
  priceHighlight: {
    fontFamily: "Poppins-Bold",
    color: "#D97706",
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitEmoji: {
    fontSize: 20,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 2,
    color: "#111827",
  },
  benefitDesc: {
    fontSize: 14,
    color: "#6B7280",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#16A34A",
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#FFF",
  },
  finePrint: {
    fontSize: 12,
    textAlign: "center",
    color: "#9CA3AF",
  },
  // Error state
  errorContainer: {
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  errorContent: {
    alignItems: "center",
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#111827",
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    color: "#6B7280",
  },
  retryButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  retryGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#16A34A",
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#FFF",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#6B7280",
  },
});

export default PremiumDeals;
