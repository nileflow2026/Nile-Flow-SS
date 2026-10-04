/* eslint-disable react/no-unescaped-entities */
import { images } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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
import {
  getCurrentUser,
  resendEmailVerificationCode,
  signUp,
  useGlobalContext,
  verifyEmailCode,
} from "../../Context/GlobalProvider";
import i18n, { useLanguage } from "../../i18n";
import CusttomButton from "../components/CusttomButton";

const { width } = Dimensions.get("window");

const SignUp = () => {
  useLanguage(); // re-render when locale changes
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialEmail = Array.isArray(params.email)
    ? params.email[0]
    : params.email;
  const startOnVerify = params.step === "verify";
  const initialResendAfter = Number(
    Array.isArray(params.resendAfterSeconds)
      ? params.resendAfterSeconds[0]
      : params.resendAfterSeconds || 0,
  );
  const [isSubmitting, setIsubmitting] = useState(false);
  const [step, setStep] = useState(startOnVerify ? "verify" : "signup");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [timeLeft, setTimeLeft] = useState(
    startOnVerify ? initialResendAfter : 60,
  );
  const [canResend, setCanResend] = useState(
    startOnVerify && initialResendAfter <= 0,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { setUser, setIsLogged, setIsGuest } = useGlobalContext();
  const logoWidth = width > 400 ? 180 : 140;
  const logoHeight = width > 400 ? 55 : 45;

  const [form, setForm] = useState({
    username: "",
    email: initialEmail || "",
    password: "",
    phone: "",
  });

  // Timer for verification code resend
  useEffect(() => {
    if (step === "verify" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const showToast = (message, type = "success") => {
    Alert.alert(
      type === "success" ? "Success" : type === "error" ? "Error" : "Info",
      message,
    );
  };

  const validateForm = () => {
    if (!form.username.trim()) {
      showToast("Please enter your full name", "error");
      return false;
    }
    if (!form.email.trim()) {
      showToast("Please enter your email address", "error");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      showToast("Please enter a valid email address", "error");
      return false;
    }
    if (!form.phone.trim()) {
      showToast("Please enter your phone number", "error");
      return false;
    }
    if (!form.password.trim()) {
      showToast("Please enter a password", "error");
      return false;
    }
    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return false;
    }
    if (!termsAccepted) {
      showToast(
        "Please accept the Terms of Service and Privacy Policy",
        "error",
      );
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsubmitting(true);

    try {
      const result = await signUp(
        form.email,
        form.password,
        form.username,
        form.phone,
      );
      if (result?.verificationRequired) {
        showToast(
          result.message || "Check your email for the verification code.",
          "success",
        );
        setStep("verify");
        const waitSeconds = Number(result.resendAfterSeconds ?? 60);
        setTimeLeft(waitSeconds);
        setCanResend(waitSeconds <= 0);
      } else {
        throw new Error("The account still needs to verify its email.");
      }
    } catch (error) {
      if (error.verificationRequired) {
        setStep("verify");
        const waitSeconds = Number(error.resendAfterSeconds ?? 60);
        setTimeLeft(waitSeconds);
        setCanResend(waitSeconds <= 0);
      }
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setIsubmitting(false);
    }
  };

  const handleVerification = async () => {
    const fullCode = verificationCode.join("");

    if (fullCode.length !== 6) {
      showToast("Please enter the complete 6-digit code", "error");
      return;
    }

    setIsubmitting(true);

    try {
      await verifyEmailCode(form.email, fullCode);
      const verifiedUser = await getCurrentUser(true);
      if (!verifiedUser) {
        throw new Error("Your email was verified, but the session could not be restored. Please sign in.");
      }
      setUser(verifiedUser);
      setIsLogged(true);
      setIsGuest(false);
      showToast("Account verified successfully!", "success");
      router.replace("/(tabs)/BottomTabs");
    } catch (error) {
      showToast(
        error.message || "Verification failed. Please try again.",
        "error",
      );
    } finally {
      setIsubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const result = await resendEmailVerificationCode(form.email);
      showToast("New verification code sent!", "success");
      const waitSeconds = Number(result.resendAfterSeconds ?? 60);
      setTimeLeft(waitSeconds);
      setCanResend(waitSeconds <= 0);
    } catch (error) {
      const waitSeconds = Number(error.resendAfterSeconds || 0);
      if (waitSeconds > 0) {
        setTimeLeft(waitSeconds);
        setCanResend(false);
      }
      showToast(
        error.message || "Failed to resend code. Please try again.",
        "error",
      );
    }
  };

  const handleBackToSignup = () => {
    setStep("signup");
    setVerificationCode(["", "", "", "", "", ""]);
    setTimeLeft(60);
    setCanResend(false);
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFFFF", flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {step === "signup" ? (
              <View className="flex-1 justify-center px-6 py-10">
                {/* Logo */}
                <View className="items-center mb-8">
                  <Image
                    source={images.Nilelogo}
                    resizeMode="contain"
                    style={{ width: logoWidth, height: logoHeight }}
                  />
                </View>
                {/* Title */}
                <Text
                  className="text-3xl font-bold mb-2 text-center"
                  style={{ color: "#14532D" }}
                >
                  Join Nile Flow
                </Text>
                <Text
                  className="text-lg mb-8 text-center"
                  style={{ color: "#16A34A" }}
                >
                  African Marketplace
                </Text>
                {/* Form Fields */}
                <View className="space-y-4">
                  <View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color="#16A34A"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: "#374151", fontWeight: "600" }}>
                        Full Name
                      </Text>
                    </View>
                    <FormField
                      value={form.username}
                      handleChangeText={(e) =>
                        setForm({ ...form, username: e })
                      }
                      placeholder="Enter your full name"
                      otherStyles="mb-0"
                    />
                  </View>

                  <View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="call-outline"
                        size={16}
                        color="#16A34A"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: "#374151", fontWeight: "600" }}>
                        Phone Number
                      </Text>
                    </View>
                    <FormField
                      value={form.phone}
                      handleChangeText={(e) => setForm({ ...form, phone: e })}
                      placeholder="+254 700 000 000"
                      otherStyles="mb-0"
                    />
                  </View>

                  <View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="mail-outline"
                        size={16}
                        color="#16A34A"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: "#374151", fontWeight: "600" }}>
                        Email Address
                      </Text>
                    </View>
                    <FormField
                      value={form.email}
                      handleChangeText={(e) => setForm({ ...form, email: e })}
                      placeholder="Enter your email address"
                      otherStyles="mb-0"
                    />
                  </View>

                  <View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="lock-closed-outline"
                        size={16}
                        color="#16A34A"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: "#374151", fontWeight: "600" }}>
                        Password
                      </Text>
                    </View>
                    <View style={{ position: "relative" }}>
                      <FormField
                        value={form.password}
                        handleChangeText={(e) =>
                          setForm({ ...form, password: e })
                        }
                        placeholder="Create a strong password"
                        otherStyles="mb-0"
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: 20,
                          top: "50%",
                          transform: [{ translateY: -10 }],
                          zIndex: 10,
                        }}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Use at least 8 characters with letters, numbers, and
                      symbols
                    </Text>
                  </View>
                </View>
                {/* Terms & Conditions */}
                <View
                  className="flex-row items-start mt-6"
                  style={{ marginBottom: 24 }}
                >
                  <TouchableOpacity
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    className="w-4 h-4 mr-3 mt-1 rounded border-2 items-center justify-center"
                    style={{
                      borderColor: "#16A34A",
                      backgroundColor: termsAccepted
                        ? "#DCFCE7"
                        : "transparent",
                    }}
                  >
                    {termsAccepted && (
                      <Ionicons name="checkmark" size={12} color="#16A34A" />
                    )}
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      I agree to Nile Flow's{" "}
                      <Text
                        onPress={() => router.push("/(Screens)/TermsOfService")}
                        style={{
                          color: "#16A34A",
                          textDecorationLine: "underline",
                        }}
                      >
                        Terms of Service
                      </Text>{" "}
                      and{" "}
                      <Text
                        onPress={() => router.push("/(Screens)/PrivacyPolicy")}
                        style={{
                          color: "#16A34A",
                          textDecorationLine: "underline",
                        }}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </View>
                </View>
                {/* Button */}
                <View className="mt-8">
                  <CusttomButton
                    title={
                      isSubmitting ? "Creating Account..." : "Create  Account"
                    }
                    handlePress={submit}
                    containerStyles="mb-6"
                    isLoading={isSubmitting}
                  />
                </View>
                {/* Link to Sign In */}
                <View className="flex-row justify-center gap-1">
                  <Text
                    className="text-sm font-pregular"
                    style={{ color: "#374151" }}
                  >
                    {i18n.t("Have an account already?")}
                  </Text>
                  <Link
                    href={"/sign-in"}
                    className="text-sm font-psemibold"
                    style={{ color: "#16A34A" }}
                  >
                    {i18n.t("Sign-In")}
                  </Link>
                </View>
              </View>
            ) : (
              /* Verification Step */
              <View className="flex-1 justify-center px-6 py-10">
                {/* Back Button */}
                <TouchableOpacity
                  onPress={handleBackToSignup}
                  className="flex-row items-center mb-8"
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color="#16A34A"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#16A34A", fontWeight: "600" }}>
                    Back to Signup
                  </Text>
                </TouchableOpacity>

                {/* Verification Header */}
                <View className="items-center mb-8">
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#16A34A",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="mail" size={32} color="white" />
                  </View>
                  <Text
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: "#14532D" }}
                  >
                    Verify Your Email
                  </Text>
                  <Text className="text-center" style={{ color: "#374151" }}>
                    Enter the 6-digit code sent to {form.email}
                  </Text>
                </View>

                {/* Verification Code Input */}
                <View className="mb-8">
                  <VerificationInput
                    code={verificationCode}
                    setCode={setVerificationCode}
                    length={6}
                  />
                </View>

                {/* Verify Button */}
                <CusttomButton
                  title={isSubmitting ? "Verifying..." : "Verify Account"}
                  handlePress={handleVerification}
                  containerStyles="mb-6"
                  isLoading={isSubmitting}
                />

                {/* Resend Code */}
                <View className="text-center">
                  <Text
                    className="text-sm text-center mb-2"
                    style={{ color: "#374151" }}
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
                    <Text className="text-sm" style={{ color: "#6B7280" }}>
                      Resend in {timeLeft}s
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
