"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const createMiddleware = require("../utils/cookieCsrfOrigin");

function invoke(middleware, { method = "POST", headers = {} } = {}) {
  let nextCalled = false, statusCode = 200, payload;
  const res = { status(code) { statusCode = code; return this; }, json(body) { payload = body; return this; } };
  middleware({ method, headers }, res, () => { nextCalled = true; });
  return { nextCalled, statusCode, payload };
}
const trusted = new Set(["https://askctechnologies.in", "http://localhost:3000"]);

test("safe methods bypass cookie CSRF origin checks", () => {
  for (const method of ["GET", "HEAD", "OPTIONS"]) assert.equal(invoke(createMiddleware(trusted), { method }).nextCalled, true);
});
test("Bearer clients bypass cookie CSRF origin checks", () => {
  assert.equal(invoke(createMiddleware(trusted), { headers: { authorization: "Bearer token", cookie: "token=abc" } }).nextCalled, true);
});
test("requests without an auth cookie are unaffected", () => {
  assert.equal(invoke(createMiddleware(trusted), { headers: { origin: "https://evil.example" } }).nextCalled, true);
});
test("trusted Origin and trusted Referer are accepted", () => {
  assert.equal(invoke(createMiddleware(trusted), { headers: { cookie: "token=abc", origin: "https://askctechnologies.in" } }).nextCalled, true);
  assert.equal(invoke(createMiddleware(trusted), { headers: { cookie: "token=abc", referer: "https://askctechnologies.in/dashboard" } }).nextCalled, true);
});
test("missing, malformed, and untrusted origins are rejected for cookie writes", () => {
  for (const headers of [{ cookie: "token=abc" }, { cookie: "token=abc", origin: "bad" }, { cookie: "token=abc", origin: "https://evil.example" }]) {
    const result = invoke(createMiddleware(trusted), { headers });
    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 403);
    assert.match(result.payload.message, /origin could not be verified/i);
  }
});
test("requires a Set of trusted origins", () => assert.throws(() => createMiddleware([]), /must be a Set/));
