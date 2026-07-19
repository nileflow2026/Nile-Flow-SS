import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";
import ProductCard from "../components/ProductCard";

const { width } = Dimensions.get("window");

const VendorStoreSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    {/* Header skeleton */}
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#E5E7EB" }} />
      <View style={{ width: 120, height: 20, borderRadius: 6, backgroundColor: "#E5E7EB" }} />
    </View>

    {/* Store header skeleton */}
    <View style={{ paddingHorizontal: 16, paddingVertical: 24, backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#E5E7EB" }} />
        <View style={{ flex: 1 }}>
          <View style={{ width: 140, height: 20, borderRadius: 6, backgroundColor: "#E5E7EB", marginBottom: 8 }} />
          <View style={{ width: 100, height: 14, borderRadius: 6, backgroundColor: "#E5E7EB" }} />
        </View>
      </View>
    </View>

    {/* Controls skeleton */}
    <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: "#E5E7EB" }} />
        <View style={{ width: 80, height: 40, borderRadius: 12, backgroundColor: "#E5E7EB" }} />
      </View>
    </View>

    {/* Product grid skeleton — 2 columns, 4 rows */}
    <View style={{ flexDirection: "row", paddingHorizontal: 10, gap: 10, paddingTop: 16 }}>
      {[0, 1].map((col) => (
        <View key={col} style={{ flex: 1, gap: 16 }}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={{ borderRadius: 24, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", overflow: "hidden" }}>
              <View style={{ height: 180, backgroundColor: "#E5E7EB" }} />
              <View style={{ padding: 12 }}>
                <View style={{ width: "85%", height: 14, borderRadius: 4, backgroundColor: "#E5E7EB", marginBottom: 8 }} />
                <View style={{ width: "50%", height: 10, borderRadius: 4, backgroundColor: "#E5E7EB", marginBottom: 10 }} />
                <View style={{ width: "60%", height: 18, borderRadius: 4, backgroundColor: "#E5E7EB", marginBottom: 10 }} />
                <View style={{ width: "100%", height: 36, borderRadius: 12, backgroundColor: "#E5E7EB" }} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  </View>
);

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

const VendorStore = () => {
  const router = useRouter();
  const { vendorId } = useLocalSearchParams();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortPicker, setShowSortPicker] = useState(false);

  // ── Fetch vendor info + products ────────────────────────────
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!vendorId) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [vendorRes, productsRes] = await Promise.all([
          axiosClient.get(`/api/customerprofile/vendor/${vendorId}`),
          axiosClient.get(`/api/customerprofile/fetch-product`, {
            params: { vendorId, limit: 100 },
          }),
        ]);

        const vendorData = vendorRes.data?.vendor || null;
        const productData = Array.isArray(productsRes.data?.products)
          ? productsRes.data.products
          : [];

        if (!vendorData) {
          setError("Vendor not found.");
          setVendor(null);
        } else {
          setVendor(vendorData);
        }
        setProducts(productData);
      } catch (err) {
        setError(err?.message || "Failed to load store information.");
        setVendor(null);
        setProducts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vendorId],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // ── Search & Sort (client-side) ─────────────────────────────
  const visibleProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.productName || p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      );
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort(
          (a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0),
        );
        break;
      case "price-high":
        filtered.sort(
          (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0),
        );
        break;
      default:
        filtered.sort((a, b) => {
          const aDate = a.createdAt || a.$createdAt || "";
          const bDate = b.createdAt || b.$createdAt || "";
          return bDate.localeCompare(aDate);
        });
    }

    return filtered;
  }, [products, searchQuery, sortBy]);

  // ── Derived vendor fields ───────────────────────────────────
  const storeName = vendor?.storeName || vendor?.name || "Vendor Store";
  const storeDescription =
    vendor?.storeDescription || vendor?.description || "";
  const storeLogo = vendor?.profileImage || vendor?.avatar || vendor?.logo || "";
  const vendorRating = vendor?.storeStats?.rating || vendor?.rating || 0;
  const vendorRatingCount =
    vendor?.storeStats?.totalRatings || vendor?.ratingsCount || 0;
  const joinedDate = formatDate(vendor?.createdAt || vendor?.joinedAt);
  const phone = vendor?.phone || "";
  const whatsapp =
    vendor?.whatsapp || vendor?.socialLinks?.whatsapp || "";
  const email = vendor?.email || "";
  const address = vendor?.address || vendor?.location || "";

  const hasContactInfo = phone || whatsapp || email || address;
  const hasDescription = !!storeDescription;

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return <VendorStoreSkeleton />;
  }

  // ── Error ───────────────────────────────────────────────────
  if (error && !vendor) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="store-mall-directory" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Store not found</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.errorButton}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Sort label helper ───────────────────────────────────────
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Newest";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {storeName}
        </Text>
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.$id || item.id || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard
              product={item}
              id={item.$id || item.id}
              image={
                item.images && item.images.length > 0
                  ? item.images[0]
                  : item.image || null
              }
              price={item.price}
              title={item.productName || item.name || "Product"}
              onPress={() =>
                router.push({
                  pathname: "/(Screens)/ProductDetails",
                  params: { item: JSON.stringify(item) },
                })
              }
            />
          </View>
        )}
        ListHeaderComponent={() => (
          <View>
            {/* ── Store Header ─────────────────────────────── */}
            <View style={styles.storeHeader}>
              <View style={styles.storeHeaderRow}>
                {storeLogo ? (
                  <View style={styles.logoContainer}>
                    <Text>LOGO</Text>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoLetter}>
                      {(storeName.charAt(0) || "S").toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{storeName}</Text>
                  {vendorRating > 0 && (
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.floor(vendorRating) ? "star" : "star-outline"}
                          size={14}
                          color={star <= Math.floor(vendorRating) ? "#D97706" : "#6B7280"}
                        />
                      ))}
                      {vendorRatingCount > 0 && (
                        <Text style={styles.ratingCount}>({vendorRatingCount})</Text>
                      )}
                    </View>
                  )}
                  {joinedDate ? (
                    <Text style={styles.joinedDate}>Joined {joinedDate}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* ── Contact Information ──────────────────────── */}
            {hasContactInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <View style={styles.contactRow}>
                  {phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${phone}`)}
                      style={styles.contactChip}
                    >
                      <Ionicons name="call" size={14} color="#16A34A" />
                      <Text style={styles.contactChipText}>{phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {whatsapp ? (
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`,
                        )
                      }
                      style={styles.contactChip}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                      <Text style={styles.contactChipText}>WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}
                  {email ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${email}`)}
                      style={styles.contactChip}
                    >
                      <Ionicons name="mail" size={14} color="#2563EB" />
                      <Text style={styles.contactChipText}>Email</Text>
                    </TouchableOpacity>
                  ) : null}
                  {address ? (
                    <View style={styles.contactChip}>
                      <Ionicons name="location" size={14} color="#D97706" />
                      <Text style={styles.contactChipText} numberOfLines={1}>
                        {address}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* ── Search & Sort ────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.controlsRow}>
                {/* Search */}
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={16}
                    color="#9CA3AF"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    placeholder="Search store…"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sort trigger */}
                <TouchableOpacity
                  onPress={() => setShowSortPicker(!showSortPicker)}
                  style={styles.sortButton}
                >
                  <Ionicons name="funnel" size={16} color="#16A34A" />
                  <Text style={styles.sortButtonText}>{sortLabel}</Text>
                </TouchableOpacity>
              </View>

              {/* Sort picker */}
              {showSortPicker && (
                <View style={styles.sortPicker}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => {
                        setSortBy(opt.value);
                        setShowSortPicker(false);
                      }}
                      style={[
                        styles.sortOption,
                        sortBy === opt.value && styles.sortOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortBy === opt.value && styles.sortOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Product count */}
              <Text style={styles.productCount}>
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
                {searchQuery.trim()
                  ? ` (${visibleProducts.length} matching)`
                  : ""}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View>
            {/* ── About Store ─────────────────────────────── */}
            {hasDescription && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About this store</Text>
                <Text style={styles.descriptionText}>{storeDescription}</Text>
              </View>
            )}

            {/* ── Contact Seller CTA ──────────────────────── */}
            <View style={styles.ctaSection}>
              <Text style={styles.ctaTitle}>Interested in this store?</Text>
              <Text style={styles.ctaSubtitle}>
                {whatsapp
                  ? "Reach out via WhatsApp to inquire about products and orders."
                  : email
                    ? "Send an email to the seller for inquiries."
                    : "Contact this seller for more information."}
              </Text>
              <View style={styles.ctaButtons}>
                {whatsapp ? (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`,
                      )
                    }
                    style={styles.whatsappButton}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                    <Text style={styles.whatsappButtonText}>
                      Contact via WhatsApp
                    </Text>
                  </TouchableOpacity>
                ) : email ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${email}`)}
                    style={styles.emailButton}
                  >
                    <Ionicons name="mail" size={18} color="#FFF" />
                    <Text style={styles.emailButtonText}>Send email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Bottom spacer */}
            <View style={{ height: 40 }} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory-2" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim()
                ? "No matching products"
                : "No products yet"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `No products matching "${searchQuery.trim()}" in this store.`
                : "This vendor has not added any products yet."}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#14532D",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  errorButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#16A34A",
    borderRadius: 12,
  },
  errorButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Store Header
  storeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  storeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  joinedDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  contactChipText: {
    fontSize: 13,
    color: "#374151",
  },

  // Controls
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchIcon: {
    marginRight: -4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  sortPicker: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sortOptionActive: {
    backgroundColor: "#F0FDF4",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  sortOptionTextActive: {
    color: "#16A34A",
    fontWeight: "600",
  },
  productCount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },

  // Product grid
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
    gap: 8,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: "50%",
  },
  listContent: {
    paddingBottom: 20,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },

  // About
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  // CTA
  ctaSection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 12,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#25D366",
    gap: 8,
  },
  whatsappButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    gap: 8,
  },
  emailButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default VendorStore;
