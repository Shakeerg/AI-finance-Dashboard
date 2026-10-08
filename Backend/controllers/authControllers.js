const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET, // Clean out the insecure hardcoded fallback string for production
    { expiresIn: "7d" } // Production target timeline
  );
};

const hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");

// @route POST /api/v1/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/v1/auth/login
const loginUser = async (req, res, next) => {

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/v1/auth/device-key   (JWT required) - create or rotate
const createDeviceKey = async (req, res, next) => {
  try {
    const key = `fina_${crypto.randomBytes(32).toString("hex")}`;

    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          deviceKeyHash: hashKey(key),
          deviceKeyPrefix: key.slice(0, 11),
          deviceKeyCreatedAt: new Date(),
        },
        $unset: { deviceLastSeenAt: "" },
      }
    );

    // The plain key is returned ONCE. Only its hash is stored.
    return res.status(201).json({ success: true, deviceKey: key });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/v1/auth/device-key   (JWT required) - status only, never the key
const getDeviceKeyStatus = (req, res) => {
  const u = req.user;
  return res.status(200).json({
    success: true,
    hasKey: Boolean(u.deviceKeyPrefix),
    prefix: u.deviceKeyPrefix || null,
    createdAt: u.deviceKeyCreatedAt || null,
    lastSeenAt: u.deviceLastSeenAt || null,
  });
};

// @route DELETE /api/v1/auth/device-key   (JWT required) - revoke
const revokeDeviceKey = async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      {
        $unset: {
          deviceKeyHash: "",
          deviceKeyPrefix: "",
          deviceKeyCreatedAt: "",
          deviceLastSeenAt: "",
        },
      }
    );
    return res.status(200).json({ success: true, message: "Device key revoked." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  createDeviceKey,
  getDeviceKeyStatus,
  revokeDeviceKey,
};