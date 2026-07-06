// backend/controllers/transactionController.js
const Transaction = require("../models/Transactions"); 
const { parseSMSWithAi } = require("../config/aiService");

// @desc    Ingest raw SMS text and automatically process via AI Agent
// @route   POST /api/v1/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: Please provide rawText payload."
      });
    }

    console.log('🤖 Sending rawText to FINA AI agent...');
    const aiParsedData = await parseSMSWithAi(rawText);
    console.log('✅ AI response received:', aiParsedData);

    const newTransaction = await Transaction.create({
      user: req.user.id, // Securely link transaction to the logged-in user
      rawText,
      amount: aiParsedData.amount || 0,
      merchant: aiParsedData.merchant || "Unknown Merchant",
      category: aiParsedData.category || "Uncategorized",
      confidenceScore: aiParsedData.confidenceScore || 1.0,
      type: aiParsedData.type || "debit",       
      currency: aiParsedData.currency || "INR",   
      bank: aiParsedData.bank || "Unknown Bank"
    });

    return res.status(201).json({
      success: true,
      transaction: newTransaction 
    });

  } catch (error) { next(error); }
};

// @desc    Get all transactions sorted by newest first
// @route   GET /api/v1/transactions
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      transactions: transactions 
    });
  } catch (error) { next(error); }
};

// @desc    Get transaction statistics aggregation summary
// @route   GET /api/v1/transactions/stats
const getTransactionStats = async (req, res, next) => {
  try {
    const stats = await Transaction.aggregate([
      { $match: { user: req.user._id } }, // Only aggregate THIS user's data
      {
        $group: {
          _id: "$category",
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) { next(error); } 
};

// @desc    Delete a single transaction record by ID
// @route   DELETE /api/v1/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, user: req.user.id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction record not found or unauthorized access."
      });
    }

    // FIXED: Actually execute the deletion out of the cluster!
    await transaction.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Transaction successfully removed from database."
    });
  } catch (error) { next(error); }
};

module.exports = {
  createTransaction, 
  getTransactions, 
  getTransactionStats,
  deleteTransaction
};