// backend/controllers/transactionController.js
const Transaction = require("../models/Transactions"); 
const { parseSMSWithAi } = require("../config/aiService");

// @desc    Ingest raw SMS text and automatically process via AI Agent
// @route   POST /api/v1/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { rawText } = req.body;

    // Only validate rawText here since the AI will figure out the rest!
    if (!rawText) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: Please provide rawText payload."
      });
    }

    // 1. Invoke the AI processing engine
    console.log('🤖 Sending rawText to FINA AI agent...');
    const aiParsedData = await parseSMSWithAi(rawText);
    console.log('✅ AI response received:', aiParsedData);

    // 2. Commit the combined data model directly to MongoDB using the AI's output
    const newTransaction = await Transaction.create({
      rawText,
      amount: aiParsedData.amount || 0,
      merchant: aiParsedData.merchant || "Unknown Merchant",
      category: aiParsedData.category || "Uncategorized",
      confidenceScore: aiParsedData.confidenceScore || 1.0
    });

    return res.status(201).json({
      success: true,
      data: newTransaction
    });

  } catch (error) {
    next(error);
  }
};





// @desc    Get all transactions sorted by newest first
// @route   GET /api/v1/transactions









// @desc    Calculate aggregate spending charts by category
// @route   GET /api/v1/transactions/stats
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction statistics
// @route   GET /api/v1/transactions/stats

const getTransactionStats = async (req, res, next) => {
  try{
    // Using MongoDB's heavy-duty Aggregation Pipeline engine
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: "$category",               // Group data sets by their unique category name
          totalSpent: {$sum: "$amount"},  // Compute the sum of all elements in that category
          transactionCount: {$sum: 1}     // Count total iterations inside the block
        }
      },
      {$sort: {totalSpent: -1}}           // Sort from highest spend to lowest
    ]);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  }catch (error){
    next(error);
  } 
};


module.exports = {
  createTransaction, getTransactions, getTransactionStats
};