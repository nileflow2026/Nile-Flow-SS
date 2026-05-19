import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import { useGlobalContext } from "../../Context/GlobalProvider";

const { width } = Dimensions.get("window");

const PREF_BIOMETRIC = "@security_biometric";
const PREF_LOGIN_ALERTS = "@security_login_alerts";

const Security = () => {
  const router = useRouter();
  const { user, isLogged } = useGlobalContext();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [togglingBiometric, setTogglingBiometric] = useState(false);
  const [togglingAlerts, setTogglingAlerts] = useState(false);

  // Sync a preference to the backend (best-effort, non-blocking)
  const syncPreferenceToBackend = useCallback(
    async (key, value) => {
      if (!isLogged) return;
      try {
        await axiosClient.put("/api/customerauth/preferences", {
          [key]: value,
        });
      } catch {
        // Silently fail — local state already updated
      }
    },
    [isLogged],
  );

  // Load preferences: local AsyncStorage first, then hydrate from backend
  useEffect(() => {
    const loadPreferences = async () => {
      // 1. Check biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(hasHardware && isEnrolled);

      // 2. Load local cache
      const [localBiometric, localAlerts] = await Promise.all([
        AsyncStorage.getItem(PREF_BIOMETRIC),
        AsyncStorage.getItem(PREF_LOGIN_ALERTS),
      ]);
      if (localBiometric !== null)
        setBiometricEnabled(localBiometric === "true");
      if (localAlerts !== null) setLoginAlerts(localAlerts === "true");

      // 3. Hydrate from backend (if logged in)
      if (!isLogged) return;
      try {
        const res = await axiosClient.get("/api/customerauth/preferences");
        const prefs = res.data?.preferences || {};
        if (prefs.biometricEnabled !== undefined) {
          const val =
            prefs.biometricEnabled === true ||
            prefs.biometricEnabled === "true";
          setBiometricEnabled(val);
          await AsyncStorage.setItem(PREF_BIOMETRIC, String(val));
        }
        if (prefs.loginAlerts !== undefined) {
          const val =
            prefs.loginAlerts === true || prefs.loginAlerts === "true";
          setLoginAlerts(val);
          await AsyncStorage.setItem(PREF_LOGIN_ALERTS, String(val));
        }
      } catch {
        // Use local values
      }
    };

    loadPreferences();
  }, [isLogged]);

  const handleBiometricToggle = async (newValue) => {
    if (togglingBiometric) return;

    if (!biometricSupported) {
      Alert.alert(
        "Biometrics Unavailable",
        "Your device does not support biometric authentication or no biometrics are enrolled. Please set up fingerprint or face recognition in your device settings.",
        [{ text: "OK" }],
      );
      return;
    }

    if (newValue) {
      // Require biometric confirmation before enabling
      setTogglingBiometric(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm your identity to enable Biometric Login",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      setTogglingBiometric(false);

      if (!result.success) {
        if (
          result.error !== "user_cancel" &&
          result.error !== "system_cancel"
        ) {
          Alert.alert(
            "Authentication Failed",
            "Biometric verification failed. Please try again.",
          );
        }
        return;
      }
    }

    setBiometricEnabled(newValue);
    await AsyncStorage.setItem(PREF_BIOMETRIC, String(newValue));
    syncPreferenceToBackend("biometricEnabled", newValue);

    if (newValue) {
      Alert.alert(
        "Biometric Login Enabled",
        "You can now use your fingerprint or face ID to sign in.",
        [{ text: "OK" }],
      );
    }
  };

  const handleLoginAlertsToggle = async (newValue) => {
    if (togglingAlerts) return;
    setTogglingAlerts(true);
    setLoginAlerts(newValue);
    await AsyncStorage.setItem(PREF_LOGIN_ALERTS, String(newValue));
    await syncPreferenceToBackend("loginAlerts", newValue);
    setTogglingAlerts(false);
  };

  const handleChangePassword = () => {
    if (!isLogged) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to change your password.",
      );
      return;
    }
    router.push("/ForgotPassword");
  };

  const handleDeleteAccount = () => {
    if (!isLogged) {
      Alert.alert("Sign In Required", "Please sign in to manage your account.");
      return;
    }
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => router.push("/AccountDeletion"),
        },
      ],
    );
  };

  const handleClearSessions = () => {
    Alert.alert(
      "Clear All Sessions",
      "This will sign you out from all devices. You will need to sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Sessions",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("accessToken");
              await AsyncStorage.removeItem("refreshToken");
              Alert.alert("Success", "All sessions have been cleared.");
            } catch {
              Alert.alert(
                "Error",
                "Failed to clear sessions. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const securityItems = [
    {
      title: "Change Password",
      subtitle: "Update your account password",
      icon: "lock",
      iconColors: ["#D97706", "#B45309"],
      onPress: handleChangePassword,
      showArrow: true,
    },
    {
      title: "Active Sessions",
      subtitle: "Manage devices with access to your account",
      icon: "devices",
      iconColors: ["#2563EB", "#1D4ED8"],
      onPress: handleClearSessions,
      showArrow: true,
    },
    {
      title: "Account Deletion",
      subtitle: "Permanently delete your account and data",
      icon: "delete-forever",
      iconColors: ["#DC2626", "#B91C1C"],
      onPress: handleDeleteAccount,
      showArrow: true,
      danger: true,
    },
  ];

  const privacyItems = [
    {
      title: "Privacy Policy",
      subtitle: "How we collect and use your data",
      icon: "privacy-tip",
      iconColors: ["#059669", "#047857"],
      onPress: () => router.push("/PrivacyPolicy"),
      showArrow: true,
    },
    {
      title: "Data & Storage",
      subtitle: "Manage your stored data and cache",
      icon: "storage",
      iconColors: ["#7C3AED", "#6D28D9"],
      onPress: () =>
        Alert.alert(
          "Data & Storage",
          "Your data is securely stored and encrypted. Contact support to request a data export.",
          [{ text: "OK" }],
        ),
      showArrow: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
              <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Security & Privacy</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account security
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Security Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusIconContainer}>
              <MaterialIcons name="verified-user" size={32} color="#10B981" />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Account Secure</Text>
              <Text style={styles.statusSubtitle}>
                {isLogged
                  ? `Signed in as ${user?.email || "your account"}`
                  : "Sign in to manage security settings"}
              </Text>
            </View>
          </View>

          {/* Account Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Security</Text>
            <View style={styles.card}>
              {securityItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  style={[
                    styles.menuItem,
                    index < securityItems.length - 1 && styles.menuItemBorder,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[styles.menuIconContainer, { backgroundColor: item.iconColors[0] }]}
                    >
                      <MaterialIcons name={item.icon} size={20} color="white" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text
                        style={[
                          styles.menuTitle,
                          item.danger && styles.dangerText,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  {item.showArrow && (
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={item.danger ? "#DC2626" : "#16A34A"}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Preferences</Text>
            <View style={styles.card}>
              {/* Biometric Toggle */}
              <View style={[styles.menuItem, styles.menuItemBorder]}>
                <View style={styles.menuItemLeft}>
                  <View
                    style={[styles.menuIconContainer, { backgroundColor: biometricSupported ? "#7C3AED" : "#E5E7EB" }]}
                  >
                    <MaterialIcons
                      name="fingerprint"
                      size={20}
                      color={biometricSupported ? "white" : "#6B7280"}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text
                      style={[
                        styles.menuTitle,
                        !biometricSupported && styles.disabledText,
                      ]}
                    >
                      Biometric Login
                    </Text>
                    <Text style={styles.menuSubtitle}>
                      {biometricSupported
                        ? "Use fingerprint or face ID to sign in"
                        : "Not available on this device"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={!biometricSupported || togglingBiometric}
                  trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                  thumbColor={
                    biometricEnabled && biometricSupported
                      ? "#16A34A"
                      : "#9CA3AF"
                  }
                />
              </View>

              {/*  Login Alerts Toggle*/}
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View
                    style={[styles.menuIconContainer, { backgroundColor: "#2563EB" }]}
                  >
                    <MaterialIcons
                      name="notifications-active"
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>Login Alerts</Text>
                    <Text style={styles.menuSubtitle}>
                      Get notified of new sign-ins to your account
                    </Text>
                  </View>
                </View>
                <Switch
                  value={loginAlerts}
                  onValueChange={handleLoginAlertsToggle}
                  disabled={togglingAlerts}
                  trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                  thumbColor={loginAlerts ? "#16A34A" : "#9CA3AF"}
                />
              </View>
            </View>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.card}>
              {privacyItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  style={[
                    styles.menuItem,
                    index < privacyItems.length - 1 && styles.menuItemBorder,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[styles.menuIconContainer, { backgroundColor: item.iconColors[0] }]}
                    >
                      <MaterialIcons name={item.icon} size={20} color="white" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  {item.showArrow && (
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color="#16A34A"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    gap: 12,
  },
  statusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#374151",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: width < 350 ? 14 : 16,
    fontFamily: "Poppins-SemiBold",
    color: "#14532D",
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: width < 350 ? 14 : 15,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  dangerText: {
    color: "#DC2626",
  },
  disabledText: {
    color: "#9CA3AF",
  },
});

export default Security;
