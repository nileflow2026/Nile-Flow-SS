/* eslint-disable react/no-unescaped-entities */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "../../app/components/FormField";
import VerificationInput from "../../app/components/VerificationInput";
import CusttomButton from "../components/CusttomButton";
import axiosClient from "../../api";

const { width } = Dimensions.get("window");

const ForgotPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState("email"); // 'email' | 'code' | 'password'
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Email
  const [email, setEmail] = useState("");

  // Step 2: Verification code
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Step 3: New password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const logoWidth = width > 400 ? 160 : 120;
  const logoHeight = width > 400 ? 48 : 38;

  // Timer for resend
  useEffect(() => {
    if (step === "code" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const showAlert = (message, type = "error") => {
    Alert.alert(type === "success" ? "Success" : "Error", message);
  };

  // ===== STEP 1: Send code to email =====
  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await axiosClient.post(
        "/api/nileflowafrica/passwordchange/forgot-password/send-code",
        { email },
      );
      showAlert(
        "If an account with that email exists, a reset code has been sent.",
        "success",
      );
      setStep("code");
      setTimeLeft(60);
      setCanResend(false);
    } catch (err) {
      const errorData = err.response?.data;
      // Check if user does not exist
      if (
        errorData?.error === "user_not_found" ||
        err.response?.status === 404
      ) {
        setError(
          "No account found with this email. Please create a new account.",
        );
      } else {
        setError(
          errorData?.message ||
            "Failed to send reset code. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===== STEP 2: Verify code =====
  const handleVerifyCode = async () => {
    const fullCode = verificationCode.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Just verify the code is correct by checking with backend
      // We validate on the reset step too, so here we just move forward
      setStep("password");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Verification failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setSubmitting(true);
    try {
      await axiosClient.post(
        "/api/nileflowafrica/passwordchange/forgot-password/send-code",
        { email },
      );
      showAlert("A new reset code has been sent to your email.", "success");
      setTimeLeft(60);
      setCanResend(false);
      setVerificationCode(["", "", "", "", "", ""]);
    } catch (err) {
      showAlert("Failed to resend code. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== STEP 3: Reset password =====
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const fullCode = verificationCode.join("");

    setSubmitting(true);
    setError("");

    try {
      await axiosClient.post(
        "/api/nileflowafrica/passwordchange/forgot-password/reset",
        {
          email,
          code: fullCode,
          newPassword,
        },
      );
      showAlert(
        "Password reset successfully! You can now sign in with your new password.",
        "success",
      );
      router.replace("/(auth)/sign-in");
    } catch (err) {
      setError(
        err.response?.data?.code === "password_recently_used"
          ? "Choose a different password. This password is too similar to one you used recently. Enter a new password you have not used before."
          : err.response?.data?.message ||
              "Failed to reset password. The code may have expired. Please start over.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "code") {
      setStep("email");
      setError("");
    } else if (step === "password") {
      setStep("code");
      setError("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFFFF", flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 px-6 py-8">
            {/* Header with back button */}
            <TouchableOpacity
              onPress={handleBack}
              className="flex-row items-center mb-6"
            >
              <Ionicons name="arrow-back" size={20} color="#16A34A" />
              <Text
                style={{
                  color: "#16A34A",
                  fontWeight: "600",
                  fontSize: 15,
                  marginLeft: 8,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>

            {/* Step Indicator */}
            <View className="flex-row items-center justify-center mb-8">
              {["email", "code", "password"].map((s, idx) => (
                <View key={s} className="flex-row items-center">
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor:
                        step === s
                          ? "#16A34A"
                          : ["email", "code", "password"].indexOf(step) > idx
                            ? "#16A34A"
                            : "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  {idx < 2 && (
                    <View
                      style={{
                        width: 40,
                        height: 2,
                        backgroundColor:
                          ["email", "code", "password"].indexOf(step) > idx
                            ? "#16A34A"
                            : "#E5E7EB",
                        marginHorizontal: 4,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Step 1: Email Input */}
            {step === "email" && (
              <View className="flex-1">
                <View className="items-center mb-6">
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "#F0FDF4",
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="mail" size={32} color="#16A34A" />
                  </View>
                  <Text className="text-gray-900 text-2xl font-bold text-center mb-2">
                    Reset Password
                  </Text>
                  <Text className="text-gray-500 text-center text-base px-4">
                    Enter your email address and we'll send you a 6-digit
                    reset code.
                  </Text>
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      Email Address
                    </Text>
                  </View>
                  <FormField
                    value={email}
                    handleChangeText={setEmail}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    otherStyles="border-gray-200 bg-gray-50"
                  />
                </View>

                {error ? (
                  <View
                    style={{
                      backgroundColor: "#FEF2F2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 24,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="alert-circle" size={20} color="#DC2626" />
                      <Text
                        style={{ color: "#DC2626", marginLeft: 8, flex: 1 }}
                      >
                        {error}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <CusttomButton
                  title={isSubmitting ? "Sending..." : "Send Reset Code"}
                  handlePress={handleSendCode}
                  containerStyles="mb-6"
                  isLoading={isSubmitting}
                />
              </View>
            )}

            {/* Step 2: Verification Code */}
            {step === "code" && (
              <View className="flex-1">
                <View className="items-center mb-6">
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "#F0FDF4",
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="lock-closed" size={32} color="#16A34A" />
                  </View>
                  <Text className="text-gray-900 text-2xl font-bold text-center mb-2">
                    Enter Reset Code
                  </Text>
                  <Text className="text-gray-500 text-center text-base px-4">
                    Enter the 6-digit code sent to{" "}
                    <Text style={{ color: "#16A34A", fontWeight: "600" }}>
                      {email}
                    </Text>
                  </Text>
                </View>

                <VerificationInput
                  code={verificationCode}
                  setCode={setVerificationCode}
                  length={6}
                />

                {error ? (
                  <View
                    style={{
                      backgroundColor: "#FEF2F2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                      borderRadius: 12,
                      padding: 16,
                      marginTop: 24,
                      marginBottom: 8,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="alert-circle" size={20} color="#DC2626" />
                      <Text
                        style={{ color: "#DC2626", marginLeft: 8, flex: 1 }}
                      >
                        {error}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <CusttomButton
                  title={isSubmitting ? "Verifying..." : "Verify Code"}
                  handlePress={handleVerifyCode}
                  containerStyles="mt-8 mb-4"
                  isLoading={isSubmitting}
                />

                {/* Resend */}
                <View className="items-center mb-8">
                  <Text
                    className="text-sm text-center mb-2"
                    style={{ color: "#6B7280" }}
                  >
                    Didn't receive the code?
                  </Text>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResendCode}>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: "#16A34A" }}
                      >
                        Resend Code
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text className="text-sm" style={{ color: "#9CA3AF" }}>
                      Resend in {timeLeft}s
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Step 3: New Password */}
            {step === "password" && (
              <View className="flex-1">
                <View className="items-center mb-6">
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "#F0FDF4",
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="key" size={32} color="#16A34A" />
                  </View>
                  <Text className="text-gray-900 text-2xl font-bold text-center mb-2">
                    Set New Password
                  </Text>
                  <Text className="text-gray-500 text-center text-base px-4">
                    Create a strong password for your account. Use at least 8
                    characters.
                  </Text>
                </View>

                {/* New Password */}
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="lock-closed" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      New Password
                    </Text>
                  </View>
                  <View className="relative">
                    <FormField
                      value={newPassword}
                      handleChangeText={setNewPassword}
                      placeholder="Enter new password"
                      secureTextEntry={!showPassword}
                      otherStyles="border-gray-200 bg-gray-50 pr-12"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2"
                      style={{ transform: [{ translateY: -12 }] }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="lock-closed" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      Confirm Password
                    </Text>
                  </View>
                  <View className="relative">
                    <FormField
                      value={confirmPassword}
                      handleChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
                      otherStyles="border-gray-200 bg-gray-50 pr-12"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2"
                      style={{ transform: [{ translateY: -12 }] }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <View
                    style={{
                      backgroundColor: "#FEF2F2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 24,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="alert-circle" size={20} color="#DC2626" />
                      <Text
                        style={{ color: "#DC2626", marginLeft: 8, flex: 1 }}
                      >
                        {error}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <CusttomButton
                  title={isSubmitting ? "Resetting..." : "Reset Password"}
                  handlePress={handleResetPassword}
                  containerStyles="mb-4"
                  isLoading={isSubmitting}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
