"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function hashChallengeId(jti) {
  return crypto.createHash("sha256").update(String(jti || "")).digest("hex");
}

async function issueTwoFactorChallenge({ user, Otp, jwtSecret, now = Date.now }) {
  if (!user?._id || !user?.email || !Otp || !jwtSecret) throw new TypeError("User, OTP model, and JWT secret are required.");
  const jti = crypto.randomUUID();
  const expiresAt = new Date(now() + 5 * 60 * 1000);
  const email = String(user.email).trim().toLowerCase();
  await Otp.create({
    email,
    otp: hashChallengeId(jti),
    purpose: "twofactor-challenge",
    expiresAt,
  });
  const token = jwt.sign(
    { id: String(user._id), role: user.role, purpose: "two-factor-login", jti },
    jwtSecret,
    { expiresIn: "5m" },
  );
  return { token, jti, email, expiresAt, otpHash: hashChallengeId(jti) };
}

async function consumeTwoFactorChallenge({ Otp, email, jti, now = Date.now }) {
  if (!Otp || !email || !jti) return null;
  return Otp.findOneAndDelete({
    email: String(email).trim().toLowerCase(),
    otp: hashChallengeId(jti),
    purpose: "twofactor-challenge",
    expiresAt: { $gt: new Date(now()) },
  });
}

module.exports = { hashChallengeId, issueTwoFactorChallenge, consumeTwoFactorChallenge };
