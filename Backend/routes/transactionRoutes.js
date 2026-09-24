const express = require("express");
const router = express.Router();

const {
  getTransactions,
  createManualTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} = require("../controllers/transactionController");

const { ingestNotification } = require("../controllers/ingestController");
const { protect } = require("../middleware/authMiddleware");

// All routes below are protected
router.use(protect);

// Specialized endpoints
router.post("/ingest", ingestNotification);
router.post("/manual", createManualTransaction);
router.get("/stats", getTransactionStats);

// General resource collection routes
router.route("/").get(getTransactions);

// Resource item instance routes
router
  .route("/:id")
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;