// backend/middleware/authMiddleware.js
const crypto = require("crypto");
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });

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

// Device-key guard for the phone app (sent as the x-device-key header)
const DEVICE_KEY_REGEX = /^fina_[a-f0-9]{64}$/;

const protectDevice = async (req, res, next) => {
  try {
    const key = req.headers["x-device-key"];
    if (typeof key !== "string" || !DEVICE_KEY_REGEX.test(key)) {
      return res.status(401).json({
        success: false,
        message: "Invalid device key.",
      });
    }

    const hash = crypto.createHash("sha256").update(key).digest("hex");
    const user = await User.findOne({ deviceKeyHash: hash }).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid device key.",
      });
    }

    req.user = user;

    // Update "last seen" at most once a minute
    const last = user.deviceLastSeenAt?.getTime() ?? 0;
    if (Date.now() - last > 60_000) {
      User.updateOne({ _id: user._id }, { $set: { deviceLastSeenAt: new Date() } }).catch(() => {});
    }

    return next();
  } catch (error) {
    next(error);
  }
};

// Phone app sends x-device-key; the dashboard simulator sends a JWT
const authenticateIngest = (req, res, next) =>
  req.headers["x-device-key"]
    ? protectDevice(req, res, next)
    : protect(req, res, next);

module.exports = {
  protect,
  protectDevice,
  authenticateIngest,
};