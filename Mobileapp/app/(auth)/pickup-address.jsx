import { useGlobalContext } from "@/Context/GlobalProvider";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { images } from "@/constants";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const fields = [
  { key: "address", label: "Street address", required: true },
  {
    key: "phone",
    label: "Phone number",
    required: true,
    keyboardType: "phone-pad",
    hint: "Include your country code so your rider can reach you.",
  },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State or province", required: true },
  { key: "postalCode", label: "Postal code", required: false },
];

const initialForm = {
  address: "",
  phone: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function PickupAddressScreen() {
  const router = useRouter();
  const { savePickupAddress } = useGlobalContext();
  const inputRefs = useRef({});
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  const submit = async () => {
    setError("");
    Keyboard.dismiss();

    const nextErrors = {};
    for (const field of fields) {
      if (field.required && !form[field.key].trim()) {
        nextErrors[field.key] = `${field.label} is required.`;
      }
    }
    if (
      form.phone.trim() &&
      !/^\+?[\d\s\-()]{7,20}$/.test(form.phone.trim())
    ) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await savePickupAddress({
        address: form.address.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
      });
      router.replace("/(tabs)/BottomTabs");
    } catch (saveError) {
      setError(
        saveError.response?.data?.error ||
          saveError.message ||
          "We could not save your address. Please try again.",
      );
    } finally {
      setSaving(false);
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
                <View
                  accessible={false}
                  style={{
                    width: spacing.sm,
                    height: spacing.sm,
                    borderRadius: radius.pill,
                    backgroundColor: colors.green[600],
                  }}
                />
                <Text
                  style={{
                    color: colors.green[800],
                    fontFamily: typography.fontFamily.semiBold,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  One last step before shopping
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
                Where should we deliver?
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
                Add your pickup address so local riders can bring your order to
                the right place.
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
                    name="location-outline"
                    size={22}
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
                    Delivery address
                  </Text>
                  <Text
                    style={{
                      color: colors.neutral.body,
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.sm,
                      marginTop: spacing.xs,
                    }}
                  >
                    Required to complete your account setup
                  </Text>
                </View>
              </View>

              {fields.map((field, index) => (
                <View key={field.key} style={{ marginBottom: spacing.lg }}>
                  <Text
                    style={{
                      color: colors.neutral.heading,
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: typography.fontSize.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {field.label}
                    {field.required ? " *" : " (optional)"}
                  </Text>
                  <TextInput
                    ref={(input) => {
                      inputRefs.current[field.key] = input;
                    }}
                    accessibilityLabel={field.label}
                    accessibilityHint={field.hint}
                    accessibilityState={{
                      invalid: Boolean(fieldErrors[field.key]),
                    }}
                    value={form[field.key]}
                    onChangeText={(value) => {
                      setForm((current) => ({ ...current, [field.key]: value }));
                      setFieldErrors((current) => ({
                        ...current,
                        [field.key]: "",
                      }));
                    }}
                    onFocus={() => setFocusedField(field.key)}
                    onBlur={() => setFocusedField("")}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={colors.neutral.muted}
                    keyboardType={field.keyboardType || "default"}
                    autoCapitalize={field.key === "postalCode" ? "characters" : "words"}
                    returnKeyType={
                      index === fields.length - 1 ? "done" : "next"
                    }
                    onSubmitEditing={() => {
                      const nextField = fields[index + 1];
                      if (nextField) inputRefs.current[nextField.key]?.focus();
                      else Keyboard.dismiss();
                    }}
                    style={{
                      minHeight: 52,
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      borderWidth: focusedField === field.key ? 2 : 1,
                      borderColor: fieldErrors[field.key]
                        ? colors.red[700]
                        : focusedField === field.key
                          ? colors.green[600]
                          : colors.neutral.border,
                      backgroundColor: colors.neutral.white,
                      paddingHorizontal: spacing.md,
                      color: colors.neutral.heading,
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.base,
                    }}
                  />
                  {fieldErrors[field.key] ? (
                    <Text
                      accessibilityRole="alert"
                      style={{
                        color: colors.red[700],
                        fontFamily: typography.fontFamily.medium,
                        fontSize: typography.fontSize.xs,
                        marginTop: spacing.xs,
                      }}
                    >
                      {fieldErrors[field.key]}
                    </Text>
                  ) : null}
                  {field.hint ? (
                    <Text
                      style={{
                        color: colors.neutral.body,
                        fontFamily: typography.fontFamily.regular,
                        fontSize: typography.fontSize.xs,
                        marginTop: spacing.xs,
                      }}
                    >
                      {field.hint}
                    </Text>
                  ) : null}
                </View>
              ))}

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
                accessibilityState={{ disabled: saving, busy: saving }}
                disabled={saving}
                onPress={submit}
                style={{
                  minHeight: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.lg,
                  borderCurve: "continuous",
                  backgroundColor: saving ? colors.neutral.muted : colors.green[600],
                }}
              >
                {saving ? (
                    <ActivityIndicator
                      accessibilityLabel="Saving address"
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
                    Save address and continue
                  </Text>
                )}
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.lg,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={colors.green[700]}
                  accessible={false}
                />
                <Text
                  style={{
                    color: colors.neutral.body,
                    fontFamily: typography.fontFamily.regular,
                    fontSize: typography.fontSize.xs,
                    textAlign: "center",
                  }}
                >
                  Your address stays private and can be updated later.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
