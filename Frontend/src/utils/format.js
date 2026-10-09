export const formatMoney = (amount, currency = 'INR', decimals = 2) => {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  } catch {
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: decimals });
  }
};

// Whole rupees, for dashboards and totals
export const formatINR0 = (amount) => formatMoney(amount, 'INR', 0);

export const formatDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export const initialOf = (text) => (text || '?').trim().charAt(0).toUpperCase() || '?';

export const timeAgo = (value) => {
  if (!value) return null;
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};