// DEPRECATED: Direct Appwrite SDK usage removed.
// Password reset now goes through the Express API.
// See Mobileapp/api.js for the axiosClient instance.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post(
        "/api/nileflowafrica/passwordchange/forgot-password",
        {
          email,
        },
      );
      Alert.alert(
        "Password Reset",
        "If an account exists with this email, you will receive password reset instructions.",
      );
      setEmail("");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          "Failed to send reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-amber-400 text-center">
              Reset Password
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Enter your email to receive reset instructions
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-300 mb-2">Email</Text>
            <TextInput
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
              placeholder="your@email.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            className="bg-amber-500 py-3 rounded-xl"
            onPress={handlePasswordReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-bold text-center text-lg">
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
