import { isDuplicate } from './txFlags';

// Possible duplicates never count towards any total until the user confirms them
export const countedOnly = (txns) => txns.filter((t) => !isDuplicate(t));

export const sumOf = (txns, type) =>
  txns.filter((t) => t.type === type).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

export const inCurrentMonth = (txns, now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return txns.filter((t) => new Date(t.createdAt) >= start);
};

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

// Last n calendar months (oldest first), with income and spending per month
export function monthlySeries(txns, n, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleString('en-IN', { month: 'short' }), income: 0, expense: 0 });
  }
  const index = {};
  out.forEach((m, i) => { index[m.key] = i; });
  countedOnly(txns).forEach((t) => {
    const m = out[index[monthKey(new Date(t.createdAt))]];
    if (!m) return;
    if (t.type === 'credit') m.income += t.amount;
    else m.expense += t.amount;
  });
  return out;
}

// Spending per day for the last `days` days, oldest first
export function dailySpend(txns, days = 14, now = new Date()) {
  const list = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    list.push({ key: d.toDateString(), value: 0, label: String(d.getDate()), title: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) });
  }
  const index = {};
  list.forEach((x, i) => { index[x.key] = i; });
  countedOnly(txns).forEach((t) => {
    if (t.type !== 'debit') return;
    const i = index[new Date(t.createdAt).toDateString()];
    if (i !== undefined) list[i].value += t.amount;
  });
  return list;
}

export function categoryTotals(txns, type = 'debit') {
  const map = {};
  countedOnly(txns).forEach((t) => {
    if (t.type !== type) return;
    const k = t.category || 'Uncategorized';
    map[k] = (map[k] || 0) + t.amount;
  });
  return Object.keys(map).map((name) => ({ name, value: map[name] })).sort((a, b) => b.value - a.value);
}

export function topMerchants(txns, limit = 5) {
  const map = {};
  countedOnly(txns).forEach((t) => {
    if (t.type !== 'debit') return;
    const k = (t.merchant || 'Unknown').trim().toLowerCase();
    if (!map[k]) map[k] = { name: t.merchant || 'Unknown', value: 0, count: 0 };
    map[k].value += t.amount;
    map[k].count += 1;
  });
  return Object.values(map).sort((a, b) => b.value - a.value).slice(0, limit);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function weekdayTotals(txns) {
  const v = [0, 0, 0, 0, 0, 0, 0];
  countedOnly(txns).forEach((t) => {
    if (t.type !== 'debit') return;
    v[(new Date(t.createdAt).getDay() + 6) % 7] += t.amount;
  });
  return WEEKDAYS.map((label, i) => ({ label, value: v[i] }));
}

export function sourceSummary(txns) {
  const map = {};
  txns.forEach((t) => {
    const name = t.sourceApp || (t.source === 'simulator' ? 'Test SMS' : t.source === 'manual' ? 'Manual entry' : t.source || 'Unknown');
    if (!map[name]) map[name] = { name, count: 0, last: t.createdAt };
    map[name].count += 1;
    if (new Date(t.createdAt) > new Date(map[name].last)) map[name].last = t.createdAt;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}