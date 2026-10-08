/* eslint-disable react-hooks/exhaustive-deps */
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
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { CartProvider } from "../Context/CartContext_NEW";
import { FavoritesProvider } from "../Context/FavoritesContext";
import { initCurrency } from "../api";
import { initializeLanguage } from "../i18n";
import { SocialProvider } from "../Context/SocialContext";
import ErrorBoundary from "./components/ErrorBoundary";
import PushPermissionPrompt from "../components/PushPermissionPrompt";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import "../global.css";

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
    sessionInitialized,
    pickupAddress,
    pickupAddressLoading,
    pickupAddressError,
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
    if (loading) return;
    if (!isLogged && !isPublicScreen) {
      router.replace("/");
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
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Keep session restoration behind the native splash screen.
    if ((fontsLoaded || fontError) && sessionInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, sessionInitialized]);

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

  // Keep startup session restoration out of the app UI.
  if (!fontsLoaded && !fontError) return null;
  if (!sessionInitialized) return null;

  if (loading) return null;

  if (!isLogged && !isPublicScreen) {
    return null;
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
      <PushPermissionPrompt />
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
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}

export default RootLayout;
