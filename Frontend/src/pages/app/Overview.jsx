import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionsContext';
import ExpenseChart from '../../components/charts/ExpenseChart';
import DistributionChart from '../../components/charts/DistributionChart';
import { categoryTotals, countedOnly, dailySpend, inCurrentMonth, sumOf } from '../../utils/analytics';
import { formatDateTime, formatINR0, formatMoney, initialOf } from '../../utils/format';
import { isDuplicate, reviewReason } from '../../utils/txFlags';

export default function Overview() {
  const navigate = useNavigate();
  const { txns, flagged, loading, error, confirm } = useTransactions();

  if (loading) return <p className="fa-muted">Loading your records…</p>;
  if (error) return <div className="fa-error">⚠️ {error}</div>;

  if (txns.length === 0) {
    return (
      <div className="fa-empty">
        <strong>No transactions yet</strong>
        <p>Connect your phone, or paste a test SMS, and your first transaction will appear here.</p>
        <p style={{ marginTop: 14 }}>
          <Link to="/dashboard/devices" className="fa-btn primary" style={{ textDecoration: 'none' }}>
            Connect phone or try a test SMS
          </Link>
        </p>
      </div>
    );
  }

  const month = inCurrentMonth(countedOnly(txns));
  const inflow = sumOf(month, 'credit');
  const outflow = sumOf(month, 'debit');
  const net = inflow - outflow;
  const rate = inflow > 0 ? `${Math.round((net / inflow) * 100)}% of income kept` : 'No income recorded yet';
  const daily = dailySpend(txns, 14);
  const peak = Math.max(0, ...daily.map((d) => d.value));
  const cats = categoryTotals(month);

  return (
    <>
      <div className="fa-kpis">
        <div className="fa-kpi">
          <div className="label">Money in</div>
          <div className="value pos">{formatINR0(inflow)}</div>
          <div className="note">{month.filter((t) => t.type === 'credit').length} credits this month</div>
        </div>
        <div className="fa-kpi">
          <div className="label">Money out</div>
          <div className="value">{formatINR0(outflow)}</div>
          <div className="note">{month.filter((t) => t.type === 'debit').length} payments this month</div>
        </div>
        <div className="fa-kpi">
          <div className="label">Net saved</div>
          <div className="value">{formatINR0(net)}</div>
          <div className="note">{rate}</div>
        </div>
        <button type="button" className="fa-kpi warn" onClick={() => navigate('/dashboard/review')}>
          <div className="label">Needs review</div>
          <div className="value">{flagged.length}</div>
          <div className="note">{flagged.length ? 'Open the inbox →' : 'All clear'}</div>
        </button>
      </div>

      <div className="fa-grid2">
        <div className="fa-stack">
          <section className="fa-card">
            <div className="fa-card-head">
              <h2>Daily spend</h2>
              <span className="hint">Last 14 days · peak {formatINR0(peak)}</span>
            </div>
            <ExpenseChart data={daily} />
          </section>

          <section className="fa-card">
            <div className="fa-card-head">
              <h2>Where it went</h2>
              <span className="hint">This month</span>
            </div>
            <DistributionChart items={cats} />
          </section>
        </div>

        <div className="fa-stack">
          <section className="fa-card">
            <div className="fa-card-head">
              <h2>Needs your attention</h2>
              <Link to="/dashboard/review" className="fa-link">View all</Link>
            </div>
            {flagged.length === 0 && <p className="fa-muted">All clear. Nothing needs a second look.</p>}
            {flagged.slice(0, 3).map((t) => (
              <div key={t._id} className="fa-list-row">
                <div className="main">
                  <div className="t">
                    {t.merchant} <span className="fa-muted" style={{ fontFamily: 'var(--mono)', fontWeight: 400 }}>{formatMoney(t.amount, t.currency)}</span>
                  </div>
                  <div className="s">{isDuplicate(t) ? 'Possible duplicate' : 'Low confidence'} · {reviewReason(t).split('. ')[0]}</div>
                </div>
                <button type="button" className="fa-btn sm accent-outline" onClick={() => confirm(t._id)}>
                  {isDuplicate(t) ? 'Keep it' : 'Looks right'}
                </button>
              </div>
            ))}
          </section>

          <section className="fa-card">
            <div className="fa-card-head">
              <h2>Live activity</h2>
              <Link to="/dashboard/transactions" className="fa-link">All transactions</Link>
            </div>
            {txns.slice(0, 5).map((t) => (
              <div key={t._id} className="fa-list-row">
                <span className="fa-circle">{initialOf(t.merchant)}</span>
                <div className="main">
                  <div className="t">{t.merchant}</div>
                  <div className="s">{formatDateTime(t.createdAt)}{t.sourceApp ? ` · ${t.sourceApp}` : ''}</div>
                </div>
                <div className={`fa-amt${t.type === 'credit' ? ' credit' : ''}${isDuplicate(t) ? ' dim' : ''}`}>
                  {t.type === 'credit' ? '+ ' : '− '}
                  {formatMoney(t.amount, t.currency)}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}