const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  registerAdmin,
  updateUserProfile,
  changeUserPassword,
  getUserNotifications,
  markNotificationRead,
  cancelUserSubscription,
  renewUserSubscription,
  verifyEmailForPasswordReset,
  resetPassword,
  getLoginCaptcha,
  sendRegisterOtp,
  verifyRegisterOtp,
  sendForgotOtp,
  verifyForgotOtp,
} = require("../controllers/authController");
// OTP routes for registration
router.post("/register/send-otp", sendRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);

// OTP routes for forgot password
router.post("/forgot-password/send-otp", sendForgotOtp);
router.post("/forgot-password/verify-otp", verifyForgotOtp);
const Subscription = require("../models/Subscription");
const jwt = require("jsonwebtoken");
const Plan = require("../models/Plan");
const Contact = require("../models/Contact");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Otp = require("../models/Otp");
const cookieParser = require("cookie-parser");
const Complaint = require("../models/Complaint");
const passport = require("passport");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const Coupon = require("../models/Coupon");
const TeamMember = require("../models/Team");
const ClientWork = require("../models/ClientWork");
const Project = require("../models/Project");
const Feature = require("../models/Feature");
const Service = require("../models/Service");
const PaymentOption = require("../models/PaymentOption");
const PaymentMode = require("../models/PaymentMode");
const ProjectRequirement = require("../models/ProjectRequirement");
const Career = require("../models/Career");
const CareerApplication = require("../models/CareerApplication");
const FundTransaction = require("../models/FundTransaction");
const IDCard = require("../models/IDCard");
const Agreement = require("../models/Agreement");
const FounderProfile = require("../models/FounderProfile");
const { uploadImageBuffer, uploadDataUri, moveInlineImagesToCloudinary } = require("../utils/cloudinary");
const { sendEmail } = require("../utils/email");
const { parsePlanDurationDays } = require("../utils/planDuration");
const multer = require("multer");
const path = require("path");

// Configure multer memory storage; image buffers are sent to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedExt = [".pdf", ".doc", ".docx"];
    const allowedMime = [
      "application/pdf",
      "application/x-pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedExt.includes(ext)) return cb(null, true);
    if (allowedMime.includes(file.mimetype)) return cb(null, true);
    if (
      (file.mimetype === "application/octet-stream" ||
        file.mimetype === "binary/octet-stream") &&
      allowedExt.includes(ext)
    ) {
      return cb(null, true);
    }
    cb(new Error("Resume must be PDF or Word (.doc, .docx)."), false);
  },
});

// Helper function to convert buffer to base64
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

const crypto = require("crypto");

async function createUserNotification(userId, title, message, type = "general", eventKey = "", link = "") {
  if (!userId) return null;
  try {
    if (eventKey) {
      const existing = await Notification.findOne({ user: userId, eventKey }).select("_id");
      if (existing) return existing;
    }
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      eventKey,
      link,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  } catch (notificationError) {
    console.error("Could not create user event notification:", notificationError?.message);
    return null;
  }
}

async function notifyCashfreePaymentSuccess(subscription) {
  try {
    const user = await User.findById(subscription.user).select("name email");
    if (!user) return;
    const planLabel = subscription.planName || subscription.plan || "subscription";
    const reference = subscription.transactionId || subscription.cashfreeOrderId || subscription.uniqueId;
    const message = `Your payment of ₹${Number(subscription.amountPaid || 0).toLocaleString("en-IN")} for ${planLabel} has been verified by Cashfree. Your subscription is now active.`;
    await createUserNotification(
      user._id,
      "Payment successful",
      message,
      "subscription",
      `cashfree-payment-success:${subscription._id}`,
      "/dashboard/subscription"
    );
    if (user.email) {
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#172033"><h2 style="color:#1556a6">Payment successful</h2><p>Dear ${String(user.name || "Customer").replace(/[&<>"]/g, "")},</p><p>Your payment has been securely verified by Cashfree. Your ASKC TECHNOLOGIES subscription is now active.</p><div style="padding:16px;background:#f4f7fb;border-radius:10px"><p><b>Plan:</b> ${String(planLabel).replace(/[&<>"]/g, "")}</p><p><b>Amount paid:</b> ₹${Number(subscription.amountPaid || 0).toLocaleString("en-IN")}</p><p><b>Payment reference:</b> ${String(reference || "").replace(/[&<>"]/g, "")}</p></div><p>You can view your subscription in your user dashboard.</p><p>Regards,<br/>ASKC TECHNOLOGIES<br/><a href="https://askctechnologies.in">askctechnologies.in</a></p></div>`;
      await sendEmail(
        user.email,
        "Payment successful — ASKC TECHNOLOGIES",
        message + `\nPlan: ${planLabel}\nPayment reference: ${reference || "N/A"}\nYour subscription is now active.`,
        html,
        '"ASKC TECHNOLOGIES" <askctechnologies@gmail.com>'
      );
    }
  } catch (notificationError) {
    // A mail/notification provider issue must never roll back a verified payment.
    console.error("Cashfree success notification failed:", notificationError?.message);
  }
}

function parseStoredPlanPrice(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const normalized = String(value).replace(/[₹,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function getCheckoutPaymentMode() {
  const settings = await PaymentMode.findOne({ key: "checkout" }).lean();
  return settings?.mode === "manual" ? "manual" : "cashfree";
}

function generateProjectSubmissionId() {
  const y = new Date().getFullYear();
  const rand = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `PR-${y}-${rand}`;
}

function normalizeResumeMime(mimetype, originalname) {
  const ext = path.extname(originalname || "").toLowerCase();
  const allowed = [
    "application/pdf",
    "application/x-pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "binary/octet-stream",
  ];
  if (mimetype && allowed.includes(mimetype)) {
    if (
      mimetype === "application/octet-stream" ||
      mimetype === "binary/octet-stream"
    ) {
      if (ext === ".pdf") return "application/pdf";
      if (ext === ".doc") return "application/msword";
      if (ext === ".docx") {
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
    }
    return mimetype === "application/x-pdf" ? "application/pdf" : mimetype;
  }
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return mimetype || "application/octet-stream";
}

// Duplicate resumeUpload declaration removed. Only the first declaration is kept.

// Duplicate 'upload' declaration removed. Only the top-of-file declaration is kept.

// Duplicate 'bufferToBase64' declaration removed. Only the first declaration is kept.

router.use(cookieParser());

const authCookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function clearAuthCookies(res) {
  // Clear both the root-path cookie and legacy cookies scoped to /api/auth.
  res.clearCookie("token", authCookieOptions);
  res.clearCookie("token", { ...authCookieOptions, path: "/api/auth" });
}

router.post("/register", registerUser);
router.get("/captcha", getLoginCaptcha);
router.post("/login", loginUser);
router.post("/register-admin", registerAdmin);
// Users are considered online for 2 minutes after their latest authenticated heartbeat.
router.post("/activity/heartbeat", authMiddleware, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { lastActiveAt: new Date(), ...(req.user.sid ? { "sessions.$[active].lastSeenAt": new Date() } : {}) } }, req.user.sid ? { arrayFilters: [{ "active.sessionId": req.user.sid, "active.revokedAt": null }] } : {});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not update activity." });
  }
});

router.get("/admin/active-users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    const users = await User.find({ role: "user", lastActiveAt: { $gte: cutoff } })
      .select("name email image lastActiveAt lastLoginAt lastLoginUserAgent")
      .sort({ lastActiveAt: -1 }).lean();
    res.json({ users, count: users.length, checkedAt: new Date() });
  } catch (error) {
    console.error("Active users load failed:", error);
    res.status(500).json({ message: "Could not load active users." });
  }
});

// Session & Login Info: list all active device sessions for the signed-in account.
router.get("/sessions", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role sessions").lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    const expiry = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const sessions = (user.sessions || [])
      .filter((s) => !s.revokedAt && new Date(s.createdAt).getTime() > expiry)
      .map((s) => ({
        sessionId: s.sessionId,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        ip: s.ip || "",
        userAgent: s.userAgent || "",
        current: s.sessionId === req.user.sid,
      }))
      .sort((a, b) => new Date(b.lastSeenAt || b.createdAt) - new Date(a.lastSeenAt || a.createdAt));
    res.json({ user: { name: user.name, email: user.email, role: user.role }, sessions });
  } catch (error) {
    console.error("Session information load failed:", error);
    res.status(500).json({ message: "Could not load session information." });
  }
});

// Sign out only the current browser/device session.
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const result = await User.updateOne(
      { _id: req.user.id, sessions: { $elemMatch: { sessionId: req.user.sid, revokedAt: null } } },
      { $set: { "sessions.$.revokedAt": new Date() } },
    );
    if (!result.modifiedCount) {
      clearAuthCookies(res);
      res.set("Cache-Control", "no-store");
      return res.status(401).json({ success: false, message: "This device session has already ended. Please sign in again." });
    }
    clearAuthCookies(res);
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, current: true, message: "You have been signed out from this device." });
  } catch (error) {
    console.error("Current session logout failed:", error);
    return res.status(500).json({ success: false, message: "Could not sign out this device." });
  }
});

router.post("/sessions/:sessionId/logout", authMiddleware, async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId || "");
    if (!sessionId || sessionId.length > 100) return res.status(400).json({ message: "Invalid session." });
    const result = await User.updateOne(
      { _id: req.user.id, sessions: { $elemMatch: { sessionId, revokedAt: null } } },
      { $set: { "sessions.$.revokedAt": new Date() } },
    );
    if (!result.modifiedCount) return res.status(404).json({ message: "Session is already signed out or could not be found." });
    const isCurrentSession = sessionId === req.user.sid;
    // The login flow also sets an HttpOnly cookie. Clear it when this browser
    // signs itself out, otherwise the browser can silently authenticate again
    // from the still-present cookie after localStorage has been cleared.
    if (isCurrentSession) {
      clearAuthCookies(res);
    }
    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      current: isCurrentSession,
      message: isCurrentSession ? "This device has been signed out." : "Device logged out successfully.",
    });
  } catch (error) {
    console.error("Single session logout failed:", error);
    res.status(500).json({ message: "Could not sign out this device." });
  }
});

// Revoke every session and invalidate every token for this account.
router.post("/sessions/logout-all", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { sessionVersion: 1 },
      $set: { lastLogoutAllAt: new Date(), "sessions.$[].revokedAt": new Date() },
    });
    clearAuthCookies(res);
    res.json({ success: true, message: "All sessions have been signed out. Please log in again." });
  } catch (error) {
    console.error("Logout all sessions failed:", error);
    res.status(500).json({ message: "Could not sign out all sessions." });
  }
});

// Forgot Password Routes
router.post("/forgot-password/verify-email", verifyEmailForPasswordReset);
router.post("/forgot-password/reset", resetPassword);

// Google Auth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    // Google sign-in must respect the same second-factor requirement as password sign-in.
    if (req.user?.twoFactorEnabled && ["email", "authenticator"].includes(req.user.twoFactorMethod)) {
      const challengeToken = jwt.sign(
        { id: req.user._id, role: req.user.role, purpose: "two-factor-login" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" },
      );
      if (req.user.twoFactorMethod === "email") {
        const code = require("crypto").randomInt(100000, 1000000).toString();
        const email = String(req.user.email).toLowerCase();
        await Otp.deleteMany({ email, purpose: "twofactor-login" });
        await Otp.create({ email, otp: code, purpose: "twofactor-login", expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
        try {
          await sendEmail(email, "Your ASKC TECHNOLOGIES login verification code", `Your login verification code is ${code}. It expires in 5 minutes.`, `<div style="margin:0;background:#f3f6fb;padding:28px 12px;font-family:Arial,sans-serif;color:#172033"><div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="background:#102b55;padding:24px 28px;color:#fff"><div style="font-size:22px;font-weight:800">ASKC<br><span style="color:#8fc5ff">TECHNOLOGIES</span></div><div style="font-size:10px;letter-spacing:2px;color:#c2d5ee;margin-top:8px">ACCOUNT SECURITY</div></div><div style="padding:28px"><h2 style="color:#102b55">Verify your login</h2><p style="color:#536174;line-height:1.7">Use this one-time code to finish signing in. Do not share it with anyone.</p><div style="background:#f5f8fc;border:1px solid #dce6f2;border-radius:12px;padding:22px;text-align:center"><p style="font-size:11px;letter-spacing:2px;color:#718096">YOUR VERIFICATION CODE</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#1763b1">${code}</div></div><p style="font-size:12px;color:#64748b;margin-top:22px">This code expires in 5 minutes.</p></div><div style="background:#f8fafc;padding:18px 28px;color:#748196;font-size:11px">ASKC TECHNOLOGIES · <a href="https://askctechnologies.in" style="color:#1756a2">askctechnologies.in</a></div></div></div>`);
        } catch (error) {
          await Otp.deleteMany({ email, purpose: "twofactor-login" });
          const errorLoginUrl = new URL("/login", process.env.CLIENT_URL || "https://askctechnologies.in");
          errorLoginUrl.searchParams.set("twoFactorError", "email");
          return res.redirect(errorLoginUrl.toString());
        }
      }
      const frontendOrigin = process.env.CLIENT_URL || "https://askctechnologies.in";
      const loginUrl = new URL("/login", frontendOrigin);
      loginUrl.searchParams.set("twoFactorToken", challengeToken);
      loginUrl.searchParams.set("twoFactorMethod", req.user.twoFactorMethod);
      return res.redirect(loginUrl.toString());
    }
    // Successful authentication, redirect or send token
    const sessionId = crypto.randomUUID();
    const sessionIp = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].slice(0, 100);
    const sessionAgent = String(req.headers["user-agent"] || "").slice(0, 500);
    const loginState = await User.findByIdAndUpdate(req.user._id, {
      $set: { lastLoginAt: new Date(), lastLoginIp: sessionIp, lastLoginUserAgent: sessionAgent },
      $push: { sessions: { $each: [{ sessionId, createdAt: new Date(), lastSeenAt: new Date(), ip: sessionIp, userAgent: sessionAgent, revokedAt: null }], $slice: -30 } },
    }, { new: true }).select("sessionVersion");
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role, sv: Number(loginState?.sessionVersion || 0), sid: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Handle multiple frontend URLs
    const clientUrl =
      process.env.CLIENT_URL || "http://localhost:3000/dashboard";
    res.redirect(clientUrl);
  },
);

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Middleware to protect routes
async function authMiddleware(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied." });
  }
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "changeme") return res.status(503).json({ message: "Authentication is temporarily unavailable." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose === "two-factor-login") return res.status(401).json({ message: "Complete the login verification first." });
    const account = await User.findById(decoded.id).select("sessionVersion role sessions").lean();
    if (!account || Number(decoded.sv || 0) !== Number(account.sessionVersion || 0)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }
    if (!decoded.sid) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Please log in again to activate secure device session tracking." });
    }
    const activeSession = (account.sessions || []).find((session) => session.sessionId === decoded.sid && !session.revokedAt);
    if (!activeSession) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "This device session has been signed out. Please log in again." });
    }
    req.user = { ...decoded, role: account.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid." });
  }
}

// Admin middleware (only admin)
function adminMiddleware(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin access required." });
}

// Co-admin middleware (admin or coadmin)
function coAdminMiddleware(req, res, next) {
  if (req.user && (req.user.role === "admin" || req.user.role === "coadmin"))
    return next();
  return res
    .status(403)
    .json({ message: "Admin or Co-admin access required." });
}

/**
 * Absolute base URL of the public website (scheme + host, no trailing slash).
 * Used for links inside emails so they never point to localhost in production.
 */
function getPublicSiteOrigin() {
  const explicit =
    process.env.PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.PROMOTIONAL_UNSUBSCRIBE_URL ||
    process.env.REACT_APP_API_URL;

  const canonicalOrigin = "https://askctechnologies.in";
  if (explicit && String(explicit).trim()) {
    const raw = String(explicit).trim();
    try {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      const hostname = u.hostname.toLowerCase().replace(/^www\./, "");
      // Migrate legacy ASKC Web domains to the official ASKC Technologies domain.
      if (hostname === "askcweb.in") return canonicalOrigin;
      if (hostname === "askctechnologies.in") return canonicalOrigin;
      return u.origin.replace(/\/$/, "");
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return canonicalOrigin;
}

// Cashfree Checkout: create a server-priced order and a pending subscription.
// Cashfree server-to-server webhook. Signature is verified against the untouched raw request body.
router.post("/cashfree/webhook", async (req, res) => {
  try {
    const secret = process.env.CASHFREE_SECRET_KEY;
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    if (!secret || !signature || !timestamp || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Invalid webhook request." });
    }
    const expected = require("crypto")
      .createHmac("sha256", secret)
      .update(String(timestamp) + req.body.toString("utf8"))
      .digest("base64");
    const suppliedBuffer = Buffer.from(String(signature));
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length ||
        !require("crypto").timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      return res.status(401).json({ message: "Invalid webhook signature." });
    }
    const event = JSON.parse(req.body.toString("utf8"));
    const orderId = event?.data?.order?.order_id;
    const payment = event?.data?.payment;
    if (event.type !== "PAYMENT_SUCCESS_WEBHOOK" ||
        payment?.payment_status !== "SUCCESS" || !orderId) {
      return res.status(200).json({ received: true });
    }
    const subscription = await Subscription.findOne({ cashfreeOrderId: orderId });
    if (!subscription) return res.status(200).json({ received: true });
    if (subscription.status === "active") return res.status(200).json({ received: true });
    const paidAmount = Number(event?.data?.order?.order_amount);
    if (!Number.isFinite(paidAmount) || paidAmount !== Number(subscription.amountPaid)) {
      console.error("Cashfree webhook amount mismatch:", orderId);
      return res.status(200).json({ received: true });
    }
    const duration = Number(subscription.durationDays);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 30;
    const activatedSubscription = await Subscription.findOneAndUpdate(
      { _id: subscription._id, status: "pending" },
      {
        $set: {
          status: "active",
          paymentStatus: "paid",
          transactionId: String(payment.cf_payment_id || orderId),
          expiresAt: new Date(Date.now() + safeDuration * 86400000)
        }
      },
      { new: true }
    );
    if (activatedSubscription && subscription.couponCode) {
      const redeemedCoupon = await Coupon.findOneAndUpdate(
        {
          code: subscription.couponCode,
          active: true,
          usedBy: { $ne: subscription.user },
          $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
        },
        { $addToSet: { usedBy: subscription.user }, $inc: { usedCount: 1 } },
        { new: true },
      );
      if (redeemedCoupon?.usageLimit > 0 && redeemedCoupon.usedCount >= redeemedCoupon.usageLimit) {
        await Coupon.updateOne({ _id: redeemedCoupon._id }, { $set: { active: false } });
      }
    }
    if (activatedSubscription) await notifyCashfreePaymentSuccess(activatedSubscription);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Cashfree webhook error:", err);
    return res.status(500).json({ message: "Webhook processing failed." });
  }
});

// Keep one subscription purchase in progress per user. Expired/cancelled plans
// are made inactive before checking whether another purchase is allowed.
async function getSubscriptionPurchaseBlocker(userId) {
  const now = new Date();
  const abandonedPendingCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await Subscription.updateMany(
    { user: userId, status: "active", canceled: { $ne: true }, expiresAt: { $ne: null, $lte: now } },
    { $set: { status: "expired" } }
  );
  // A pending checkout/receipt must not lock a customer's account forever.
  // Only stale pending requests are expired; recent requests remain protected.
  await Subscription.updateMany(
    { user: userId, status: "pending", createdAt: { $lte: abandonedPendingCutoff } },
    { $set: { status: "expired", paymentStatus: "expired" } }
  );
  return Subscription.findOne({
    user: userId,
    canceled: { $ne: true },
    $or: [
      { status: "active", $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      { status: "pending", createdAt: { $gt: abandonedPendingCutoff } }
    ]
  }).sort({ createdAt: -1 });
}

function subscriptionPurchaseBlockedResponse(res, subscription) {
  const isPending = subscription.status === "pending";
  const planName = subscription.planName || subscription.plan || "current";
  const expiresText = subscription.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString("en-IN")
    : "";
  return res.status(409).json({
    code: isPending ? "SUBSCRIPTION_PURCHASE_PENDING" : "ACTIVE_SUBSCRIPTION_EXISTS",
    message: isPending
      ? `Your ${planName} plan purchase is already pending. Please wait for payment verification or contact ASKC TECHNOLOGIES before starting another purchase.`
      : `You already have an active ${planName} plan${expiresText ? ` until ${expiresText}` : ""}. You can purchase another plan only after this subscription expires or becomes inactive.`,
    subscription: {
      planName,
      status: subscription.status,
      uniqueId: subscription.uniqueId,
      expiresAt: subscription.expiresAt || null
    }
  });
}

router.post("/cashfree/create-order", authMiddleware, async (req, res) => {
  try {
    if (await getCheckoutPaymentMode() !== "cashfree") {
      return res.status(403).json({ message: "Online checkout is currently disabled. Please use the payment method configured by ASKC Technologies." });
    }
    const { plan, phone, couponCode } = req.body || {};
    const purchaseBlocker = await getSubscriptionPurchaseBlocker(req.user.id);
    if (purchaseBlocker) return subscriptionPurchaseBlockedResponse(res, purchaseBlocker);
    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
    if (!plan || !/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Select a plan and enter a valid 10-digit mobile number." });
    }
    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secret) {
      return res.status(503).json({ message: "Online payments are temporarily unavailable. Please use manual payment." });
    }
    const planDoc = await Plan.findOne({ name: String(plan).trim() });
    const basePlanPrice = planDoc ? parseStoredPlanPrice(planDoc.price) : null;
    if (!planDoc || basePlanPrice === null) {
      return res.status(400).json({ message: "Selected plan is unavailable." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const planName = planDoc.name.toLowerCase();
    const planEnum = planName.includes("premium") ? "premium" : planName.includes("pro") ? "pro" : "starter";
    const orderId = "ASKC_" + Date.now() + "_" + require("crypto").randomBytes(4).toString("hex");
    let discountAmount = 0;
    let normalizedCouponCode = "";
    if (couponCode) {
      normalizedCouponCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalizedCouponCode, active: true });
      if (!coupon) return res.status(400).json({ message: "Coupon is invalid or expired." });
      if (coupon.eligiblePlans?.length && !coupon.eligiblePlans.some(id => String(id) === String(planDoc._id)))
        return res.status(400).json({ message: "This coupon is not valid for the selected pricing plan." });
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: "Coupon usage limit reached." });
      if (coupon.usedBy.some(id => String(id) === String(user._id))) return res.status(400).json({ message: "You have already used this coupon." });
      discountAmount = coupon.discountType === 'percentage'
        ? Number((basePlanPrice * Math.min(100, Number(coupon.amount) || 0) / 100).toFixed(2))
        : Math.min(Number(coupon.amount) || 0, basePlanPrice);
    }
    const amount = Number(Math.max(0, basePlanPrice - discountAmount).toFixed(2));
    if (amount <= 0) return res.status(400).json({ message: "Coupon discount must leave a payable amount greater than zero." });
    const baseUrl = process.env.CASHFREE_ENVIRONMENT === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
    const response = await fetch(baseUrl + "/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-idempotency-key": require("crypto").randomUUID()
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(user._id),
          customer_name: user.name || "ASKC Customer",
          customer_email: user.email,
          customer_phone: cleanPhone
        },
        order_meta: {
          // Prefer the active public website origin so a stale deployment setting
          // cannot redirect customers to the old domain after payment.
          return_url: (["https://askcweb.in", "https://www.askcweb.in", "https://askctechnologies.in", "https://www.askctechnologies.in"].includes(req.headers.origin)
            ? req.headers.origin
            : String(process.env.FRONTEND_URL || "https://askctechnologies.in").replace(/\/+$/, "")) +
            "/payment/" + encodeURIComponent(planDoc.name) + "?cashfree_order_id=" + orderId
        },
        order_note: "ASKC TECHNOLOGIES " + planDoc.name + " subscription"
      })
    });
    const data = await response.json();
    if (!response.ok || !data.payment_session_id) {
      console.error("Cashfree order creation failed:", data);
      return res.status(502).json({ message: data.message || "Could not start Cashfree checkout." });
    }
    const durationDays = parsePlanDurationDays(planDoc.duration);
    const subscription = await Subscription.create({
      user: user._id,
      plan: planEnum,
      planName: planDoc.name,
      sourcePlan: planDoc._id,
      totalAmount: basePlanPrice,
      uniqueId: orderId,
      status: "pending",
      expiresAt: new Date(Date.now() + durationDays * 86400000),
      paymentMethod: "cashfree",
      durationDays,
      cashfreeOrderId: orderId,
      paymentStatus: "created",
      amountPaid: amount,
      couponCode: normalizedCouponCode,
      discountAmount
    });
    return res.status(201).json({
      orderId,
      paymentSessionId: data.payment_session_id,
      amount,
      currency: "INR",
      environment: process.env.CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox",
      subscriptionId: subscription._id
    });
  } catch (err) {
    console.error("Cashfree create-order error:", err);
    return res.status(500).json({ message: "Unable to create payment order." });
  }
});

// Verify payment with Cashfree directly; never trust the browser redirect as proof.
router.post("/cashfree/verify-order", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId || !/^ASKC_[A-Za-z0-9_]+$/.test(orderId)) {
      return res.status(400).json({ message: "Invalid payment order." });
    }
    const subscription = await Subscription.findOne({ cashfreeOrderId: orderId, user: req.user.id });
    if (!subscription) return res.status(404).json({ message: "Payment order not found." });
    if (subscription.status === "active") {
      return res.json({ status: "active", subscription, message: "Subscription is already active." });
    }
    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secret) return res.status(503).json({ message: "Payment verification is unavailable." });
    const baseUrl = process.env.CASHFREE_ENVIRONMENT === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
    const response = await fetch(baseUrl + "/orders/" + encodeURIComponent(orderId), {
      headers: { "x-api-version": "2023-08-01", "x-client-id": appId, "x-client-secret": secret }
    });
    const order = await response.json();
    if (!response.ok) {
      console.error("Cashfree order verification failed:", order);
      return res.status(502).json({ message: "Could not verify payment with Cashfree." });
    }
    if (order.order_status !== "PAID") {
      await Subscription.updateOne(
        { _id: subscription._id, status: "pending" },
        { $set: { paymentStatus: String(order.order_status || "pending").toLowerCase() } }
      );
      return res.status(202).json({
        status: "pending",
        paymentStatus: order.order_status || "PENDING",
        message: "Payment is not confirmed yet. Please wait and check again."
      });
    }
    const paidAmount = Number(order.order_amount);
    if (!Number.isFinite(paidAmount) || paidAmount !== Number(subscription.amountPaid)) {
      console.error("Cashfree amount mismatch", { orderId, expected: subscription.amountPaid, received: order.order_amount });
      return res.status(409).json({ message: "Payment amount mismatch. Please contact support." });
    }
    const paymentsResponse = await fetch(baseUrl + "/orders/" + encodeURIComponent(orderId) + "/payments", {
      headers: { "x-api-version": "2023-08-01", "x-client-id": appId, "x-client-secret": secret }
    });
    const payments = paymentsResponse.ok ? await paymentsResponse.json() : [];
    const successfulPayment = Array.isArray(payments)
      ? payments.find(payment => payment.payment_status === "SUCCESS")
      : null;
    if (subscription.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: subscription.couponCode, active: true, usedBy: { $ne: subscription.user }, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
        { $addToSet: { usedBy: subscription.user }, $inc: { usedCount: 1 } }
      );
    }
    const safeDuration = Number.isFinite(Number(subscription.durationDays)) && Number(subscription.durationDays) > 0 ? Number(subscription.durationDays) : 30;
    const updated = await Subscription.findOneAndUpdate(
      { _id: subscription._id, user: req.user.id, status: "pending" },
      {
        $set: {
          status: "active",
          paymentStatus: "paid",
          transactionId: successfulPayment?.cf_payment_id ? String(successfulPayment.cf_payment_id) : orderId,
          expiresAt: new Date(Date.now() + safeDuration * 86400000)
        }
      },
      { new: true }
    );
    if (updated) await notifyCashfreePaymentSuccess(updated);
    const finalSubscription = updated || await Subscription.findById(subscription._id);
    if (!finalSubscription || finalSubscription.status !== "active") {
      return res.status(409).json({ message: "Subscription could not be activated. Please contact support." });
    }
    return res.json({ status: "active", subscription: finalSubscription, message: "Payment verified. Your subscription is now active." });
  } catch (err) {
    console.error("Cashfree verify-order error:", err);
    return res.status(500).json({ message: "Unable to verify payment right now." });
  }
});

// Create a new subscription (after payment)
router.post(
  "/subscribe",
  authMiddleware,
  upload.single("paymentImage"),
  async (req, res) => {
    // Manual receipt submissions are accepted only when the server-side checkout mode is manual.
    if (await getCheckoutPaymentMode() !== "manual") {
      return res.status(403).json({ message: "Manual payment submissions are disabled. Complete payment through the configured online gateway." });
    }
    if (!(await PaymentOption.countDocuments({ isActive: true }))) {
      return res.status(503).json({ message: "Manual payment is not configured. Please contact ASKC Technologies." });
    }
    // Get data from FormData (req.body) or JSON (req.body)
    let { plan, transactionId, method, couponCode } = req.body;
    const paymentImage = req.file;
    const purchaseBlocker = await getSubscriptionPurchaseBlocker(req.user.id);
    if (purchaseBlocker) return subscriptionPurchaseBlockedResponse(res, purchaseBlocker);

    // Debug: Log the entire request
    console.log("Subscription request body:", req.body);
    console.log(
      "Subscription request file:",
      paymentImage
        ? { name: paymentImage.originalname, size: paymentImage.size }
        : "none",
    );
    console.log("Subscription request:", {
      plan,
      planType: typeof plan,
      transactionId,
      method,
      hasImage: !!paymentImage,
      userId: req.user.id,
      userEmail: req.user.email,
    });

    // More flexible plan validation - handle both string and other types
    if (!plan) {
      return res.status(400).json({ message: "Plan is required." });
    }

    // Convert plan to string if it's not already
    plan = String(plan).trim();

    if (!plan || plan.length === 0) {
      return res.status(400).json({ message: "Plan is required." });
    }

    // Validate transaction ID if provided
    if (transactionId && typeof transactionId !== "string") {
      return res
        .status(400)
        .json({ message: "Transaction ID must be a string." });
    }

    // Validate payment method if provided
    if (method && !["upi", "card", "netbanking"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    // Find plan by name (case-insensitive)
    const planDoc = await Plan.findOne({
      name: { $regex: new RegExp("^" + plan + "$", "i") },
    });

    if (!planDoc) {
      console.log("Plan not found:", plan);
      console.log("Available plans:", await Plan.find().select("name"));
      return res.status(400).json({ message: "Plan not found." });
    }

    // Verify user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Map plan name to subscription enum values
    let planEnum;
    const planNameLower = planDoc.name.toLowerCase();
    if (planNameLower.includes("starter") || planNameLower.includes("basic")) {
      planEnum = "starter";
    } else if (planNameLower.includes("premium")) {
      planEnum = "premium";
    } else if (planNameLower.includes("pro")) {
      planEnum = "pro";
    } else {
      // Default to starter if no match found
      planEnum = "starter";
    }

    const basePlanPrice = parseStoredPlanPrice(planDoc.price);
    if (basePlanPrice === null) return res.status(400).json({ message: "Selected plan has an invalid price. Please contact ASKC Technologies." });
    let discountAmount = 0;
    let normalizedCouponCode = "";
    if (couponCode) {
      normalizedCouponCode = String(couponCode).trim().toUpperCase();
      const couponDoc = await Coupon.findOne({ code: normalizedCouponCode, active: true });
      if (!couponDoc) return res.status(400).json({ message: "Coupon is invalid or expired." });
      if (couponDoc.eligiblePlans?.length && !couponDoc.eligiblePlans.some(id => String(id) === String(planDoc._id)))
        return res.status(400).json({ message: "This coupon is not valid for the selected pricing plan." });
      if (couponDoc.usageLimit > 0 && couponDoc.usedCount >= couponDoc.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached." });
      }
      if (couponDoc.usedBy.some(id => String(id) === String(user._id))) {
        return res.status(400).json({ message: "You have already used this coupon." });
      }
      discountAmount = couponDoc.discountType === 'percentage'
        ? Number((basePlanPrice * Math.min(100, Number(couponDoc.amount) || 0) / 100).toFixed(2))
        : Math.min(Number(couponDoc.amount) || 0, basePlanPrice);
    }
    const payableAmount = Number(Math.max(0, basePlanPrice - discountAmount).toFixed(2));
    if (payableAmount <= 0) return res.status(400).json({ message: "Coupon discount must leave a payable amount greater than zero." });

    const uniqueId =
      "SUB-" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 6).toUpperCase();
    const now = new Date();

    // Ensure plan duration is valid
    const durationInDays = parsePlanDurationDays(planDoc.duration);
    const expiresAt = new Date(
      now.getTime() + durationInDays * 24 * 60 * 60 * 1000,
    );

    // Convert payment image to base64 if provided
    let paymentImageBase64 = null;
    if (paymentImage) {
      paymentImageBase64 = (await uploadImageBuffer(paymentImage.buffer, paymentImage.mimetype, "askc-technologies/payment-proofs")).url;
    }

    try {
      const subscription = await Subscription.create({
        user: req.user.id,
        plan: planEnum,
        uniqueId,
        status: "pending",
        planName: planDoc.name,
        sourcePlan: planDoc._id,
        totalAmount: basePlanPrice,
        amountPaid: payableAmount,
        discountAmount,
        couponCode: normalizedCouponCode,
        paymentStatus: "pending",
        expiresAt,
        transactionId: transactionId || null,
        paymentMethod: method || "upi",
        paymentImage: paymentImageBase64,
      });
      res.status(201).json({ subscription: subscription.toObject(), message: "Payment details submitted for admin verification." });
    } catch (err) {
      console.error("Subscription creation error:", err);
      console.error("Error details:", {
        user: req.user.id,
        plan: planEnum,
        planDoc: planDoc.name,
        error: err.message,
        validationErrors: err.errors,
      });
      res.status(500).json({ message: "Could not create subscription." });
    }
  },
);

// Get all subscriptions for the logged-in user
router.get("/user-subscriptions", authMiddleware, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // Check and update expired subscriptions
    const now = new Date();
    for (let subscription of subscriptions) {
      if (
        subscription.expiresAt &&
        subscription.expiresAt < now &&
        subscription.status === "active"
      ) {
        subscription.status = "expired";
        await subscription.save();
      }
    }

    // Fetch updated subscriptions
    const updatedSubscriptions = await Subscription.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    for (const subscription of updatedSubscriptions) {
      if (!subscription.expiresAt || subscription.status !== "active" || subscription.canceled) continue;
      const remainingMs = new Date(subscription.expiresAt).getTime() - now.getTime();
      const daysRemaining = Math.ceil(remainingMs / 86400000);
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        const expiryKey = `subscription:expiring:${subscription._id}:${new Date(subscription.expiresAt).toISOString().slice(0, 10)}`;
        await createUserNotification(
          req.user.id,
          "Subscription expiring soon",
          `Your ${subscription.planName || subscription.plan} subscription (${subscription.uniqueId}) expires in ${daysRemaining} day(s), on ${new Date(subscription.expiresAt).toLocaleString("en-IN")}.`,
          "subscription",
          expiryKey,
          "/dashboard/subscription"
        );
      }
    }
    res.json({ subscriptions: updatedSubscriptions });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch subscriptions." });
  }
});

router.post("/user-subscriptions/:id/payment-request", authMiddleware, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user.id });
    if (!sub) return res.status(404).json({ message: "Subscription not found." });
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Enter a valid payment amount." });
    const confirmed = (sub.paymentEntries || []).filter(p => p.status === "confirmed").reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = (sub.paymentEntries || []).filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = Math.max(0, Number(sub.totalAmount || 0) - confirmed - pending);
    if (amount > balance + 0.01) return res.status(400).json({ message: "Payment request exceeds the unallocated outstanding balance." });
    sub.paymentEntries.push({ amount, method: "user-submitted", reference: String(req.body?.reference || "").slice(0, 120), note: "Payment submitted by user; verify receipt before confirming.", status: "pending", recordedAt: new Date() });
    await sub.save();
    res.status(201).json({ message: "Payment details submitted for admin verification.", subscription: sub });
  } catch (err) { res.status(500).json({ message: "Could not submit payment details." }); }
});

// Plans endpoints
router.get("/plans", async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch plans." });
  }
});

router.post("/plans", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ message: "Could not create plan." });
  }
});

router.put(
  "/plans/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.json({ plan });
    } catch (err) {
      res.status(500).json({ message: "Could not update plan." });
    }
  },
);

// Contact endpoints
router.post("/contact", async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ message: "Could not submit contact." });
  }
});

router.get("/contacts", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch contacts." });
  }
});

// Admin: Get all pending subscriptions
router.get(
  "/admin/pending-subscriptions",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subs = await Subscription.find({ status: "pending" }).populate(
        "user",
        "name email",
      );
      res.json({ subscriptions: subs });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Could not fetch pending subscriptions." });
    }
  },
);

// Admin: Get all approved subscriptions
router.get(
  "/admin/approved-subscriptions",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { status, search } = req.query;
      const now = new Date();
      // Keep the stored status in sync with the expiry date before listing.
      await Subscription.updateMany(
        { status: "active", canceled: { $ne: true }, expiresAt: { $ne: null, $lte: now } },
        { $set: { status: "expired" } }
      );

      let query = { status: { $in: ["active", "expired"] } };
      if (status === "cancelled") {
        query = { $or: [{ canceled: true }, { cancellationStatus: "approved" }] };
      } else if (status === "active") {
        query = { status: "active", canceled: { $ne: true }, cancellationStatus: { $ne: "approved" } };
      } else if (status === "expired") {
        query = { status: "expired", canceled: { $ne: true }, cancellationStatus: { $ne: "approved" } };
      } else if (!status || status === "all") {
        query = { $or: [
          { status: { $in: ["active", "expired"] }, canceled: { $ne: true }, cancellationStatus: { $ne: "approved" } },
          { canceled: true },
          { cancellationStatus: "approved" }
        ] };
      }

      if (search) {
        query.$and = [
          ...(query.$and || []),
          { $or: [
            { uniqueId: { $regex: search, $options: "i" } },
            { transactionId: { $regex: search, $options: "i" } },
          ] }
        ];
      }

      const subs = await Subscription.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      res.json({ subscriptions: subs });
    } catch (err) {
      console.error("Error fetching approved subscriptions:", err);
      res
        .status(500)
        .json({ message: "Could not fetch approved subscriptions." });
    }
  },
);

// Admin: Approve a subscription
router.patch(
  "/admin/approve-subscription/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const sub = await Subscription.findById(req.params.id);
      if (!sub) return res.status(404).json({ message: "Subscription not found." });
      if (sub.status !== "pending") {
        return res.status(409).json({ message: "Only a pending manual payment can be approved." });
      }
      if (String(sub.paymentMethod || "").toLowerCase() === "cashfree") {
        return res.status(409).json({ message: "Online payments can only be activated after Cashfree verification." });
      }
      if (!String(sub.transactionId || "").trim() && !String(sub.paymentImage || "").trim()) {
        return res.status(400).json({ message: "Payment proof or a transaction reference is required before manual approval." });
      }
      sub.status = "active";
      sub.paymentStatus = "paid";
      sub.amountPaid = Number(sub.amountPaid || sub.totalAmount || 0);
      sub.rejectionReason = "";
      if (sub.expiresAt && new Date(sub.expiresAt) <= new Date()) {
        const duration = Number(sub.durationDays || 0);
        if (duration > 0) sub.expiresAt = new Date(Date.now() + duration * 86400000);
      }
      await sub.save();
      if (sub.couponCode) {
        try {
          await Coupon.updateOne(
            { code: sub.couponCode, usedBy: { $ne: sub.user } },
            { $addToSet: { usedBy: sub.user }, $inc: { usedCount: 1 } },
          );
        } catch (couponError) {
          console.error("Manual coupon redemption count update failed:", couponError);
        }
      }
      res.json({ subscription: sub, message: "Manual payment approved and marked as paid." });
    } catch (err) {
      res.status(500).json({ message: "Could not approve subscription." });
    }
  },
);

// Admin: Reject a subscription with reason
router.patch(
  "/admin/reject-subscription/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const sub = await Subscription.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", rejectionReason: reason },
        { new: true },
      );
      res.json({ subscription: sub });
    } catch (err) {
      res.status(500).json({ message: "Could not reject subscription." });
    }
  },
);

// Admin: assign a plan and price directly to a user.
router.post("/admin/users/:id/assign-plan", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { planId, planName, totalAmount, durationDays, note } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    let resolvedName = String(planName || "").trim();
    let resolvedAmount = Number(totalAmount);
    let resolvedDays = Number(durationDays);
    let sourcePlan = null;
    if (planId) {
      sourcePlan = await Plan.findById(planId);
      if (!sourcePlan) return res.status(404).json({ message: "Selected existing plan was not found." });
      resolvedName = sourcePlan.name;
      resolvedAmount = Number(String(sourcePlan.price || "").replace(/[^0-9.]/g, ""));
      resolvedDays = parsePlanDurationDays(sourcePlan.duration);
    }
    if (!resolvedName || !Number.isFinite(resolvedAmount) || resolvedAmount < 0) {
      return res.status(400).json({ message: "Select a valid existing plan or enter a custom plan name and amount." });
    }
    if (!Number.isInteger(resolvedDays) || resolvedDays < 1 || resolvedDays > 3650) {
      return res.status(400).json({ message: "Plan validity must be between 1 and 3650 days." });
    }

    const now = new Date();
    await Subscription.updateMany(
      { user: user._id, status: "active", canceled: { $ne: true } },
      { $set: { status: "expired", canceled: true, cancellationInitiatedBy: "askc", cancellationReason: "Replaced by a newly assigned plan.", cancellationStatus: "approved", cancellationApprovedDate: now, cancellationRequestDate: now } }
    );
    const uniqueId = "ASKC-ADM-" + Date.now() + "-" + require("crypto").randomBytes(3).toString("hex").toUpperCase();
    const sub = await Subscription.create({
      user: user._id,
      plan: "starter",
      sourcePlan: sourcePlan?._id || null,
      planName: resolvedName,
      totalAmount: resolvedAmount,
      amountPaid: 0,
      paymentStatus: resolvedAmount === 0 ? "paid" : "pending",
      durationDays: resolvedDays,
      status: "active",
      uniqueId,
      expiresAt: new Date(now.getTime() + resolvedDays * 86400000),
      paymentEntries: [],
      adminNote: String(note || "").slice(0, 500)
    });
    await createUserNotification(
      user._id,
      "New subscription assigned",
      `ASKC TECHNOLOGIES assigned you the ${resolvedName} plan (ID: ${uniqueId}). Total amount: ₹${resolvedAmount.toLocaleString("en-IN")}.`,
      "subscription",
      `subscription:assigned:${sub._id}`,
      "/dashboard/subscription"
    );
    res.status(201).json({ subscription: sub, message: "Plan assigned successfully." });
  } catch (err) {
    console.error("Admin plan assignment failed:", err);
    res.status(500).json({ message: "Could not assign plan." });
  }
});

// Admin: immediately terminate or cancel a user's subscription.
router.patch("/admin/terminate-subscription/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim().slice(0, 500);
    if (!reason) return res.status(400).json({ message: "A termination reason is required." });
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found." });
    if (sub.canceled || sub.status === "expired") return res.status(400).json({ message: "This subscription is already inactive." });
    sub.canceled = true;
    sub.cancellationInitiatedBy = "askc";
    sub.cancellationReason = reason;
    sub.cancellationStatus = "approved";
    sub.cancellationApprovedDate = new Date();
    sub.status = "expired";
    await sub.save();
    res.json({ subscription: sub, message: "Subscription terminated successfully." });
  } catch (err) {
    console.error("Admin subscription termination failed:", err);
    res.status(500).json({ message: "Could not terminate subscription." });
  }
});

// Admin: record a confirmed instalment against a user's latest subscription.
router.post("/admin/users/:id/record-payment", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, method, reference, note } = req.body || {};
    const paid = Number(amount);
    if (!Number.isFinite(paid) || paid <= 0) return res.status(400).json({ message: "Enter a payment amount greater than zero." });
    const sub = await Subscription.findOne({ user: req.params.id }).sort({ createdAt: -1 });
    if (!sub) return res.status(404).json({ message: "Assign a plan before recording a payment." });
    const confirmed = (sub.paymentEntries || []).filter(p => p.status === "confirmed").reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const legacyPaid = sub.totalAmount > 0 ? 0 : Number(sub.amountPaid || 0);
    const balance = Math.max(0, Number(sub.totalAmount || 0) - confirmed - legacyPaid);
    if (paid > balance + 0.01) return res.status(400).json({ message: "Payment cannot exceed the outstanding balance." });
    const cleanReference = String(reference || "").trim().slice(0,120);
    const pendingEntry = (sub.paymentEntries || []).find(entry => entry.status === "pending" && Number(entry.amount) === paid && (!cleanReference || String(entry.reference || "").trim() === cleanReference));
    if (pendingEntry) {
      pendingEntry.status = "confirmed";
      pendingEntry.method = String(method || "manual");
      pendingEntry.recordedBy = req.user.id;
      pendingEntry.recordedAt = new Date();
      pendingEntry.note = String(note || "Verified by ASKC admin").slice(0,300);
    } else {
      sub.paymentEntries.push({ amount: paid, method: String(method || "manual"), reference: cleanReference, note: String(note || "").slice(0,300), status: "confirmed", recordedBy: req.user.id, recordedAt: new Date() });
    }
    const newPaid = confirmed + legacyPaid + paid;
    sub.amountPaid = newPaid;
    sub.paymentStatus = newPaid >= Number(sub.totalAmount || 0) ? "paid" : "partial";
    await sub.save();
    res.json({ subscription: sub, balanceDue: Math.max(0, Number(sub.totalAmount || 0) - newPaid), message: "Payment recorded." });
  } catch (err) {
    console.error("Payment ledger update failed:", err);
    res.status(500).json({ message: "Could not record payment." });
  }
});

// Admin: Get all users
router.get(
  "/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 }).lean();
      const ids = users.map(user => user._id);
      const subscriptions = await Subscription.find({ user: { $in: ids } }).sort({ createdAt: -1 }).lean();
      const latestByUser = new Map();
      subscriptions.forEach(sub => { const key = String(sub.user); if (!latestByUser.has(key)) latestByUser.set(key, sub); });
      res.json({ users: users.map(user => ({ ...user, latestSubscription: latestByUser.get(String(user._id)) || null })) });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch users." });
    }
  },
);

// Admin: Update user role
router.put(
  "/admin/users/:id/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { role } = req.body;

      // Validate role
      if (!role || !["user", "admin", "coadmin"].includes(role)) {
        return res.status(400).json({
          message: 'Invalid role. Must be "user", "admin", or "coadmin".',
        });
      }

      // Prevent admin from changing their own role
      if (req.params.id === req.user.id) {
        return res
          .status(400)
          .json({ message: "You cannot change your own role." });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      res.json({ user, message: "User role updated successfully." });
    } catch (err) {
      console.error("Error updating user role:", err);
      res.status(500).json({ message: "Could not update user role." });
    }
  },
);

// Admin: Get site statistics
router.get(
  "/admin/stats",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const subCount = await Subscription.countDocuments();
      const activeSubs = await Subscription.countDocuments({
        status: "active",
        cancellationStatus: { $ne: "approved" },
      });

      // Get all plans to map plan names to prices
      const plans = await Plan.find();
      const planPriceMap = {};
      plans.forEach((plan) => {
        // Map plan name to price (handle different naming conventions)
        const planNameLower = plan.name.toLowerCase();
        let planKey = "";
        if (
          planNameLower.includes("starter") ||
          planNameLower.includes("basic")
        ) {
          planKey = "starter";
        } else if (planNameLower.includes("premium")) {
          planKey = "premium";
        } else if (planNameLower.includes("pro")) {
          planKey = "pro";
        }
        if (planKey) {
          planPriceMap[planKey] = parseFloat(plan.price) || 0;
        }
      });

      // Calculate total revenue from all approved subscriptions (active, expired, or were active)
      // Exclude rejected and pending subscriptions
      const paidSubscriptions = await Subscription.find({
        status: { $in: ["active", "expired"] },
        cancellationStatus: { $ne: "approved" }, // Don't count cancelled subscriptions
      });

      let totalRevenue = 0;
      paidSubscriptions.forEach((sub) => {
        const planPrice = planPriceMap[sub.plan] || 0;
        totalRevenue += planPrice;
      });

      res.json({
        userCount,
        subCount,
        activeSubs,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      res.status(500).json({ message: "Could not fetch stats." });
    }
  },
);

// Admin/Co-Admin: Get funds balance and statements
router.get(
  "/admin/funds",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const transactions = await FundTransaction.find()
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

      const balance = transactions.reduce((total, item) => {
        if (item.type === "add") return total + item.amount;
        return total - item.amount;
      }, 0);

      res.json({
        balance: Math.max(0, Math.round(balance * 100) / 100),
        transactions,
      });
    } catch (err) {
      console.error("Error fetching funds:", err);
      res.status(500).json({ message: "Could not fetch funds data." });
    }
  },
);

// Admin/Co-Admin: Add or withdraw funds
router.post(
  "/admin/funds",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { type, amount, reason } = req.body;
      const normalizedType = String(type || "")
        .trim()
        .toLowerCase();
      const parsedAmount = Number(amount);
      const normalizedReason = String(reason || "").trim();

      if (!["add", "withdraw"].includes(normalizedType)) {
        return res.status(400).json({ message: "Invalid transaction type." });
      }
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be greater than zero." });
      }
      if (!normalizedReason) {
        return res.status(400).json({ message: "Reason is required." });
      }

      const transactions = await FundTransaction.find().sort({ createdAt: -1 });
      const currentBalance = transactions.reduce((total, item) => {
        if (item.type === "add") return total + item.amount;
        return total - item.amount;
      }, 0);

      if (normalizedType === "withdraw" && parsedAmount > currentBalance) {
        return res
          .status(400)
          .json({ message: "Insufficient funds for withdrawal." });
      }

      const transaction = await FundTransaction.create({
        type: normalizedType,
        amount: Math.round(parsedAmount * 100) / 100,
        reason: normalizedReason,
        createdBy: req.user.id,
      });

      const updatedBalance =
        normalizedType === "add"
          ? currentBalance + transaction.amount
          : currentBalance - transaction.amount;

      const populated = await FundTransaction.findById(
        transaction._id,
      ).populate("createdBy", "name email role");

      res.status(201).json({
        message:
          normalizedType === "add"
            ? "Funds added successfully."
            : "Funds withdrawn successfully.",
        transaction: populated,
        balance: Math.max(0, Math.round(updatedBalance * 100) / 100),
      });
    } catch (err) {
      console.error("Error updating funds:", err);
      res.status(500).json({ message: "Could not process fund transaction." });
    }
  },
);

// Admin: Send notification
router.post(
  "/admin/notifications",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { message } = req.body;
      const notification = await Notification.create({ message });
      res.status(201).json({ notification });
    } catch (err) {
      res.status(500).json({ message: "Could not send notification." });
    }
  },
);

// Admin: Get all notifications
router.get(
  "/admin/notifications",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.json({ notifications });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch notifications." });
    }
  },
);

// Admin: Delete a plan
router.delete(
  "/plans/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      await Plan.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Could not delete plan." });
    }
  },
);

router.post("/user/update", authMiddleware, updateUserProfile);
router.post("/user/change-password", authMiddleware, changeUserPassword);
router.get("/notifications", authMiddleware, getUserNotifications);
router.post("/notifications/read/:id", authMiddleware, markNotificationRead);
router.post("/notifications/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ user: req.user.id }, { user: null }], readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Could not mark all notifications as read." });
  }
});
router.post("/cancel-subscription/:id", authMiddleware, cancelUserSubscription);
router.post("/renew-subscription", authMiddleware, renewUserSubscription);

router.get(
  "/admin/all-subscriptions",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subs = await Subscription.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      // Check and update expired subscriptions
      const now = new Date();
      for (let subscription of subs) {
        if (
          subscription.expiresAt &&
          subscription.expiresAt < now &&
          subscription.status === "active"
        ) {
          subscription.status = "expired";
          await subscription.save();
        }
      }

      // Fetch updated subscriptions
      const updatedSubs = await Subscription.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });
      res.json({ subscriptions: updatedSubs });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch subscriptions." });
    }
  },
);

// Add this route for user notifications
// User: view refund and cancellation progress for the signed-in account only.
router.get("/user/refunds", authMiddleware, async (req, res) => {
  try {
    const records = await Subscription.find({
      user: req.user.id,
      $or: [
        { cancellationStatus: { $in: ["pending", "approved", "rejected"] } },
        { canceled: true },
        { refundStatus: { $exists: true, $nin: ["", "not_reviewed"] } }
      ]
    })
      .select("plan planName uniqueId status canceled cancellationInitiatedBy cancellationStatus cancellationRequestDate cancellationReason cancellationRejectionReason refundStatus refundEligible refundAmount refundReason refundReference refundProcessedAt paymentStatus paymentMethod amountPaid paymentEntries createdAt updatedAt")
      .sort({ cancellationRequestDate: -1, updatedAt: -1, createdAt: -1 })
      .limit(100)
      .lean();

    const refunds = records.map((sub) => {
      const cashfreePaid = ["paid", "partial", "success", "successful"].includes(String(sub.paymentStatus || "").toLowerCase())
        ? Number(sub.amountPaid || 0) : 0;
      const manualPaid = Array.isArray(sub.paymentEntries)
        ? sub.paymentEntries.filter((entry) => entry.status === "confirmed")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
        : 0;
      return {
        _id: sub._id,
        plan: sub.plan,
        planName: sub.planName,
        uniqueId: sub.uniqueId,
        subscriptionStatus: sub.status,
        canceled: sub.canceled === true,
        cancellationInitiatedBy: sub.cancellationInitiatedBy || "",
        cancellationStatus: sub.cancellationStatus || "none",
        cancellationRequestDate: sub.cancellationRequestDate,
        cancellationReason: sub.cancellationReason,
        cancellationRejectionReason: sub.cancellationRejectionReason,
        refundStatus: sub.refundStatus || "not_reviewed",
        refundEligible: sub.refundEligible === true,
        refundAmount: Number(sub.refundAmount || 0),
        refundReason: sub.refundReason || "",
        refundReference: sub.refundReference || "",
        refundProcessedAt: sub.refundProcessedAt || null,
        paymentStatus: sub.paymentStatus || "",
        paymentMethod: sub.paymentMethod || "",
        paidAmount: Math.max(cashfreePaid, manualPaid),
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      };
    });

    res.set("Cache-Control", "no-store");
    res.json({ refunds });
  } catch (err) {
    console.error("User refund history error:", err);
    res.status(500).json({ message: "Could not load your refund details." });
  }
});

router.get("/user-notifications", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const expiringSubscriptions = await Subscription.find({
      user: req.user.id,
      status: "active",
      canceled: { $ne: true },
      expiresAt: { $gte: now, $lte: new Date(now.getTime() + 7 * 86400000) },
    });
    for (const subscription of expiringSubscriptions) {
      const daysRemaining = Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - now.getTime()) / 86400000));
      const expiryKey = `subscription:expiring:${subscription._id}:${new Date(subscription.expiresAt).toISOString().slice(0, 10)}`;
      await createUserNotification(
        req.user.id,
        "Subscription expiring soon",
        `Your ${subscription.planName || subscription.plan} subscription (${subscription.uniqueId}) expires in ${daysRemaining} day(s), on ${new Date(subscription.expiresAt).toLocaleString("en-IN")}.`,
        "subscription",
        expiryKey,
        "/dashboard/subscription"
      );
    }
    const notifications = await Notification.find({
      $and: [
        { $or: [{ user: req.user.id }, { user: null }] },
        {
          $or: [
            { expiresAt: { $gt: new Date() } }, // Not expired
            { expiresAt: { $exists: false } }, // No expiration set (backward compatibility)
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    res.json({
      notifications: notifications.map((n) => ({
        _id: n._id,
        title: n.title || "Notification",
        message: n.message,
        createdAt: n.createdAt,
        read: n.readBy && n.readBy.some((id) => String(id) === String(req.user.id)),
        type: n.type || 'general',
        link: n.link || '',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch notifications." });
  }
});

// User: Submit a complaint
router.post("/complaints", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ message: "Message is required." });
    const complaint = await Complaint.create({ user: req.user.id, message });
    res.status(201).json({ complaint });
  } catch (err) {
    res.status(500).json({ message: "Could not submit complaint." });
  }
});

// User: Get all their complaints
router.get("/complaints", authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch complaints." });
  }
});

// Admin: Get all complaints
router.get(
  "/admin/complaints",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const complaints = await Complaint.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });
      res.json({ complaints });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch complaints." });
    }
  },
);

// Admin: Update complaint status
router.patch(
  "/admin/complaints/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, ...(typeof req.body.response === "string" ? { response: req.body.response.trim().slice(0, 3000) } : {}) },
        { new: true },
      );
      res.json({ complaint });
    } catch (err) {
      res.status(500).json({ message: "Could not update complaint." });
    }
  },
);

// Helpers to decide complaint access (user vs admin/coadmin)
function getComplaintQueryForUserOrAdmin(req) {
  if (req.user && (req.user.role === "admin" || req.user.role === "coadmin")) {
    return { _id: req.params.id };
  }
  return { _id: req.params.id, user: req.user.id };
}

// User/Admin: Get a specific complaint
router.get("/complaints/:id", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(
      getComplaintQueryForUserOrAdmin(req),
    );
    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Complaint not found or access denied." });
    }
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch complaint." });
  }
});

// User/Admin: Get chat messages for a complaint
router.get("/complaints/:id/chat", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(
      getComplaintQueryForUserOrAdmin(req),
    );
    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Complaint not found or access denied." });
    }
    res.json({ chat: complaint.chat || [] });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chat." });
  }
});

// User/Admin: Send a message in complaint chat
router.post("/complaints/:id/chat", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    const complaint = await Complaint.findOne(
      getComplaintQueryForUserOrAdmin(req),
    );
    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Complaint not found or access denied." });
    }

    const from =
      req.user && (req.user.role === "admin" || req.user.role === "coadmin")
        ? "admin"
        : "user";
    const newMessage = {
      from,
      text: text,
      time: new Date(),
    };

    complaint.chat.push(newMessage);
    await complaint.save();

    res.json({ chat: complaint.chat });
  } catch (err) {
    res.status(500).json({ message: "Could not send message." });
  }
});

// ID Card Endpoints
router.post(
  "/admin/id-cards",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const name = String(req.body?.name || "").trim();
      const role = String(req.body?.role || "").trim();
      const idNumber = String(req.body?.idNumber || "").trim().toUpperCase();
      const photoInput = typeof req.body?.photo === "string" ? req.body.photo : "";
      const photo = await uploadDataUri(photoInput, "askc-technologies/id-cards");

      if (!name || !role || !idNumber) {
        return res.status(400).json({ message: "Employee name, job position and ID number are required." });
      }
      if (name.length > 100 || role.length > 80 || idNumber.length > 40) {
        return res.status(400).json({ message: "One or more ID card fields exceed the allowed length." });
      }
      if (photo.length > 8 * 1024 * 1024) {
        return res.status(413).json({ message: "Photo is too large. Please upload a smaller image (under 5 MB)." });
      }

      const existingCard = await IDCard.findOne({ idNumber }).select("_id").lean();
      if (existingCard) {
        return res.status(409).json({ message: "This employee ID number is already in use. Generate a new ID number." });
      }

      const idCard = await IDCard.create({ name, role, idNumber, photo });
      return res.status(201).json({ idCard, message: "ID card saved successfully." });
    } catch (err) {
      console.error("ID Card save error:", err);
      if (err.name === "ValidationError") {
        return res.status(400).json({ message: "Please check the ID card details and try again." });
      }
      return res.status(500).json({ message: "Could not save ID card. Please try again." });
    }
  },
);

// Admin: Get single ID card
router.get(
  "/admin/id-cards/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const idCard = await IDCard.findById(req.params.id);
      if (!idCard) return res.status(404).json({ message: "ID Card not found." });
      res.json({ idCard });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch ID card." });
    }
  },
);

// Public: Get single ID card for sharing
router.get("/public/id-cards/:id", async (req, res) => {
  try {
    const idCard = await IDCard.findById(req.params.id).select("-__v");
    if (!idCard) return res.status(404).json({ message: "ID Card not found." });
    res.json({ idCard });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch ID card." });
  }
});

router.get(
  "/admin/id-cards",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const idCards = await IDCard.find().sort({ createdAt: -1 });
      res.json({ idCards });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch ID cards." });
    }
  },
);

router.delete(
  "/admin/id-cards/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      await IDCard.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "ID Card deleted successfully." });
    } catch (err) {
      res.status(500).json({ message: "Could not delete ID card." });
    }
  },
);

// User: Request subscription renewal
router.post("/renewal-request", authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ message: "Subscription ID is required." });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: req.user.id,
    });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found." });
    }

    if (subscription.renewalStatus === "pending") {
      return res.status(400).json({
        message: "A renewal request is already pending for this subscription.",
      });
    }

    if (subscription.status !== "expired") {
      return res
        .status(400)
        .json({ message: "Only expired subscriptions can be renewed." });
    }

    subscription.renewalRequested = true;
    subscription.renewalRequestDate = new Date();
    subscription.renewalStatus = "pending";
    subscription.renewalRejectionReason = undefined;
    await subscription.save();

    res.json({
      subscription,
      message: "Renewal request submitted successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: "Could not submit renewal request." });
  }
});

// Admin: Get all renewal requests
router.get(
  "/admin/renewal-requests",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscriptions = await Subscription.find({
        renewalRequested: true,
        renewalStatus: "pending",
      })
        .populate("user", "name email")
        .sort({ renewalRequestDate: -1 });
      res.json({ subscriptions });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch renewal requests." });
    }
  },
);

// Admin: Approve renewal request
router.patch(
  "/admin/renewal-requests/:id/approve",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscription = await Subscription.findById(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found." });
      }

      if (
        !subscription.renewalRequested ||
        subscription.renewalStatus !== "pending"
      ) {
        return res
          .status(400)
          .json({ message: "No pending renewal request found." });
      }

      const plan = await Plan.findOne({
        name: new RegExp("^" + subscription.plan + "$", "i"),
      });
      if (!plan) {
        return res.status(400).json({ message: "Plan not found." });
      }

      const now = new Date();
      const durationInDays = parsePlanDurationDays(plan.duration);
      const newExpiryDate = new Date(
        now.getTime() + durationInDays * 24 * 60 * 60 * 1000,
      );

      subscription.status = "active";
      subscription.expiresAt = newExpiryDate;
      subscription.renewalStatus = "approved";
      subscription.renewalApprovedDate = now;
      subscription.renewalRequested = false;
      await subscription.save();

      res.json({
        subscription,
        message: "Renewal request approved successfully.",
      });
    } catch (err) {
      res.status(500).json({ message: "Could not approve renewal request." });
    }
  },
);

// Admin: Reject renewal request
router.patch(
  "/admin/renewal-requests/:id/reject",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required." });
      }

      const subscription = await Subscription.findById(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found." });
      }

      if (
        !subscription.renewalRequested ||
        subscription.renewalStatus !== "pending"
      ) {
        return res
          .status(400)
          .json({ message: "No pending renewal request found." });
      }

      subscription.renewalStatus = "rejected";
      subscription.renewalRejectionReason = reason;
      subscription.renewalRequested = false;
      await subscription.save();

      res.json({
        subscription,
        message: "Renewal request rejected successfully.",
      });
    } catch (err) {
      res.status(500).json({ message: "Could not reject renewal request." });
    }
  },
);

// Newsletter sign-up uses double opt-in: consent is recorded only after
// the mailbox owner follows the short-lived confirmation link.
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    if (!/^[a-z0-9.!#$%&'*+/=?^\`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });
    if (existing?.status === "subscribed" && existing.consentedAt) {
      return res.json({ message: "This email is already subscribed." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await NewsletterSubscriber.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { status: "pending", consentedAt: null, confirmationTokenHash: tokenHash, confirmationTokenExpiresAt: expiresAt, unsubscribeTokenHash: null, consentSource: "newsletter-double-opt-in" } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const siteOrigin = getPublicSiteOrigin();
    if (!siteOrigin) return res.status(503).json({ message: "Email confirmation is temporarily unavailable." });
    const confirmUrl = siteOrigin.replace(/\/+$/, "") + "/api/auth/newsletter/confirm?token=" + token;
    await sendEmail(
      normalizedEmail,
      "Confirm your ASKC TECHNOLOGIES email subscription",
      "Confirm your subscription: " + confirmUrl + "\nThis link expires in 30 minutes. Ignore this email if you did not request it.",
      "<div style='font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#172033'><h2>ASKC TECHNOLOGIES</h2><h3>Confirm your email subscription</h3><p>Click below to confirm promotional updates.</p><p><a href='" + confirmUrl + "' style='display:inline-block;padding:12px 18px;background:#1756a2;color:#fff;text-decoration:none;border-radius:8px'>Confirm subscription</a></p><p>This link expires in 30 minutes.</p></div>",
    );
    return res.status(202).json({ message: "Please check your inbox and confirm your email address to complete subscription." });
  } catch (err) {
    console.error("Newsletter double opt-in failed:", err);
    return res.status(500).json({ message: "Could not start newsletter subscription." });
  }
});

router.get("/newsletter/confirm", async (req, res) => {
  try {
    const token = String(req.query.token || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(400).send("Invalid or expired confirmation link.");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const subscriber = await NewsletterSubscriber.findOne({
      confirmationTokenHash: tokenHash,
      confirmationTokenExpiresAt: { $gt: new Date() },
      status: "pending",
    }).select("+confirmationTokenHash");
    if (!subscriber) return res.status(410).send("This confirmation link has expired or was already used. Please subscribe again.");
    subscriber.status = "subscribed";
    subscriber.consentedAt = new Date();
    subscriber.confirmationTokenHash = null;
    subscriber.confirmationTokenExpiresAt = null;
    await subscriber.save();
    await User.updateOne({ email: subscriber.email }, { $set: { marketingConsent: true, marketingConsentAt: subscriber.consentedAt, subscribeOffers: true } });
    return res.redirect((getPublicSiteOrigin() || "https://askctechnologies.in") + "/?newsletter=confirmed");
  } catch (error) {
    console.error("Newsletter confirmation failed:", error);
    return res.status(500).send("Could not confirm your subscription.");
  }
});

// An email address alone is never sufficient to unsubscribe someone.
router.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const token = String(req.body.token || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(400).json({ message: "A valid unsubscribe link is required." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const subscriber = await NewsletterSubscriber.findOne({ unsubscribeTokenHash: tokenHash }).select("+unsubscribeTokenHash");
    if (!subscriber) return res.status(410).json({ message: "This unsubscribe link is invalid or has already been used." });
    subscriber.status = "unsubscribed";
    subscriber.consentedAt = null;
    subscriber.unsubscribeTokenHash = null;
    await subscriber.save();
    await User.updateOne({ email: subscriber.email }, { $set: { marketingConsent: false, marketingConsentAt: null, subscribeOffers: false } });
    return res.json({ message: "You have been unsubscribed successfully." });
  } catch (err) {
    console.error("Newsletter unsubscribe failed:", err);
    return res.status(500).json({ message: "Could not unsubscribe." });
  }
});

// Admin: Get all newsletter subscribers (show all with status)
router.get(
  "/admin/newsletter-subscribers",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscribers = await NewsletterSubscriber.find().sort({
        createdAt: -1,
      });
      res.json({ subscribers });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch subscribers." });
    }
  },
);

// Admin: Remove an unsubscribe record. This does NOT grant consent; a fresh opt-in is still required.
router.delete(
  "/admin/newsletter-unsubscribed/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const record = await NewsletterSubscriber.findOne({ _id: req.params.id, status: "unsubscribed" });
      if (!record) return res.status(404).json({ message: "Unsubscribe record not found." });
      await NewsletterSubscriber.deleteOne({ _id: record._id });
      return res.json({ success: true, message: "Unsubscribe record deleted. A new explicit opt-in is required before promotional emails can be sent." });
    } catch (err) {
      return res.status(500).json({ message: "Could not delete unsubscribe record." });
    }
  },
);

// Admin: Get unsubscribed newsletter users
router.get(
  "/admin/newsletter-unsubscribed",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscribers = await NewsletterSubscriber.find({
        status: "unsubscribed",
      }).sort({ updatedAt: -1 });
      res.json({ subscribers });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch unsubscribed users." });
    }
  },
);

// Redundant definitions removed (moved to top)


router.use(cookieParser());

router.post("/register", registerUser);
router.get("/captcha", getLoginCaptcha);
router.post("/login", loginUser);


// Forgot Password Routes
router.post("/forgot-password/verify-email", verifyEmailForPasswordReset);
router.post("/forgot-password/reset", resetPassword);

// Google Auth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    // Successful authentication, redirect or send token
    const sessionId = crypto.randomUUID();
    const sessionIp = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].slice(0, 100);
    const sessionAgent = String(req.headers["user-agent"] || "").slice(0, 500);
    const loginState = await User.findByIdAndUpdate(req.user._id, {
      $set: { lastLoginAt: new Date(), lastLoginIp: sessionIp, lastLoginUserAgent: sessionAgent },
      $push: { sessions: { $each: [{ sessionId, createdAt: new Date(), lastSeenAt: new Date(), ip: sessionIp, userAgent: sessionAgent, revokedAt: null }], $slice: -30 } },
    }, { new: true }).select("sessionVersion");
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role, sv: Number(loginState?.sessionVersion || 0), sid: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Handle multiple frontend URLs
    const clientUrl =
      process.env.CLIENT_URL || "http://localhost:3000/dashboard";
    res.redirect(clientUrl);
  },
);

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Middleware to protect routes
async function authMiddleware(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied." });
  }
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "changeme") return res.status(503).json({ message: "Authentication is temporarily unavailable." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose === "two-factor-login") return res.status(401).json({ message: "Complete the login verification first." });
    const account = await User.findById(decoded.id).select("sessionVersion role sessions").lean();
    if (!account || Number(decoded.sv || 0) !== Number(account.sessionVersion || 0)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }
    if (!decoded.sid) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Please sign in again to establish a secure device session." });
    }
    const activeSession = (account.sessions || []).some((session) => session.sessionId === decoded.sid && !session.revokedAt);
    if (!activeSession) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "This device session has been signed out. Please log in again." });
    }
    req.user = { ...decoded, role: account.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid." });
  }
}

// Admin middleware (only admin)
function adminMiddleware(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin access required." });
}

// Co-admin middleware (admin or coadmin)
function coAdminMiddleware(req, res, next) {
  if (req.user && (req.user.role === "admin" || req.user.role === "coadmin"))
    return next();
  return res
    .status(403)
    .json({ message: "Admin or Co-admin access required." });
}

/**
 * Absolute base URL of the public website (scheme + host, no trailing slash).
 * Used for links inside emails so they never point to localhost in production.
 */
function getPublicSiteOrigin() {
  const explicit =
    process.env.PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.PROMOTIONAL_UNSUBSCRIBE_URL ||
    process.env.REACT_APP_API_URL;

  const canonicalOrigin = "https://askctechnologies.in";
  if (explicit && String(explicit).trim()) {
    const raw = String(explicit).trim();
    try {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      const hostname = u.hostname.toLowerCase().replace(/^www\./, "");
      // Migrate legacy ASKC Web domains to the official ASKC Technologies domain.
      if (hostname === "askcweb.in") return canonicalOrigin;
      if (hostname === "askctechnologies.in") return canonicalOrigin;
      return u.origin.replace(/\/$/, "");
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return canonicalOrigin;
}

// Create a new subscription (after payment)
router.post(
  "/subscribe",
  authMiddleware,
  upload.single("paymentImage"),
  async (req, res) => {
    // Keep this legacy duplicate route protected too; never trust frontend-only mode controls.
    if (await getCheckoutPaymentMode() !== "manual") {
      return res.status(403).json({ message: "Manual payment submissions are disabled. Complete payment through the configured online gateway." });
    }
    if (!(await PaymentOption.countDocuments({ isActive: true }))) {
      return res.status(503).json({ message: "Manual payment is not configured. Please contact ASKC Technologies." });
    }
    // Get data from FormData (req.body) or JSON (req.body)
    let { plan, transactionId, method } = req.body;
    const paymentImage = req.file;

    // Debug: Log the entire request
    console.log("Subscription request body:", req.body);
    console.log(
      "Subscription request file:",
      paymentImage
        ? { name: paymentImage.originalname, size: paymentImage.size }
        : "none",
    );
    console.log("Subscription request:", {
      plan,
      planType: typeof plan,
      transactionId,
      method,
      hasImage: !!paymentImage,
      userId: req.user.id,
      userEmail: req.user.email,
    });

    // More flexible plan validation - handle both string and other types
    if (!plan) {
      return res.status(400).json({ message: "Plan is required." });
    }

    // Convert plan to string if it's not already
    plan = String(plan).trim();

    if (!plan || plan.length === 0) {
      return res.status(400).json({ message: "Plan is required." });
    }

    // Validate transaction ID if provided
    if (transactionId && typeof transactionId !== "string") {
      return res
        .status(400)
        .json({ message: "Transaction ID must be a string." });
    }

    // Validate payment method if provided
    if (method && !["upi", "card", "netbanking"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    // Find plan by name (case-insensitive)
    const planDoc = await Plan.findOne({
      name: { $regex: new RegExp("^" + plan + "$", "i") },
    });

    if (!planDoc) {
      console.log("Plan not found:", plan);
      console.log("Available plans:", await Plan.find().select("name"));
      return res.status(400).json({ message: "Plan not found." });
    }

    // Verify user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Map plan name to subscription enum values
    let planEnum;
    const planNameLower = planDoc.name.toLowerCase();
    if (planNameLower.includes("starter") || planNameLower.includes("basic")) {
      planEnum = "starter";
    } else if (planNameLower.includes("premium")) {
      planEnum = "premium";
    } else if (planNameLower.includes("pro")) {
      planEnum = "pro";
    } else {
      // Default to starter if no match found
      planEnum = "starter";
    }

    const uniqueId =
      "SUB-" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 6).toUpperCase();
    const now = new Date();

    // Ensure plan duration is valid
    const durationInDays = parsePlanDurationDays(planDoc.duration);
    const expiresAt = new Date(
      now.getTime() + durationInDays * 24 * 60 * 60 * 1000,
    );

    // Convert payment image to base64 if provided
    let paymentImageBase64 = null;
    if (paymentImage) {
      paymentImageBase64 = (await uploadImageBuffer(paymentImage.buffer, paymentImage.mimetype, "askc-technologies/payment-proofs")).url;
    }

    try {
      const subscription = await Subscription.create({
        user: req.user.id,
        plan: planEnum,
        uniqueId,
        status: "pending",
        expiresAt,
        transactionId: transactionId || null,
        paymentMethod: method || "upi",
        paymentImage: paymentImageBase64,
      });
      res.status(201).json({ subscription });
    } catch (err) {
      console.error("Subscription creation error:", err);
      console.error("Error details:", {
        user: req.user.id,
        plan: planEnum,
        planDoc: planDoc.name,
        error: err.message,
        validationErrors: err.errors,
      });
      res.status(500).json({ message: "Could not create subscription." });
    }
  },
);

// Get all subscriptions for the logged-in user
router.get("/user-subscriptions", authMiddleware, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // Check and update expired subscriptions
    const now = new Date();
    for (let subscription of subscriptions) {
      if (
        subscription.expiresAt &&
        subscription.expiresAt < now &&
        subscription.status === "active"
      ) {
        subscription.status = "expired";
        await subscription.save();
      }
    }

    // Fetch updated subscriptions
    const updatedSubscriptions = await Subscription.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });
    res.json({ subscriptions: updatedSubscriptions });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch subscriptions." });
  }
});

// Plans endpoints
router.get("/plans", async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch plans." });
  }
});

router.post("/plans", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ message: "Could not create plan." });
  }
});

router.put(
  "/plans/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.json({ plan });
    } catch (err) {
      res.status(500).json({ message: "Could not update plan." });
    }
  },
);

// Contact endpoints
router.post("/contact", async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ message: "Could not submit contact." });
  }
});

router.get("/contacts", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch contacts." });
  }
});

// Admin: Get all pending subscriptions
router.get(
  "/admin/pending-subscriptions",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subs = await Subscription.find({ status: "pending" }).populate(
        "user",
        "name email",
      );
      res.json({ subscriptions: subs });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Could not fetch pending subscriptions." });
    }
  },
);

// Admin: Get all approved subscriptions
router.get(
  "/admin/approved-subscriptions",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { status, search } = req.query;
      const now = new Date();
      // Keep the stored status in sync with the expiry date before listing.
      await Subscription.updateMany(
        { status: "active", canceled: { $ne: true }, expiresAt: { $ne: null, $lte: now } },
        { $set: { status: "expired" } }
      );

      let query = { status: { $in: ["active", "expired"] } };
      if (status === "cancelled") {
        query = { $or: [{ canceled: true }, { cancellationStatus: "approved" }] };
      } else if (status === "active") {
        query = { status: "active", canceled: { $ne: true }, cancellationStatus: { $ne: "approved" } };
      } else if (status === "expired") {
        query = { status: "expired", canceled: { $ne: true }, cancellationStatus: { $ne: "approved" } };
      } else if (!status || status === "all") {
        query = { $or: [
          { status: { $in: ["active", "expired"] }, canceled: { $ne: true }, cancellationStatus: { $ne: "approved" } },
          { canceled: true },
          { cancellationStatus: "approved" }
        ] };
      }

      if (search) {
        query.$and = [
          ...(query.$and || []),
          { $or: [
            { uniqueId: { $regex: search, $options: "i" } },
            { transactionId: { $regex: search, $options: "i" } },
          ] }
        ];
      }

      const subs = await Subscription.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      res.json({ subscriptions: subs });
    } catch (err) {
      console.error("Error fetching approved subscriptions:", err);
      res
        .status(500)
        .json({ message: "Could not fetch approved subscriptions." });
    }
  },
);

// Admin: Approve a subscription
router.patch(
  "/admin/approve-subscription/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const sub = await Subscription.findById(req.params.id);
      if (!sub) return res.status(404).json({ message: "Subscription not found." });
      if (sub.status !== "pending") {
        return res.status(409).json({ message: "Only a pending manual payment can be approved." });
      }
      if (String(sub.paymentMethod || "").toLowerCase() === "cashfree") {
        return res.status(409).json({ message: "Online payments can only be activated after Cashfree verification." });
      }
      if (!String(sub.transactionId || "").trim() && !String(sub.paymentImage || "").trim()) {
        return res.status(400).json({ message: "Payment proof or a transaction reference is required before manual approval." });
      }
      sub.status = "active";
      sub.paymentStatus = "paid";
      sub.amountPaid = Number(sub.amountPaid || sub.totalAmount || 0);
      sub.rejectionReason = "";
      if (sub.expiresAt && new Date(sub.expiresAt) <= new Date()) {
        const duration = Number(sub.durationDays || 0);
        if (duration > 0) sub.expiresAt = new Date(Date.now() + duration * 86400000);
      }
      await sub.save();
      if (sub.couponCode) {
        try {
          await Coupon.updateOne(
            { code: sub.couponCode, usedBy: { $ne: sub.user } },
            { $addToSet: { usedBy: sub.user }, $inc: { usedCount: 1 } },
          );
        } catch (couponError) {
          console.error("Manual coupon redemption count update failed:", couponError);
        }
      }
      res.json({ subscription: sub, message: "Manual payment approved and marked as paid." });
    } catch (err) {
      res.status(500).json({ message: "Could not approve subscription." });
    }
  },
);

// Admin: Reject a subscription with reason
router.patch(
  "/admin/reject-subscription/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const sub = await Subscription.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", rejectionReason: reason },
        { new: true },
      );
      res.json({ subscription: sub });
    } catch (err) {
      res.status(500).json({ message: "Could not reject subscription." });
    }
  },
);

// Admin: Get all users
router.get(
  "/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json({ users });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch users." });
    }
  },
);

// Admin: Update user role
router.put(
  "/admin/users/:id/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { role } = req.body;

      // Validate role
      if (!role || !["user", "admin", "coadmin"].includes(role)) {
        return res.status(400).json({
          message: 'Invalid role. Must be "user", "admin", or "coadmin".',
        });
      }

      // Prevent admin from changing their own role
      if (req.params.id === req.user.id) {
        return res
          .status(400)
          .json({ message: "You cannot change your own role." });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      res.json({ user, message: "User role updated successfully." });
    } catch (err) {
      console.error("Error updating user role:", err);
      res.status(500).json({ message: "Could not update user role." });
    }
  },
);

// Admin: Get site statistics
router.get(
  "/admin/stats",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const subCount = await Subscription.countDocuments();
      const activeSubs = await Subscription.countDocuments({
        status: "active",
        cancellationStatus: { $ne: "approved" },
      });

      // Get all plans to map plan names to prices
      const plans = await Plan.find();
      const planPriceMap = {};
      plans.forEach((plan) => {
        // Map plan name to price (handle different naming conventions)
        const planNameLower = plan.name.toLowerCase();
        let planKey = "";
        if (
          planNameLower.includes("starter") ||
          planNameLower.includes("basic")
        ) {
          planKey = "starter";
        } else if (planNameLower.includes("premium")) {
          planKey = "premium";
        } else if (planNameLower.includes("pro")) {
          planKey = "pro";
        }
        if (planKey) {
          planPriceMap[planKey] = parseFloat(plan.price) || 0;
        }
      });

      // Calculate total revenue from all approved subscriptions (active, expired, or were active)
      // Exclude rejected and pending subscriptions
      const paidSubscriptions = await Subscription.find({
        status: { $in: ["active", "expired"] },
        cancellationStatus: { $ne: "approved" }, // Don't count cancelled subscriptions
      });

      let totalRevenue = 0;
      paidSubscriptions.forEach((sub) => {
        const planPrice = planPriceMap[sub.plan] || 0;
        totalRevenue += planPrice;
      });

      res.json({
        userCount,
        subCount,
        activeSubs,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      res.status(500).json({ message: "Could not fetch stats." });
    }
  },
);

// Admin/Co-Admin: Get funds balance and statements
router.get(
  "/admin/funds",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const transactions = await FundTransaction.find()
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

      const balance = transactions.reduce((total, item) => {
        if (item.type === "add") return total + item.amount;
        return total - item.amount;
      }, 0);

      res.json({
        balance: Math.max(0, Math.round(balance * 100) / 100),
        transactions,
      });
    } catch (err) {
      console.error("Error fetching funds:", err);
      res.status(500).json({ message: "Could not fetch funds data." });
    }
  },
);

// Admin/Co-Admin: Add or withdraw funds
router.post(
  "/admin/funds",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { type, amount, reason } = req.body;
      const normalizedType = String(type || "")
        .trim()
        .toLowerCase();
      const parsedAmount = Number(amount);
      const normalizedReason = String(reason || "").trim();

      if (!["add", "withdraw"].includes(normalizedType)) {
        return res.status(400).json({ message: "Invalid transaction type." });
      }
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be greater than zero." });
      }
      if (!normalizedReason) {
        return res.status(400).json({ message: "Reason is required." });
      }

      const transactions = await FundTransaction.find().sort({ createdAt: -1 });
      const currentBalance = transactions.reduce((total, item) => {
        if (item.type === "add") return total + item.amount;
        return total - item.amount;
      }, 0);

      if (normalizedType === "withdraw" && parsedAmount > currentBalance) {
        return res
          .status(400)
          .json({ message: "Insufficient funds for withdrawal." });
      }

      const transaction = await FundTransaction.create({
        type: normalizedType,
        amount: Math.round(parsedAmount * 100) / 100,
        reason: normalizedReason,
        createdBy: req.user.id,
      });

      const updatedBalance =
        normalizedType === "add"
          ? currentBalance + transaction.amount
          : currentBalance - transaction.amount;

      const populated = await FundTransaction.findById(
        transaction._id,
      ).populate("createdBy", "name email role");

      res.status(201).json({
        message:
          normalizedType === "add"
            ? "Funds added successfully."
            : "Funds withdrawn successfully.",
        transaction: populated,
        balance: Math.max(0, Math.round(updatedBalance * 100) / 100),
      });
    } catch (err) {
      console.error("Error updating funds:", err);
      res.status(500).json({ message: "Could not process fund transaction." });
    }
  },
);

// Admin: Send notification
router.post(
  "/admin/notifications",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { message } = req.body;
      const notification = await Notification.create({ message });
      res.status(201).json({ notification });
    } catch (err) {
      res.status(500).json({ message: "Could not send notification." });
    }
  },
);

// Admin: Get all notifications
router.get(
  "/admin/notifications",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.json({ notifications });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch notifications." });
    }
  },
);

// Admin: Delete a plan
router.delete(
  "/plans/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      await Plan.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Could not delete plan." });
    }
  },
);

router.post("/user/update", authMiddleware, updateUserProfile);
router.post("/user/change-password", authMiddleware, changeUserPassword);
router.get("/notifications", authMiddleware, getUserNotifications);
router.post("/notifications/read/:id", authMiddleware, markNotificationRead);
router.post("/cancel-subscription/:id", authMiddleware, cancelUserSubscription);
router.post("/renew-subscription", authMiddleware, renewUserSubscription);

router.get(
  "/admin/all-subscriptions",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subs = await Subscription.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      // Check and update expired subscriptions
      const now = new Date();
      for (let subscription of subs) {
        if (
          subscription.expiresAt &&
          subscription.expiresAt < now &&
          subscription.status === "active"
        ) {
          subscription.status = "expired";
          await subscription.save();
        }
      }

      // Fetch updated subscriptions
      const updatedSubs = await Subscription.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });
      res.json({ subscriptions: updatedSubs });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch subscriptions." });
    }
  },
);

// Add this route for user notifications
router.get("/user-notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $and: [
        { $or: [{ user: req.user.id }, { user: null }] },
        {
          $or: [
            { expiresAt: { $gt: new Date() } }, // Not expired
            { expiresAt: { $exists: false } }, // No expiration set (backward compatibility)
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    res.json({
      notifications: notifications.map((n) => ({
        _id: n._id,
        title: n.title || "Notification",
        message: n.message,
        createdAt: n.createdAt,
        read: n.readBy && n.readBy.includes(req.user.id),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch notifications." });
  }
});

// User: Submit a complaint
router.post("/complaints", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ message: "Message is required." });
    const complaint = await Complaint.create({ user: req.user.id, message });
    res.status(201).json({ complaint });
  } catch (err) {
    res.status(500).json({ message: "Could not submit complaint." });
  }
});

// User: Get all their complaints
router.get("/complaints", authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch complaints." });
  }
});

// Admin: Get all complaints
router.get(
  "/admin/complaints",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const complaints = await Complaint.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });
      res.json({ complaints });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch complaints." });
    }
  },
);

// Admin: Update complaint status
router.patch(
  "/admin/complaints/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, ...(typeof req.body.response === "string" ? { response: req.body.response.trim().slice(0, 3000) } : {}) },
        { new: true },
      );
      res.json({ complaint });
    } catch (err) {
      res.status(500).json({ message: "Could not update complaint." });
    }
  },
);

// Helpers to decide complaint access (user vs admin/coadmin)
function getComplaintQueryForUserOrAdmin(req) {
  if (req.user && (req.user.role === "admin" || req.user.role === "coadmin")) {
    return { _id: req.params.id };
  }
  return { _id: req.params.id, user: req.user.id };
}

// User/Admin: Get a specific complaint
router.get("/complaints/:id", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(
      getComplaintQueryForUserOrAdmin(req),
    );
    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Complaint not found or access denied." });
    }
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch complaint." });
  }
});

// User/Admin: Get chat messages for a complaint
router.get("/complaints/:id/chat", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(
      getComplaintQueryForUserOrAdmin(req),
    );
    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Complaint not found or access denied." });
    }
    res.json({ chat: complaint.chat || [] });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chat." });
  }
});

// User/Admin: Send a message in complaint chat
router.post("/complaints/:id/chat", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    const complaint = await Complaint.findOne(
      getComplaintQueryForUserOrAdmin(req),
    );
    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Complaint not found or access denied." });
    }

    const from =
      req.user && (req.user.role === "admin" || req.user.role === "coadmin")
        ? "admin"
        : "user";
    const newMessage = {
      from,
      text: text,
      time: new Date(),
    };

    complaint.chat.push(newMessage);
    await complaint.save();

    res.json({ chat: complaint.chat });
  } catch (err) {
    res.status(500).json({ message: "Could not send message." });
  }
});

// User: Request subscription renewal
router.post("/renewal-request", authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ message: "Subscription ID is required." });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: req.user.id,
    });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found." });
    }

    if (subscription.renewalStatus === "pending") {
      return res.status(400).json({
        message: "A renewal request is already pending for this subscription.",
      });
    }

    if (subscription.status !== "expired") {
      return res
        .status(400)
        .json({ message: "Only expired subscriptions can be renewed." });
    }

    subscription.renewalRequested = true;
    subscription.renewalRequestDate = new Date();
    subscription.renewalStatus = "pending";
    subscription.renewalRejectionReason = undefined;
    await subscription.save();

    res.json({
      subscription,
      message: "Renewal request submitted successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: "Could not submit renewal request." });
  }
});

// Admin: Get all renewal requests
router.get(
  "/admin/renewal-requests",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscriptions = await Subscription.find({
        renewalRequested: true,
        renewalStatus: "pending",
      })
        .populate("user", "name email")
        .sort({ renewalRequestDate: -1 });
      res.json({ subscriptions });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch renewal requests." });
    }
  },
);

// Admin: Approve renewal request
router.patch(
  "/admin/renewal-requests/:id/approve",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscription = await Subscription.findById(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found." });
      }

      if (
        !subscription.renewalRequested ||
        subscription.renewalStatus !== "pending"
      ) {
        return res
          .status(400)
          .json({ message: "No pending renewal request found." });
      }

      const plan = await Plan.findOne({
        name: new RegExp("^" + subscription.plan + "$", "i"),
      });
      if (!plan) {
        return res.status(400).json({ message: "Plan not found." });
      }

      const now = new Date();
      const durationInDays = parsePlanDurationDays(plan.duration);
      const newExpiryDate = new Date(
        now.getTime() + durationInDays * 24 * 60 * 60 * 1000,
      );

      subscription.status = "active";
      subscription.expiresAt = newExpiryDate;
      subscription.renewalStatus = "approved";
      subscription.renewalApprovedDate = now;
      subscription.renewalRequested = false;
      await subscription.save();

      res.json({
        subscription,
        message: "Renewal request approved successfully.",
      });
    } catch (err) {
      res.status(500).json({ message: "Could not approve renewal request." });
    }
  },
);

// Admin: Reject renewal request
router.patch(
  "/admin/renewal-requests/:id/reject",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required." });
      }

      const subscription = await Subscription.findById(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found." });
      }

      if (
        !subscription.renewalRequested ||
        subscription.renewalStatus !== "pending"
      ) {
        return res
          .status(400)
          .json({ message: "No pending renewal request found." });
      }

      subscription.renewalStatus = "rejected";
      subscription.renewalRejectionReason = reason;
      subscription.renewalRequested = false;
      await subscription.save();

      res.json({
        subscription,
        message: "Renewal request rejected successfully.",
      });
    } catch (err) {
      res.status(500).json({ message: "Could not reject renewal request." });
    }
  },
);

// Newsletter subscribe endpoint
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail)
      return res.status(400).json({ message: "Email is required." });
    let subscriber = await NewsletterSubscriber.findOne({
      email: normalizedEmail,
    });
    if (subscriber) {
      if (subscriber.status === "subscribed") {
        return res.status(400).json({ message: "Already subscribed." });
      } else {
        subscriber.status = "subscribed";
        await subscriber.save();
        return res.json({ message: "Subscribed successfully." });
      }
    }
    subscriber = await NewsletterSubscriber.create({
      email: normalizedEmail,
      status: "subscribed",
    });
    res.status(201).json({ message: "Subscribed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Could not subscribe." });
  }
});

// Newsletter unsubscribe endpoint
router.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail)
      return res.status(400).json({ message: "Email is required." });

    const subscriber = await NewsletterSubscriber.findOne({
      email: normalizedEmail,
    });
    if (!subscriber) {
      await NewsletterSubscriber.create({
        email: normalizedEmail,
        status: "unsubscribed",
      });
      return res.json({ message: "Unsubscribed successfully." });
    }
    if (subscriber.status === "unsubscribed") {
      return res.json({ message: "Unsubscribed successfully." });
    }
    subscriber.status = "unsubscribed";
    await subscriber.save();
    res.json({ message: "Unsubscribed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Could not unsubscribe." });
  }
});

// Admin: Get all newsletter subscribers (show all with status)
router.get(
  "/admin/newsletter-subscribers",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscribers = await NewsletterSubscriber.find().sort({
        createdAt: -1,
      });
      res.json({ subscribers });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch subscribers." });
    }
  },
);

// Admin: Get unsubscribed newsletter users
router.get(
  "/admin/newsletter-unsubscribed",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const subscribers = await NewsletterSubscriber.find({
        status: "unsubscribed",
      }).sort({ updatedAt: -1 });
      res.json({ subscribers });
    } catch (err) {
      res.status(500).json({ message: "Could not fetch unsubscribed users." });
    }
  },
);

// Admin email diagnostics: never expose secret values in API responses.
router.get("/admin/email-config", authMiddleware, coAdminMiddleware, async (req, res) => {
  const hasResend = Boolean(String(process.env.RESEND_API_KEY || "").trim());
  const hasSmtp = Boolean(String(process.env.SMTP_USER || "").trim() && String(process.env.SMTP_PASS || "").trim());
  const provider = hasResend ? "Resend" : hasSmtp ? "SMTP" : "Not configured";
  res.json({
    provider,
    configured: hasResend || hasSmtp,
    senderConfigured: Boolean(process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER),
    requiredEnvironment: hasResend
      ? ["RESEND_API_KEY", "RESEND_FROM"]
      : ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    emailFlows: ["registration OTP", "forgot-password OTP", "promotional campaigns", "agreement emails"],
  });
});

router.post("/admin/email-test", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const validEmail = new RegExp("^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$").test(email);
    if (!validEmail) return res.status(400).json({ message: "Enter a valid test recipient email." });
    await sendEmail(
      email,
      "ASKC TECHNOLOGIES — Email configuration test",
      "Your ASKC email service is configured and can deliver messages.",
      "<div style='font-family:Arial,sans-serif;padding:24px'><h2>ASKC TECHNOLOGIES</h2><p>Your configured email provider is working. Registration OTP, forgot-password OTP, promotional campaigns and agreement emails use this delivery service.</p></div>"
    );
    res.json({ success: true, message: "Test email accepted by the configured provider." });
  } catch (err) {
    console.error("Admin email configuration test failed:", err);
    res.status(502).json({ success: false, message: err?.message || "Email provider test failed." });
  }
});

// Admin: Send promotional email to one or multiple emails
router.post(
  "/admin/promotional-email",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { email, emails, subject, message } = req.body || {};
      const suppliedEmails = Array.isArray(emails) ? emails : email ? [email] : [];
      const requestedEmails = [...new Set(suppliedEmails.map((value) => String(value || "").trim().toLowerCase()).filter((value) => /^[a-z0-9.!#$%&'*+/=?^`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(value)))];
      const normalizedSubject = String(subject || "").trim();
      const normalizedMessage = String(message || "").trim();

      if (!requestedEmails.length) return res.status(400).json({ message: "Enter at least one valid email address." });
      if (requestedEmails.length > 100) return res.status(400).json({ message: "You can send one campaign to a maximum of 100 recipients at a time." });
      if (!normalizedSubject) return res.status(400).json({ message: "Subject is required." });
      if (!normalizedMessage) return res.status(400).json({ message: "Message is required." });

      // Manually entered addresses may be recorded only after the admin confirms
      // that each recipient explicitly opted in. Existing unsubscribes are never overridden.
      if (req.body?.consentConfirmed === true) {
        for (const address of requestedEmails) {
          const existing = await NewsletterSubscriber.findOne({ email: address });
          if (existing?.status === "unsubscribed") continue;
          await NewsletterSubscriber.findOneAndUpdate(
            { email: address },
            { $set: { status: "subscribed", consentedAt: existing?.consentedAt || new Date(), consentSource: "admin-confirmed", consentedBy: String(req.user?.id || "") } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
          await User.updateOne(
            { email: address },
            { $set: { marketingConsent: true, marketingConsentAt: new Date(), subscribeOffers: true } },
          );
        }
      }

      // Only explicitly opted-in recipients are eligible. Unsubscribe records always win.
      const consented = await NewsletterSubscriber.find({
        email: { $in: requestedEmails },
        status: "subscribed",
        consentedAt: { $ne: null },
      }).select("email").lean();
      const emailList = consented.map((subscriber) => subscriber.email);
      const skippedCount = requestedEmails.length - emailList.length;
      if (!emailList.length) {
        return res.status(400).json({ message: "No eligible recipients. Select opted-in subscribers or confirm that manually entered recipients have explicitly agreed to receive promotional emails. Unsubscribed addresses remain blocked.", successCount: 0, skippedCount });
      }

      const siteOrigin = getPublicSiteOrigin();
      if (!siteOrigin) return res.status(503).json({ message: "Public website URL is not configured. Set PUBLIC_SITE_URL or FRONTEND_URL in the backend environment." });

      const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      const safeSubject = escapeHtml(normalizedSubject);
      const safeMessage = escapeHtml(normalizedMessage).replace(/\r?\n/g, "<br/>");
      let successCount = 0;
      const failedEmails = [];
      let firstFailureReason = "";

      for (const recipient of emailList) {
        try {
          const unsubscribeToken = crypto.randomBytes(32).toString("hex");
          const unsubscribeTokenHash = crypto.createHash("sha256").update(unsubscribeToken).digest("hex");
          await NewsletterSubscriber.updateOne(
            { email: recipient, status: "subscribed", consentedAt: { $ne: null } },
            { $set: { unsubscribeTokenHash } },
          );
          const unsubscribeUrl = siteOrigin.replace(/\/+$/, "") + "/unsubscribe-email?token=" + encodeURIComponent(unsubscribeToken);
          const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${safeSubject}</title></head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6fb;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #e5ebf3;border-radius:18px;overflow:hidden;">
<tr><td style="background:#102b55;padding:28px 30px;"><div style="font-size:23px;line-height:1.05;font-weight:800;letter-spacing:.4px;color:#fff;">ASKC</div><div style="font-size:23px;line-height:1.05;font-weight:800;letter-spacing:.4px;color:#8fc5ff;margin-top:3px;">TECHNOLOGIES</div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c2d5ee;margin-top:9px;">Ideas to digital impact</div></td></tr>
<tr><td style="padding:34px 30px 28px;"><div style="display:inline-block;padding:7px 11px;border-radius:20px;background:#edf5ff;color:#1756a2;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">News & updates</div><h1 style="font-size:25px;line-height:1.3;color:#102b55;margin:18px 0 14px;">${safeSubject}</h1><div style="font-size:15px;line-height:1.85;color:#475569;">${safeMessage}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px;"><tr><td style="border-radius:9px;background:#1756a2;"><a href="https://askctechnologies.in/plans" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Explore ASKC Technologies</a></td></tr></table>
<div style="margin-top:28px;padding:18px;background:#f6f9fd;border:1px solid #e3ebf5;border-radius:12px;"><p style="font-size:12px;line-height:1.7;color:#66758a;margin:0;">You're receiving this email because you explicitly opted in to receive updates and offers from ASKC TECHNOLOGIES.</p><p style="font-size:12px;margin:12px 0 0;"><a href="${unsubscribeUrl}" style="color:#1756a2;font-weight:700;text-decoration:underline;">Unsubscribe from promotional emails</a></p></div></td></tr>
<tr><td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e8edf4;"><p style="font-size:11px;color:#748196;line-height:1.7;margin:0;">ASKC TECHNOLOGIES · <a href="https://askctechnologies.in" style="color:#1756a2;text-decoration:none;">askctechnologies.in</a><br/><a href="mailto:askctechnologies@gmail.com" style="color:#1756a2;text-decoration:none;">askctechnologies@gmail.com</a> · +91 79923 65197</p><p style="font-size:10px;color:#9aa5b4;margin:12px 0 0;">© ${new Date().getFullYear()} ASKC TECHNOLOGIES. All rights reserved.</p></td></tr>
</table></td></tr></table></body></html>`;

          await sendEmail(recipient, normalizedSubject, normalizedMessage + "\n\nUnsubscribe: " + unsubscribeUrl, html, '"ASKC TECHNOLOGIES" <askctechnologies@gmail.com>');
          successCount += 1;
        } catch (emailError) {
          console.error("Promotional email delivery failed for recipient:", recipient, emailError);
          if (!firstFailureReason) firstFailureReason = String(emailError?.message || "Email provider rejected the message.").slice(0, 300);
          failedEmails.push(recipient);
        }
      }

      if (successCount === 0) return res.status(502).json({ message: firstFailureReason ? "No promotional emails were sent. " + firstFailureReason : "No promotional emails could be delivered.", successCount: 0, failedEmails, skippedCount });
      return res.status(200).json({
        message: failedEmails.length ? `Email sent to ${successCount} recipient(s); ${failedEmails.length} failed.` : `Promotional email sent to ${successCount} recipient(s) successfully.`,
        successCount, failedEmails, skippedCount,
      });
    } catch (error) {
      console.error("Promotional email endpoint error:", error);
      return res.status(500).json({ message: "The promotional email request could not be processed. Check the backend logs for details." });
    }
  }
);

// Mark contact as read
router.patch(
  "/contacts/:id/read",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true },
      );
      if (!contact)
        return res.status(404).json({ message: "Contact not found." });
      res.json({ contact });
    } catch (err) {
      res.status(500).json({ message: "Could not mark as read." });
    }
  },
);

// Mark contact as unread
router.patch(
  "/contacts/:id/unread",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { read: false },
        { new: true },
      );
      if (!contact)
        return res.status(404).json({ message: "Contact not found." });
      res.json({ contact });
    } catch (err) {
      res.status(500).json({ message: "Could not mark as unread." });
    }
  },
);

// Admin: Create a new coupon
router.post("/coupons", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const { code, amount, discountType = "fixed", usageLimit, eligiblePlans = [] } = req.body;
    const type = discountType === "percentage" ? "percentage" : "fixed";
    const value = Number(amount);
    if (!code || !Number.isFinite(value) || value <= 0)
      return res.status(400).json({ message: "Enter a valid coupon code and discount value." });
    if (type === "percentage" && value > 100)
      return res.status(400).json({ message: "Percentage discount must be between 1 and 100." });
    if (usageLimit !== undefined && (!Number.isInteger(Number(usageLimit)) || Number(usageLimit) < 1))
      return res.status(400).json({ message: "Usage limit must be at least 1." });
    if (!Array.isArray(eligiblePlans))
      return res.status(400).json({ message: "Select valid pricing plans." });
    const validPlanIds = [...new Set(eligiblePlans.map(id => String(id)))];
    if (validPlanIds.length) {
      const validPlans = await Plan.countDocuments({ _id: { $in: validPlanIds } });
      if (validPlans !== validPlanIds.length)
        return res.status(400).json({ message: "One or more selected pricing plans are invalid." });
    }
    const coupon = await Coupon.create({
      code: String(code).trim().toUpperCase(),
      amount: value,
      discountType: type,
      eligiblePlans: validPlanIds,
      usageLimit: usageLimit === undefined ? 1 : Number(usageLimit),
    });
    res.status(201).json({ coupon });
  } catch (err) {
    res.status(500).json({ message: "Could not create coupon." });
  }
});

// Admin: List all coupons
router.get("/coupons", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch coupons." });
  }
});

// Admin: Deactivate a coupon
router.patch(
  "/coupons/:id/deactivate",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true },
      );
      if (!coupon)
        return res.status(404).json({ message: "Coupon not found." });
      res.json({ coupon });
    } catch (err) {
      res.status(500).json({ message: "Could not deactivate coupon." });
    }
  },
);

// Admin: Delete a coupon
router.delete(
  "/coupons/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      await Coupon.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Could not delete coupon." });
    }
  },
);

// User: Apply a coupon (with usage tracking and per-user limit)
router.post("/coupons/apply", async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const planId = req.body?.planId;
    if (!code) return res.status(400).json({ message: "Coupon code is required." });
    const coupon = await Coupon.findOne({ code, active: true }).lean();
    if (!coupon) return res.status(404).json({ message: "Invalid or expired coupon." });
    if (planId && coupon.eligiblePlans?.length && !coupon.eligiblePlans.some(id => String(id) === String(planId))) {
      return res.status(400).json({ message: "This coupon is not valid for the selected pricing plan." });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached." });
    }
    // This endpoint only previews a coupon. Redemption is recorded after verified payment,
    // never when a customer merely checks or applies a code in the UI.
    return res.json({
      amount: coupon.amount,
      discountType: coupon.discountType || "fixed",
      coupon: { code: coupon.code, amount: coupon.amount, discountType: coupon.discountType || "fixed" },
    });
  } catch (err) {
    console.error("Coupon validation failed:", err?.message);
    return res.status(500).json({ message: "Could not validate coupon." });
  }
});

// Team Management Routes

// Get all team members (admin only)
router.get(
  "/admin/team",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const teamMembers = await TeamMember.find({ isActive: true }).sort({
        order: 1,
        createdAt: -1,
      });
      res.json({ teamMembers });
    } catch (err) {
      console.error("Error fetching team members:", err);
      res.status(500).json({ message: "Could not fetch team members." });
    }
  },
);

// Add new team member (admin only)
router.post(
  "/admin/team",
  authMiddleware,
  coAdminMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { name, position, email, phone, bio, order, socialLinks } =
        req.body;

      // Validate required fields
      if (!name || !position) {
        return res
          .status(400)
          .json({ message: "Name and position are required." });
      }

      // Parse social links if it's a string
      let parsedSocialLinks = socialLinks;
      if (typeof socialLinks === "string") {
        try {
          parsedSocialLinks = JSON.parse(socialLinks);
        } catch (e) {
          parsedSocialLinks = {};
        }
      }

      // Use provided order or default to count + 1
      const displayOrder = order || (await TeamMember.countDocuments()) + 1;

      const teamMemberData = {
        name,
        position,
        email,
        phone,
        bio,
        order: displayOrder,
        socialLinks: parsedSocialLinks || {},
      };

      // Upload profile image to Cloudinary.
      if (req.file) {
        teamMemberData.profileImage = (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/team")).url;
      }

      const teamMember = await TeamMember.create(teamMemberData);

      res
        .status(201)
        .json({ teamMember, message: "Team member added successfully." });
    } catch (err) {
      console.error("Error creating team member:", err);
      res.status(500).json({ message: "Could not create team member." });
    }
  },
);

// Update team member (admin only)
router.put(
  "/admin/team/:id",
  authMiddleware,
  coAdminMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { name, position, email, phone, bio, order, socialLinks } =
        req.body;

      // Validate required fields
      if (!name || !position) {
        return res
          .status(400)
          .json({ message: "Name and position are required." });
      }

      // Parse social links if it's a string
      let parsedSocialLinks = socialLinks;
      if (typeof socialLinks === "string") {
        try {
          parsedSocialLinks = JSON.parse(socialLinks);
        } catch (e) {
          parsedSocialLinks = {};
        }
      }

      const updateData = {
        name,
        position,
        email,
        phone,
        bio,
        order: order || 0,
        socialLinks: parsedSocialLinks || {},
      };

      // Add profile image if uploaded (convert to base64)
      if (req.file) {
        updateData.profileImage = (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/team")).url;
      }

      const teamMember = await TeamMember.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      );

      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found." });
      }

      res.json({ teamMember, message: "Team member updated successfully." });
    } catch (err) {
      console.error("Error updating team member:", err);
      res.status(500).json({ message: "Could not update team member." });
    }
  },
);

// Delete team member (admin only)
router.delete(
  "/admin/team/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const teamMember = await TeamMember.findByIdAndDelete(req.params.id);

      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found." });
      }

      res.json({ message: "Team member deleted successfully." });
    } catch (err) {
      console.error("Error deleting team member:", err);
      res.status(500).json({ message: "Could not delete team member." });
    }
  },
);

// Get team members for public display (no auth required)
router.get("/team", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({ teamMembers });
  } catch (err) {
    console.error("Error fetching team members:", err);
    res.status(500).json({ message: "Could not fetch team members." });
  }
});

// Founder profile image is hosted on Cloudinary; MongoDB stores only its secure URL.

router.get("/founder-profile", async (req, res) => {
  try {
    const profile = await FounderProfile.findOne({ key: "founder" }).select("image uploadedAt").lean();
    res.json({ profile: profile ? { image: profile.image, uploadedAt: profile.uploadedAt } : null });
  } catch (err) {
    console.error("Founder profile fetch failed:", err);
    res.status(500).json({ message: "Could not load founder profile." });
  }
});

router.put(
  "/admin/founder-profile",
  authMiddleware,
  coAdminMiddleware,
  upload.single("founderImage"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Please select an image to upload." });
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Only JPG, PNG and WebP images are supported." });
      }
      const image = (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/founder")).url;
      const profile = await FounderProfile.findOneAndUpdate(
        { key: "founder" },
        { $set: { image, mimeType: req.file.mimetype, uploadedAt: new Date(), updatedBy: String(req.user?.id || "") } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).select("image uploadedAt");
      res.json({ message: "Founder image uploaded successfully.", profile });
    } catch (err) {
      console.error("Founder profile upload failed:", err);
      res.status(500).json({ message: "Could not save founder image." });
    }
  }
);

// Feature Management Routes

// Get all features (admin only)
router.get(
  "/admin/features",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const features = await Feature.find({ isActive: true }).sort({
        order: 1,
        createdAt: -1,
      });
      res.json({ features });
    } catch (err) {
      console.error("Error fetching features:", err);
      res.status(500).json({ message: "Could not fetch features." });
    }
  },
);

// Add new feature (admin only)
router.post(
  "/admin/features",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { title, description, icon, category, order, color, benefits } =
        req.body;

      // Validate required fields
      if (!title || !description || !icon) {
        return res
          .status(400)
          .json({ message: "Title, description, and icon are required." });
      }

      // Parse benefits if it's a string
      let parsedBenefits = benefits;
      if (typeof benefits === "string") {
        try {
          parsedBenefits = JSON.parse(benefits);
        } catch (e) {
          parsedBenefits = [];
        }
      }

      // Use provided order or default to count + 1
      const displayOrder = order || (await Feature.countDocuments()) + 1;

      const feature = await Feature.create({
        title,
        description,
        icon,
        category: category || "other",
        order: displayOrder,
        color: color || "#667eea",
        benefits: parsedBenefits || [],
      });

      res.status(201).json({ feature, message: "Feature added successfully." });
    } catch (err) {
      console.error("Error creating feature:", err);
      res.status(500).json({ message: "Could not create feature." });
    }
  },
);

// Update feature (admin only)
router.put(
  "/admin/features/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { title, description, icon, category, order, color, benefits } =
        req.body;

      // Validate required fields
      if (!title || !description || !icon) {
        return res
          .status(400)
          .json({ message: "Title, description, and icon are required." });
      }

      // Parse benefits if it's a string
      let parsedBenefits = benefits;
      if (typeof benefits === "string") {
        try {
          parsedBenefits = JSON.parse(benefits);
        } catch (e) {
          parsedBenefits = [];
        }
      }

      const feature = await Feature.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          icon,
          category: category || "other",
          order: order || 0,
          color: color || "#667eea",
          benefits: parsedBenefits || [],
        },
        { new: true, runValidators: true },
      );

      if (!feature) {
        return res.status(404).json({ message: "Feature not found." });
      }

      res.json({ feature, message: "Feature updated successfully." });
    } catch (err) {
      console.error("Error updating feature:", err);
      res.status(500).json({ message: "Could not update feature." });
    }
  },
);

// Delete feature (admin only)
router.delete(
  "/admin/features/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const feature = await Feature.findByIdAndDelete(req.params.id);

      if (!feature) {
        return res.status(404).json({ message: "Feature not found." });
      }

      res.json({ message: "Feature deleted successfully." });
    } catch (err) {
      console.error("Error deleting feature:", err);
      res.status(500).json({ message: "Could not delete feature." });
    }
  },
);

// Get features for public display (no auth required)
router.get("/features", async (req, res) => {
  try {
    const features = await Feature.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({ features });
  } catch (err) {
    console.error("Error fetching features:", err);
    res.status(500).json({ message: "Could not fetch features." });
  }
});

// Service Management Routes

// Get all services (admin only)
router.get(
  "/admin/services",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const services = await Service.find({ isActive: true }).sort({
        order: 1,
        createdAt: -1,
      });
      res.json({ services });
    } catch (err) {
      console.error("Error fetching services:", err);
      res.status(500).json({ message: "Could not fetch services." });
    }
  },
);

// Add new service (admin only)
router.post(
  "/admin/services",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        shortDescription,
        icon,
        category,
        price,
        duration,
        features,
        order,
        color,
      } = req.body;

      // Validate required fields
      if (!name || !description || !icon) {
        return res
          .status(400)
          .json({ message: "Name, description, and icon are required." });
      }

      // Parse features if it's a string
      let parsedFeatures = features;
      if (typeof features === "string") {
        try {
          parsedFeatures = JSON.parse(features);
        } catch (e) {
          parsedFeatures = [];
        }
      }

      // Use provided order or default to count + 1
      const displayOrder = order || (await Service.countDocuments()) + 1;

      const service = await Service.create({
        name,
        description,
        shortDescription,
        icon,
        category: category || "other",
        price,
        duration,
        features: parsedFeatures || [],
        order: displayOrder,
        color: color || "#667eea",
      });

      res.status(201).json({ service, message: "Service added successfully." });
    } catch (err) {
      console.error("Error creating service:", err);
      res.status(500).json({ message: "Could not create service." });
    }
  },
);

// Update service (admin only)
router.put(
  "/admin/services/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        shortDescription,
        icon,
        category,
        price,
        duration,
        features,
        order,
        color,
      } = req.body;

      // Validate required fields
      if (!name || !description || !icon) {
        return res
          .status(400)
          .json({ message: "Name, description, and icon are required." });
      }

      // Parse features if it's a string
      let parsedFeatures = features;
      if (typeof features === "string") {
        try {
          parsedFeatures = JSON.parse(features);
        } catch (e) {
          parsedFeatures = [];
        }
      }

      const service = await Service.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
          shortDescription,
          icon,
          category: category || "other",
          price,
          duration,
          features: parsedFeatures || [],
          order: order || 0,
          color: color || "#667eea",
        },
        { new: true, runValidators: true },
      );

      if (!service) {
        return res.status(404).json({ message: "Service not found." });
      }

      res.json({ service, message: "Service updated successfully." });
    } catch (err) {
      console.error("Error updating service:", err);
      res.status(500).json({ message: "Could not update service." });
    }
  },
);

// Delete service (admin only)
router.delete(
  "/admin/services/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const service = await Service.findByIdAndDelete(req.params.id);

      if (!service) {
        return res.status(404).json({ message: "Service not found." });
      }

      res.json({ message: "Service deleted successfully." });
    } catch (err) {
      console.error("Error deleting service:", err);
      res.status(500).json({ message: "Could not delete service." });
    }
  },
);

// Get services for public display (no auth required)
router.get("/services", async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({ services });
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Could not fetch services." });
  }
});

// Checkout mode settings: only a full admin can switch the live payment workflow.
router.get("/admin/payment-settings", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await PaymentMode.findOne({ key: "checkout" }).lean();
    res.set("Cache-Control", "no-store");
    res.json({
      mode: settings?.mode === "manual" ? "manual" : "cashfree",
      updatedAt: settings?.updatedAt || null,
      gatewayReady: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
      environment: process.env.CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox"
    });
  } catch (err) {
    console.error("Error fetching admin payment settings:", err);
    res.status(500).json({ message: "Could not fetch payment settings." });
  }
});

router.put("/admin/payment-settings", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const mode = String(req.body?.mode || "").trim().toLowerCase();
    if (!["manual", "cashfree"].includes(mode)) {
      return res.status(400).json({ message: "Choose either manual or cashfree payment mode." });
    }
    if (mode === "cashfree" && (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY)) {
      return res.status(409).json({ message: "Configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Render before enabling Cashfree checkout." });
    }
    if (mode === "manual" && !(await PaymentOption.countDocuments({ isActive: true }))) {
      return res.status(409).json({ message: "Add and activate at least one manual UPI, QR or bank payment option before enabling manual checkout." });
    }
    const settings = await PaymentMode.findOneAndUpdate(
      { key: "checkout" },
      { $set: { mode, updatedBy: req.user.id } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.set("Cache-Control", "no-store");
    return res.json({
      message: mode === "cashfree"
        ? "Cashfree checkout enabled. Successful verified payments will activate automatically."
        : "Manual payment enabled. Receipt submissions will require admin verification.",
      mode: settings.mode,
      updatedAt: settings.updatedAt,
      gatewayReady: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
      environment: process.env.CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox"
    });
  } catch (err) {
    console.error("Error updating checkout payment mode:", err);
    return res.status(500).json({ message: "Could not update payment mode." });
  }
});

// Payment Options Management Routes
router.get("/admin/payment-options", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const paymentOptions = await PaymentOption.find().sort({ order: 1, createdAt: -1 });
    res.json({ paymentOptions });
  } catch (err) {
    console.error("Error fetching payment options:", err);
    res.status(500).json({ message: "Could not fetch payment options." });
  }
});

router.post("/admin/payment-options", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const { name, upiId, description, paymentType, order, accountName, accountNumber, ifscCode, bankName, branch, qrCode } = req.body;
    const type = paymentType || "UPI";
    if (!name?.trim()) return res.status(400).json({ message: "Payment option name is required." });
    if (type === "UPI" && !upiId?.trim()) return res.status(400).json({ message: "UPI ID is required for UPI payments." });
    if (type === "BANK_TRANSFER" && (!accountName?.trim() || !accountNumber?.trim() || !ifscCode?.trim() || !bankName?.trim())) {
      return res.status(400).json({ message: "Account name, account number, bank name and IFSC are required for bank transfer." });
    }
    if (upiId?.trim()) {
      const existing = await PaymentOption.findOne({ upiId: upiId.trim() });
      if (existing) return res.status(400).json({ message: "UPI ID already exists." });
    }
    const paymentOption = await PaymentOption.create({
      name: name.trim(), upiId: upiId?.trim() || `BANK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, description, paymentType: type,
      order: Number(order) || 0, accountName, accountNumber, ifscCode, bankName, branch, qrCode: qrCode || null
    });
    res.status(201).json({ paymentOption, message: "Payment option added successfully." });
  } catch (err) {
    console.error("Error adding payment option:", err);
    res.status(500).json({ message: "Could not add payment option." });
  }
});

router.put("/admin/payment-options/:id", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const { name, upiId, description, paymentType, order, isActive, accountName, accountNumber, ifscCode, bankName, branch, qrCode } = req.body;
    const type = paymentType || "UPI";
    if (!name?.trim()) return res.status(400).json({ message: "Payment option name is required." });
    if (type === "UPI" && !upiId?.trim()) return res.status(400).json({ message: "UPI ID is required for UPI payments." });
    if (type === "BANK_TRANSFER" && (!accountName?.trim() || !accountNumber?.trim() || !ifscCode?.trim() || !bankName?.trim())) {
      return res.status(400).json({ message: "Account name, account number, bank name and IFSC are required for bank transfer." });
    }
    if (upiId?.trim()) {
      const existing = await PaymentOption.findOne({ upiId: upiId.trim(), _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ message: "UPI ID already exists." });
    }
    const update = {
      name: name.trim(), upiId: upiId?.trim() || `BANK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, description, paymentType: type,
      order: Number(order) || 0, isActive: isActive !== undefined ? isActive : true,
      accountName, accountNumber, ifscCode, bankName, branch
    };
    if (qrCode !== undefined) update.qrCode = qrCode || null;
    const paymentOption = await PaymentOption.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!paymentOption) return res.status(404).json({ message: "Payment option not found." });
    res.json({ paymentOption, message: "Payment option updated successfully." });
  } catch (err) {
    console.error("Error updating payment option:", err);
    res.status(500).json({ message: "Could not update payment option." });
  }
});

router.delete("/admin/payment-options/:id", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const paymentOption = await PaymentOption.findByIdAndDelete(req.params.id);
    if (!paymentOption) return res.status(404).json({ message: "Payment option not found." });
    res.json({ message: "Payment option deleted successfully." });
  } catch (err) {
    console.error("Error deleting payment option:", err);
    res.status(500).json({ message: "Could not delete payment option." });
  }
});

// Public checkout mode is read-only; all payment enforcement happens again on the server.
router.get("/payment-settings", async (req, res) => {
  try {
    const mode = await getCheckoutPaymentMode();
    res.set("Cache-Control", "no-store");
    res.json({ mode, gatewayReady: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) });
  } catch (err) {
    console.error("Error fetching checkout settings:", err);
    res.status(503).json({ message: "Payment settings are temporarily unavailable." });
  }
});

// Public endpoint used by agreement templates; expose active instructions only for manual checkout.
router.get("/payment-options", async (req, res) => {
  try {
    const mode = await getCheckoutPaymentMode();
    const paymentOptions = mode === "manual"
      ? await PaymentOption.find({ isActive: true }).sort({ order: 1 }).select("name upiId qrCode description paymentType accountName accountNumber ifscCode bankName branch")
      : [];
    res.json({ paymentOptions });
  } catch (err) {
    console.error("Error fetching public payment options:", err);
    res.status(500).json({ message: "Could not fetch payment options." });
  }
});

// ========== PROJECT REQUIREMENT ROUTES ==========

// User: Submit project requirement
router.post("/project-requirement", authMiddleware, async (req, res) => {
  try {
    const { projectIdea, websitePreference, linkOption } = req.body;

    if (!projectIdea || !projectIdea.trim()) {
      return res.status(400).json({ message: "Project idea is required." });
    }

    let projectReq;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        projectReq = await ProjectRequirement.create({
          user: req.user.id,
          submissionId: generateProjectSubmissionId(),
          projectIdea: projectIdea.trim(),
          websitePreference: websitePreference || "",
          linkOption: linkOption || "",
          status: "pending",
          statusTimeline: [{ status: "pending", at: new Date() }],
        });
        break;
      } catch (err) {
        if (
          err.code === 11000 &&
          String(err.message || "").includes("submissionId")
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!projectReq) {
      return res.status(500).json({
        message: "Could not create submission reference. Please try again.",
      });
    }

    await createUserNotification(
      req.user.id,
      "Project request submitted",
      `Your project request ${projectReq.submissionId} was received and is now pending review.`,
      "project",
      `project:submitted:${projectReq._id}`,
      "/dashboard/project-requirement"
    );
    res.status(201).json({
      projectRequirement: projectReq,
      message: "Project requirement submitted successfully.",
    });
  } catch (err) {
    console.error("Error creating project requirement:", err);
    res.status(500).json({ message: "Could not submit project requirement." });
  }
});

// User: Get own project requirements
router.get("/project-requirements", authMiddleware, async (req, res) => {
  try {
    const projects = await ProjectRequirement.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("user", "name email");
    res.json({ projectRequirements: projects });
  } catch (err) {
    console.error("Error fetching project requirements:", err);
    res.status(500).json({ message: "Could not fetch project requirements." });
  }
});

// Admin: Get all project requirements with filters
router.get(
  "/admin/project-requirements",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { status, search } = req.query;
      let query = {};

      if (status && status !== "all") {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { projectIdea: { $regex: search, $options: "i" } },
          { websitePreference: { $regex: search, $options: "i" } },
          {
            submissionId: {
              $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          },
        ];
      }

      const projects = await ProjectRequirement.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      res.json({ projectRequirements: projects });
    } catch (err) {
      console.error("Error fetching project requirements:", err);
      res
        .status(500)
        .json({ message: "Could not fetch project requirements." });
    }
  },
);

// Admin: Update project requirement status
router.patch(
  "/admin/project-requirement/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { status, projectLink, adminNotes, estimatedCompletionDate } =
        req.body;
      const project = await ProjectRequirement.findById(req.params.id);

      if (!project) {
        return res
          .status(404)
          .json({ message: "Project requirement not found." });
      }

      const prevStatus = project.status;
      const setFields = {};
      let pushTimeline = null;

      if (estimatedCompletionDate !== undefined) {
        if (
          estimatedCompletionDate === null ||
          estimatedCompletionDate === ""
        ) {
          setFields.estimatedCompletionDate = null;
        } else {
          const d = new Date(estimatedCompletionDate);
          if (Number.isNaN(d.getTime())) {
            return res
              .status(400)
              .json({ message: "Invalid estimated completion date." });
          }
          setFields.estimatedCompletionDate = d;
        }
      }

      if (status) {
        if (
          ![
            "pending",
            "under_review",
            "under_development",
            "last_stage",
            "finished",
          ].includes(status)
        ) {
          return res.status(400).json({ message: "Invalid status." });
        }

        if (status !== prevStatus) {
          const nextEst =
            estimatedCompletionDate !== undefined
              ? setFields.estimatedCompletionDate !== undefined
                ? setFields.estimatedCompletionDate
                : project.estimatedCompletionDate
              : project.estimatedCompletionDate;
          if (prevStatus === "pending" && status !== "pending" && !nextEst) {
            return res.status(400).json({
              message:
                "Estimated completion date is required when moving the request out of pending.",
            });
          }

          setFields.status = status;
          pushTimeline = { status, at: new Date() };

          if (status === "finished") {
            if (!(projectLink || "").trim()) {
              return res.status(400).json({
                message: "Project link is required when marking as finished.",
              });
            }
            setFields.projectLink = projectLink.trim();
            if (prevStatus !== "finished") {
              setFields.finishedAt = new Date();
            }
          }
        }
      }

      if (adminNotes !== undefined) {
        setFields.adminNotes = adminNotes;
      }

      const mongoUpdate = { $set: setFields };
      if (pushTimeline) {
        mongoUpdate.$push = { statusTimeline: pushTimeline };
      }

      if (Object.keys(setFields).length === 0 && !pushTimeline) {
        return res.status(400).json({ message: "No changes to apply." });
      }

      const updatedProject = await ProjectRequirement.findByIdAndUpdate(
        req.params.id,
        mongoUpdate,
        {
          new: true,
        },
      ).populate("user", "name email");

      if (updatedProject.user && (updatedProject.status !== prevStatus || adminNotes !== undefined || projectLink !== undefined || estimatedCompletionDate !== undefined)) {
        const statusText = String(updatedProject.status || "updated").replace(/_/g, " ");
        await createUserNotification(
          updatedProject.user._id || updatedProject.user,
          "Project update",
          `Your project request ${updatedProject.submissionId} has been updated. Current status: ${statusText}.${updatedProject.adminNotes ? " Admin note: " + updatedProject.adminNotes : ""}`,
          "project",
          `project:update:${updatedProject._id}:${updatedProject.updatedAt?.getTime?.() || Date.now()}`,
          "/dashboard/project-requirement"
        );
      }
      res.json({
        projectRequirement: updatedProject,
        message: "Project requirement updated successfully.",
      });
    } catch (err) {
      console.error("Error updating project requirement:", err);
      res
        .status(500)
        .json({ message: "Could not update project requirement." });
    }
  },
);

// Admin: Get all subscription cancellations
router.get(
  "/admin/cancellations",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.query;
      let query = {};

      if (status === "pending") {
        query = { cancellationStatus: "pending" };
      } else if (status === "approved") {
        query = { cancellationStatus: "approved", canceled: true };
      } else {
        // Get all cancellations (pending, approved, rejected)
        query = {
          $or: [{ cancellationStatus: { $ne: "none" } }, { canceled: true }],
        };
      }

      const cancellations = await Subscription.find(query)
        .populate("user", "name email")
        .sort({ cancellationRequestDate: -1 });

      res.json({ cancellations });
    } catch (err) {
      console.error("Error fetching cancellations:", err);
      res.status(500).json({ message: "Could not fetch cancellations." });
    }
  },
);

// Admin: Approve cancellation
router.patch(
  "/admin/approve-cancellation/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const sub = await Subscription.findById(req.params.id);
      if (!sub)
        return res.status(404).json({ message: "Subscription not found." });
      if (sub.cancellationStatus !== "pending") {
        return res
          .status(400)
          .json({ message: "Cancellation request is not pending." });
      }

      // Approve cancellation: mark as canceled, set status to expired, and update cancellation status
      sub.canceled = true;
      sub.cancellationStatus = "approved";
      sub.cancellationApprovedDate = new Date();
      sub.status = "expired"; // Make subscription inactive
      await sub.save();

      res.json({
        subscription: sub,
        message: "Cancellation approved successfully.",
      });
    } catch (err) {
      console.error("Error approving cancellation:", err);
      res.status(500).json({ message: "Could not approve cancellation." });
    }
  },
);

// Admin: Reject cancellation
router.patch(
  "/admin/reject-cancellation/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const sub = await Subscription.findById(req.params.id);
      if (!sub)
        return res.status(404).json({ message: "Subscription not found." });
      if (sub.cancellationStatus !== "pending") {
        return res
          .status(400)
          .json({ message: "Cancellation request is not pending." });
      }

      // Reject cancellation: keep subscription active, set cancellation status to rejected
      sub.cancellationStatus = "rejected";
      sub.cancellationRejectionReason =
        reason || "Cancellation request rejected by admin.";
      await sub.save();

      res.json({
        subscription: sub,
        message: "Cancellation rejected successfully.",
      });
    } catch (err) {
      console.error("Error rejecting cancellation:", err);
      res.status(500).json({ message: "Could not reject cancellation." });
    }
  },
);

// Admin-only refund review and payout tracking.
router.get("/admin/refunds", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const records = await Subscription.find({
      $or: [
        { cancellationStatus: { $in: ["pending", "approved", "rejected"] } },
        { canceled: true }
      ]
    }).populate("user", "name email").sort({ cancellationRequestDate: -1, updatedAt: -1 }).limit(500).lean();

    const refunds = records.map((sub) => {
      const cashfreePaid = ["paid", "partial", "success", "successful"].includes(String(sub.paymentStatus || "").toLowerCase())
        ? Number(sub.amountPaid || 0) : 0;
      const manualPaid = Array.isArray(sub.paymentEntries)
        ? sub.paymentEntries.filter((entry) => entry.status === "confirmed")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
        : 0;
      const paidAmount = Math.max(cashfreePaid, manualPaid);
      return {
        ...sub,
        paidAmount,
        refundStatus: sub.refundStatus || "not_reviewed",
        refundEligible: sub.refundEligible === true,
        refundAmount: Number(sub.refundAmount || 0)
      };
    });
    const stats = {
      total: refunds.length,
      awaitingReview: refunds.filter((item) => ["not_reviewed", undefined].includes(item.refundStatus)).length,
      approvedAmount: refunds.filter((item) => ["approved", "processed"].includes(item.refundStatus)).reduce((sum, item) => sum + Number(item.refundAmount || 0), 0),
      pendingPayout: refunds.filter((item) => item.refundStatus === "approved").length,
      processed: refunds.filter((item) => item.refundStatus === "processed").length
    };
    res.set("Cache-Control", "no-store");
    res.json({ refunds, stats });
  } catch (err) {
    console.error("Admin refund list error:", err);
    res.status(500).json({ message: "Could not fetch refund records." });
  }
});

router.patch("/admin/refunds/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action, amount, reason, reference } = req.body || {};
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription record not found." });
    if (sub.cancellationStatus !== "approved" || !sub.canceled) {
      return res.status(409).json({ message: "Approve the subscription cancellation before reviewing its refund." });
    }

    const cashfreePaid = ["paid", "success", "successful"].includes(String(sub.paymentStatus || "").toLowerCase())
      ? Number(sub.amountPaid || 0) : 0;
    const manualPaid = Array.isArray(sub.paymentEntries)
      ? sub.paymentEntries.filter((entry) => entry.status === "confirmed")
          .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
      : 0;
    const paidAmount = Math.max(cashfreePaid, manualPaid);
    const cleanReason = String(reason || "").trim().slice(0, 1000);
    const cleanReference = String(reference || "").trim().slice(0, 200);

    if (action === "not_eligible") {
      sub.refundStatus = "not_eligible";
      sub.refundEligible = false;
      sub.refundAmount = 0;
      sub.refundReason = cleanReason || "Not refundable under the published cancellation policy.";
    } else if (action === "approve") {
      const refundAmount = Number(amount);
      if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > paidAmount) {
        return res.status(400).json({ message: `Refund amount must be greater than ₹0 and no more than the verified paid amount (₹${paidAmount.toFixed(2)}).` });
      }
      if (cleanReason.length < 5) return res.status(400).json({ message: "Add a short reason for this exceptional refund approval." });
      if (sub.refundStatus === "processed") return res.status(409).json({ message: "This refund has already been marked as processed." });
      sub.refundStatus = "approved";
      sub.refundEligible = true;
      sub.refundAmount = Number(refundAmount.toFixed(2));
      sub.refundReason = cleanReason;
      sub.refundReference = "";
      sub.refundProcessedAt = null;
    } else if (action === "reject") {
      if (sub.refundStatus === "processed") return res.status(409).json({ message: "A processed refund cannot be rejected." });
      if (cleanReason.length < 5) return res.status(400).json({ message: "Add a reason for rejecting the refund request." });
      sub.refundStatus = "rejected";
      sub.refundEligible = false;
      sub.refundAmount = 0;
      sub.refundReason = cleanReason;
      sub.refundReference = "";
      sub.refundProcessedAt = null;
    } else if (action === "processed") {
      if (sub.refundStatus !== "approved" || Number(sub.refundAmount || 0) <= 0) {
        return res.status(409).json({ message: "Only an approved refund can be marked as processed." });
      }
      if (!cleanReference) return res.status(400).json({ message: "Enter the bank/UPI refund reference before marking it processed." });
      sub.refundStatus = "processed";
      sub.refundReference = cleanReference;
      sub.refundProcessedAt = new Date();
    } else {
      return res.status(400).json({ message: "Choose a valid refund action." });
    }

    sub.refundReviewedBy = req.user.id;
    sub.refundReviewedAt = new Date();
    await sub.save();
    res.json({ message: "Refund record updated successfully.", refund: sub, paidAmount });
  } catch (err) {
    console.error("Admin refund update error:", err);
    res.status(500).json({ message: "Could not update refund record." });
  }
});

// ========== CAREERS (public) ==========
router.get("/careers", async (req, res) => {
  try {
    const careers = await Career.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ careers });
  } catch (err) {
    console.error("careers list:", err);
    res.status(500).json({ message: "Could not load careers." });
  }
});

router.post(
  "/careers/apply",
  (req, res, next) => {
    resumeUpload.single("resume")(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "Invalid resume upload." });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { name, email, phone, city, state, careerId } = req.body;
      if (
        !name?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !city?.trim() ||
        !state?.trim() ||
        !careerId
      ) {
        return res.status(400).json({ message: "All fields are required." });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required." });
      }
      const career = await Career.findById(careerId);
      if (!career || !career.isActive) {
        return res
          .status(400)
          .json({ message: "This position is not open for applications." });
      }
      const resumeMimeType = normalizeResumeMime(
        req.file.mimetype,
        req.file.originalname,
      );
      const resumeData = bufferToBase64(req.file.buffer, resumeMimeType);
      await CareerApplication.create({
        career: careerId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        resumeData,
        resumeMimeType,
        resumeFileName: req.file.originalname || "resume",
      });
      res.status(201).json({ message: "Application submitted successfully." });
    } catch (err) {
      console.error("career apply:", err);
      res.status(500).json({ message: "Could not submit application." });
    }
  },
);

// ========== CAREERS (admin) ==========
router.get(
  "/admin/careers",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const careers = await Career.find().sort({ createdAt: -1 });
      res.json({ careers });
    } catch (err) {
      res.status(500).json({ message: "Could not load careers." });
    }
  },
);

router.post(
  "/admin/careers",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { title, description, location, employmentType, isActive } =
        req.body;
      if (!title?.trim() || !description?.trim()) {
        return res
          .status(400)
          .json({ message: "Title and description are required." });
      }
      const career = await Career.create({
        title: title.trim(),
        description: description.trim(),
        location: (location || "").trim(),
        employmentType: (employmentType || "Full-time").trim(),
        isActive: isActive !== false,
      });
      res.status(201).json({ career });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not create career." });
    }
  },
);

router.put(
  "/admin/careers/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { title, description, location, employmentType, isActive } =
        req.body;
      const career = await Career.findByIdAndUpdate(
        req.params.id,
        {
          ...(title !== undefined && { title: String(title).trim() }),
          ...(description !== undefined && {
            description: String(description).trim(),
          }),
          ...(location !== undefined && { location: String(location).trim() }),
          ...(employmentType !== undefined && {
            employmentType: String(employmentType).trim(),
          }),
          ...(isActive !== undefined && { isActive: !!isActive }),
        },
        { new: true, runValidators: true },
      );
      if (!career)
        return res.status(404).json({ message: "Career not found." });
      res.json({ career });
    } catch (err) {
      res.status(500).json({ message: "Could not update career." });
    }
  },
);

router.delete(
  "/admin/careers/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      await CareerApplication.deleteMany({ career: req.params.id });
      const deleted = await Career.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: "Career not found." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Could not delete career." });
    }
  },
);

router.get(
  "/admin/career-applications",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const applications = await CareerApplication.find()
        .populate("career", "title isActive")
        .sort({ createdAt: -1 })
        .lean();
      res.json({ applications });
    } catch (err) {
      res.status(500).json({ message: "Could not load applications." });
    }
  },
);

// ==================== AGREEMENTS ====================

// Exact-email account lookup avoids choosing from a long user dropdown.
router.get("/admin/agreement-user-lookup", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid registered client email." });
    const user = await User.findOne({ $expr: { $eq: [{ $toLower: "$email" }, email] }, role: "user" }).select("name email");
    if (!user) return res.status(404).json({ message: "No registered user found with this email. Check the address or use manual client details." });
    res.json({ user });
  } catch (err) {
    console.error("Agreement user lookup failed:", err);
    res.status(500).json({ message: "Could not find the registered user." });
  }
});

// Save a new agreement document for a client
router.post(
  "/admin/agreements",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { clientUserId, clientName, clientEmail, clientCompany, clientAddress, clientMobile, projectName, projectTimeline, projectFeatures, paymentTerms, revisionPolicy, supportTerms, refundTerms, additionalTerms, documentType, documentTitle, htmlContent, notes, docCode } = req.body;
      if (!clientName || !documentType || !htmlContent || !documentTitle) {
        return res.status(400).json({ message: "Missing required fields." });
      }
      let linkedUser = null;
      if (clientUserId) {
        if (!/^[a-f0-9]{24}$/i.test(String(clientUserId))) return res.status(400).json({ message: "Invalid registered user ID." });
        linkedUser = await User.findOne({ _id: clientUserId, role: "user" }).select("name email");
        if (!linkedUser) return res.status(404).json({ message: "Selected client account was not found." });
      } else if (clientEmail) {
        const normalizedClientEmail = String(clientEmail).trim().toLowerCase();
        linkedUser = await User.findOne({
          $expr: { $eq: [{ $toLower: "$email" }, normalizedClientEmail] },
          role: "user",
        }).select("name email");
      }
      const cloudinaryHtmlContent = await moveInlineImagesToCloudinary(htmlContent);
      const agreement = await Agreement.create({
        clientUser: linkedUser?._id || null,
        clientName: linkedUser?.name || clientName,
        clientEmail: linkedUser?.email || String(clientEmail || "").trim().toLowerCase(),
        clientCompany: clientCompany || "",
        clientAddress: clientAddress || "", clientMobile: clientMobile || "",
        projectName: projectName || "", projectTimeline: projectTimeline || "", projectFeatures: projectFeatures || "",
        paymentTerms: paymentTerms || "", revisionPolicy: revisionPolicy || "", supportTerms: supportTerms || "",
        refundTerms: refundTerms || "", additionalTerms: additionalTerms || "",
        documentType,
        documentTitle,
        htmlContent: cloudinaryHtmlContent,
        notes: notes || "",
        docCode: docCode || "",
        status: linkedUser ? "sent" : "draft",
        responseStatus: "pending",
      });
      if (linkedUser) {
        await createUserNotification(
          linkedUser._id,
          "New agreement available",
          `A new document "${documentTitle}" (${docCode || agreement._id}) has been added to your ASKC dashboard.`,
          "agreement",
          `agreement:${agreement._id}`,
          "/dashboard/agreements"
        );
      }
      res.status(201).json({ agreement });
    } catch (err) {
      console.error("Agreement save error:", err);
      res.status(500).json({ message: "Could not save agreement." });
    }
  }
);

// PUBLIC: Serve agreement HTML only with its random, expiring email-share token.
router.get("/public/agreements/:id/view", async (req, res) => {
  try {
    const viewToken = String(req.query.token || "");
    if (!/^[a-f0-9]{64}$/i.test(viewToken)) return res.status(401).send("A valid agreement access link is required.");
    const viewTokenHash = crypto.createHash("sha256").update(viewToken).digest("hex");
    const agreement = await Agreement.findOne({
      _id: req.params.id,
      publicViewTokenHash: viewTokenHash,
      publicViewTokenExpiresAt: { $gt: new Date() },
    }).select("+publicViewTokenHash");
    if (!agreement) {
      return res.status(404).send(`
        <!DOCTYPE html><html><head><title>Not Found</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;margin:0;}
        .box{background:white;border-radius:16px;padding:40px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
        h2{color:#0f172a;}p{color:#64748b;}</style></head>
        <body><div class="box"><h2>Document Not Found</h2>
        <p>This document may have been removed or the link has expired.</p>
        <p style="margin-top:20px;font-size:12px;">ASKC TECHNOLOGIES &mdash; askctechnologies@gmail.com</p></div></body></html>
      `);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(agreement.htmlContent);
  } catch (err) {
    res.status(500).send("<p>Server error. Please try again later.</p>");
  }
});

// User: only return agreements addressed to the authenticated account.
router.get("/user-agreements", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    if (!user) return res.status(404).json({ message: "User not found." });
    const agreements = await Agreement.find({
      $or: [
        { clientUser: user._id },
        { clientUser: null, $expr: { $eq: [{ $toLower: "$clientEmail" }, String(user.email).toLowerCase()] } },
      ],
    }).select("-htmlContent").sort({ createdAt: -1 }).lean();
    res.json({ agreements });
  } catch (err) { res.status(500).json({ message: "Could not load your agreements." }); }
});

router.get("/user-agreements/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    const agreement = await Agreement.findById(req.params.id);
    const belongs = user && agreement && (
      String(agreement.clientUser || "") === String(user._id) ||
      (!agreement.clientUser && String(agreement.clientEmail || "").toLowerCase() === String(user.email || "").toLowerCase())
    );
    if (!belongs) return res.status(404).json({ message: "Agreement not found." });
    res.json({ agreement });
  } catch (err) { res.status(500).json({ message: "Could not open agreement." }); }
});

router.post("/user-agreements/:id/respond", authMiddleware, async (req, res) => {
  try {
    const action = String(req.body.action || "").toLowerCase();
    if (!["accept", "decline"].includes(action)) return res.status(400).json({ message: "Choose accept or decline." });
    const user = await User.findById(req.user.id).select("name email role");
    if (!user || user.role !== "user") return res.status(403).json({ message: "Only the assigned client can respond." });
    const agreement = await Agreement.findById(req.params.id);
    const belongs = agreement && (
      String(agreement.clientUser || "") === String(user._id) ||
      (!agreement.clientUser && String(agreement.clientEmail || "").toLowerCase() === String(user.email || "").toLowerCase())
    );
    if (!belongs) return res.status(404).json({ message: "Agreement not found for this account." });
    if (agreement.responseStatus === "accepted" || agreement.responseStatus === "declined") {
      return res.status(409).json({ message: "This agreement already has a recorded response." });
    }

    if (action === "accept") {
      const place = String(req.body.place || "").trim().slice(0, 240);
      if (!place) return res.status(400).json({ message: "Location is required to record acceptance. Allow location access or enter your place manually." });
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
      const acceptedAt = new Date();
      const acceptedAtIST = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "long", hour12: true,
      }).format(acceptedAt);
      const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
      agreement.responseStatus = "accepted";
      agreement.status = "accepted";
      agreement.acceptedByName = user.name;
      agreement.acceptedUserId = user._id;
      agreement.acceptedUserEmail = user.email || "";
      agreement.acceptedUserAgent = String(req.get("user-agent") || "").slice(0, 500);
      agreement.acceptanceConsent = "I confirm that I have read, understood and agree to the terms of this document.";
      agreement.acceptedAt = acceptedAt;
      agreement.acceptedAtIST = acceptedAtIST;
      agreement.acceptedPlace = place;
      agreement.acceptedTimezone = "Asia/Kolkata";
      agreement.acceptedLatitude = hasCoordinates ? latitude : null;
      agreement.acceptedLongitude = hasCoordinates ? longitude : null;
      const acceptanceHtml = `<div class="acceptance-record" style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:8px;padding:12px;margin-top:10px;color:#065f46;font:10px/1.7 Arial,sans-serif"><h4 style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px">Electronically accepted by client</h4><p><strong>Client:</strong> ${escapeHtml(user.name)}</p><p><strong>Registered account:</strong> ${escapeHtml(user.email)}</p><p><strong>Status:</strong> ACCEPTED</p><p><strong>Place:</strong> ${escapeHtml(place)}</p><p><strong>Date &amp; time:</strong> ${escapeHtml(acceptedAtIST)}</p><p><strong>Agreement reference:</strong> ${escapeHtml(agreement.docCode || agreement._id)}</p><p><strong>Consent:</strong> ${escapeHtml(agreement.acceptanceConsent)}</p></div>`;
      if (agreement.htmlContent.includes("<!--CLIENT_ACCEPTANCE_SLOT-->")) agreement.htmlContent = agreement.htmlContent.replace("<!--CLIENT_ACCEPTANCE_SLOT-->", acceptanceHtml); else agreement.htmlContent += acceptanceHtml;
    } else {
      agreement.responseStatus = "declined";
      agreement.status = "declined";
      agreement.declinedByName = user.name;
      agreement.declinedAt = new Date();
      agreement.declineReason = String(req.body.reason || "").trim().slice(0, 1000);
    }
    await agreement.save();

    const admins = await User.find({ role: { $in: ["admin", "coadmin"] } }).select("_id");
    const responseLabel = action === "accept" ? "accepted" : "declined";
    await Promise.all(admins.map(admin => createUserNotification(
      admin._id,
      `Agreement ${responseLabel}`,
      `${user.name} ${responseLabel} "${agreement.documentTitle}" (${agreement.docCode || agreement._id}).${action === "accept" ? ` Place: ${agreement.acceptedPlace}. Time: ${agreement.acceptedAtIST}.` : ""}`,
      "agreement",
      `agreement:response:${agreement._id}:${responseLabel}`,
      "/admin/agreements"
    )));
    res.json({ agreement, message: action === "accept" ? "Agreement accepted successfully." : "Agreement declined successfully." });
  } catch (err) {
    console.error("Agreement response failed:", err);
    res.status(500).json({ message: "Could not record your agreement response." });
  }
});

// Get all agreements (grouped by client)
router.get(
  "/admin/agreements",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const agreements = await Agreement.find()
        .sort({ createdAt: -1 })
        .select("-htmlContent")
        .lean();
      res.json({ agreements });
    } catch (err) {
      res.status(500).json({ message: "Could not load agreements." });
    }
  }
);

// Get agreements for a specific client
router.get(
  "/admin/agreements/client/:clientName",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const agreements = await Agreement.find({
        clientName: { $regex: new RegExp(`^${req.params.clientName}$`, "i") },
      })
        .sort({ createdAt: -1 })
        .select("-htmlContent")
        .lean();
      res.json({ agreements });
    } catch (err) {
      res.status(500).json({ message: "Could not load client agreements." });
    }
  }
);

// Get a single agreement with full HTML content
router.get(
  "/admin/agreements/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const agreement = await Agreement.findById(req.params.id);
      if (!agreement) return res.status(404).json({ message: "Agreement not found." });
      res.json({ agreement });
    } catch (err) {
      res.status(500).json({ message: "Could not load agreement." });
    }
  }
);

// Update agreement status
router.patch(
  "/admin/agreements/:id/status",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;
      const existingAgreement = await Agreement.findById(req.params.id);
      if (!existingAgreement) return res.status(404).json({ message: "Agreement not found." });
      if (["accepted", "declined"].includes(existingAgreement.responseStatus) && status !== existingAgreement.status) return res.status(409).json({ message: "A client-responded agreement is locked. Create a new version to change its terms." });
      const agreement = await Agreement.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!agreement) return res.status(404).json({ message: "Agreement not found." });
      res.json({ agreement });
    } catch (err) {
      res.status(500).json({ message: "Could not update agreement status." });
    }
  }
);

// Delete an agreement
router.delete(
  "/admin/agreements/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      await Agreement.findByIdAndDelete(req.params.id);
      res.json({ message: "Agreement deleted." });
    } catch (err) {
      res.status(500).json({ message: "Could not delete agreement." });
    }
  }
);

// Get list of unique clients
router.get(
  "/admin/agreements-clients",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const clients = await Agreement.aggregate([
        {
          $group: {
            _id: { $toLower: "$clientName" },
            clientName: { $first: "$clientName" },
            clientEmail: { $first: "$clientEmail" },
            clientCompany: { $first: "$clientCompany" },
            count: { $sum: 1 },
            lastActivity: { $max: "$createdAt" },
          },
        },
        { $sort: { lastActivity: -1 } },
      ]);
      res.json({ clients });
    } catch (err) {
      res.status(500).json({ message: "Could not load clients." });
    }
  }
);

// Send agreement email to client
router.post(
  "/admin/agreements/:id/send-email",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const agreement = await Agreement.findById(req.params.id);
      if (!agreement) return res.status(404).json({ message: "Agreement not found." });
      if (!agreement.clientEmail) return res.status(400).json({ message: "Client email is not set for this agreement." });

      const docTypeLabels = {
        nda: "Non-Disclosure Agreement",
        quotation: "Project Proposal & Quotation",
        invoice: "Tax Invoice",
        welcome: "Welcome to ASKC TECHNOLOGIES",
        handover: "Project Handover Document",
        change_request: "Change Request Form",
        questionnaire: "Client Questionnaire",
      };

      const greetings = {
        nda: `We are pleased to share your <strong>Non-Disclosure Agreement (NDA)</strong> as part of our secure project engagement process. Please review the attached document carefully before proceeding.`,
        quotation: `Thank you for your interest in our services! We have prepared a detailed <strong>Project Proposal & Quotation</strong> tailored specifically for your requirements. Please review it and let us know if you have any questions.`,
        invoice: `Please find your <strong>Tax Invoice</strong> for the services rendered. Kindly process the payment at your earliest convenience to ensure uninterrupted project progress.`,
        welcome: `<strong>Welcome aboard! 🎉</strong> We are absolutely thrilled to have you as part of the ASKC TECHNOLOGIES family. This letter outlines everything you need to know to get started on your digital journey with us.`,
        handover: `We are delighted to inform you that your project has been <strong>successfully completed</strong>! This Handover Document contains all the deliverables, access credentials, and support information for your reference.`,
        change_request: `We have received your <strong>Change Request</strong> and our team is reviewing it carefully. The attached document outlines the proposed changes and their impact on scope, timeline, and cost.`,
        questionnaire: `To better understand your needs and craft the perfect digital solution for you, please fill out the attached <strong>Client Questionnaire</strong>. Your inputs will help us tailor our services specifically to your goals.`,
      };

      const subject = docTypeLabels[agreement.documentType] || agreement.documentTitle;
      const greeting = greetings[agreement.documentType] || `Please find your document — <strong>${agreement.documentTitle}</strong> — from ASKC TECHNOLOGIES.`;

      // Public view link — use the base URL from env or a default
      const baseUrl = process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || (process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/dashboard\/?$/, "") : "https://askctechnologies.in");

      const publicViewToken = crypto.randomBytes(32).toString("hex");
      const publicViewTokenHash = crypto.createHash("sha256").update(publicViewToken).digest("hex");
      await Agreement.findByIdAndUpdate(agreement._id, {
        $set: {
          publicViewTokenHash,
          publicViewTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      const viewLink = `${baseUrl}/api/auth/public/agreements/${agreement._id}/view?token=${publicViewToken}`;

      const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#061d4b;border-radius:16px 16px 0 0;padding:30px 40px;text-align:center;">
            <h1 style="color:#ffffff;font-size:25px;line-height:1.05;font-weight:800;margin:0;letter-spacing:-0.3px;">ASKC<br><span style="color:#8fc5ff;">TECHNOLOGIES</span></h1>
            <p style="color:#c2d5ee;font-size:10px;margin:9px 0 0;text-transform:uppercase;letter-spacing:2px;">Ideas to digital impact</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="font-size:16px;color:#334155;font-weight:700;margin:0 0 6px;">Dear ${agreement.clientName},</p>
            <div style="width:40px;height:3px;background:#165ebc;border-radius:2px;margin-bottom:24px;"></div>

            <p style="font-size:14px;color:#475569;line-height:1.8;margin:0 0 24px;">${greeting}</p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
              <p style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 8px;">Document Details</p>
              <p style="font-size:15px;color:#0f172a;font-weight:800;margin:0 0 4px;">${agreement.documentTitle}</p>
              <p style="font-size:12px;color:#64748b;margin:0;">Prepared by ASKC TECHNOLOGIES &bull; ${new Date(agreement.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:10px 0 28px;">
                  <a href="${viewLink}" target="_blank"
                    style="display:inline-block;background:#165ebc;color:#ffffff;font-weight:800;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                    📄 View Document
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 8px;">If you have any questions or require clarification, please do not hesitate to contact us. We are committed to ensuring a seamless experience for you.</p>
            <p style="font-size:13px;color:#64748b;margin:0;">Warm regards,<br><strong style="color:#0f172a;">Shubham Kumar</strong><br>Founder & Senior Web Engineer, ASKC TECHNOLOGIES</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#061d4b;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0 0 6px;">📧 askctechnologies@gmail.com &nbsp;|&nbsp; 🌐 askctechnologies.in &nbsp;|&nbsp; 📞 +91 79923 65197</p>
            <p style="color:#475569;font-size:10px;margin:0;">Bihar IT Solution, Main Road, Near City Center, Patna, Bihar - 800001</p>
            <p style="color:#334155;font-size:10px;margin:8px 0 0;">© ${new Date().getFullYear()} ASKC TECHNOLOGIES. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await sendEmail(
        agreement.clientEmail,
        `${subject} — ASKC TECHNOLOGIES`,
        `Dear ${agreement.clientName},\n\nPlease review your document: ${agreement.documentTitle}\n\nView it here: ${viewLink}\n\nRegards,\nShubham Kumar\nASKC TECHNOLOGIES`,
        htmlEmail,
        `"Shubham Kumar | ASKC TECHNOLOGIES" <askctechnologies@gmail.com>`
      );

      // Update status to 'sent'
      await Agreement.findByIdAndUpdate(req.params.id, { status: "sent" });

      res.json({ message: "Email sent successfully to " + agreement.clientEmail });
    } catch (err) {
      console.error("Agreement email error:", err);
      res.status(500).json({ message: err.message || "Failed to send email." });
    }
  }
);



// Client Work CMS
// Public website: only active client work items are visible.
router.get("/client-work", async (req, res) => {
  try {
    const items = await ClientWork.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ clientWork: items });
  } catch (err) {
    console.error("Error fetching client work:", err);
    res.status(500).json({ message: "Could not load client work." });
  }
});

// Admin: manage client names and logos.
router.get("/admin/client-work", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const items = await ClientWork.find().sort({ order: 1, createdAt: -1 });
    res.json({ clientWork: items });
  } catch (err) {
    console.error("Error fetching admin client work:", err);
    res.status(500).json({ message: "Could not fetch client work." });
  }
});

router.post("/admin/client-work", authMiddleware, coAdminMiddleware, upload.single("logo"), async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Client or website name is required." });
    if (!req.file) return res.status(400).json({ message: "Please upload a client logo." });
    const item = await ClientWork.create({
      name,
      logo: (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/client-logos")).url,
      websiteUrl: String(req.body.websiteUrl || "").trim(),
      order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0,
      isActive: req.body.isActive !== "false",
    });
    res.status(201).json({ clientWork: item, message: "Client work added successfully." });
  } catch (err) {
    console.error("Error creating client work:", err);
    const isStorageConfigError = err.code === "CLOUDINARY_NOT_CONFIGURED";
    const isUnsupportedImage = /Only JPG, PNG, WebP, GIF and SVG/i.test(err.message || "");
    res.status(isStorageConfigError ? 503 : isUnsupportedImage ? 400 : 500).json({
      message: isStorageConfigError
        ? "Logo storage is temporarily unavailable. Please ask the administrator to check the image storage settings."
        : isUnsupportedImage
          ? "Please upload a JPG, PNG, WebP, GIF or SVG logo."
          : "Could not save this client work item. Please check the logo and try again."
    });
  }
});

router.put("/admin/client-work/:id", authMiddleware, coAdminMiddleware, upload.single("logo"), async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Client or website name is required." });
    const update = {
      name,
      websiteUrl: String(req.body.websiteUrl || "").trim(),
      order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0,
      isActive: req.body.isActive !== "false",
    };
    if (req.file) update.logo = (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/client-logos")).url;
    const item = await ClientWork.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Client work item not found." });
    res.json({ clientWork: item, message: "Client work updated successfully." });
  } catch (err) {
    console.error("Error updating client work:", err);
    const isStorageConfigError = err.code === "CLOUDINARY_NOT_CONFIGURED";
    const isUnsupportedImage = /Only JPG, PNG, WebP, GIF and SVG/i.test(err.message || "");
    res.status(isStorageConfigError ? 503 : isUnsupportedImage ? 400 : 500).json({
      message: isStorageConfigError
        ? "Logo storage is temporarily unavailable. Please ask the administrator to check the image storage settings."
        : isUnsupportedImage
          ? "Please upload a JPG, PNG, WebP, GIF or SVG logo."
          : "Could not update this client work item. Please check the logo and try again."
    });
  }
});

router.delete("/admin/client-work/:id", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const item = await ClientWork.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Client work item not found." });
    res.json({ message: "Client work deleted successfully." });
  } catch (err) {
    console.error("Error deleting client work:", err);
    res.status(500).json({ message: "Could not delete client work." });
  }
});


// Public: latest active projects for the homepage.
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Could not load projects." });
  }
});

// Admin: manage homepage projects.
router.get("/admin/projects", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    console.error("Error fetching admin projects:", err);
    res.status(500).json({ message: "Could not fetch projects." });
  }
});

router.post("/admin/projects", authMiddleware, coAdminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title || !description) {
      return res.status(400).json({ message: "Project title and description are required." });
    }
    const project = await Project.create({
      title,
      description,
      category: String(req.body.category || "Web App").trim(),
      highlight: String(req.body.highlight || "").trim(),
      technologies: String(req.body.technologies || "").split(",").map(item => item.trim()).filter(Boolean),
      projectUrl: String(req.body.projectUrl || "").trim(),
      icon: String(req.body.icon || "briefcase").trim(),
      color: /^#[0-9a-fA-F]{6}$/.test(String(req.body.color || "")) ? req.body.color : "#64748b",
      image: req.file ? (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/projects")).url : "",
      order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0,
      isActive: req.body.isActive !== "false"
    });
    res.status(201).json({ project, message: "Project added successfully." });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: "Could not add project." });
  }
});

router.put("/admin/projects/:id", authMiddleware, coAdminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title || !description) {
      return res.status(400).json({ message: "Project title and description are required." });
    }
    const update = {
      title,
      description,
      category: String(req.body.category || "Web App").trim(),
      highlight: String(req.body.highlight || "").trim(),
      technologies: String(req.body.technologies || "").split(",").map(item => item.trim()).filter(Boolean),
      projectUrl: String(req.body.projectUrl || "").trim(),
      icon: String(req.body.icon || "briefcase").trim(),
      color: /^#[0-9a-fA-F]{6}$/.test(String(req.body.color || "")) ? req.body.color : "#64748b",
      order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0,
      isActive: req.body.isActive !== "false"
    };
    if (req.file) update.image = (await uploadImageBuffer(req.file.buffer, req.file.mimetype, "askc-technologies/projects")).url;
    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json({ project, message: "Project updated successfully." });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ message: "Could not update project." });
  }
});

router.delete("/admin/projects/:id", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Could not delete project." });
  }
});


/* DPDP privacy centre: authenticated data rights, consent and grievance workflows. */
const PrivacyRequest = require("../models/PrivacyRequest");
const PrivacyConsentEvent = require("../models/PrivacyConsentEvent");

router.get("/privacy/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email subscribeOffers marketingConsent marketingConsentAt createdAt updatedAt").lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    const [requests, consentHistory] = await Promise.all([
      PrivacyRequest.find({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      PrivacyConsentEvent.find({ user: req.user.id }).sort({ occurredAt: -1 }).limit(100).lean()
    ]);
    res.json({ user, requests, consentHistory });
  } catch (err) {
    console.error("Privacy centre load error:", err);
    res.status(500).json({ message: "Could not load privacy information." });
  }
});

router.patch("/privacy/consent", authMiddleware, async (req, res) => {
  try {
    if (typeof req.body?.marketingEmails !== "boolean") {
      return res.status(400).json({ message: "Choose whether to receive marketing emails." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const granted = req.body.marketingEmails;
    user.marketingConsent = granted;
    user.subscribeOffers = granted;
    user.marketingConsentAt = granted ? new Date() : null;
    await user.save();

    await PrivacyConsentEvent.create({
      user: user._id,
      purpose: "marketing_emails",
      action: granted ? "granted" : "withdrawn",
      source: "privacy-centre"
    });

    await NewsletterSubscriber.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      granted
        ? { $set: { email: user.email.toLowerCase(), status: "subscribed", consentedAt: new Date(), consentSource: "privacy-centre", consentedBy: String(user._id) } }
        : { $set: { status: "unsubscribed" }, $setOnInsert: { email: user.email.toLowerCase(), consentSource: "privacy-centre" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: granted ? "Marketing email consent saved." : "Marketing email consent withdrawn.", marketingEmails: granted });
  } catch (err) {
    console.error("Privacy consent update error:", err);
    res.status(500).json({ message: "Could not update consent preference." });
  }
});

router.get("/privacy/export", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role image subscribeOffers marketingConsent marketingConsentAt createdAt updatedAt").lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    const [complaints, subscriptions, projectRequests, privacyRequests, consentHistory] = await Promise.all([
      Complaint.find({ user: req.user.id }).select("message status response createdAt updatedAt").lean(),
      Subscription.find({ user: req.user.id }).select("plan status uniqueId expiresAt paymentMethod paymentStatus amountPaid durationDays createdAt updatedAt").lean(),
      ProjectRequirement.find({ user: req.user.id }).select("submissionId projectIdea websitePreference linkOption status estimatedCompletionDate createdAt updatedAt").lean(),
      PrivacyRequest.find({ user: req.user.id }).select("type details status response createdAt updatedAt").lean(),
      PrivacyConsentEvent.find({ user: req.user.id }).select("purpose action source policyVersion occurredAt").lean()
    ]);
    res.setHeader("Content-Disposition", 'attachment; filename="askc-personal-data.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      dataController: "ASKC TECHNOLOGIES",
      note: "This export contains personal data currently retrievable from the ASKC account systems. Some records may be retained where required by applicable law.",
      profile: user,
      complaints,
      subscriptions,
      projectRequests,
      privacyRequests,
      consentHistory
    });
  } catch (err) {
    console.error("Personal data export error:", err);
    res.status(500).json({ message: "Could not prepare your personal data export." });
  }
});

router.post("/privacy/requests", authMiddleware, async (req, res) => {
  try {
    const type = String(req.body?.type || "").trim();
    const details = String(req.body?.details || "").trim();
    if (!["access", "correction", "erasure", "grievance"].includes(type)) {
      return res.status(400).json({ message: "Select a valid privacy request type." });
    }
    if (details.length < 10 || details.length > 4000) {
      return res.status(400).json({ message: "Please provide details between 10 and 4,000 characters." });
    }
    const existing = await PrivacyRequest.findOne({
      user: req.user.id,
      type,
      status: { $in: ["submitted", "in_review", "awaiting_user"] }
    });
    if (existing) return res.status(409).json({ message: "You already have an open request of this type.", request: existing });
    const submittedAt = new Date();
    const request = await PrivacyRequest.create({
      user: req.user.id,
      type,
      details,
      dueAt: new Date(submittedAt.getTime() + 90 * 24 * 60 * 60 * 1000),
      statusHistory: [{ status: "submitted", note: "Request submitted by user.", changedBy: req.user.id, changedAt: submittedAt }]
    });
    res.status(201).json({ message: "Privacy request submitted successfully.", request });
  } catch (err) {
    console.error("Privacy request submission error:", err);
    res.status(500).json({ message: "Could not submit your privacy request." });
  }
});

router.get("/admin/privacy/requests", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const requests = await PrivacyRequest.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    const [total, submitted, inReview, completed, erasure] = await Promise.all([
      PrivacyRequest.countDocuments(),
      PrivacyRequest.countDocuments({ status: "submitted" }),
      PrivacyRequest.countDocuments({ status: "in_review" }),
      PrivacyRequest.countDocuments({ status: "completed" }),
      PrivacyRequest.countDocuments({ type: "erasure", status: { $in: ["submitted", "in_review", "awaiting_user"] } })
    ]);
    res.json({ requests, stats: { total, submitted, inReview, completed, erasure } });
  } catch (err) {
    console.error("Admin privacy requests error:", err);
    res.status(500).json({ message: "Could not fetch privacy requests." });
  }
});

router.patch("/admin/privacy/requests/:id", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const allowedStatuses = ["submitted", "in_review", "awaiting_user", "completed", "rejected"];
    const allowedDecisions = ["pending", "approved", "partially_approved", "declined"];
    const allowedActions = ["not_started", "provided", "corrected", "erased", "anonymized", "retained_partially", "not_applicable"];
    const status = String(req.body?.status || "");
    const response = String(req.body?.response || "").trim().slice(0, 4000);
    const decision = String(req.body?.decision || "pending");
    const resolutionAction = String(req.body?.resolutionAction || "not_started");
    const retentionReason = String(req.body?.retentionReason || "").trim().slice(0, 2000);
    const internalNotes = String(req.body?.internalNotes || "").trim().slice(0, 4000);
    const identityVerified = req.body?.identityVerified === true;

    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid request status." });
    if (!allowedDecisions.includes(decision)) return res.status(400).json({ message: "Invalid decision." });
    if (!allowedActions.includes(resolutionAction)) return res.status(400).json({ message: "Invalid resolution action." });
    if (status === "completed" && !response) return res.status(400).json({ message: "Add a user-visible response before completing the request." });
    if (status === "completed" && !identityVerified) return res.status(400).json({ message: "Verify the requester's identity before completing the request." });

    const request = await PrivacyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Privacy request not found." });
    if (status === "completed" && request.type === "erasure") {
      if (!["erased", "anonymized", "retained_partially"].includes(resolutionAction)) {
        return res.status(400).json({ message: "For erasure requests, record whether data was erased, anonymised or retained in part." });
      }
      if (resolutionAction === "retained_partially" && retentionReason.length < 10) {
        return res.status(400).json({ message: "Record the legal or operational reason for any retained data." });
      }
    }

    const now = new Date();
    const previousStatus = request.status;
    request.status = status;
    request.response = response;
    request.decision = decision;
    request.resolutionAction = resolutionAction;
    request.retentionReason = retentionReason;
    request.internalNotes = internalNotes;
    if (identityVerified && !request.identityVerifiedAt) {
      request.identityVerifiedAt = now;
      request.identityVerifiedBy = req.user.id;
    }
    if (["completed", "rejected"].includes(status)) {
      request.resolvedAt = now;
      request.resolvedBy = req.user.id;
      request.userNotifiedAt = now;
    } else {
      request.resolvedAt = null;
      request.resolvedBy = null;
    }
    if (previousStatus !== status || response) {
      request.statusHistory.push({ status, note: response, changedBy: req.user.id, changedAt: now });
    }
    request.adminAudit.push({
      action: "request_updated",
      note: "Status, decision, identity verification and resolution metadata updated.",
      changedBy: req.user.id,
      changedAt: now
    });
    await request.save();
    const updated = await PrivacyRequest.findById(request._id).populate("user", "name email").lean();
    res.json({ message: "Privacy request updated.", request: updated });
  } catch (err) {
    console.error("Admin privacy request update error:", err);
    res.status(500).json({ message: "Could not update privacy request." });
  }
});


/**
 * One-time migration for legacy Base64 images already stored in MongoDB.
 * Run from the admin Team page after Cloudinary environment variables are configured.
 */
router.post("/admin/cloudinary/migrate-images", authMiddleware, coAdminMiddleware, async (req, res) => {
  const summary = { founder: 0, team: 0, clientLogos: 0, projects: 0, paymentProofs: 0, idCards: 0, userProfiles: 0, agreementImages: 0, failed: [] };
  const migrateField = async (Model, field, bucket, label) => {
    const docs = await Model.find({ [field]: /^data:image\// }).limit(1000);
    for (const doc of docs) {
      try {
        doc[field] = await uploadDataUri(doc[field], `askc-technologies/${bucket}`);
        await doc.save();
        summary[label] += 1;
      } catch (error) {
        summary.failed.push({ type: label, id: String(doc._id), message: error.message });
      }
    }
  };
  try {
    await migrateField(FounderProfile, "image", "founder", "founder");
    await migrateField(TeamMember, "profileImage", "team", "team");
    await migrateField(ClientWork, "logo", "client-logos", "clientLogos");
    await migrateField(Project, "image", "projects", "projects");
    await migrateField(Subscription, "paymentImage", "payment-proofs", "paymentProofs");
    await migrateField(IDCard, "photo", "id-cards", "idCards");
    await migrateField(User, "image", "user-profiles", "userProfiles");

    const agreements = await Agreement.find({ htmlContent: /data:image\// }).limit(1000);
    for (const agreement of agreements) {
      try {
        agreement.htmlContent = await moveInlineImagesToCloudinary(agreement.htmlContent);
        await agreement.save();
        summary.agreementImages += 1;
      } catch (error) {
        summary.failed.push({ type: "agreementImages", id: String(agreement._id), message: error.message });
      }
    }
    res.json({ message: "Legacy image migration completed.", summary });
  } catch (error) {
    console.error("Cloudinary image migration failed:", error.message);
    res.status(error.code === "CLOUDINARY_NOT_CONFIGURED" ? 503 : 500).json({ message: error.message || "Could not migrate legacy images.", summary });
  }
});


/* Admin transaction ledger: subscription purchase/payment records. */
router.get("/admin/transactions", authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const query = String(req.query.search || "").trim().slice(0, 120);
    const status = String(req.query.status || "all");
    const method = String(req.query.method || "all");
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(10, Math.min(100, Number.parseInt(req.query.limit, 10) || 25));
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const filter = {};
    if (["success", "pending", "failed", "refunded", "cancelled"].includes(status)) {
      if (status === "success") filter.paymentStatus = { $in: ["paid", "success", "completed", "confirmed"] };
      if (status === "pending") filter.paymentStatus = "pending";
      if (status === "failed") filter.paymentStatus = { $in: ["failed", "rejected"] };
      if (status === "refunded") filter.refundStatus = "processed";
      if (status === "cancelled") filter.canceled = true;
    }
    if (["cashfree", "upi", "card", "netbanking"].includes(method)) filter.paymentMethod = method;
    if (from && !Number.isNaN(from.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $gte: from };
    if (to && !Number.isNaN(to.getTime())) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt = { ...(filter.createdAt || {}), $lte: endOfDay };
    }
    const pipeline = [
      { $match: filter },
      { $lookup: { from: User.collection.name, let: { userId: "$user" }, pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
        { $project: { name: 1, email: 1 } },
      ], as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ];
    if (query) {
      const escaped = query.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      pipeline.push({ $match: { $or: [
        { transactionId: searchRegex }, { cashfreeOrderId: searchRegex }, { uniqueId: searchRegex },
        { "user.name": searchRegex }, { "user.email": searchRegex }, { planName: searchRegex },
        { plan: searchRegex }, { couponCode: searchRegex }, { paymentMethod: searchRegex },
      ] } });
    }
    pipeline.push(
      { $addFields: {
        normalizedPaymentStatus: { $toLower: { $ifNull: ["$paymentStatus", { $ifNull: ["$status", "pending"] }] } },
        normalizedAmountPaid: { $ifNull: ["$amountPaid", { $ifNull: ["$totalAmount", 0] }] },
      } },
      { $facet: {
        metadata: [{ $count: "total" }],
        summary: [{ $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $in: ["$normalizedPaymentStatus", ["paid", "success", "completed", "confirmed", "active"]] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$normalizedPaymentStatus", "pending"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $in: ["$normalizedPaymentStatus", ["failed", "rejected"]] }, 1, 0] } },
          refunded: { $sum: { $cond: [{ $eq: ["$refundStatus", "processed"] }, 1, 0] } },
          grossAmount: { $sum: "$normalizedAmountPaid" },
        } }],
        transactions: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $addFields: {
            transactionId: { $ifNull: ["$transactionId", { $ifNull: ["$cashfreeOrderId", "$uniqueId"] }] },
            amountPaid: "$normalizedAmountPaid",
            paymentStatus: "$normalizedPaymentStatus",
          } },
          { $project: { normalizedPaymentStatus: 0, normalizedAmountPaid: 0 } },
        ],
      } },
    );
    const [result] = await Subscription.aggregate(pipeline).allowDiskUse(true);
    const summary = result?.summary?.[0] || { total: 0, successful: 0, pending: 0, failed: 0, refunded: 0, grossAmount: 0 };
    const total = result?.metadata?.[0]?.total || 0;
    return res.json({
      transactions: result?.transactions || [],
      summary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin transactions fetch failed:", error);
    return res.status(500).json({ message: "Could not load transaction records." });
  }
});

/* Two-factor authentication: TOTP authenticator or registered-email OTP. */
const twoFactorCrypto = require("../utils/twoFactor");
async function createSessionForUser(res, user, req) {
  const sessionId = crypto.randomUUID();
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].slice(0, 100);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 500);
  await User.findByIdAndUpdate(user._id, {
    $set: { lastLoginAt: new Date(), lastLoginIp: ip, lastLoginUserAgent: userAgent },
    $push: { sessions: { $each: [{ sessionId, createdAt: new Date(), lastSeenAt: new Date(), ip, userAgent, revokedAt: null }], $slice: -30 } },
  });
  const token = jwt.sign({ id: user._id, role: user.role, sv: Number(user.sessionVersion || 0), sid: sessionId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}
router.get("/security/2fa", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("email twoFactorEnabled twoFactorMethod");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ enabled: Boolean(user.twoFactorEnabled), method: user.twoFactorMethod || "", email: user.email });
});
router.post("/security/2fa/authenticator/setup", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+twoFactorPendingSecret");
    if (!user) return res.status(404).json({ message: "User not found." });
    const secret = twoFactorCrypto.makeTotpSecret();
    user.twoFactorPendingSecret = twoFactorCrypto.encryptSecret(secret);
    await user.save();
    const label = encodeURIComponent(`ASKC TECHNOLOGIES:${user.email}`);
    const issuer = encodeURIComponent("ASKC TECHNOLOGIES");
    const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    res.json({ secret, otpauthUri, message: "Add this account manually in your authenticator app, then verify the 6-digit code." });
  } catch (err) {
    console.error("2FA authenticator setup failed:", err);
    res.status(500).json({ message: "Could not start authenticator setup." });
  }
});
router.post("/security/2fa/authenticator/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+twoFactorPendingSecret");
    if (!user?.twoFactorPendingSecret) return res.status(400).json({ message: "Start authenticator setup first." });
    const secret = twoFactorCrypto.decryptSecret(user.twoFactorPendingSecret);
    if (!twoFactorCrypto.verifyTotp(secret, req.body?.code)) return res.status(400).json({ message: "Invalid authenticator code. Check your app and try again." });
    user.twoFactorSecret = user.twoFactorPendingSecret;
    user.twoFactorPendingSecret = "";
    user.twoFactorEnabled = true;
    user.twoFactorMethod = "authenticator";
    await user.save();
    res.json({ enabled: true, method: user.twoFactorMethod, message: "Authenticator two-factor authentication enabled." });
  } catch (err) {
    console.error("2FA authenticator verification failed:", err);
    res.status(500).json({ message: "Could not verify authenticator setup." });
  }
});
router.post("/security/2fa/email/send", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email name");
    if (!user) return res.status(404).json({ message: "User not found." });
    const code = require("crypto").randomInt(100000, 1000000).toString();
    await Otp.deleteMany({ email: user.email.toLowerCase(), purpose: "twofactor-enable" });
    await Otp.create({ email: user.email.toLowerCase(), otp: code, purpose: "twofactor-enable", expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
    try {
      await sendEmail(user.email, "Enable email two-factor authentication — ASKC TECHNOLOGIES", `Your verification code is ${code}. It expires in 5 minutes.`, `<div style="margin:0;background:#f3f6fb;padding:28px 12px;font-family:Arial,sans-serif;color:#172033"><div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="background:#102b55;padding:24px 28px;color:#fff"><div style="font-size:22px;font-weight:800">ASKC<br><span style="color:#8fc5ff">TECHNOLOGIES</span></div><div style="font-size:10px;letter-spacing:2px;color:#c2d5ee;margin-top:8px">ACCOUNT SECURITY</div></div><div style="padding:28px"><h2 style="color:#102b55">Verify your login</h2><p style="color:#536174;line-height:1.7">Use this one-time code to verify your email two-factor authentication. Do not share it with anyone.</p><div style="background:#f5f8fc;border:1px solid #dce6f2;border-radius:12px;padding:22px;text-align:center"><p style="font-size:11px;letter-spacing:2px;color:#718096">YOUR VERIFICATION CODE</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#1763b1">${code}</div></div><p style="font-size:12px;color:#64748b;margin-top:22px">This code expires in 5 minutes.</p></div><div style="background:#f8fafc;padding:18px 28px;color:#748196;font-size:11px">ASKC TECHNOLOGIES · <a href="https://askctechnologies.in" style="color:#1756a2">askctechnologies.in</a></div></div></div>`);
    } catch (mailError) {
      await Otp.deleteMany({ email: user.email.toLowerCase(), purpose: "twofactor-enable" });
      return res.status(503).json({ message: "Could not send verification email. Please try again." });
    }
    res.json({ message: "Verification code sent to your registered email." });
  } catch (err) {
    console.error("2FA email send failed:", err);
    res.status(500).json({ message: "Could not send verification code." });
  }
});
router.post("/security/2fa/email/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const code = String(req.body?.code || "").trim();
    const record = user && await Otp.findOne({ email: user.email.toLowerCase(), otp: code, purpose: "twofactor-enable", expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: "Invalid or expired email verification code." });
    await Otp.deleteMany({ email: user.email.toLowerCase(), purpose: "twofactor-enable" });
    user.twoFactorEnabled = true;
    user.twoFactorMethod = "email";
    user.twoFactorSecret = "";
    user.twoFactorPendingSecret = "";
    await user.save();
    res.json({ enabled: true, method: "email", message: "Email two-factor authentication enabled." });
  } catch (err) {
    console.error("2FA email verification failed:", err);
    res.status(500).json({ message: "Could not enable email two-factor authentication." });
  }
});
router.post("/security/2fa/disable", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password +twoFactorSecret +twoFactorPendingSecret");
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.twoFactorEnabled) return res.json({ enabled: false, message: "Two-factor authentication is already disabled." });
    const passwordOk = user.password && await require("bcryptjs").compare(String(req.body?.password || ""), user.password);
    if (!passwordOk) return res.status(400).json({ message: "Enter your current password to disable 2FA." });
    const code = String(req.body?.code || "");
    let valid = false;
    if (user.twoFactorMethod === "authenticator" && user.twoFactorSecret) valid = twoFactorCrypto.verifyTotp(twoFactorCrypto.decryptSecret(user.twoFactorSecret), code);
    if (user.twoFactorMethod === "email") {
      const record = await Otp.findOne({ email: user.email.toLowerCase(), otp: code, purpose: "twofactor-enable", expiresAt: { $gt: new Date() } });
      valid = Boolean(record);
      if (record) await Otp.deleteMany({ email: user.email.toLowerCase(), purpose: "twofactor-enable" });
    }
    if (!valid) return res.status(400).json({ message: "Enter a valid current 2FA code. For email 2FA, request a fresh code first." });
    user.twoFactorEnabled = false; user.twoFactorMethod = ""; user.twoFactorSecret = ""; user.twoFactorPendingSecret = "";
    await user.save();
    res.json({ enabled: false, message: "Two-factor authentication disabled." });
  } catch (err) {
    console.error("2FA disable failed:", err);
    res.status(500).json({ message: "Could not disable two-factor authentication." });
  }
});
router.post("/2fa/login/verify", async (req, res) => {
  try {
    const challenge = jwt.verify(String(req.body?.challengeToken || ""), process.env.JWT_SECRET);
    if (challenge.purpose !== "two-factor-login") return res.status(401).json({ message: "Invalid login challenge." });
    const user = await User.findById(challenge.id).select("+twoFactorSecret");
    if (!user || !user.twoFactorEnabled) return res.status(401).json({ message: "This login challenge is no longer valid." });
    const code = String(req.body?.code || "").trim();
    let valid = false;
    if (user.twoFactorMethod === "authenticator" && user.twoFactorSecret) valid = twoFactorCrypto.verifyTotp(twoFactorCrypto.decryptSecret(user.twoFactorSecret), code);
    if (user.twoFactorMethod === "email") {
      const record = await Otp.findOne({ email: user.email.toLowerCase(), otp: code, purpose: "twofactor-login", expiresAt: { $gt: new Date() } });
      valid = Boolean(record);
      if (record) await Otp.deleteMany({ email: user.email.toLowerCase(), purpose: "twofactor-login" });
    }
    if (!valid) return res.status(400).json({ message: "Invalid or expired verification code." });
    user.lastLoginAt = new Date();
    user.lastLoginIp = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].slice(0, 100);
    user.lastLoginUserAgent = String(req.headers["user-agent"] || "").slice(0, 500);
    await user.save();
    const token = await createSessionForUser(res, user, req);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role }, message: "Login verified successfully." });
  } catch (err) {
    res.status(401).json({ message: "Login verification expired. Please sign in again." });
  }
});

module.exports = router;
