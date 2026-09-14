// controllers/cartController.js

const { Query, ID } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");

/**
 * Add item to cart
 */
const { env } = require("../../src/env");
const {
  checkStockAvailability,
} = require("../AdminControllers/stockController");
const { getProductPrice } = require("../../utils/serverPricing");
const {
  enrichProductsWithCurrency,
  validateCurrencyCode,
} = require("../../utils/currencyConverter");
const { getAllRates } = require("../../services/exchangeRateService");

const validateCartStock = async (req, res) => {
  try {
    const { cart, userId } = req.body;

    if (!cart || !Array.isArray(cart) || !userId) {
      return res.status(400).json({
        isValid: false,
        error: "Invalid cart data",
      });
    }

    const stockCheck = checkStockAvailability(cart);

    res.json({
      isValid: stockCheck.isAvailable,
      ...stockCheck,
    });
  } catch (error) {
    console.error("Error validating cart stock:", error);
    res.status(500).json({
      isValid: false,
      error: error.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    // Use authenticated userId from middleware, not from request body
    const userId = req.user?.userId || req.body.userId;
    const { productId, productName, image, userName, variantSelection } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    // ZERO TRUST: Fetch authoritative price from product DB, never trust client
    const productData = await getProductPrice(productId);
    if (!productData) {
      return res.status(404).json({ error: "Product not found" });
    }
    const trustedPrice = productData.price;

    const normalizedVariantSelection = variantSelection || {};
    const variantKey = JSON.stringify(normalizedVariantSelection);

    // A product can have multiple cart lines when the selected variants differ.
    const existing = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("productId", productId),
      ],
    );

    const existingVariant = existing.documents.find((document) => {
      const storedVariant = document.variantSelection || "{}";
      return storedVariant === variantKey;
    });

    if (existingVariant) {
      return res.status(200).json({
        success: true,
        message: "Already in cart",
        item: existingVariant,
      });
    }

    const newItem = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        productId,
        userName,
        productName: productData.productName || productName,
        productImage: image ? encodeURI(image.trim()) : null,
        price: Math.round(Number(trustedPrice)),
        quantity: 1,
        variantSelection: variantKey,
        createdAt: new Date().toISOString(),
      },
    );

    res.status(201).json({
      success: true,
      item: {
        $id: newItem.$id, // ✅ ensure frontend always gets document id
        ...newItem,
      },
    });
  } catch (err) {
    console.error("AddToCart Error:", err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

/**
 * Fetch cart items
 */
const fetchCart = async (req, res) => {
  try {
    // Enforce ownership: use auth middleware userId, fall back to params for backward compat
    const userId = req.user?.userId || req.params.userId;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const response = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", userId)],
    );

    const targetCurrency = validateCurrencyCode(req.currency) || "KES";
    const rates = await getAllRates();
    const rate = rates[targetCurrency] ?? 1;
    const enriched = enrichProductsWithCurrency(
      response.documents,
      targetCurrency,
      rate,
    );

    res.status(200).json(enriched);
  } catch (err) {
    console.error("FetchCart Error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

/**
 * Update item quantity
 */
const updateQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params; // <-- productId instead of $id
    const { quantity, userId } = req.body;

    if (!cartItemId || !quantity || !userId) {
      return res.status(400).json({ error: "Missing data" });
    }

    const authenticatedUserId = req.user?.userId || userId;

    // Support both cart document IDs and legacy product IDs.
    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", authenticatedUserId)],
    );

    const matchingDocument = result.documents.find(
      (document) => document.$id === cartItemId || document.productId === cartItemId,
    );

    if (!matchingDocument) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const updated = await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      matchingDocument.$id,
      { quantity },
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("UpdateQuantity Error:", err);
    res.status(500).json({ error: "Failed to update quantity" });
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    // Support both authenticated (cookie) and unauthenticated (body) users
    const userId = req.user?.userId || req.body?.userId;

    if (!cartItemId) {
      return res.status(400).json({ error: "Missing cartItemId" });
    }

    // Ownership check: verify the item belongs to the user
    if (userId) {
      let doc;
      try {
        doc = await instrumentedDb.getDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CART_COLLECTION_ID,
          cartItemId,
        );
      } catch (err) {
        // Item already deleted or never existed — treat as success
        if (err.code === 404 || err.code === "not_found") {
          return res.status(200).json({ message: "Item removed successfully" });
        }
        throw err;
      }

      if (doc.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to remove this item" });
      }
    }

    await instrumentedDb.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      cartItemId,
    );

    res.status(200).json({ message: "Item removed successfully" });
  } catch (err) {
    console.error("RemoveFromCart Error:", err);
    const status = err?.code === 404 || err?.code === "not_found" ? 404 : 500;
    res.status(status).json({ error: err?.message || "Failed to remove from cart" });
  }
};

// controllers/cartController.js
const loadCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const response = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", userId)],
    );

    // Map into frontend-ready format
    const cartItems = response.documents.map((doc) => ({
      id: doc.$id,
      userId: doc.userId,
      productId: String(doc.productId),
      productName: doc.productName,
      productImage: doc.productImage,
      variantSelection: doc.variantSelection || "",
      date: new Date(doc.createdAt).toDateString(),
      quantity: doc.quantity,
      name: doc.name,
      price: doc.price ?? 0,
    }));

    const targetCurrency = validateCurrencyCode(req.currency) || "KES";
    const rates = await getAllRates();
    const rate = rates[targetCurrency] ?? 1;
    const enriched = enrichProductsWithCurrency(
      cartItems,
      targetCurrency,
      rate,
    );

    res.status(200).json(enriched);
  } catch (err) {
    console.error("LoadCart Error:", err);
    res.status(500).json({ error: "Failed to load cart" });
  }
};

// In your cartController.js
const clearCartAfterOrder = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get all cart items for this user
    const cartItems = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", userId)],
    );

    // Delete all items
    const deletePromises = cartItems.documents.map((item) =>
      instrumentedDb.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CART_COLLECTION_ID,
        item.$id,
      ),
    );

    await Promise.all(deletePromises);

    res.json({
      success: true,
      message: `Cleared ${cartItems.total} items from cart`,
      itemsCleared: cartItems.total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear cart",
    });
  }
};

module.exports = {
  validateCartStock,
  addToCart,
  fetchCart,
  removeFromCart,
  updateQuantity,
  clearCartAfterOrder,
  loadCart,
};
