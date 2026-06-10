import axiosClient from "../../api";

/**
 * Validates if a user ID exists in the database
 * @param {string} userId - The user ID to validate
 * @returns {Promise<{exists: boolean, error?: string}>}
 */
export const validateUserId = async (userId) => {
  try {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return { exists: false, error: "Invalid user ID format" };
    }

    // Check via backend API
    const response = await axiosClient.get(`/api/users/${userId}`);
    const userDoc = response.data;

    return { exists: true, user: userDoc };
  } catch (error) {
    console.error("User validation error:", error);

    if (error.response?.status === 404) {
      return { exists: false, error: "User not found in database" };
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      return {
        exists: false,
        error: "Access denied - insufficient permissions",
      };
    } else if (error.response?.status === 400) {
      return { exists: false, error: "Invalid user ID format" };
    }

    return { exists: false, error: `Database error: ${error.message}` };
  }
};

/**
 * Lists all users to help debug user ID issues
 * @returns {Promise<Array>}
 */
export const debugListUsers = async () => {
  try {
    const response = await axiosClient.get("/api/users/users");
    const users = response.data;

    console.log(
      "Available users:",
      users.map((user) => ({
        id: user.$id,
        username: user.username,
        email: user.email,
        created: user.$createdAt,
      })),
    );

    return users;
  } catch (error) {
    console.error("Error listing users for debug:", error);
    return [];
  }
};

/**
 * Checks database and collection configuration
 * @returns {Promise<Object>}
 */
export const debugAppwriteConfig = async () => {
  console.log(
    "debugAppwriteConfig: Appwrite SDK is no longer available on the frontend.",
  );
  console.log("Use the backend API endpoints instead.");
  return {
    success: false,
    error: "Appwrite SDK removed from frontend — use backend API",
  };
};
