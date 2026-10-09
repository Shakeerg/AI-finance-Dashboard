// Must match MIN_CONFIDENCE in Backend/models/Transactions.js
export const MIN_CONFIDENCE = 0.7;

export const isDuplicate = (tx) => Boolean(tx?.possibleDuplicate);

// "Needs review": flagged possible duplicate / low AI confidence / no category yet.
// Confirming or editing a transaction sets its confidence to 1 ("a person has looked at it"),
// which clears the flag even when the category stays Uncategorized.
export const needsReview = (tx) =>
  Boolean(tx) &&
  (isDuplicate(tx) ||
    (typeof tx.confidenceScore === 'number' && tx.confidenceScore < MIN_CONFIDENCE) ||
    (tx.category === 'Uncategorized' && !(tx.confidenceScore >= 1)));

// Plain-language reason shown in the review inbox
export const reviewReason = (tx) => {
  if (isDuplicate(tx)) {
    return 'The same amount was reported by another app within 3 minutes. It is left out of your totals until you confirm it.';
  }
  const pct = typeof tx.confidenceScore === 'number' ? Math.round(tx.confidenceScore * 100) : null;
  if (tx.category === 'Uncategorized') {
    return pct !== null && pct < MIN_CONFIDENCE * 100
      ? `The AI was only ${pct}% sure, so the category was left open.`
      : 'No category yet. Pick one so it shows up in your charts and budgets.';
  }
  return pct !== null ? `The AI was only ${pct}% confident about this one.` : 'Please check the details.';
};