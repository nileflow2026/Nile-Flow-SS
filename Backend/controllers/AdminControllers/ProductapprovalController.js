const { instrumentedDb } = require("../../services/appwriteService");
const { Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");
const {
  CreateProductApprovalNotification,
  CreateProductPublishedNotification,
} = require("./notificationController");
const { productPublishingService } = require("../../services/productPublishingService");

/**
 * ============================================================================
 * PRODUCT APPROVAL CONTROLLER
 *
 * These endpoints are preserved but gated behind the PRODUCT_APPROVAL_REQUIRED
 * configuration flag. When the flag is false (default), these endpoints return
 * a 200 response indicating that approval is not required — this allows the
 * admin UI to continue working without breaking.
 *
 * When the flag is true, the full approval workflow is restored.
 * ============================================================================
 */

/**
 * Check if the product approval workflow is active.
 * If not, return an informational message instead of performing the action.
 */
async function requireApprovalEnabled(res) {
  const requiresApproval = await productPublishingService.isApprovalRequired();
  if (!requiresApproval) {
    return {
      blocked: true,
      response: res.status(200).json({
        success: true,
        message: "Product approval is currently disabled. Products publish immediately. Set PRODUCT_APPROVAL_REQUIRED=true to re-enable this workflow.",
        approvalDisabled: true,
      }),
    };
  }
  return { blocked: false };
}

// adminProductController.js
const approveProduct = async (req, res) => {
  // Check if approval workflow is enabled
  const approvalCheck = await requireApprovalEnabled(res);
  if (approvalCheck.blocked) return;

  try {
    const { productId } = req.params;
    const adminId = req.user.userId;

    // 1. Get the product
    const product = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Product already approved",
      });
    }

    // 2. Get vendor details
    let vendorEmail = null;
    let vendorName = "Vendor";

    try {
      if (product.vendorId) {
        const vendor = await instrumentedDb.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_COLLECTION_ID,
          product.vendorId,
        );

        vendorEmail = vendor.email;
        vendorName = vendor.name || vendor.storeName || "Vendor";
      }
    } catch (vendorError) {
      console.warn("Could not fetch vendor details:", vendorError.message);
    }

    // 3. Update product status to approved
    const updatedProduct = await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        isActive: true,
        isApproved: true,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: adminId,
        updatedAt: new Date().toISOString(),
      },
    );

    // 4. Notify the vendor
    if (vendorEmail) {
      try {
        await CreateProductApprovalNotification({
          message: `Your product "${product.productName}" has been approved and is now live on the website!`,
          type: "product_approved",
          username: vendorName,
          email: vendorEmail,
          userId: product.vendorId,
          metadata: JSON.stringify({
            productId,
            productName: product.productName,
            approvedAt: new Date().toISOString(),
            viewUrl: `/products/${product.slug || productId}`,
          }),
        });
      } catch (notificationError) {
        console.error("Notification failed (continuing):", notificationError.message);
      }
    }

    // 5. Update vendor's product record
    try {
      await instrumentedDb.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          isLive: true,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (vendorUpdateError) {
      console.warn("Could not update vendor product:", vendorUpdateError);
    }

    res.json({
      success: true,
      message: "Product approved successfully",
      data: { product: updatedProduct },
    });
  } catch (error) {
    console.error("Approve product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve product",
    });
  }
};

const rejectProduct = async (req, res) => {
  // Check if approval workflow is enabled
  const approvalCheck = await requireApprovalEnabled(res);
  if (approvalCheck.blocked) return;

  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    // 1. Get the product
    const product = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
    );

    // 2. Update product status
    const updatedProduct = await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        isActive: false,
        isApproved: false,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminId,
        rejectionReason: reason || "Does not meet our guidelines",
        updatedAt: new Date().toISOString(),
      },
    );

    // 3. Notify the vendor
    await CreateProductApprovalNotification({
      message: `Your product "${product.productName}" was not approved. Reason: ${reason || "Does not meet our guidelines"}`,
      type: "product_rejected",
      username: product.vendor?.name || "Vendor",
      email: product.vendor?.email,
      userId: product.vendorId,
      metadata: {
        productId,
        productName: product.productName,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        resubmitUrl: `/vendor/products/edit/${productId}`,
      },
    });

    res.json({
      success: true,
      message: "Product rejected",
      data: { product: updatedProduct },
    });
  } catch (error) {
    console.error("Reject product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject product",
    });
  }
};

const getPendingProducts = async (req, res) => {
  try {
    // When approval is disabled, return an empty list rather than querying
    const requiresApproval = await productPublishingService.isApprovalRequired();
    if (!requiresApproval) {
      return res.json({
        success: true,
        data: {
          products: [],
          total: 0,
          message: "Product approval is currently disabled. All products publish immediately.",
          approvalDisabled: true,
        },
      });
    }

    const pendingProducts = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    );

    res.json({
      success: true,
      data: {
        products: pendingProducts.documents,
        total: pendingProducts.total,
      },
    });
  } catch (error) {
    console.error("Get pending products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending products",
    });
  }
};

module.exports = {
  approveProduct,
  rejectProduct,
  getPendingProducts,
};
