const express = require("express");

const router = express.Router();

const {
createTransaction, getTransactions, getTransactionStats
} = require("../controllers/transactionController");
const {protectRoute} = require("../middleware/authMiddleware");

// Route mapping for /api/v1/transactions

router.route('/')
.post(protectRoute, createTransaction)
.get(protectRoute, getTransactions);

// Special metrics sub-route: /api/v1/transactions/stats

router.route('/stats').get(protectRoute, getTransactionStats);
module.exports = router;