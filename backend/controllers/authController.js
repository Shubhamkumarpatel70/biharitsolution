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

async function recordSuccessfulLogin(userId, req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || req.ip || req.socket?.remoteAddress || "";
  const sessionId = crypto.randomUUID();
  const session = {
    sessionId,
    createdAt: new Date(),
    lastSeenAt: new Date(),
    ip: String(ip).slice(0, 100),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
    revokedAt: null,
  };
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      lastLoginAt: new Date(),
      lastLoginIp: session.ip,
      lastLoginUserAgent: session.userAgent,
    },
    $push: { sessions: { $each: [session], $slice: -30 } },
  }, { new: true }).select("sessionVersion").lean();
  return { ...user, sessionId };
}

// Helper to generate a 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
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
          <div style="font-size:22px;line-height:1.05;font-weight:800;letter-spacing:.4px;color:#ffffff;">ASKC</div><div style="font-size:22px;line-height:1.05;font-weight:800;letter-spacing:.4px;color:#8fc5ff;margin-top:3px;">TECHNOLOGIES</div>
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
  const email = String(req.body?.email || "").trim().toLowerCase();
  let generatedOtp = "";
  try {
    const emailPattern = new RegExp("^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$");
    if (!email || !emailPattern.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    const existingUser = await User.findOne({ $expr: { $eq: [{ $toLower: "$email" }, email] } }).select("_id");
    if (existingUser) return res.status(400).json({ message: "User already exists." });

    generatedOtp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.deleteMany({ email, purpose: { $in: ["register", "registration-verified"] } });
    await Otp.create({ email, otp: generatedOtp, purpose: "register", expiresAt });
    const html = generateOtpEmailHtml(
      generatedOtp,
      "Verify your Email",
      "Thank you for registering. Please use the verification code below to complete your registration. This code expires in 10 minutes.",
    );
    await sendEmail(email, "Your ASKC TECHNOLOGIES Registration Verification Code", `Your OTP is: ${generatedOtp}. It expires in 10 minutes.`, html);
    return res.json({ message: "OTP sent to email address." });
  } catch (err) {
    console.error("Registration OTP delivery failed:", { recipient: email, message: err?.message, code: err?.code });
    if (email && generatedOtp) {
      try { await Otp.deleteOne({ email, otp: generatedOtp, purpose: "register" }); } catch (cleanupError) {
        console.error("Could not remove undelivered registration OTP:", cleanupError?.message);
      }
    }
    return res.status(500).json({ message: "Could not send registration OTP. Check the configured email provider and try again." });
  }
};

// Verify OTP for registration
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    if (!email || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: "Enter your email and the 6-digit code." });
    const record = await Otp.findOneAndDelete({
      email, otp, purpose: "register", expiresAt: { $gt: new Date() },
    });
    if (!record) return res.status(400).json({ message: "Invalid or expired OTP. Please request a new code." });
    const existingUser = await User.findOne({ $expr: { $eq: [{ $toLower: "$email" }, email] } }).select("_id");
    if (existingUser) return res.status(409).json({ message: "An account with this email already exists." });
    const registrationToken = jwt.sign(
      { email, purpose: "registration-verified" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );
    const tokenHash = crypto.createHash("sha256").update(registrationToken).digest("hex");
    await Otp.create({
      email, otp: tokenHash, purpose: "registration-verified",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    return res.json({ message: "OTP verified.", registrationToken });
  } catch (err) {
    console.error("Registration OTP verification failed:", err?.message);
    return res.status(500).json({ message: "Could not verify OTP." });
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
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter your email and the 6-digit code." });
    }
    const record = await Otp.findOneAndDelete({
      email, otp, purpose: "forgot", expiresAt: { $gt: new Date() },
    });
    if (!record) return res.status(400).json({ message: "Invalid or expired OTP. Please request a new code." });
    const user = await User.findOne({ $expr: { $eq: [{ $toLower: "$email" }, email] } });
    if (!user) return res.status(404).json({ message: "User not found." });
    const resetToken = jwt.sign(
      { id: String(user._id), email: String(user.email).toLowerCase(), purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    await Otp.create({
      email: String(user.email).toLowerCase(),
      otp: tokenHash,
      purpose: "password-reset",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    return res.json({
      message: "OTP verified. You can now set a new password.",
      resetToken,
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
    const { name, email, password, subscribeOffers, marketingConsent, registrationToken } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!registrationToken || !process.env.JWT_SECRET) return res.status(403).json({ message: "Please verify your email address before creating an account." });
    let verified;
    try { verified = jwt.verify(registrationToken, process.env.JWT_SECRET); } catch { return res.status(403).json({ message: "Email verification expired. Please request a new OTP." }); }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (verified.purpose !== "registration-verified" || verified.email !== normalizedEmail) return res.status(403).json({ message: "Email verification does not match this account." });
    const tokenHash = crypto.createHash("sha256").update(String(registrationToken)).digest("hex");
    const verifiedRecord = await Otp.findOneAndDelete({ email: normalizedEmail, otp: tokenHash, purpose: "registration-verified", expiresAt: { $gt: new Date() } });
    if (!verifiedRecord) return res.status(403).json({ message: "Email verification has already been used or expired. Please request a new OTP." });
    const existingUser = await User.findOne({ email: normalizedEmail });
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
    const loginState = await recordSuccessfulLogin(user._id, req);
    const token = jwt.sign(
      { id: user._id, role: user.role, sv: Number(loginState?.sessionVersion || 0), sid: loginState.sessionId },
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
    console.info("Login request received", {
      emailProvided: Boolean(req.body?.email),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 120),
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

    // If 2FA is enabled, issue only a short-lived challenge token (never a full session yet).
    if (user.twoFactorEnabled && ["email", "authenticator"].includes(user.twoFactorMethod)) {
      const challengeToken = jwt.sign(
        { id: user._id, role: user.role, purpose: "two-factor-login" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" },
      );
      if (user.twoFactorMethod === "email") {
        const code = crypto.randomInt(100000, 1000000).toString();
        await Otp.deleteMany({ email: trimmedEmail, purpose: "twofactor-login" });
        await Otp.create({ email: trimmedEmail, otp: code, purpose: "twofactor-login", expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
        try {
          await sendEmail(trimmedEmail, "Your ASKC TECHNOLOGIES login verification code", `Your login verification code is ${code}. It expires in 5 minutes.`, generateOtpEmailHtml(code, "Verify your login", "Use this one-time code to finish signing in. Do not share it with anyone."));
        } catch (mailError) {
          await Otp.deleteMany({ email: trimmedEmail, purpose: "twofactor-login" });
          return res.status(503).json({ message: "We could not send your login OTP. Please try again." });
        }
      }
      return res.status(202).json({
        requiresTwoFactor: true,
        challengeToken,
        method: user.twoFactorMethod,
        message: user.twoFactorMethod === "email" ? "A verification code was sent to your registered email." : "Enter the current code from your authenticator app."
      });
    }

    // Generate JWT token
    const loginState = await recordSuccessfulLogin(user._id, req);
    const token = jwt.sign(
      { id: user._id, role: user.role, sv: Number(loginState?.sessionVersion || 0), sid: loginState.sessionId },
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
    const { name, email, password, adminKey } = req.body || {};
    if (!name || !email || !password || !adminKey) return res.status(400).json({ message: "All fields and admin key are required." });
    if (!process.env.ADMIN_REGISTRATION_KEY || adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({ message: "Admin bootstrap is not enabled or the key is invalid." });
    }
    if (await User.exists({ role: { $in: ["admin", "coadmin"] } })) {
      return res.status(403).json({ message: "Admin registration is closed. Ask an existing administrator to create an account." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(400).json({ message: "User already exists." });
    if (String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." });
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "admin",
    });
    const loginState = await recordSuccessfulLogin(user._id, req);
    const token = jwt.sign(
      { id: user._id, role: user.role, sv: Number(loginState?.sessionVersion || 0), sid: loginState.sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Admin bootstrap failed:", err?.message);
    res.status(500).json({ message: "Could not create the initial administrator." });
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
    const { current, new: newPassword } = req.body || {};
    if (!current || !newPassword) return res.status(400).json({ message: "Current and new password required." });
    if (String(newPassword).length < 8) return res.status(400).json({ message: "New password must be at least 8 characters long." });
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!(await bcrypt.compare(current, user.password))) return res.status(400).json({ message: "Current password incorrect." });
    user.password = await bcrypt.hash(newPassword, 12);
    user.sessionVersion = Number(user.sessionVersion || 0) + 1;
    user.lastLogoutAllAt = new Date();
    user.sessions.forEach(session => { if (!session.revokedAt) session.revokedAt = new Date(); });
    await user.save();
    res.clearCookie("token", { httpOnly: true, sameSite: "None", secure: process.env.NODE_ENV === "production", path: "/" });
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, message: "Password changed. Please sign in again on your devices." });
  } catch (err) {
    console.error("Password change failed:", err?.message);
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
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword) return res.status(400).json({ message: "A verified reset token and new password are required." });
    if (String(newPassword).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." });
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Password reset is temporarily unavailable." });
    let decoded;
    try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ message: "Password reset session expired. Please verify your OTP again." }); }
    if (decoded.purpose !== "password-reset" || !decoded.id || !decoded.email) {
      return res.status(400).json({ message: "Invalid password reset session." });
    }
    const tokenHash = crypto.createHash("sha256").update(String(resetToken)).digest("hex");
    const resetRecord = await Otp.findOneAndDelete({
      email: String(decoded.email).toLowerCase(),
      otp: tokenHash,
      purpose: "password-reset",
      expiresAt: { $gt: new Date() },
    });
    if (!resetRecord) return res.status(400).json({ message: "This password reset session has already been used or expired." });
    const user = await User.findOne({
      _id: decoded.id,
      $expr: { $eq: [{ $toLower: "$email" }, String(decoded.email).toLowerCase()] },
    }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });
    user.password = await bcrypt.hash(newPassword, 12);
    user.sessionVersion = Number(user.sessionVersion || 0) + 1;
    user.lastLogoutAllAt = new Date();
    user.sessions.forEach(session => { if (!session.revokedAt) session.revokedAt = new Date(); });
    await user.save();
    await Otp.deleteMany({ email: String(user.email).toLowerCase(), purpose: "password-reset" });
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, message: "Password reset successfully. Please sign in again." });
  } catch (err) {
    console.error("Password reset failed:", err?.message);
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
    if (!notif.readBy.some((id) => String(id) === String(req.user.id))) {
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
    sub.cancellationInitiatedBy = "user";
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
