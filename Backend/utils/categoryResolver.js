/**
 * Resolve a category ID to its name (with in-memory caching).
 */
const { Query } = require("node-appwrite");

let _categoryCache = null;
let _categoryCacheTime = 0;
const CATEGORY_CACHE_TTL = 60 * 1000; // 1 minute

async function resolveCategoryName(categoryId, instrumentedDb, env) {
  if (!categoryId) return categoryId;
  // Return if it's already a string name (not a 24-char hex ID)
  if (typeof categoryId === "string" && categoryId.length !== 24) return categoryId;

  const now = Date.now();
  if (_categoryCache && now - _categoryCacheTime < CATEGORY_CACHE_TTL) {
    return _categoryCache[categoryId] || categoryId;
  }

  try {
    const { documents } = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      [Query.limit(200)],
    );
    _categoryCache = {};
    documents.forEach((cat) => {
      _categoryCache[cat.$id] = cat.name || cat.$id;
    });
    _categoryCacheTime = now;
  } catch (err) {
    console.error("[CategoryResolver] Failed to load categories:", err.message);
    return categoryId;
  }

  return _categoryCache[categoryId] || categoryId;
}

module.exports = { resolveCategoryName };
