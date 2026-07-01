const express = require("express");

const router = express.Router();

const {
createTransaction, getTransactions, getTransactionStats
} = require("../controllers/transactionController");
 
// Route mapping for /api/v1/transactions
router.route('/')
.post(createTransaction)
.get(getTransactions);

// Special metrics sub-route: /api/v1/transactions/stats

router.route('/stats').get(getTransactionStats);
module.exports = router;