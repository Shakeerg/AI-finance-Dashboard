// backend/controllers/ingestController.js
const crypto = require("crypto");
const { addTransaction } = require("../queues/transactionQueue");

const MAX_MESSAGE_LENGTH = 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

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

  const { message, timestamp } = req.body ?? {};

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

  // Same user + same message + same notification time => same job, so client retries are no-ops
  const dedupKey = crypto
    .createHash("sha256")
    .update(`${userId}|${text}|${clientTs ?? ""}`)
    .digest("hex");

  try {
    const job = await addTransaction(
      { message: text, userId, timestamp: clientTs ?? Date.now() },
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