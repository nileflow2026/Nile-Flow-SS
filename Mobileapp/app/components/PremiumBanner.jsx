import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePremiumContext } from "../../Context/PremiumContext";

const PremiumBanner = () => {
  const router = useRouter();
  const { isPremium, loading } = usePremiumContext();

  // Don't show the banner to premium users
  if (loading || isPremium) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#F59E0B", "#EAB308"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name="diamond" size={24} color="#FFF" />
            </LinearGradient>
          </View>

          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Unlock Nile Premium</Text>
              <MaterialCommunityIcons
                name="star-four-points"
                size={16}
                color="#F59E0B"
              />
            </View>
            <Text style={styles.subtitle}>
              Get 2x Nile Miles & exclusive benefits
            </Text>
          </View>
        </View>

        {/* Benefits Grid */}
        <View style={styles.benefitsGrid}>
          <View style={styles.benefitCard}>
            <View
              style={[
                styles.benefitGradient,
                { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
              ]}
            >
              <MaterialCommunityIcons name="trophy" size={20} color="#16A34A" />
              <Text style={[styles.benefitValue, { color: "#14532D" }]}>
                2x Miles
              </Text>
              <Text style={styles.benefitLabel}>Per Purchase</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View
              style={[
                styles.benefitGradient,
                { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" },
              ]}
            >
              <Ionicons name="flash" size={20} color="#D97706" />
              <Text style={[styles.benefitValue, { color: "#92400E" }]}>
                1-2 Days
              </Text>
              <Text style={styles.benefitLabel}>Fast Delivery</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View
              style={[
                styles.benefitGradient,
                { backgroundColor: "#EDE9FE", borderColor: "#DDD6FE" },
              ]}
            >
              <Ionicons name="star" size={20} color="#7C3AED" />
              <Text style={[styles.benefitValue, { color: "#4C1D95" }]}>
                VIP
              </Text>
              <Text style={styles.benefitLabel}>Access</Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={() => router.push("/(Screens)/SubscriptionSettings")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#F59E0B", "#EAB308"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Ionicons name="gift" size={20} color="#FFF" />
            <Text style={styles.ctaText}>View Premium Benefits</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradientContainer: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 20,
    backgroundColor: "#FFFBEB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D97706",
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
    color: "#4B5563",
  },
  benefitsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  benefitCard: {
    flex: 1,
  },
  benefitGradient: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  benefitValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 6,
  },
  benefitLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default PremiumBanner;
