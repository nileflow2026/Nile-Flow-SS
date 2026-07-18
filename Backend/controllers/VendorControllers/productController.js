// controllers/productController.js
const { File } = require("node-fetch-native-with-agent");
const { ID } = require("node-appwrite");
const { db, storage, instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { Query } = require("node-appwrite");
const {
  CreateProductPublishedNotification,
  CreateProductApprovalNotification,
} = require("../AdminControllers/notificationController");
const {
  sendEmail: sendAppwriteEmail,
  sendSms: sendAppwriteSms,
} = require("../../services/appwriteMessagingService");
const { productPublishingService } = require("../../services/productPublishingService");
const { submitProductToIndexNow } = require("../../routes/seoRoutes");

const normalizeImageValue = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    if (typeof value.url === "string") return normalizeImageValue(value.url);
    if (typeof value.imageUrl === "string") return normalizeImageValue(value.imageUrl);
    return "";
  }

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/api/image-proxy?url=")) {
    try {
      const parsed = new URL(trimmed, env.FRONTEND_URL || "https://www.nileflowafrica.com");
      const target = parsed.searchParams.get("url");
      if (target) return normalizeImageValue(target);
    } catch (error) {
      console.warn("Failed to parse proxy image URL:", error.message);
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return parsed.toString();
    } catch (error) {
      console.warn("Invalid absolute image URL:", trimmed);
    }
  }

  const embeddedUrlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  if (embeddedUrlMatch) {
    try {
      return new URL(embeddedUrlMatch[0]).toString();
    } catch (error) {
      console.warn("Invalid embedded image URL:", embeddedUrlMatch[0]);
    }
  }

  return "";
};

const normalizeImageList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeImageValue(item))
      .filter(Boolean);
  }

  const single = normalizeImageValue(value);
  return single ? [single] : [];
};

const sanitizeProductForResponse = (productDoc) => {
  if (!productDoc || typeof productDoc !== "object") return productDoc;

  const sanitized = { ...productDoc };
  const normalizedImage = normalizeImageValue(sanitized.image);

  if (normalizedImage) {
    sanitized.image = normalizedImage;
  } else {
    delete sanitized.image;
  }

  const normalizedImages = normalizeImageList(sanitized.images);
  if (normalizedImages.length > 0) {
    sanitized.images = normalizedImages;
  } else {
    delete sanitized.images;
  }

  return sanitized;
};

const productController = {
  // Create Product — publishes immediately unless approval feature flag is enabled
  async createProduct(req, res) {
    try {
      const vendorId = req.user.userId;

      const {
        name,
        description,
        price,
        categoryId,
        subcategoryId,
        tags,
        inventory,
        attributes,
        image,
        images,
        type = "physical",
        brand = "",
        details = "",
        currency = "USD",
        specifications = {},
      } = req.body;

      const normalizedImage = normalizeImageValue(image);
      const normalizedImages = normalizeImageList(images);
      const primaryImage = normalizedImage || normalizedImages[0] || "";

      // Generate SKU
      const generateSKU = () => {
        const prefix = "VEND";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
      };

      // Validation
      if (!name || !price || !categoryId) {
        return res.status(400).json({
          success: false,
          error: "Name, price, and category are required",
        });
      }

      // Parse attributes if they're sent as string
      let parsedAttributes = {};
      if (attributes) {
        if (typeof attributes === "string") {
          try {
            parsedAttributes = JSON.parse(attributes);
          } catch (error) {
            console.warn("Invalid attributes format, using empty object");
          }
        } else {
          parsedAttributes = attributes;
        }
      }

      // Build status fields from the publishing policy
      const statusFields = await productPublishingService.buildStatusFields();
      const requiresApproval = await productPublishingService.isApprovalRequired();

      // Get vendor details to include in main product
      let vendorDetails = null;
      try {
        const vendor = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_COLLECTION_ID,
          vendorId,
        );
        vendorDetails = {
          id: vendor.$id,
          name: vendor.name,
          storeName: vendor.storeName,
          email: vendor.email,
          phone: vendor.phone,
          profilePicture: vendor.profilePicture || "",
          rating: vendor.rating || 0,
          totalSales: vendor.totalSales || 0,
          status: vendor.status || "active",
        };
      } catch (vendorError) {
        console.warn("Could not fetch vendor details:", vendorError.message);
        vendorDetails = {
          id: vendorId,
          storeName: "Vendor Store",
        };
      }

      // Generate unique ID for the product
      const productId = ID.unique();
      const sku = generateSKU();

      // 1. Create product in VENDOR'S collection
      const vendorProductPayload = {
        vendorId,
        name: name.trim(),
        description: description?.trim() || "",
        price: parseFloat(price),
        category: categoryId,
        tags: Array.isArray(tags)
          ? tags
          : tags
            ? tags.split(",").map((tag) => tag.trim())
            : [],
        inventory: parseInt(inventory) || 0,
        attributes: JSON.stringify(parsedAttributes),
        sku: sku,
        isActive: statusFields.isActive,
        isFeatured: false,
        rating: 0,
        reviewCount: 0,
        status: statusFields.status,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (primaryImage) {
        vendorProductPayload.image = primaryImage;
      }

      if (normalizedImages.length > 0) {
        vendorProductPayload.images = normalizedImages;
      }

      const vendorProduct = await db.createDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        vendorProductPayload,
      );

      const MAIN_VENDOR_COLLECTION_ID = env.MAIN_VENDORS_COLLECTION_ID; // Define this in your env or here

      try {
        // Check if vendor exists in main database
        await db.getDocument(
          env.APPWRITE_DATABASE_ID,
          MAIN_VENDOR_COLLECTION_ID,
          vendorId,
        );
        console.log(`✅ Vendor ${vendorId} already exists in main database`);
      } catch (error) {
        // Vendor doesn't exist, create it
        try {
          await db.createDocument(
            env.APPWRITE_DATABASE_ID,
            MAIN_VENDOR_COLLECTION_ID,
            vendorId, // Use same ID for consistency
            {
              originalVendorId: vendorId,
              name: vendorDetails.name,
              storeName: vendorDetails.storeName,
              email: vendorDetails.email,
              phone: vendorDetails.phone,
              profilePicture: vendorDetails.profilePicture,
              rating: vendorDetails.rating,
              totalSales: vendorDetails.totalSales,
              status: vendorDetails.status,
              syncedAt: new Date().toISOString(),
              // Add any other fields from your main vendor schema
            },
          );
          console.log(
            `✅ Vendor synced to main database: ${vendorDetails.storeName}`,
          );
        } catch (syncError) {
          console.error(
            "❌ Failed to sync vendor to main database:",
            syncError.message,
          );
          // Continue anyway - you might want to handle this differently
        }
      }

      // If the main product collection is not configured, record that and skip main creation
      let mainProduct = null;
      let mainSyncInfo = null;

      if (!env.APPWRITE_DATABASE_ID || !env.APPWRITE_PRODUCT_COLLECTION_ID) {
        const reason = "APPWRITE_PRODUCT_COLLECTION_ID not configured - skipping main store creation";
        console.warn("⚠️", reason);
        console.warn("⚠️ env.APPWRITE_DATABASE_ID:", env.APPWRITE_DATABASE_ID);
        console.warn("⚠️ env.APPWRITE_PRODUCT_COLLECTION_ID:", env.APPWRITE_PRODUCT_COLLECTION_ID);

        mainSyncInfo = {
          success: false,
          reason,
          source: "vendor-create",
          timestamp: new Date().toISOString(),
        };

        try {
          const notConfiguredData = { mainSync: mainSyncInfo };

          console.log("[NOT CONFIGURED] Writing mainSync to vendor product:", JSON.stringify(notConfiguredData, null, 2));

          await db.updateDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_PRODUCTS_COLLECTION_ID,
            productId,
            notConfiguredData,
          );

          console.log("[NOT CONFIGURED] Successfully wrote mainSync info");
        } catch (uErr) {
          console.warn("⚠️ Failed to update vendor product with mainSync info:", uErr.message);
        }
      }

      // 2. ALSO create product in MAIN WEBSITE collection (with different schema)
      try {
        // If product collection not configured, don't attempt creation
        if (!env.APPWRITE_DATABASE_ID || !env.APPWRITE_PRODUCT_COLLECTION_ID) {
          throw new Error("Product collection not configured");
        }
        // Build the main product document with status determined by publishing policy
        const mainProductData = {
          // Core fields (must match admin.js addProduct schema)
          productName: name.trim(),
          type: type || "physical",
          description: description?.trim() || "",
          price: parseFloat(price),
          brand: brand || vendorDetails.storeName,
          details: details || description?.trim() || "",
          currency: currency || "USD",
          category: categoryId,
          categoryId: [categoryId],
          subcategoryId: subcategoryId || "",
          specifications: typeof parsedAttributes === 'object' 
            ? JSON.stringify(parsedAttributes) 
            : (parsedAttributes || ''),
          stock: parseInt(inventory) || 0,
          sku: `VENDOR-${productId.slice(0, 8)}`,
          
          // Status determined by publishing policy (live or pending)
          isActive: statusFields.isActive,
          isFeatured: false,
          isApproved: statusFields.isApproved,
          status: statusFields.status,
          publishedAt: new Date().toISOString(),

          // Vendor info
          vendorId: vendorId,
          vendorName: vendorDetails.storeName,
        };

        if (primaryImage) {
          mainProductData.image = primaryImage;
        }

        if (normalizedImages.length > 0) {
          mainProductData.images = normalizedImages;
        }

        // Use instrumentedDb for observability and consistency with admin controllers
        mainProduct = await instrumentedDb.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_PRODUCT_COLLECTION_ID,
          productId,
          mainProductData,
        );

        // Phase 2: Update with optional metadata fields (fails individually if schema doesn't have them)
        const optionalUpdates = {
          vendorEmail: vendorDetails.email,
          vendorPhone: vendorDetails.phone || "",
          vendorRating: vendorDetails.rating || 0,
          vendorProfilePicture: vendorDetails.profilePicture || "",
          slug: name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, ""),
          weight: 0,
          dimensions: [],
          rating: 0,
          reviewCount: 0,
          reviews: [],
          salesCount: 0,
          views: 0,
          submittedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          source: "vendor",
          vendorProductId: productId,
        };

        try {
          await instrumentedDb.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            productId,
            optionalUpdates,
          );
        } catch (updateErr) {
          console.warn("⚠️ Optional fields update failed (non-critical):", updateErr.message);
        }
        mainSyncInfo = {
          success: true,
          reason: "Product created in main store",
          source: "vendor-create",
          productId: mainProduct.$id,
          status: statusFields.status,
          timestamp: new Date().toISOString(),
        };

        console.log(`✅ Product added to main collection (status: ${statusFields.status})`);

        try {
          // Get all admin users (or specific admin IDs)
          const admins = await instrumentedDb.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_ADMIN_COLLECTION_ID,
            [Query.equal("role", "admin"), Query.limit(10)],
          );

          if (requiresApproval) {
            // ── APPROVAL REQUIRED: Send pending-approval notifications ──
            for (const admin of admins.documents) {
              await CreateProductApprovalNotification({
                message: `New product submission: "${name}" by ${vendorDetails.storeName}`,
                type: "product_submission",
                username: admin.name || "Admin",
                email: admin.email,
                userId: admin.$id,
                metadata: JSON.stringify({
                  productId,
                  productName: name,
                  vendorId,
                  vendorName: vendorDetails.storeName,
                  vendorEmail: vendorDetails.email,
                  price: parseFloat(price),
                  category: categoryId,
                  image: primaryImage,
                  submittedAt: new Date().toISOString(),
                  actionUrl: `/admin/products/pending/${productId}`,
                }),
              });
            }

            await CreateProductApprovalNotification({
              message: `Your product "${name}" has been submitted for admin approval`,
              type: "product_submitted",
              username: vendorDetails.name,
              email: vendorDetails.email,
              userId: vendorId,
              metadata: JSON.stringify({
                productId,
                productName: name,
                status: "pending",
                submittedAt: new Date().toISOString(),
              }),
            });

            // Appwrite email/SMS for approval
            setImmediate(async () => {
              try {
                for (const admin of admins.documents) {
                  if (admin.email) {
                    await sendAppwriteEmail({
                      userId: admin.$id,
                      email: admin.email,
                      subject: `⚠️ New Product Pending Approval — ${name}`,
                      content: `<h2>New Product Submission</h2>
                        <p>A vendor has submitted a new product for approval:</p>
                        <ul>
                          <li><strong>Product:</strong> ${name}</li>
                          <li><strong>Vendor:</strong> ${vendorDetails.storeName}</li>
                          <li><strong>Price:</strong> $${parseFloat(price)}</li>
                          <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                        <p><a href="${env.FRONTEND_URL || "https://admin.nileflowafrica.com"}/admin/products/pending/${productId}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Review Product</a></p>`,
                    });
                  }
                  if (admin.phone) {
                    await sendAppwriteSms({
                      userId: admin.$id,
                      phone: admin.phone,
                      content: `NileFlow: New product "${name}" submitted by ${vendorDetails.storeName} ($${parseFloat(price)}). Review it now on the admin panel.`,
                    });
                  }
                }
              } catch (appwriteMsgErr) {
                console.warn("[AppwriteMessaging] Approval notification error:", appwriteMsgErr.message);
              }
            });
          } else {
            // ── NO APPROVAL REQUIRED: Send informational "published" notifications ──
            const publishedAt = new Date().toISOString();
            
            for (const admin of admins.documents) {
              await CreateProductPublishedNotification({
                message: `🆕 New product published: "${name}" by ${vendorDetails.storeName} — $${parseFloat(price)}`,
                type: "product_published",
                username: admin.name || "Admin",
                email: admin.email,
                userId: admin.$id,
                metadata: JSON.stringify({
                  productId,
                  productName: name,
                  vendorId,
                  vendorName: vendorDetails.storeName,
                  vendorEmail: vendorDetails.email,
                  price: parseFloat(price),
                  category: categoryId,
                  image: primaryImage,
                  publishedAt,
                  status: "live",
                  actionUrl: `/admin/products/${productId}`,
                }),
              });
            }

            // Notify vendor their product is live
            await CreateProductPublishedNotification({
              message: `✅ Your product "${name}" is now live and visible to customers!`,
              type: "product_published",
              username: vendorDetails.name,
              email: vendorDetails.email,
              userId: vendorId,
              metadata: JSON.stringify({
                productId,
                productName: name,
                status: "live",
                publishedAt,
                viewUrl: `/products/${productId}`,
              }),
            });

            // Appwrite email/SMS for informational notification
            setImmediate(async () => {
              try {
                for (const admin of admins.documents) {
                  if (admin.email) {
                    await sendAppwriteEmail({
                      userId: admin.$id,
                      email: admin.email,
                      subject: `🆕 New Product Published — ${name}`,
                      content: `<h2>New Product Published</h2>
                        <p>A vendor has published a new product:</p>
                        <ul>
                          <li><strong>Product:</strong> ${name}</li>
                          <li><strong>Vendor:</strong> ${vendorDetails.storeName}</li>
                          <li><strong>Price:</strong> $${parseFloat(price)}</li>
                          <li><strong>Status:</strong> Live</li>
                          <li><strong>Published:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                        <p>No approval action required. Review if necessary.</p>
                        <p><a href="${env.FRONTEND_URL || "https://admin.nileflowafrica.com"}/admin/products/${productId}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Product</a></p>`,
                    });
                  }
                  if (admin.phone) {
                    await sendAppwriteSms({
                      userId: admin.$id,
                      phone: admin.phone,
                      content: `NileFlow: New product "${name}" published by ${vendorDetails.storeName} ($${parseFloat(price)}). View it on the admin panel.`,
                    });
                  }
                }
              } catch (appwriteMsgErr) {
                console.warn("[AppwriteMessaging] Published notification error:", appwriteMsgErr.message);
              }
            });
          }

          console.log(`📢 ${requiresApproval ? "Approval" : "Published"} notifications dispatched`);
        } catch (notificationError) {
          console.error(
            "Notification error (product still saved):",
            notificationError,
          );
        }
      } catch (mainProductError) {
        console.error("❌ Failed to add product to main collection:", mainProductError);
        // Log the specific error details when available
        const errMsg = (mainProductError && mainProductError.message) || String(mainProductError);
        console.error("Main product error message:", errMsg);
        console.error("Main product error details:", {
          code: mainProductError?.code,
          response: mainProductError?.response?.data,
          stack: mainProductError?.stack?.split('\n').slice(0, 5).join('\n'),
        });

        mainSyncInfo = {
          success: false,
          error: errMsg,
          details:
            mainProductError && mainProductError.response
              ? JSON.stringify(mainProductError.response.data || mainProductError.response, null, 2)
              : (mainProductError?.toString && mainProductError.toString()),
          source: "vendor-create",
          timestamp: new Date().toISOString(),
        };

        // Persist sync failure into the vendor product so it's visible in vendor dashboard/logs
        try {
          const syncFailureData = { mainSync: mainSyncInfo };

          console.log("[MAIN SYNC FAILURE] Updating vendor product with mainSync:", JSON.stringify(syncFailureData, null, 2));

          await db.updateDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_PRODUCTS_COLLECTION_ID,
            productId,
            syncFailureData,
          );

          console.log("[MAIN SYNC FAILURE] Successfully persisted mainSync info to vendor product");
        } catch (uErr) {
          console.warn("⚠️ Failed to write mainSync info to vendor product:", uErr.message);
        }
        // Don't fail the whole request, but log for manual fix
        // You might want to implement a retry queue here
      }

      // Try to fetch latest vendor product (including any mainSync info)
      let freshVendorProduct = vendorProduct;
      try {
        freshVendorProduct = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_PRODUCTS_COLLECTION_ID,
          productId,
        );
        console.log("[FRESH PRODUCT FETCH] Successfully fetched vendor product after create");
        console.log("[FRESH PRODUCT FETCH] mainSync field present?:", !!freshVendorProduct?.mainSync);
        console.log("[FRESH PRODUCT FETCH] mainSync value:", freshVendorProduct?.mainSync);
      } catch (fetchErr) {
        console.warn("⚠️ Failed to fetch updated vendor product for response:", fetchErr.message);
        console.warn("⚠️ Will return original product from creation");
      }

      // Extract mainSync info if present (will be set if main product creation failed)
      const persistedMainSyncInfo = freshVendorProduct?.mainSync || null;
      const effectiveMainSyncInfo = mainSyncInfo || persistedMainSyncInfo || {
        success: false,
        reason: "Main store sync not completed",
        source: "vendor-create",
        timestamp: new Date().toISOString(),
      };

      console.log("[RESPONSE BUILD] addedToMainStore:", !!mainProduct);
      console.log("[RESPONSE BUILD] mainSyncInfo:", effectiveMainSyncInfo);
      console.log("[RESPONSE BUILD] APPWRITE_PRODUCT_COLLECTION_ID configured:", !!env.APPWRITE_PRODUCT_COLLECTION_ID);
      
      // Submit the product URL to IndexNow (Bing/Yandex) for immediate indexing
      if (!requiresApproval && mainProduct) {
        setImmediate(async () => {
          try {
            await submitProductToIndexNow(productId);
            console.log(`[IndexNow] Submitted product ${productId} for indexing`);
          } catch (indexNowErr) {
            console.warn("[IndexNow] Submission failed (non-critical):", indexNowErr.message);
          }
        });
      }

      // Build summary based on current publishing policy
      const isLive = !requiresApproval;
      let syncSummary = "";
      if (mainProduct) {
        if (isLive) {
          syncSummary = `✅ Product published and live on the store!`;
        } else {
          syncSummary = "✅ Product submitted for admin approval.";
        }
      } else if (effectiveMainSyncInfo) {
        syncSummary = `⚠️ Main store sync issue: ${effectiveMainSyncInfo.reason || effectiveMainSyncInfo.error || "Unknown error"}`;
      } else {
        syncSummary = "⚠️ Main store sync status unknown - check backend logs";
      }

      const displayStatus = isLive ? "live" : "pending_approval";
      const displayMessage = isLive
        ? "Product created successfully and is now live!"
        : "Product created successfully and submitted for admin approval";

      const responseProduct = sanitizeProductForResponse(freshVendorProduct);

      res.status(201).json({
        success: true,
        message: displayMessage,
        status: displayStatus,
        isLive,
        syncSummary,
        data: {
          product: responseProduct,
          addedToMainStore: !!mainProduct,
          mainProductId: mainProduct?.$id,
          mainSync: effectiveMainSyncInfo,
        },
      });
    } catch (error) {
      console.error("❌ CREATE PRODUCT ERROR:", error.message);
      console.error("Full error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create product: " + error.message,
      });
    }
  },

  async syncVendorToMainDatabase(vendorId) {
    try {
      // Get vendor from vendor database
      const vendor = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId,
      );

      // Update or create in main database
      try {
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.MAIN_VENDORS_COLLECTION_ID,
          vendorId,
          {
            name: vendor.name,
            storeName: vendor.storeName,
            email: vendor.email,
            phone: vendor.phone || "",
            profilePicture: vendor.profilePicture || "",
            rating: vendor.rating || 0,
            totalSales: vendor.totalSales || 0,
            status: vendor.status || "active",
            syncedAt: new Date().toISOString(),
          },
        );
        console.log(`✅ Vendor ${vendorId} updated in main database`);
      } catch (updateError) {
        // If update fails, try create
        if (updateError.code === 404) {
          await db.createDocument(
            env.APPWRITE_DATABASE_ID,
            env.MAIN_VENDORS_COLLECTION_ID,
            vendorId,
            {
              originalVendorId: vendorId,
              name: vendor.name,
              storeName: vendor.storeName,
              email: vendor.email,
              phone: vendor.phone || "",
              profilePicture: vendor.profilePicture || "",
              rating: vendor.rating || 0,
              totalSales: vendor.totalSales || 0,
              status: vendor.status || "active",

              syncedAt: new Date().toISOString(),
            },
          );
          console.log(`✅ Vendor ${vendorId} created in main database`);
        } else {
          throw updateError;
        }
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to sync vendor:", error.message);
      return false;
    }
  },

  // Get Vendor Products
  async getVendorProducts(req, res) {
    try {
      const vendorId = req.user.userId; // This should be set by your auth middleware
      /* console.log("🔥 getVendorProducts hit, vendorId:", req.vendorId); */

      if (!vendorId)
        return res
          .status(400)
          .json({ success: false, error: "Vendor not identified" });

      const { page = 1, limit = 10, category, search } = req.query;

      const queries = [Query.equal("vendorId", vendorId)];

      if (category) queries.push(Query.equal("category", category));
      if (search) queries.push(Query.search("name", search));

      const products = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        [
          ...queries,
          Query.orderDesc("createdAt"),
          Query.limit(parseInt(limit)),
          Query.offset((parseInt(page) - 1) * parseInt(limit)),
        ],
      );

      /* console.log("✅ Vendor products fetched:", products.total); */

      res.json({
        success: true,
        data: {
          products: products.documents,
          total: products.total,
          page: parseInt(page),
          totalPages: Math.ceil(products.total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get vendor products error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch products" });
    }
  },

  // Get Single Product
  async getProduct(req, res) {
    try {
      const { productId } = req.params;
      const vendorId = req.user.userId; // CHANGED HERE

      const product = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
      );

      // Verify product belongs to vendor
      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      res.json({
        success: true,
        data: { product },
      });
    } catch (error) {
      console.error("Get product error:", error);
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }
      res.status(500).json({
        success: false,
        error: "Failed to fetch product",
      });
    }
  },

  // Update Product
  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const vendorId = req.user.userId; // CHANGED HERE
      const updates = req.body;

      // Verify product ownership
      const product = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
      );

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      const updatedProduct = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      );

      res.json({
        success: true,
        message: "Product updated successfully",
        data: { product: updatedProduct },
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update product",
      });
    }
  },

  // Delete Product
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      const vendorId = req.user.userId; // CHANGED HERE

      // Verify product ownership
      const product = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
      );

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      await db.deleteDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
      );

      // Also remove the mirrored product from the main website collection.
      if (env.APPWRITE_DATABASE_ID && env.APPWRITE_PRODUCT_COLLECTION_ID) {
        try {
          await instrumentedDb.deleteDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            productId,
          );
        } catch (mainDeleteError) {
          if (mainDeleteError?.code !== 404) {
            console.warn(
              "⚠️ Failed to delete mirrored main product by ID, trying vendorProductId fallback:",
              mainDeleteError.message,
            );
          }

          try {
            const matchedProducts = await instrumentedDb.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_PRODUCT_COLLECTION_ID,
              [Query.equal("vendorProductId", productId), Query.limit(1)],
            );

            const mirroredProduct = matchedProducts?.documents?.[0];
            if (mirroredProduct?.$id) {
              await instrumentedDb.deleteDocument(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_PRODUCT_COLLECTION_ID,
                mirroredProduct.$id,
              );
            }
          } catch (fallbackError) {
            if (fallbackError?.code !== 404) {
              console.warn("⚠️ Failed to delete mirrored main product via fallback:", fallbackError.message);
            }
          }
        }
      }

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete product",
      });
    }
  },

  // productController.js - Add this new method
  async uploadDirect(req, res) {
    try {
      const vendorId = req.user.userId; // CHANGED HERE
      const productId = req.body.productId;

      console.log("📸 Direct upload request:", {
        vendorId,
        productId,
        file: req.file ? req.file.originalname : "No file",
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: "Product ID is required",
        });
      }

      // Verify product ownership
      let product;
      try {
        product = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_PRODUCTS_COLLECTION_ID,
          productId,
        );
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      // Upload to Appwrite Storage
      console.log(
        "Uploading file to Appwrite:",
        req.file.originalname,
        req.file.size,
      );

      const image = await storage.createFile(
        env.APPWRITE_STORAGE_ID || "product-images",
        ID.unique(),
        new File([req.file.buffer], req.file.originalname),
      );

      const directImageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID || "product-images"}/files/${image.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;
      
      // Proxy images through backend to avoid CORS/timeout issues
      const imageUrl = `/api/image-proxy?url=${encodeURIComponent(directImageUrl)}`;

      const uploadedImage = {
        id: image.$id,
        url: imageUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      };

      // Update vendor product with new image (stores full object for vendor dashboard)
      const updatedProduct = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          images: [...(product.images || []), uploadedImage],
          updatedAt: new Date().toISOString(),
        },
      );

      // Also sync image URL to the main products collection so Explore/mobile can see it
      try {
        const mainProduct = await db.getDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_PRODUCT_COLLECTION_ID,
          productId,
        );
        const existingUrls = (mainProduct.images || []).filter(
          (u) => typeof u === "string" && !u.includes("image-proxy"),
        );
        if (!existingUrls.includes(imageUrl)) {
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            productId,
            { images: [...existingUrls, imageUrl] },
          );
        }
      } catch (syncErr) {
        // Non-fatal — vendor upload succeeds even if main collection sync fails
        console.warn(
          "⚠️  Could not sync image to main collection:",
          syncErr.message,
        );
      }

      console.log("✅ Image uploaded successfully:", imageUrl);

      const responseProduct = sanitizeProductForResponse(updatedProduct);

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          image: uploadedImage,
          product: responseProduct,
        },
      });
    } catch (error) {
      console.error("Direct upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload image: " + error.message,
      });
    }
  },

  // Add this to your productController.js
  async uploadBatch(req, res) {
    try {
      const vendorId = req.user.userId; // CHANGED HERE
      const { productId, images } = req.body; // images: array of { imageData, filename }

      console.log("📸 Batch upload request:", {
        vendorId,
        productId,
        imageCount: images ? images.length : 0,
      });

      if (!productId || !images || !Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          error: "Product ID and images array are required",
        });
      }

      // Verify product ownership
      let product;
      try {
        product = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_PRODUCTS_COLLECTION_ID,
          productId,
        );
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      const uploadedImages = [];

      // Upload each image
      for (const img of images) {
        try {
          const buffer = Buffer.from(img.imageData.split(",")[1], "base64");

          const image = await storage.createFile(
            env.APPWRITE_STORAGE_ID || "product-images",
            ID.unique(),
            new File([buffer], img.filename || "image.jpg"),
          );

          const directImageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID || "product-images"}/files/${image.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

          // Proxy images through backend to avoid CORS/timeout issues
          const imageUrl = `/api/image-proxy?url=${encodeURIComponent(directImageUrl)}`;

          uploadedImages.push({
            id: image.$id,
            url: imageUrl,
            filename: img.filename || "image.jpg",
            size: buffer.length,
            mimetype: "image/jpeg",
          });
        } catch (uploadError) {
          console.error("Error uploading image in batch:", uploadError);
          // Continue with other images
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload any images",
        });
      }

      // Update product with all new images
      const updatedProduct = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          images: [...(product.images || []), ...uploadedImages],
          updatedAt: new Date().toISOString(),
        },
      );

      res.json({
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        data: {
          images: uploadedImages,
          product: updatedProduct,
        },
      });
    } catch (error) {
      console.error("Batch upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload images: " + error.message,
      });
    }
  },

  async uploadProductImage(req, res) {
    try {
      const { base64, fileName } = req.body;

      if (!base64 || !fileName) {
        return res.status(400).json({
          success: false,
          message: "base64 and fileName are required",
        });
      }

      // Validate base64
      const matches = base64.match(/^data:(.*);base64,(.*)$/);

      if (!matches) {
        return res.status(400).json({
          success: false,
          message: "Invalid base64 format",
        });
      }

      const mimeType = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, "base64");

      const file = await storage.createFile(
        env.APPWRITE_STORAGE_ID || "product-images",
        ID.unique(),
        new File([buffer], fileName),
      );

      const directImageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID || "product-images"}/files/${file.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

      // Proxy images through backend to avoid CORS/timeout issues
      const imageUrl = `/api/image-proxy?url=${encodeURIComponent(directImageUrl)}`;

      return res.status(201).json({
        success: true,
        fileId: file.$id,
        imageUrl,
      });
    } catch (error) {
      console.error("Image Upload Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error.message,
      });
    }
  },
};

module.exports = productController;
