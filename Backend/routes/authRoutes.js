const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authControllers");

router.post("/register", registerUser);

router.post("/login", (req, res, next) => {
  console.log("POST /api/v1/auth/login");
  next();
}, loginUser);

module.exports = router;