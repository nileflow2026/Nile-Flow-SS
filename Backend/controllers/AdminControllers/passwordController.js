const { Client, Account } = require("node-appwrite");
const { users } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body || {};
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Authentication is required." });
  }
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: "Missing required password fields." });
  }
  if (newPassword !== confirmNewPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirmation do not match." });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters long." });
  }
  if (newPassword === currentPassword) {
    return res
      .status(400)
      .json({ error: "New password must differ from the current password." });
  }

  let verificationSession;

  try {
    const verifierClient = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT)
      .setProject(env.APPWRITE_PROJECT_ID);
    const verifierAccount = new Account(verifierClient);
    const appwriteUser = await users.get(userId);

    verificationSession = await verifierAccount.createEmailPasswordSession(
      appwriteUser.email,
      currentPassword,
    );

    if (verificationSession.userId !== userId) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    await users.deleteSession(
      verificationSession.userId,
      verificationSession.$id,
    );
    verificationSession = null;
    await users.updatePassword(userId, newPassword);

    return res.status(200).json({
      message: "Password successfully changed.",
    });
  } catch (error) {
    if (
      error.code === 401 ||
      /credentials|password|authentication/i.test(String(error.message || ""))
    ) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    console.error("Appwrite password update failed:", error.message);
    return res.status(500).json({
      error: "Failed to update password due to a server error.",
    });
  } finally {
    if (verificationSession) {
      try {
        await users.deleteSession(
          verificationSession.userId,
          verificationSession.$id,
        );
      } catch (cleanupError) {
        console.error(
          "Could not remove temporary password-verification session:",
          cleanupError.message,
        );
      }
    }
  }
};

module.exports = {
  changePassword,
};
