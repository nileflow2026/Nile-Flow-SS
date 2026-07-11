/**
 * Notification Log Routes — Admin-only access to delivery audit logs.
 *
 * Mount in index.js:
 *   const notifLogRoutes = require('./routes/notificationLogRoutes');
 *   app.use('/api/notifications/logs', notifLogRoutes);
 *
 * @module routes/notificationLogRoutes
 */

'use strict';

const { Router } = require('express');
const router = Router();
const authenticateToken = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/auth');
const { query } = require('../notifications/NotificationLogger');

/**
 * GET /api/notifications/logs
 * Query delivery logs with pagination and filtering.
 */
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  const { page, limit, event, channel, status, recipientId } = req.query;
  const result = await query({ page, limit, event, channel, status, recipientId });
  return res.json({ success: true, ...result });
});

module.exports = router;
