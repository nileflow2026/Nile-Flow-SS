import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const BulletItem = ({ text }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const TermsOfService = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.updated}>Last Updated: December 21, 2025</Text>

          <Section title="1. Introduction">
            <Text style={styles.body}>
              Welcome to Nile Flow. By accessing or using our platform, you
              agree to be bound by these Terms of Service. Please read them
              carefully. If you do not agree with any part of these terms, you
              may not use our services.
            </Text>
          </Section>

          <Section title="2. Account Registration">
            <Text style={styles.body}>
              To access certain features of Nile Flow, you must register for an
              account. When you register, you agree to:
            </Text>
            <BulletItem text="Provide accurate, current, and complete information" />
            <BulletItem text="Maintain and update your information to keep it accurate" />
            <BulletItem text="Maintain the security of your password and account" />
            <BulletItem text="Accept responsibility for all activities under your account" />
            <BulletItem text="Notify us immediately of any unauthorized use" />
          </Section>

          <Section title="3. Use of Services">
            <Text style={styles.body}>You agree not to:</Text>
            <BulletItem text="Violate any applicable laws or regulations" />
            <BulletItem text="Infringe upon the rights of others" />
            <BulletItem text="Transmit any harmful code, viruses, or malicious software" />
            <BulletItem text="Attempt to gain unauthorized access to our systems" />
            <BulletItem text="Use the platform for fraudulent purposes" />
            <BulletItem text="Harass, abuse, or harm other users" />
            <BulletItem text="Scrape, copy, or duplicate content without permission" />
          </Section>

          <Section title="4. Product Listings & Purchases">
            <Text style={styles.body}>
              All product descriptions, prices, and availability are subject to
              change without notice. We reserve the right to:
            </Text>
            <BulletItem text="Limit quantities of products available for purchase" />
            <BulletItem text="Refuse or cancel orders at our discretion" />
            <BulletItem text="Verify payment information before processing orders" />
            <BulletItem text="Correct pricing errors or inaccuracies" />
          </Section>

          <Section title="5. Nile Miles Loyalty Program">
            <Text style={styles.body}>
              The Nile Miles loyalty program is subject to:
            </Text>
            <BulletItem text="Miles are earned on qualifying purchases only" />
            <BulletItem text="Miles have no cash value and cannot be transferred" />
            <BulletItem text="We reserve the right to modify or terminate the program" />
            <BulletItem text="Fraudulent activity may result in forfeiture of miles" />
            <BulletItem text="Rewards are subject to availability" />
          </Section>

          <Section title="6. Payment & Pricing">
            <Text style={styles.body}>
              All prices are listed in the currency displayed at checkout.
              Payment must be made in full before order processing. We accept
              various payment methods including credit cards, debit cards, and
              cash on delivery. You agree to provide valid payment information
              and authorize us to charge your selected payment method.
            </Text>
          </Section>

          <Section title="7. Shipping & Delivery">
            <Text style={styles.body}>
              Shipping times are estimates and may vary. We are not responsible
              for delays caused by shipping carriers or customs. Risk of loss
              transfers to you upon delivery. Please inspect your order upon
              receipt and report any issues within 48 hours.
            </Text>
          </Section>

          <Section title="8. Returns & Refunds">
            <Text style={styles.body}>
              Our return policy allows returns within 30 days of delivery for
              most items. Products must be unused and in original packaging.
              Certain items may not be eligible for return. Refunds will be
              processed to the original payment method within 5–10 business
              days.
            </Text>
          </Section>

          <Section title="9. Intellectual Property">
            <Text style={styles.body}>
              All content on Nile Flow, including text, graphics, logos, images,
              and software, is the property of Nile Flow or its content
              suppliers and is protected by international copyright laws. You
              may not reproduce, distribute, or create derivative works without
              our express written permission.
            </Text>
          </Section>

          <Section title="10. Limitation of Liability">
            <Text style={styles.body}>
              Nile Flow shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of our
              services. Our total liability shall not exceed the amount you paid
              for the specific product or service in question.
            </Text>
          </Section>

          <Section title="11. Termination">
            <Text style={styles.body}>
              We reserve the right to suspend or terminate your account at any
              time for violations of these terms, fraudulent activity, or any
              other reason at our sole discretion. Upon termination, your right
              to use the services will immediately cease.
            </Text>
          </Section>

          <Section title="12. Changes to Terms">
            <Text style={styles.body}>
              We may update these Terms of Service from time to time. We will
              notify you of any material changes by posting the new terms on
              this page and updating the "Last Updated" date. Your continued use
              of the platform after changes constitutes acceptance of the new
              terms.
            </Text>
          </Section>

          <Section title="13. Contact Us">
            <Text style={styles.body}>
              If you have any questions about these Terms of Service, please
              contact us:
            </Text>
            <View style={styles.contactBox}>
              <Text style={styles.contactText}>
                Email: legal@nileflowafrica.com
              </Text>
              <Text style={styles.contactText}>Phone: +254 XXX XXX XXX</Text>
              <Text style={styles.contactText}>
                Address: Kilimani, Nairobi, Kenya
              </Text>
            </View>
          </Section>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TermsOfService;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  gradient: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#14532D",
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  updated: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#15803D",
    marginBottom: 10,
  },
  body: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  bulletRow: { flexDirection: "row", marginTop: 6 },
  bullet: { color: "#D97706", marginRight: 8, fontSize: 14 },
  bulletText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
  contactBox: {
    marginTop: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  contactText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
});
