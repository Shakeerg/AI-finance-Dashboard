const mongoose = require("mongoose");

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Education",
  "Travel",
  "Rent",
  "Other",
  "Uncategorized",
];

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true,
    },

    // 1. Raw Incoming Data
    rawText: {
      type: String,
      required: [true, "Raw SMS text is required for auditing purposes."],
    },

    // 2. Extracted Data Points
    merchant: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount must be a valid numerical value."],
    },

    // 3. Financial Categorization
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a supported category.",
      },
      default: "Uncategorized",
    },

    // 4. System & AI Quality Metrics
    confidenceScore: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },

    // 5. Transaction Type & Currency Metadata
    type: {
      type: String,
      enum: ["debit", "credit"],
      default: "debit",
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    bank: {
      type: String,
      default: "Unknown Bank",
      trim: true,
    },

    // 6. Queue Idempotency Key
    sourceJobId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true, // Automatically handles createdAt and updatedAt
  }
);

/* ==========================================================
   INDEXES FOR DASHBOARD QUERY PERFORMANCE
========================================================== */

// Fast lookup for user recent transactions feed
TransactionSchema.index({ user: 1, createdAt: -1 });

// Fast merchant filtering and analytical aggregation
TransactionSchema.index({ merchant: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);