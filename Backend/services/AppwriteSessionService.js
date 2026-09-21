// services/appwrite.service.js - COMPATIBLE VERSION
const { Client, Account, Users, Databases } = require("node-appwrite");
const { env } = require("../src/env");

class AppwriteService {
  constructor() {
    this.client = null;
    this.account = null;
    this.users = null;
    this.db = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // console.log("🚀 Initializing Appwrite (compatible mode)...");

      // Load config
      const endpoint = env.APPWRITE_ENDPOINT;
      const projectId = env.APPWRITE_PROJECT_ID;
      const apiKey = env.APPWRITE_API_KEY;

      if (!endpoint || !projectId || !apiKey) {
        throw new Error("Missing Appwrite configuration in .env file");
      }

      // console.log(`📦 Project: ${projectId}`);
      // console.log(`🌐 Endpoint: ${endpoint}`);
      // console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

      // Initialize client
      this.client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

      // Initialize services
      this.account = new Account(this.client);
      this.users = new Users(this.client);
      this.db = new Databases(this.client);

      // Test connection with available scopes
      // console.log("🔄 Testing available scopes...");

      // Verify the configured key works at the REST layer without triggering the buggy
      // node-appwrite SDK permission probe that throws a false "users.read scope" error.
      try {
        const healthCheck = await fetch(`${endpoint}/users`, {
          method: "GET",
          headers: {
            "X-Appwrite-Project": projectId,
            "X-Appwrite-Key": apiKey,
            "Content-Type": "application/json",
          },
        });

        if (!healthCheck.ok) {
          throw new Error(`Appwrite health check returned ${healthCheck.status}`);
        }
      } catch (error) {
        console.error("❌ Appwrite connectivity check failed - ", error.message);
        throw new Error("Appwrite key/project is not valid for this environment");
      }

      this.isConnected = true;
      // console.log(
      //   "✅ Appwrite service initialized successfully (compatible mode)"
      // );
      // console.log(
      //   "📝 Note: Using sessions.write for authentication (account.* scopes not available)"
      // );
    } catch (error) {
      console.error("❌ Appwrite initialization failed:");
      console.error("   Error:", error.message);
      console.error("   Code:", error.code);

      if (error.message.includes("scope")) {
        console.error("\n💡 SOLUTION: Create new API key with these scopes:");
        console.error("   1. sessions.write");
        console.error("   2. users.read");
        console.error("   3. users.write");
        console.error("   4. databases.read");
        console.error("   5. databases.write");
        console.error("   6. documents.read");
        console.error("   7. documents.write");
      }

      throw error;
    }
  }

  /**
   * Authenticate user using sessions.write scope
   */
  async authenticate(email, password) {
    try {
      // Create session (uses sessions.write)
      const session = await this.account.createEmailPasswordSession(
        email,
        password
      );

      // Get user details (uses users.read)
      const user = await this.users.get(session.userId);

      return {
        session,
        user,
        sessionId: session.$id,
        userId: user.$id,
      };
    } catch (error) {
      console.error("Authentication failed:", error.message);
      throw error;
    }
  }

  /**
   * Get user by ID (uses users.read)
   */
  async getUser(userId) {
    return await this.users.get(userId);
  }

  /**
   * Create user (uses users.write)
   */
  async createUser(email, password, username, phone = null) {
    const userId = "unique()"; // Appwrite will generate

    const user = await this.users.create(
      userId,
      email,
      null, // Don't pass phone here,
      password,
      username
    );

    return user;
  }

  /**
   * Delete session (uses sessions.write)
   */
  async logout(sessionId) {
    return await this.account.deleteSession(sessionId);
  }

  /**
   * Database operations
   */
  async createDocument(collectionId, data, documentId = "unique()") {
    return await this.db.createDocument(
      process.env.APPWRITE_PROJECT_ID,
      collectionId,
      documentId,
      data
    );
  }

  async getAccount() {
    return this.account;
  }

  async getUsers() {
    return this.users;
  }

  async getDatabase() {
    return this.db;
  }

  async ensureConnected() {
    if (!this.isConnected) {
      await this.initialize();
    }
  }
}

module.exports = new AppwriteService();
