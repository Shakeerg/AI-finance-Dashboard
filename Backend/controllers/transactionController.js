const mongoose = require("mongoose");
const Transaction = require("../models/Transactions");
const { emitToUser } = require("../config/socket");

const { CATEGORIES, MIN_CONFIDENCE } = Transaction;

const MAX_PAGE_SIZE = 100;

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "Needs review": unsure category / low AI confidence / flagged possible duplicate
const reviewFilter = () => ({
  $or: [
    { category: "Uncategorized" },
    { confidenceScore: { $lt: MIN_CONFIDENCE } },
    { possibleDuplicate: true },
  ],
});

// @desc    Get paginated transactions for logged-in user
// @route   GET /api/v1/transactions
//          ?page &limit(max 100) &startDate &endDate &category &type
//          &search (merchant/bank) &review=true &duplicates=true
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * limit;

    const query = { user: userId };
    const and = [];

    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        const start = parseDate(req.query.startDate);
        if (!start) {
          return res.status(400).json({ success: false, message: "Invalid startDate." });
        }
        query.createdAt.$gte = start;
      }
      if (req.query.endDate) {
        const end = parseDate(req.query.endDate);
        if (!end) {
          return res.status(400).json({ success: false, message: "Invalid endDate." });
        }
        query.createdAt.$lte = end;
      }
    }

    if (req.query.category) {
      const category = String(req.query.category);
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Unsupported category: ${category}`,
        });
      }
      query.category = category;
    }

    if (req.query.type) {
      const type = String(req.query.type);
      if (!["debit", "credit"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "type must be 'debit' or 'credit'.",
        });
      }
      query.type = type;
    }

    if (req.query.search) {
      const term = escapeRegex(String(req.query.search).trim().slice(0, 50));
      if (term) {
        and.push({
          $or: [
            { merchant: { $regex: term, $options: "i" } },
            { bank: { $regex: term, $options: "i" } },
          ],
        });
      }
    }

    if (req.query.review === "true") and.push(reviewFilter());
    if (req.query.duplicates === "true") query.possibleDuplicate = true;
    if (and.length) query.$and = and;

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
      pages: Math.ceil(total / limit) || 1,
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

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: A valid positive numerical amount is required.",
      });
    }

    let transactionDate = new Date();
    if (date || createdAt) {
      const parsedDate = parseDate(date || createdAt);
      if (!parsedDate) {
        return res.status(400).json({ success: false, message: "Invalid date." });
      }
      transactionDate = parsedDate;
    }

    const manualTx = await Transaction.create({
      user: userId,
      rawText: "MANUAL_ENTRY",
      merchant: merchant?.trim() || "Manual Entry",
      amount: parsedAmount,
      category: category || "Uncategorized",
      confidenceScore: 1.0,
      type: type === "credit" ? "credit" : "debit",
      currency: currency?.toUpperCase() || "INR",
      bank: bank?.trim() || "Cash / Manual",
      source: "manual",
      createdAt: transactionDate,
    });

    emitToUser(userId, "transaction:new", manualTx.toObject());

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID format.",
      });
    }

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
        } else if (key === "amount") {
          updates["amount"] = parseFloat(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update.",
      });
    }

    if ("amount" in updates && !(updates.amount > 0)) {
      return res.status(400).json({
        success: false,
        message: "A valid positive amount is required.",
      });
    }

    // A person has now looked at it, so it is no longer "low confidence"
    updates.confidenceScore = 1;

    // find + save (instead of findOneAndUpdate) so validators run and an
    // edited date is kept instead of being dropped by Mongoose timestamps
    const updatedTransaction = await Transaction.findOne({ _id: id, user: userId });

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction record not found or unauthorized access.",
      });
    }

    updatedTransaction.set(updates);
    await updatedTransaction.save();

    emitToUser(userId, "transaction:updated", updatedTransaction.toObject());

    return res.status(200).json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a transaction as reviewed: clears low-confidence + duplicate flags
// @route   POST /api/v1/transactions/:id/confirm
const confirmTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID format.",
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: userId },
      {
        $set: { confidenceScore: 1, possibleDuplicate: false },
        $unset: { duplicateOf: "" },
      },
      { returnDocument: "after", lean: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction record not found or unauthorized access.",
      });
    }

    emitToUser(userId, "transaction:updated", transaction);

    return res.status(200).json({
      success: true,
      transaction,
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID format.",
      });
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, user: userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction record not found or unauthorized access.",
      });
    }

    emitToUser(userId, "transaction:deleted", { id });

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category aggregations and spending statistics
//          Flagged possible duplicates are left out of totals until confirmed.
// @route   GET /api/v1/transactions/stats
const getTransactionStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // Convert string ID to ObjectId for Mongoose aggregate query
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    const [stats, reviewCount] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userObjectId, possibleDuplicate: { $ne: true } } },
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
      ]),
      // For a "needs review" badge on the dashboard
      Transaction.countDocuments({ user: userObjectId, ...reviewFilter() }),
    ]);

    return res.status(200).json({
      success: true,
      stats,
      reviewCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createManualTransaction,
  updateTransaction,
  confirmTransaction,
  deleteTransaction,
  getTransactionStats,
};