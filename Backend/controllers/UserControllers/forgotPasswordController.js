const crypto = require("crypto");
const { Query } = require("node-appwrite");
const { users } = require("../../src/appwrite");
const { env } = require("../../src/env");
const { Resend } = require("resend");
const { instrumentedDb } = require("../../services/appwriteService");

const resend = new Resend(env.RESEND_API_KEY);
const { sendBrandedEmail } = require("../../services/emailTheme");

/**
 * Send a 6-digit password reset code to user's email
 * POST /api/nileflowafrica/passwordchange/forgot-password/send-code
 */
const sendForgotPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists in the user collection
    const userQuery = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (userQuery.documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "user_not_found",
        message: "No account found with this email. Please create a new account.",
      });
    }

    const user = userQuery.documents[0];

    // Also check Appwrite users to get the name
    let userName = user.username || "there";
    try {
      const appwriteUser = await users.get(user.$id);
      userName = appwriteUser.name || userName;
    } catch (_) {}

    // Generate a 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store the code in the user document
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
      {
        resetCode,
        resetCodeExpiry: resetCodeExpiry.toISOString(),
      },
    );

    // Send email with code via Resend
    const emailResponse = await sendBrandedEmail(resend, {
      from: "Nile Flow Africa <no-reply@nileflowafrica.com>",
      to: email,
      subject: "🔐 Your Nile Flow Password Reset Code",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Code | Nile Flow Africa</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f0fdf4; color: #1f2937; }
            .container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
            .card { background: #ffffff; border-radius: 24px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
            .logo { text-align: center; margin-bottom: 24px; }
            .logo h1 { font-size: 24px; font-weight: 800; color: #16a34a; margin: 0; }
            .logo p { font-size: 12px; color: #9ca3af; letter-spacing: 1px; margin: 4px 0 0; text-transform: uppercase; }
            h2 { font-size: 20px; font-weight: 700; color: #14532d; margin: 0 0 8px; text-align: center; }
            p { font-size: 15px; color: #6b7280; line-height: 1.6; text-align: center; margin: 8px 0; }
            .code-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center; }
            .code { font-size: 40px; font-weight: 800; color: #16a34a; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .note { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0; }
            .note p { color: #dc2626; font-size: 13px; margin: 0; text-align: left; }
            .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <h1>🌊 Nile Flow</h1>
                <p>African Marketplace</p>
              </div>
              <h2>Password Reset Code</h2>
              <p>Hello ${userName},</p>
              <p>Use the code below to reset your password. This code expires in 15 minutes.</p>
              <div class="code-box">
                <div class="code">${resetCode}</div>
              </div>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <div class="note">
                <p>⚠️ For your security, never share this code with anyone. Our team will never ask for it.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nile Flow Africa. All rights reserved.</p>
              <p>Nairobi, Kenya</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("✅ Password reset code sent:", emailResponse.data?.id);

    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset code has been sent.",
    });
  } catch (error) {
    console.error("❌ Error sending forgot password code:", error);
    res.status(500).json({
      success: false,
      message: "Unable to process request. Please try again later.",
    });
  }
};

/**
 * Verify the 6-digit reset code and set new password
 * POST /api/nileflowafrica/passwordchange/forgot-password/reset
 */
const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, reset code, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Find user by email
    const userQuery = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (userQuery.documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    const user = userQuery.documents[0];

    // Check if code matches
    if (!user.resetCode || user.resetCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset code. Please check and try again.",
      });
    }

    // Check if code has expired
    if (!user.resetCodeExpiry || new Date(user.resetCodeExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired. Please request a new one.",
      });
    }

    // Update password using Appwrite Users API
    // The user document's $id matches the Appwrite user ID
    await users.updatePassword(user.$id, newPassword);

    // Clear the reset code from user document
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
      {
        resetCode: null,
        resetCodeExpiry: null,
      },
    );

    // Also invalidate all refresh tokens for this user to force re-login
    try {
      const tokenRecords = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );
      for (const doc of tokenRecords.documents) {
        if (!doc.revoked) {
          await instrumentedDb.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
            doc.$id,
            { revoked: true, revokedAt: new Date().toISOString() },
          );
        }
      }
    } catch (_) {
      // Non-fatal — token cleanup is best-effort
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("❌ Error resetting password with code:", error);
    res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again later.",
    });
  }
};

/**
 * Send forgot password email (legacy — kept for web)
 */
const sendForgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const userQuery = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (userQuery.documents.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "If your email exists in our system, you will receive a password reset link shortly.",
      });
    }

    const user = userQuery.documents[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
      {
        resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString(),
      },
    );

    const resetUrl = `${env.FRONTEND_URL_PROD || env.FRONTEND_URL || "https://nileflowafrica.com"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendBrandedEmail(resend, {
      from: "Nile Flow Africa <no-reply@nileflowafrica.com>",
      to: email,
      subject: "🔐 Reset Your Nile Flow Africa Password",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password | Nile Flow Africa</title>
        </head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:24px;border:1px solid rgba(217,119,6,0.2);padding:40px 30px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#f59e0b;font-size:28px;margin:0;">🌊 Nile Flow Africa</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:13px;">Premium African Marketplace</p>
            </div>
            <h2 style="color:#f59e0b;font-size:22px;text-align:center;">Reset Your Password</h2>
            <p style="color:#cbd5e1;text-align:center;font-size:15px;line-height:1.6;">
              We received a request to reset the password for your Nile Flow account.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#d97706,#f59e0b);color:white;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-decoration:none;box-shadow:0 8px 25px rgba(217,119,6,0.3);">
                🔐 Reset My Password
              </a>
            </div>
            <p style="color:#94a3b8;text-align:center;font-size:14px;">
              This link expires in 1 hour.
            </p>
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px;margin:24px 0;">
              <p style="color:#fca5a5;font-size:13px;margin:0;text-align:center;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
            <div style="text-align:center;border-top:1px solid rgba(217,119,6,0.2);padding-top:20px;margin-top:20px;">
              <p style="color:#64748b;font-size:12px;">© ${new Date().getFullYear()} Nile Flow Africa</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("✅ Password reset email sent:", emailResponse.data?.id);

    res.status(200).json({
      success: true,
      message:
        "If your email exists in our system, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("❌ Error sending forgot password email:", error);
    res.status(500).json({
      success: false,
      message: "Unable to process password reset request. Please try again later.",
    });
  }
};

/**
 * Reset password with token (legacy — kept for web)
 */
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, token, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const userQuery = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (userQuery.documents.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid reset token" });
    }

    const user = userQuery.documents[0];

    if (user.resetToken !== token) {
      return res.status(400).json({ success: false, message: "Invalid reset token" });
    }

    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return res.status(400).json({ success: false, message: "Reset token has expired" });
    }

    await users.updatePassword(user.appwriteUserId || user.$id, newPassword);

    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
      { resetToken: null, resetTokenExpiry: null },
    );

    // Invalidate all refresh tokens
    try {
      const tokenRecords = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );
      for (const doc of tokenRecords.documents) {
        if (!doc.revoked) {
          await instrumentedDb.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
            doc.$id,
            { revoked: true, revokedAt: new Date().toISOString() },
          );
        }
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again later.",
    });
  }
};

module.exports = {
  sendForgotPasswordCode,
  resetPasswordWithCode,
  sendForgotPasswordEmail,
  resetPassword,
};
