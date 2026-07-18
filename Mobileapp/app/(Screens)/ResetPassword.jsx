import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import CusttomButton from "../components/CusttomButton";
import axiosClient from "../../api";

const { width } = Dimensions.get("window");

const ResetPassword = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { email, code } = params; // Optional: pre-filled from deep link

  const [emailInput, setEmailInput] = useState(email || "");
  const [resetCode, setResetCode] = useState(code || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(email ? "password" : "email");

  const showAlert = (message, type = "error") => {
    Alert.alert(type === "success" ? "Success" : "Error", message);
  };

  const handleSendCode = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await axiosClient.post(
        "/api/nileflowafrica/passwordchange/forgot-password/send-code",
        { email: emailInput },
      );
      showAlert(
        "If an account with that email exists, a reset code has been sent.",
        "success",
      );
      setStep("password");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send reset code. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
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

    const targetEmail = emailInput || email;

    setSubmitting(true);
    setError("");

    try {
      await axiosClient.post(
        "/api/nileflowafrica/passwordchange/forgot-password/reset",
        {
          email: targetEmail,
          code: resetCode,
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
        err.response?.data?.message ||
          "Failed to reset password. The code may have expired.",
      );
    } finally {
      setSubmitting(false);
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
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
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
                Reset Password
              </Text>
              <Text className="text-gray-500 text-center text-base px-4">
                {step === "email"
                  ? "Enter your email to receive a reset code."
                  : "Enter the code sent to your email and set a new password."}
              </Text>
            </View>

            {step === "email" ? (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      Email Address
                    </Text>
                  </View>
                  <FormField
                    value={emailInput}
                    handleChangeText={setEmailInput}
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
              </>
            ) : (
              <>
                {/* Reset Code */}
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="lock-closed" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      Reset Code (6 digits)
                    </Text>
                  </View>
                  <FormField
                    value={resetCode}
                    handleChangeText={setResetCode}
                    placeholder="Enter the 6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    otherStyles="border-gray-200 bg-gray-50"
                  />
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
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;
