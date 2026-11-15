"use strict";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function createCookieCsrfOriginMiddleware(allowedOrigins) {
  if (!(allowedOrigins instanceof Set)) throw new TypeError("allowedOrigins must be a Set of trusted origins");

  return function cookieCsrfOriginMiddleware(req, res, next) {
    if (SAFE_METHODS.has(String(req.method || "").toUpperCase())) return next();
    const authorization = String(req.headers?.authorization || "");
    if (authorization.startsWith("Bearer ")) return next();
    const cookieHeader = String(req.headers?.cookie || "");
    if (!/(?:^|;\s*)token=/.test(cookieHeader)) return next();

    let sourceOrigin = String(req.headers?.origin || "");
    if (!sourceOrigin && req.headers?.referer) {
      try { sourceOrigin = new URL(req.headers.referer).origin; } catch { sourceOrigin = ""; }
    }
    if (!sourceOrigin || !allowedOrigins.has(sourceOrigin)) {
      return res.status(403).json({ message: "Request origin could not be verified. Refresh the page and try again." });
    }
    return next();
  };
}

module.exports = createCookieCsrfOriginMiddleware;
