/* eslint-disable no-unused-vars */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axiosClient, { setDetectedCurrency } from "../../api";
import { getCurrentUser } from "../../Context/GlobalProvider";
import CurrencyUpdater from "../components/CurrencyUpdater";
import NetworkErrorFallback from "../components/NetworkErrorFallback";
import ProductCard from "../components/ProductCard";

const MemoizedProductCard = React.memo(ProductCard);

const Explore = () => {
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
  const [user, setUser] = useState(null);

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([{ id: "all", name: "All" }]);
  const [categoryData, setCategoryData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasError, setHasError] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  // Cursor for the fetch-product-mobile endpoint (cursor-based pagination)
  const nextCursorRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Fetch all data with pagination
  const fetchAllData = useCallback(
    async (categoryId, isInitial = false, pageNum = 1) => {
      try {
        if (!isInitial && pageNum === 1) setLoading(true);

        console.log("📞 Fetching products for category ID:", categoryId);

        let freshProducts = [];

        if (categoryId === "all") {
          // Use the mobile-optimised endpoint (bundles ratings + currency)
          const params = { limit: 20 };
          if (pageNum > 1 && nextCursorRef.current) {
            params.cursor = nextCursorRef.current;
          } else {
            nextCursorRef.current = null; // reset on fresh load
          }
          const response = await axiosClient.get(
            `/api/customerprofile/fetch-product-mobile`,
            { params },
          );

          if (response.data.success) {
            freshProducts = response.data.products || [];
            nextCursorRef.current = response.data.nextCursor || null;
            // Use server-reported hasMore for accuracy
            setHasMore(response.data.hasMore ?? freshProducts.length === 20);
          }
        } else {
          // Fetch products by category ID (like the website does)
          const response = await axiosClient.get(
            `/api/customerprofile/products/category/${categoryId}`,
          );
          // Handle different response formats
          freshProducts = Array.isArray(response.data)
            ? response.data
            : response.data?.products || [];
        }

        console.log(
          "✅ Fetched",
          freshProducts.length,
          "products for category:",
          categoryId,
        );

        // Lock in the currency the server used — more reliable than client geo-IP.
        // This sets the x-currency header for all subsequent requests (cart, etc.)
        if (freshProducts.length > 0 && freshProducts[0].price?.currency) {
          setDetectedCurrency(freshProducts[0].price.currency);
        }

        if (pageNum === 1) {
          setAllProducts(freshProducts);
          setProducts(freshProducts);
          setPage(1);
          setLoading(false);
        } else {
          setAllProducts((prev) => [...prev, ...freshProducts]);
          setProducts((prev) => [...prev, ...freshProducts]);
        }

        // Disable pagination for category-specific endpoint (no cursor support)
        if (categoryId !== "all") {
          setHasMore(false);
        }

        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
        if (pageNum === 1) setHasError(true);
      } finally {
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axiosClient.get("/api/customerprofile/categories");

        if (Array.isArray(res.data)) {
          const cats = [
            { id: "all", name: "All" },
            ...res.data.map((cat) => ({
              id: cat.$id || cat.id,
              name: cat.name,
            })),
          ];

          setCategories(cats);
          setCategoryData(res.data);
          console.log("📋 Categories loaded:", cats);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([{ id: "all", name: "All" }]);
      }
    };

    fetchCats();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchAllData(selectedCategory, false, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when category changes
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log("📁 Category changed to:", selectedCategory);
      setPage(1);
      setHasMore(true);
      setSearchQuery("");
      fetchAllData(selectedCategory, false, 1);
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter((product) =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  // Reload when focused
  useFocusEffect(
    useCallback(() => {
      const shouldRefetch =
        !lastUpdated || Date.now() - lastUpdated.getTime() > 5 * 60 * 1000;

      if (selectedCategory && shouldRefetch) {
        setPage(1);
        setHasMore(true);
        fetchAllData(selectedCategory, true, 1);
      }
      return () => {};
    }, [selectedCategory, lastUpdated, fetchAllData]),
  );

  // Load more products
  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAllData(selectedCategory, false, nextPage);
    }
  }, [loadingMore, loading, hasMore, page, selectedCategory, fetchAllData]);

  const renderProductCard = useCallback(
    ({ item }) => (
      <MemoizedProductCard
        key={item.$id}
        product={item}
        id={item.$id}
        image={
          item.images && item.images.length > 0
            ? item.images[0]
            : item.image || require("../../assets/themes/default-bg.png")
        }
        price={item.price}
        title={
          item.productName && item.productName.length > 20
            ? `${item.productName.slice(0, 20)}...`
            : item.productName
        }
        onPress={() =>
          router.push({
            pathname: "/(Screens)/ProductDetails",
            params: { item: JSON.stringify(item) },
          })
        }
      />
    ),
    [router],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasError(false);
    await fetchAllData(selectedCategory);
  }, [selectedCategory, fetchAllData]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    fetchAllData(selectedCategory, false, 1);
  }, [fetchAllData, selectedCategory]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Memoize categories bar only (search is separate to prevent recreation)
  const CategoriesBar = useCallback(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${category.name}`}
            accessibilityState={{ selected: selectedCategory === category.id }}
          >
            {selectedCategory === category.id ? (
              <View style={[styles.categoryChip, styles.categoryChipActive]}>
                <Text style={[styles.categoryText, { color: "#FFFFFF" }]}>
                  {category.name}
                </Text>
              </View>
            ) : (
              <View style={[styles.categoryChip, styles.categoryChipInactive]}>
                <Text style={[styles.categoryText, { color: "#374151" }]}>
                  {category.name}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    ),
    [categories, selectedCategory],
  );

  if (hasError && products.length === 0) {
    return <NetworkErrorFallback onRetry={handleRetry} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <CurrencyUpdater />

      {/* Fixed Header with Search - Outside FlatList */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="compass" size={28} color="#F59E0B" />
          <Text style={styles.headerTitle}>Explore All Products</Text>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
            blurOnSubmit={false}
            autoCorrect={false}
            accessibilityLabel="Search products"
            accessibilityHint="Type to filter products by name"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item, index) =>
          item.$id?.toString() || item._id?.toString() || index.toString()
        }
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 10,
        }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: 0,
        }}
        style={{ flex: 1, width: "100%" }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={false}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={CategoriesBar}
        ListFooterComponent={() => (
          <>
            {loadingMore && (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Icon name="spinner" size={24} color="#999" />
                <Text style={{ color: "#999", marginTop: 8 }}>
                  Loading more...
                </Text>
              </View>
            )}
            {lastUpdated && !loadingMore && (
              <Text
                style={{
                  textAlign: "center",
                  color: "#777",
                  fontSize: 12,
                  marginTop: 8,
                  marginBottom: 12,
                }}
              >
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Text>
            )}
            {!hasMore && products.length > 0 && (
              <Text
                style={{
                  textAlign: "center",
                  color: "#999",
                  fontSize: 14,
                  marginTop: 8,
                  marginBottom: 12,
                }}
              >
                No more products
              </Text>
            )}
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loading ? (
              <>
                <Ionicons name="hourglass-outline" size={48} color="#F59E0B" />
                <Text style={styles.emptyText}>Loading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="bag-handle-outline" size={64} color="#F59E0B" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `No products found for "${searchQuery}"`
                    : "No products available"}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    onPress={() => fetchAllData(selectedCategory, false, 1)}
                  >
                    <View style={styles.retryButton}>
                      <Text style={styles.retryText}>Retry</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  searchIcon: {
    marginRight: -6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  categoryChipInactive: {
    backgroundColor: "#F3F4F6",
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#16A34A",
  },
  retryText: {
    color: "#FFF",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
});

export default Explore;
