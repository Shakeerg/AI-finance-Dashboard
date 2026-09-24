const Transaction = require("../models/Transactions");

// @desc    Get paginated transactions for logged-in user
// @route   GET /api/v1/transactions
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { user: userId };

    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a transaction manually without raw text / SMS
// @route   POST /api/v1/transactions/manual
const createManualTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { merchant, amount, category, type, currency, bank, createdAt, date } = req.body;

    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: A valid numerical amount is required.",
      });
    }

    const transactionDate = date || createdAt ? new Date(date || createdAt) : new Date();

    const manualTx = await Transaction.create({
      user: userId,
      rawText: "MANUAL_ENTRY",
      merchant: merchant?.trim() || "Manual Entry",
      amount: Number(amount),
      category: category || "Uncategorized",
      confidenceScore: 1.0,
      type: type === "credit" ? "credit" : "debit",
      currency: currency?.toUpperCase() || "INR",
      bank: bank?.trim() || "Cash / Manual",
      createdAt: transactionDate,
    });

    return res.status(201).json({
      success: true,
      transaction: manualTx,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing transaction record
// @route   PUT /api/v1/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const allowedUpdates = [
      "merchant",
      "amount",
      "category",
      "type",
      "currency",
      "bank",
      "createdAt",
      "date",
    ];

    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "date" || key === "createdAt") {
          if (req.body[key]) {
            updates["createdAt"] = new Date(req.body[key]);
          }
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction record not found or unauthorized access.",
      });
    }

    return res.status(200).json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction record
// @route   DELETE /api/v1/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const transaction = await Transaction.findOneAndDelete({ _id: id, user: userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction record not found or unauthorized access.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category aggregations and spending statistics
// @route   GET /api/v1/transactions/stats
const getTransactionStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const stats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.type",
          categories: {
            $push: {
              category: "$_id.category",
              totalAmount: "$totalAmount",
              count: "$count",
            },
          },
          grandTotal: { $sum: "$totalAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createManualTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
};