import * as Sentry from "@sentry/react-native";
import GlobalProvider from "@/Context/GlobalProvider";
import { NotificationProvider } from "@/Context/NotificationContext";
import { PremiumProvider } from "@/Context/PremiumContext";
import { ThemeProvider } from "@/Context/ThemeProvider";
import { GroupBuyProvider } from "../Context/GroupBuyContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { STRIPE_PUBLISH_KEY } from "../config/config";
import { CartProvider } from "../Context/CartContext_NEW";
import { FavoritesProvider } from "../Context/FavoritesContext";
import { initCurrency } from "../api";
import { initializeLanguage } from "../i18n";
import { SocialProvider } from "../Context/SocialContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "../global.css";

// Initialize Sentry as early as possible — before any navigation or providers
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
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

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const router = useRouter();

  useEffect(() => {
    // Kick off currency detection immediately so it resolves before any
    // screen (Cart, Explore) tries to fetch data. initCurrency() is a
    // singleton — subsequent calls from screens return the same promise.
    initCurrency();
    initializeLanguage();
    SplashScreen.hideAsync();
  }, []);

  // Handle case where app is opened from a killed state via notification tap
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        router.push("/(Screens)/MyNotificationsScreen");
      }
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
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
                      <StatusBar style="auto" />
                    </CartProvider>
                  </SocialProvider>
                </NotificationProvider>
              </PremiumProvider>
            </GlobalProvider>
          </StripeProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
