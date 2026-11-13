const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const Subscription = require("../models/Subscription");
const LoginCaptcha = require("../models/LoginCaptcha");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const PrivacyConsentEvent = require("../models/PrivacyConsentEvent");
const { parsePlanDurationDays } = require("../utils/planDuration");
const Otp = require("../models/Otp");
const { sendEmail } = require("../utils/email");
// Helper to generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const generateOtpEmailHtml = (otp, title, description) => {
  const escapeHtml = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6fb;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e6ebf2;border-radius:18px;overflow:hidden;">
        <tr><td style="background:#102b55;padding:26px 28px;text-align:left;">
          <div style="font-size:21px;line-height:1.2;font-weight:800;letter-spacing:.3px;color:#ffffff;">ASKC <span style="color:#8fc5ff;">TECHNOLOGIES</span></div>
          <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c2d5ee;margin-top:7px;">Digital solutions. Built with care.</div>
        </td></tr>
        <tr><td style="padding:34px 28px 28px;">
          <div style="display:inline-block;padding:7px 11px;border-radius:20px;background:#edf5ff;color:#1756a2;font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">Account security</div>
          <h1 style="font-size:25px;line-height:1.25;color:#102b55;margin:18px 0 10px;">${escapeHtml(title)}</h1>
          <p style="font-size:14px;line-height:1.75;color:#536174;margin:0 0 24px;">${escapeHtml(description)}</p>
          <div style="background:#f5f8fc;border:1px solid #dce6f2;border-radius:14px;padding:22px 16px;text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#718096;margin-bottom:10px;">Your verification code</div>
            <div style="font-size:36px;line-height:1.2;font-weight:800;letter-spacing:9px;color:#1763b1;">${escapeHtml(otp)}</div>
          </div>
          <p style="font-size:13px;line-height:1.7;color:#536174;margin:22px 0 8px;">This code expires in <strong style="color:#102b55;">10 minutes</strong>.</p>
          <p style="font-size:12px;line-height:1.7;color:#8a5360;background:#fff7f7;border:1px solid #f3d9dc;border-radius:10px;padding:12px 14px;margin:0;">For your security, never share this code with anyone. ASKC TECHNOLOGIES will never ask you to disclose your OTP.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e8edf4;">
          <p style="font-size:11px;line-height:1.7;color:#748196;margin:0 0 7px;">You received this message because an account security request was made using this email address. If this wasn't you, you can safely ignore this email.</p>
          <p style="font-size:11px;color:#748196;margin:0;"><a href="https://askctechnologies.in" style="color:#1756a2;text-decoration:none;">askctechnologies.in</a> &nbsp;·&nbsp; <a href="mailto:askctechnologies@gmail.com" style="color:#1756a2;text-decoration:none;">askctechnologies@gmail.com</a></p>
          <p style="font-size:10px;color:#9aa5b4;margin:12px 0 0;">© ${new Date().getFullYear()} ASKC TECHNOLOGIES. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

// Send OTP for registration
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists." });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.deleteMany({ email, purpose: "register" });
    await Otp.create({ email, otp, purpose: "register", expiresAt });

    const html = generateOtpEmailHtml(
      otp,
      "Verify your Email",
      "Thank you for registering. Please use the verification code below to complete your registration.",
    );
    await sendEmail(
      email,
      "Your Registration Verification Code",
      `Your OTP is: ${otp}`,
      html,
    );
    res.json({ message: "OTP sent to email." });
  } catch (err) {
    res.status(500).json({ message: "Could not send OTP." });
  }
};

// Verify OTP for registration
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required." });
    const record = await Otp.findOne({ email, otp, purpose: "register" });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    await Otp.deleteMany({ email, purpose: "register" });
    res.json({ message: "OTP verified." });
  } catch (err) {
    res.status(500).json({ message: "Could not verify OTP." });
  }
};

// Send OTP for forgot password
exports.sendForgotOtp = async (req, res) => {
  let normalizedEmail = "";
  let generatedOtp = "";
  try {
    normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // Match legacy accounts whose email may have been stored with different casing.
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
    }).select("_id email");

    if (!user) {
      return res.status(404).json({ message: "No account was found with this email address." });
    }

    generatedOtp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Replace older reset codes, and persist this code before attempting delivery.
    await Otp.deleteMany({ email: normalizedEmail, purpose: "forgot" });
    await Otp.create({
      email: normalizedEmail,
      otp: generatedOtp,
      purpose: "forgot",
      expiresAt,
    });

    const html = generateOtpEmailHtml(
      generatedOtp,
      "Reset your Password",
      "We received a request to reset your password. Please use the verification code below to proceed.",
    );

    // Uses the same configured Resend/SMTP delivery service as registration OTP.
    await sendEmail(
      normalizedEmail,
      "Your ASKC TECHNOLOGIES Password Reset Code",
      `Your password reset OTP is: ${generatedOtp}. It expires in 10 minutes.`,
      html,
    );

    console.info("Forgot-password OTP email accepted by provider:", {
      recipient: normalizedEmail,
      provider: process.env.RESEND_API_KEY ? "resend" : (process.env.SMTP_USER ? "smtp" : "not-configured"),
    });
    return res.json({ message: "OTP sent to your email address." });
  } catch (err) {
    console.error("Forgot-password OTP delivery failed:", {
      recipient: normalizedEmail || "not-provided",
      name: err?.name,
      message: err?.message,
      code: err?.code,
      responseCode: err?.responseCode,
    });

    // Do not leave an unusable code active when the email provider rejects delivery.
    if (normalizedEmail && generatedOtp) {
      try {
        await Otp.deleteOne({ email: normalizedEmail, otp: generatedOtp, purpose: "forgot" });
      } catch (cleanupError) {
        console.error("Could not remove undelivered forgot-password OTP:", cleanupError?.message);
      }
    }

    return res.status(500).json({
      message: "We couldn't send the password reset OTP. Please try again shortly.",
    });
  }
};

// Verify OTP for forgot password
exports.verifyForgotOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required." });
    }

    const record = await Otp.findOne({ email, otp, purpose: "forgot" });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const user = await User.findOne({
      $expr: { $eq: [{ $toLower: "$email" }, email] },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await Otp.deleteMany({ email, purpose: "forgot" });
    return res.json({
      message: "OTP verified.",
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Forgot-password OTP verification failed:", err?.message);
    return res.status(500).json({ message: "Could not verify OTP." });
  }
};

const CAPTCHA_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateCaptchaAnswer(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CAPTCHA_CHARS[bytes[i] % CAPTCHA_CHARS.length];
  }
  return out;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCaptchaSvg(answer) {
  const w = 200;
  const h = 64;
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * w);
    const y1 = Math.floor(Math.random() * h);
    const x2 = Math.floor(Math.random() * w);
    const y2 = Math.floor(Math.random() * h);
    lines.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="1" opacity="0.5"/>`,
    );
  }
  const escaped = escapeXml(answer);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect fill="#f1f5f9" width="100%" height="100%" rx="10" stroke="#cbd5e1" stroke-width="1"/>
    ${lines.join("")}
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Consolas,ui-monospace,monospace" font-size="26" fill="#0f172a" font-weight="700" letter-spacing="6">${escaped}</text>
  </svg>`;
}

exports.getLoginCaptcha = async (req, res) => {
  try {
    const answer = generateCaptchaAnswer(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const doc = await LoginCaptcha.create({ answer, expiresAt });
    const svg = buildCaptchaSvg(answer);
    res.json({
      captchaId: doc._id.toString(),
      svg,
    });
  } catch (err) {
    console.error("getLoginCaptcha error:", err);
    res.status(500).json({ message: "Could not create captcha." });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, subscribeOffers, marketingConsent } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
      subscribeOffers: subscribeOffers === true || marketingConsent === true,
      marketingConsent: subscribeOffers === true || marketingConsent === true,
      marketingConsentAt: subscribeOffers === true || marketingConsent === true ? new Date() : null,
    });
    await user.save();

    // Subscribe to newsletter if user opted in
    if (subscribeOffers === true || marketingConsent === true) {
      const normalizedEmail = String(email).trim().toLowerCase();
      await NewsletterSubscriber.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { email: normalizedEmail, status: "subscribed", consentedAt: new Date(), consentSource: "registration-form", consentedBy: String(user._id) } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      await PrivacyConsentEvent.create({
        user: user._id,
        purpose: "marketing_emails",
        action: "granted",
        source: "registration-form"
      });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

exports.loginUser = async (req, res) => {
  try {
    console.log("Login request received:", {
      body: {
        ...req.body,
        password: req.body?.password ? "[redacted]" : undefined,
      },
      headers: req.headers,
      method: req.method,
      url: req.url,
    });

    const { email, password, captchaId, captchaAnswer } = req.body;

    // Input validation with better error messages
    if (!email || !password) {
      console.log("Login validation failed - missing email or password");
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    if (
      !captchaId ||
      captchaAnswer === undefined ||
      captchaAnswer === null ||
      String(captchaAnswer).trim() === ""
    ) {
      return res.status(400).json({ message: "Captcha is required." });
    }

    const captcha = await LoginCaptcha.findById(captchaId);
    if (!captcha || captcha.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Captcha expired or invalid. Please refresh and try again.",
      });
    }

    const submitted = String(captchaAnswer).trim();
    if (submitted !== captcha.answer) {
      await LoginCaptcha.deleteOne({ _id: captcha._id });
      return res
        .status(400)
        .json({ message: "Captcha does not match. Please try again." });
    }

    await LoginCaptcha.deleteOne({ _id: captcha._id });

    // Trim email and validate format
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@") || trimmedEmail.length < 5) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    if (password.length < 1) {
      return res.status(400).json({ message: "Password is required." });
    }

    // Use lean() for better performance when we don't need the full document
    const user = await User.findOne({ email: trimmedEmail })
      .select("+password")
      .lean()
      .exec();

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare password with optimized error handling
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Password comparison error:", bcryptError);
      return res
        .status(500)
        .json({ message: "Authentication error. Please try again." });
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({
      token,
      user: userResponse,
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);

    // More specific error messages
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid input data." });
    } else if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid data format." });
    } else if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists." });
    }

    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;
    if (!name || !email || !password || !adminKey) {
      return res
        .status(400)
        .json({ message: "All fields and admin key are required." });
    }
    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res
        .status(403)
        .json({ message: "Invalid admin registration key." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "Name and email required." });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Could not update profile." });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { current, new: newPassword } = req.body;
    if (!current || !newPassword)
      return res
        .status(400)
        .json({ message: "Current and new password required." });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password incorrect." });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed." });
  } catch (err) {
    res.status(500).json({ message: "Could not change password." });
  }
};

// Forgot Password - Verify Email
exports.verifyEmailForPasswordReset = async (req, res) => {
  try {
    console.log("Forgot password verify email endpoint called");
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email address." });
    }

    // Return user info (without password)
    res.json({
      user: {
        name: user.name,
        email: user.email,
      },
      message: "Email verified successfully.",
    });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ message: "Could not verify email." });
  }
};

// Forgot Password - Reset Password
exports.resetPassword = async (req, res) => {
  try {
    console.log("Forgot password reset endpoint called");
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log("Password reset successful for:", email);
    res.json({
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Could not reset password." });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ user: req.user.id }, { user: null }],
    }).sort({ createdAt: -1 });
    res.json(
      notifications.map((n) => ({
        _id: n._id,
        title: n.title || "Notification",
        message: n.message,
        createdAt: n.createdAt,
        read: n.readBy && n.readBy.includes(req.user.id),
      })),
    );
  } catch (err) {
    res.status(500).json({ message: "Could not fetch notifications." });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif)
      return res.status(404).json({ message: "Notification not found." });
    if (!notif.readBy) notif.readBy = [];
    if (!notif.readBy.includes(req.user.id)) {
      notif.readBy.push(req.user.id);
      await notif.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Could not mark as read." });
  }
};

exports.cancelUserSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ message: "Cancellation reason is required." });
    }

    const sub = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!sub)
      return res.status(404).json({ message: "Subscription not found." });
    if (sub.canceled && sub.cancellationStatus === "approved") {
      return res
        .status(400)
        .json({ message: "Subscription cancellation already approved." });
    }
    if (sub.cancellationStatus === "pending") {
      return res
        .status(400)
        .json({ message: "Cancellation request is already pending approval." });
    }
    if (sub.status !== "active")
      return res
        .status(400)
        .json({ message: "Only active subscriptions can be canceled." });

    // Set cancellation status to pending (not immediately canceled)
    sub.cancellationStatus = "pending";
    sub.cancellationReason = reason.trim();
    sub.cancellationRequestDate = new Date();
    await sub.save();
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ message: "Could not cancel subscription." });
  }
};

exports.renewUserSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: "Plan required." });
    const PlanModel = require("../models/Plan");
    const planDoc = await PlanModel.findOne({
      name: new RegExp("^" + plan + "$", "i"),
    });
    if (!planDoc) return res.status(400).json({ message: "Plan not found." });
    const uniqueId =
      "SUB-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const now = new Date();
    const durationInDays = parsePlanDurationDays(planDoc.duration);
    const expiresAt = new Date(
      now.getTime() + durationInDays * 24 * 60 * 60 * 1000,
    );
    const subscription = await Subscription.create({
      user: req.user.id,
      plan,
      uniqueId,
      status: "active",
      expiresAt,
      canceled: false,
    });
    res.status(201).json({ subscription });
  } catch (err) {
    res.status(500).json({ message: "Could not renew subscription." });
  }
};

exports.autoExpiryNotifications = async (req, res) => {
  try {
    const now = new Date();
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const start = new Date(in2Days.setHours(0, 0, 0, 0));
    const end = new Date(in2Days.setHours(23, 59, 59, 999));
    const expiringSubs = await Subscription.find({
      expiresAt: { $gte: start, $lte: end },
      status: "active",
      canceled: { $ne: true },
    });
    const notifiedUsers = [];
    for (const sub of expiringSubs) {
      await Notification.create({
        message: `Your plan (${sub.plan}) will expire in 2 days. Please renew to avoid interruption.`,
        user: sub.user,
      });
      notifiedUsers.push(sub.user);
    }
    res.json({ success: true, count: notifiedUsers.length });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Could not send auto expiry notifications." });
  }
};
