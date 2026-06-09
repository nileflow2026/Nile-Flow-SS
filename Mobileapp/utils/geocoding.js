// utils/geocoding.js
// ⚠️ SECURITY NOTE: Google Maps API key must NOT be hardcoded.
// Loaded from Expo Constants (configured via EAS Secrets → app.config.js).

import Constants from "expo-constants";

// Try multiple sources in order of precedence:
// 1. Constants.expoConfig?.extra?. (set via EAS Secrets → app.config.js)
// 2. Fallback to empty string (geocoding will fail gracefully)
const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || "";

export const reverseGeocode = async (latitude, longitude) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn(
      "[Geocoding] No Google Maps API key configured — skipping geocode",
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();
    console.log("Geocoding API Response:", data);
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};
