import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "../../Context/GlobalProvider";

const { width } = Dimensions.get("window");

const PaymentMethods = () => {
  const router = useRouter();
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [router]);
  const { isLogged } = useGlobalContext();

  // Placeholder saved methods — replace with real API data as needed
  const [savedMethods] = useState([
    // Empty by default; populate from backend when available
  ]);

  const paymentOptions = [
    {
      title: "Credit / Debit Card",
      subtitle: "Visa, Mastercard, American Express",
      icon: "credit-card",
      iconColors: ["#2563EB", "#1D4ED8"],
      onPress: () =>
        Alert.alert(
          "Add Card",
          "Card payment is handled at checkout via Stripe.",
          [{ text: "OK" }],
        ),
    },
    {
      title: "M-Pesa",
      subtitle: "Lipa na M-Pesa (Kenya)",
      icon: "phone-android",
      iconColors: ["#059669", "#047857"],
      onPress: () =>
        Alert.alert(
          "M-Pesa",
          "M-Pesa payment is handled at checkout. Enter your number when prompted.",
          [{ text: "OK" }],
        ),
    },
    {
      title: "Airtel Money",
      subtitle: "Airtel Money mobile payment",
      icon: "wifi",
      iconColors: ["#DC2626", "#B91C1C"],
      onPress: () =>
        Alert.alert(
          "Airtel Money",
          "Airtel Money payment is processed at checkout.",
          [{ text: "OK" }],
        ),
    },
    {
      title: "Pesapal",
      subtitle: "Cards, M-Pesa, Airtel Money, and more",
      icon: "payment",
      iconColors: ["#7C3AED", "#4F46E5"],
      onPress: () =>
        Alert.alert(
          "Pesapal",
          "Pesapal checkout is available during order payment in the app.",
          [{ text: "OK" }],
        ),
    },
    {
      title: "Bank Transfer",
      subtitle: "Direct bank transfer",
      icon: "account-balance",
      iconColors: ["#7C3AED", "#6D28D9"],
      onPress: () =>
        Alert.alert(
          "Bank Transfer",
          "Contact support for bank transfer payment details.",
          [{ text: "OK" }],
        ),
    },
  ];

  const handleGoToCheckout = () => {
    router.push("/Cart");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <Text style={styles.headerSubtitle}>
            Manage how you pay on NileFlow
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Saved Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
          <View style={styles.card}>
            {!isLogged ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="lock-outline" size={48} color="#BBF7D0" />
                <Text style={styles.emptyTitle}>Sign In Required</Text>
                <Text style={styles.emptySubtitle}>
                  Sign in to view and manage your saved payment methods
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/sign-in")}
                  style={[styles.signInButton, { backgroundColor: "#16A34A" }]}
                >
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : savedMethods.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="credit-card-off"
                  size={48}
                  color="#BBF7D0"
                />
                <Text style={styles.emptyTitle}>No Saved Methods</Text>
                <Text style={styles.emptySubtitle}>
                  Your payment methods will appear here after your first
                  checkout
                </Text>
                <TouchableOpacity
                  onPress={handleGoToCheckout}
                  style={[styles.signInButton, { backgroundColor: "#16A34A" }]}
                >
                  <Text style={styles.signInText}>Go to Checkout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              savedMethods.map((method, index) => (
                <View
                  key={index}
                  style={[
                    styles.savedMethodItem,
                    index < savedMethods.length - 1 && styles.menuItemBorder,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.menuIconContainer,
                        { backgroundColor: method.iconColors[0] },
                      ]}
                    >
                      <MaterialIcons
                        name={method.icon}
                        size={20}
                        color="white"
                      />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>{method.title}</Text>
                      <Text style={styles.menuSubtitle}>{method.subtitle}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={method.onDelete}>
                    <MaterialIcons
                      name="delete-outline"
                      size={22}
                      color="#DC2626"
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Accepted Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
          <View style={styles.card}>
            {paymentOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={option.onPress}
                style={[
                  styles.menuItem,
                  index < paymentOptions.length - 1 && styles.menuItemBorder,
                ]}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: option.iconColors[0] },
                    ]}
                  >
                    <MaterialIcons name={option.icon} size={20} color="white" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{option.title}</Text>
                    <Text style={styles.menuSubtitle}>{option.subtitle}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#16A34A" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.noticeBanner}>
          <MaterialIcons name="verified-user" size={24} color="#10B981" />
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>Secure Payments</Text>
            <Text style={styles.noticeSubtitle}>
              All transactions are encrypted and processed securely via Stripe,
              Pesapal, and M-Pesa
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    fontSize: width < 350 ? 18 : 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: width < 350 ? 14 : 16,
    fontFamily: "Poppins-SemiBold",
    color: "#14532D",
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  savedMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: width < 350 ? 14 : 15,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  signInButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    overflow: "hidden",
  },
  signInGradient: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInText: {
    color: "white",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    gap: 12,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
  },
  noticeSubtitle: {
    fontSize: 12,
    color: "#374151",
    marginTop: 3,
    lineHeight: 18,
    fontFamily: "Poppins-Regular",
  },
});

export default PaymentMethods;
