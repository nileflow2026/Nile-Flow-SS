/**
 * Product Publishing Service
 *
 * Centralized product publishing rules for Nile Flow.
 * This is the single source of truth for determining product visibility,
 * status derivation, and approval requirements.
 *
 * FEATURE FLAG: PRODUCT_APPROVAL_REQUIRED
 *   - false (default) → Products publish immediately with status "live"
 *   - true            → Products require admin approval (status "pending")
 *
 * To re-enable approval workflow: flip this flag in platform settings.
 * No code changes needed.
 */

const { db, instrumentedDb } = require("./appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");

const SETTINGS_KEY = "product_approval_required";
const DEFAULT_APPROVAL_REQUIRED = false;

class ProductPublishingService {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = 0;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check whether product approval is currently required.
   * Reads from platform settings with fallback to environment variable.
   * @returns {Promise<boolean>}
   */
  async isApprovalRequired() {
    // Check cache first
    if (this.cache !== null && Date.now() - this.cacheTimestamp < this.cacheTTL) {
      return this.cache;
    }

    try {
      // Try platform settings collection first
      if (env.APPWRITE_DATABASE_ID && env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID) {
        const settings = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID,
          [Query.equal("settingKey", SETTINGS_KEY), Query.limit(1)],
        );

        if (settings.documents.length > 0) {
          const value = settings.documents[0].settingValue === "true";
          this.cache = value;
          this.cacheTimestamp = Date.now();
          return value;
        }
      }

      // Fallback to environment variable
      const envValue = process.env.PRODUCT_APPROVAL_REQUIRED;
      if (envValue !== undefined) {
        const value = envValue === "true" || envValue === "1";
        this.cache = value;
        this.cacheTimestamp = Date.now();
        return value;
      }
    } catch (error) {
      console.warn("[ProductPublishingService] Failed to read approval setting:", error.message);
    }

    // Default: no approval required
    this.cache = DEFAULT_APPROVAL_REQUIRED;
    this.cacheTimestamp = Date.now();
    return this.cache;
  }

  /**
   * Invalidate the cached approval setting.
   * Call this after updating the setting in the admin panel.
   */
  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get the initial product status based on current policy.
   * @returns {Promise<string>} "live" | "pending"
   */
  async getInitialStatus() {
    const requiresApproval = await this.isApprovalRequired();
    return requiresApproval ? "pending" : "live";
  }

  /**
   * Get the initial isActive value based on current policy.
   * @returns {Promise<boolean>}
   */
  async getInitialIsActive() {
    const requiresApproval = await this.isApprovalRequired();
    return !requiresApproval; // Live immediately if no approval needed
  }

  /**
   * Get the initial isApproved value based on current policy.
   * @returns {Promise<boolean>}
   */
  async getInitialIsApproved() {
    const requiresApproval = await this.isApprovalRequired();
    return !requiresApproval; // Auto-approved if no approval needed
  }

  /**
   * Build the status fields for a new product document.
   * @returns {Promise<{status: string, isActive: boolean, isApproved: boolean}>}
   */
  async buildStatusFields() {
    const [status, isActive, isApproved] = await Promise.all([
      this.getInitialStatus(),
      this.getInitialIsActive(),
      this.getInitialIsApproved(),
    ]);
    return { status, isActive, isApproved };
  }

  /**
   * Determine display status label for frontend consumption.
   * @param {Object} product - Product document
   * @returns {string}
   */
  getDisplayStatus(product) {
    if (!product) return "unknown";
    if (product.status === "suspended") return "Suspended";
    if (product.status === "hidden") return "Hidden";
    if (product.status === "archived") return "Archived";
    if (product.status === "draft") return "Draft";
    if (product.status === "pending") return "Pending Approval";
    if (product.status === "live" || product.status === "approved") return "Live";
    if (product.status === "rejected") return "Rejected";
    if (product.isActive === false && product.status !== "pending") return "Hidden";
    return "Live";
  }

  /**
   * Check if a product should be visible to customers.
   * Centralizes visibility logic so it can be used by all queries.
   * @param {Object} product - Product document
   * @returns {boolean}
   */
  isVisible(product) {
    if (!product) return false;
    if (product.status === "suspended") return false;
    if (product.status === "archived") return false;
    if (product.status === "hidden") return false;
    if (product.status === "draft") return false;
    if (product.isActive === false) return false;
    // If approval is required, only show approved/live products
    if (product.status === "pending") return false;
    if (product.status === "rejected") return false;
    return true;
  }

  /**
   * Get visibility filters for database queries.
   * Returns an array of Appwrite Query filters.
   * @returns {Promise<Array>}
   */
  async getVisibilityFilters() {
    const requiresApproval = await this.isApprovalRequired();

    if (requiresApproval) {
      return [
        Query.equal("isActive", true),
        Query.equal("isApproved", true),
      ];
    }

    return [
      Query.equal("isActive", true),
    ];
  }

  /**
   * Get the admin notification message for a newly published product.
   * Different messages based on whether approval is required.
   * @param {Object} productData
   * @returns {Object} { message, type, subject }
   */
  async getAdminNotificationContent(productData) {
    const requiresApproval = await this.isApprovalRequired();

    if (requiresApproval) {
      return {
        message: `New product submitted for approval: "${productData.productName}" by ${productData.vendorStore}`,
        type: "product_submission",
        subject: `⚠️ New Product Pending Approval — ${productData.productName}`,
        actionUrl: `/admin/products/pending/${productData.productId}`,
      };
    }

    return {
      message: `New product published: "${productData.productName}" by ${productData.vendorStore} — $${productData.price}`,
      type: "product_published",
      subject: `🆕 New Product Published — ${productData.productName}`,
      actionUrl: `/admin/products/${productData.productId}`,
    };
  }
}

// Export singleton
const productPublishingService = new ProductPublishingService();

module.exports = {
  ProductPublishingService,
  productPublishingService,
};
