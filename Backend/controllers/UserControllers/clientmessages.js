const { ID } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const clientmessages = async (req, res) => {
  try {
    const { username, email, message } = req.body;

    if (!username || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Save the message to your Appwrite database
    const document = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID, // Your contact database ID
      env.APPWRITE_USER_MESSAGES_COLLECTION_ID, // Your messages collection ID
      ID.unique(),
      {
        username,
        email,
        message,
      },
    );

    res.status(200).json({
      success: true,
      data: {
        messageId: document.$id,
        reply: "Thanks for contacting Nile Flow Support. Your message has been received, and our team will get back to you shortly.",
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
