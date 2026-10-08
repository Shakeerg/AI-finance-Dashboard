// backend/controllers/ingestController.js
const crypto = require("crypto");
const { addTransaction } = require("../queues/transactionQueue");
const { isLikelyTransaction } = require("../utils/messageUtils");

const MAX_MESSAGE_LENGTH = 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_SOURCE_APP_LENGTH = 100;

// What the phone app / other clients may declare as their channel
const ALLOWED_SOURCES = ["notification", "sms", "email", "statement"];

const parseTimestamp = (value) => {
  if (value === undefined || value === null) return null;
  const ms = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ms) || ms > Date.now() + MAX_CLOCK_SKEW_MS) return undefined; // invalid
  return ms;
};

const ingestNotification = async (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  const { message, timestamp, source, sourceApp } = req.body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Notification message is required." });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(413).json({ success: false, message: "Notification message is too long." });
  }

  const clientTs = parseTimestamp(timestamp);
  if (clientTs === undefined) {
    return res.status(400).json({ success: false, message: "Invalid timestamp." });
  }

  const text = message.trim();

  // Cheap filter: skip OTPs, promos and chatter without spending an AI call.
  // Returns 200 (not an error) so the phone app doesn't retry it.
  if (!isLikelyTransaction(text)) {
    return res.status(200).json({
      success: true,
      ignored: true,
      message: "Not recognised as a transaction alert; ignored.",
    });
  }

  // Phone app = device key; dashboard simulator = JWT
  const viaDevice = Boolean(req.headers["x-device-key"]);
  const cleanSource = viaDevice
    ? ALLOWED_SOURCES.includes(source)
      ? source
      : "notification"
    : "simulator";

  const cleanSourceApp =
    typeof sourceApp === "string" && sourceApp.trim()
      ? sourceApp.trim().slice(0, MAX_SOURCE_APP_LENGTH)
      : undefined;

  // Same user + same message + same notification time => same job, so client retries are no-ops
  const dedupKey = crypto
    .createHash("sha256")
    .update(`${userId}|${text}|${clientTs ?? ""}`)
    .digest("hex");

  try {
    const job = await addTransaction(
      {
        message: text,
        userId,
        timestamp: clientTs ?? Date.now(),
        source: cleanSource,
        sourceApp: cleanSourceApp,
      },
      dedupKey
    );

    return res.status(202).json({
      success: true,
      message: "Notification queued for processing",
      jobId: job.id,
    });
  } catch (error) {
    // Queue unavailable (e.g. Redis down): tell the client to retry rather than returning a generic 500
    console.error("Ingestion queue error:", error.message);
    res.set("Retry-After", "30");
    return res.status(503).json({ success: false, message: "Service temporarily unavailable. Please retry." });
  }
};

module.exports = { ingestNotification };