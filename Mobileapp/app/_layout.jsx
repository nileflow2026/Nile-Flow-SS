/* eslint-disable react-hooks/exhaustive-deps */
import * as Sentry from "@sentry/react-native";
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import GlobalProvider, { getCurrentUser } from "@/Context/GlobalProvider";
import { NotificationProvider } from "@/Context/NotificationContext";
import { PremiumProvider } from "@/Context/PremiumContext";
import { ThemeProvider } from "@/Context/ThemeProvider";
import { GroupBuyProvider } from "../Context/GroupBuyContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack, useRouter, usePathname, useNavigation } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { BackHandler, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
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
  const [user, setUser] = useState(null);
  const hasIdentified = useRef(false);

  // Get user from GlobalProvider context to avoid a 2nd API call
  // GlobalProvider already calls getCurrentUser() at mount
  useEffect(() => {
    // Use a lazy import or pass through context
    // For now, just set the user from a single call
    // The GlobalProvider already fetched the user — we read from the cache
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

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
  useEffect(() => {
    if (pathname) {
      posthog.screen(pathname, {});
      posthog.flush();
    }
  }, [pathname]);

  useEffect(() => {
    posthog.debug(true);
    posthog.capture("app_opened");
    posthog.flush();
  }, [posthog]);

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
  console.log("POSTHOG KEY:", posthogApiKey);
  console.log("POSTHOG HOST:", posthogHost);

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
