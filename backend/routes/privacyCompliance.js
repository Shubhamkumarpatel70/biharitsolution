const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const PrivacyComplianceReview = require("../models/PrivacyComplianceReview");
const User = require("../models/User");

const router = express.Router();
const CHECKLIST = [
  ["data_inventory", "Personal data inventory", "Review data collected across registration, enquiries, projects, payments, support and careers."],
  ["purpose_and_minimisation", "Purpose and data minimisation", "Confirm each data field has a documented purpose and unnecessary collection is removed."],
  ["notice_and_transparency", "Privacy notice and transparency", "Check notices accurately explain purposes, categories, sharing, retention and grievance contact."],
  ["consent_and_withdrawal", "Consent and withdrawal", "Verify consent is specific, informed, unambiguous, recorded and as easy to withdraw as to give."],
  ["user_rights_requests", "Data Principal rights requests", "Review access, correction, erasure, nomination and grievance workflows and response records."],
  ["children_and_guardians", "Children and guardian safeguards", "Check age-related controls and verifiable parental consent processes where legally applicable."],
  ["security_and_access", "Security and access controls", "Review least-privilege access, MFA where available, secrets, encryption, backups and vulnerability fixes."],
  ["processor_contracts", "Data processor oversight", "Review hosting, database, email, payment and support processor contracts and instructions."],
  ["retention_and_erasure", "Retention and erasure", "Check retention schedule, deletion jobs, backups and documented legal holds."],
  ["breach_readiness", "Personal data breach readiness", "Review incident register, escalation contacts, evidence preservation and statutory notification playbooks."],
  ["grievance_redressal", "Grievance redressal", "Verify published contact details, grievance ownership and response tracking."],
  ["logs_and_records", "Processing logs and records", "Check security/processing logs, integrity, access and retention periods applicable to the business."],
  ["policy_and_notices", "Policies and notices", "Review policy version, effective date, change log and any required user communications."],
  ["staff_awareness", "Staff and contractor awareness", "Confirm personnel with access understand confidentiality, handling and incident escalation."]
];

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required." });
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Authentication is not configured securely." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}
async function adminOnly(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("role").lean();
    if (!user || !["admin", "coadmin"].includes(user.role)) return res.status(403).json({ message: "Admin access required." });
    req.actor = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Could not verify admin access." });
  }
}
router.use(authenticate, adminOnly);

router.get("/", async (req, res) => {
  try {
    const reviews = await PrivacyComplianceReview.find().sort({ month: -1 }).limit(24)
      .populate("reviewer", "name email").lean();
    const currentMonth = new Date().toISOString().slice(0, 7);
    let current = reviews.find(review => review.month === currentMonth);
    if (!current) current = { month: currentMonth, status: "in_progress", items: CHECKLIST.map(([key]) => ({ key, completed: false, evidence: "", notes: "" })), auditHistory: [] };
    res.json({ current, reviews, checklist: CHECKLIST.map(([key, title, description]) => ({ key, title, description })) });
  } catch (error) {
    console.error("Privacy compliance load:", error);
    res.status(500).json({ message: "Could not load compliance reviews." });
  }
});

router.put("/:month", async (req, res) => {
  try {
    const month = String(req.params.month || "");
    if (!/^\\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format." });
    const submitted = Array.isArray(req.body.items) ? req.body.items : [];
    const allowed = new Set(CHECKLIST);
    const items = submitted.filter(item => item && allowed.has(item.key)).map(item => ({
      key: item.key,
      completed: Boolean(item.completed),
      evidence: String(item.evidence || "").trim().slice(0, 2000),
      notes: String(item.notes || "").trim().slice(0, 2000),
      checkedAt: item.completed ? new Date() : null
    }));
    const summary = String(req.body.summary || "").trim().slice(0, 4000);
    const allDone = CHECKLIST.every(key => items.some(item => item.key === key && item.completed));
    const requestedStatus = ["in_progress", "ready_for_review", "completed"].includes(req.body.status) ? req.body.status : "in_progress";
    if (requestedStatus === "completed" && !allDone) return res.status(400).json({ message: "Complete every checklist item before closing the monthly review." });
    const existing = await PrivacyComplianceReview.findOne({ month });
    const previousStatus = existing?.status;
    const status = requestedStatus === "completed" ? "completed" : (requestedStatus === "ready_for_review" && allDone ? "ready_for_review" : "in_progress");
    const audit = { action: existing ? "review_updated" : "review_created", note: summary || "Monthly compliance checklist saved.", actor: req.user.id, occurredAt: new Date() };
    if (previousStatus !== status) audit.action = "status_changed_to_" + status;
    const review = await PrivacyComplianceReview.findOneAndUpdate(
      { month },
      { $set: { items, status, summary, reviewer: status === "completed" ? req.user.id : (existing?.reviewer || null), reviewedAt: status === "completed" ? new Date() : null }, $push: { auditHistory: audit } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("reviewer", "name email");
    res.json({ message: "Monthly privacy review saved.", review });
  } catch (error) {
    console.error("Privacy compliance save:", error);
    res.status(500).json({ message: "Could not save monthly compliance review." });
  }
});

router.get("/:month/export", async (req, res) => {
  try {
    const review = await PrivacyComplianceReview.findOne({ month: req.params.month }).populate("reviewer", "name email").lean();
    if (!review) return res.status(404).json({ message: "Review not found." });
    const csvCell = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const rows = [["Month", review.month], ["Status", review.status], ["Reviewer", review.reviewer?.name || ""], ["Reviewed at", review.reviewedAt || ""], [], ["Checklist item", "Completed", "Evidence", "Notes"]];
    for (const [key, title] of CHECKLIST.map(([key, title]) => [key, title])) {
      const item = review.items.find(entry => entry.key === key) || {};
      rows.push([title, item.completed ? "Yes" : "No", item.evidence || "", item.notes || ""]);
    }
    rows.push([], ["Summary", review.summary || ""]);
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="askc-privacy-review-' + review.month + '.csv"');
    res.send("\uFEFF" + csv);
  } catch (error) {
    res.status(500).json({ message: "Could not export compliance review." });
  }
});

module.exports = router;
