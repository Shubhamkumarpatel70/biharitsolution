"use strict";

// Read-only HTTP smoke check. Supply the exact Render health URL explicitly.
async function main() {
  const raw = String(process.env.RENDER_HEALTH_URL || "").trim();
  if (!raw) throw new Error("Set RENDER_HEALTH_URL to the deployed service's health endpoint.");
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Production health checks require HTTPS.");
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Health endpoint returned HTTP " + response.status);
  if (body.mongo && !["connected", "ok", "up"].includes(String(body.mongo).toLowerCase())) {
    throw new Error("Health endpoint reports MongoDB is not connected.");
  }
  process.stdout.write(JSON.stringify({ ok: true, status: response.status, mongo: body.mongo || "not-reported" }) + "\n");
}
main().catch((error) => { process.stderr.write(error.message + "\n"); process.exitCode = 1; });
