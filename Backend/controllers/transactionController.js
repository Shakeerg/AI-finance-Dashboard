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

module.exports = {
  createTransaction
};