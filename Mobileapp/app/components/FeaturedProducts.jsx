import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import axiosClient from "../../api";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    setError(false);
    setLoading(true);
    try {
      console.log("📦 Fetching featured products...");
      const response = await axiosClient.get(
        "/api/customerprofile/featured-products",
      );
      console.log("✅ Featured products received:", response.data);
      const items = Array.isArray(response.data)
        ? response.data.filter(Boolean)
        : [];
      setProducts(items);
      console.log("✅ Featured products set:", items.length, "items");
    } catch (err) {
      console.error("❌ Failed to fetch featured products:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
        style={[styles.productCard, { width: cardWidth }]}
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

          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image || item.images?.[0] }}
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
    console.log(
      "📦 FeaturedProducts: No products, but still rendering section header",
    );
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

  console.log("✅ FeaturedProducts: Rendering %d products", products.length);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={24} color="#16A34A" />
          <Text style={styles.headerTitle}>Featured Products</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(Screens)/Explore")}
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
        data={products.slice(0, 6)} // Show first 6 products
        renderItem={renderProduct}
        keyExtractor={(item, index) =>
          item?.$id || item?.id || index.toString()
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        removeClippedSubviews={true}
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
