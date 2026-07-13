// controllers/AdminControllers/subscriberController.js
const { Query } = require('node-appwrite');
const { instrumentedDb } = require('../../services/appwriteService');
const { env } = require('../../src/env');

const subscriberController = {
  /**
   * GET /api/admin/newsletter/subscribers
   * List all newsletter subscribers with search and pagination
   */
  async listSubscribers(req, res) {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(limitNum),
        Query.offset(offset),
      ];

      let documents;
      let total;

      if (search) {
        const response = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NEWSLETTER_COLLECTION_ID,
          [Query.search('email', search), ...queries.filter(q => !String(q).includes('offset'))],
        );
        documents = response.documents;
        total = response.total;
      } else {
        const response = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NEWSLETTER_COLLECTION_ID,
          queries,
        );
        documents = response.documents;
        total = response.total;
      }

      res.json({
        success: true,
        data: {
          subscribers: documents,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('[SubscriberController] Error listing subscribers:', error);
      res.status(500).json({ success: false, error: 'Failed to list subscribers.' });
    }
  },

  /**
   * DELETE /api/admin/newsletter/subscribers/:id
   * Remove a subscriber
   */
  async removeSubscriber(req, res) {
    try {
      const { id } = req.params;
      await instrumentedDb.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_NEWSLETTER_COLLECTION_ID,
        id,
      );
      res.json({ success: true, message: 'Subscriber removed.' });
    } catch (error) {
      console.error('[SubscriberController] Error removing subscriber:', error);
      res.status(500).json({ success: false, error: 'Failed to remove subscriber.' });
    }
  },

  /**
   * GET /api/admin/newsletter/subscribers/export
   * Export all subscribers as CSV
   */
  async exportSubscribers(req, res) {
    try {
      const allSubscribers = [];
      let cursor = null;

      while (true) {
        const queries = [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])];
        const batch = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NEWSLETTER_COLLECTION_ID,
          queries,
        );
        allSubscribers.push(...batch.documents);
        if (batch.documents.length < 100) break;
        cursor = batch.documents[batch.documents.length - 1].$id;
      }

      const headers = 'Email,Name,Subscribed,Created At\n';
      const rows = allSubscribers.map(s =>
        `"${s.email || ''}","${s.name || ''}","${s.subscribed !== false}","${s.$createdAt || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="nileflow-subscribers.csv"');
      res.send(headers + rows);
    } catch (error) {
      console.error('[SubscriberController] Error exporting:', error);
      res.status(500).json({ success: false, error: 'Failed to export.' });
    }
  },
};

module.exports = subscriberController;
