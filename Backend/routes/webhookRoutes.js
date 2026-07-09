/**
 * Webhook Routes — Admin API for managing notification webhooks.
 *
 * Mount in index.js:
 *   const webhookRoutes = require('./routes/webhookRoutes');
 *   app.use('/api/notifications/webhooks', webhookRoutes);
 *
 * @module routes/webhookRoutes
 */

'use strict';

const { Router } = require('express');
const router = Router();
const authenticateToken = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/auth');
const { registerWebhook, listWebhooks, deleteWebhook } = require('../notifications/NotificationWebhook');

router.get('/', authenticateToken, adminOnly, async (req, res) => {
  const webhooks = await listWebhooks();
  res.json({ success: true, webhooks });
});

router.post('/', authenticateToken, adminOnly, async (req, res) => {
  const { name, url, events, secret } = req.body;
  if (!name || !url) return res.status(400).json({ success: false, message: 'Name and URL required' });
  const doc = await registerWebhook({ name, url, events, secret });
  res.status(201).json({ success: true, webhook: doc });
});

router.delete('/:webhookId', authenticateToken, adminOnly, async (req, res) => {
  await deleteWebhook(req.params.webhookId);
  res.json({ success: true });
});

module.exports = router;
