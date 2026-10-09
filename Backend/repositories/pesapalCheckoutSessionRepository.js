"use strict";

const { db } = require("../src/appwrite");
const { env } = require("../src/env");

async function findByAttemptId(checkoutAttemptId) {
  try {
    return await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID,
      checkoutAttemptId,
    );
  } catch (error) {
    if (error.code === 404) return null;
    throw error;
  }
}

async function save(
  checkoutAttemptId,
  session,
  { replaceExisting = false } = {},
) {
  const existing = await findByAttemptId(checkoutAttemptId);
  if (existing) {
    if (existing.orderId !== session.orderId) {
      throw new Error("Pesapal checkout attempt is bound to a different order.");
    }
    if (!replaceExisting) return existing;

    return db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID,
      checkoutAttemptId,
      session,
    );
  }

  try {
    return await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID,
      checkoutAttemptId,
      session,
    );
  } catch (error) {
    if (error.code !== 409) throw error;

    const concurrentSession = await findByAttemptId(checkoutAttemptId);
    if (!concurrentSession || concurrentSession.orderId !== session.orderId) {
      throw error;
    }
    if (!replaceExisting) return concurrentSession;

    return db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID,
      checkoutAttemptId,
      session,
    );
  }
}

module.exports = { findByAttemptId, save };
