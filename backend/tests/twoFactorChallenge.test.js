"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { issueTwoFactorChallenge, consumeTwoFactorChallenge, hashChallengeId } = require("../utils/twoFactorChallenge");

test("issues a short-lived login-only challenge and persists a hashed one-time nonce", async () => {
  let stored;
  const Otp = { create: async (record) => { stored = record; } };
  const issued = await issueTwoFactorChallenge({
    user: { _id: "user-1", email: "TEST@EXAMPLE.COM", role: "user" },
    Otp, jwtSecret: "test-secret", now: () => 100000,
  });
  const decoded = jwt.verify(issued.token, "test-secret");
  assert.equal(decoded.purpose, "two-factor-login");
  assert.equal(decoded.id, "user-1");
  assert.ok(decoded.jti);
  assert.equal(stored.email, "test@example.com");
  assert.equal(stored.purpose, "twofactor-challenge");
  assert.equal(stored.otp, hashChallengeId(decoded.jti));
  assert.equal(stored.expiresAt.getTime(), 400000);
  assert.notEqual(stored.otp, decoded.jti);
});

test("challenge nonce is consumed atomically and cannot be replayed", async () => {
  let record = { _id: "challenge" };
  let query;
  const Otp = {
    findOneAndDelete: async (filter) => {
      query = filter;
      const current = record;
      record = null;
      return current;
    },
  };
  const first = await consumeTwoFactorChallenge({ Otp, email: "User@Example.com", jti: "nonce", now: () => 1000 });
  const second = await consumeTwoFactorChallenge({ Otp, email: "user@example.com", jti: "nonce", now: () => 1000 });
  assert.deepEqual(first, { _id: "challenge" });
  assert.equal(second, null);
  assert.equal(query.email, "user@example.com");
  assert.equal(query.otp, hashChallengeId("nonce"));
  assert.equal(query.purpose, "twofactor-challenge");
});

test("does not consume a missing challenge", async () => {
  assert.equal(await consumeTwoFactorChallenge({ Otp: { findOneAndDelete: async () => null }, email: "", jti: "" }), null);
});
