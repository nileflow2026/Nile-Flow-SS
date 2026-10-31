// utils/ai.js
// ⚠️ SECURITY NOTE: OpenAI API key must NOT be hardcoded.
// This function proxies requests through the Nile Flow backend
// to keep the API key server-side.

import axiosClient from "../api";

export const getAIResponse = async (userInput) => {
  try {
    // Proxy through backend — API key stays server-side
    const response = await axiosClient.post("/api/ai/chat", {
      message: userInput,
    });

    return response.data.reply || response.data.response || response.data.message;
  } catch (error) {
    console.error("AI API error:", error);
    return "Sorry, I encountered an issue. Please try again.";
  }
};
