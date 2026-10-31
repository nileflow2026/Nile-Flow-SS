// controllers/AdminControllers/vendorAdminController.js
const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const sanitizeVendor = (vendor) => {
  const { password, confirmPassword, ...safe } = vendor;
  return safe;
};

const vendorAdminController = {
  /**
   * GET /api/admin/vendors
   * Fetch all vendors with optional search/filter
   */
  async getAllVendors(req, res) {
    try {
      const { search, status, page = 1, limit = 25 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      const queries = [
        Query.orderDesc("$createdAt"),
        Query.limit(limitNum),
        Query.offset(offset),
      ];

      // Status filter
      if (status === "active") {
        queries.push(Query.equal("isActive", true));
      } else if (status === "inactive") {
        queries.push(Query.equal("isActive", false));
      }

      // If search is provided, filter by email (search only works on specific fields)
      if (search) {
        // Re-search on email (most reliable indexed field)
        const emailResults = await db.listDocuments(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_COLLECTION_ID,
          [
            Query.search("email", search),
            ...queries.filter(q => !q.startsWith?.("offset")),
          ]
        );

        // Also search by storeName as fallback
        const nameResults = await db.listDocuments(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_COLLECTION_ID,
          [
            Query.search("storeName", search),
            ...queries.filter(q => !q.startsWith?.("offset") && !q.startsWith?.("search")),
          ]
        );

        // Merge unique results
        const seen = new Set();
        const merged = [...(emailResults.documents || []), ...(nameResults.documents || [])]
          .filter(doc => {
            if (seen.has(doc.$id)) return false;
            seen.add(doc.$id);
            return true;
          });

        return res.json({
          success: true,
          data: {
            vendors: merged.map(sanitizeVendor),
            total: merged.length,
            page: pageNum,
            limit: limitNum,
          },
        });
      }

      const response = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        queries
      );

      // Sanitize vendors (remove passwords)
      const sanitizedVendors = response.documents.map(sanitizeVendor);

      res.json({
        success: true,
        data: {
          vendors: sanitizedVendors,
          total: response.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(response.total / limitNum),
        },
      });
    } catch (error) {
      console.error("[VendorAdmin] Error fetching vendors:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch vendors",
        details: error.message,
      });
    }
  },

  /**
   * GET /api/admin/vendors/:vendorId
   * Fetch a single vendor by ID
   */
  async getVendorById(req, res) {
    try {
      const { vendorId } = req.params;

      const vendor = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId
      );

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        });
      }

      // Sanitize
      const safe = sanitizeVendor(vendor);

      res.json({
        success: true,
        data: { vendor: safe },
      });
    } catch (error) {
      console.error("[VendorAdmin] Error fetching vendor:", error);
      if (error.code === 404) {
        return res.status(404).json({ success: false, error: "Vendor not found" });
      }
      res.status(500).json({
        success: false,
        error: "Failed to fetch vendor",
        details: error.message,
      });
    }
  },

  /**
   * PATCH /api/admin/vendors/:vendorId/status
   * Activate or deactivate a vendor
   */
  async toggleVendorStatus(req, res) {
    try {
      const { vendorId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "isActive field is required (boolean)",
        });
      }

      const updated = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId,
        {
          isActive,
          updatedAt: new Date().toISOString(),
        }
      );

      const safe = sanitizeVendor(updated);

      res.json({
        success: true,
        message: `Vendor ${isActive ? "activated" : "deactivated"} successfully`,
        data: { vendor: safe },
      });
    } catch (error) {
      console.error("[VendorAdmin] Error toggling vendor status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update vendor status",
      });
    }
  },

  /**
   * GET /api/admin/vendors/stats
   * Get vendor statistics
   */
  async getVendorStats(req, res) {
    try {
      const allVendors = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        [Query.limit(1000)]
      );

      const stats = {
        total: allVendors.total,
        active: allVendors.documents.filter((v) => v.isActive !== false).length,
        inactive: allVendors.documents.filter((v) => v.isActive === false).length,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("[VendorAdmin] Error fetching vendor stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch vendor stats",
      });
    }
  },
};

module.exports = vendorAdminController;
