// backend/config/redis.js
require("dotenv").config({ quiet: true });
const Redis = require("ioredis");

const { REDIS_URL } = process.env;
if (!REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment variables");
}

const cleanUrl = REDIS_URL.trim().replace(/^["']|["']$/g, "");
const parsedUrl = new URL(cleanUrl);

// Upstash always requires TLS, so don't rely on the URL scheme alone
const useTls =
  parsedUrl.protocol === "rediss:" || parsedUrl.hostname.endsWith(".upstash.io");

const redisOptions = {
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port) || 6379,
  username: parsedUrl.username || "default",
  password: decodeURIComponent(parsedUrl.password),
  maxRetriesPerRequest: null, // Required by BullMQ workers
  enableReadyCheck: false,
  keepAlive: 10000,
  family: 4,
  connectTimeout: 20000,
  ...(useTls && { tls: { servername: parsedUrl.hostname } }),
  retryStrategy: (times) => Math.min(times * 200, 3000),
};

const redisConnection = new Redis({ ...redisOptions, lazyConnect: true }); // only a template; BullMQ makes its own clients

redisConnection.on("error", (err) =>
  console.error("❌ Redis error:", err.code || "", err.message)
);

module.exports = redisConnection;
module.exports.redisOptions = redisOptions;