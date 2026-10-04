import axiosClient from "@/api";
import { useGlobalContext, exchangeOAuthCode } from "@/Context/GlobalProvider";
import { images } from "@/constants";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OAuthVerificationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { setUser, setIsLogged } = useGlobalContext();
  const pendingId = Array.isArray(params.pendingId)
    ? params.pendingId[0]
    : params.pendingId;
  const emailRequiredParam = Array.isArray(params.emailRequired)
    ? params.emailRequired[0]
    : params.emailRequired;
  const emailRequired = emailRequiredParam === "true";
  const maskedEmailParam = Array.isArray(params.maskedEmail)
    ? params.maskedEmail[0]
    : params.maskedEmail;
  const [maskedEmail, setMaskedEmail] = useState(maskedEmailParam || "");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    if (resendAfter <= 0) return undefined;
    const timer = setTimeout(
      () => setResendAfter((current) => current - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendAfter]);

  const sendCode = async () => {
    setError("");
    if (emailRequired && !email.trim()) {
      setError("Enter your email address to receive a verification code.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosClient.post(
        "/api/v1/customerauth/oauth/verification/start",
        {
          pendingId,
          ...(emailRequired ? { email: email.trim() } : {}),
        },
      );
      setEmail(email.trim());
      setMaskedEmail(response.data?.maskedEmail || "");
      setCodeSent(true);
      setVerificationCode("");
      setResendAfter(Number(response.data?.resendAfterSeconds || 60));
    } catch (sendError) {
      const wait = Number(sendError.response?.data?.resendAfterSeconds || 0);
      if (wait > 0) {
        setCodeSent(true);
        setResendAfter(wait);
      }
      setError(
        sendError.response?.data?.error ||
          "We could not send the verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the six digit code sent to your email.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosClient.post(
        "/api/v1/customerauth/oauth/verification/complete",
        {
          pendingId,
          ...(emailRequired ? { email: email.trim() } : {}),
          verificationCode,
        },
      );
      const user = await exchangeOAuthCode(response.data?.code);
      setUser(user);
      setIsLogged(true);
      router.replace("/(auth)/pickup-address");
    } catch (verifyError) {
      setError(
        verifyError.response?.data?.error ||
          verifyError.message ||
          "Email verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing["2xl"],
            paddingVertical: spacing["3xl"],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", maxWidth: 480 }}>
            <View style={{ alignItems: "center", marginBottom: spacing["2xl"] }}>
              <Image
                source={images.brandLogo}
                contentFit="contain"
                accessible
                accessibilityLabel="Nile Flow"
                style={{ width: 132, height: 88, marginBottom: spacing.md }}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: colors.green[50],
                }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={colors.green[700]}
                  accessible={false}
                />
                <Text
                  style={{
                    color: colors.green[800],
                    fontFamily: typography.fontFamily.semiBold,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  Secure account setup
                </Text>
              </View>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.neutral.heading,
                  fontFamily: typography.fontFamily.bold,
                  fontSize: typography.fontSize["2xl"],
                  lineHeight: 32,
                  textAlign: "center",
                  marginTop: spacing.lg,
                }}
              >
                Verify your email
              </Text>
              <Text
              style={{
                  color: colors.neutral.body,
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.fontSize.base,
                  lineHeight: 24,
                  textAlign: "center",
                  marginTop: spacing.sm,
                  maxWidth: 360,
                }}
              >
                {codeSent
                  ? "Enter the six digit code we sent to confirm this email belongs to you."
                  : "Confirm your email address so we can safely connect your account."}
              </Text>
            </View>

            <View
              style={{
                padding: spacing.xl,
                borderRadius: radius.xl,
                borderCurve: "continuous",
                backgroundColor: colors.neutral.surface,
                borderWidth: 1,
                borderColor: colors.neutral.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  padding: spacing.md,
                  marginBottom: spacing.xl,
                  borderRadius: radius.lg,
                  backgroundColor: colors.green[50],
                }}
              >
                <View
                  accessible={false}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.md,
                    backgroundColor: colors.green[100],
                  }}
                >
                  <Ionicons
                    name={codeSent ? "mail-open-outline" : "mail-outline"}
                    size={21}
                    color={colors.green[700]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.green[900],
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {codeSent ? "Check your inbox" : "Email confirmation"}
                  </Text>
                  <Text
                    style={{
                      color: colors.neutral.body,
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.sm,
                      marginTop: spacing.xs,
                    }}
                  >
                    {codeSent
                      ? "Your code is valid for 15 minutes."
                      : "We will send a one time code to your email."}
                  </Text>
                </View>
              </View>

              {emailRequired ? (
                <>
                  <Text
                    style={{
                      color: colors.neutral.heading,
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: typography.fontSize.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    Email address
                  </Text>
                  <TextInput
                    accessibilityLabel="Email address"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    editable={!loading && (!codeSent || resendAfter === 0)}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.neutral.muted}
                    style={{
                      minHeight: 52,
                      marginBottom: spacing.lg,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      borderWidth: focusedField === "email" ? 2 : 1,
                      borderColor:
                        focusedField === "email"
                          ? colors.green[600]
                          : colors.neutral.border,
                      backgroundColor: colors.neutral.white,
                      color: colors.neutral.heading,
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.base,
                    }}
                  />
                </>
              ) : (
                <Text
                  accessibilityLabel="Verification email address"
                  style={{
                    color: colors.neutral.body,
                    fontFamily: typography.fontFamily.medium,
                    fontSize: typography.fontSize.sm,
                    marginBottom: spacing.lg,
                  }}
                >
                  We will send the code to {maskedEmail || "your provider email"}.
                </Text>
              )}

            {codeSent ? (
              <>
                <Text
                  style={{
                    color: colors.neutral.heading,
                    fontFamily: typography.fontFamily.semiBold,
                    fontSize: typography.fontSize.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  Six digit verification code
                </Text>
                <TextInput
                  accessibilityLabel="Six digit verification code"
                  accessibilityHint="Enter the code from your email."
                  value={verificationCode}
                  onChangeText={(value) =>
                    setVerificationCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  onFocus={() => setFocusedField("code")}
                  onBlur={() => setFocusedField("")}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={colors.neutral.muted}
                  style={{
                    minHeight: 52,
                    marginBottom: spacing.lg,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.md,
                    borderCurve: "continuous",
                    borderWidth: focusedField === "code" ? 2 : 1,
                    borderColor:
                      focusedField === "code"
                        ? colors.green[600]
                        : colors.neutral.border,
                    backgroundColor: colors.neutral.white,
                    color: colors.neutral.heading,
                    fontFamily: typography.fontFamily.semiBold,
                    fontSize: typography.fontSize.xl,
                    letterSpacing: 4,
                    textAlign: "center",
                  }}
                />
              </>
            ) : null}

            {error ? (
              <View
                accessibilityRole="alert"
                style={{
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.red[200],
                  backgroundColor: colors.red[50],
                }}
              >
                <Text
                  selectable
                  style={{
                    color: colors.red[700],
                    fontFamily: typography.fontFamily.medium,
                    fontSize: typography.fontSize.sm,
                    lineHeight: 21,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              disabled={loading}
              onPress={codeSent ? verify : sendCode}
              style={{
                minHeight: 54,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                backgroundColor: loading ? colors.neutral.muted : colors.green[600],
              }}
            >
              {loading ? (
                <ActivityIndicator
                  accessibilityLabel="Verifying email"
                  color={colors.neutral.white}
                />
              ) : (
                <Text
                  style={{
                    color: colors.neutral.white,
                    fontFamily: typography.fontFamily.semiBold,
                    fontSize: typography.fontSize.base,
                  }}
                >
                  {codeSent ? "Verify and continue" : "Send verification code"}
                </Text>
              )}
            </TouchableOpacity>

            {codeSent ? (
              <View
                style={{
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.lg,
                }}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: loading || resendAfter > 0,
                  }}
                  disabled={loading || resendAfter > 0}
                  onPress={sendCode}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text
                    style={{
                      color:
                        loading || resendAfter > 0
                          ? colors.neutral.muted
                          : colors.green[700],
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {resendAfter > 0 ? `Resend code in ${resendAfter}s` : "Resend code"}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.neutral.body,
                    fontFamily: typography.fontFamily.regular,
                    fontSize: typography.fontSize.xs,
                    textAlign: "center",
                  }}
                >
                  Keep this screen open while you check your email.
                </Text>
              </View>
            ) : null}

            <Link
              href="/(auth)/sign-in"
              replace
              style={{
                color: colors.neutral.body,
                fontFamily: typography.fontFamily.medium,
                textAlign: "center",
                marginTop: spacing.xl,
                fontSize: typography.fontSize.sm,
              }}
            >
              Return to sign in
            </Link>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
