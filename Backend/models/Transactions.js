const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    // 1. The Raw Incoming Data
    rawText: { type: String, required: [true, 'Raw SMS text is required for auditing purposes'] },


    // 2. Extracted Data Points (Filled by the AI Agent later)
    merchant: {type: String, default: 'Unknown', trim: true},
    amount: {type: Number, required: [true, 'Transaction amount must be a valid numberical value.']},

    // 3. Financial Categorization
    category: {
      type: String,
      enum: {
        values: ['Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Travel', 'Other', 'Rent', 'Uncategorized'],
        message: '{VALUE} is not a supported category.'
      },
      default: 'Uncategorized'
    },
    // 4. System & AI Quality Metrics

    confidenceScore: {type: Number, default: 1.0, min: 0, max: 1},

    // 5. Timestamps
    createdAt: {type: Date, default: Date.now},

    // // NEW: Track if money is going out or coming in
    type: {
      type: String,
      enum: ['debit', 'credit'],
      default: 'debit'
    },
    // NEW: Support dynamic currencies instead of hardcoding INR
    currency: {
      type: String,
      default: 'INR'
    },
    // NEW: Track the issuing financial institution
    bank: {
      type: String,
      default: 'Unknown Bank',
      trim: true
    },
}, { timestamps: true });


// Create a compound index on merchant and createdAt to optimize frontend queries later
TransactionSchema.index({merchant:1, createdAt: -1});

module.exports = mongoose.model('Transaction', TransactionSchema);

