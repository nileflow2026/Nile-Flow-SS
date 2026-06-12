import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import { fetchUserName, useGlobalContext } from "../../Context/GlobalProvider";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const ReportaProblem = () => {
  const [problemDetails, setProblemDetails] = useState("");
  const [problemType, setProblemType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useGlobalContext();

  const problemTypes = [
    {
      id: "technical",
      label: "Technical Issue",
      icon: "🐛",
      color: ["#d97706", "#ea580c"],
    },
    {
      id: "payment",
      label: "Payment Problem",
      icon: "⚡",
      color: ["#059669", "#047857"],
    },
    {
      id: "delivery",
      label: "Delivery Issue",
      icon: "🕐",
      color: ["#2563eb", "#1d4ed8"],
    },
    {
      id: "product",
      label: "Product Problem",
      icon: "📄",
      color: ["#7c3aed", "#6d28d9"],
    },
    {
      id: "account",
      label: "Account Issue",
      icon: "👤",
      color: ["#dc2626", "#b91c1c"],
    },
    {
      id: "other",
      label: "Other Problem",
      icon: "⚠️",
      color: ["#f59e0b", "#d97706"],
    },
  ];

  const stats = [
    { value: "1H", label: "Response Time", color: "#d97706" },
    { value: "24/7", label: "Support", color: "#dc2626" },
    { value: "100%", label: "Resolution", color: "#059669" },
    { value: "Premium", label: "Handling", color: "#2563eb" },
  ];

  const handleReportProblem = async () => {
    if (!problemDetails.trim()) {
      Alert.alert("Error", "Please enter the problem details.");
      return;
    }

    if (!problemType) {
      Alert.alert("Error", "Please select a problem type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userName = (await fetchUserName()) || "Anonymous";
      const email = user?.email || "unknown";

      await axiosClient.post("/api/customerreports/submit-report", {
        problemDetails,
        problemType,
        priority,
        createdAt: new Date().toISOString(),
        userName,
        email,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you for reporting the problem. Our premium support team will contact you within 1 hour.",
        [
          {
            text: "OK",
            onPress: () => {
              setSubmitted(true);
              setProblemDetails("");
              setProblemType("");
              setPriority("medium");
            },
          },
        ],
      );
    } catch (error) {
      console.error("❌ Failed to submit report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert("Contact Support", "Contact support feature coming soon!");
  };

  const handleReportAnother = () => {
    setSubmitted(false);
    setProblemDetails("");
    setProblemType("");
    setPriority("medium");
  };

  // Responsive styles
  const titleFontSize = width < 350 ? 24 : 28;
  const subtitleFontSize = width < 350 ? 18 : 20;
  const bodyFontSize = width < 350 ? 14 : 16;
  const inputFontSize = width < 350 ? 14 : 16;
  const spacing = width < 350 ? 16 : 20;

  // Success State
  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Success Hero */}
          <View style={[styles.successHero, { backgroundColor: "#F0FDF4" }]}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={80} color="#10b981" />
            </View>
            <Text
              style={[styles.successTitle, { fontSize: titleFontSize + 2 }]}
            >
              Report Submitted Successfully!
            </Text>
            <Text
              style={[styles.successDescription, { fontSize: bodyFontSize }]}
            >
              Thank you for helping us improve Nile Flow. Our premium support
              team has received your report and will contact you within 1 hour.
            </Text>
          </View>

          {/* Success Stats */}
          <View style={styles.successStats}>
            <View style={styles.successStatsGrid}>
              <View style={styles.successStatCard}>
                <MaterialIcons name="schedule" size={32} color="#f59e0b" />
                <Text
                  style={[
                    styles.successStatTitle,
                    { fontSize: subtitleFontSize - 2 },
                  ]}
                >
                  Response Time
                </Text>
                <Text
                  style={[
                    styles.successStatValue,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  Within 1 Hour
                </Text>
              </View>
              <View style={styles.successStatCard}>
                <MaterialIcons name="shield" size={32} color="#10b981" />
                <Text
                  style={[
                    styles.successStatTitle,
                    { fontSize: subtitleFontSize - 2 },
                  ]}
                >
                  Priority Support
                </Text>
                <Text
                  style={[
                    styles.successStatValue,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  Premium Handling
                </Text>
              </View>
              <View style={styles.successStatCard}>
                <MaterialIcons name="headset-mic" size={32} color="#3b82f6" />
                <Text
                  style={[
                    styles.successStatTitle,
                    { fontSize: subtitleFontSize - 2 },
                  ]}
                >
                  Follow-up
                </Text>
                <Text
                  style={[
                    styles.successStatValue,
                    { fontSize: bodyFontSize - 2 },
                  ]}
                >
                  24/7 Available
                </Text>
              </View>
            </View>
          </View>

          {/* Success Actions */}
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.primarySuccessButton}
              onPress={handleReportAnother}
            >
              <View style={styles.primarySuccessButtonGradient}>
                <Text
                  style={[
                    styles.primarySuccessButtonText,
                    { fontSize: bodyFontSize },
                  ]}
                >
                  Report Another Issue
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondarySuccessButton}
              onPress={handleContactSupport}
            >
              <MaterialIcons name="headset-mic" size={20} color="#f59e0b" />
              <Text
                style={[
                  styles.secondarySuccessButtonText,
                  { fontSize: bodyFontSize },
                ]}
              >
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Report a Problem</Text>
          <Text style={styles.headerSubtitle}>Premium Issue Resolution</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: "#F9FAFB" }]}>
          <View style={styles.premiumBadge}>
            <Text style={styles.badgeText}>⚠️ Premium Support 🛡️</Text>
          </View>

          <Text style={[styles.heroTitle, { fontSize: titleFontSize + 4 }]}>
            <Text style={styles.gradientText}>Report a Problem</Text>
          </Text>
          <Text style={[styles.heroSubtitle, { fontSize: titleFontSize - 4 }]}>
            Premium Issue Resolution
          </Text>

          <Text style={[styles.heroDescription, { fontSize: bodyFontSize }]}>
            Encountering an issue? Our dedicated African support team is ready
            to help. Provide details below for swift resolution.
          </Text>

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

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Form Header */}
          <View style={styles.formHeader}>
            <View style={styles.formHeaderIcon}>
              <MaterialIcons name="report-problem" size={32} color="#ffffff" />
            </View>
            <View style={styles.formHeaderInfo}>
              <Text
                style={[styles.formHeaderTitle, { fontSize: subtitleFontSize }]}
              >
                Describe Your Issue
              </Text>
              <Text
                style={[
                  styles.formHeaderDescription,
                  { fontSize: bodyFontSize },
                ]}
              >
                Provide detailed information for faster resolution
              </Text>
            </View>
          </View>

          {/* User Info */}
          {user && (
            <View style={styles.userInfo}>
              <View style={styles.userInfoContent}>
                <View style={styles.userIcon}>
                  <MaterialIcons name="person" size={24} color="#ffffff" />
                </View>
                <View style={styles.userDetails}>
                  <Text
                    style={[
                      styles.userInfoLabel,
                      { fontSize: bodyFontSize - 2 },
                    ]}
                  >
                    Reporting as
                  </Text>
                  <Text
                    style={[
                      styles.userName,
                      { fontSize: subtitleFontSize - 2 },
                    ]}
                  >
                    {user.name || "User"}
                  </Text>
                  <View style={styles.userEmailContainer}>
                    <MaterialIcons name="email" size={12} color="#fbbf24" />
                    <Text
                      style={[styles.userEmail, { fontSize: bodyFontSize - 3 }]}
                    >
                      {user.email || "No email"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Problem Type Selection */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { fontSize: bodyFontSize }]}>
              🐛 Problem Type
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { fontSize: bodyFontSize - 2 },
              ]}
            >
              Select the category that best describes your issue
            </Text>
            <View style={styles.problemTypeGrid}>
              {problemTypes.map((type, index) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setProblemType(type.id)}
                  style={[
                    styles.problemTypeCard,
                    problemType === type.id && styles.problemTypeCardSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.problemTypeIcon,
                      problemType === type.id && {
                        backgroundColor: type.color[0] + "80",
                      },
                    ]}
                  >
                    <Text style={styles.problemTypeIconText}>{type.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.problemTypeLabel,
                      { fontSize: bodyFontSize - 1 },
                      problemType === type.id &&
                        styles.problemTypeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Level */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { fontSize: bodyFontSize }]}>
              ⚡ Priority Level
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { fontSize: bodyFontSize - 2 },
              ]}
            >
              How urgent is this issue?
            </Text>
            <View style={styles.priorityGrid}>
              {["low", "medium", "high"].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setPriority(level)}
                  style={[
                    styles.priorityCard,
                    priority === level && [
                      styles.priorityCardSelected,
                      level === "high" && styles.priorityCardHigh,
                      level === "medium" && styles.priorityCardMedium,
                      level === "low" && styles.priorityCardLow,
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityLabel,
                      { fontSize: bodyFontSize },
                      priority === level && [
                        styles.priorityLabelSelected,
                        level === "high" && styles.priorityLabelHigh,
                        level === "medium" && styles.priorityLabelMedium,
                        level === "low" && styles.priorityLabelLow,
                      ],
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Problem Details */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { fontSize: bodyFontSize }]}>
              📄 Problem Details
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { fontSize: bodyFontSize - 2 },
              ]}
            >
              Please describe the issue in detail for faster resolution
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
                placeholder="Describe the issue you're experiencing. Include any error messages, steps to reproduce, and what you were trying to accomplish..."
                multiline
                value={problemDetails}
                onChangeText={setProblemDetails}
                placeholderTextColor="rgba(251, 191, 36, 0.5)"
                editable={!isSubmitting}
              />
              <View style={styles.inputFooter}>
                <Text
                  style={[
                    styles.characterCount,
                    { fontSize: bodyFontSize - 3 },
                  ]}
                >
                  Character count: {problemDetails.length}/2000
                </Text>
                <View style={styles.dateContainer}>
                  <MaterialIcons name="event" size={12} color="#f59e0b" />
                  <Text
                    style={[styles.dateText, { fontSize: bodyFontSize - 3 }]}
                  >
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleReportProblem}
            disabled={isSubmitting}
          >
            <View
              style={[
                styles.submitButtonGradient,
                isSubmitting
                  ? { backgroundColor: "#6B7280" }
                  : { backgroundColor: "#16A34A" },
              ]}
            >
              {isSubmitting ? (
                <>
                  <MaterialIcons
                    name="hourglass-empty"
                    size={20}
                    color="#ffffff"
                  />
                  <Text
                    style={[
                      styles.submitButtonText,
                      { fontSize: bodyFontSize },
                    ]}
                  >
                    Submitting Report...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#ffffff" />
                  <Text
                    style={[
                      styles.submitButtonText,
                      { fontSize: bodyFontSize },
                    ]}
                  >
                    Submit Report
                  </Text>
                  <Text style={styles.sparkles}>✨</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Contact Support Section */}
        <View style={[styles.contactSection, { backgroundColor: "#F0FDF4" }]}>
          <View style={styles.contactContent}>
            <View style={styles.contactHeader}>
              <View style={styles.contactIcon}>
                <MaterialIcons name="headset-mic" size={32} color="#ffffff" />
              </View>
              <View style={styles.contactInfo}>
                <Text
                  style={[styles.contactTitle, { fontSize: subtitleFontSize }]}
                >
                  Need Immediate Assistance?
                </Text>
                <Text
                  style={[
                    styles.contactDescription,
                    { fontSize: bodyFontSize },
                  ]}
                >
                  Contact our premium African support team directly
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactSupport}
            >
              <View style={styles.contactButtonGradient}>
                <Text
                  style={[styles.contactButtonText, { fontSize: bodyFontSize }]}
                >
                  Contact Support Team
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Stats */}
        <View style={styles.bottomStats}>
          <View style={styles.bottomStatsGrid}>
            <View style={styles.bottomStatCard}>
              <Text style={styles.bottomStatValue}>1H</Text>
              <Text style={styles.bottomStatLabel}>Response Time</Text>
            </View>
            <View style={styles.bottomStatCard}>
              <Text style={styles.bottomStatValue}>100%</Text>
              <Text style={styles.bottomStatLabel}>Resolution Rate</Text>
            </View>
            <View style={styles.bottomStatCard}>
              <Text style={styles.bottomStatValue}>24/7</Text>
              <Text style={styles.bottomStatLabel}>Premium Support</Text>
            </View>
            <View style={styles.bottomStatCard}>
              <Text style={styles.bottomStatValue}>Native</Text>
              <Text style={styles.bottomStatLabel}>African Support Team</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportaProblem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  // Hero Section Styles
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    color: "#374151",
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
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
  // Form Section Styles
  formSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    margin: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  formHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  formHeaderInfo: {
    flex: 1,
  },
  formHeaderTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  formHeaderDescription: {
    color: "#6B7280",
  },
  // User Info Styles
  userInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userInfoLabel: {
    color: "#6B7280",
    marginBottom: 4,
  },
  userName: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  userEmailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userEmail: {
    color: "#6B7280",
    marginLeft: 4,
  },
  // Section Container Styles
  sectionContainer: {
    padding: 20,
  },
  sectionLabel: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
  },
  sectionDescription: {
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  // Problem Type Styles
  problemTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  problemTypeCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  problemTypeCardSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#16A34A",
  },
  problemTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  problemTypeIconText: {
    fontSize: 20,
  },
  problemTypeLabel: {
    color: "#374151",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  problemTypeLabelSelected: {
    color: "#14532D",
  },
  // Priority Styles
  priorityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  priorityCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  priorityCardSelected: {
    backgroundColor: "#F0FDF4",
  },
  priorityCardHigh: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  priorityCardMedium: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  priorityCardLow: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  priorityLabel: {
    color: "#374151",
    fontFamily: "Poppins-SemiBold",
  },
  priorityLabelSelected: {
    fontFamily: "Poppins-Bold",
  },
  priorityLabelHigh: {
    color: "#DC2626",
  },
  priorityLabelMedium: {
    color: "#D97706",
  },
  priorityLabelLow: {
    color: "#16A34A",
  },
  // Input Styles
  inputContainer: {
    position: "relative",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 200,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  characterCount: {
    color: "#9CA3AF",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#9CA3AF",
    marginLeft: 4,
  },
  // Submit Button Styles
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  sparkles: {
    color: "#fef3c7",
    fontSize: 16,
  },
  // Contact Section Styles
  contactSection: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  contactContent: {
    alignItems: "center",
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  contactIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  contactDescription: {
    color: "#16A34A",
  },
  contactButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  contactButtonGradient: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  // Bottom Stats Styles
  bottomStats: {
    paddingHorizontal: 20,
  },
  bottomStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bottomStatCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bottomStatValue: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginBottom: 4,
  },
  bottomStatLabel: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
  // Success State Styles
  successHero: {
    padding: 40,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    color: "#14532D",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  successDescription: {
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  successStats: {
    padding: 20,
  },
  successStatsGrid: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 20,
  },
  successStatCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  successStatTitle: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  successStatValue: {
    color: "#6B7280",
  },
  successActions: {
    paddingHorizontal: 20,
    gap: 16,
  },
  primarySuccessButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  primarySuccessButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    backgroundColor: "#16A34A",
  },
  primarySuccessButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  secondarySuccessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  secondarySuccessButtonText: {
    color: "#D97706",
    fontFamily: "Poppins-Bold",
  },
});
