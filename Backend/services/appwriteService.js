const {
  Client,
  Databases,
  Users,
  Avatars,
  Functions,
  Storage,
} = require("node-appwrite");
const { env } = require("../src/env");
const { createInstrumentedDb } = require("../src/observability/appwriteMetrics");
// console.log("Appwrite Key Loaded:", env.APPWRITE_API_KEY ? "Loaded" : "FAILED/UNDEFINED"); // 👈 Check this!
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // secret server key

const db = new Databases(client);
const instrumentedDb = createInstrumentedDb(db);
const users = new Users(client);
const avatars = new Avatars(client);
const functions = new Functions(client);
const storage = new Storage(client);

async function getOrderById(orderId) {
  try {
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION_ID,
      orderId
    );
    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

module.exports = {
  client,
  db,
  instrumentedDb,
  users,
  avatars,
  functions,
  getOrderById,
  storage,
};
