// backend/utils/messageUtils.js

/* ==========================================================
   PRE-FILTER (runs BEFORE a message is queued / sent to Gemini)

   It only drops obvious non-transactions. Anything doubtful goes
   through, because a missed transaction costs more than one extra
   AI call. Gemini makes the final isTransaction decision.
========================================================== */

// Money amount: "Rs.500", "INR 1,250.00", "₹180", "$10", "500 INR"
const AMOUNT_RE =
  /(?:\brs\.?|\binr|\busd|\beur|\bgbp|\baed|₹|\$|€|£)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*(?:rs\b\.?|inr\b|usd\b|eur\b|gbp\b|aed\b|₹)/i;

// Wording that banks / UPI apps use in transaction alerts
const FINANCE_RE =
  /\b(?:debited|credited|spent|paid|payment|received|sent|withdrawn|withdrawal|deposited|refund(?:ed)?|purchase|transferred|transfer|upi|txn|a\/c|acct|account|card)\b/i;

const OTP_RE = /\b(?:otp|one[- ]time password|verification code|passcode)\b/i;

// Verbs that only appear once money has really moved
const COMPLETED_RE =
  /\b(?:debited|credited|spent|paid|received|withdrawn|deposited|refunded)\b/i;

const isLikelyTransaction = (text) => {
  if (typeof text !== "string") return false;
  if (!AMOUNT_RE.test(text)) return false; // no money amount
  if (!FINANCE_RE.test(text)) return false; // no banking wording (e.g. a plain promo)
  // An OTP message mentions an amount, but nothing has been debited yet.
  // Real alerts that end with "never share OTP" still contain a completed verb.
  if (OTP_RE.test(text) && !COMPLETED_RE.test(text)) return false;
  return true;
};

/* ==========================================================
   REFERENCE NUMBER NORMALISER

   The same UPI reference can arrive as "628391048273",
   "UPI/628391048273" or "Ref No: 6283 9104 8273". Normalise so
   they compare equal. Returns null when it doesn't look like a
   real reference (too short, no digits), so weak values are never
   used for exact-match dedupe.
========================================================== */

// Labels that may be glued to the front of a reference ("UPI/", "Ref No:", "Txn ID"...)
const REF_LABELS = /^(?:UPI|REFERENCE|REF|TXN|TRANSACTION|RRN|UTR|NUMBER|NUM|NO|ID)+/;

const normalizeRef = (value) => {
  if (typeof value !== "string") return null;
  const ref = value
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .replace(REF_LABELS, "");
  return /^[A-Z0-9]{8,30}$/.test(ref) && /\d{4,}/.test(ref) ? ref : null;
};

module.exports = { isLikelyTransaction, normalizeRef };