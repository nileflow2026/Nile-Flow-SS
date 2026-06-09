import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../api";

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  KES: "KSh",
  SSP: "ssp",
  UGX: "USh",
  TZS: "TSh",
  ETB: "Br",
  GHS: "GH₵",
  RWF: "FRw",
  ZAR: "R",
};

/**
 * Convert price display currency.
 * Now fetches exchange rate from Express API instead of hitting Appwrite directly.
 */
export const convertPrice = async (priceInUSD) => {
  const userCurrency = (await AsyncStorage.getItem("userCurrency")) || "USD";

  if (userCurrency === "USD") {
    const symbol = currencySymbols["USD"] || "$";
    return `${symbol} ${Number(priceInUSD).toFixed(2)}`;
  }

  try {
    const response = await axiosClient.get("/api/currency/rate", {
      params: { code: userCurrency },
    });

    const rate = response.data?.rate;
    if (!rate || typeof rate !== "number") {
      throw new Error("Invalid rate response");
    }

    const symbol = currencySymbols[userCurrency] || "";
    return `${symbol} ${(priceInUSD * rate).toFixed(2)}`;
  } catch (error) {
    console.error("Error converting price via API:", error?.message || error);
    // Fallback to USD display
    return `$${Number(priceInUSD).toFixed(2)}`;
  }
};

/**
 * Get available currencies from the backend.
 */
export const getCurrencies = async () => {
  try {
    const response = await axiosClient.get("/api/currency/list");
    return response.data?.currencies || [];
  } catch (error) {
    console.error("Error fetching currencies:", error?.message || error);
    return [];
  }
};
