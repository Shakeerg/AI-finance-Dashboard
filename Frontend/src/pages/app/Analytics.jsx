import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionsContext';
import Icon from '../../components/ui/Icon';
import MonthlyChart from '../../components/charts/MonthlyChart';
import WeekdayChart from '../../components/charts/WeekdayChart';
import { downloadCsv } from '../../utils/csv';
import { countedOnly, monthlySeries, topMerchants, weekdayTotals } from '../../utils/analytics';
import { formatINR0 } from '../../utils/format';

const RANGES = [3, 6, 12];

export default function Analytics() {
  const { txns, loading, error, notify } = useTransactions();
  const [months, setMonths] = useState(6);

  if (loading) return <p className="fa-muted">Loading your records…</p>;
  if (error) return <div className="fa-error">⚠️ {error}</div>;

  const series = monthlySeries(txns, months);
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const inWindow = countedOnly(txns).filter((t) => new Date(t.createdAt) >= windowStart);

  const income = series.reduce((a, m) => a + m.income, 0);
  const expense = series.reduce((a, m) => a + m.expense, 0);
  const rate = income > 0 ? `${Math.round(((income - expense) / income) * 100)}%` : '—';
  const merchants = topMerchants(inWindow, 5);
  const topValue = merchants.length ? merchants[0].value : 1;

  const exportReport = () => {
    const rows = txns.filter((t) => new Date(t.createdAt) >= windowStart);
    if (!rows.length) return notify('Nothing to export for this period.', 'error');
    downloadCsv('fina-report.csv', rows);
    notify(`Exported ${rows.length} rows.`);
  };

  return (
    <>
      <div className="fa-toolbar">
        <div className="fa-seg" role="group" aria-label="Period">
          {RANGES.map((n) => (
            <button key={n} type="button" className={months === n ? 'on' : ''} onClick={() => setMonths(n)}>
              {n} months
            </button>
          ))}
        </div>
        <button type="button" className="fa-btn" onClick={exportReport}>
          <Icon name="download" size={16} />
          Export report
        </button>
      </div>

      <div className="fa-kpis">
        <div className="fa-kpi">
          <div className="label">Income</div>
          <div className="value pos">{formatINR0(income)}</div>
        </div>
        <div className="fa-kpi">
          <div className="label">Spending</div>
          <div className="value">{formatINR0(expense)}</div>
        </div>
        <div className="fa-kpi">
          <div className="label">Savings rate</div>
          <div className="value">{rate}</div>
        </div>
        <div className="fa-kpi">
          <div className="label">Avg. monthly spend</div>
          <div className="value">{formatINR0(expense / months)}</div>
        </div>
      </div>

      <section className="fa-card">
        <div className="fa-card-head">
          <h2>Income vs spending</h2>
          <div className="fa-legend">
            <span><i style={{ background: 'var(--accent)' }} />Income</span>
            <span><i style={{ background: 'var(--barDim)' }} />Spending</span>
          </div>
        </div>
        <MonthlyChart data={series} />
      </section>

      <div className="fa-grid2">
        <section className="fa-card">
          <div className="fa-card-head">
            <h2>Top merchants</h2>
            <span className="hint">Over the selected period</span>
          </div>
          {merchants.length === 0 && <p className="fa-muted">No spending in this period.</p>}
          {merchants.map((m) => (
            <div key={m.name} className="fa-list-row">
              <div className="main">
                <div className="t">{m.name}</div>
                <div className="s">{m.count} payment{m.count === 1 ? '' : 's'}</div>
              </div>
              <div className="fa-track" style={{ width: 90 }}>
                <div style={{ width: `${Math.round((m.value / topValue) * 100)}%` }} />
              </div>
              <div className="fa-amt" style={{ minWidth: 80, textAlign: 'right', fontWeight: 400 }}>{formatINR0(m.value)}</div>
            </div>
          ))}
        </section>

        <section className="fa-card">
          <div className="fa-card-head">
            <h2>Spending by weekday</h2>
            <span className="hint">Total per weekday, selected period</span>
          </div>
          <WeekdayChart data={weekdayTotals(inWindow)} />
        </section>
      </div>
    </>
  );
}