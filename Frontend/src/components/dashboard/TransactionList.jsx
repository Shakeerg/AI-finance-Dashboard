import React, { useState, useMemo } from 'react';

const CATEGORIES = [
  "All",
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
  paperRaised: '#FBF8F1',
  paperGlass: 'rgba(251,248,241,0.6)',
  ink: '#1C1B17',
  inkSoft: '#5B584E',
  rule: '#DCD5C4',
  emerald: '#1F5D45',
  emeraldSoft: '#E6EEE7',
  red: '#9A3B2E',
  redSoft: '#F5E6E2',
};

const fonts = {
  serif: "'Fraunces', Georgia, serif",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

const glassCard = {
  background: colors.paperGlass,
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.5)',
  borderRadius: '12px',
  boxShadow: '0 16px 34px -20px rgba(28,27,23,0.25), inset 0 1px 0 rgba(255,255,255,0.55)',
};

export default function TransactionList({ transactions = [], loading, error, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter transactions based on search query and category
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        tx.merchant?.toLowerCase().includes(term) ||
        tx.bank?.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, selectedCategory]);

  return (
    <section>
      <div style={styles.headerRow}>
        <h3 style={styles.logTitle}>
          Transaction log ({filteredTransactions.length}
          {filteredTransactions.length !== transactions.length ? ` / ${transactions.length}` : ''})
        </h3>
      </div>

      {/* Search & Category Filter Bar */}
      <div style={styles.filterContainer}>
        <input
          type="text"
          placeholder="Search merchant or bank..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
          onFocus={(e) => (e.target.style.borderColor = colors.emerald)}
          onBlur={(e) => (e.target.style.borderColor = colors.rule)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.selectInput}
          onFocus={(e) => (e.target.style.borderColor = colors.emerald)}
          onBlur={(e) => (e.target.style.borderColor = colors.rule)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: colors.inkSoft, fontSize: 14.5 }}>Loading your records…</p>}

      {error && (
        <div style={{ ...glassCard, color: colors.red, padding: '14px 16px', borderColor: colors.red }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        filteredTransactions.length === 0 ? (
          <div style={{ ...glassCard, textAlign: 'center', padding: '32px', color: colors.inkSoft, fontSize: 14.5 }}>
            {transactions.length === 0
              ? 'No transactions yet. Paste your first bank SMS above to get started.'
              : 'No transactions match your search filter criteria.'}
          </div>
        ) : (
          <div style={styles.txList}>
            {filteredTransactions.map((tx) => (
              <div key={tx._id} style={{ ...glassCard, ...styles.txRow }}>
                <div>
                  <div style={styles.txMerchant}>{tx.merchant || 'Unknown Merchant'}</div>
                  <div style={styles.txMeta}>
                    <span style={styles.txBankTag}>{tx.bank || 'Unknown Bank'}</span>
                    <span style={{ color: colors.emerald, fontWeight: 500 }}>{tx.category || 'Uncategorized'}</span>
                    {' · '}
                    {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ ...styles.txAmount, color: tx.type === 'credit' ? colors.emerald : colors.red }}>
                    {tx.type === 'credit' ? '+' : '−'} {tx.currency || 'INR'} {tx.amount}
                  </div>
                  <button
                    onClick={() => onDelete(tx._id)}
                    style={styles.deleteBtn}
                    onMouseEnter={(e) => (e.currentTarget.style.background = colors.redSoft)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    title="Delete record"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
}

const styles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logTitle: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 19, margin: 0 },
  filterContainer: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 2,
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid ${colors.rule}`,
    background: colors.paperRaised,
    color: colors.ink,
    fontSize: 13,
    fontFamily: fonts.sans,
    outline: 'none',
    transition: 'border-color .15s',
  },
  selectInput: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${colors.rule}`,
    background: colors.paperRaised,
    color: colors.ink,
    fontSize: 13,
    fontFamily: fonts.sans,
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color .15s',
  },
  txList: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 },
  txRow: { padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  txMerchant: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 16.5 },
  txMeta: { color: colors.inkSoft, fontSize: 12.5, marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  txBankTag: {
    background: colors.emeraldSoft,
    color: colors.emerald,
    padding: '2px 7px',
    borderRadius: 4,
    fontSize: 10.5,
    fontFamily: fonts.mono,
    fontWeight: 600,
  },
  txAmount: { fontFamily: fonts.mono, fontSize: 16, fontWeight: 500 },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: colors.red,
    cursor: 'pointer',
    fontSize: 15,
    padding: '6px 8px',
    borderRadius: 4,
    transition: 'background .15s',
  },
};