import React, { useState, useEffect } from 'react';
import { fetchTransactions, processIncomingSMS, deleteTransaction } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

const colors = {
  paper: '#F5F1E8',
  paperRaised: '#FBF8F1',
  paperGlass: 'rgba(251,248,241,0.6)',
  ink: '#1C1B17',
  inkSoft: '#5B584E',
  rule: '#DCD5C4',
  emerald: '#1F5D45',
  emeraldSoft: '#E6EEE7',
  amber: '#B5772C',
  amberSoft: '#F4E9D8',
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

export default function Dashboard() {
  useEffect(() => {
    const id = 'fina-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const { user, logout } = useAuth();
  // Core Local Dashboard States
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [smsInput, setSmsInput] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const CHART_COLORS = [colors.emerald, colors.amber, colors.red, '#4A6FA5', '#7A5C8E', '#6B7A3F', colors.inkSoft];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data.transactions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err.response?.data?.message || err.message || 'Could not establish secure connection.');
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction entry?')) return;
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      alert('Could not remove entry: ' + (err.response?.data?.message || err.message || err));
    }
  };

  const handleSmsSubmit = async (e) => {
    e.preventDefault();
    if (!smsInput.trim()) return;

    try {
      setIngesting(true);
      const smsLines = smsInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (smsLines.length === 0) return;

      // Sequential queue
      for (const line of smsLines) {
        try {
          await processIncomingSMS(line);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (singleLineErr) {
          console.error(`Failed to parse line: "${line}"`, singleLineErr);
        }
      }

      setSmsInput('');
      await loadData();
    } catch (err) {
      alert('AI batch ingestion error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIngesting(false);
    }
  };

  const getChartData = () => {
    const categories = {};
    transactions.forEach((tx) => {
      const cat = tx.category || 'Uncategorized';
      const amount = tx.amount || 0;

      if (!categories[cat]) {
        categories[cat] = { name: cat, Income: 0, Expense: 0, value: 0 };
      }

      if (tx.type === 'credit') {
        categories[cat].Income += amount;
      } else {
        categories[cat].Expense += amount;
      }
      categories[cat].value += amount;
    });
    return Object.values(categories).sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();
  const inflow = transactions.filter(tx => tx.type === 'credit').reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const outflow = transactions.filter(tx => tx.type === 'debit').reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const net = inflow - outflow;

  return (
    <div style={styles.page}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />
      <div style={styles.wrap}>

        {/* Header */}
        <header style={styles.header}>
          <div>
            <div style={styles.brand}><span style={styles.brandDot} />FINA AI</div>
            <p style={styles.headerSub}>
              {user?.name || 'User'} · <span style={{ color: colors.emerald, fontWeight: 600 }}>Connected</span>
            </p>
          </div>
          <button
            onClick={logout}
            style={styles.logoutBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = colors.red; e.currentTarget.style.color = colors.paper; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.red; }}
          >
            Sign out
          </button>
        </header>

        {/* Metrics row */}
        <div style={styles.metricsGrid}>
          <div style={{ ...glassCard, ...styles.metricCard, borderLeft: `3px solid ${colors.emerald}` }}>
            <div style={styles.metricLabel}>Total inflow</div>
            <div style={{ ...styles.metricValue, color: colors.emerald }}>
              ₹{inflow.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ ...glassCard, ...styles.metricCard, borderLeft: `3px solid ${colors.red}` }}>
            <div style={styles.metricLabel}>Total outflow</div>
            <div style={{ ...styles.metricValue, color: colors.red }}>
              ₹{outflow.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ ...glassCard, ...styles.metricCard, borderLeft: `3px solid ${net >= 0 ? colors.emerald : colors.red}` }}>
            <div style={styles.metricLabel}>Net balance</div>
            <div style={{ ...styles.metricValue, color: net >= 0 ? colors.emerald : colors.red }}>
              ₹{net.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Charts */}
        {!loading && chartData.length > 0 && (
          <section style={styles.chartGrid}>
            <div style={{ ...glassCard, ...styles.chartCard }}>
              <h4 style={styles.cardTitle}>Spending by category</h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke={colors.inkSoft} fontSize={11} tickLine={false} />
                    <YAxis stroke={colors.inkSoft} fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: colors.paperRaised, border: `1px solid ${colors.rule}`, borderRadius: '6px', fontFamily: fonts.sans }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontFamily: fonts.sans }} />
                    <Bar dataKey="Income" fill={colors.emerald} stackId="fina_stack" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Expense" fill={colors.red} stackId="fina_stack" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ ...glassCard, ...styles.chartCard }}>
              <h4 style={styles.cardTitle}>Distribution share</h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: colors.paperRaised, border: `1px solid ${colors.rule}`, borderRadius: '6px', fontFamily: fonts.sans }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* SMS simulator */}
        <section style={{ ...glassCard, ...styles.simCard }}>
          <h3 style={styles.simTitle}>Simulate incoming bank SMS</h3>
          <p style={styles.simSub}>Paste one or more raw SMS lines — Gemini will parse each one.</p>
          <form onSubmit={handleSmsSubmit}>
            <textarea
              value={smsInput}
              onChange={(e) => setSmsInput(e.target.value)}
              placeholder="Rs.840.00 debited from A/c XX3321 on 01-Jul-26 at SWIGGY. Avl bal Rs.14,205.10"
              rows="3"
              style={styles.textarea}
              onFocus={(e) => (e.target.style.borderColor = colors.emerald)}
              onBlur={(e) => (e.target.style.borderColor = colors.rule)}
            />
            <button
              type="submit"
              disabled={ingesting || !smsInput.trim()}
              style={{
                ...styles.simButton,
                background: ingesting ? colors.inkSoft : colors.ink,
                cursor: smsInput.trim() && !ingesting ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => { if (!ingesting && smsInput.trim()) e.currentTarget.style.background = colors.emerald; }}
              onMouseLeave={(e) => { if (!ingesting && smsInput.trim()) e.currentTarget.style.background = colors.ink; }}
            >
              {ingesting ? 'Gemini is parsing…' : 'Send to AI parser →'}
            </button>
          </form>
        </section>

        {/* Transaction log */}
        <section>
          <h3 style={styles.logTitle}>Transaction log ({transactions.length})</h3>

          {loading && <p style={{ color: colors.inkSoft, fontSize: 14.5 }}>Loading your records…</p>}
          {error && (
            <div style={{ ...glassCard, color: colors.red, padding: '14px 16px', borderColor: colors.red }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && (
            transactions.length === 0 ? (
              <div style={{ ...glassCard, textAlign: 'center', padding: '32px', color: colors.inkSoft, fontSize: 14.5 }}>
                No transactions yet. Paste your first bank SMS above to get started.
              </div>
            ) : (
              <div style={styles.txList}>
                {transactions.map((tx) => (
                  <div key={tx._id} style={{ ...glassCard, ...styles.txRow }}>
                    <div>
                      <div style={styles.txMerchant}>{tx.merchant || 'Unknown Merchant'}</div>
                      <div style={styles.txMeta}>
                        <span style={styles.txBankTag}>{tx.bank || 'Unknown Bank'}</span>
                        <span style={{ color: colors.emerald }}>{tx.category || 'Uncategorized'}</span>
                        {' · '}
                        {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ ...styles.txAmount, color: tx.type === 'credit' ? colors.emerald : colors.red }}>
                        {tx.type === 'credit' ? '+' : '−'} {tx.currency || 'INR'} {tx.amount}
                      </div>
                      <button
                        onClick={() => handleDelete(tx._id)}
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
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: colors.paper,
    fontFamily: fonts.sans,
    color: colors.ink,
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', width: 480, height: 480, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(31,93,69,0.18), transparent 70%)',
    filter: 'blur(80px)', top: -180, right: -100, pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', width: 380, height: 380, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(181,119,44,0.14), transparent 70%)',
    filter: 'blur(80px)', bottom: -160, left: -100, pointerEvents: 'none',
  },
  wrap: { position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid ${colors.rule}`,
  },
  brand: { fontFamily: fonts.serif, fontWeight: 600, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 },
  brandDot: { width: 7, height: 7, borderRadius: '50%', background: colors.emerald, display: 'inline-block' },
  headerSub: { margin: '8px 0 0 0', color: colors.inkSoft, fontSize: 13.5 },
  logoutBtn: {
    padding: '9px 16px', background: 'transparent', border: `1px solid ${colors.red}`,
    color: colors.red, borderRadius: 6, cursor: 'pointer', fontWeight: 600,
    fontSize: 13, transition: 'all .15s', fontFamily: fonts.sans,
  },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 },
  metricCard: { padding: '20px 22px' },
  metricLabel: { fontFamily: fonts.mono, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.inkSoft },
  metricValue: { fontFamily: fonts.mono, fontSize: 26, fontWeight: 500, marginTop: 8 },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 28 },
  chartCard: { padding: '20px' },
  cardTitle: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 17, margin: '0 0 14px 0' },
  simCard: { padding: '24px', marginBottom: 28 },
  simTitle: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 18, margin: 0 },
  simSub: { color: colors.inkSoft, fontSize: 13.5, margin: '6px 0 16px 0' },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: 6, border: `1px solid ${colors.rule}`,
    background: colors.paperRaised, color: colors.ink, fontSize: 13.5, fontFamily: fonts.mono,
    resize: 'vertical', boxSizing: 'border-box', outline: 'none', transition: 'border-color .15s',
  },
  simButton: {
    marginTop: 12, width: '100%', padding: '12px', color: colors.paper, border: 'none',
    borderRadius: 6, fontWeight: 500, fontSize: 14.5, transition: 'background .15s',
  },
  logTitle: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 19, margin: '0 0 16px 0' },
  txList: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 },
  txRow: { padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  txMerchant: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 16.5 },
  txMeta: { color: colors.inkSoft, fontSize: 12.5, marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' },
  txBankTag: {
    background: colors.emeraldSoft, color: colors.emerald, padding: '2px 7px',
    borderRadius: 4, fontSize: 10.5, fontFamily: fonts.mono, fontWeight: 600,
  },
  txAmount: { fontFamily: fonts.mono, fontSize: 16, fontWeight: 500 },
  deleteBtn: {
    background: 'none', border: 'none', color: colors.red, cursor: 'pointer',
    fontSize: 15, padding: '6px 8px', borderRadius: 4, transition: 'background .15s',
  },
};