const { config } = require("dotenv");
const appJson = require("./app.json");

config({ path: ".env" });

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      API_URL: process.env.API_BASE_URL || appJson.expo.extra.API_URL,
      STRIPE_KEY: process.env.STRIPE_KEY || appJson.expo.extra.STRIPE_KEY,
      EXPO_PUBLIC_POSTHOG_API_KEY:
        process.env.EXPO_PUBLIC_POSTHOG_API_KEY ||
        appJson.expo.extra.EXPO_PUBLIC_POSTHOG_API_KEY,
      EXPO_PUBLIC_POSTHOG_HOST:
        process.env.EXPO_PUBLIC_POSTHOG_HOST ||
        appJson.expo.extra.EXPO_PUBLIC_POSTHOG_HOST,
    },
  },
});
