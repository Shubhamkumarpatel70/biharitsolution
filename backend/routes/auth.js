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
const Feature = require("../models/Feature");
const Service = require("../models/Service");
const PaymentOption = require("../models/PaymentOption");
const ProjectRequirement = require("../models/ProjectRequirement");
const Career = require("../models/Career");
const CareerApplication = require("../models/CareerApplication");
const FundTransaction = require("../models/FundTransaction");
const { sendEmail } = require("../utils/email");
const { parsePlanDurationDays } = require("../utils/planDuration");
const multer = require("multer");
const path = require("path");
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

// Duplicate 'upload' declaration removed. Only the first declaration is kept.

// Helper function to convert buffer to base64
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

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

// Helper function to convert buffer to base64
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

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
      const { email, emails, subject, message } = req.body;

      // Support both "email" (single) and "emails" (array) for backward compatibility
      let emailList = [];
      if (emails && Array.isArray(emails)) {
        emailList = emails
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => e && e.includes("@"));
      } else if (email) {
        const singleEmail = String(email).trim().toLowerCase();
        if (singleEmail.includes("@")) {
          emailList = [singleEmail];
        }
      }

      const normalizedSubject = String(subject || "").trim();
      const normalizedMessage = String(message || "").trim();

      if (emailList.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one valid email is required." });
      }
      if (!normalizedSubject) {
        return res.status(400).json({ message: "Subject is required." });
      }
      if (!normalizedMessage) {
        return res.status(400).json({ message: "Message is required." });
      }

      // Get site origin for unsubscribe links
      const siteOrigin = getPublicSiteOrigin();
      if (!siteOrigin) {
        return res.status(500).json({
          message:
            "Public site URL is not configured. Set CLIENT_URL or PUBLIC_SITE_URL on the server.",
        });
      }

      // Process each email
      let successCount = 0;
      const errors = [];

      for (const normalizedEmail of emailList) {
        try {
          // Update subscriber status
          await NewsletterSubscriber.findOneAndUpdate(
            { email: normalizedEmail },
            { email: normalizedEmail, status: "subscribed" },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          // Generate unsubscribe URL
          const unsubscribeUrl =
            siteOrigin.replace(/\/$/, "") +
            "/unsubscribe-email?email=" +
            encodeURIComponent(normalizedEmail);

          // Build HTML
          const escapedSubject = normalizedSubject
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">");
          const escapedMessage = normalizedMessage
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/\n/g, "<br/>");

          const html = `<div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
              <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);">
                <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;font-weight:700;">ASKC Digital Web</div>
                <h2 style="margin:10px 0 0 0;font-size:22px;line-height:1.3;color:#ffffff;">${escapedSubject}</h2>
              </div>
              <div style="padding:24px;">
                <div style="font-size:15px;line-height:1.7;color:#334155;">${escapedMessage}</div>
                <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
                  <p style="font-size:12px;color:#64748b;margin:0 0 10px 0;">
                    You received this email because you have subscribed to updates from ASKC Digital Web.
                  </p>
                  <a href="${unsubscribeUrl}" style="display:inline-block;padding:10px 14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;color:#0f172a;text-decoration:none;font-size:12px;font-weight:700;">
                    Unsubscribe
                  </a>
                </div>
              </div>
            </div>
            <p style="max-width:620px;margin:12px auto 0 auto;font-size:11px;color:#94a3b8;text-align:center;">
              Need help? Contact support@askcweb.in
            </p>
          </div>`;

          await sendEmail(
            normalizedEmail,
            normalizedSubject,
            normalizedMessage,
            html,
            "ASKC Digital Web <info@askcweb.in>",
          );

          successCount++;
        } catch (emailErr) {
          console.error("Error sending to " + normalizedEmail + ":", emailErr);
          errors.push(normalizedEmail);
        }
      }

      if (successCount === 0) {
        return res
          .status(500)
          .json({ message: "Could not send promotional emails." });
      }

      if (errors.length > 0) {
        res.json({
          message:
            "Email sent to " +
            successCount +
            " recipient(s). Failed: " +
            errors.join(", "),
          successCount,
          failedEmails: errors,
        });
      } else {
        res.json({
          message:
            "Promotional email sent to " +
            successCount +
            " recipient(s) successfully.",
        });
      }

      const siteOrigin = getPublicSiteOrigin();
      if (!siteOrigin) {
        return res.status(500).json({
          message:
            "Public site URL is not configured. Set CLIENT_URL or PUBLIC_SITE_URL (or PROMOTIONAL_UNSUBSCRIBE_URL) on the server for unsubscribe links.",
        });
      }

      const unsubscribeUrl = `${siteOrigin.replace(/\/$/, "")}/unsubscribe-email?email=${encodeURIComponent(
        normalizedEmail,
      )}`;
      const escapedSubject = normalizedSubject
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const escapedMessage = normalizedMessage
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      const html = `
        <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);">
              <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;font-weight:700;">ASKC Digital Web</div>
              <h2 style="margin:10px 0 0 0;font-size:22px;line-height:1.3;color:#ffffff;">${escapedSubject}</h2>
            </div>
            <div style="padding:24px;">
              <div style="font-size:15px;line-height:1.7;color:#334155;">${escapedMessage}</div>
              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
                <p style="font-size:12px;color:#64748b;margin:0 0 10px 0;">
                  You received this email because you have subscribed to updates from ASKC Digital Web.
                </p>
                <a href="${unsubscribeUrl}" style="display:inline-block;padding:10px 14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;color:#0f172a;text-decoration:none;font-size:12px;font-weight:700;">
                  Unsubscribe
                </a>
              </div>
            </div>
          </div>
          <p style="max-width:620px;margin:12px auto 0 auto;font-size:11px;color:#94a3b8;text-align:center;">
            Need help? Contact support@askcweb.in
          </p>
        </div>
      `;

      await sendEmail(
        normalizedEmail,
        normalizedSubject,
        normalizedMessage,
        html,
        "ASKC Digital Web <info@askcweb.in>",
      );

      res.json({ message: "Promotional email sent successfully." });
    } catch (err) {
      console.error("Error sending promotional email:", err);
      res.status(500).json({ message: "Could not send promotional email." });
    }
  },
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
router.get(
  "/admin/payment-options",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const paymentOptions = await PaymentOption.find().sort({
        order: 1,
        createdAt: -1,
      });
      res.json({ paymentOptions });
    } catch (err) {
      console.error("Error fetching payment options:", err);
      res.status(500).json({ message: "Could not fetch payment options." });
    }
  },
);

router.post(
  "/admin/payment-options",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { name, upiId, description, paymentType, order } = req.body;

      if (!name || !upiId) {
        return res
          .status(400)
          .json({ message: "Name and UPI ID are required." });
      }

      // Check if UPI ID already exists
      const existingOption = await PaymentOption.findOne({ upiId });
      if (existingOption) {
        return res.status(400).json({ message: "UPI ID already exists." });
      }

      const paymentOption = new PaymentOption({
        name,
        upiId,
        description,
        paymentType: paymentType || "UPI",
        order: order || 0,
      });

      await paymentOption.save();
      res
        .status(201)
        .json({ paymentOption, message: "Payment option added successfully." });
    } catch (err) {
      console.error("Error adding payment option:", err);
      res.status(500).json({ message: "Could not add payment option." });
    }
  },
);

router.put(
  "/admin/payment-options/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const { name, upiId, description, paymentType, order, isActive } =
        req.body;

      if (!name || !upiId) {
        return res
          .status(400)
          .json({ message: "Name and UPI ID are required." });
      }

      // Check if UPI ID already exists (excluding current option)
      const existingOption = await PaymentOption.findOne({
        upiId,
        _id: { $ne: req.params.id },
      });
      if (existingOption) {
        return res.status(400).json({ message: "UPI ID already exists." });
      }

      const paymentOption = await PaymentOption.findByIdAndUpdate(
        req.params.id,
        {
          name,
          upiId,
          description,
          paymentType: paymentType || "UPI",
          order: order || 0,
          isActive: isActive !== undefined ? isActive : true,
        },
        { new: true, runValidators: true },
      );

      if (!paymentOption) {
        return res.status(404).json({ message: "Payment option not found." });
      }

      res.json({
        paymentOption,
        message: "Payment option updated successfully.",
      });
    } catch (err) {
      console.error("Error updating payment option:", err);
      res.status(500).json({ message: "Could not update payment option." });
    }
  },
);

router.delete(
  "/admin/payment-options/:id",
  authMiddleware,
  coAdminMiddleware,
  async (req, res) => {
    try {
      const paymentOption = await PaymentOption.findByIdAndDelete(
        req.params.id,
      );

      if (!paymentOption) {
        return res.status(404).json({ message: "Payment option not found." });
      }

      res.json({ message: "Payment option deleted successfully." });
    } catch (err) {
      console.error("Error deleting payment option:", err);
      res.status(500).json({ message: "Could not delete payment option." });
    }
  },
);

// Public route to get active payment options
router.get("/payment-options", async (req, res) => {
  try {
    const paymentOptions = await PaymentOption.find({ isActive: true }).sort({
      order: 1,
    });
    res.json({ paymentOptions });
  } catch (err) {
    console.error("Error fetching payment options:", err);
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

module.exports = router;
