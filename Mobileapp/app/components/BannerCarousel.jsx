import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import axiosClient from "../../api";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

const AUTO_PLAY_INTERVAL = 5000;
const SIDE_MARGIN = 16;
const DEFAULT_GRADIENT = ["#059669", "#10B981", "#2DD4BF"];

const getGradientColors = (gradient) => {
  if (typeof gradient !== "string") return DEFAULT_GRADIENT;
  const value = gradient.toLowerCase();

  if (value.includes("amber") || value.includes("orange") || value.includes("rose")) {
    return ["#F59E0B", "#F97316", "#F43F5E"];
  }
  if (value.includes("violet") || value.includes("purple") || value.includes("fuchsia")) {
    return ["#7C3AED", "#A855F7", "#D946EF"];
  }
  if (value.includes("blue") || value.includes("cyan") || value.includes("sky")) {
    return ["#2563EB", "#0891B2", "#06B6D4"];
  }
  if (value.includes("emerald") || value.includes("green") || value.includes("teal")) {
    return DEFAULT_GRADIENT;
  }

  return DEFAULT_GRADIENT;
};

const BannerCarousel = () => {
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.max(0, windowWidth - SIDE_MARGIN * 2);
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const listRef = useRef(null);
  const activeIndexRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadBanners = async () => {
      setLoading(true);
      setHasError(false);

      try {
        const response = await axiosClient.get("/api/v1/banners", {
          signal: controller.signal,
          timeout: 8000,
        });
        const data = response.data?.data;
        if (response.data?.success !== true || !Array.isArray(data)) {
          throw new Error("Banner service returned an invalid response");
        }

        const activeBanners = data.filter(
          (banner) => banner && banner.isActive !== false,
        );
        if (!cancelled) {
          setBanners(activeBanners);
          activeIndexRef.current = 0;
          setActiveIndex(0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load home banners:", error);
          setHasError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBanners();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [retryKey]);

  const scrollToIndex = useCallback(
    (index, animated = true) => {
      if (banners.length < 2) return;
      const nextIndex = (index + banners.length) % banners.length;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      listRef.current?.scrollToOffset({
        offset: nextIndex * slideWidth,
        animated,
      });
    },
    [banners.length, slideWidth],
  );

  useEffect(() => {
    if (banners.length < 2) return undefined;

    const timer = setInterval(() => {
      if (!isDraggingRef.current) {
        scrollToIndex(activeIndexRef.current + 1);
      }
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [banners.length, scrollToIndex]);

  const handleScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    activeIndexRef.current = index;
    setActiveIndex(index);
    isDraggingRef.current = false;
  };

  if (loading) {
    return (
      <View
        accessibilityLabel="Loading promotional banners"
        style={[styles.loading, { width: slideWidth }]}
      >
        <ActivityIndicator color="#16A34A" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.errorCard, { width: slideWidth }]}>
        <View style={styles.errorMessage}>
          <Ionicons name="cloud-offline-outline" size={22} color="#6B7280" />
          <Text style={styles.errorText}>Promotions are unavailable right now.</Text>
        </View>
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

  if (banners.length === 0) return null;

  return (
    <View style={[styles.container, { width: slideWidth }]}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => String(item.id || item.$id || index)}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => {
          const title = typeof item.title === "string" ? item.title.trim() : "";
          const subtitle =
            typeof item.subtitle === "string" ? item.subtitle.trim() : "";
          const image =
            typeof item.image === "string" && item.image.trim()
              ? item.image
              : null;

          return (
            <View style={[styles.slide, { width: slideWidth }]}>
              <LinearGradient
                colors={getGradientColors(item.gradient)}
                style={StyleSheet.absoluteFill}
              />
              {image && (
                <Image
                  source={{ uri: imageForSize(image, IMAGE_SIZE.HERO) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              )}
              <LinearGradient
                colors={
                  image
                    ? ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.76)"]
                    : ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.2)"]
                }
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
              <View style={styles.content}>
                {title.length > 0 && (
                  <Text style={styles.title} numberOfLines={2}>
                    {title}
                  </Text>
                )}
                {subtitle.length > 0 && (
                  <Text style={styles.subtitle} numberOfLines={3}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {banners.length > 1 && (
        <View style={styles.pagination} accessibilityLabel="Banner pages">
          {banners.map((banner, index) => (
            <TouchableOpacity
              key={String(banner.id || banner.$id || index)}
              accessibilityRole="button"
              accessibilityLabel={`Show banner ${index + 1}`}
              accessibilityState={{ selected: index === activeIndex }}
              onPress={() => scrollToIndex(index)}
              style={styles.paginationTouchTarget}
            >
              <View
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.activePaginationDot,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
  },
  slide: {
    height: 210,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: "#16A34A",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 21,
    lineHeight: 27,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  pagination: {
    position: "absolute",
    bottom: 13,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 7,
  },
  paginationTouchTarget: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  activePaginationDot: {
    width: 20,
    backgroundColor: "#FFFFFF",
  },
  loading: {
    height: 210,
    marginTop: 16,
    marginBottom: 8,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
  },
  errorCard: {
    minHeight: 112,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  errorText: {
    flexShrink: 1,
    color: "#374151",
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#16A34A",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
});

export default BannerCarousel;
