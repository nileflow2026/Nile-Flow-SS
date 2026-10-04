import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dealsService } from "../../utils/dealsService";

const OFFERS = [
  {
    type: "flash",
    label: "Flash Sales",
    icon: "flash",
    colors: ["#DC2626", "#F97316"],
  },
  {
    type: "product",
    label: "Deals",
    icon: "pricetag",
    colors: ["#D97706", "#F97316"],
  },
  {
    type: "ending-soon",
    label: "Ending Soon",
    icon: "time",
    colors: ["#E11D48", "#DC2626"],
  },
];

const getDealIdentity = (deal) => deal?.productId || deal?.$id || deal?.id;

const getCounts = (deals, flashSales) => {
  const flashIdentities = new Set(flashSales.map(getDealIdentity));
  return {
    flash: flashSales.length,
    product: deals.filter(
      (deal) =>
        !deal.isFlash &&
        !deal.isPremium &&
        !deal.premiumDeal &&
        !flashIdentities.has(getDealIdentity(deal)),
    ).length,
    "ending-soon": deals.filter((deal) => deal.isExpiringSoon).length,
  };
};

const DealsSpecialOffers = () => {
  const router = useRouter();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadOffers = async () => {
      setLoading(true);
      setError(false);
      try {
        const { deals, flashSales } = await dealsService.getHomeDealData();
        if (!cancelled) setCounts(getCounts(deals, flashSales));
      } catch (loadError) {
        console.error("Failed to load home deal counts:", loadError);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOffers();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const openDeals = (type) => {
    router.push({
      pathname: "/(Screens)/Deals",
      params: { type },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SAVE MORE TODAY</Text>
          <Text style={styles.title}>Deals and special offers</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View all deals"
          onPress={() => openDeals("all")}
          style={styles.viewAll}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingRow} accessibilityLabel="Loading offers">
          {OFFERS.map((offer) => (
            <View key={offer.type} style={styles.loadingCard}>
              <ActivityIndicator color="#DC2626" />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Offers could not be loaded.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setRetryKey((key) => key + 1)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offerList}
        >
          {OFFERS.map((offer) => (
            <TouchableOpacity
              key={offer.type}
              accessibilityRole="button"
              accessibilityLabel={`${offer.label}, ${counts[offer.type]} active`}
              onPress={() => openDeals(offer.type)}
              activeOpacity={0.85}
              style={styles.offerCardPressable}
            >
              <LinearGradient
                colors={offer.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.offerCard}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={offer.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.offerCopy}>
                  <Text style={styles.offerTitle}>{offer.label}</Text>
                  <Text style={styles.offerCount}>
                    {counts[offer.type]} active
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    columnGap: 10,
  },
  eyebrow: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 3,
    color: "#111827",
    fontSize: 20,
    fontFamily: "Poppins-Bold",
  },
  viewAll: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  viewAllText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  offerList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    columnGap: 12,
  },
  offerCardPressable: {
    width: 196,
    minHeight: 88,
    borderRadius: 18,
    overflow: "hidden",
  },
  offerCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  offerCopy: {
    flex: 1,
  },
  offerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  offerCount: {
    marginTop: 2,
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
  },
  loadingRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    columnGap: 12,
  },
  loadingCard: {
    width: 196,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
  },
  errorCard: {
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#DC2626",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default DealsSpecialOffers;
