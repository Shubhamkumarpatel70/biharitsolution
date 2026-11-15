"use strict";

// Explicit opt-in sandbox smoke test. Never runs as part of CI.
const crypto = require("crypto");

async function main() {
  if (process.env.CASHFREE_ENVIRONMENT === "production") {
    throw new Error("Refusing to run sandbox smoke test with production environment selected.");
  }
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) throw new Error("Set Cashfree sandbox credentials in the local protected environment.");
  const base = "https://sandbox.cashfree.com/pg";
  const orderId = "ASKC_TEST_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex");
  const headers = {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": appId,
    "x-client-secret": secret,
    "x-idempotency-key": crypto.randomUUID(),
  };
  const created = await fetch(base + "/orders", {
    method: "POST",
    headers,
    body: JSON.stringify({
      order_id: orderId,
      order_amount: 1,
      order_currency: "INR",
      customer_details: {
        customer_id: "askc_sandbox_smoke",
        customer_name: "ASKC Sandbox Test",
        customer_email: "sandbox-test@example.com",
        customer_phone: "9999999999",
      },
      order_note: "ASKC TECHNOLOGIES sandbox connectivity test",
    }),
  });
  const createData = await created.json().catch(() => ({}));
  if (!created.ok || !createData.payment_session_id) {
    throw new Error("Cashfree sandbox order creation failed with HTTP " + created.status + ": " + String(createData.message || "provider error"));
  }
  const fetched = await fetch(base + "/orders/" + encodeURIComponent(orderId), { headers });
  const order = await fetched.json().catch(() => ({}));
  if (!fetched.ok || order.order_id !== orderId) {
    throw new Error("Cashfree sandbox order fetch failed with HTTP " + fetched.status);
  }
  process.stdout.write(JSON.stringify({ ok: true, environment: "sandbox", orderId, orderStatus: order.order_status, amount: order.order_amount }) + "\n");
}

main().catch((error) => {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
});
