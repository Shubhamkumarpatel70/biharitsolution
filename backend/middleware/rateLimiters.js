const rateLimit = require("express-rate-limit");

const makeLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    handler: (req, res, _next, options) => {
      const retryAfterSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
      res.set("Retry-After", String(retryAfterSeconds));
      res.status(options.statusCode).json({
        message,
        retryAfterSeconds,
      });
    },
  });

const policies = [
  { test: (method, path) => method === "POST" && /^\/register\/send-otp\/?$/.test(path), limiter: makeLimiter(15 * 60 * 1000, 3, "Too many verification code requests. Please try again after 15 minutes.") },
  { test: (method, path) => method === "POST" && /^\/register\/verify-otp\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 5, "Too many OTP verification attempts. Please try again after 10 minutes.") },
  { test: (method, path) => method === "POST" && /^\/forgot-password\/send-otp\/?$/.test(path), limiter: makeLimiter(15 * 60 * 1000, 3, "Too many password reset code requests. Please try again after 15 minutes.") },
  { test: (method, path) => method === "POST" && /^\/forgot-password\/verify-otp\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 5, "Too many OTP verification attempts. Please try again after 10 minutes.") },
  { test: (method, path) => method === "POST" && /^\/forgot-password\/reset\/?$/.test(path), limiter: makeLimiter(15 * 60 * 1000, 5, "Too many password reset attempts. Please try again after 15 minutes.") },
  { test: (method, path) => method === "GET" && /^\/captcha\/?$/.test(path), limiter: makeLimiter(15 * 60 * 1000, 10, "Too many CAPTCHA requests. Please try again after 15 minutes.") },
  { test: (method, path) => method === "POST" && /^\/login\/?$/.test(path), limiter: rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: { message: "Too many unsuccessful login attempts. Please try again after 15 minutes." } }) },
  { test: (method, path) => method === "POST" && /^\/register\/?$/.test(path), limiter: makeLimiter(60 * 60 * 1000, 5, "Too many registration attempts. Please try again after an hour.") },
  { test: (method, path) => method === "POST" && /^\/register-admin\/?$/.test(path), limiter: makeLimiter(60 * 60 * 1000, 3, "Too many admin registration attempts. Please try again later.") },
  { test: (method, path) => method === "POST" && /^\/2fa\/login\/verify\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 5, "Too many two-factor verification attempts. Please try again after 10 minutes.") },
  { test: (method, path) => method === "POST" && /^\/security\/2fa\/(authenticator\/verify|email\/send|email\/verify|disable)\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 5, "Too many two-factor security requests. Please try again after 10 minutes.") },
  { test: (method, path) => method === "POST" && /^\/contact\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 5, "Too many contact requests. Please try again after 10 minutes.") },
  { test: (method, path) => method === "POST" && /^\/newsletter\/(subscribe|unsubscribe)\/?$/.test(path), limiter: makeLimiter(15 * 60 * 1000, 5, "Too many newsletter requests. Please try again after 15 minutes.") },
  { test: (method, path) => method === "POST" && /^\/project-requirement\/?$/.test(path), limiter: makeLimiter(60 * 60 * 1000, 5, "Too many project requests. Please try again after an hour.") },
  { test: (method, path) => method === "POST" && /^\/complaints\/.+\/chat\/?$/.test(path), limiter: makeLimiter(60 * 1000, 20, "You are sending messages too quickly. Please wait a minute.") },
  { test: (method, path) => method === "POST" && /^\/complaints\/?$/.test(path), limiter: makeLimiter(60 * 60 * 1000, 5, "Too many complaint requests. Please try again later.") },
  { test: (method, path) => method === "POST" && /^\/cashfree\/create-order\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 5, "Too many payment attempts. Please try again after 10 minutes.") },
  { test: (method, path) => method === "POST" && /^\/coupons\/apply\/?$/.test(path), limiter: makeLimiter(15 * 60 * 1000, 10, "Too many coupon attempts. Please try again after 15 minutes.") },
  { test: (method, path) => method === "POST" && /^\/user-agreements\/[^/]+\/respond\/?$/.test(path), limiter: makeLimiter(10 * 60 * 1000, 10, "Too many agreement response attempts. Please try again later.") },
  { test: (method, path) => method === "POST" && /^\/admin\/(client-work|projects)\/?$/.test(path), limiter: makeLimiter(60 * 60 * 1000, 10, "Too many upload requests. Please try again later.") },
];

const authWriteLimiter = makeLimiter(15 * 60 * 1000, 120, "Too many API requests. Please slow down and try again later.");
authWriteLimiter.skip = (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method);

const authEndpointLimiter = (req, res, next) => {
  const policy = policies.find(({ test }) => test(req.method, req.path));
  return policy ? policy.limiter(req, res, next) : next();
};

const privacyWriteLimiter = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return makePrivacyLimiter(req, res, next);
};

const privacyLimiter = makeLimiter(15 * 60 * 1000, 20, "Too many privacy requests. Please try again after 15 minutes.");
function makePrivacyLimiter(req, res, next) {
  return privacyLimiter(req, res, next);
}

module.exports = { authEndpointLimiter, authWriteLimiter, privacyWriteLimiter };
