/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import {
  getCurrentUser,
  signIn,
  useGlobalContext,
} from "@/Context/GlobalProvider";
import { images } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import FormField from "../../app/components/FormField";
import CusttomButton from "../components/CusttomButton";

const { width } = Dimensions.get("window");
const SignIn = () => {
  const router = useRouter();
  const { setUser, setIsLogged } = useGlobalContext();
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const logoWidth = width > 400 ? 180 : 140;
  const logoHeight = width > 400 ? 55 : 45;
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleGoogleSignIn = async () => {
    await handleOAuthSignIn("google");
  };

  const handleFacebookSignIn = async () => {
    await handleOAuthSignIn("facebook");
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      setError("");
      setSubmitting(true);

      // The deep-link URI the OAuth provider should redirect back to.
      // expo-web-browser intercepts this scheme and returns control to the app.
      const REDIRECT = "nileflowapp://oauth/callback";

      // Get the OAuth URL from the backend, passing the mobile redirect_uri
      const res = await axiosClient.get(
        `/api/customerauth/oauth/${provider}?redirect_uri=${encodeURIComponent(REDIRECT)}`,
      );
      const authUrl = res.data?.authUrl;
      if (!authUrl) throw new Error("Failed to get auth URL");

      // Open in-app browser; expo-web-browser watches for the nileflowapp:// redirect
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT);

      if (result.type !== "success") return; // user cancelled

      // Parse the deep link returned by the website's OAuthCallback page
      const parsed = Linking.parse(result.url);
      const token = parsed.queryParams?.token;
      const refreshToken = parsed.queryParams?.refreshToken;

      if (!token) throw new Error("No token received from OAuth provider");

      // Persist the OAuth access token so the axiosClient interceptor can use it
      await AsyncStorage.setItem("oauthAccessToken", token);
      if (refreshToken) {
        await AsyncStorage.setItem("oauthRefreshToken", refreshToken);
      }

      // Fetch user profile (axiosClient interceptor will attach the Bearer token)
      const user = await getCurrentUser();
      if (!user) throw new Error("Failed to fetch user profile");

      setUser(user);
      setIsLogged(true);
      router.replace("/(tabs)/BottomTabs");
    } catch (err) {
      // Clean up stored token on failure
      await AsyncStorage.multiRemove([
        "oauthAccessToken",
        "oauthRefreshToken",
      ]).catch(() => {});
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (form.email === "" || form.password === "") {
      setError("Please fill in all the fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await signIn(form.email, form.password);
      const result = await getCurrentUser();
      setUser(result);
      setIsLogged(true);

      router.replace("/(tabs)/BottomTabs");
    } catch (error) {
      setError(error.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFFFF", flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View className="px-4 pt-8 pb-6">
            <View className="items-center mb-8">
              <View
                style={{
                  backgroundColor: "#F0FDF4",
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                  padding: 12,
                  borderRadius: 16,
                  marginBottom: 16,
                }}
              >
                <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
              </View>
              <Text
                style={{
                  color: "#16A34A",
                  fontWeight: "500",
                  fontSize: 14,
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                Secure Access
              </Text>
              <Image
                source={images.Nilelogo}
                resizeMode="contain"
                style={{
                  width: logoWidth,
                  height: logoHeight,
                  marginBottom: 16,
                }}
              />
              <Text className="text-gray-900 text-3xl font-bold text-center mb-2">
                Welcome Back
              </Text>
              <Text
                style={{
                  color: "#16A34A",
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                African Marketplace
              </Text>
              <Text className="text-gray-500 text-center text-base px-4 max-w-sm mx-auto">
                Access your exclusive collection of authentic African products
              </Text>
            </View>
          </View>

          {/* Main Form Section */}
          <View className="px-4">
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 24,
                overflow: "hidden",
                marginBottom: 32,
              }}
            >
              {/* Form Header */}
              <View className="p-6 border-b border-gray-100">
                <View className="flex-row items-center mb-2">
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: "#16A34A",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="star" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900">
                      Sign In
                    </Text>
                    <Text className="text-gray-500">
                      Access your Nile Flow account
                    </Text>
                  </View>
                </View>
              </View>

              {/* Form Body */}
              <View className="p-6">
                {/* Email Field */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      Email Address
                    </Text>
                  </View>
                  <FormField
                    value={form.email}
                    handleChangeText={(e) => setForm({ ...form, email: e })}
                    placeholder={"Enter your email address"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    otherStyles={"border-gray-200 bg-gray-50"}
                  />
                </View>

                {/* Password Field */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="lock-closed" size={16} color="#16A34A" />
                    <Text className="text-gray-700 font-medium ml-2">
                      Password
                    </Text>
                  </View>
                  <View className="relative">
                    <FormField
                      value={form.password}
                      handleChangeText={(e) =>
                        setForm({ ...form, password: e })
                      }
                      placeholder={"Enter your password"}
                      secureTextEntry={!showPassword}
                      otherStyles={"border-gray-200 bg-gray-50 pr-12"}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-2"
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

                {/* Remember Me & Forgot Password */}
                <View className="mb-6">
                  <TouchableOpacity
                    onPress={() => setRememberMe(!rememberMe)}
                    className="flex-row items-center mb-4"
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                        backgroundColor: rememberMe ? "#16A34A" : "transparent",
                        borderColor: rememberMe ? "#16A34A" : "#D1D5DB",
                      }}
                    >
                      {rememberMe && (
                        <View className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </View>
                    <Text
                      style={{
                        color: "#374151",
                        fontSize: 14,
                        minWidth: 100,
                        flexShrink: 0,
                      }}
                    >
                      Remember me
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/(Screens)/ForgotPassword")}
                    style={{
                      alignSelf: "flex-end",
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{ color: "#16A34A", fontSize: 14, minWidth: 120 }}
                    >
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
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

                {/* Submit Button */}
                <CusttomButton
                  title={isSubmitting ? "Signing In..." : "Sign In"}
                  handlePress={submit}
                  containerStyles={"mb-6"}
                  isLoading={isSubmitting}
                />

                {/* Divider */}
                <View className="mb-6">
                  <View className="flex-row items-center">
                    <View className="flex-1 border-t border-gray-200" />
                    <View className="px-6">
                      <Text
                        style={{
                          color: "#6B7280",
                          fontSize: 14,
                          textAlign: "center",
                          backgroundColor: "#FFFFFF",
                          minWidth: 120,
                          paddingHorizontal: 8,
                        }}
                      >
                        Or continue with
                      </Text>
                    </View>
                    <View className="flex-1 border-t border-gray-200" />
                  </View>
                </View>

                {/* Social Login Buttons */}
                <View className="flex-row gap-3 mb-6">
                  <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Text
                      style={{
                        color: "#374151",
                        fontSize: 14,
                        fontWeight: "500",
                        minWidth: 60,
                        textAlign: "center",
                      }}
                    >
                      Google
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Up Link */}
              <View className="p-6 border-t border-gray-100">
                <View className="flex-row items-center justify-center flex-wrap">
                  <Text className="text-gray-500 mr-2 text-center">
                    Don't have an account?
                  </Text>
                  <Link
                    href={"/sign-up"}
                    style={{ color: "#16A34A", fontWeight: "bold" }}
                  >
                    Create Account
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SignIn;
