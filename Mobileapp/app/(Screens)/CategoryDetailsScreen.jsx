/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const CategoryDetailsScreen = () => {
  const { categoryId, categoryName, categoryImg } = useLocalSearchParams();
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [products, setProducts] = useState([]); // Display filtered products
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

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

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("🔄 Loading data for category ID:", categoryId);

      // 1. Load category details
      const categoryResponse = await axiosClient.get(
        `/api/customerprofile/categories/${categoryId}`,
      );
      setCategoryDetails(categoryResponse.data);
      console.log("Category Details:", categoryResponse.data);

      // 2. Load subcategories
      const subResponse = await axiosClient.get(
        `/api/products/categories/${categoryId}/subcategories`,
      );
      const allSubcategories = subResponse.data.subcategories || [];
      const filteredSubcategories = allSubcategories.filter(
        (sub) => sub.name.toLowerCase() !== "all products",
      );
      setSubcategories(filteredSubcategories);
      console.log("Filtered Subcategories:", filteredSubcategories);

      // 3. Load products — use fetch-product-mobile for currency enrichment + bundled ratings
      const productsUrl = `/api/customerprofile/fetch-product-mobile`;
      console.log("📞 Calling products endpoint:", productsUrl);

      const productsResponse = await axiosClient.get(productsUrl, {
        params: { category: categoryId, limit: 100 },
      });
      console.log("📦 Products response:", productsResponse.data);

      if (productsResponse.data.success) {
        const loadedProducts = productsResponse.data.products || [];
        setAllProducts(loadedProducts); // Store all products
        setProducts(loadedProducts); // Initially show all products
        console.log("✅ Products loaded:", loadedProducts.length);
      } else {
        console.error("❌ Products API error:", productsResponse.data.error);
        setAllProducts([]);
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryClick = async (subId) => {
    setSelectedSubcategory(subId);

    if (!subId) {
      // Show all products
      setProducts(allProducts);
    } else {
      setLoading(true);
      try {
        const response = await axiosClient.get(
          `/api/customerprofile/fetch-product-mobile`,
          {
            params: { category: categoryId, subcategoryId: subId, limit: 100 },
          },
        );
        if (response.data.success) {
          setProducts(response.data.products || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching subcategory products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const getCategoryGradient = (categoryName) => {
    const gradients = {
      fashion: ["#EC4899", "#F43F5E", "#EF4444"],
      electronics: ["#3B82F6", "#6366F1", "#8B5CF6"],
      home: ["#F59E0B", "#FB923C", "#FBBF24"],
      beauty: ["#D946EF", "#EC4899", "#F43F5E"],
      food: ["#10B981", "#14B8A6", "#06B6D4"],
      art: ["#8B5CF6", "#A855F7", "#D946EF"],
      default: ["#F59E0B", "#FBBF24", "#FB923C"],
    };

    const name = categoryName?.toLowerCase() || "";
    if (name.includes("fashion")) return gradients.fashion;
    if (name.includes("electronic")) return gradients.electronics;
    if (name.includes("home")) return gradients.home;
    if (name.includes("beauty")) return gradients.beauty;
    if (name.includes("food")) return gradients.food;
    if (name.includes("art")) return gradients.art;
    return gradients.default;
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        router.push({
          pathname: "/(Screens)/ProductDetails",
          params: { item: JSON.stringify(item) },
        })
      }
    >
      <View style={styles.productGradient}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.image || "https://via.placeholder.com/300",
            }}
            style={styles.productImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            recyclingKey={`cat-item-${item.$id || item.id}`}
          />

          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <Ionicons name="trophy" size={12} color="#FFF" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {item.price
                ? typeof item.price === "object" && item.price.displayValue
                  ? item.price.displayValue
                  : `$${(parseFloat(item.price) || 0).toFixed(2)}`
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

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              router.push({
                pathname: "/(Screens)/ProductDetails",
                params: { item: JSON.stringify(item) },
              })
            }
          >
            <Text style={styles.addButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={14} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => item.$id || index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  backgroundColor: "#FFFFFF",
                  borderBottomWidth: 1,
                  borderBottomColor: "#E5E7EB",
                },
              ]}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <View style={styles.premiumTag}>
                    <Ionicons name="sparkles" size={14} color="#D97706" />
                    <Text style={styles.premiumTagText}>
                      Premium Collection
                    </Text>
                  </View>

                  <Text style={styles.categoryTitle} numberOfLines={2}>
                    {categoryDetails?.name || categoryName || "Loading..."}
                  </Text>

                  <Text style={styles.categoryDescription}>
                    Discover authentic{" "}
                    {(categoryDetails?.name || categoryName)?.toLowerCase() ||
                      "African"}{" "}
                    products
                  </Text>
                  <Text style={styles.productCount}>
                    {products.length} premium products available
                  </Text>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Ionicons name="star" size={14} color="#FCD34D" />
                      <Text style={styles.statText}>Premium Quality</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Ionicons
                        name="shield-checkmark"
                        size={14}
                        color="#6EE7B7"
                      />
                      <Text style={styles.statText}>Authentic</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Ionicons name="flash" size={14} color="#60A5FA" />
                      <Text style={styles.statText}>Fast Delivery</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Subcategories Bar */}
            {subcategories.length > 0 && (
              <View style={styles.subcategoriesSection}>
                <View style={styles.subcategoriesHeader}>
                  <Text style={styles.subcategoriesTitle}>
                    Browse Collections
                  </Text>
                  <Text style={styles.subcategoriesSubtitle}>
                    {selectedSubcategory ? "Filtered" : "All products"}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subcategoriesScroll}
                >
                  <TouchableOpacity
                    onPress={() => handleSubcategoryClick(null)}
                    style={[
                      styles.subcategoryButton,
                      !selectedSubcategory && styles.subcategoryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subcategoryText,
                        !selectedSubcategory && styles.subcategoryTextActive,
                      ]}
                    >
                      All Products ({products.length})
                    </Text>
                  </TouchableOpacity>

                  {subcategories.map((sub) => (
                    <TouchableOpacity
                      key={sub.$id}
                      onPress={() => handleSubcategoryClick(sub.$id)}
                      style={[
                        styles.subcategoryButton,
                        selectedSubcategory === sub.$id &&
                          styles.subcategoryButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.subcategoryText,
                          selectedSubcategory === sub.$id &&
                            styles.subcategoryTextActive,
                        ]}
                      >
                        {sub.name}
                      </Text>
                      <Ionicons name="flash" size={12} color="#D97706" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>
                Loading Premium Products...
              </Text>
              <Text style={styles.loadingSubtext}>
                Curating authentic African treasures for you
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bag-handle-outline" size={48} color="#F59E0B" />
              </View>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyText}>
                We're currently updating our collection. Check back soon!
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
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
    marginBottom: 12,
    gap: 6,
  },
  premiumTagText: {
    color: "#D97706",
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
    color: "#D97706",
    opacity: 0.9,
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
  subcategoriesSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  subcategoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subcategoriesTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  subcategoriesSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  subcategoriesScroll: {
    gap: 12,
  },
  subcategoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subcategoryButtonActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  subcategoryText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#374151",
  },
  subcategoryTextActive: {
    color: "#FFF",
    fontFamily: "Poppins-SemiBold",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productGradient: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
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
    backgroundColor: "#D97706",
  },
  premiumText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Poppins-Bold",
  },
  productInfo: {
    padding: 12,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#D97706",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  addButtonText: {
    color: "#14532D",
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
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
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
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
});

export default CategoryDetailsScreen;
