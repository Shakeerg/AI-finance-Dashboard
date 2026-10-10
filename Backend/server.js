const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");

// Load Environment Variables (before requiring modules that read process.env at import time)
dotenv.config({ quiet: true, override: false });

// Validate Required Environment Variables
const env = require("./config/env");

const initWorkers = require("./workers/transactionWorker");
const connectDB = require("./config/db");
const { closeQueue } = require("./queues/transactionQueue");
const { initSocket, closeSocket } = require("./config/socket");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Initialize Express
const app = express();
const PORT = env.PORT;

/* ==========================================================
   SECURITY & GLOBAL MIDDLEWARE
========================================================== */

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(compression());

// Trust proxy for reverse proxies (Vercel, Nginx, Cloudflare)
app.set("trust proxy", 1);

/* ==========================================================
   HTTPS REDIRECT (Production Only)
========================================================== */

app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(`https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

/* ==========================================================
   CORS (exact origins only; shared with Socket.io)
========================================================== */

const allowedOrigins = new Set([
  ...env.CLIENT_URL.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean),
  "https://finaai-mu.vercel.app",
]);
const localhostRegex = /^http:\/\/localhost(:\d+)?$/;

const corsOrigin = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl)
  if (!origin) return callback(null, true);

  if (allowedOrigins.has(origin)) return callback(null, true);

  // Local development only
  if (process.env.NODE_ENV !== "production" && localhostRegex.test(origin)) {
    return callback(null, true);
  }

  // Return null, false to reject origin cleanly without triggering a 500 internal server error
  return callback(null, false);
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-device-key"],
  })
);

/* ==========================================================
   BODY PARSER + SANITIZATION
========================================================== */

app.use(express.json({ limit: "10kb" }));
app.use(hpp());

/* ==========================================================
   HEALTH CHECK
========================================================== */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date(),
  });
});

/* ==========================================================
   RATE LIMITERS
========================================================== */

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Ingest has its own limiter (see transactionRoutes.js). Phone and laptop
  // often share one home IP, so they must not share this budget.
  skip: (req) => req.originalUrl.startsWith("/api/v1/transactions/ingest"),
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/* ==========================================================
   ROUTES
========================================================== */

app.use(
  "/api/v1/transactions",
  generalLimiter,
  require("./routes/transactionRoutes")
);

// Auth router mounted directly (apply authLimiter inside authRoutes.js on router.post('/login'))
app.use("/api/v1/auth", require("./routes/authRoutes"));

/* ==========================================================
   404 + GLOBAL ERROR HANDLER (must stay last)
========================================================== */

app.use(notFound);
app.use(errorHandler);

/* ==========================================================
   DATABASE, SOCKET.IO & SERVER INITIALIZATION
========================================================== */

let server;

connectDB()
  .then(() => {
    server = http.createServer(app);

    // Socket.io first, so the worker can push as soon as it saves
    initSocket(server, corsOrigin);

    // Start background workers only after successful DB connection
    initWorkers();

    server.listen(PORT, "0.0.0.0", () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Server running on http://localhost:${PORT}`);
      } else {
        console.log("Server started successfully.");
      }
    });
  })
  .catch((err) => {
    console.error("Failed to connect to Database:", err);
    process.exit(1);
  });

/* ==========================================================
   PROCESS ERROR HANDLING & GRACEFUL SHUTDOWN
========================================================== */

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  // Don't hang forever if something refuses to close
  setTimeout(() => process.exit(1), 10_000).unref();

  try {
    await initWorkers.stop?.();
    await closeQueue();
    await closeSocket(); // also closes the HTTP server
  } catch (err) {
    console.error("Error during shutdown:", err.message);
  }

  console.log("Server closed.");
  process.exit(0);
});