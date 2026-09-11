/**
 * Banner Controller
 *
 * CRUD operations for promotional banners stored in Appwrite.
 * GET /api/v1/banners — public, returns all active banners sorted by order
 * POST /api/v1/banners — admin only, creates a banner
 * PATCH /api/v1/banners/:bannerId — admin only, updates a banner
 * DELETE /api/v1/banners/:bannerId — admin only, deletes a banner
 */

"use strict";

const { Query, ID } = require("node-appwrite");
const { InputFile } = require("node-appwrite/file");
const { db, storage } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const COLLECTION_ID = env.BANNER_COLLECTION_ID;
const BANNER_STORAGE_BUCKET = env.BANNER_STORAGE_BUCKET_ID;

/**
 * GET /api/v1/banners
 * Returns all active banners ordered by display order.
 * No auth required — public endpoint.
 */
async function getBanners(req, res) {
  try {
    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(20),
      ],
    );

    const banners = result.documents.map((doc) => {
      // Normalize any existing admin-mode URLs to public for frontend display
      let image = doc.image || null;
      if (image && image.includes("mode=admin")) {
        image = image.replace("mode=admin", "mode=public");
      }
      return {
        id: doc.$id,
        title: doc.title || "",
        subtitle: doc.subtitle || "",
        cta: doc.cta || "Learn more",
        ctaHref: doc.ctaHref || "#",
        image,
        gradient: doc.gradient || null,
        order: doc.order || 0,
        isActive: doc.isActive !== false,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
      };
    });

    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("Failed to fetch banners:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch banners." });
  }
}

/**
 * POST /api/v1/banners
 * Creates a new banner. Admin auth required.
 * Accepts form-data with optional image file plus JSON fields.
 */
async function createBanner(req, res) {
  try {
    const { title, subtitle, cta, ctaHref, gradient, order, isActive } = req.body;
    let imageUrl = null;

    // Upload image if provided
    if (req.file) {
      if (!BANNER_STORAGE_BUCKET) {
        return res.status(500).json({ success: false, error: "Banner storage bucket not configured." });
      }

      const fileId = ID.unique();
      const uploaded = await storage.createFile(
        BANNER_STORAGE_BUCKET,
        fileId,
        InputFile.fromBuffer(req.file.buffer, req.file.originalname),
      );

      imageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${BANNER_STORAGE_BUCKET}/files/${uploaded.$id}/view?project=${env.APPWRITE_PROJECT_ID}&mode=public`;
    }

    const doc = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        title: title || "",
        subtitle: subtitle || "",
        cta: cta || "Learn more",
        ctaHref: ctaHref || "#",
        image: imageUrl,
        gradient: gradient || null,
        order: parseInt(order, 10) || 0,
        isActive: isActive === "true",
      },
    );

    res.status(201).json({
      success: true,
      data: {
        id: doc.$id,
        title: doc.title,
        subtitle: doc.subtitle,
        cta: doc.cta,
        ctaHref: doc.ctaHref,
        image: doc.image,
        gradient: doc.gradient,
        order: doc.order,
        isActive: doc.isActive,
      },
    });
  } catch (error) {
    console.error("Failed to create banner:", error.message);
    res.status(500).json({ success: false, error: "Failed to create banner." });
  }
}

/**
 * PATCH /api/v1/banners/:bannerId
 * Updates an existing banner. Admin auth required.
 * Optional image upload replaces the current image.
 */
async function updateBanner(req, res) {
  try {
    const { bannerId } = req.params;
    const { title, subtitle, cta, ctaHref, gradient, order, isActive } = req.body;
    let updatePayload = {};

    if (title !== undefined) updatePayload.title = title;
    if (subtitle !== undefined) updatePayload.subtitle = subtitle;
    if (cta !== undefined) updatePayload.cta = cta;
    if (ctaHref !== undefined) updatePayload.ctaHref = ctaHref;
    if (gradient !== undefined) updatePayload.gradient = gradient;
    if (order !== undefined) updatePayload.order = parseInt(order, 10);
    if (isActive !== undefined) updatePayload.isActive = isActive === "true";

    // Replace image if new file uploaded
    if (req.file) {
      if (!BANNER_STORAGE_BUCKET) {
        return res.status(500).json({ success: false, error: "Banner storage bucket not configured." });
      }

      const fileId = ID.unique();
      const uploaded = await storage.createFile(
        BANNER_STORAGE_BUCKET,
        fileId,
        InputFile.fromBuffer(req.file.buffer, req.file.originalname),
      );

      updatePayload.image = `${env.APPWRITE_ENDPOINT}/storage/buckets/${BANNER_STORAGE_BUCKET}/files/${uploaded.$id}/view?project=${env.APPWRITE_PROJECT_ID}&mode=public`;
    }

    const doc = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      COLLECTION_ID,
      bannerId,
      updatePayload,
    );

    res.status(200).json({
      success: true,
      data: {
        id: doc.$id,
        title: doc.title,
        subtitle: doc.subtitle,
        cta: doc.cta,
        ctaHref: doc.ctaHref,
        image: doc.image,
        gradient: doc.gradient,
        order: doc.order,
        isActive: doc.isActive,
      },
    });
  } catch (error) {
    console.error("Failed to update banner:", error.message);
    res.status(500).json({ success: false, error: "Failed to update banner." });
  }
}

/**
 * DELETE /api/v1/banners/:bannerId
 * Deletes a banner. Admin auth required.
 */
async function deleteBanner(req, res) {
  try {
    const { bannerId } = req.params;
    await db.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      COLLECTION_ID,
      bannerId,
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to delete banner:", error.message);
    res.status(500).json({ success: false, error: "Failed to delete banner." });
  }
}

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
