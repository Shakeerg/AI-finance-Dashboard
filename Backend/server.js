const express = require("express");
const cors = require("cors");
const { rateLimit } = require('express-rate-limit');
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const transactionRoutes = require('./routes/transactionRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
dotenv.config({ quiet: true });
console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);
// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Rate Limiter
// 2. Global Guard: DDOS & API Abuse Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 100, // Limit each IP address to 100 requests per window
  standardHeaders: 'draft-7', // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Apply rate limiting specifically to data extraction tracks instead of global auth paths
app.use('/api/v1/transactions', apiLimiter);

// Middleware
app.use(cors());
app.use(express.json());

// Health Route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date()
    });
});

// Routes
app.use("/api/v1/transactions", require("./routes/transactionRoutes"));
app.use('/api/v1/auth', require('./routes/authRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// Start Server
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Listening on http://0.0.0.0:${PORT}`);
});

server.on("listening", () => {
    console.log("Server is now listening.");
});

server.on("error", (err) => {
    console.error("Listen Error:", err);
});

// Catch unexpected errors
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});