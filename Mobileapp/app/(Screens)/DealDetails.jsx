import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dealsService } from "../../utils/dealsService";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

const formatAmount = (amount, currency) =>
  `${currency} ${Number(amount || 0).toLocaleString("en", {
    maximumFractionDigits: 0,
  })}`;

const DealDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeId = Array.isArray(params.dealId)
    ? params.dealId[0]
    : params.dealId;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [now, setNow] = useState(0);

  const loadDeal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!routeId) throw new Error("This deal link is missing its ID.");
      const deals = await dealsService.getDealProducts();
      const found = deals.find(
        (item) =>
          String(item.$id || item.id) === String(routeId) ||
          String(item.productId) === String(routeId),
      );
      if (!found) throw new Error("This deal is no longer available.");
      setDeal(found);
    } catch (loadError) {
      console.error("Failed to load deal details:", loadError);
      setError(loadError.message || "Could not load this deal.");
      setDeal(null);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal, retryKey]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(Screens)/Deals");
  };

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.stateTitle}>Loading deal details</Text>
      </View>
    );
  }

  if (error || !deal) {
    return (
      <View style={styles.stateContainer}>
        <View style={styles.stateIcon}>
          <Ionicons name="pricetag-outline" size={30} color="#DC2626" />
        </View>
        <Text style={styles.stateTitle}>Deal not available</Text>
        <Text style={styles.stateDescription}>
          {error || "This offer may have ended or been removed."}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setRetryKey((key) => key + 1)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to deals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = deal.productName || deal.name || "Special offer";
  const currency =
    deal.originalPrice?.currency || deal.price?.currency || "KES";
  const dealPrice = deal.dealPrice ?? deal.price;
  const originalPrice =
    deal.originalPrice?.convertedPrice ?? (Number(deal.price) || 0);
  const savedAmount = Math.max(0, originalPrice - Number(dealPrice || 0));
  const image = deal.image || deal.images?.[0];
  const dealEndTime = deal.endTime ? new Date(deal.endTime).getTime() : NaN;
  const remainingSeconds = Number.isFinite(dealEndTime)
    ? Math.max(0, Math.floor((dealEndTime - now) / 1000))
    : null;
  const countdown = remainingSeconds === null
    ? null
    : remainingSeconds <= 0
      ? "Deal ended"
      : `${Math.floor(remainingSeconds / 3600)}h ${Math.floor((remainingSeconds % 3600) / 60)}m ${remainingSeconds % 60}s`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back to deals"
        onPress={handleBack}
        style={styles.backLink}
      >
        <Ionicons name="arrow-back" size={19} color="#374151" />
        <Text style={styles.backLinkText}>Back to deals</Text>
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{ uri: imageForSize(image, IMAGE_SIZE.LARGE) }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="pricetag-outline" size={46} color="#9CA3AF" />
          </View>
        )}
        <View
          style={[
            styles.badge,
            deal.isFlash
              ? styles.flashBadge
              : deal.isPremium || deal.premiumDeal
                ? styles.premiumBadge
                : styles.dealBadge,
          ]}
        >
          <Text style={styles.badgeText}>
            {deal.isFlash
              ? "FLASH SALE"
              : deal.isPremium || deal.premiumDeal
                ? "PREMIUM"
                : "SPECIAL DEAL"}
          </Text>
        </View>
        {Number(deal.discount) > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>−{deal.discount}%</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsCard}>
        {(deal.categoryName || deal.category) && (
          <Text style={styles.category}>
            {deal.categoryName || deal.category}
          </Text>
        )}
        <Text style={styles.title}>{name}</Text>

        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <Text style={styles.dealPrice}>
              {formatAmount(dealPrice, currency)}
            </Text>
            <Text style={styles.originalPrice}>
              {formatAmount(originalPrice, currency)}
            </Text>
          </View>
          {savedAmount > 0 && (
            <Text style={styles.savings}>
              You save {formatAmount(savedAmount, currency)}
            </Text>
          )}
        </View>

        {countdown && (
          <View
            style={[
              styles.countdownCard,
              remainingSeconds === 0 && styles.expiredCard,
            ]}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={remainingSeconds === 0 ? "#6B7280" : "#DC2626"}
            />
            <View style={styles.countdownCopy}>
              <Text style={styles.countdownLabel}>
                {remainingSeconds === 0 ? "Offer ended" : "Limited time offer"}
              </Text>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          </View>
        )}

        {deal.description ? (
          <View style={styles.descriptionBlock}>
            <Text style={styles.descriptionTitle}>About this offer</Text>
            <Text style={styles.description}>{deal.description}</Text>
          </View>
        ) : null}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#92400E"
          />
          <Text style={styles.noticeText}>
            Deal purchases are not available in the app yet. You can review the
            current offer here.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 28,
  },
  backLink: {
    minHeight: 48,
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  backLinkText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    height: 300,
    marginHorizontal: 16,
    marginTop: 4,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  flashBadge: {
    backgroundColor: "#DC2626",
  },
  premiumBadge: {
    backgroundColor: "#7C3AED",
  },
  dealBadge: {
    backgroundColor: "#D97706",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: "#B91C1C",
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 22,
    backgroundColor: "#F9FAFB",
  },
  category: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    marginTop: 5,
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: 23,
    lineHeight: 31,
  },
  priceBlock: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 10,
  },
  dealPrice: {
    color: "#DC2626",
    fontFamily: "Poppins-Bold",
    fontSize: 24,
  },
  originalPrice: {
    color: "#6B7280",
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  savings: {
    marginTop: 5,
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
  },
  countdownCard: {
    minHeight: 68,
    marginTop: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 15,
    backgroundColor: "#FEF2F2",
  },
  expiredCard: {
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  countdownCopy: {
    flex: 1,
  },
  countdownLabel: {
    color: "#6B7280",
    fontSize: 12,
  },
  countdownText: {
    marginTop: 2,
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "800",
  },
  descriptionBlock: {
    marginTop: 18,
  },
  descriptionTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    marginTop: 6,
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
  },
  notice: {
    marginTop: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 9,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
  },
  noticeText: {
    flex: 1,
    color: "#78350F",
    fontSize: 12,
    lineHeight: 18,
  },
  stateContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  stateIcon: {
    width: 64,
    height: 64,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
  },
  stateTitle: {
    marginTop: 12,
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    textAlign: "center",
  },
  stateDescription: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#DC2626",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    minHeight: 44,
    marginTop: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DealDetails;
