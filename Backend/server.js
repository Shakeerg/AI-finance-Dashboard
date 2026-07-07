const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");

const connectDB = require("./config/db");

// Load Environment Variables
dotenv.config({ quiet: true, override: false });

// Validate Required Environment Variables
require("./config/env");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5001;

// Connect MongoDB
connectDB();

/* ==========================================================
   SECURITY MIDDLEWARE
========================================================== */

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(compression());

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
   CORS
========================================================== */

/* ==========================================================
   CORS (Dynamic Pattern Matching)
========================================================== */

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development configurations
      if (!origin || origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      // 🟢 Allow production domain OR any dynamic preview branch domains from your project
      if (
        origin === "https://finaai-mu.vercel.app" || 
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      // Deny any random unauthorized origins
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
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
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts. Please try again after 15 minutes.",
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

app.use("/api/v1/auth/login", authLimiter);

app.use("/api/v1/auth", require("./routes/authRoutes"));

/* ==========================================================
   GLOBAL ERROR HANDLER
========================================================== */

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

/* ==========================================================
   START SERVER
========================================================== */

const server = app.listen(PORT, "0.0.0.0", () => {
  if (process.env.NODE_ENV === "development") {
    console.log(` Server running on http://localhost:${PORT}`);
  } else {
    console.log("Server started successfully.");
  }
});

/* ==========================================================
   PROCESS ERROR HANDLING
========================================================== */

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});