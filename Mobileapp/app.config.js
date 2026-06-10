const { config } = require("dotenv");

config({ path: ".env" });

// Pre-build hook to fix netinfo paths on Windows
if (process.env.EAS_BUILD || process.env.EXPO_PUBLIC_EAS_BUILD) {
  require("./scripts/fix-netinfo-paths.js");
}

module.exports = () => ({
  expo: {
    name: "Nile Flow",
    slug: "nile-flow-app",
    version: "1.3.12",
    orientation: "default",
    icon: "./assets/images/icon.png",
    scheme: "nileflowapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    updates: {
      url: "https://u.expo.dev/f832f869-d5a3-472c-a6e6-8b098d9d45c9",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 30000,
    },
    runtimeVersion: {
      policy: "fingerprint",
    },
    extra: {
      API_URL:
        process.env.API_BASE_URL || "https://nile-flow-backend.onrender.com",
      STRIPE_KEY: process.env.STRIPE_KEY || "",
      STRIPE_PUBLISH_KEY: process.env.STRIPE_PUBLISH_KEY || "",
      FLW_PUBLIC_KEY: process.env.FLW_PUBLIC_KEY || "",
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "",
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || "",
      EXPO_PUBLIC_POSTHOG_API_KEY:
        process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "",
      EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST || "",
      eas: {
        projectId:
          "f832f869-d5a3-472c-a6e6-8b098d9d45c9" /* "ca39cda3-b6fc-4a8a-a0ed-9d8a280862a4" */,
      },
    },
    ios: {
      bundleIdentifier: "com.nileflowafrica",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      // Android 15+ edge-to-edge display — uses WindowInsets API instead of deprecated Window methods
      enableOnBackInvokedCallback: true,
      predictiveBackGestureEnabled: true,
      package: "com.nileflowafrica",
      /* proguardRule: "./android/app/proguard-rules.pro", */
      supportsRtl: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    notification: {
      icon: "./assets/images/icon.png",
      color: "#F59E0B",
      androidMode: "default",
      androidCollapsedTitle: "#{unread_notifications} new notifications",
    },
    plugins: [
      "expo-router",
      "expo-localization",
      "expo-image",
      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon-monochrome.png",
          color: "#F59E0B",
          defaultChannel: "default",
          sounds: [],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.nileflow",
          enableStripeSdk: true,
        },
      ],
      "expo-video",
      "expo-web-browser",
      [
        "@sentry/react-native",
        {
          organization: "nile-flow-holidings",
          project: "nileflowapp",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
});
