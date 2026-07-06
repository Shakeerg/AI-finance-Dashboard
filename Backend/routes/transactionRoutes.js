const express = require("express");
const router = express.Router();

const {
  createTransaction,
  getTransactions,
  getTransactionStats,
  deleteTransaction,
} = require("../controllers/transactionController");

const { protect } = require("../middleware/authMiddleware");

// Every transaction route requires a valid JWT
router.use(protect);

router
  .route("/")
  .post(createTransaction)
  .get(getTransactions);

router
  .route("/stats")
  .get(getTransactionStats);

router
  .route("/:id")
  .delete(deleteTransaction);

module.exports = router;