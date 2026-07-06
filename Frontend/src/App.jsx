// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { fetchTransactions, processIncomingSMS, deleteTransaction } from './services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [smsInput, setSmsInput] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const COLORS = ['#38bdf8', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#64748b'];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data.transactions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err.message || 'Could not establish server connection.');
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
      alert('Could not remove entry: ' + (err.message || err));
    }
  };

  const handleSmsSubmit = async (e) => {
    e.preventDefault();
    if (!smsInput.trim()) return;

    try {
      setIngesting(true);
      await processIncomingSMS(smsInput);
      setSmsInput('');
      await loadData();
    } catch (err) {
      alert('AI Ingestion Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIngesting(false);
    }
  };

  const getChartData = () => {
    const categories = {};
    transactions.forEach((tx) => {
      const cat = tx.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + (tx.amount || 0);
    });
    return Object.keys(categories)
      .map((key) => ({ name: key, value: categories[key] }))
      .sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();

  return (
    <div
      style={{
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
        color: '#e2e8f0',
        backgroundColor: '#0f172a',
        minHeight: '100vh',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.2rem', lineHeight: '1.3', margin: '0 0 10px 0', color: '#f8fafc' }}>
          FINA: AI Financial Intelligence
        </h1>
        <p style={{ margin: 0, color: '#94a3b8' }}>
          Data Feed Status:{' '}
          <span style={{ color: loading ? '#fbbf24' : '#10b981', fontWeight: 'bold' }}>
            {loading ? 'Connecting...' : 'Active'}
          </span>
        </p>
      </header>

      {!loading && chartData.length > 0 && (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#f1f5f9' }}>Spending Overview by Category</h4>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#f1f5f9' }}>Distribution Share</h4>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      <section style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Simulate Incoming Bank SMS Alert</h3>
        <form onSubmit={handleSmsSubmit}>
          <textarea
            value={smsInput}
            onChange={(e) => setSmsInput(e.target.value)}
            placeholder="Paste raw text message here..."
            rows="3"
            style={{
              width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155',
              backgroundColor: '#0f172a', color: '#fff', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={ingesting || !smsInput.trim()}
            style={{
              marginTop: '12px', width: '100%', padding: '10px',
              backgroundColor: ingesting ? '#475569' : '#2563eb', color: '#fff',
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: smsInput.trim() && !ingesting ? 'pointer' : 'not-allowed'
            }}
          >
            {ingesting ? 'Gemini AI parsing text...' : 'Send to AI Parser Engine'}
          </button>
        </form>
      </section>

      <hr style={{ border: 'none', height: '1px', backgroundColor: '#334155', margin: '30px 0' }} />

      <section>
        <h3 style={{ color: '#f1f5f9' }}>Live Transaction Log ({transactions.length})</h3>

        {loading && <p style={{ color: '#94a3b8' }}>Querying cluster records...</p>}
        {error && <div style={{ color: '#ef4444', padding: '12px', background: '#451a03', borderRadius: '6px' }}>⚠️ Error: {error}</div>}

        {!loading && !error && (
          transactions.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No processed entries found. Ingest your first bank SMS alert above!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {transactions.map((tx) => (
                <div key={tx._id} style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* LEFT CONTENT COLUMN: Merchant info and Bank badges */}
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>
                      {tx.merchant || 'Unknown Merchant'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                      <span style={{ 
                        background: '#334155', 
                        color: '#f8fafc', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        marginRight: '8px',
                        fontWeight: '600'
                      }}>
                        {tx.bank || 'Unknown Bank'}
                      </span>
                      Category: <em style={{ color: '#38bdf8' }}>{tx.category || 'Uncategorized'}</em> | {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>

                  {/* RIGHT ACTION COLUMN: Financial Metrics and Wipers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: tx.type === 'credit' ? '#34d399' : '#f87171' }}>
                      {tx.type === 'credit' ? '+' : '-'} {tx.currency || 'INR'} {tx.amount}
                    </div>

                    <button
                      onClick={() => handleDelete(tx._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        padding: '6px 8px',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#451a03')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      title="Delete Record"
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
  );
}

export default App;