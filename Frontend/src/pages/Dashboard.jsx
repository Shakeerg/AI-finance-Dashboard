import React, { useState, useEffect } from 'react';
import { 
  fetchTransactions, 
  processIncomingSMS, 
  deleteTransaction, 
  createManualTransaction, 
  updateTransaction 
} from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

// Import Modular Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MetricsCards from '../components/dashboard/MetricsCards';
import SmsSimulator from '../components/dashboard/SmsSimulator';
import TransactionList from '../components/dashboard/TransactionList';
import TransactionModal from '../components/dashboard/TransactionModal';

const colors = {
  paper: '#F5F1E8',
  paperRaised: '#FBF8F1',
  paperGlass: 'rgba(251,248,241,0.7)',
  ink: '#1C1B17',
  inkSoft: '#5B584E',
  rule: '#DCD5C4',
  emerald: '#1F5D45',
  amber: '#B5772C',
  red: '#9A3B2E',
};

const fonts = {
  serif: "'Fraunces', Georgia, serif",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
};

const glassCard = {
  background: colors.paperGlass,
  backdropFilter: 'blur(16px) saturate(140%)',
  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: '14px',
  boxShadow: '0 12px 30px -15px rgba(28,27,23,0.15)',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [smsInput, setSmsInput] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Inject Web Fonts dynamically
  useEffect(() => {
    const id = 'fina-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const loadData = async (start = startDate, end = endDate) => {
    try {
      setLoading(true);
      const data = await fetchTransactions(1, 100, start || null, end || null);
      setTransactions(data.transactions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err.response?.data?.message || err.message || 'Could not establish connection.');
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Handlers
  const handleApplyFilter = (e) => {
    e.preventDefault();
    loadData(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    loadData('', '');
  };

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingTx(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx._id, formData);
      } else {
        await createManualTransaction(formData);
      }
      setIsModalOpen(false);
      await loadData(); // Keeps list and date range filters strictly synchronized
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      alert('Could not remove entry: ' + (err.response?.data?.message || err.message));
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

      for (const line of smsLines) {
        try {
          await processIncomingSMS(line);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Failed to parse: "${line}"`, err);
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
      if (!categories[cat]) categories[cat] = { name: cat, Expense: 0, value: 0 };
      
      if (tx.type !== 'credit') {
        categories[cat].Expense += amount;
        categories[cat].value += amount;
      }
    });
    return Object.values(categories).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
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

        {/* Dashboard Header */}
        <DashboardHeader user={user} onLogout={logout} />

        {/* Action Toolbar: Manual Creation & Date Range Filters */}
        <div style={styles.actionToolbar}>
          <button style={styles.addBtn} onClick={handleOpenCreateModal}>
            + Add Manual Entry
          </button>

          <form onSubmit={handleApplyFilter} style={styles.filterForm}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.dateInput}
              aria-label="Start Date"
            />
            <span style={styles.dateSeparator}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.dateInput}
              aria-label="End Date"
            />
            <button type="submit" style={styles.filterBtn}>
              Filter
            </button>
            {(startDate || endDate) && (
              <button type="button" onClick={handleClearFilter} style={styles.clearBtn}>
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Summary Metrics */}
        <MetricsCards inflow={inflow} outflow={outflow} net={net} />

        {/* Main 2-Column Grid Layout */}
        <div style={styles.mainGrid}>
          
          {/* Left Column: SMS Ingestion & Analytics */}
          <div style={styles.leftCol}>
            
            <SmsSimulator
              smsInput={smsInput}
              setSmsInput={setSmsInput}
              onSmsSubmit={handleSmsSubmit}
              ingesting={ingesting}
            />

            {!loading && chartData.length > 0 && (
              <div style={{ ...glassCard, ...styles.chartSection }}>
                <h4 style={styles.cardTitle}>Expense Breakdown</h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke={colors.inkSoft} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={colors.inkSoft} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.paperRaised,
                          border: `1px solid ${colors.rule}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: fonts.sans,
                        }}
                      />
                      <Bar dataKey="Expense" fill={colors.amber} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Transaction Log */}
          <div style={styles.rightCol}>
            <TransactionList
              transactions={transactions}
              loading={loading}
              error={error}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          </div>

        </div>
      </div>

      {/* Manual Entry & Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingTx}
        loading={modalLoading}
      />
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
    overflowX: 'hidden',
  },
  glow1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(31,93,69,0.12), transparent 70%)',
    filter: 'blur(90px)', top: -180, right: -100, pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(181,119,44,0.1), transparent 70%)',
    filter: 'blur(90px)', bottom: -160, left: -100, pointerEvents: 'none',
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 24px 80px',
  },
  actionToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  addBtn: {
    background: colors.emerald,
    color: '#FFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontFamily: fonts.sans,
    fontSize: 13.5,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(31,93,69,0.25)',
  },
  filterForm: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateInput: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: `1px solid ${colors.rule}`,
    background: colors.paperRaised,
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.ink,
    outline: 'none',
  },
  dateSeparator: {
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  filterBtn: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: `1px solid ${colors.rule}`,
    background: colors.paperGlass,
    color: colors.ink,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: colors.red,
    fontSize: 13,
    cursor: 'pointer',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  chartSection: {
    padding: '20px 22px',
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontWeight: 500,
    fontSize: 17,
    margin: '0 0 16px 0',
    color: colors.ink,
  },
};