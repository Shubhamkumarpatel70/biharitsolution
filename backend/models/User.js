const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Hide password by default
    role: { type: String, enum: ["user", "admin", "coadmin"], default: "user" },
    image: { type: String },
    subscribeOffers: { type: Boolean, default: false },
    marketingConsent: { type: Boolean, default: false },
    marketingConsentAt: { type: Date, default: null },
    sessions: [{
      sessionId: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      lastSeenAt: { type: Date, default: Date.now },
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
      revokedAt: { type: Date, default: null },
    }],
    sessionVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },
    lastLoginUserAgent: { type: String, default: "" },
    lastActiveAt: { type: Date, default: null, index: true },
    lastLogoutAllAt: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ["email", "authenticator", ""], default: "" },
    twoFactorSecret: { type: String, default: "", select: false },
    twoFactorPendingSecret: { type: String, default: "", select: false },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true, // Suppress warning about reserved schema pathnames
    // Add indexes for better performance
    indexes: [
      { email: 1 }, // Index for email lookups (login)
      { role: 1 }, // Index for role-based queries
      { createdAt: -1 }, // Index for sorting by creation date
    ],
  },
);

// Add compound index for common queries
userSchema.index({ email: 1, role: 1 });

// Add text index for search functionality (if needed)
userSchema.index({ name: "text", email: "text" });

module.exports = mongoose.model("User", userSchema);
