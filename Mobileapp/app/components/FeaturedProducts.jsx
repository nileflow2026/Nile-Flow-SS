import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";
import {
  imageForSize,
  IMAGE_SIZE,
  preloadImages,
} from "../../utils/imageOptimizer";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;
const AUTO_SLIDE_INTERVAL = 50;
const AUTO_SLIDE_STEP = 1;

const FeaturedProducts = ({ fullScreen = false }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const hasProducts = useRef(false);
  const productRailRef = useRef(null);
  const contentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const router = useRouter();
  const railCardWidth = Math.min(220, (width - 48) * 0.62);

  const fetchFeaturedProducts = useCallback(async (isRefresh = false) => {
    setError(false);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await axiosClient.get(
        "/api/customerprofile/featured-products",
      );
      const items = Array.isArray(response.data)
        ? response.data.filter(Boolean)
        : [];
      hasProducts.current = items.length > 0;
      setProducts(items);
    } catch (err) {
      console.error("❌ Failed to fetch featured products:", err.message);
      if (!hasProducts.current) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch((accessibilityError) => {
        console.error("Failed to read reduced motion setting:", accessibilityError);
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (fullScreen || reduceMotion || products.length < 2) return undefined;

    const interval = setInterval(() => {
      const maxOffset = contentWidthRef.current - viewportWidthRef.current;
      if (pausedRef.current || maxOffset <= 0) return;

      const nextOffset = scrollOffsetRef.current + AUTO_SLIDE_STEP;
      if (nextOffset >= maxOffset) {
        scrollOffsetRef.current = 0;
        productRailRef.current?.scrollToOffset({
          offset: 0,
          animated: false,
        });
      } else {
        scrollOffsetRef.current = nextOffset;
        productRailRef.current?.scrollToOffset({
          offset: nextOffset,
          animated: false,
        });
      }
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [fullScreen, products.length, reduceMotion]);

  const pauseAutoSlide = () => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const resumeAutoSlideSoon = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
      resumeTimerRef.current = null;
    }, 1800);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/BottomTabs");
  };

  const screenHeader = (
    <View style={styles.screenHeader}>
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
      <View style={styles.pageHero}>
        <View style={styles.pageHeroTop}>
          <View style={styles.pageHeroIcon}>
            <Ionicons name="trophy" size={22} color="#16A34A" />
          </View>
          {!loading && !error && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {products.length} {products.length === 1 ? "ITEM" : "ITEMS"}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.pageEyebrow}>CURATED FOR YOU</Text>
        <Text accessibilityRole="header" style={styles.pageTitle}>
          Featured Products
        </Text>
        <Text style={styles.pageSubtitle}>
          Explore standout finds selected from trusted Nile Flow sellers.
        </Text>
      </View>
    </View>
  );

  const renderProduct = ({ item, index }) => {
    if (!item) {
      return null;
    }

    const productGradients = [
      ["rgba(245, 158, 11, 0.2)", "rgba(251, 191, 36, 0.2)"],
      ["rgba(16, 185, 129, 0.2)", "rgba(5, 150, 105, 0.2)"],
      ["rgba(239, 68, 68, 0.2)", "rgba(220, 38, 38, 0.2)"],
      ["rgba(59, 130, 246, 0.2)", "rgba(37, 99, 235, 0.2)"],
      ["rgba(168, 85, 247, 0.2)", "rgba(147, 51, 234, 0.2)"],
      ["rgba(6, 182, 212, 0.2)", "rgba(8, 145, 178, 0.2)"],
    ];

    const gradient = productGradients[index % productGradients.length];

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { width: fullScreen ? cardWidth : railCardWidth },
        ]}
        onPress={() => {
          if (item) {
            router.push({
              pathname: "/(Screens)/ProductDetails",
              params: { item: JSON.stringify(item) },
            });
          }
        }}
        activeOpacity={0.9}
      >
        <View style={styles.productGradient}>
          {/* Featured Badge */}
          <View style={styles.featuredBadge}>
            <View
              style={[
                styles.badgeGradient,
                { backgroundColor: gradient[0].replace("0.2", "0.15") },
              ]}
            >
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.badgeText}>Featured</Text>
            </View>
          </View>

          {/* Product Image — optimized 200px WebP from Appwrite CDN */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: imageForSize(
                  item.image || item.images?.[0],
                  IMAGE_SIZE.MEDIUM,
                ),
              }}
              style={styles.productImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              recyclingKey={`featured-${item.$id || item.id}`}
            />
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text
              style={[styles.productName, { color: "#111827" }]}
              numberOfLines={2}
            >
              {item.productName || item.name}
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {item.price
                  ? typeof item.price === "object" && item.price.displayValue
                    ? item.price.displayValue
                    : `KSh ${Number(item.price.raw ?? item.price).toLocaleString("en", { maximumFractionDigits: 0 })}`
                  : "Price on request"}
              </Text>
              {item.reviewCount > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {item.averageRating?.toFixed(1) || "5.0"}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Add Button */}
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => {
                router.push({
                  pathname: "/(Screens)/ProductDetails",
                  params: { item: JSON.stringify(item) },
                });
              }}
            >
              <View style={styles.addButtonGradient}>
                <Ionicons name="add" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    if (fullScreen) {
      return (
        <View style={styles.screenContainer}>
          {screenHeader}
          <View style={styles.screenState}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.screenStateTitle}>
              Finding featured products
            </Text>
            <Text style={styles.screenStateDescription}>
              Loading trusted picks for you.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Loading Featured Products</Text>
          <Text style={styles.loadingSubtext}>
            Discovering premium selections...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    if (fullScreen) {
      return (
        <View style={styles.screenContainer}>
          {screenHeader}
          <View style={styles.screenState}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={30}
                color="#B91C1C"
              />
            </View>
            <Text style={styles.screenStateTitle}>
              Featured products are unavailable
            </Text>
            <Text style={styles.screenStateDescription}>
              Check your connection and try loading the collection again.
            </Text>
            <TouchableOpacity
              onPress={fetchFeaturedProducts}
              accessibilityRole="button"
              accessibilityLabel="Retry loading featured products"
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Could not load featured products</Text>
        <TouchableOpacity
          onPress={fetchFeaturedProducts}
          accessibilityRole="button"
          accessibilityLabel="Retry loading featured products"
          style={{
            marginTop: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#16A34A",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (products.length === 0) {
    if (fullScreen) {
      return (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item, index) =>
            item?.$id || item?.id || index.toString()
          }
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.screenListContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={screenHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="trophy-outline" size={26} color="#16A34A" />
              </View>
              <Text style={styles.emptyTitle}>
                No featured products yet
              </Text>
              <Text style={styles.emptyDescription}>
                Check back soon for new picks from Nile Flow sellers.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchFeaturedProducts(true)}
              tintColor="#16A34A"
            />
          }
        />
      );
    }

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="trophy" size={24} color="#16A34A" />
            <Text style={styles.headerTitle}>Featured Products</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
          <Text style={{ color: "#6B7280", textAlign: "center" }}>
            No featured products available
          </Text>
        </View>
      </View>
    );
  }

  /*  console.log("✅ FeaturedProducts: Rendering %d products", products.length); */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={24} color="#16A34A" />
          <Text style={styles.headerTitle}>Featured Products</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(Screens)/FeaturedProducts")}
          accessibilityRole="button"
          accessibilityLabel="See all products"
        >
          <View style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="arrow-forward" size={16} color="#16A34A" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <FlatList
        ref={fullScreen ? undefined : productRailRef}
        data={fullScreen ? products : products.slice(0, 4)}
        renderItem={renderProduct}
        keyExtractor={(item, index) =>
          item?.$id || item?.id || index.toString()
        }
        horizontal={!fullScreen}
        numColumns={fullScreen ? 2 : 1}
        columnWrapperStyle={fullScreen ? styles.row : undefined}
        ItemSeparatorComponent={fullScreen ? undefined : () => <View style={{ width: 12 }} />}
        contentContainerStyle={
          fullScreen ? styles.screenListContainer : styles.listContainer
        }
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        removeClippedSubviews={true}
        ListHeaderComponent={fullScreen ? screenHeader : null}
        onLayout={
          fullScreen
            ? undefined
            : (event) => {
                viewportWidthRef.current = event.nativeEvent.layout.width;
              }
        }
        onContentSizeChange={
          fullScreen
            ? undefined
            : (contentWidth) => {
                contentWidthRef.current = contentWidth;
              }
        }
        onScroll={
          fullScreen
            ? undefined
            : (event) => {
                scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
              }
        }
        scrollEventThrottle={100}
        onTouchStart={fullScreen ? undefined : pauseAutoSlide}
        onTouchEnd={fullScreen ? undefined : resumeAutoSlideSoon}
        onScrollBeginDrag={fullScreen ? undefined : pauseAutoSlide}
        onScrollEndDrag={fullScreen ? undefined : resumeAutoSlideSoon}
        onMomentumScrollEnd={fullScreen ? undefined : resumeAutoSlideSoon}
        ListEmptyComponent={
          fullScreen ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No featured products yet</Text>
              <Text style={styles.emptyDescription}>
                Check back soon for new picks from Nile Flow sellers.
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          fullScreen ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchFeaturedProducts(true)}
              tintColor="#16A34A"
            />
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screenHeader: {
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: 8,
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
  pageHero: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
  },
  pageHeroTop: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageHeroIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#DCFCE7",
  },
  countBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  countBadgeText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pageEyebrow: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  pageTitle: {
    marginTop: 4,
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    fontSize: 25,
    lineHeight: 33,
  },
  pageSubtitle: {
    marginTop: 6,
    color: "#374151",
    fontSize: 14,
    lineHeight: 21,
  },
  screenListContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 30,
    backgroundColor: "#FFFFFF",
  },
  screenState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  screenStateTitle: {
    marginTop: 14,
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    textAlign: "center",
  },
  screenStateDescription: {
    marginTop: 7,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#16A34A",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyState: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
  },
  emptyIcon: {
    width: 52,
    height: 52,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#DCFCE7",
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#14532D",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  productCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  productGradient: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  featuredBadge: {
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
    borderColor: "#E5E7EB",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400E",
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
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
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A34A",
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
  quickAddButton: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  addButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16A34A",
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
    color: "#16A34A",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
});

export default FeaturedProducts;
