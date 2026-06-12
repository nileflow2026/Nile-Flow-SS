/* eslint-disable no-unused-vars */
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../Context/ThemeProvider";

const { width } = Dimensions.get("window");

const HelpCenter = () => {
  const { theme, themeStyles } = useTheme();
  const isDark = theme === "dark";
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (index) => {
    setExpandedCategories((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Responsive styles
  const titleFontSize = width < 350 ? 24 : 28;
  const subtitleFontSize = width < 350 ? 18 : 20;
  const bodyFontSize = width < 350 ? 14 : 16;
  const sectionMarginBottom = width < 350 ? 20 : 24;
  const paddingHorizontal = width < 350 ? 16 : 20;

  const faqCategories = [
    {
      title: "Account & Security",
      icon: "🛡️",
      questions: [
        {
          q: "How do I reset my password?",
          a: "Visit the 'Forgot Password' page and enter your email. We'll send you a secure link to reset your password within minutes.",
        },
        {
          q: "How do I enable two-factor authentication?",
          a: "Go to Account Settings → Security → Two-Factor Authentication. We recommend using an authenticator app for enhanced security.",
        },
        {
          q: "How do I update my profile information?",
          a: "Navigate to 'My Account' → 'Profile Settings' where you can update your personal information, shipping addresses, and preferences.",
        },
      ],
      color: ["#d97706", "#ea580c"],
    },
    {
      title: "Orders & Payments",
      icon: "💳",
      questions: [
        {
          q: "How do I track my order?",
          a: "Go to 'My Orders' section in your account or use the tracking link in your confirmation email for real-time updates.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept Visa, Mastercard, M-Pesa, Airtel Money, PayPal, and bank transfers for premium African products.",
        },
        {
          q: "Can I cancel or modify my order?",
          a: "Orders can be modified within 1 hour of placement. Contact our premium support team immediately for assistance.",
        },
      ],
      color: ["#059669", "#047857"],
    },
    {
      title: "Shipping & Delivery",
      icon: "🚚",
      questions: [
        {
          q: "What are your delivery times?",
          a: "Express delivery: 1-3 days within major cities. Standard delivery: 3-7 days across Africa. International: 7-14 days.",
        },
        {
          q: "Do you offer free shipping?",
          a: "Yes! Free express shipping on all orders over $100. Premium members enjoy free shipping on all orders.",
        },
        {
          q: "How do I change my delivery address?",
          a: "Update your address in 'Account Settings' → 'Shipping Addresses' or contact support within 1 hour of ordering.",
        },
      ],
      color: ["#2563eb", "#1d4ed8"],
    },
    {
      title: "Returns & Warranty",
      icon: "📦",
      questions: [
        {
          q: "What is your return policy?",
          a: "30-day return window for all premium products. Items must be in original condition with all packaging intact.",
        },
        {
          q: "How do I initiate a return?",
          a: "Go to 'My Orders' → select the item → 'Request Return'. Our premium support team will guide you through the process.",
        },
        {
          q: "Do you offer product warranties?",
          a: "Yes! All premium African products come with a 1-year warranty and lifetime customer support for quality issues.",
        },
      ],
      color: ["#7c3aed", "#6d28d9"],
    },
  ];

  const contactMethods = [
    {
      title: "24/7 Support",
      description: "Instant assistance via live chat",
      icon: "🎧",
      details: "Available 24/7",
      color: ["#d97706", "#b45309"],
      action: "Start Live Chat",
    },
    {
      title: "Email Support",
      description: "Response within 1 hour",
      icon: "📧",
      details: "support@nileflowafrica.com",
      color: ["#059669", "#047857"],
      action: "Send Email",
    },
    {
      title: "Phone Support",
      description: "Direct premium assistance",
      icon: "📞",
      details: "+254 713 637 104",
      color: ["#2563eb", "#1d4ed8"],
      action: "Call Now",
    },
  ];

  const stats = [
    { value: "24/7", label: "Premium Support", color: "#d97706" },
    { value: "1H", label: "Response Time", color: "#059669" },
    { value: "100%", label: "Satisfaction", color: "#2563eb" },
    { value: "5★", label: "Premium Service", color: "#dc2626" },
  ];

  const additionalResources = [
    {
      title: "Live Community",
      description: "Connect with other premium African product enthusiasts",
      icon: "💬",
      color: ["#d97706", "#b45309"],
      action: "Join Community",
    },
    {
      title: "Premium Tutorials",
      description: "Learn how to maximize your African shopping experience",
      icon: "👤",
      color: ["#059669", "#047857"],
      action: "View Tutorials",
    },
    {
      title: "Order Status",
      description:
        "Real-time tracking for all your premium African product orders",
      icon: "📦",
      color: ["#2563eb", "#1d4ed8"],
      action: "Track Order",
    },
  ];

  const handleResourceAction = async (action) => {
    try {
      if (action === "Join Community") {
        // Open WhatsApp community group
        const whatsappUrl =
          "whatsapp://send?phone=254713637104&text=Hello%21%20I%27d%20like%20to%20join%20the%20Nile%20Flow%20community.";
        const supported = await Linking.canOpenURL(whatsappUrl);
        if (supported) {
          await Linking.openURL(whatsappUrl);
        } else {
          await Linking.openURL(
            "https://wa.me/254713637104?text=Hello%21%20I%27d%20like%20to%20join%20the%20Nile%20Flow%20community.",
          );
        }
      } else if (action === "View Tutorials") {
        await Linking.openURL("https://nileflowafrica.com/tutorials");
      } else if (action === "Track Order") {
        router.push("/(Screens)/Orders");
      }
    } catch {
      Alert.alert("Error", "Could not complete this action. Please try again.");
    }
  };

  const handleSearch = () => {
    Alert.alert("Search", "Search functionality coming soon!");
  };

  const handleContactAction = async (action) => {
    try {
      if (action === "Start Live Chat") {
        // Open WhatsApp chat with support number
        const whatsappUrl =
          "whatsapp://send?phone=254713637104&text=Hello%2C%20I%20need%20support%20with%20my%20Nile%20Flow%20order.";
        const supported = await Linking.canOpenURL(whatsappUrl);
        if (supported) {
          await Linking.openURL(whatsappUrl);
        } else {
          // Fallback to WhatsApp web
          await Linking.openURL(
            "https://wa.me/254713637104?text=Hello%2C%20I%20need%20support%20with%20my%20Nile%20Flow%20order.",
          );
        }
      } else if (action === "Send Email") {
        await Linking.openURL(
          "mailto:support@nileflowafrica.com?subject=Support%20Request&body=Hello%20Nile%20Flow%20Support%2C%0A%0AI%20need%20help%20with%3A",
        );
      } else if (action === "Call Now") {
        await Linking.openURL("tel:+254713637104");
      }
    } catch {
      Alert.alert(
        "Error",
        "Could not open the requested app. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>
            Premium Assistance for African Shoppers
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.premiumBadge}>
            <Text style={styles.badgeText}>❓ Premium Support Center ✨</Text>
          </View>

          <Text style={[styles.heroTitle, { fontSize: titleFontSize + 4 }]}>
            <Text style={styles.gradientText}>Help Center</Text>
          </Text>
          <Text style={[styles.heroSubtitle, { fontSize: titleFontSize - 4 }]}>
            Premium Assistance
          </Text>

          <Text style={[styles.heroDescription, { fontSize: bodyFontSize }]}>
            Get instant help with premium African products, orders, shipping,
            and more. Our dedicated team is here 24/7.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons
                name="help"
                size={20}
                color="#f59e0b"
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { fontSize: bodyFontSize }]}
                placeholder="Search for help articles, guides, and solutions..."
                placeholderTextColor="rgba(251, 191, 36, 0.5)"
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Text
                  style={[
                    styles.searchButtonText,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  Search
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={[styles.statCard, { borderColor: stat.color + "40" }]}
              >
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* FAQ Categories */}
        <View style={styles.faqSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { fontSize: titleFontSize }]}>
                Frequently Asked Questions
              </Text>
              <Text
                style={[styles.sectionSubtitle, { fontSize: bodyFontSize }]}
              >
                Quick answers to common questions
              </Text>
            </View>
            <View style={styles.premiumIndicator}>
              <MaterialIcons name="bolt" size={20} color="#f59e0b" />
              <Text style={styles.premiumText}>Premium Support</Text>
            </View>
          </View>

          <View style={styles.faqGrid}>
            {faqCategories.map((category, index) => (
              <View key={index} style={styles.faqCard}>
                {/* Category Header */}
                <LinearGradient
                  colors={category.color}
                  style={styles.faqCardHeader}
                >
                  <View style={styles.faqCardHeaderContent}>
                    <View style={styles.faqCardIcon}>
                      <Text style={styles.faqCardIconText}>
                        {category.icon}
                      </Text>
                    </View>
                    <View style={styles.faqCardTitleContainer}>
                      <Text
                        style={[
                          styles.faqCardTitle,
                          { fontSize: subtitleFontSize },
                        ]}
                      >
                        {category.title}
                      </Text>
                      <Text
                        style={[
                          styles.faqCardSubtitle,
                          { fontSize: bodyFontSize - 2 },
                        ]}
                      >
                        {category.questions.length} questions
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Questions */}
                <View style={styles.faqCardContent}>
                  {(expandedCategories[index]
                    ? category.questions
                    : category.questions.slice(0, 1)
                  ).map((item, idx, visibleList) => (
                    <View
                      key={idx}
                      style={[
                        styles.faqItem,
                        idx < visibleList.length - 1 && styles.faqItemBorder,
                      ]}
                    >
                      <View style={styles.questionContainer}>
                        <View style={styles.questionIcon}>
                          <Text style={styles.questionIconText}>Q</Text>
                        </View>
                        <Text
                          style={[
                            styles.questionText,
                            { fontSize: bodyFontSize },
                          ]}
                        >
                          {item.q}
                        </Text>
                      </View>
                      <View style={styles.answerContainer}>
                        <View style={styles.answerIcon}>
                          <Text style={styles.answerIconText}>A</Text>
                        </View>
                        <Text
                          style={[
                            styles.answerText,
                            { fontSize: bodyFontSize - 1 },
                          ]}
                        >
                          {item.a}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => toggleCategory(index)}
                  >
                    <Text
                      style={[
                        styles.viewAllButtonText,
                        { fontSize: bodyFontSize },
                      ]}
                    >
                      {expandedCategories[index]
                        ? "Show Less"
                        : `View All ${category.questions.length} Questions`}
                    </Text>
                    <MaterialIcons
                      name={
                        expandedCategories[index]
                          ? "expand-less"
                          : "arrow-forward"
                      }
                      size={16}
                      color="#f59e0b"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
        {/* Contact Methods */}
        <View style={styles.contactSection}>
          <Text style={[styles.contactTitle, { fontSize: titleFontSize }]}>
            Contact Methods
          </Text>
          <Text style={[styles.contactSubtitle, { fontSize: bodyFontSize }]}>
            Choose your preferred way to contact our support team
          </Text>

          <View style={styles.contactGrid}>
            {contactMethods.map((method, index) => (
              <View key={index} style={styles.contactCard}>
                <LinearGradient
                  colors={method.color}
                  style={styles.contactCardIcon}
                >
                  <Text style={styles.contactCardIconText}>{method.icon}</Text>
                </LinearGradient>

                <Text
                  style={[
                    styles.contactCardTitle,
                    { fontSize: subtitleFontSize },
                  ]}
                >
                  {method.title}
                </Text>
                <Text
                  style={[
                    styles.contactCardDescription,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  {method.description}
                </Text>

                <View style={styles.contactCardDetails}>
                  <Text
                    style={[
                      styles.contactCardDetailsText,
                      { fontSize: bodyFontSize - 1 },
                    ]}
                  >
                    {method.details}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.contactCardButton}
                  onPress={() => handleContactAction(method.action)}
                >
                  <LinearGradient
                    colors={method.color}
                    style={styles.contactCardButtonGradient}
                  >
                    <Text
                      style={[
                        styles.contactCardButtonText,
                        { fontSize: bodyFontSize },
                      ]}
                    >
                      {method.action}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Premium Features */}
        <LinearGradient
          colors={["rgba(217, 119, 6, 0.2)", "rgba(5, 150, 105, 0.1)"]}
          style={styles.premiumFeaturesSection}
        >
          <View style={styles.premiumFeaturesContent}>
            <View style={styles.premiumFeaturesHeader}>
              <Text
                style={[
                  styles.premiumFeaturesTitle,
                  { fontSize: subtitleFontSize },
                ]}
              >
                Support Features
              </Text>
              <Text
                style={[
                  styles.premiumFeaturesDescription,
                  { fontSize: bodyFontSize },
                ]}
              >
                Experience exceptional customer service designed specifically
                for African product shoppers.
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <MaterialIcons name="lock" size={20} color="#10b981" />
                <Text
                  style={[styles.featureText, { fontSize: bodyFontSize - 2 }]}
                >
                  Secure Communications
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="schedule" size={20} color="#3b82f6" />
                <Text
                  style={[styles.featureText, { fontSize: bodyFontSize - 2 }]}
                >
                  24/7 Availability
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="language" size={20} color="#f59e0b" />
                <Text
                  style={[styles.featureText, { fontSize: bodyFontSize - 2 }]}
                >
                  African Languages
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="star" size={20} color="#ef4444" />
                <Text
                  style={[styles.featureText, { fontSize: bodyFontSize - 2 }]}
                >
                  Priority Handling
                </Text>
              </View>
            </View>

            <View style={styles.awardContainer}>
              <View style={styles.awardIcon}>
                <Text style={styles.awardIconText}>🏆</Text>
              </View>
              <View style={styles.awardBadge}>
                <Text style={styles.awardBadgeText}>5★</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Additional Resources */}
        <View style={styles.resourcesSection}>
          <View style={styles.resourcesGrid}>
            {additionalResources.map((resource, index) => (
              <View key={index} style={styles.resourceCard}>
                <View style={styles.resourceHeader}>
                  <View
                    style={[
                      styles.resourceIcon,
                      { backgroundColor: resource.color[0] + "20" },
                    ]}
                  >
                    <Text style={styles.resourceIconText}>{resource.icon}</Text>
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text
                      style={[
                        styles.resourceTitle,
                        { fontSize: subtitleFontSize - 2 },
                      ]}
                    >
                      {resource.title}
                    </Text>
                    <Text
                      style={[
                        styles.resourceSubtitle,
                        { fontSize: bodyFontSize - 3 },
                      ]}
                    >
                      {resource.description.split(" ").slice(0, 3).join(" ")}...
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.resourceDescription,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  {resource.description}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.resourceButton,
                    { borderColor: resource.color[0] + "50" },
                  ]}
                  onPress={() => handleResourceAction(resource.action)}
                >
                  <Text
                    style={[
                      styles.resourceButtonText,
                      { color: resource.color[0], fontSize: bodyFontSize - 1 },
                    ]}
                  >
                    {resource.action}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpCenter;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  premiumBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 20,
  },
  badgeText: {
    color: "#D97706",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  heroTitle: {
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  gradientText: {
    color: "#14532D",
  },
  heroSubtitle: {
    color: "#16A34A",
    fontFamily: "Poppins-Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  heroDescription: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
    fontFamily: "Poppins-Regular",
  },
  searchContainer: {
    width: "100%",
    marginBottom: 30,
  },
  searchInputContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  searchIcon: {
    padding: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  searchButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  premiumIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumText: {
    color: "#D97706",
    fontSize: 12,
    marginLeft: 4,
    fontFamily: "Poppins-Regular",
  },
  faqGrid: {
    gap: 20,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  faqCardHeader: {
    padding: 20,
    backgroundColor: "#F0FDF4",
  },
  faqCardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  faqCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  faqCardIconText: {
    fontSize: 20,
  },
  faqCardTitleContainer: {
    flex: 1,
  },
  faqCardTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  faqCardSubtitle: {
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  faqCardContent: {
    padding: 20,
  },
  faqItem: {
    marginBottom: 20,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 20,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  questionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  questionIconText: {
    color: "#D97706",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  questionText: {
    color: "#111827",
    fontFamily: "Poppins-SemiBold",
    flex: 1,
  },
  answerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  answerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  answerIconText: {
    color: "#16A34A",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  answerText: {
    color: "#6B7280",
    flex: 1,
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  viewAllButtonText: {
    color: "#16A34A",
    marginRight: 8,
    fontFamily: "Poppins-SemiBold",
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  contactTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  contactSubtitle: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  contactGrid: {
    gap: 20,
  },
  contactCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  contactCardIconText: {
    fontSize: 28,
  },
  contactCardTitle: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  contactCardDescription: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Poppins-Regular",
  },
  contactCardDetails: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  contactCardDetailsText: {
    color: "#D97706",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  contactCardButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  contactCardButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  contactCardButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  premiumFeaturesSection: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  premiumFeaturesContent: {
    alignItems: "center",
  },
  premiumFeaturesHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  premiumFeaturesTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  premiumFeaturesDescription: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 8,
    color: "#374151",
    fontFamily: "Poppins-Regular",
  },
  awardContainer: {
    position: "relative",
    alignItems: "center",
  },
  awardIcon: {
    width: 128,
    height: 128,
    borderRadius: 24,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
  },
  awardIconText: {
    fontSize: 64,
  },
  awardBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  awardBadgeText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  resourcesSection: {
    paddingHorizontal: 20,
  },
  resourcesGrid: {
    gap: 16,
  },
  resourceCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  resourceIconText: {
    fontSize: 20,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  resourceSubtitle: {
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  resourceDescription: {
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  resourceButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  resourceButtonText: {
    fontFamily: "Poppins-SemiBold",
  },
});
