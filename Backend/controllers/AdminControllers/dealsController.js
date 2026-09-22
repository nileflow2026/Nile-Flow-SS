/**
 * Deals Controller
 * CRUD operations for deals management.
 * GET /api/admin/deals — list all deals with optional filter
 * POST /api/admin/deals — create a new deal
 * PATCH /api/admin/deals/:dealId — update a deal
 * DELETE /api/admin/deals/:dealId — delete a deal
 * GET /api/admin/deals/analytics — deal analytics
 */

"use strict";

const { Query, ID } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { resolveCategoryName } = require("../../utils/categoryResolver");

/**
 * GET /api/admin/deals
 * Returns all deals with optional type filter (product, flash, premium)
 */
async function getDeals(req, res) {
  try {
    const type = req.query.type || "all";
    let queries = [Query.orderDesc("$createdAt")];

    if (type === "flash") {
      queries.push(Query.equal("isFlash", true));
    }

    if (type === "premium") {
      // Get premium deals from deals collection
      queries.push(Query.equal("premiumDeal", true));
    } else if (type === "product") {
      // Get regular product deals
      queries.push(Query.equal("isDeal", true));
      queries.push(Query.equal("premiumDeal", false));
    }

    // Default: get all deals
    const response = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      queries
    );

    const deals = await Promise.all(response.documents.map(async (doc) => ({
      ...doc,
      type: doc.isFlash ? "flash" : doc.premiumDeal ? "premium" : "product",
      categoryName: await resolveCategoryName(doc.category, instrumentedDb, env),
    })));

    res.status(200).json({ success: true, deals });
  } catch (error) {
    console.error("Error fetching deals:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/admin/deals/analytics
 * Returns analytics about deals
 */
async function getDealAnalytics(req, res) {
  try {
    // Get all deals
    const dealsResponse = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      [Query.orderDesc("$createdAt")]
    );

    // Get all flash sales
    const flashResponse = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FLASH_SALE_COLLECTION_ID,
      [Query.orderDesc("$createdAt")]
    );

    const deals = dealsResponse.documents;
    const totalDeals = deals.length;
    const flashSales = flashResponse.documents.length;
    const premiumDeals = deals.filter((d) => d.premiumDeal).length;
    const bestValue = deals.filter((d) => (d.discount || 0) >= 40).length;

    res.status(200).json({
      success: true,
      analytics: {
        total: totalDeals,
        flashSales,
        premiumDeals,
        bestValue,
      },
    });
  } catch (error) {
    console.error("Error fetching deal analytics:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/admin/deals
 * Create a new deal
 */
async function createDeal(req, res) {
  try {
    const {
      productId,
      productName,
      price,
      dealPrice,
      discount,
      category,
      image,
      images,
      description,
      durationHours = 24,
      isFlash = false,
      premiumDeal = false,
      active = true,
    } = req.body;

    // Validate required fields
    if (!productId || !productName || !price || !dealPrice) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: productId, productName, price, dealPrice",
      });
    }

    // Check if product already has a deal
    const existingDeal = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      [Query.equal("productId", productId)]
    );

    if (existingDeal.total > 0) {
      return res.status(409).json({
        success: false,
        error: "Product already has an active deal",
      });
    }

    // Calculate end time
    const dealEndTime = new Date();
    dealEndTime.setHours(dealEndTime.getHours() + (durationHours || 24));

    // Create deal document
    const doc = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      ID.unique(),
      {
        productId,
        productName,
        price: parseFloat(price),
        dealPrice: parseFloat(dealPrice),
        discount: parseFloat(discount) || Math.round(((parseFloat(price) - parseFloat(dealPrice)) / parseFloat(price)) * 100),
        category,
        image,
        images,
        description,
        isDeal: true,
        isFlash,
        premiumDeal,
        active,
        dealEndTime: dealEndTime.toISOString(),
        durationHours: durationHours || 24,
        createdAt: new Date().toISOString(),
      }
    );

    res.status(201).json({
      success: true,
      deal: {
        ...doc,
        type: doc.premiumDeal ? "premium" : "product",
      },
    });
  } catch (error) {
    console.error("Error creating deal:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PATCH /api/admin/deals/:dealId
 * Update a deal
 */
async function updateDeal(req, res) {
  try {
    const { dealId } = req.params;
    const updates = req.body;

    // Validate required fields
    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: "Deal ID is required",
      });
    }

    // Update the deal
    const doc = await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      dealId,
      updates
    );

    res.status(200).json({
      success: true,
      deal: {
        ...doc,
        type: doc.premiumDeal ? "premium" : "product",
      },
    });
  } catch (error) {
    console.error("Error updating deal:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/admin/deals/:dealId
 * Delete a deal
 */
async function deleteDeal(req, res) {
  try {
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: "Deal ID is required",
      });
    }

    // Delete the deal
    await instrumentedDb.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      dealId
    );

    res.status(200).json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deal:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getDeals,
  getDealAnalytics,
  createDeal,
  updateDeal,
  deleteDeal,
};
