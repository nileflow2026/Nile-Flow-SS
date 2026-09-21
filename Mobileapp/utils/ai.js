// utils/ai.js
// ⚠️ SECURITY NOTE: OpenAI API key must NOT be hardcoded.
// This function proxies requests through the Nile Flow backend
// to keep the API key server-side.

import axios from "axios";
import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.extra?.API_BASE_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  "http://10.0.2.2:3000";

export const getAIResponse = async (userInput) => {
  try {
    // Proxy through backend — API key stays server-side
    const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
      message: userInput,
    });

    return response.data.response || response.data.message;
  } catch (error) {
    console.error("AI API error:", error);
    return "Sorry, I encountered an issue. Please try again.";
  }
};
