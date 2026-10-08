const express = require("express");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");

const {
  getTransactions,
  createManualTransaction,
  updateTransaction,
  confirmTransaction,
  deleteTransaction,
  getTransactionStats,
} = require("../controllers/transactionController");

const { ingestNotification } = require("../controllers/ingestController");
const { protect, authenticateIngest } = require("../middleware/authMiddleware");

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many notifications. Slow down." },
});

// Ingest accepts a device key (phone app) OR a JWT (dashboard simulator)
router.post("/ingest", ingestLimiter, authenticateIngest, ingestNotification);

// Everything below requires a JWT
router.use(protect);

router.post("/manual", createManualTransaction);
router.get("/stats", getTransactionStats);
router.route("/").get(getTransactions);
router.post("/:id/confirm", confirmTransaction);
router.route("/:id").put(updateTransaction).delete(deleteTransaction);

module.exports = router;