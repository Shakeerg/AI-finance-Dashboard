import React, { useState, useEffect } from 'react';

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

const colors = {
  paper: 'var(--bg)',
  paperRaised: 'var(--surface2)',
  paperGlass: 'var(--surface)',
  ink: 'var(--ink)',
  inkSoft: 'var(--ink2)',
  rule: 'var(--line)',
  emerald: 'var(--accent)',
  emeraldSoft: 'var(--accentSoft)',
  amber: 'var(--amber)',
  amberSoft: 'var(--amberSoft)',
  red: 'var(--red)',
  redSoft: 'var(--redSoft)',
};

const fonts = {
  serif: 'var(--sans)',
  sans: 'var(--sans)',
  mono: 'var(--mono)',
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(28, 27, 23, 0.45)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalStyle = {
  background: colors.paperGlass,
  border: '1px solid var(--line)',
  borderRadius: '16px',
  boxShadow: '0 24px 48px -12px rgba(28,27,23,0.3)',
  width: '100%',
  maxWidth: '480px',
  padding: '24px',
  boxSizing: 'border-box',
};

// Local calendar date as YYYY-MM-DD (toISOString() would give the UTC date,
// which is the wrong day for a transaction made after midnight in India)
const localDateStr = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Helper function to format YYYY-MM-DD for date inputs
const formatDateForInput = (dateString) => {
  if (!dateString) return localDateStr();
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? localDateStr() : localDateStr(d);
};

// Picked day -> timestamp for the API. Today keeps the current time; any other day
// uses local noon so it can never slip into the previous/next day.
const dateToApi = (day) =>
  day === localDateStr() ? new Date().toISOString() : new Date(`${day}T12:00:00`).toISOString();

export default function TransactionModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const isEditMode = Boolean(initialData && initialData._id);

  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Uncategorized',
    type: 'debit',
    bank: 'Cash',
    currency: 'INR',
    date: localDateStr(),
  });

  const [error, setError] = useState('');

  // Handle Escape keypress to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Populate form data when editing or reset on new entry
  useEffect(() => {
    if (initialData) {
      setFormData({
        merchant: initialData.merchant || '',
        amount: initialData.amount || '',
        category: initialData.category || 'Uncategorized',
        type: initialData.type || 'debit',
        bank: initialData.bank || 'Cash',
        currency: initialData.currency || 'INR',
        date: formatDateForInput(initialData.date || initialData.createdAt),
      });
    } else {
      setFormData({
        merchant: '',
        amount: '',
        category: 'Uncategorized',
        type: 'debit',
        bank: 'Cash',
        currency: 'INR',
        date: localDateStr(),
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    const payload = { ...formData, amount: Number(formData.amount) };

    // When editing, only send the date if the user changed it. Re-sending the
    // unchanged day would overwrite the exact time the bank notification arrived.
    const originalDay = isEditMode
      ? formatDateForInput(initialData.date || initialData.createdAt)
      : null;
    if (isEditMode && formData.date === originalDay) {
      delete payload.date;
    } else {
      payload.date = dateToApi(formData.date);
    }

    onSubmit(payload);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{isEditMode ? 'Edit Transaction' : 'Add Manual Transaction'}</h3>
          <button style={styles.closeBtn} onClick={onClose} type="button">✕</button>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Merchant & Date Row */}
          <div style={styles.row}>
            <div style={{ ...styles.fieldGroup, flex: 2 }}>
              <label style={styles.label}>Merchant / Description</label>
              <input
                type="text"
                name="merchant"
                placeholder="e.g. Local Grocery Store"
                value={formData.merchant}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Amount & Type Row */}
          <div style={styles.row}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Amount (₹)</label>
              <input
                type="number"
                step="any"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} style={styles.input}>
                <option value="debit">Debit (−)</option>
                <option value="credit">Credit (+)</option>
              </select>
            </div>
          </div>

          {/* Category & Bank Row */}
          <div style={styles.row}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Bank / Payment Mode</label>
              <input
                type="text"
                name="bank"
                placeholder="Cash, HDFC, Paytm"
                value={formData.bank}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Saving...' : isEditMode ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    fontWeight: 500,
    margin: 0,
    color: colors.ink,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    color: colors.inkSoft,
    cursor: 'pointer',
  },
  errorBox: {
    background: colors.redSoft,
    color: colors.red,
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: 13,
    marginBottom: 14,
    fontFamily: fonts.sans,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.inkSoft,
  },
  input: {
    padding: '9px 12px',
    borderRadius: '6px',
    border: `1px solid ${colors.rule}`,
    background: colors.paperRaised,
    color: colors.ink,
    fontSize: 13.5,
    fontFamily: fonts.sans,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: '6px',
    border: `1px solid ${colors.rule}`,
    background: 'transparent',
    color: colors.inkSoft,
    cursor: 'pointer',
    fontSize: 13.5,
  },
  submitBtn: {
    padding: '9px 18px',
    borderRadius: '6px',
    border: 'none',
    background: colors.emerald,
    color: 'var(--onAccent)',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: 13.5,
  },
};