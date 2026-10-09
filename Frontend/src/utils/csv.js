import { isDuplicate, needsReview } from './txFlags';

// Cells starting with = + - @ can run as formulas in Excel: neutralise them
const cell = (value) => {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const HEADER = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Currency', 'Bank', 'Source', 'Status', 'Reference'];

export function transactionsToCsv(txns) {
  const rows = txns.map((t) => [
    new Date(t.createdAt).toISOString(),
    t.merchant,
    t.category,
    t.type,
    t.amount,
    t.currency || 'INR',
    t.bank,
    t.sourceApp || t.source || '',
    isDuplicate(t) ? 'possible duplicate' : needsReview(t) ? 'needs review' : 'ok',
    t.refNumber || '',
  ]);
  return [HEADER, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename, txns) {
  const blob = new Blob(['﻿' + transactionsToCsv(txns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}