"use strict";

const { ID, Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

function collectionId() {
  return env.TEAM_MEMBERS_COLLECTION_ID;
}

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return false;
  }
  return true;
}

function parseSocials(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(doc) {
  return {
    id: doc.$id,
    name: doc.name || "",
    role: doc.role || "",
    bio: doc.bio || "",
    image: doc.image || "",
    email: doc.email || "",
    phone: doc.phone || "",
    socials: parseSocials(doc.socials),
    order: Number(doc.order || 0),
    isActive: doc.isActive !== false,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
  };
}

function buildPayload(body, partial = false) {
  const payload = {};
  const stringFields = ["name", "role", "bio", "image", "email", "phone"];
  for (const field of stringFields) {
    if (!partial || body[field] !== undefined) payload[field] = String(body[field] || "");
  }
  if (!partial || body.socials !== undefined) payload.socials = JSON.stringify(parseSocials(body.socials));
  if (!partial || body.order !== undefined) payload.order = Number(body.order || 0);
  if (!partial || body.isActive !== undefined) payload.isActive = body.isActive !== false && body.isActive !== "false";
  return payload;
}

async function getTeamMembers(req, res) {
  if (!collectionId()) return res.json({ success: true, data: [] });

  try {
    const result = await db.listDocuments(env.APPWRITE_DATABASE_ID, collectionId(), [
      Query.equal("isActive", true),
      Query.orderAsc("order"),
      Query.limit(100),
    ]);
    return res.json({ success: true, data: result.documents.map(normalize) });
  } catch (error) {
    console.error("Failed to fetch team members:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch team members" });
  }
}

async function createTeamMember(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!collectionId()) return res.status(503).json({ success: false, message: "Team members collection is not configured" });

  try {
    const doc = await db.createDocument(env.APPWRITE_DATABASE_ID, collectionId(), ID.unique(), buildPayload(req.body));
    return res.status(201).json({ success: true, data: normalize(doc) });
  } catch (error) {
    console.error("Failed to create team member:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create team member" });
  }
}

async function updateTeamMember(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!collectionId()) return res.status(503).json({ success: false, message: "Team members collection is not configured" });

  try {
    const doc = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      collectionId(),
      req.params.teamMemberId,
      buildPayload(req.body, true),
    );
    return res.json({ success: true, data: normalize(doc) });
  } catch (error) {
    console.error("Failed to update team member:", error.message);
    return res.status(error.code === 404 ? 404 : 500).json({ success: false, message: "Failed to update team member" });
  }
}

async function deleteTeamMember(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!collectionId()) return res.status(503).json({ success: false, message: "Team members collection is not configured" });

  try {
    await db.deleteDocument(env.APPWRITE_DATABASE_ID, collectionId(), req.params.teamMemberId);
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team member:", error.message);
    return res.status(error.code === 404 ? 404 : 500).json({ success: false, message: "Failed to delete team member" });
  }
}

module.exports = { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember };
