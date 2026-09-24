// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token and strip potential surrounding whitespace or quotes
      token = req.headers.authorization.split(" ")[1]?.trim();

      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token missing from Bearer header",
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fina_fallback_secret_key_123"
      );

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User account no longer exists",
        });
      }

      return next(); // Return here prevents fall-through to the (!token) check
    } catch (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(401).json({
        success: false,
        message: "Token invalid or expired",
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Access Denied: No Bearer token provided",
  });
};

const protectRoute = (req, res, next) => {
  try {
    const clientApiKey = req.headers["x-api-key"];

    if (!clientApiKey) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No API key provided",
      });
    }

    if (clientApiKey !== process.env.FINA_INTERNAL_API_KEY) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Invalid API key",
      });
    }

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  protectRoute,
};