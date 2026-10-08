// backend/models/Transactions.js
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

const SOURCES = [
  "notification",
  "sms",
  "email",
  "statement",
  "manual",
  "simulator",
];

// Below this confidence a transaction is treated as "needs review"
const MIN_CONFIDENCE = 0.7;

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true,
    },

    // 1. Raw Incoming Data (audit trail)
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
      min: [0.01, "Transaction amount must be positive."],
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

    // 6. Where it came from + duplicate handling
    source: {
      type: String,
      enum: SOURCES,
      default: "notification",
    },
    sourceApp: { type: String, trim: true, maxlength: 100 }, // e.g. com.phonepe.app
    refNumber: { type: String, trim: true, uppercase: true }, // UPI ref / txn id
    possibleDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },

    // 7. Queue Idempotency Key
    sourceJobId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Defined explicitly (not immutable) so a user can correct the date
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // still manages updatedAt
  }
);

/* ==========================================================
   INDEXES
========================================================== */

// Recent-transactions feed
TransactionSchema.index({ user: 1, createdAt: -1 });

// Merchant analytics
TransactionSchema.index({ merchant: 1, createdAt: -1 });

// Fuzzy duplicate lookup (same user, direction, amount, close in time)
TransactionSchema.index({ user: 1, type: 1, amount: 1, createdAt: 1 });

// Hard backstop against saving the same payment twice when two jobs race:
// one user + one reference number + one direction.
TransactionSchema.index(
  { user: 1, refNumber: 1, type: 1 },
  { unique: true, partialFilterExpression: { refNumber: { $type: "string" } } }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

// Single source of truth, shared by the worker and the controllers
Transaction.CATEGORIES = CATEGORIES;
Transaction.SOURCES = SOURCES;
Transaction.MIN_CONFIDENCE = MIN_CONFIDENCE;

module.exports = Transaction;