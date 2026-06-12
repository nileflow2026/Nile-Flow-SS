/* eslint-disable react/no-unescaped-entities */
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const About = () => {
  // Premium African marketplace theme
  const premiumColors = {
    primary: "#D97706", // amber-600 on white
    secondary: "#B45309", // amber-700
    accent: "#16A34A", // green-600
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    textSecondary: "#6B7280",
  };

  const stats = [
    { label: "African Artisans", value: "500+", icon: "people" },
    { label: "Countries", value: "54", icon: "public" },
    { label: "Products", value: "5000+", icon: "inventory" },
    { label: "Satisfaction", value: "99%", icon: "star" },
  ];

  const values = [
    {
      icon: "favorite",
      title: "Cultural Integrity",
      description: "Preserving authentic African heritage",
    },
    {
      icon: "security",
      title: "Premium Quality",
      description: "Only the finest handpicked products",
    },
    {
      icon: "group",
      title: "Community First",
      description: "Empowering African communities",
    },
    {
      icon: "eco",
      title: "Sustainable Growth",
      description: "Ethical and eco-friendly practices",
    },
  ];

  const teamMembers = [
    {
      name: "Anthony Wai",
      role: "Founder & CEO",
      avatar: "👑",
      region: "Central Africa",
    },
    {
      name: "Japhet Mupe",
      role: "Head of Operations",
      avatar: "🛡️",
      region: "East Africa",
    },
    {
      name: "Ted Wanjohi",
      role: "Head of Finance",
      avatar: "💎",
      region: "East Africa",
    },
    {
      name: "Charity Kipkemboi",
      role: "Customer Experience",
      avatar: "🌟",
      region: "East Africa",
    },
  ];

  const openPrivacyPolicy = () => {
    Linking.openURL("https://nileflowafrica.com/privacy-policy");
  };

  const contactSupport = () => {
    Alert.alert("Contact Support", "Choose a contact method:", [
      {
        text: "Email",
        onPress: () => Linking.openURL("mailto:support@nileflowafrica.com"),
      },
      { text: "Call", onPress: () => Linking.openURL("tel:+254703115359") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>About Nile Flow</Text>
            <Text style={styles.headerSubtitle}>
              Premium African Marketplace
            </Text>
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.premiumBadge}>
              <MaterialIcons
                name="star"
                size={18}
                color={premiumColors.primary}
              />
              <Text style={styles.badgeText}>Our Story</Text>
              <MaterialIcons name="auto-awesome" size={16} color="#D97706" />
            </View>

            <Text style={styles.heroTitle}>
              About <Text style={styles.heroTitleAccent}>Nile Flow</Text>
            </Text>

            <Text style={styles.heroSubtitle}>Premium African Marketplace</Text>

            <Text style={styles.heroDescription}>
              We are a premium eCommerce platform dedicated to showcasing
              authentic African products to the world. Our mission is to bridge
              the gap between African artisans and global consumers while
              preserving cultural heritage.
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View
                  key={index}
                  style={[
                    styles.statCard,
                    index % 2 === 0
                      ? { borderColor: "#FDE68A" }
                      : { borderColor: "#BBF7D0" },
                  ]}
                >
                  <MaterialIcons
                    name={stat.icon}
                    size={20}
                    color={
                      index % 2 === 0
                        ? premiumColors.primary
                        : premiumColors.accent
                    }
                  />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mission & Vision */}
          <View style={styles.sectionContainer}>
            <View style={styles.missionCard}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[premiumColors.primary, premiumColors.secondary]}
                  style={styles.sectionIcon}
                >
                  <MaterialIcons name="my-location" size={20} color="white" />
                </LinearGradient>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Our Mission</Text>
                  <Text style={styles.sectionSubtitle}>
                    Defining African excellence
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionDescription}>
                To create the world's premier marketplace for authentic African
                products, connecting talented artisans with discerning global
                customers while preserving Africa's rich cultural heritage.
              </Text>
            </View>

            <View style={styles.visionCard}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[premiumColors.accent, "#059669"]}
                  style={styles.sectionIcon}
                >
                  <MaterialIcons name="visibility" size={20} color="white" />
                </LinearGradient>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Our Vision</Text>
                  <Text style={styles.sectionSubtitle}>
                    The future of African commerce
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionDescription}>
                To become the global standard for African eCommerce, where every
                purchase tells a story of craftsmanship, heritage, and quality
                worldwide.
              </Text>
            </View>
          </View>

          {/* Core Values */}
          <View style={styles.sectionContainer}>
            <Text style={styles.mainSectionTitle}>Our Core Values</Text>
            <Text style={styles.mainSectionSubtitle}>
              The principles that guide everything we do at Nile Flow
            </Text>

            <View style={styles.valuesGrid}>
              {values.map((value, index) => (
                <View key={index} style={styles.valueCard}>
                  <View style={styles.valueIcon}>
                    <MaterialIcons
                      name={value.icon}
                      size={20}
                      color={premiumColors.primary}
                    />
                  </View>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  <Text style={styles.valueDescription}>
                    {value.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Leadership Team */}
          <View style={styles.sectionContainer}>
            <Text style={styles.mainSectionTitle}>Our Leadership Team</Text>
            <Text style={styles.mainSectionSubtitle}>
              Passionate individuals from across Africa, united by a shared
              vision
            </Text>

            <View style={styles.teamGrid}>
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.teamCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarEmoji}>
                      {member.avatar}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <View style={styles.memberRegion}>
                    <MaterialIcons
                      name="location-on"
                      size={12}
                      color={premiumColors.accent}
                    />
                    <Text style={styles.memberRegionText}>{member.region}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.mainSectionTitle}>Contact Information</Text>
            <Text style={styles.mainSectionSubtitle}>
              Get in touch with our premium support team
            </Text>

            <View style={styles.contactGrid}>
              <TouchableOpacity
                style={styles.contactCard}
                onPress={() =>
                  Linking.openURL("mailto:support@nileflowafrica.com")
                }
              >
                <View style={styles.contactCardInner}>
                  <View
                    style={[styles.contactIcon, { backgroundColor: "#EFF6FF" }]}
                  >
                    <MaterialIcons name="email" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.contactTitle}>Email Support</Text>
                  <Text style={styles.contactValue}>
                    support@nileflowafrica.com
                  </Text>
                  <Text style={styles.contactDescription}>
                    24/7 Premium Support
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactCard}
                onPress={() => Linking.openURL("tel:+254703115359")}
              >
                <View style={styles.contactCardInner}>
                  <View
                    style={[styles.contactIcon, { backgroundColor: "#DCFCE7" }]}
                  >
                    <MaterialIcons
                      name="phone"
                      size={20}
                      color={premiumColors.accent}
                    />
                  </View>
                  <Text style={styles.contactTitle}>Phone Support</Text>
                  <Text style={styles.contactValue}>+254 703 115 359</Text>
                  <Text style={styles.contactDescription}>Available 24/7</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.contactCard}>
                <View style={styles.contactCardInner}>
                  <View
                    style={[styles.contactIcon, { backgroundColor: "#FEF2F2" }]}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#EF4444"
                    />
                  </View>
                  <Text style={styles.contactTitle}>Headquarters</Text>
                  <Text style={styles.contactValue}>Nairobi, Kenya</Text>
                  <Text style={styles.contactDescription}>
                    Premium Showroom
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* App Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.mainSectionTitle}>App Information</Text>
            <Text style={styles.mainSectionSubtitle}>
              Details about your premium experience
            </Text>

            <View style={styles.appInfoGrid}>
              <View style={styles.appInfoCard}>
                <View style={styles.appInfoHeader}>
                  <MaterialIcons
                    name="diamond"
                    size={24}
                    color={premiumColors.primary}
                  />
                  <View style={styles.appInfoHeaderText}>
                    <Text style={styles.appInfoTitle}>App Version</Text>
                    <Text style={styles.appInfoSubtitle}>Premium Edition</Text>
                  </View>
                </View>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>
                    v{Constants.expoConfig?.version || "1.5.2"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.appInfoCard}
                onPress={openPrivacyPolicy}
              >
                <View style={styles.appInfoCardInner}>
                  <View style={styles.appInfoHeader}>
                    <MaterialIcons
                      name="security"
                      size={24}
                      color={premiumColors.accent}
                    />
                    <View style={styles.appInfoHeaderText}>
                      <Text style={styles.appInfoTitle}>
                        Privacy & Security
                      </Text>
                      <Text style={styles.appInfoSubtitle}>
                        Your data is protected
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.privacyLink}>View Policy →</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.appInfoCard}>
                <View style={styles.appInfoHeader}>
                  <MaterialIcons name="trending-up" size={24} color="#3B82F6" />
                  <View style={styles.appInfoHeaderText}>
                    <Text style={styles.appInfoTitle}>Latest Update</Text>
                    <Text style={styles.appInfoSubtitle}>
                      Enhanced features
                    </Text>
                  </View>
                </View>
                <Text style={styles.updateDate}>Jan 2026</Text>
              </View>
            </View>

            {/* App Features */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Premium App Features</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <MaterialIcons name="star" size={16} color="#fde047" />
                  <Text style={styles.featureText}>Premium Design</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons
                    name="security"
                    size={16}
                    color={premiumColors.accent}
                  />
                  <Text style={styles.featureText}>Secure Payments</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="language" size={16} color="#3b82f6" />
                  <Text style={styles.featureText}>Multi-language</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons
                    name="flash-on"
                    size={16}
                    color={premiumColors.primary}
                  />
                  <Text style={styles.featureText}>Fast Delivery</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Final CTA */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Join Our African Journey</Text>
              <Text style={styles.ctaDescription}>
                Be part of a movement that celebrates African craftsmanship and
                brings premium products to the world.
              </Text>
              <View style={styles.ctaButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() =>
                    Alert.alert("Shop", "Redirecting to premium products...")
                  }
                >
                  <View style={styles.primaryButtonGradient}>
                    <Text style={styles.primaryButtonText}>
                      Shop Premium Products
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={contactSupport}
                >
                  <Text style={styles.secondaryButtonText}>
                    Contact Support
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Header Styles
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
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  // Hero Section
  heroSection: {
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  badgeText: {
    color: "#D97706",
    fontFamily: "Poppins-SemiBold",
    marginHorizontal: 8,
    fontSize: 14,
  },
  heroTitle: {
    fontSize: width > 400 ? 36 : 32,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#14532D",
  },
  heroTitleAccent: {
    color: "#16A34A",
  },
  heroSubtitle: {
    fontSize: 20,
    color: "#D97706",
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
    fontFamily: "Poppins-Regular",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  // Section Containers
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  mainSectionTitle: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    textAlign: "center",
    marginBottom: 8,
  },
  mainSectionSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  // Mission & Vision Cards
  missionCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  visionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  sectionDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    fontFamily: "Poppins-Regular",
  },
  // Values Grid
  valuesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  valueCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  valueTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#D97706",
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  // Team Grid
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  teamCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  memberAvatarEmoji: {
    fontSize: 24,
  },
  memberName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: "#D97706",
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
    marginBottom: 8,
  },
  memberRegion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  memberRegionText: {
    fontSize: 12,
    color: "#16A34A",
    marginLeft: 4,
    fontFamily: "Poppins-Regular",
  },
  // Contact Grid
  contactGrid: {
    gap: 16,
  },
  contactCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  contactCardInner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#FFFBEB",
  },
  contactTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: "#D97706",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  // App Info Grid
  appInfoGrid: {
    gap: 16,
  },
  appInfoCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  appInfoCardInner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  appInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  appInfoHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  appInfoTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  appInfoSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  versionText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#D97706",
  },
  privacyLink: {
    fontSize: 16,
    color: "#16A34A",
    fontFamily: "Poppins-SemiBold",
  },
  updateDate: {
    fontSize: 14,
    color: "#3B82F6",
    fontFamily: "Poppins-Regular",
  },
  // Features
  featuresContainer: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#D97706",
    marginBottom: 12,
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
  },
  // CTA Section
  ctaSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  ctaCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  ctaButtons: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#16A34A",
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#ffffff",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#16A34A",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#16A34A",
  },
});
