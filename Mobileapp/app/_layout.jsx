/* eslint-disable react-hooks/exhaustive-deps */
import * as Sentry from "@sentry/react-native";
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import GlobalProvider, {
  useGlobalContext,
} from "@/Context/GlobalProvider";
import { NotificationProvider } from "@/Context/NotificationContext";
import { PremiumProvider } from "@/Context/PremiumContext";
import { ThemeProvider } from "@/Context/ThemeProvider";
import { GroupBuyProvider } from "../Context/GroupBuyContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import {
  Stack,
  useRouter,
  usePathname,
  useNavigation,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { STRIPE_PUBLISH_KEY } from "../config/config";
import { CartProvider } from "../Context/CartContext_NEW";
import { FavoritesProvider } from "../Context/FavoritesContext";
import { initCurrency } from "../api";
import { initializeLanguage } from "../i18n";
import { SocialProvider } from "../Context/SocialContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import "../global.css";

// Initialize Sentry as early as possible — before any navigation or providers
Sentry.init({
  dsn: "https://913978e2e014e234568fdfd4ffc3b3e2@o4510430501666816.ingest.us.sentry.io/4511411561037824",
  environment: __DEV__ ? "development" : "production",
  // Release tied to app version for Release Health tracking
  release: `nile-flow@${Constants.expoConfig?.version ?? "1.0.0"}`,
  dist: String(
    Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode ??
      "1",
  ),
  // Automatically track session start/end (crash-free users & sessions)
  autoSessionTracking: true,
  // Capture 20% of sessions for performance tracing in production
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  // Record replays for 100% of errors, 10% of sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.mobileReplayIntegration()],
  // Do not send PII in development
  sendDefaultPii: !__DEV__,
  enableLogs: true,
});

// Tag Sentry with OTA update metadata (runs once at startup)
(async function tagSentryWithOTA() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Sentry.setTag("ota.update.available", "true");
    }
    const channel = Updates.channel ?? "unknown";
    Sentry.setTag("ota.channel", channel);
    Sentry.setTag("ota.runtimeVersion", Updates.runtimeVersion ?? "unknown");
    Sentry.setTag("ota.updateId", Updates.updateId ?? "unknown");
  } catch {
    // Non-critical — Sentry tags are best-effort
  }
})();

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const router = useRouter();
  const posthog = usePostHog();
  const pathname = usePathname();
  const segments = useSegments();
  const {
    user,
    isLogged,
    loading,
    sessionError,
    retrySessionCheck,
    pickupAddress,
    pickupAddressLoading,
    pickupAddressError,
    retryPickupAddressCheck,
  } = useGlobalContext();
  const firstSegment = segments[0] || "";
  const secondSegment = segments[1] || "";
  const hasIdentified = useRef(false);

  const isWelcomeRoute = pathname === "/" || firstSegment === "index";
  const isAuthRoute = firstSegment === "(auth)";
  const isPickupAddressRoute =
    isAuthRoute && secondSegment === "pickup-address";
  const isPublicScreen =
    isAuthRoute ||
    isWelcomeRoute ||
    (firstSegment === "(Screens)" &&
      ["ForgotPassword", "ResetPassword", "TermsOfService", "PrivacyPolicy"].includes(
        secondSegment,
      ));

  useEffect(() => {
    if (loading || sessionError) return;
    if (!isLogged && !isPublicScreen) {
      router.replace("/(auth)/sign-in");
    } else if (
      isLogged &&
      !pickupAddressLoading &&
      !pickupAddressError &&
      !pickupAddress &&
      !isPickupAddressRoute
    ) {
      router.replace("/(auth)/pickup-address");
    } else if (
      isLogged &&
      pickupAddress &&
      (isWelcomeRoute || isPickupAddressRoute)
    ) {
      router.replace("/(tabs)/BottomTabs");
    }
  }, [
    firstSegment,
    isLogged,
    isPublicScreen,
    isWelcomeRoute,
    loading,
    pathname,
    pickupAddress,
    pickupAddressError,
    pickupAddressLoading,
    router,
    secondSegment,
    sessionError,
    isPickupAddressRoute,
  ]);

  // Identify user in PostHog only once
  useEffect(() => {
    if (!user?.id || hasIdentified.current) return;
    hasIdentified.current = true;

    posthog.identify(user.id, {
      email: user.email,
      username: user.username,
      role: user.role,
      phone: user.phone,
    });
  }, [user?.id]);

  // Track screen views automatically on every navigation
  /*   useEffect(() => {
    if (pathname) {
      posthog.screen(pathname, {});
      posthog.flush();
    }
  }, [pathname]);

  useEffect(() => {
    posthog.debug(true);
    posthog.capture("app_opened");
    posthog.flush();
  }, [posthog]); */

  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
  });

  useEffect(() => {
    // Kick off currency detection immediately so it resolves before any
    // screen (Cart, Explore) tries to fetch data. initCurrency() is a
    // singleton — subsequent calls from screens return the same promise.
    initCurrency();
    initializeLanguage();
    // Hide splash once fonts are ready (or errored out)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // --- Android Hardware Back Button Handler ---
  const navigation = useNavigation();
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      const navState = navigation?.getState?.();
      const stackIndex = navState?.index ?? 0;

      if (stackIndex > 0) {
        router.back();
        return true;
      }

      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        return false;
      }

      lastBackPress.current = now;
      Toast.show({
        type: "info",
        text1: "Press back again to exit",
        visibilityTime: 2000,
        position: "bottom",
      });
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [pathname, router, navigation]);

  // Keep splash visible until fonts resolve
  if (!fontsLoaded && !fontError) return null;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator color="#16A34A" size="large" />
        <Text style={{ color: "#374151", marginTop: 12 }}>
          Checking your account…
        </Text>
      </View>
    );
  }

  if (sessionError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Text
          style={{
            color: "#111827",
            fontSize: 22,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          We could not check your session
        </Text>
        <Text
          style={{
            color: "#6B7280",
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Your account is still saved on this device. Check your connection and
          try again.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => retrySessionCheck().catch(() => {})}
          style={{
            marginTop: 24,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: "#16A34A",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isLogged && pickupAddressLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator color="#16A34A" size="large" />
        <Text style={{ color: "#374151", marginTop: 12 }}>
          Checking your delivery address…
        </Text>
      </View>
    );
  }

  if (isLogged && pickupAddressError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Text
          style={{
            color: "#111827",
            fontSize: 22,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          We could not check your delivery address
        </Text>
        <Text
          style={{
            color: "#6B7280",
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Your sign in is saved. Check your connection and try again.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => retryPickupAddressCheck().catch(() => {})}
          style={{
            marginTop: 24,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: "#16A34A",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!isLogged && !isPublicScreen) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator color="#16A34A" size="large" />
        <Text style={{ color: "#374151", marginTop: 12 }}>
          Opening sign in…
        </Text>
      </View>
    );
  }

  if (
    isLogged &&
    pickupAddress &&
    (isWelcomeRoute || isPickupAddressRoute)
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator color="#16A34A" size="large" />
        <Text style={{ color: "#374151", marginTop: 12 }}>
          Opening your marketplace…
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
      <StatusBar style="dark" />
    </>
  );
}

function RootLayout() {
  const posthogApiKey =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_POSTHOG_API_KEY ||
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const posthogHost =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_POSTHOG_HOST ||
    process.env.EXPO_PUBLIC_POSTHOG_HOST;
  /*   console.log("POSTHOG KEY:", posthogApiKey);
  console.log("POSTHOG HOST:", posthogHost); */

  return (
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{
        host: posthogHost,
        flushAt: 1,
        flushInterval: 0,
        captureDeepLinks: true,
        captureAppLifecycleEvents: false,
        captureExceptions: true,
        debug: __DEV__,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <StripeProvider publishableKey={STRIPE_PUBLISH_KEY}>
                <GlobalProvider>
                  <PremiumProvider>
                    <NotificationProvider>
                      <SocialProvider>
                        <CartProvider>
                          <GroupBuyProvider>
                            <FavoritesProvider>
                              <AppContent />
                            </FavoritesProvider>
                          </GroupBuyProvider>
                        </CartProvider>
                      </SocialProvider>
                    </NotificationProvider>
                  </PremiumProvider>
                </GlobalProvider>
              </StripeProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}

export default Sentry.wrap(RootLayout);
