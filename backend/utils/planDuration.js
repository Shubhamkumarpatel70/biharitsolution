function parsePlanDurationDays(durationValue) {
  if (typeof durationValue === "number" && Number.isFinite(durationValue)) {
    return Math.max(1, Math.round(durationValue));
  }

  const raw = String(durationValue || "").trim();
  if (!raw) return 30;

  // Accept values like "30" or "30-40" and use the upper bound for expiry safety.
  const match = raw.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
  if (!match) {
    const numeric = Number.parseInt(raw, 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 30;
  }

  const first = Number.parseInt(match[1], 10);
  const second = match[2] ? Number.parseInt(match[2], 10) : first;
  return Math.max(1, first, second);
}

module.exports = {
  parsePlanDurationDays,
};
