/**
 * Public Vendor Info Controller
 *
 * Exposes only public-facing vendor data for the customer-facing storefront.
 * Does NOT expose private vendor information (password, tokens, financials, etc.).
 */

const { Query } = require("node-appwrite");
const { db, instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const publicVendorFields = [
  "$id",
  "name",
  "storeName",
  "storeDescription",
  "email",
  "phone",
  "whatsapp",
  "location",
  "address",
  "profileImage",
  "coverImage",
  "category",
  "socialLinks",
  "storeStats",
  "createdAt",
  "isActive",
];

/**
 * Safely extract only public fields from a vendor document.
 */
function sanitizePublicVendor(vendorDoc) {
  if (!vendorDoc || typeof vendorDoc !== "object") return null;

  const safe = {};
  for (const key of publicVendorFields) {
    if (vendorDoc[key] !== undefined && vendorDoc[key] !== null) {
      safe[key] = vendorDoc[key];
    }
  }

  // Parse storeStats if it's a JSON string
  if (typeof safe.storeStats === "string") {
    try {
      safe.storeStats = JSON.parse(safe.storeStats);
    } catch (_) {
      safe.storeStats = {};
    }
  }

  // Parse socialLinks if it's a JSON string
  if (typeof safe.socialLinks === "string") {
    try {
      safe.socialLinks = JSON.parse(safe.socialLinks);
    } catch (_) {
      safe.socialLinks = {};
    }
  }

  // Derive joined date from createdAt
  if (safe.createdAt) {
    safe.joinedAt = safe.createdAt;
  }

  return safe;
}

const vendorInfoController = {
  /**
   * GET /api/customerprofile/vendor/:vendorId
   *
   * Returns public vendor information for the storefront.
   */
  async getPublicVendorInfo(req, res) {
    try {
      const { vendorId } = req.params;

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          error: "Vendor ID is required",
        });
      }

      // Try fetching from the main vendor collection first
      let vendorDoc = null;

      // Check MAIN_VENDORS_COLLECTION_ID if it exists
      const mainVendorCollectionId =
        env.MAIN_VENDORS_COLLECTION_ID || env.APPWRITE_VENDOR_COLLECTION_ID;

      if (mainVendorCollectionId) {
        try {
          vendorDoc = await instrumentedDb.getDocument(
            env.APPWRITE_DATABASE_ID,
            mainVendorCollectionId,
            vendorId,
          );
        } catch (_) {
          // Not found in main, fall through to vendor database
          vendorDoc = null;
        }
      }

      // Fallback: fetch from the VENDOR database
      if (!vendorDoc && env.VENDOR_DATABASE_ID && env.VENDOR_COLLECTION_ID) {
        try {
          vendorDoc = await db.getDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_COLLECTION_ID,
            vendorId,
          );
        } catch (_) {
          vendorDoc = null;
        }
      }

      // If still not found, try listing with query
      if (!vendorDoc && env.VENDOR_DATABASE_ID && env.VENDOR_COLLECTION_ID) {
        try {
          const result = await db.listDocuments(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_COLLECTION_ID,
            [Query.equal("$id", vendorId), Query.limit(1)],
          );
          if (result.documents && result.documents.length > 0) {
            vendorDoc = result.documents[0];
          }
        } catch (_) {
          // ignore
        }
      }

      if (!vendorDoc) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        });
      }

      const publicVendor = sanitizePublicVendor(vendorDoc);

      return res.json({
        success: true,
        vendor: publicVendor,
      });
    } catch (error) {
      console.error("Error fetching public vendor info:", error.message);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch vendor information",
      });
    }
  },
};

module.exports = vendorInfoController;
