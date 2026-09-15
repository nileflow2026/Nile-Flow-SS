const { ID } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const socketService = require("../../services/socketService");

const clientmessages = async (req, res) => {
  try {
    const { username, email, message, conversationId } = req.body;

    if (!username || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    let document;
    const initialReply = "Thanks for contacting Nile Flow Support. Your message has been received, and our team will get back to you shortly.";
    if (conversationId) {
      const existing = await instrumentedDb.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_MESSAGES_COLLECTION_ID,
        conversationId,
      );
      if (existing.email !== email) {
        return res.status(403).json({ error: "Conversation access denied." });
      }
      const transcript = `${existing.message || ""}\n\nCustomer: ${message}`.trim();
      document = await instrumentedDb.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_MESSAGES_COLLECTION_ID,
        conversationId,
        { message: transcript },
      );
      socketService.sendCustomerMessage(conversationId, message);
    } else {
      document = await instrumentedDb.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        { username, email, message: `Customer: ${message}\n\nSupport: ${initialReply}` },
      );
      socketService.sendCustomerMessage(document.$id, message, {
        isNew: true,
        username,
        email,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        messageId: document.$id,
        reply: conversationId
          ? null
          : initialReply,
      },
    });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    res
      .status(500)
      .json({ error: "Failed to send message. Please try again later." });
  }
};

module.exports = clientmessages;
