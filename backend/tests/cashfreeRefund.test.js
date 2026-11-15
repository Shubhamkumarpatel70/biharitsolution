"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cashfreeRefundRequest, normalizeRefundStatus, getCashfreeBaseUrl } = require("../utils/cashfreeRefund");

const env = { CASHFREE_APP_ID: "sandbox-app", CASHFREE_SECRET_KEY: "sandbox-secret", CASHFREE_ENVIRONMENT: "sandbox" };

test("creates Cashfree refund using sandbox host, amount and stable idempotency key", async () => {
  let captured;
  const result = await cashfreeRefundRequest({
    orderId: "order/123", refundId: "ASKCRF_test123", amount: 125.5, note: "Approved refund",
    env, fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ refund_status: "PENDING", cf_refund_id: "cf_123" }) };
    },
  });
  assert.equal(captured.url, "https://sandbox.cashfree.com/pg/orders/order%2F123/refunds");
  assert.equal(captured.options.headers["x-idempotency-key"], "ASKCRF_test123");
  assert.deepEqual(JSON.parse(captured.options.body), { refund_amount: 125.5, refund_id: "ASKCRF_test123", refund_note: "Approved refund" });
  assert.equal(result.refund_status, "PENDING");
});

test("fetches refund status without sending a request body", async () => {
  let captured;
  await cashfreeRefundRequest({
    orderId: "order1", refundId: "refund1", method: "GET", env,
    fetchImpl: async (url, options) => { captured = { url, options }; return { ok: true, json: async () => ({ refund_status: "SUCCESS" }) }; },
  });
  assert.match(captured.url, /\/orders\/order1\/refunds\/refund1$/);
  assert.equal(captured.options.body, undefined);
});

test("uses production host only when explicitly configured", () => {
  assert.equal(getCashfreeBaseUrl({ CASHFREE_ENVIRONMENT: "production" }), "https://api.cashfree.com/pg");
  assert.equal(getCashfreeBaseUrl({ CASHFREE_ENVIRONMENT: "prod" }), "https://sandbox.cashfree.com/pg");
});

test("does not make a provider call without credentials", async () => {
  let called = false;
  await assert.rejects(cashfreeRefundRequest({ orderId: "o", refundId: "r", amount: 1, env: {}, fetchImpl: async () => { called = true; } }), /credentials are not configured/i);
  assert.equal(called, false);
});

test("surfaces provider errors and classifies refund lifecycle states", async () => {
  await assert.rejects(cashfreeRefundRequest({
    orderId: "o", refundId: "r", amount: 1, env,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ message: "duplicate refund" }) }),
  }), (error) => error.statusCode === 409 && /duplicate refund/.test(error.message));
  assert.equal(normalizeRefundStatus("SUCCESS"), "processed");
  assert.equal(normalizeRefundStatus("PENDING"), "processing");
  assert.equal(normalizeRefundStatus("FAILED"), "failed");
  assert.equal(normalizeRefundStatus("something-new"), "unknown");
});
