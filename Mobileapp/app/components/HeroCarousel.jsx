import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = width - 32;

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);
  // Keep a ref in sync so the interval callback always sees the latest index
  // without needing to restart the interval on every slide change.
  const currentIndexRef = useRef(0);
  const slidesLengthRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    slidesLengthRef.current = slides.length;
  }, [slides.length]);

  useEffect(() => {
    fetchHeroProducts();
  }, []);

  const fetchHeroProducts = async () => {
    try {
      console.log("🎬 Fetching hero products...");
      const res = await axiosClient.get("/api/customerprofile/hero-products");
      const data = res.data;
      /* console.log("✅ Hero products received:", data); */
      // Preserve the type tag added by the backend; add a fallback in case the
      // backend did not enrich (e.g. older cached response).
      const combined = [
        ...(data.featured || []).map((item) => ({
          ...item,
          type: item.type ?? "featured",
        })),
        ...(data.deals || []).map((item) => ({
          ...item,
          type: item.type ?? "deal",
        })),
      ];
      setSlides(combined);
    } catch (error) {
      console.error("Error fetching hero products:", error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (slidesLengthRef.current <= 1) return;

    intervalRef.current = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % slidesLengthRef.current;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000);
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      startAutoSlide();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startAutoSlide, slides.length]);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % slides.length;
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
    startAutoSlide();
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    setCurrentIndex(prevIndex);
    flatListRef.current?.scrollToIndex({
      index: prevIndex,
      animated: true,
    });
    startAutoSlide();
  };

  const handleViewProduct = (item) => {
    router.push({
      pathname: "/(Screens)/ProductDetails",
      params: { item: JSON.stringify(item) },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading exclusive deals...</Text>
      </View>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const renderSlide = ({ item, index }) => {
    const gradientColors =
      item.type === "featured"
        ? ["#F59E0B", "#D97706", "#B45309"]
        : ["#10B981", "#059669", "#047857"];

    return (
      <View style={styles.slideContainer}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slideGradient}
        >
          <View style={styles.slideContent}>
            {/* Badge */}
            <View style={styles.badgeContainer}>
              <LinearGradient
                colors={
                  item.type === "featured"
                    ? ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]
                    : ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]
                }
                style={styles.badge}
              >
                <Ionicons
                  name={item.type === "featured" ? "star" : "flash"}
                  size={16}
                  color="#FFF"
                />
                <Text style={styles.badgeText}>
                  {item.type === "featured" ? "Featured" : "Deal"}
                </Text>
              </LinearGradient>
            </View>

            {/* Content */}
            <View style={styles.textContent}>
              <Text style={styles.slideTitle} numberOfLines={2}>
                {item.productName || item.name}
              </Text>
              <Text style={styles.slideDescription} numberOfLines={2}>
                {item.description || "Exclusive product for you"}
              </Text>

              {item.discount && (
                <View style={styles.discountContainer}>
                  <Text style={styles.discountText}>{item.discount}% OFF</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => handleViewProduct(item)}
              >
                <Text style={styles.ctaButtonText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Product Image */}
            <View style={styles.imageContainer}>
              <Image
                key={`${item.$id || item.id}-${index}`}
                source={{
                  uri:
                    item.image ||
                    "https://via.placeholder.com/120x120/cccccc/666666?text=No+Image",
                }}
                style={styles.productImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={200}
                recyclingKey={`hero-${item.$id || item.id}`}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      )}
      {!loading && slides.length === 0 && (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: 200,
            backgroundColor: "#F0FDF4",
          }}
        >
          <Text style={{ color: "#6B7280" }}>No products available</Text>
        </View>
      )}
      {slides.length > 0 && (
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item, index) => `${item.$id || item.id}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / SLIDE_WIDTH,
            );
            setCurrentIndex(newIndex);
          }}
        />
      )}

      {/* Pagination Dots */}
      {slides.length > 0 && (
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? "#FFF"
                      : "rgba(255, 255, 255, 0.4)",
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    marginTop: 16,
    marginBottom: 16,
    position: "relative",
  },
  loadingContainer: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "500",
  },
  slideContainer: {
    width: SLIDE_WIDTH,
    height: 280,
    marginHorizontal: 16,
  },
  slideGradient: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  slideContent: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
  },
  badgeContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
    lineHeight: 30,
  },
  slideDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
    lineHeight: 20,
  },
  discountContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  discountText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: "flex-start",
    gap: 8,
  },
  ctaButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    width: 140,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  productImage: {
    width: 120,
    height: 120,
    backgroundColor: "transparent",
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
});

export default HeroCarousel;

/* AsyncStorage.clear(); */
