/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../api";
import { getCurrentUser, useGlobalContext } from "../../Context/GlobalProvider";
import i18n, { useLanguage } from "../../i18n";
import AIChat from "../components/AIChat";
import Categories from "../components/Categories";
import CurrencyUpdater from "../components/CurrencyUpdater";
import FeaturedProducts from "../components/FeaturedProducts";
import HeroCarousel from "../components/HeroCarousel";
import PremiumBanner from "../components/PremiumBanner";
import PremiumDeals from "../components/PremiumDeals";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const TAGLINES = [
  "Africa's Commerce, Reimagined 🌍",
  "Earn Nile Miles on Every Order ✨",
  "Fast Delivery Across the Continent 🚀",
  "Shop Local. Think Continental. 💪",
  "Exclusive Deals for Premium Members 🎁",
  "Empowering African Commerce 💸",
  "Quality Products, Trusted Sellers ✔️",
];

const HomeErrorFallback = ({ onRetry }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    }}
  >
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#F0FDF4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#BBF7D0",
      }}
    >
      <Text style={{ fontSize: 38 }}>📡</Text>
    </View>
    <Text
      style={{
        fontSize: 20,
        fontFamily: "Poppins-Bold",
        color: "#111827",
        textAlign: "center",
        marginBottom: 10,
      }}
    >
      Connection Issue
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 36,
      }}
    >
      We couldn't reach Nile Flow right now. Check your connection and try
      again.
    </Text>
    <TouchableOpacity
      onPress={onRetry}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#16A34A",
        borderRadius: 12,
        paddingVertical: 14,
        width: "100%",
        alignItems: "center",
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 16,
          fontFamily: "Poppins-Bold",
        }}
      >
        Try Again
      </Text>
    </TouchableOpacity>
    <Text
      style={{
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 18,
      }}
    >
      If the problem continues, our team is on it.
    </Text>
  </View>
);

const HomeSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    {/* Header skeleton — green tint to match actual header */}
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: (StatusBar.currentHeight ?? 24) + 16,
        paddingBottom: 24,
        backgroundColor: "#D1FAE5",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          columnGap: 12,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#A7F3D0",
          }}
        />
        <View>
          <View
            style={{
              width: 80,
              height: 11,
              borderRadius: 6,
              backgroundColor: "#A7F3D0",
              marginBottom: 6,
            }}
          />
          <View
            style={{
              width: 130,
              height: 16,
              borderRadius: 6,
              backgroundColor: "#A7F3D0",
            }}
          />
        </View>
      </View>
      <View
        style={{
          width: 190,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#A7F3D0",
        }}
      />
    </View>

    {/* Carousel placeholder */}
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 16,
        height: 180,
        borderRadius: 16,
        backgroundColor: "#E5E7EB",
      }}
    />

    {/* Categories pills */}
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        columnGap: 10,
        marginBottom: 20,
      }}
    >
      {[70, 88, 60, 94].map((w, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: 34,
            borderRadius: 17,
            backgroundColor: "#E5E7EB",
          }}
        />
      ))}
    </View>

    {/* Section label + two product card placeholders */}
    <View style={{ paddingHorizontal: 16 }}>
      <View
        style={{
          width: 150,
          height: 18,
          borderRadius: 6,
          backgroundColor: "#E5E7EB",
          marginBottom: 14,
        }}
      />
      <View style={{ flexDirection: "row", columnGap: 12 }}>
        {[1, 2].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 210,
              borderRadius: 12,
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 8,
                backgroundColor: "#E5E7EB",
                marginBottom: 10,
              }}
            />
            <View
              style={{
                width: "70%",
                height: 12,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
                marginBottom: 6,
              }}
            />
            <View
              style={{
                width: "40%",
                height: 14,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
        ))}
      </View>
    </View>
  </View>
);

const Home = () => {
  useLanguage(); // re-render when locale changes
  const router = useRouter();
  const { user, loading: userLoading } = useGlobalContext();
  console.log("🏠 Home: user=%s, userLoading=%s", user);
  const [categories, setCategories] = useState([i18n.t("All")]);
  const [categoryData, setCategoryData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(i18n.t("All"));
  const [selectedLanguageLabel, setSelectedLanguageLabel] = useState("English");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [dataReady, setDataReady] = useState(false);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setDataReady(false);
    setRetryKey((k) => k + 1);
  };

  // Rotating tagline
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // ── Consolidated startup: user + categories in parallel ──
  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const load = async () => {
      // Safety net: if nothing completes in 10s, force dataReady
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn("⏱️ Home: safety timeout fired, forcing dataReady");
          setDataReady(true);
          setIsLoading(false);
        }
      }, 10000);

      try {
        // Fetch user (non-blocking for the UI — user can be null)
        const currentUser = await getCurrentUser().catch(() => null);
        if (currentUser) {
          // user state is managed by GlobalProvider, not local state
        }
      } catch (_) {
        // User fetch failure is non-fatal
      }

      try {
        // Fetch categories
        const res = await axiosClient.get("/api/customerprofile/categories");
        if (!cancelled && Array.isArray(res.data)) {
          const cats = ["All", ...res.data.map((cat) => cat.name)];
          setCategories(cats);
          setCategoryData(res.data);
        } else if (
          !cancelled &&
          res.data.success &&
          Array.isArray(res.data.categories)
        ) {
          const categoryNames = res.data.categories.map((cat) =>
            typeof cat === "string" ? cat : cat.name,
          );
          setCategories(["All", ...categoryNames]);
          if (res.data.categories[0]?.img) setCategoryData(res.data.categories);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❌ Error fetching categories:", err.message);
          // Graceful fallback — categories already default to ["All"]
        }
      }

      if (!cancelled) {
        clearTimeout(timeoutId);
        setDataReady(true);
        setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [retryKey]);

  // BackHandler
  useEffect(() => {
    const onBackPress = () => {
      try {
        router.back();
      } catch (_) {
        router.replace("/(tabs)/BottomTabs");
      }
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [router]);

  // ── Show skeleton while loading ──
  if ((isLoading || userLoading) && !dataReady) {
    console.log(
      "🎭 Home: Showing skeleton (isLoading=%s, userLoading=%s, dataReady=%s)",
      isLoading,
      userLoading,
      dataReady,
    );
    return <HomeSkeleton />;
  }

  // ── Error state ──
  if (hasError) {
    console.log("❌ Home: Showing error fallback");
    return <HomeErrorFallback onRetry={handleRetry} />;
  }

  console.log(
    "✅ Home: Rendering main content (isLoading=%s, userLoading=%s, dataReady=%s)",
    isLoading,
    userLoading,
    dataReady,
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
      }}
    >
      <CurrencyUpdater />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Header Section */}
        <View style={[styles.headerContainer, { backgroundColor: "#16A34A" }]}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />
          <View style={styles.greetingRow}>
            <View style={styles.profileContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri:
                      user?.avatarUrl &&
                      typeof user.avatarUrl === "string" &&
                      user.avatarUrl.trim() !== ""
                        ? user.avatarUrl
                        : "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/695439130011158bb8af/view?project=6926c7df002fa7831d94",
                  }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              </View>
              <View>
                <Text style={styles.greetingSubText}>{getGreeting()} 👋</Text>
                <Text style={styles.greetingText}>
                  {user?.username || "Guest"}
                </Text>
              </View>
            </View>
          </View>
          {/* Rotating tagline pill */}
          <View style={styles.taglinePill}>
            <Text style={styles.taglineText}>{TAGLINES[taglineIndex]}</Text>
          </View>
        </View>

        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Categories Section */}
        <Categories
          categories={categories.map((cat) =>
            cat === "All" ? i18n.t("All") : i18n.t(cat) || cat,
          )}
          categoryData={categoryData}
          selectedCategory={i18n.t(selectedCategory)}
        />

        {/* Featured Products Section */}
        <FeaturedProducts />
      </ScrollView>
      <AIChat />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: (StatusBar.currentHeight ?? 24) + 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -30,
  },
  decorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: 30,
    right: 70,
  },
  decorCircle3: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: 10,
    right: 20,
  },
  avatarWrapper: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    padding: 2,
  },
  greetingSubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Poppins-Regular",
  },
  taglinePill: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  taglineText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  greetingText: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
  cartButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minWidth: 60,
    justifyContent: "center",
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  banner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  carouselContainer: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: "600",
  },
  horizontalScroll: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  homeProductItem: {
    marginRight: 12,
    alignItems: "center",
    width: 96,
  },
  homeProductImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    marginBottom: 6,
  },
  homeProductText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
});

export default Home;
