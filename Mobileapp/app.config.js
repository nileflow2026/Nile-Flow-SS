const { config } = require("dotenv");

config({ path: ".env" });

module.exports = () => ({
  expo: {
    name: "Nile Flow",
    slug: "nile-flow-app",
    version: "2.5.26",
    orientation: "default",
    icon: "./assets/logo.png",
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
        process.env.API_URL || process.env.API_BASE_URL || "http://10.0.2.2:3000",
      API_BASE_URL:
        process.env.API_BASE_URL || process.env.API_URL || "http://10.0.2.2:3000",
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
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/logo.png",
        backgroundImage: "./assets/logo.png",
        monochromeImage: "./assets/logo.png",
      },
      // Android 15+ edge-to-edge display — uses WindowInsets API instead of deprecated Window methods
      enableOnBackInvokedCallback: true,
      predictiveBackGestureEnabled: true,
      package: "com.nileflowafrica",
      proguardRule: "./android/app/proguard-rules.pro",
      supportsRtl: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    notification: {
      icon: "./assets/logo.png",
      color: "#F59E0B",
      androidMode: "default",
      androidCollapsedTitle: "#{unread_notifications} new notifications",
    },
    plugins: [
      "expo-router",
      "expo-localization",
      "expo-image",
      "expo-sharing",
      "expo-font",
    "expo-status-bar",
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            minSdkVersion: 24,
            compileSdkVersion: 37,
            targetSdkVersion: 37,
          },
        },
      ],

      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon-monochrome.png",
          color: "#F59E0B",
          defaultChannel: "nf-customer-default-v2",
          sounds: [
            "./assets/notificationSounds/coreflow_1.wav",
            "./assets/notificationSounds/kalimba_1.wav",
            "./assets/notificationSounds/kalimba_2.wav",
            "./assets/notificationSounds/kalimba_3.wav",
            "./assets/notificationSounds/kalimba_4.wav",
            "./assets/notificationSounds/nile_miles_1.wav",
            "./assets/notificationSounds/nile_miles_2.wav",
            "./assets/notificationSounds/nile_miles_3.wav",
            "./assets/notificationSounds/nile_miles_4.wav",
            "./assets/notificationSounds/sonic_logo_1.wav",
            "./assets/notificationSounds/sonic_logo_2.wav",
          ],
        },
      ],
      [
        "expo-audio",
        {
          microphonePermission: false,
          recordAudioAndroid: false,
          enableBackgroundPlayback: false,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#ffffff",
          },
        },
            ],
      "expo-video",
      "expo-web-browser",
      "expo-secure-store",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
});
