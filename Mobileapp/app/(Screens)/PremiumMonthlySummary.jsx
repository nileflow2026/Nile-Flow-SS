/* eslint-disable react/no-unescaped-entities */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import { premiumService } from "../../utils/premiumService";

/**
 * PremiumMonthlySummary - Shows monthly savings for premium users
 * Displays how much value they've received from their subscription
 */
const PremiumMonthlySummary = () => {
  const { isPremium, loading: statusLoading } = usePremiumStatus();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isPremium) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await premiumService.getMonthlySummary();
        setSummary(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isPremium]);

  if (statusLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6366f1" />
          <View style={styles.loadingContent}>
            <View style={styles.loadingHeader} />
            <View style={styles.loadingGrid}>
              <View style={styles.loadingItem} />
              <View style={styles.loadingItem} />
              <View style={styles.loadingItem} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!isPremium) {
    return null;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load monthly summary</Text>
      </View>
    );
  }

  if (!summary) {
    return null;
  }

  const {
    totalSavings,
    deliverySavings,
    milesBonus,
    exclusiveDeals,
    subscriptionCost = 200,
  } = summary;
  const netSavings = totalSavings - subscriptionCost;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.mainCard}>
        {/* Background Decorations */}
        <View style={[styles.backgroundDecoration, styles.topDecoration]} />
        <View style={[styles.backgroundDecoration, styles.bottomDecoration]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Ionicons name="cash" size={28} color="#FCD34D" />
              <Text style={styles.title}>This Month's Savings</Text>
            </View>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="star" size={32} color="#FCD34D" />
          </View>
        </View>

        {/* Savings Breakdown */}
        <View style={styles.savingsGrid}>
          {/* Fast Delivery Card */}
          <TouchableOpacity style={styles.savingsCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, styles.blueIcon]}>
                <Ionicons name="car" size={24} color="white" />
              </View>
              <Text style={styles.cardLabel}>Fast Delivery</Text>
            </View>
            <Text style={styles.cardValue}>
              {deliverySavings} <Text style={styles.currency}>Ksh</Text>
            </Text>
            <Text style={styles.cardDescription}>Saved on shipping costs</Text>
          </TouchableOpacity>

          {/* Bonus Miles Card */}
          <TouchableOpacity style={styles.savingsCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, styles.amberIcon]}>
                <Ionicons name="star" size={24} color="white" />
              </View>
              <Text style={styles.cardLabel}>Bonus Miles</Text>
            </View>
            <Text style={styles.cardValue}>
              {milesBonus} <Text style={styles.currency}>miles</Text>
            </Text>
            <Text style={styles.cardDescription}>Extra from 2x multiplier</Text>
          </TouchableOpacity>

          {/* Premium Deals Card */}
          <TouchableOpacity style={styles.savingsCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, styles.emeraldIcon]}>
                <Ionicons name="pricetag" size={24} color="white" />
              </View>
              <Text style={styles.cardLabel}>Premium Deals</Text>
            </View>
            <Text style={styles.cardValue}>
              {exclusiveDeals} <Text style={styles.currency}>Ksh</Text>
            </Text>
            <Text style={styles.cardDescription}>Exclusive discounts</Text>
          </TouchableOpacity>
        </View>

        {/* Total Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Value Received</Text>
            <Text style={styles.summaryValue}>{totalSavings} Ksh</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summarySubLabel}>Subscription Cost</Text>
            <Text style={styles.summaryCost}>- {subscriptionCost} Ksh</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Net Savings</Text>
            <Text
              style={[
                styles.summaryTotalValue,
                { color: netSavings >= 0 ? "#10b981" : "#f59e0b" },
              ]}
            >
              {netSavings >= 0 ? "+" : ""}
              {netSavings} Ksh
            </Text>
          </View>
        </View>

        {/* Insight */}
        {netSavings > 0 && (
          <View style={[styles.insightCard, styles.positiveInsight]}>
            <View style={[styles.insightIcon, styles.positiveIcon]}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Excellent Value! 🎉</Text>
              <Text style={styles.insightText}>
                Your premium membership has already paid for itself this month!
                Keep shopping to maximize your savings.
              </Text>
            </View>
          </View>
        )}

        {netSavings < 0 && (
          <View style={[styles.insightCard, styles.neutralInsight]}>
            <View style={[styles.insightIcon, styles.neutralIcon]}>
              <Ionicons name="information-circle" size={24} color="white" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Keep Shopping! 💡</Text>
              <Text style={styles.insightText}>
                Make a few more purchases this month to maximize your premium
                value!
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainCard: {
    borderRadius: 24,
    padding: 24,
    margin: 16,
    marginBottom: 32,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backgroundDecoration: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.1,
  },
  topDecoration: {
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: "#BBF7D0",
  },
  bottomDecoration: {
    bottom: -48,
    left: -48,
    width: 96,
    height: 96,
    backgroundColor: "#D1FAE5",
  },
  loadingContainer: {
    padding: 16,
  },
  loadingCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingContent: {
    width: "100%",
    marginTop: 16,
  },
  loadingHeader: {
    height: 24,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    width: "33%",
    marginBottom: 16,
  },
  loadingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingItem: {
    height: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    width: cardWidth,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    position: "relative",
  },
  headerContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginLeft: 8,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
  },
  headerIcon: {
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    borderColor: "#FDE68A",
    borderWidth: 1,
  },
  savingsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    flexWrap: "wrap",
  },
  savingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: cardWidth,
    marginBottom: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
  },
  blueIcon: {
    backgroundColor: "#2563EB",
  },
  amberIcon: {
    backgroundColor: "#D97706",
  },
  emeraldIcon: {
    backgroundColor: "#16A34A",
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#374151",
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  currency: {
    fontSize: 14,
    color: "#6B7280",
  },
  cardDescription: {
    fontSize: 10,
    color: "#6B7280",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
    marginBottom: 0,
  },
  summaryLabel: {
    color: "#14532D",
    fontFamily: "Poppins-Medium",
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
  },
  summarySubLabel: {
    color: "#6B7280",
    fontSize: 14,
  },
  summaryCost: {
    color: "#374151",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
  },
  summaryTotalLabel: {
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    fontSize: 16,
  },
  summaryTotalValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  positiveInsight: {
    borderColor: "#16A34A",
    borderWidth: 2,
  },
  neutralInsight: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  insightIcon: {
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  positiveIcon: {
    backgroundColor: "#16A34A",
  },
  neutralIcon: {
    backgroundColor: "#2563EB",
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    marginBottom: 4,
    color: "#14532D",
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
});

export default PremiumMonthlySummary;
