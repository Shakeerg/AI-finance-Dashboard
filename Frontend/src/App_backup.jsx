// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { fetchTransactions, processIncomingSMS, deleteTransaction, loginUserApi, registerUserApi } from './services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

function App() {
  // Global Authentication States
  const [token, setToken] = useState(localStorage.getItem('fina_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fina_user')) || null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Auth Form State Fields
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Dashboard Core States
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [smsInput, setSmsInput] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const COLORS = ['#38bdf8', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#64748b'];

  // Replace your loadData function in App.jsx with this:
const loadData = async (tokenOverride = null) => {
  const activeToken = tokenOverride || token;
  if (!activeToken) return; 
  
  try {
    setLoading(true);
    const data = await fetchTransactions();
    setTransactions(data.transactions || []);
    setError(null);
  } catch (err) {
    console.error('Failed to load transactions:', err);
    setError(err.response?.data?.message || err.message || 'Could not establish secure connection.');
    if (err.response?.status === 401) {
      handleLogout();
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleAuthSubmit = async (e) => {
  e.preventDefault();
  try {
    let data;
    if (isRegistering) {
      data = await registerUserApi(authName, authEmail, authPassword);
    } else {
      data = await loginUserApi(authEmail, authPassword);
    }
    
    localStorage.setItem('fina_token', data.token);
    localStorage.setItem('fina_user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
    
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');

    // 🔥 Force a clean read with the fresh token immediately
    await loadData(data.token);
  } catch (err) {
    alert('Authentication Failed: ' + (err.response?.data?.message || err.message));
  }
};

  const handleLogout = () => {
    localStorage.removeItem('fina_token');
    localStorage.removeItem('fina_user');
    setToken(null);
    setUser(null);
    setTransactions([]);
  };

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

      // 🔄 Sequential Queue: Process each SMS line one after the other
      for (const line of smsLines) {
        try {
          await processIncomingSMS(line);
          // Optional: Add a minor 200ms delay if your rate limits are extremely strict
          await new Promise(resolve => setTimeout(resolve, 200)); 
        } catch (singleLineErr) {
          console.error(`Failed to parse line: "${line}"`, singleLineErr);
          // Keep looping so one broken SMS line doesn't crash the entire batch run
        }
      }
      
      setSmsInput('');
      await loadData();
    } catch (err) {
      alert('AI Batch Ingestion Error: ' + (err.response?.data?.message || err.message));
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
      
      // Accumulate the volume so the PieChart has a valid metric key to compute slices
      categories[cat].value += amount;
    });
    
    // Sort array based on the total value size
    return Object.values(categories).sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();

  // 🚪 GATEWAY: If user doesn't have a token, lock app behind Auth View panel
  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif', color: '#e2e8f0' }}>
        <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}>
          <h2 style={{ textAlign: 'center', marginTop: 0, color: '#f8fafc', fontSize: '1.8rem', marginBottom: '8px' }}>FINA Intelligence</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '30px' }}>{isRegistering ? 'Create your secure account profile' : 'Sign in to access your financial grid'}</p>
          
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegistering && (
              <input
                type="text" placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} required
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.95rem' }}
              />
            )}
            <input
              type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.95rem' }}
            />
            <input
              type="password" placeholder="Password (Min 6 Characters)" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} minLength={6} required
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.95rem' }}
            />
            
            <button type="submit" style={{ padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}>
              {isRegistering ? 'Register & Open Console' : 'Sign In To Gateway'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
            {isRegistering ? 'Already tracking logs?' : 'New to FINA?'} {' '}
            <span onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#38bdf8', cursor: 'pointer', fontWeight: '600' }}>
              {isRegistering ? 'Sign In here' : 'Create an account'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // 📈 MAIN APPLICATION VIEW (Rendered only if logged in successfully)
  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', color: '#e2e8f0', backgroundColor: '#0f172a', minHeight: '100vh' }}>
      
      {/* App Header Block */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', margin: '0 0 6px 0', color: '#f8fafc' }}>FINA: AI Financial Intelligence</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            User Workspace: <strong style={{ color: '#38bdf8' }}>{user?.name}</strong> | Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Authenticated</span>
          </p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s' }} onMouseEnter={(e) => {e.target.style.backgroundColor='#ef4444'; e.target.style.color='#fff'}} onMouseLeave={(e) => {e.target.style.backgroundColor='transparent'; e.target.style.color='#ef4444'}}>
          Disconnect Console
        </button>
      </header>
      {/* 📊 FINANCIAL METRICS BANNER CARD ROW */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
  
  {/* Total Inflow Card */}
  <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #34d399', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Total Inflow (Income)</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#34d399', marginTop: '6px' }}>
      INR {transactions.filter(tx => tx.type === 'credit').reduce((acc, tx) => acc + (tx.amount || 0), 0).toLocaleString('en-IN')}
    </div>
  </div>

  {/* Total Outflow Card */}
  <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f87171', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Total Outflow (Expenses)</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f87171', marginTop: '6px' }}>
      INR {transactions.filter(tx => tx.type === 'debit').reduce((acc, tx) => acc + (tx.amount || 0), 0).toLocaleString('en-IN')}
    </div>
  </div>

  {/* Net Savings/Balance Card */}
  {(() => {
    const inflow = transactions.filter(tx => tx.type === 'credit').reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const outflow = transactions.filter(tx => tx.type === 'debit').reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const net = inflow - outflow;
    return (
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${net >= 0 ? '#38bdf8' : '#e11d48'}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Net Cash Balance</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: net >= 0 ? '#38bdf8' : '#e11d48', marginTop: '6px' }}>
          INR {net.toLocaleString('en-IN')}
        </div>
      </div>
    );
  })()}
</div>
      {/* Visual Analytics Dashboard Section */}
      {!loading && chartData.length > 0 && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#f1f5f9' }}>Spending Overview by Category</h4>
            <div style={{ width: '100%', height: 220 }}>
              {/* Replace the old BarChart section inside your JSX with this: */}
<ResponsiveContainer>
<BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }} />
  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
  <Bar dataKey="Income" fill="#34d399" stackId="fina_stack" />
  <Bar dataKey="Expense" fill="#f87171" stackId="fina_stack" />
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

      {/* Simulator Panel */}
      <section style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Simulate Incoming Bank SMS Alert</h3>
        <form onSubmit={handleSmsSubmit}>
          <textarea
            value={smsInput}
            onChange={(e) => setSmsInput(e.target.value)}
            placeholder="Paste raw text message here..." rows="3"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button
            type="submit" disabled={ingesting || !smsInput.trim()}
            style={{ marginTop: '12px', width: '100%', padding: '10px', backgroundColor: ingesting ? '#475569' : '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: smsInput.trim() && !ingesting ? 'pointer' : 'not-allowed' }}
          >
            {ingesting ? 'Gemini AI parsing text...' : 'Send to AI Parser Engine'}
          </button>
        </form>
      </section>

      <hr style={{ border: 'none', height: '1px', backgroundColor: '#334155', margin: '30px 0' }} />

      {/* Live Logs List View */}
      {/* Live Logs List View */}
      <section>
        <h3 style={{ color: '#f1f5f9' }}>Live Transaction Log ({transactions.length})</h3>

        {loading && <p style={{ color: '#94a3b8' }}>Querying secure user records...</p>}
        {error && <div style={{ color: '#ef4444', padding: '12px', background: '#451a03', borderRadius: '6px' }}>⚠️ Error: {error}</div>}

        {!loading && !error && (
          transactions.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No entries logged to your account. Ingest your first bank alert above!</p>
          ) : (
            /* Fixed: Combined scroll container wrapping the active map array cleanly */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
              {transactions.map((tx) => (
                <div key={tx._id} style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{tx.merchant || 'Unknown Merchant'}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                      <span style={{ background: '#334155', color: '#f8fafc', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginRight: '8px', fontWeight: '600' }}>
                        {tx.bank || 'Unknown Bank'}
                      </span>
                      Category: <em style={{ color: '#38bdf8' }}>{tx.category || 'Uncategorized'}</em> | {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: tx.type === 'credit' ? '#34d399' : '#f87171' }}>
                      {tx.type === 'credit' ? '+' : '-'} {tx.currency || 'INR'} {tx.amount}
                    </div>

                    <button
                      onClick={() => handleDelete(tx._id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '6px 8px', borderRadius: '4px' }}
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