const express = require("express");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");

const {
  registerUser,
  loginUser,
  createDeviceKey,
  getDeviceKeyStatus,
  revokeDeviceKey,
} = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

// Dedicated rate limiter for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

router.post("/register", authLimiter, registerUser);

router.post(
  "/login",
  authLimiter,
  (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
      console.log("POST /api/v1/auth/login");
    }
    next();
  },
  loginUser
);

// Phone-app device key (JWT required)
router
  .route("/device-key")
  .get(protect, getDeviceKeyStatus)
  .post(protect, createDeviceKey)
  .delete(protect, revokeDeviceKey);

module.exports = router;