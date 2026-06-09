/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║            ⚠️  DEPRECATED — DO NOT USE FOR DATA ACCESS        ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║  This file exposes direct Appwrite SDK access from the        ║
 * ║  browser, bypassing Redis cache, repository layer, rate       ║
 * ║  limiting, and instrumentation.                              ║
 * ║                                                               ║
 * ║  ARCHITECTURE VIOLATION                                      ║
 * ║                                                               ║
 * ║  Required architecture:                                      ║
 * ║    Frontend → axiosClient → Express API → Redis Cache →      ║
 * ║    Repository Layer → Instrumented DB → Appwrite             ║
 * ║                                                               ║
 * ║  Forbidden architecture:                                     ║
 * ║    Frontend → Databases() → Appwrite                         ║
 * ║                                                               ║
 * ║  This file is retained only for backward compatibility        ║
 * ║  during the migration period. New code MUST NOT import       ║
 * ║  from this file for data access.                             ║
 * ║                                                               ║
 * ║  Use `import axiosClient from '../api'` instead.             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import {
  Client,
  Databases,
  Account,
  ID,
  Functions,
  Avatars,
  Query,
  Storage,
} from "appwrite";

const client = new Client();
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6926c7df002fa7831d94");

const databases = new Databases(client);
const account = new Account(client);
const avatars = new Avatars(client);
const functions = new Functions(client);
const storage = new Storage(client);

export const Config = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "6926c7df002fa7831d94",
  platform: "com.nileflow.ssd",
  databaseId: "6926c9bb00320db14571",
  userCollectionId: "67f64e5c001e919e0b8c",
  reviewsCollectionId: "67f653d4000a1b786ee9",
  StorageId: "692a3b700039c02fb4bc",
  productCollectionId: "692745740005ffe9fa00",
  cartCollectionId: "67f744ee0038dee1ecf1",
  orderCollection: "69274563002eee2bea49",
  currenciesCollection: "692744d4003a2b4b97b8",
  addressCollection: "67f651a100157ee1ebc7",
  functionId: "67d25e700014c71138d1",
  transactionsId: "67f745eb00152657d543",
  orderCollectionId: "67f745eb00152657d543",
  updateOrderStatusFunctionId: "67e2551f002ec6477229",
  reportsCollectionId: "67ebd0f700080e92db27",
  NOTIFICATIONS_COLLECTION_ID: "6802968e000921b68fc7",
  APPLICANT_CVS_BUCKET_ID: "68c2feda000396f76d7d",
};

// ⚠️ DEPRECATED — Exports retained for migration period only.
// Do NOT import databases, account, or other services from this file
// for new components. Use axiosClient + Express API instead.
export { databases, account, avatars, ID, functions, client, Query, storage };
