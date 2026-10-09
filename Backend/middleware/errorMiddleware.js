// backend/middleware/errorMiddleware.js
const env = require("../config/env");

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    // Mongoose validation (missing name, bad category, etc.)
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    message = "That value already exists.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body.";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large.";
  }

  // Log real server faults only
  if (status >= 500) {
    console.error("🚨 Server error:", err.stack || err);
  }

  res.status(status).json({
    success: false,
    // Never leak internals for 500s in production
    message:
      status >= 500 && env.NODE_ENV === "production"
        ? "Internal Server Error"
        : message,
    ...(env.NODE_ENV === "development" && status >= 500 && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };