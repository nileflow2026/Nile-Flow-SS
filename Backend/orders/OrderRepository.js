/**
 * OrderRepository — Single abstraction over Appwrite for all order data access.
 *
 * Every query related to orders, cancellation requests, and archived orders
 * goes through this module. Controllers and services must never call
 * `instrumentedDb` directly for order operations.
 *
 * Benefits:
 * - Centralised pagination, filtering, and sorting
 * - Consistent field mapping (status vs orderStatus, amount vs totalAmount, etc.)
 * - Easily swappable to a different DB in the future
 *
 * @module orders/OrderRepository
 */

'use strict';

const { ID, Query, Permission, Role } = require('node-appwrite');
const { instrumentedDb } = require('../services/appwriteService');
const { env } = require('../src/env');
const { ORDER_STATUS } = require('./OrderTypes');

// ── Collection IDs (from env, with fallbacks for backward compatibility) ─────

const ORDERS_COL = () => env.APPWRITE_ORDERS_COLLECTION;
const CANCELLED_COL = () => env.APPWRITE_CANCELLED_ORDERS_COLLECTION_ID;
const CANCELLATION_REQ_COL = () => env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION_ID;
const DB = () => env.APPWRITE_DATABASE_ID;

// ── Shared fetch options ─────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * Parse and validate pagination params.
 */
function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build a query array from common filter parameters.
 * Handles both old-style (status) and new-style (orderStatus) field names.
 */
function buildQueries(filters = {}) {
  const q = [Query.orderDesc('$createdAt')];

  if (filters.status) {
    // Support filtering by either field name for backward compatibility
    q.push(Query.equal('orderStatus', filters.status));
  }

  if (filters.paymentStatus) {
    q.push(Query.equal('paymentStatus', filters.paymentStatus));
  }

  if (filters.paymentMethod) {
    q.push(Query.equal('paymentMethod', filters.paymentMethod));
  }

  if (filters.userId) {
    q.push(Query.equal('userId', filters.userId));
  }

  if (filters.dateFrom) {
    q.push(Query.greaterThanEqual('createdAt', new Date(filters.dateFrom).toISOString()));
  }

  if (filters.dateTo) {
    q.push(Query.lessThanEqual('createdAt', new Date(filters.dateTo).toISOString()));
  }

  return q;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Find a single order by its document ID.
 *
 * @param {string} orderId
 * @returns {Promise<object|null>}
 */
async function findById(orderId) {
  try {
    return await instrumentedDb.getDocument(DB(), ORDERS_COL(), orderId);
  } catch (err) {
    if (err.code === 404) return null;
    throw err;
  }
}

/**
 * Find an order by its human-readable order number (NF-2026-...).
 *
 * @param {string} orderNumber
 * @returns {Promise<object|null>}
 */
async function findByOrderNumber(orderNumber) {
  try {
    const result = await instrumentedDb.listDocuments(DB(), ORDERS_COL(), [
      Query.equal('orderNumber', orderNumber),
      Query.limit(1),
    ]);
    return result.documents.length > 0 ? result.documents[0] : null;
  } catch (err) {
    console.error('[OrderRepo] findByOrderNumber error:', err.message);
    return null;
  }
}

/**
 * Find a single order — tries document ID first, then orderNumber field.
 *
 * @param {string} identifier
 * @returns {Promise<object|null>}
 */
async function findByIdentifier(identifier) {
  // Try document ID
  const byId = await findById(identifier);
  if (byId) return byId;

  // Try order number
  return findByOrderNumber(identifier);
}

/**
 * List orders with optional filtering and pagination.
 *
 * @param {object} [options]
 * @param {string} [options.status]      — Filter by orderStatus
 * @param {string} [options.paymentMethod]
 * @param {string} [options.userId]
 * @param {string} [options.dateFrom]
 * @param {string} [options.dateTo]
 * @param {number} [options.page]
 * @param {number} [options.limit]
 * @returns {Promise<{orders: object[], total: number, page: number, limit: number, totalPages: number}>}
 */
async function list(options = {}) {
  const { page, limit, offset } = parsePagination(options);
  const queries = [
    ...buildQueries(options),
    Query.limit(limit),
    Query.offset(offset),
  ];

  const response = await instrumentedDb.listDocuments(DB(), ORDERS_COL(), queries);

  return {
    orders: response.documents,
    total: response.total,
    page,
    limit,
    totalPages: Math.ceil(response.total / limit),
  };
}

/**
 * List orders belonging to a specific user (ownership-based query).
 *
 * @param {string} userId
 * @param {object} [options]
 * @returns {Promise<{orders: object[], total: number}>}
 */
async function listByUser(userId, options = {}) {
  const { limit, offset } = parsePagination(options);
  const queries = [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
    Query.offset(offset),
  ];

  if (options.status) {
    queries.push(Query.equal('orderStatus', options.status));
  }

  const response = await instrumentedDb.listDocuments(DB(), ORDERS_COL(), queries);
  return { orders: response.documents, total: response.total };
}

/**
 * Create a new order document.
 *
 * @param {object} data — The order data (all fields already validated)
 * @param {string} userId — Owner of the order (for permissions)
 * @returns {Promise<object>} — The created document
 */
async function create(data, userId) {
  return instrumentedDb.createDocument(
    DB(),
    ORDERS_COL(),
    ID.unique(),
    data,
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
    ],
  );
}

/**
 * Update an order document.
 *
 * @param {string} orderId
 * @param {object} updates
 * @returns {Promise<object>}
 */
async function update(orderId, updates) {
  return instrumentedDb.updateDocument(DB(), ORDERS_COL(), orderId, updates);
}

// ── Cancellation Requests ────────────────────────────────────────────────────

/**
 * Create a cancellation request.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
async function createCancellationRequest(data) {
  return instrumentedDb.createDocument(
    DB(),
    CANCELLATION_REQ_COL(),
    ID.unique(),
    {
      ...data,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    },
  );
}

/**
 * List cancellation requests with pagination.
 */
async function listCancellationRequests(options = {}) {
  const { limit, offset } = parsePagination(options);
  const queries = [
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
    Query.offset(offset),
  ];
  if (options.status) queries.push(Query.equal('status', options.status));
  if (options.userId) queries.push(Query.equal('userId', options.userId));

  const response = await instrumentedDb.listDocuments(DB(), CANCELLATION_REQ_COL(), queries);
  return { requests: response.documents, total: response.total };
}

/**
 * Update a cancellation request.
 */
async function updateCancellationRequest(requestId, updates) {
  return instrumentedDb.updateDocument(DB(), CANCELLATION_REQ_COL(), requestId, updates);
}

// ── Archived / Cancelled Orders ──────────────────────────────────────────────

/**
 * Archive an order to the cancelled orders collection.
 */
async function archiveOrder(data) {
  if (!CANCELLED_COL()) {
    console.warn('[OrderRepo] Cancelled orders collection not configured, skipping archive');
    return null;
  }
  try {
    return await instrumentedDb.createDocument(DB(), CANCELLED_COL(), ID.unique(), {
      ...data,
      cancelledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[OrderRepo] Archive failed:', err.message);
    return null;
  }
}

/**
 * List archived orders.
 */
async function listArchived(options = {}) {
  const { page, limit, offset } = parsePagination(options);
  const queries = [Query.orderDesc('$createdAt'), Query.limit(limit), Query.offset(offset)];
  const response = await instrumentedDb.listDocuments(DB(), CANCELLED_COL(), queries);
  return {
    orders: response.documents,
    total: response.total,
    page,
    limit,
    totalPages: Math.ceil(response.total / limit),
  };
}

module.exports = {
  findById,
  findByOrderNumber,
  findByIdentifier,
  list,
  listByUser,
  create,
  update,
  createCancellationRequest,
  listCancellationRequests,
  updateCancellationRequest,
  archiveOrder,
  listArchived,
};
