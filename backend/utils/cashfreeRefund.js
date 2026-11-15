"use strict";

const DEFAULT_API_VERSION = "2023-08-01";

function getCashfreeBaseUrl(env = process.env) {
  return env.CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

async function cashfreeRefundRequest({ orderId, refundId, amount, note, method = "POST", fetchImpl = global.fetch, env = process.env }) {
  const appId = env.CASHFREE_APP_ID;
  const secret = env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) {
    const error = new Error("Cashfree credentials are not configured.");
    error.statusCode = 503;
    throw error;
  }
  if (!orderId || !refundId) throw new TypeError("Cashfree order ID and refund ID are required.");
  const url = getCashfreeBaseUrl(env) + "/orders/" + encodeURIComponent(orderId) + "/refunds/" + encodeURIComponent(refundId);
  const headers = {
    "x-api-version": DEFAULT_API_VERSION,
    "x-client-id": appId,
    "x-client-secret": secret,
    "x-idempotency-key": refundId,
    "Content-Type": "application/json",
  };
  const options = { method, headers };
  if (method === "POST") {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new TypeError("Refund amount must be greater than zero.");
    options.body = JSON.stringify({
      refund_amount: Number(numericAmount.toFixed(2)),
      refund_id: refundId,
      refund_note: String(note || "ASKC TECHNOLOGIES subscription refund").slice(0, 200),
    });
  }
  const response = await fetchImpl(url, options);
  let data = {};
  try { data = await response.json(); } catch { /* provider may return an empty body */ }
  if (!response.ok) {
    const error = new Error(String(data.message || data.error_description || "Cashfree refund request failed."));
    error.statusCode = response.status;
    error.providerResponse = data;
    throw error;
  }
  return data;
}

function normalizeRefundStatus(value) {
  const status = String(value || "").toUpperCase();
  if (["SUCCESS", "PROCESSED", "COMPLETED"].includes(status)) return "processed";
  if (["FAILED", "CANCELLED", "CANCELED"].includes(status)) return "failed";
  if (["PENDING", "QUEUED", "IN_PROGRESS", "ACTIVE"].includes(status)) return "processing";
  return "unknown";
}

module.exports = { cashfreeRefundRequest, normalizeRefundStatus, getCashfreeBaseUrl };
