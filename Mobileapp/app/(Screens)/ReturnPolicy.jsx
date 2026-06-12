/* eslint-disable no-unused-vars */
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../Context/ThemeProvider"; //
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ReturnPolicy = () => {
  // Responsive styles
  const titleFontSize = width < 350 ? 24 : 28;
  const subtitleFontSize = width < 350 ? 18 : 20;
  const bodyFontSize = width < 350 ? 14 : 16;
  const sectionMarginBottom = width < 350 ? 20 : 24;
  const paddingHorizontal = width < 350 ? 16 : 20;
  const sectionSpacing = width < 350 ? 20 : 24;
  const sidePadding = width < 350 ? 16 : 20;
  const { theme, themeStyles } = useTheme();

  const isDark = theme === "dark";

  const handleStartReturn = async () => {
    const whatsappUrl =
      "whatsapp://send?phone=254713637104&text=Hello%21%20I%27d%20like%20to%20start%20a%20return%20for%20my%20order.%20Order%20details%3A";
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(
        "https://wa.me/254713637104?text=Hello%21%20I%27d%20like%20to%20start%20a%20return%20for%20my%20order.%20Order%20details%3A",
      );
    }
  };

  const handleContactSupport = () => {
    router.push("/(Screens)/HelpCenter");
  };

  const benefits = [
    { title: "30-Day Window", description: "Ample time to decide", icon: "🕐" },
    { title: "Free Returns", description: "Across Africa", icon: "🚚" },
    { title: "Customer Support", description: "24/7 assistance", icon: "🎧" },
    { title: "Hassle-Free", description: "Simple process", icon: "✅" },
  ];

  const policySections = [
    {
      title: "Eligibility for Returns",
      icon: "🛡️",
      color: ["#d97706", "#b45309"],
      items: [
        "Items must be returned within 30 days of the delivery date.",
        "Items must be unused, undamaged, and in their original packaging.",
        "Proof of purchase is required for all returns.",
        "Custom or personalized items may not be returned unless defective.",
        'Items marked as "final sale" are not eligible for return.',
      ],
      note: "Your satisfaction is our priority",
    },
    {
      title: "How to Initiate a Return",
      icon: "🔄",
      color: ["#059669", "#047857"],
      steps: [
        "Contact our customer service team with your order number.",
        "We will provide you with a prepaid return shipping label.",
        "Pack the item securely with all original accessories.",
        "Ship the item back using our designated courier service.",
        "Track your return through our mobile app or website.",
      ],
    },
    {
      title: "Refunds",
      icon: "💰",
      color: ["#2563eb", "#1d4ed8"],
      items: [
        "Refunds processed within 24 hours of receiving the returned item.",
        "Refunds issued to the original payment method within 3-5 business days.",
        "Shipping charges are non-refundable unless the return is due to our error.",
        "Digital gift cards are non-refundable.",
        "Partial refunds may be issued for items not returned in original condition.",
      ],
    },
    {
      title: "Exchanges",
      icon: "📦",
      color: ["#7c3aed", "#6d28d9"],
      items: [
        "Exchanges processed within 48 hours of receiving the returned item.",
        "Free return shipping for exchange requests within Africa.",
        "Price differences will be charged or refunded accordingly.",
        "Exchanges subject to product availability in your region.",
        "Priority shipping for exchange orders.",
      ],
    },
  ];

  const faqs = [
    {
      q: "How long does it take to process a refund?",
      a: "Refunds are typically processed within 24 hours of receiving the returned item, and appear in your account within 3-5 business days.",
    },
    {
      q: "Do you offer free return shipping?",
      a: "Yes, we offer free return shipping across Africa for all eligible returns.",
    },
    {
      q: "Can I exchange for a different size or color?",
      a: "Absolutely! We facilitate size and color exchanges at no additional cost within Africa.",
    },
    {
      q: "What if my item arrives damaged?",
      a: "Contact us immediately within 48 hours of delivery. We'll arrange a replacement or refund at no cost to you.",
    },
  ];

  const trustBadges = [
    { value: "30 Days", label: "Return Window", color: "#d97706" },
    { value: "Free", label: "African Returns", color: "#059669" },
    { value: "24 Hours", label: "Refund Processing", color: "#2563eb" },
    { value: "100%", label: "Satisfaction Guarantee", color: "#dc2626" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Return Policy</Text>
            <Text style={styles.headerSubtitle}>
              African Standards for Your Peace of Mind
            </Text>
          </View>
        </View>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.premiumBadge}>
            <Text style={styles.badgeText}>🛡️ Our Assurance ✨</Text>
          </View>

          <Text style={[styles.heroTitle, { fontSize: titleFontSize + 4 }]}>
            <Text style={styles.gradientText}>Return Policy</Text>
          </Text>
          <Text style={[styles.heroSubtitle, { fontSize: titleFontSize - 4 }]}>
            African Standards
          </Text>

          <Text style={[styles.heroDescription, { fontSize: bodyFontSize }]}>
            We stand behind every authentic African product we sell. Our return
            policy ensures your complete satisfaction and peace of mind.
          </Text>

          {/* Benefits Grid */}
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Policy Sections */}
        <View style={styles.sectionsContainer}>
          {policySections.map((section, index) => (
            <View key={index} style={styles.policySection}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.iconText}>{section.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { fontSize: subtitleFontSize },
                    ]}
                  >
                    {section.title}
                  </Text>
                </View>
              </View>

              {/* Section Content */}
              <View style={styles.sectionContent}>
                {section.steps ? (
                  <View style={styles.stepsList}>
                    {section.steps.map((step, stepIndex) => (
                      <View key={stepIndex} style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>
                            {stepIndex + 1}
                          </Text>
                        </View>
                        <Text
                          style={[styles.stepText, { fontSize: bodyFontSize }]}
                        >
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.itemsList}>
                    {section.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.listItem}>
                        <View style={styles.bulletPoint}>
                          <Text style={styles.bulletText}>🌿</Text>
                        </View>
                        <Text
                          style={[styles.itemText, { fontSize: bodyFontSize }]}
                        >
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {section.note && (
                  <View style={styles.noteContainer}>
                    <Text
                      style={[styles.noteText, { fontSize: bodyFontSize - 1 }]}
                    >
                      {section.note}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Premium Quality Guarantee */}
        <View style={styles.guaranteeSection}>
          <View style={styles.guaranteeContent}>
            <View style={styles.guaranteeHeader}>
              <View style={styles.guaranteeIcon}>
                <Text style={styles.guaranteeIconText}>🏆</Text>
              </View>
              <View style={styles.guaranteeInfo}>
                <Text
                  style={[
                    styles.guaranteeTitle,
                    { fontSize: subtitleFontSize },
                  ]}
                >
                  African Quality Guarantee
                </Text>
                <Text
                  style={[
                    styles.guaranteeSubtitle,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  Every product meets our stringent quality standards
                </Text>
              </View>
            </View>
            <View style={styles.guaranteeStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>98%</Text>
                <Text style={styles.statLabel}>Satisfaction Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24H</Text>
                <Text style={styles.statLabel}>Response Time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqTitle, { fontSize: titleFontSize }]}>
            Frequently Asked Questions
          </Text>
          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <View style={styles.questionContainer}>
                  <View style={styles.questionIcon}>
                    <Text style={styles.questionIconText}>Q</Text>
                  </View>
                  <Text
                    style={[styles.questionText, { fontSize: bodyFontSize }]}
                  >
                    {faq.q}
                  </Text>
                </View>
                <Text
                  style={[styles.answerText, { fontSize: bodyFontSize - 1 }]}
                >
                  {faq.a}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, { fontSize: subtitleFontSize }]}>
            Need Help With a Return?
          </Text>
          <Text style={[styles.ctaDescription, { fontSize: bodyFontSize }]}>
            Our customer support team is here to assist you 24/7 with any return
            or exchange inquiries.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartReturn}
            >
              <Text
                style={[styles.primaryButtonText, { fontSize: bodyFontSize }]}
              >
                Start a Return →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContactSupport}
            >
              <Text
                style={[styles.secondaryButtonText, { fontSize: bodyFontSize }]}
              >
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReturnPolicy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
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
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  benefitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  benefitIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  benefitTitle: {
    color: "#15803D",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 4,
    fontSize: 14,
  },
  benefitDescription: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 20,
  },
  policySection: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    padding: 20,
    backgroundColor: "#F0FDF4",
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  sectionTitle: {
    color: "#14532D",
    fontFamily: "Poppins-SemiBold",
    flex: 1,
  },
  sectionContent: {
    padding: 20,
  },
  stepsList: {
    marginTop: 10,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: "#15803D",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  stepText: {
    color: "#374151",
    flex: 1,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  itemsList: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  bulletPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
    backgroundColor: "#DCFCE7",
  },
  bulletText: {
    fontSize: 12,
  },
  itemText: {
    color: "#374151",
    flex: 1,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  noteContainer: {
    marginTop: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  noteText: {
    color: "#D97706",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  guaranteeSection: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  guaranteeContent: {
    flexDirection: "column",
  },
  guaranteeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  guaranteeIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  guaranteeIconText: {
    fontSize: 28,
  },
  guaranteeInfo: {
    flex: 1,
  },
  guaranteeTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  guaranteeSubtitle: {
    color: "#D97706",
    fontFamily: "Poppins-Regular",
  },
  guaranteeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#D97706",
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  faqTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 24,
  },
  faqList: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  questionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  questionIconText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  questionText: {
    color: "#111827",
    fontFamily: "Poppins-SemiBold",
    flex: 1,
  },
  answerText: {
    color: "#6B7280",
    lineHeight: 20,
    paddingLeft: 36,
    fontFamily: "Poppins-Regular",
  },
  ctaSection: {
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  ctaTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaDescription: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  ctaButtons: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#BBF7D0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#16A34A",
    fontFamily: "Poppins-SemiBold",
  },
  trustBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  trustBadge: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  trustBadgeValue: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  trustBadgeLabel: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
});
