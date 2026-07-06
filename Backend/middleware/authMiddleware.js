// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // FIXED: 'moodels' -> 'models'

const protect = async (req, res, next) => {
  console.log("Authorization Header:", req.headers.authorization);

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      console.log("JWT:", token);

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fina_fallback_secret_key_123"
      );

      console.log("Decoded:", decoded);

      req.user = await User.findById(decoded.id);

      console.log("User:", req.user);

      next();
    } catch (err) {
      console.log(err);
      return res.status(401).json({
        success: false,
        message: "Token invalid",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token",
    });
  }
};

const protectRoute = (req, res, next) => {
  console.log("API KEY:", req.headers["x-api-key"]);
console.log("EXPECTED:", process.env.FINA_INTERNAL_API_KEY);
  try {
    const clientApiKey = req.headers["x-api-key"];

    if (!clientApiKey) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No API key provided."
      });
    }

    if (clientApiKey !== process.env.FINA_INTERNAL_API_KEY) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Invalid API key."
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};