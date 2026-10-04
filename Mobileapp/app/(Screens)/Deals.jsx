import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { dealsService } from "../../utils/dealsService";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";
import { ScrollView } from "react-native";

const FILTERS = [
  { key: "all", label: "All Deals" },
  { key: "product", label: "Product Deals" },
  { key: "flash", label: "Flash Sales" },
  { key: "ending-soon", label: "Ending Soon" },
  { key: "premium", label: "Premium" },
];
const VALID_FILTERS = new Set(FILTERS.map((filter) => filter.key));

const getIdentity = (item) => item?.productId || item?.$id || item?.id;

const getCurrency = (item) =>
  item?.originalPrice?.currency || item?.price?.currency || "KES";

const formatAmount = (amount, currency) =>
  `${currency} ${Number(amount || 0).toLocaleString("en", {
    maximumFractionDigits: 0,
  })}`;

const getCountdown = (endTime, now) => {
  const targetTime = new Date(endTime).getTime();
  if (!Number.isFinite(targetTime)) return null;
  const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
  if (!remaining) return "Deal ended";

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const Deals = () => {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(0, (windowWidth - 44) / 2);
  const params = useLocalSearchParams();
  const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;
  const initialFilter = VALID_FILTERS.has(requestedType) ? requestedType : "all";
  const [filter, setFilter] = useState(initialFilter);
  const [deals, setDeals] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [now, setNow] = useState(0);

  const loadDeals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await dealsService.getHomeDealData();
      setDeals(data.deals);
      setFlashSales(data.flashSales);
    } catch (loadError) {
      console.error("Failed to load deals screen:", loadError);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/BottomTabs");
  };

  useEffect(() => {
    loadDeals();
  }, [loadDeals, retryKey]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const flashIdentities = useMemo(
    () => new Set(flashSales.map(getIdentity)),
    [flashSales],
  );
  const visibleDeals = useMemo(
    () =>
      deals.filter((deal) => {
        if (filter === "all") return true;
        if (filter === "flash") {
          return deal.isFlash || flashIdentities.has(getIdentity(deal));
        }
        if (filter === "product") {
          return !deal.isFlash && !deal.isPremium && !deal.premiumDeal;
        }
        if (filter === "ending-soon") return deal.isExpiringSoon;
        if (filter === "premium") return deal.isPremium || deal.premiumDeal;
        return true;
      }),
    [deals, filter, flashIdentities],
  );

  const openDeal = (deal) => {
    const dealId = deal.$id || deal.id;
    if (!dealId) {
      console.error("Cannot open a deal without a deal ID:", deal);
      return;
    }
    router.push({
      pathname: "/(Screens)/DealDetails",
      params: { dealId },
    });
  };

  const renderDeal = ({ item }) => {
    const isFlash = item.isFlash || flashIdentities.has(getIdentity(item));
    const isPremium = item.isPremium || item.premiumDeal;
    const categoryName =
      item.categoryName ||
      item.category?.categoryName ||
      item.category ||
      "Special offer";
    const title = item.productName || item.name || "Deal";
    const image = item.image || item.images?.[0];
    const currency = getCurrency(item);
    const originalAmount =
      item.originalPrice?.convertedPrice ?? (Number(item.price) || 0);
    const dealAmount = item.dealPrice ?? item.price;

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View deal for ${title}`}
        activeOpacity={0.88}
        onPress={() => openDeal(item)}
        style={[styles.dealCard, { width: cardWidth }]}
      >
        <View style={styles.imageWrap}>
          {image ? (
            <Image
              source={{ uri: imageForSize(image, IMAGE_SIZE.MEDIUM) }}
              style={styles.productImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={180}
              recyclingKey={`mobile-deal-${getIdentity(item)}`}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="pricetag" size={32} color="#9CA3AF" />
            </View>
          )}
          <View
            style={[
              styles.typeBadge,
              isFlash
                ? styles.flashBadge
                : isPremium
                  ? styles.premiumBadge
                  : styles.dealBadge,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {isFlash ? "FLASH SALE" : isPremium ? "PREMIUM" : "DEAL"}
            </Text>
          </View>
          {Number(item.discount) > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>−{item.discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.dealInfo}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <Text style={styles.categoryText}>{categoryName}</Text>
          </ScrollView>
          <Text style={styles.productName} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.dealPrice}>
              {formatAmount(dealAmount, currency)}
            </Text>
            <Text style={styles.originalPrice}>
              {formatAmount(originalAmount, currency)}
            </Text>
          </View>
          {item.endTime && getCountdown(item.endTime, now) ? (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={15} color="#DC2626" />
              <Text style={styles.timerText}>
                {getCountdown(item.endTime, now)}
              </Text>
            </View>
          ) : null}
          <View style={styles.viewDealRow}>
            <Text style={styles.viewDealText}>View deal</Text>
            <Ionicons name="arrow-forward" size={16} color="#DC2626" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const header = (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handleBack}
        activeOpacity={0.75}
        style={styles.backButton}
      >
        <View style={styles.backIconWrap}>
          <Ionicons name="arrow-back" size={18} color="#14532D" />
        </View>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="flame" size={22} color="#FCA5A5" />
        </View>
        <Text style={styles.heroEyebrow}>LIMITED TIME</Text>
        <Text style={styles.heroTitle}>Deals worth discovering</Text>
        <Text style={styles.heroSubtitle}>
          Explore current offers and find a special price on something you need.
        </Text>
      </View>
      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(item.key)}
              style={[styles.filterChip, active && styles.activeFilterChip]}
            >
              <Text
                style={[
                  styles.filterText,
                  active && styles.activeFilterText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!loading && !error && (
        <Text style={styles.resultCount}>
          {visibleDeals.length} {visibleDeals.length === 1 ? "offer" : "offers"}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={handleBack}
          activeOpacity={0.75}
          style={styles.stateBackButton}
        >
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color="#14532D" />
          </View>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.stateTitle}>Finding current offers</Text>
        <Text style={styles.stateDescription}>
          Loading deals and flash sales.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={handleBack}
          activeOpacity={0.75}
          style={styles.stateBackButton}
        >
          <View style={styles.backIconWrap}>
            <Ionicons name="arrow-back" size={18} color="#14532D" />
          </View>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stateIcon}>
          <Ionicons name="cloud-offline-outline" size={30} color="#DC2626" />
        </View>
        <Text style={styles.stateTitle}>Deals are unavailable</Text>
        <Text style={styles.stateDescription}>
          Check your connection and try loading the offers again.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setRetryKey((key) => key + 1)}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={visibleDeals}
      renderItem={renderDeal}
      keyExtractor={(item, index) =>
        String(item.$id || item.id || item.productId || index)
      }
      numColumns={2}
      columnWrapperStyle={styles.dealRow}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={30} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No offers in this section</Text>
          <Text style={styles.emptyDescription}>
            Try another filter to see more current deals.
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDeals(true)}
          tintColor="#DC2626"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 0,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 9,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
  },
  stateBackButton: {
    position: "absolute",
    top: 12,
    left: 16,
    minHeight: 44,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 9,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
  },
  backIconWrap: {
    width: 34,
    height: 34,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
  },
  backButtonText: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "700",
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderRadius: 24,
    backgroundColor: "#7F1D1D",
  },
  heroIcon: {
    width: 42,
    height: 42,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroEyebrow: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    lineHeight: 31,
  },
  heroSubtitle: {
    marginTop: 7,
    color: "#FEE2E2",
    fontSize: 14,
    lineHeight: 21,
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
  },
  activeFilterChip: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
  },
  filterText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 8,
    color: "#6B7280",
    fontSize: 13,
  },
  dealRow: {
    paddingHorizontal: 16,
    columnGap: 12,
  },
  dealCard: {
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
  },
  imageWrap: {
    height: 152,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  flashBadge: {
    backgroundColor: "#DC2626",
  },
  premiumBadge: {
    backgroundColor: "#7C3AED",
  },
  dealBadge: {
    backgroundColor: "#D97706",
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    minWidth: 42,
    minHeight: 42,
    paddingHorizontal: 5,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B91C1C",
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  dealInfo: {
    paddingHorizontal: 11,
    paddingVertical: 12,
  },
  categoryText: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  categoryScroll: {
    width: "100%",
  },
  categoryScrollContent: {
    minWidth: "100%",
  },
  productName: {
    minHeight: 40,
    marginTop: 4,
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  priceRow: {
    minHeight: 26,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    columnGap: 6,
  },
  dealPrice: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },
  originalPrice: {
    color: "#6B7280",
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  timerRow: {
    minHeight: 32,
    marginTop: 6,
    paddingHorizontal: 8,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
    backgroundColor: "#FEF2F2",
  },
  timerText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "700",
  },
  viewDealRow: {
    minHeight: 40,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewDealText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  stateContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  stateIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
  },
  stateTitle: {
    marginTop: 14,
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    textAlign: "center",
  },
  stateDescription: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#DC2626",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
  },
  emptyTitle: {
    marginTop: 10,
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyDescription: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },
});

export default Deals;
