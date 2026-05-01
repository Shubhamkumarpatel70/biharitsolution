const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const Subscription = require("../models/Subscription");
const LoginCaptcha = require("../models/LoginCaptcha");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const { parsePlanDurationDays } = require("../utils/planDuration");
const Otp = require("../models/Otp");
const { sendEmail } = require("../utils/email");
// Helper to generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const generateOtpEmailHtml = (otp, title, description) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 40px;
      text-decoration: none;
    }
    .title {
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 30px 0;
    }
    .otp-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px 20px;
      margin-bottom: 30px;
    }
    .otp-code {
      font-size: 42px;
      font-weight: 800;
      color: #6366f1; /* Modern indigo/purple */
      letter-spacing: 6px;
      margin: 0;
    }
    .desc {
      color: #334155;
      font-size: 14px;
      margin: 0 0 15px 0;
    }
    .note {
      color: #0f172a;
      font-size: 14px;
      margin: 0;
    }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 40px 0;
    }
    .footer {
      color: #64748b;
      font-size: 12px;
      line-height: 1.6;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="margin-bottom: 30px;">
      <a href="https://askcweb.in" class="logo">ASKC Digital Web</a>
    </div>
    
    <h1 class="title">${title}</h1>
    
    <div class="otp-box">
      <p class="otp-code">${otp}</p>
    </div>
    
    <p class="desc">Please make sure you never share this code with anyone.</p>
    <p class="note"><b>Note:</b> The code will expire in 10 minutes.</p>
    
    <hr class="divider" />
    
    <div class="footer">
      <p style="margin-bottom: 20px;">
        You have received this email because you initiated a request at ASKC Digital Web, to ensure the security of your account.
      </p>
      <p>
        <a href="https://askcweb.in/privacy">Privacy policy</a> | <a href="https://askcweb.in/contact">Help center</a><br/>
        Contact Us: <a href="mailto:support@askcweb.in">support@askcweb.in</a>
      </p>
      <p style="margin-top: 20px;">
        &copy; ${new Date().getFullYear()} ASKC Digital Web. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

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
  try {
    console.log("sendForgotOtp requested for:", req.body.email);
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    console.log("Checking if user exists...");
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    console.log("Generating OTP...");
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log("Saving OTP to database...");
    await Otp.deleteMany({ email, purpose: "forgot" });
    const savedOtp = await Otp.create({
      email,
      otp,
      purpose: "forgot",
      expiresAt,
    });
    console.log("SUCCESS: OTP stored in database! Record:", savedOtp);

    const html = generateOtpEmailHtml(
      otp,
      "Reset your Password",
      "We received a request to reset your password. Please use the verification code below to proceed.",
    );

    console.log("Attempting to send email via SMTP...");
    console.log("Before sending email");
    await sendEmail(
      email,
      "Your Password Reset Code",
      `Your OTP is: ${otp}`,
      html,
    );
    console.log("After sending email");

    console.log("==================================================");
    console.log("SUCCESS: OTP EMAIL SENT SUCCESSFULLY!");
    console.log("==================================================");

    res.json({ message: "OTP sent to email." });
  } catch (err) {
    console.log("==================================================");
    console.error("FAILURE: OTP EMAIL FAILED TO SEND!");
    console.error("Error details:", err.message);
    console.log("==================================================");
    res.status(500).json({ message: "Could not send OTP." });
  }
};

// Verify OTP for forgot password
exports.verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required." });
    const record = await Otp.findOne({ email, otp, purpose: "forgot" });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    await Otp.deleteMany({ email, purpose: "forgot" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      message: "OTP verified.",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Could not verify OTP." });
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
    const { name, email, password, subscribeOffers } = req.body;
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
    });
    await user.save();

    // Subscribe to newsletter if user opted in
    if (subscribeOffers === true) {
      await NewsletterSubscriber.findOneAndUpdate(
        { email },
        { email, status: "subscribed" },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
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
