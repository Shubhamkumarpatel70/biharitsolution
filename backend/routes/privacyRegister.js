const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const PrivacyRegisterEntry = require("../models/PrivacyRegisterEntry");
const User = require("../models/User");

const router = express.Router();
const TYPES = ["processor", "incident"];
const FIELDS = ["title", "organisation", "purpose", "dataCategories", "systems", "contact", "agreementStatus", "retention", "status", "severity", "detectedAt", "affectedCount", "containment", "regulatorNotifiedAt", "usersNotifiedAt", "resolution", "notes"];
const LIMITS = { title: 180, organisation: 180, purpose: 2000, dataCategories: 2000, systems: 1000, contact: 180, retention: 1000, containment: 3000, resolution: 3000, notes: 3000 };

router.use(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required." });
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Authentication is not configured." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("role").lean();
    if (!user || !["admin", "coadmin"].includes(user.role)) return res.status(403).json({ message: "Admin access required." });
    req.actorId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid session." });
  }
});

function cleanPayload(body, creating) {
  const result = {};
  for (const field of FIELDS) {
    if (body[field] === undefined) continue;
    if (["detectedAt", "regulatorNotifiedAt", "usersNotifiedAt"].includes(field)) {
      result[field] = body[field] ? new Date(body[field]) : null;
      if (result[field] && Number.isNaN(result[field].getTime())) throw new Error("Invalid date for " + field);
    } else if (field === "affectedCount") {
      const value = Number(body[field] || 0);
      if (!Number.isInteger(value) || value < 0 || value > 100000000) throw new Error("Affected count must be a non-negative whole number.");
      result[field] = value;
    } else if (field === "agreementStatus") {
      if (!["not_reviewed", "under_review", "signed", "not_required"].includes(body[field])) throw new Error("Invalid agreement status.");
      result[field] = body[field];
    } else if (field === "status") {
      if (!["open", "investigating", "contained", "resolved", "closed"].includes(body[field])) throw new Error("Invalid status.");
      result[field] = body[field];
    } else if (field === "severity") {
      if (!["low", "medium", "high", "critical"].includes(body[field])) throw new Error("Invalid severity.");
      result[field] = body[field];
    } else {
      result[field] = String(body[field] ?? "").trim().slice(0, LIMITS[field] || 2000);
    }
  }
  if (creating && !result.title) throw new Error("A title is required.");
  return result;
}

router.get("/", async (req, res) => {
  try {
    const type = TYPES.includes(req.query.type) ? req.query.type : null;
    const filter = type ? { type } : {};
    const entries = await PrivacyRegisterEntry.find(filter).sort({ updatedAt: -1 }).limit(500).populate("createdBy updatedBy", "name email").lean();
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: "Could not load privacy registers." });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!TYPES.includes(req.body.type)) return res.status(400).json({ message: "Choose a valid register type." });
    const values = cleanPayload(req.body, true);
    const entry = await PrivacyRegisterEntry.create({ ...values, type: req.body.type, createdBy: req.actorId, updatedBy: req.actorId, auditHistory: [{ action: "created", actor: req.actorId }] });
    res.status(201).json({ message: "Privacy register entry created.", entry });
  } catch (error) {
    res.status(400).json({ message: error.message || "Could not create entry." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid entry id." });
    const values = cleanPayload(req.body, false);
    if (!Object.keys(values).length) return res.status(400).json({ message: "No changes supplied." });
    const entry = await PrivacyRegisterEntry.findByIdAndUpdate(req.params.id, { $set: { ...values, updatedBy: req.actorId }, $push: { auditHistory: { action: "updated", actor: req.actorId, occurredAt: new Date() } } }, { new: true, runValidators: true }).populate("createdBy updatedBy", "name email");
    if (!entry) return res.status(404).json({ message: "Entry not found." });
    res.json({ message: "Privacy register entry updated.", entry });
  } catch (error) {
    res.status(400).json({ message: error.message || "Could not update entry." });
  }
});

module.exports = router;
