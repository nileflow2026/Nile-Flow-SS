import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../Context/CartContext_NEW";
import { signOut, useGlobalContext } from "../../Context/GlobalProvider";
import i18n, { useLanguage } from "../../i18n";

const accountItems = [
  {
    title: "Edit profile",
    description: "Update your personal details",
    icon: "person-outline",
    route: "/(Screens)/EditProfile",
  },
  {
    title: "Orders",
    description: "Track purchases and order history",
    icon: "local-shipping",
    route: "/(Screens)/Orders",
  },
  {
    title: "Nile Miles",
    description: "Learn how to earn and use your Miles",
    titleTranslationKey: "Nile Miles",
    descriptionTranslationKey: "Learn how to earn and use your Miles",
    icon: "stars",
    route: "/(Screens)/NileMilesExplainer",
  },
  {
    title: "Delivery addresses",
    description: "Manage your saved delivery locations",
    icon: "location-on",
    route: "/(Screens)/Addresses",
  },
  {
    title: "Payment methods",
    description: "Manage your checkout options",
    icon: "credit-card",
    route: "/(Screens)/PaymentMethods",
  },
  {
    title: "Security",
    description: "Password and sign in protection",
    icon: "shield",
    route: "/(Screens)/Security",
  },
  /* {
    title: "Notifications",
    description: "View your order and account updates",
    icon: "notifications-none",
    route: "/(Screens)/MyNotificationsScreen",
  },
  {
    title: "Premium membership",
    description: "Manage your Nile Premium subscription",
    icon: "workspace-premium",
    route: "/(Screens)/SubscriptionSettings",
  }, */
  {
    title: "GamificationHub",
    description: "Explore and redeem your rewards",
    icon: "stars",
    route: "/(Screens)/GamificationHub",
  },
];

const preferenceItems = [
  {
    title: "Language",
    description: "Choose your preferred language",
    icon: "language",
    route: "/(Screens)/Language",
  },
  {
    title: "Currency",
    description: "Choose how prices are displayed",
    icon: "currency-exchange",
    route: "/(Screens)/Currency",
  },
  {
    title: "Return policy",
    description: "Review returns and refunds",
    icon: "assignment-return",
    route: "/(Screens)/ReturnPolicy",
  },
];

const supportItems = [
  {
    title: "Help center",
    description: "Get help with using Nile Flow",
    icon: "help-outline",
    route: "/(Screens)/HelpCenter",
  },
  {
    title: "Report a problem",
    description: "Tell us about an issue",
    icon: "error-outline",
    route: "/(Screens)/ReportaProblem",
  },
  {
    title: "About Nile Flow",
    description: "Learn more about our marketplace",
    icon: "info-outline",
    route: "/(Screens)/About",
  },
  {
    title: "Terms and privacy",
    description: "Read our terms and privacy information",
    icon: "policy",
    route: "/(Screens)/TermsOfService",
  },
  {
    title: "Privacy policy",
    description: "Learn how we handle your information",
    icon: "privacy-tip",
    route: "/(Screens)/PrivacyPolicy",
  },
];

const SettingsSection = ({ title, items, onSelect }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>
      {items.map((item, index) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          onPress={() => onSelect(item.route)}
          style={[
            styles.settingRow,
            index !== items.length - 1 && styles.settingRowBorder,
          ]}
        >
          <View style={styles.rowIcon}>
            <MaterialIcons name={item.icon} size={21} color="#15803D" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>
              {item.titleTranslationKey
                ? i18n.t(item.titleTranslationKey)
                : item.title}
            </Text>
            <Text style={styles.rowDescription}>
              {item.descriptionTranslationKey
                ? i18n.t(item.descriptionTranslationKey)
                : item.description}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        </Pressable>
      ))}
    </View>
  </View>
);

const Settings = () => {
  useLanguage();
  const router = useRouter();
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { setCart } = useCart();

  const logout = async () => {
    try {
      await signOut();
      setCart([]);
      setUser(null);
      setIsLogged(false);
      router.replace("/(auth)/sign-in");
    } catch (error) {
      Alert.alert("Sign out failed", "Please try again.");
      console.error("Logout error:", error);
    }
  };

  const accountName = user?.username || user?.name || "Your account";
  const accountEmail = user?.email || "Manage your Nile Flow account";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={22} color="#14532D" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{i18n.t("Settings")}</Text>
            <Text style={styles.subtitle}>
              Manage your account and shopping preferences.
            </Text>
          </View>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.accountAvatar}>
            <MaterialIcons name="person" size={27} color="#15803D" />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName} numberOfLines={1}>
              {accountName}
            </Text>
            <Text style={styles.accountEmail} numberOfLines={1}>
              {accountEmail}
            </Text>
          </View>
          <MaterialIcons name="verified-user" size={20} color="#16A34A" />
        </View>

        <SettingsSection
          title="Account"
          items={accountItems}
          onSelect={(route) => router.push(route)}
        />
        <SettingsSection
          title="Preferences"
          items={preferenceItems}
          onSelect={(route) => router.push(route)}
        />
        <SettingsSection
          title="Support and information"
          items={supportItems}
          onSelect={(route) => router.push(route)}
        />

        <Pressable
          accessibilityRole="button"
          onPress={logout}
          style={styles.signOutButton}
        >
          <MaterialIcons name="logout" size={20} color="#B91C1C" />
          <Text style={styles.signOutText}>{i18n.t("Log out")}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(Screens)/AccountDeletion")}
          style={styles.deleteAccountButton}
        >
          <Text style={styles.deleteAccountText}>Delete account and data</Text>
          <MaterialIcons name="chevron-right" size={20} color="#B91C1C" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: "#111827",
    fontSize: 25,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  accountDetails: {
    flex: 1,
    gap: 4,
  },
  accountName: {
    color: "#14532D",
    fontSize: 16,
    fontWeight: "700",
  },
  accountEmail: {
    color: "#6B7280",
    fontSize: 13,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#14532D",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCard: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  settingRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  rowDescription: {
    color: "#6B7280",
    fontSize: 12,
  },
  signOutButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  signOutText: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  deleteAccountText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default Settings;
