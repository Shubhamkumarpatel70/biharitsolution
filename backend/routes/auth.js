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
const ProjectRequirement = require("../models/ProjectRequirement");
const Career = require("../models/Career");
const CareerApplication = require("../models/CareerApplication");
const FundTransaction = require("../models/FundTransaction");
const IDCard = require("../models/IDCard");
const Agreement = require("../models/Agreement");
const { sendEmail } = require("../utils/email");
const { parsePlanDurationDays } = require("../utils/planDuration");
const multer = require("multer");
const path = require("path");

// Configure multer for memory storage (to convert to base64)
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

router.post("/register", registerUser);
router.get("/captcha", getLoginCaptcha);
router.post("/login", loginUser);
router.post("/register-admin", registerAdmin);

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
  (req, res) => {
    // Successful authentication, redirect or send token
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
      secure: process.env.NODE_ENV === "production",
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
function authMiddleware(req, res, next) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    req.user = decoded;
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
    process.env.PROMOTIONAL_UNSUBSCRIBE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.REACT_APP_API_URL;

  if (explicit && String(explicit).trim()) {
    const raw = String(explicit).trim();
    try {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      return u.origin.replace(/\/$/, "");
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return null;
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
    await Subscription.findOneAndUpdate(
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
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Cashfree webhook error:", err);
    return res.status(500).json({ message: "Webhook processing failed." });
  }
});

router.post("/cashfree/create-order", authMiddleware, async (req, res) => {
  try {
    const { plan, phone } = req.body || {};
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
    if (!planDoc || !Number.isFinite(Number(planDoc.price)) || Number(planDoc.price) <= 0) {
      return res.status(400).json({ message: "Selected plan is unavailable." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const planName = planDoc.name.toLowerCase();
    const planEnum = planName.includes("premium") ? "premium" : planName.includes("pro") ? "pro" : "starter";
    const orderId = "ASKC_" + Date.now() + "_" + require("crypto").randomBytes(4).toString("hex");
    const amount = Number(Number(planDoc.price).toFixed(2));
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
          return_url: (["https://askcweb.in", "https://www.askcweb.in", "https://askctechnologies.in"].includes(req.headers.origin)
            ? req.headers.origin
            : String(process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://askcweb.in").replace(/\/+$/, "")) +
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
      uniqueId: orderId,
      status: "pending",
      expiresAt: new Date(Date.now() + durationDays * 86400000),
      paymentMethod: "cashfree",
      durationDays,
      cashfreeOrderId: orderId,
      paymentStatus: "created",
      amountPaid: amount
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
      paymentImageBase64 = bufferToBase64(
        paymentImage.buffer,
        paymentImage.mimetype,
      );
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
      let query = {
        status: { $in: ["active", "expired"] },
        cancellationStatus: { $ne: "approved" }, // Exclude cancelled subscriptions
      };

      if (status && status !== "all") {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { uniqueId: { $regex: search, $options: "i" } },
          { transactionId: { $regex: search, $options: "i" } },
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
      const sub = await Subscription.findByIdAndUpdate(
        req.params.id,
        { status: "active", rejectionReason: "" },
        { new: true },
      );
      res.json({ subscription: sub });
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
    const { planName, totalAmount, durationDays, note } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const amount = Number(totalAmount);
    if (!String(planName || "").trim() || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Enter a plan name and valid amount." });
    }
    const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));
    const uniqueId = "ASKC-ADM-" + Date.now() + "-" + require("crypto").randomBytes(3).toString("hex").toUpperCase();
    const sub = await Subscription.create({
      user: user._id,
      plan: "starter",
      planName: String(planName).trim(),
      totalAmount: amount,
      amountPaid: 0,
      paymentStatus: amount === 0 ? "paid" : "pending",
      durationDays: days,
      status: "active",
      uniqueId,
      expiresAt: new Date(Date.now() + days * 86400000),
      paymentEntries: [],
      adminNote: String(note || "").slice(0, 500)
    });
    res.status(201).json({ subscription: sub, message: "Plan assigned successfully." });
  } catch (err) {
    console.error("Admin plan assignment failed:", err);
    res.status(500).json({ message: "Could not assign plan." });
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
        { status: req.body.status },
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
      const photo = typeof req.body?.photo === "string" ? req.body.photo : "";

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
      if (subscriber.status === "subscribed" && subscriber.consentedAt) {
        return res.status(400).json({ message: "Already subscribed." });
      }
      subscriber.status = "subscribed";
      subscriber.consentedAt = new Date();
      await subscriber.save();
      await User.updateOne({ email: normalizedEmail }, { $set: { marketingConsent: true, marketingConsentAt: new Date(), subscribeOffers: true } });
      return res.json({ message: "Subscribed successfully." });
    }
    subscriber = await NewsletterSubscriber.create({
      email: normalizedEmail,
      status: "subscribed",
      consentedAt: new Date(),
    });
    await User.updateOne({ email: normalizedEmail }, { $set: { marketingConsent: true, marketingConsentAt: new Date(), subscribeOffers: true } });
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
        consentedAt: null,
      });
      await User.updateOne({ email: normalizedEmail }, { $set: { marketingConsent: false, marketingConsentAt: null, subscribeOffers: false } });
      return res.json({ message: "Unsubscribed successfully." });
    }
    if (subscriber.status === "unsubscribed") {
      return res.json({ message: "Unsubscribed successfully." });
    }
    subscriber.status = "unsubscribed";
    subscriber.consentedAt = null;
    await subscriber.save();
    await User.updateOne({ email: normalizedEmail }, { $set: { marketingConsent: false, marketingConsentAt: null, subscribeOffers: false } });
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
router.post("/register-admin", registerAdmin);

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
  (req, res) => {
    // Successful authentication, redirect or send token
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
      secure: process.env.NODE_ENV === "production",
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
function authMiddleware(req, res, next) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    req.user = decoded;
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
    process.env.PROMOTIONAL_UNSUBSCRIBE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.REACT_APP_API_URL;

  if (explicit && String(explicit).trim()) {
    const raw = String(explicit).trim();
    try {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      return u.origin.replace(/\/$/, "");
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return null;
}

// Create a new subscription (after payment)
router.post(
  "/subscribe",
  authMiddleware,
  upload.single("paymentImage"),
  async (req, res) => {
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
      paymentImageBase64 = bufferToBase64(
        paymentImage.buffer,
        paymentImage.mimetype,
      );
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
      let query = {
        status: { $in: ["active", "expired"] },
        cancellationStatus: { $ne: "approved" }, // Exclude cancelled subscriptions
      };

      if (status && status !== "all") {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { uniqueId: { $regex: search, $options: "i" } },
          { transactionId: { $regex: search, $options: "i" } },
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
      const sub = await Subscription.findByIdAndUpdate(
        req.params.id,
        { status: "active", rejectionReason: "" },
        { new: true },
      );
      res.json({ subscription: sub });
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
        { status: req.body.status },
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
          const unsubscribeUrl = siteOrigin.replace(/\/+$/, "") + "/unsubscribe-email?email=" + encodeURIComponent(recipient);
          const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${safeSubject}</title></head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6fb;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #e5ebf3;border-radius:18px;overflow:hidden;">
<tr><td style="background:#102b55;padding:28px 30px;"><div style="font-size:21px;font-weight:800;letter-spacing:.3px;color:#fff;">ASKC <span style="color:#8fc5ff;">TECHNOLOGIES</span></div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c2d5ee;margin-top:7px;">Ideas to digital impact</div></td></tr>
<tr><td style="padding:34px 30px 28px;"><div style="display:inline-block;padding:7px 11px;border-radius:20px;background:#edf5ff;color:#1756a2;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">News & updates</div><h1 style="font-size:25px;line-height:1.3;color:#102b55;margin:18px 0 14px;">${safeSubject}</h1><div style="font-size:15px;line-height:1.85;color:#475569;">${safeMessage}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px;"><tr><td style="border-radius:9px;background:#1756a2;"><a href="https://askctechnologies.in" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Explore ASKC Technologies</a></td></tr></table>
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
    const { code, amount, usageLimit } = req.body;
    if (!code || !amount)
      return res.status(400).json({ message: "Code and amount are required." });
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      amount,
      usageLimit,
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
router.post("/coupons/apply", async (req, res, next) => {
  try {
    const { code, use } = req.body;
    if (!code)
      return res.status(400).json({ message: "Coupon code is required." });
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
    });
    if (!coupon)
      return res.status(404).json({ message: "Invalid or expired coupon." });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached." });
    }
    let userId = null;
    // If use=true, require authentication and track user
    if (use) {
      // Require authentication
      authMiddleware(req, res, async () => {
        userId = req.user.id;
        // Check if user has already used this coupon
        if (coupon.usedBy.includes(userId)) {
          return res
            .status(400)
            .json({ message: "You have already used this coupon." });
        }
        coupon.usedBy.push(userId);
        coupon.usedCount += 1;
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
          coupon.active = false;
        }
        await coupon.save();
        return res.json({ amount: coupon.amount, coupon });
      });
      return;
    }
    // If not use=true, just check if user is authenticated and has not used coupon (optional, for preview)
    if (req.headers.authorization) {
      try {
        authMiddleware(req, res, () => {
          userId = req.user.id;
          if (coupon.usedBy.includes(userId)) {
            return res
              .status(400)
              .json({ message: "You have already used this coupon." });
          }
          return res.json({ amount: coupon.amount, coupon });
        });
        return;
      } catch {}
    }
    // If not authenticated, just return coupon info (for preview)
    res.json({ amount: coupon.amount, coupon });
  } catch (err) {
    res.status(500).json({ message: "Could not apply coupon." });
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

      // Add profile image if uploaded (convert to base64)
      if (req.file) {
        teamMemberData.profileImage = bufferToBase64(
          req.file.buffer,
          req.file.mimetype,
        );
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
        updateData.profileImage = bufferToBase64(
          req.file.buffer,
          req.file.mimetype,
        );
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

// Public endpoint used by agreement templates; expose only active payment instructions.
router.get("/payment-options", async (req, res) => {
  try {
    const paymentOptions = await PaymentOption.find({ isActive: true }).sort({ order: 1 }).select("name upiId qrCode description paymentType accountName accountNumber ifscCode bankName branch");
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

// Save a new agreement document for a client
router.post(
  "/admin/agreements",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { clientName, clientEmail, clientCompany, documentType, documentTitle, htmlContent, notes, docCode } = req.body;
      if (!clientName || !documentType || !htmlContent || !documentTitle) {
        return res.status(400).json({ message: "Missing required fields." });
      }
      const agreement = await Agreement.create({
        clientName,
        clientEmail: clientEmail || "",
        clientCompany: clientCompany || "",
        documentType,
        documentTitle,
        htmlContent,
        notes: notes || "",
        docCode: docCode || "",
        status: "draft",
      });
      res.status(201).json({ agreement });
    } catch (err) {
      console.error("Agreement save error:", err);
      res.status(500).json({ message: "Could not save agreement." });
    }
  }
);

// PUBLIC: Serve agreement HTML page (no auth — for email links)
router.get("/public/agreements/:id/view", async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
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
    const agreements = await Agreement.find({ $or: [{ clientEmail: user.email }, { clientName: user.name }] }).select("-htmlContent").sort({ createdAt: -1 }).lean();
    res.json({ agreements });
  } catch (err) { res.status(500).json({ message: "Could not load your agreements." }); }
});

router.get("/user-agreements/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    const agreement = await Agreement.findById(req.params.id);
    if (!user || !agreement || (agreement.clientEmail !== user.email && agreement.clientName !== user.name)) return res.status(404).json({ message: "Agreement not found." });
    res.json({ agreement });
  } catch (err) { res.status(500).json({ message: "Could not open agreement." }); }
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
      const baseUrl = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.replace("/dashboard", "")
        : "https://askcweb.in";

      const viewLink = `${baseUrl}/api/auth/public/agreements/${agreement._id}/view`;

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
            <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.5px;">ASKC <span style="color:#60a5fa;">Digital Web</span></h1>
            <p style="color:#94a3b8;font-size:11px;margin:6px 0 0;text-transform:uppercase;letter-spacing:1px;">Digital Excellence</p>
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
            <p style="color:#94a3b8;font-size:11px;margin:0 0 6px;">📧 askctechnologies@gmail.com &nbsp;|&nbsp; 🌐 www.askcweb.in &nbsp;|&nbsp; 📞 +91 79923 65197</p>
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
      logo: bufferToBase64(req.file.buffer, req.file.mimetype),
      websiteUrl: String(req.body.websiteUrl || "").trim(),
      order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0,
      isActive: req.body.isActive !== "false",
    });
    res.status(201).json({ clientWork: item, message: "Client work added successfully." });
  } catch (err) {
    console.error("Error creating client work:", err);
    res.status(500).json({ message: "Could not add client work." });
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
    if (req.file) update.logo = bufferToBase64(req.file.buffer, req.file.mimetype);
    const item = await ClientWork.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Client work item not found." });
    res.json({ clientWork: item, message: "Client work updated successfully." });
  } catch (err) {
    console.error("Error updating client work:", err);
    res.status(500).json({ message: "Could not update client work." });
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
      image: req.file ? bufferToBase64(req.file.buffer, req.file.mimetype) : "",
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
    if (req.file) update.image = bufferToBase64(req.file.buffer, req.file.mimetype);
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

module.exports = router;
