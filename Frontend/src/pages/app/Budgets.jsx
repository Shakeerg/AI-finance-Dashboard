import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionsContext';
import useBudgets from '../../hooks/useBudgets';
import { CATEGORIES } from '../../utils/categories';
import { categoryTotals, countedOnly, inCurrentMonth } from '../../utils/analytics';
import { formatINR0 } from '../../utils/format';

const BUDGETABLE = CATEGORIES.filter((c) => c !== 'Uncategorized');

export default function Budgets() {
  const { user } = useAuth();
  const { txns, loading, error, notify } = useTransactions();
  const { budgets, add, adjust, remove, step } = useBudgets(user?.id || user?._id || user?.email);

  const free = BUDGETABLE.filter((c) => !budgets.some((b) => b.category === c));
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('5000');
  const picked = free.includes(category) ? category : free[0] || '';

  if (loading) return <p className="fa-muted">Loading your records…</p>;
  if (error) return <div className="fa-error">⚠️ {error}</div>;

  const spentBy = {};
  categoryTotals(inCurrentMonth(countedOnly(txns))).forEach((c) => { spentBy[c.name] = c.value; });

  const rows = budgets.map((b) => {
    const spent = spentBy[b.category] || 0;
    const pct = Math.round((spent / b.limit) * 100);
    const state = pct >= 100 ? 'over' : pct >= 80 ? 'near' : 'ok';
    return { ...b, spent, pct, state };
  });
  const totalLimit = rows.reduce((a, r) => a + r.limit, 0);
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);

  const onAdd = (e) => {
    e.preventDefault();
    if (!add(picked, limit)) notify('Enter a category and an amount above zero.', 'error');
    else notify(`Budget added for ${picked}.`);
  };

  return (
    <>
      <form className="fa-toolbar" onSubmit={onAdd}>
        <div className="group">
          <label className="fa-field">
            <select value={picked} onChange={(e) => setCategory(e.target.value)} aria-label="Category" disabled={free.length === 0}>
              {free.length === 0 && <option value="">All categories budgeted</option>}
              {free.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="fa-field">
            <span>₹</span>
            <input type="number" min="1" value={limit} onChange={(e) => setLimit(e.target.value)} aria-label="Monthly limit" style={{ minWidth: 0, width: 100 }} />
          </label>
          <button type="submit" className="fa-btn primary" disabled={free.length === 0}>Add budget</button>
        </div>
        <span className="fa-note">Budgets are saved in this browser for now.</span>
      </form>

      {rows.length === 0 ? (
        <div className="fa-empty">
          <strong>No budgets yet</strong>
          Pick a category above and set a monthly limit. FINA tracks this month&apos;s spending against it automatically.
        </div>
      ) : (
        <>
          <div className="fa-kpis">
            <div className="fa-kpi">
              <div className="label">Total budget</div>
              <div className="value">{formatINR0(totalLimit)}</div>
            </div>
            <div className="fa-kpi">
              <div className="label">Spent so far</div>
              <div className="value">{formatINR0(totalSpent)}</div>
            </div>
            <div className="fa-kpi">
              <div className="label">Left this month</div>
              <div className="value pos">{formatINR0(Math.max(0, totalLimit - totalSpent))}</div>
            </div>
          </div>

          <div className="fa-stack">
            {rows.map((r) => (
              <section key={r.category} className="fa-budget">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{r.category}</div>
                  <span className={`fa-status ${r.state}`}>
                    {r.state === 'over' ? 'Over budget' : r.state === 'near' ? 'Near limit' : 'On track'}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 7 }}>
                    <span>{formatINR0(r.spent)}</span>
                    <span className="fa-muted">of {formatINR0(r.limit)}</span>
                  </div>
                  <div className="fa-track thick">
                    <div className={r.state === 'ok' ? '' : r.state} style={{ width: `${Math.min(r.pct, 100)}%` }} />
                  </div>
                  <div className="fa-note" style={{ marginTop: 6 }}>
                    {r.state === 'over'
                      ? `${formatINR0(r.spent - r.limit)} over (${r.pct}%)`
                      : `${formatINR0(r.limit - r.spent)} left (${r.pct}% used)`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" className="fa-iconbtn" onClick={() => adjust(r.category, -1)} aria-label={`Lower ${r.category} limit by ${step}`}>−</button>
                  <button type="button" className="fa-iconbtn" onClick={() => adjust(r.category, 1)} aria-label={`Raise ${r.category} limit by ${step}`}>+</button>
                  <button type="button" className="fa-btn sm danger" onClick={() => remove(r.category)}>Remove</button>
                </div>
              </section>
            ))}
          </div>
          <div className="fa-note">Use − / + to change a limit by ₹{step}. The bar turns amber at 80% and red at 100%.</div>
        </>
      )}
    </>
  );
}