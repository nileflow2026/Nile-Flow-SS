import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  AccessibilityInfo,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

const { width } = Dimensions.get("window");
const AUTO_SLIDE_INTERVAL = 50;
const AUTO_SLIDE_STEP = 1;

const Categories = ({
  categories,
  categoryData,
  selectedCategory,
  onCategoryChange,
  autoSlide = false,
}) => {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (width - 48) / 2; // 2 columns with spacing
  const railCardWidth = Math.min(156, windowWidth * 0.42);
  const categoryRailRef = useRef(null);
  const contentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const visibleCategories =
    categoryData && categoryData.length > 0
      ? categoryData
      : categories
          .filter((category) => category !== "All")
          .map((name) => ({ id: name, name }));

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    }).catch((error) => {
      console.error("Failed to read reduced motion setting:", error);
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
    if (
      !autoSlide ||
      reduceMotion ||
      visibleCategories.length < 2
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      const maxOffset =
        contentWidthRef.current - viewportWidthRef.current;
      if (pausedRef.current || maxOffset <= 0) return;

      const nextOffset = scrollOffsetRef.current + AUTO_SLIDE_STEP;
      if (nextOffset >= maxOffset) {
        scrollOffsetRef.current = 0;
        categoryRailRef.current?.scrollTo({ x: 0, animated: false });
      } else {
        scrollOffsetRef.current = nextOffset;
        categoryRailRef.current?.scrollTo({
          x: nextOffset,
          animated: false,
        });
      }
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [autoSlide, reduceMotion, visibleCategories.length]);

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

  const handleCategoryPress = async (category) => {
    // If category has data (img, id), navigate to category page
    const categoryObj = categoryData?.find((cat) => cat.name === category);

    if (categoryObj && categoryObj.id) {
      // Navigate to CategoryDetailsScreen with category data
      router.push({
        pathname: "/(Screens)/CategoryDetailsScreen",
        params: {
          categoryId: categoryObj.id,
          categoryName: category,
          categoryImg: categoryObj.img,
        },
      });
    }

    // Store category in memory for personalization
    await AsyncStorage.setItem("mostUsed", category);

    try {
      const stored = await AsyncStorage.getItem("categoryCounts");
      const counts = stored ? JSON.parse(stored) : {};
      counts[category] = (counts[category] || 0) + 1;
      await AsyncStorage.setItem("categoryCounts", JSON.stringify(counts));
    } catch (error) {
      console.error("Failed to update category memory:", error);
    }
  };

  // Get category icon based on name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes("fashion") || name.includes("apparel"))
      return "shirt-outline";
    if (name.includes("electronic")) return "phone-portrait-outline";
    if (name.includes("home") || name.includes("kitchen"))
      return "home-outline";
    if (name.includes("beauty") || name.includes("personal"))
      return "sparkles-outline";
    if (name.includes("health") || name.includes("wellness"))
      return "fitness-outline";
    if (name.includes("local") || name.includes("market"))
      return "basket-outline";
    return "star-outline";
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, autoSlide && styles.railHeader]}>
        {!autoSlide && (
          <Ionicons name="apps-outline" size={24} color="#16A34A" />
        )}
        <View>
          {autoSlide && (
            <Text style={styles.eyebrow}>SHOP BY CATEGORY</Text>
          )}
          <Text style={[styles.headerText, autoSlide && styles.railHeaderText]}>
            {autoSlide ? "Find what you need" : "Shop by Category"}
          </Text>
        </View>
      </View>

      {autoSlide ? (
        <ScrollView
          ref={categoryRailRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railContainer}
          onLayout={(event) => {
            viewportWidthRef.current = event.nativeEvent.layout.width;
          }}
          onContentSizeChange={(contentWidth) => {
            contentWidthRef.current = contentWidth;
          }}
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={100}
          onTouchStart={pauseAutoSlide}
          onTouchEnd={resumeAutoSlideSoon}
          onScrollBeginDrag={pauseAutoSlide}
          onScrollEndDrag={resumeAutoSlideSoon}
          onMomentumScrollEnd={resumeAutoSlideSoon}
        >
          {visibleCategories.map((category) => {
            const name = category.name;
            const image = category.img;
            return (
              <TouchableOpacity
                key={category.id || name}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${name}`}
                onPress={() => handleCategoryPress(name)}
                style={[styles.railCard, { width: railCardWidth }]}
                activeOpacity={0.85}
              >
                {image ? (
                  <Image
                    source={{ uri: imageForSize(image, IMAGE_SIZE.MEDIUM) }}
                    style={styles.railImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    recyclingKey={`category-rail-${category.id || name}`}
                  />
                ) : (
                  <View style={styles.railIconContainer}>
                    <Ionicons
                      name={getCategoryIcon(name)}
                      size={34}
                      color="#16A34A"
                    />
                  </View>
                )}
                <View style={styles.railTitleContainer}>
                  <Text style={styles.railTitle} numberOfLines={1}>
                    {name}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#16A34A" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
        >
          <View style={styles.grid}>
            {categoryData && categoryData.length > 0
              ? categoryData.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => handleCategoryPress(cat.name)}
                  style={[styles.card, { width: cardWidth }]}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardGradient}>
                    {/* Icon Badge */}
                    <View style={styles.iconBadge}>
                      <View style={styles.iconBadgeGradient}>
                        <Ionicons
                          name={getCategoryIcon(cat.name)}
                          size={20}
                          color="#16A34A"
                        />
                      </View>
                    </View>

                    {/* Image */}
                    <View style={styles.imageContainer}>
                      <Image
                        source={{
                          uri: imageForSize(cat.img, IMAGE_SIZE.MEDIUM),
                        }}
                        style={styles.image}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                        recyclingKey={`cat-${cat.id}`}
                      />
                    </View>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                      <Text style={styles.title} numberOfLines={2}>
                        {cat.name}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#16A34A"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
                ))
              : // Fallback to text-only categories
                categories.map(
                (category) =>
                  category !== "All" && (
                    <TouchableOpacity
                      key={category}
                      onPress={() => handleCategoryPress(category)}
                      style={[styles.fallbackCard, { width: cardWidth }]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.fallbackGradient}>
                        <Ionicons
                          name={getCategoryIcon(category)}
                          size={32}
                          color="#16A34A"
                        />
                        <Text style={styles.fallbackTitle}>{category}</Text>
                      </View>
                    </TouchableOpacity>
                  ),
                )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  railHeader: {
    marginBottom: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#14532D",
  },
  railHeaderText: {
    marginTop: 2,
    fontSize: 21,
  },
  eyebrow: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  railContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
  railCard: {
    minHeight: 146,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  railImage: {
    width: "100%",
    height: 104,
  },
  railIconContainer: {
    width: "100%",
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },
  railTitleContainer: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 6,
    paddingHorizontal: 10,
  },
  railTitle: {
    flex: 1,
    color: "#14532D",
    fontSize: 13,
    fontWeight: "700",
  },
  gridContainer: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardGradient: {
    height: 180,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F0FDF4",
  },
  iconBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  iconBadgeGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#DCFCE7",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14532D",
    flex: 1,
  },
  fallbackCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  fallbackGradient: {
    height: 120,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14532D",
    textAlign: "center",
  },
});

export default Categories;
