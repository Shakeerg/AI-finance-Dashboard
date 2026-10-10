import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionsContext';
import SpendAreaChart from '../../components/charts/SpendAreaChart';
import Sparkline from '../../components/ui/Sparkline';
import Icon from '../../components/ui/Icon';
import { categoryTotals, countedOnly, dailySpend, inCurrentMonth, sumOf, topMerchants } from '../../utils/analytics';
import { formatINR0, formatMoney, initialOf, timeAgo } from '../../utils/format';
import { isDuplicate, reviewReason } from '../../utils/txFlags';

const DAY = 864e5;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Per-day totals for one transaction type over the last `days` days, oldest first
function dailyBy(txns, type, days) {
  const today = startOfDay(new Date());
  const out = Array(days).fill(0);
  countedOnly(txns).forEach((t) => {
    if (t.type !== type) return;
    const diff = Math.round((today - startOfDay(new Date(t.createdAt))) / DAY);
    if (diff >= 0 && diff < days) out[days - 1 - diff] += Number(t.amount) || 0;
  });
  return out;
}

function inPreviousMonth(list) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 1);
  return list.filter((t) => {
    const d = new Date(t.createdAt);
    return d >= from && d < to;
  });
}

function Delta({ cur, prev, goodWhenUp = true }) {
  if (!prev) return <span className="fa-pill neutral">No earlier month</span>;
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const up = pct >= 0;
  return (
    <span className={`fa-pill ${up === goodWhenUp ? 'good' : 'bad'}`}>
      <Icon name={up ? 'up' : 'down'} size={12} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

const RANGES = [7, 14, 30];
const SPLIT_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

export default function Overview() {
  const navigate = useNavigate();
  const { txns, flagged, loading, error, confirm } = useTransactions();
  const [range, setRange] = useState(14);

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

  const counted = countedOnly(txns);
  const month = inCurrentMonth(counted);
  const prev = inPreviousMonth(counted);
  const inflow = sumOf(month, 'credit');
  const outflow = sumOf(month, 'debit');
  const net = inflow - outflow;
  const prevIn = sumOf(prev, 'credit');
  const prevOut = sumOf(prev, 'debit');
  const prevNet = prevIn - prevOut;
  const kept = inflow > 0 ? `${Math.round((net / inflow) * 100)}% of income kept` : 'No income recorded yet';

  const inSeries = dailyBy(txns, 'credit', 14);
  const outSeries = dailyBy(txns, 'debit', 14);
  const netSeries = inSeries.map((v, i) => v - outSeries[i]);

  const daily = dailySpend(txns, range);
  const total = daily.reduce((a, d) => a + d.value, 0);
  const peakDay = daily.reduce((a, d) => (d.value > a.value ? d : a), daily[0]);
  const monthDebits = month.filter((t) => t.type === 'debit');

  const cats = categoryTotals(month);
  const catSum = cats.reduce((a, c) => a + c.value, 0);
  const topCats = cats.slice(0, 4);
  const restSum = cats.slice(4).reduce((a, c) => a + c.value, 0);
  const split = restSum > 0 ? [...topCats, { name: 'Everything else', value: restSum }] : topCats;
  const merchants = topMerchants(month, 4);
  const flaggedIds = new Set(flagged.map((t) => t._id));
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      {flagged.length > 0 && (
        <section className="fa-alert" aria-label="Items needing review">
          <span className="ico warn"><Icon name="alert" size={18} /></span>
          <div className="txt">
            <strong>{flagged.length} {flagged.length === 1 ? 'transaction needs' : 'transactions need'} a second look</strong>
            <span>The AI wasn’t sure about {flagged.length === 1 ? 'this one' : 'these'}, so {flagged.length === 1 ? 'it isn’t' : 'they aren’t'} counted until you confirm.</span>
          </div>
          <button type="button" className="fa-btn" onClick={() => navigate('/dashboard/review')}>Work the queue</button>
        </section>
      )}

      <div className="fa-kpis">
        <div className="fa-kpi">
          <div className="top"><div className="label">Money in</div><Sparkline values={inSeries} tone="accent" /></div>
          <div className="value">{formatINR0(inflow)}</div>
          <div className="foot"><Delta cur={inflow} prev={prevIn} /><span>{month.filter((t) => t.type === 'credit').length} credits this month</span></div>
        </div>
        <div className="fa-kpi">
          <div className="top"><div className="label">Money out</div><Sparkline values={outSeries} tone="muted" /></div>
          <div className="value">{formatINR0(outflow)}</div>
          <div className="foot"><Delta cur={outflow} prev={prevOut} goodWhenUp={false} /><span>{monthDebits.length} payments this month</span></div>
        </div>
        <div className="fa-kpi">
          <div className="top"><div className="label">Net saved</div><Sparkline values={netSeries} tone="accent" /></div>
          <div className="value">{formatINR0(net)}</div>
          <div className="foot"><Delta cur={net} prev={prevNet} /><span>{kept}</span></div>
        </div>
        <button type="button" className="fa-kpi warn" onClick={() => navigate('/dashboard/review')}>
          <div className="top"><div className="label">Needs review</div></div>
          <div className="value">{flagged.length}</div>
          <div className="foot"><span>{flagged.length ? 'Open the inbox →' : 'All clear'}</span></div>
        </button>
      </div>

      <div className="fa-maingrid">
        <div className="fa-stack">
        <section className="fa-card fa-chartcard">
          <div className="fa-card-head">
            <div>
              <h2>Spending</h2>
              <span className="hint">Daily payments out · hover or use arrow keys on the plot</span>
            </div>
            <div className="fa-seg" role="group" aria-label="Range">
              {RANGES.map((r) => (
                <button key={r} type="button" className={range === r ? 'on' : ''} aria-pressed={range === r} onClick={() => setRange(r)}>
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <SpendAreaChart data={daily} />
          <div className="fa-metrics">
            <div><span>Spent</span><b>{formatINR0(total)}</b><em>last {range} days</em></div>
            <div><span>Average a day</span><b>{formatINR0(total / range)}</b><em>over {range} days</em></div>
            <div><span>Highest day</span><b>{formatINR0(peakDay.value)}</b><em>{peakDay.value ? peakDay.title : 'no spend yet'}</em></div>
            <div><span>Payments</span><b>{monthDebits.length}</b><em>this month</em></div>
          </div>
        </section>

        <section className="fa-card flush">
          <div className="fa-card-head pad">
            <div>
              <h2>Needs your attention</h2>
              <span className="hint">{flagged.length ? `${flagged.length} waiting · not counted yet` : 'Nothing waiting'}</span>
            </div>
            <Link to="/dashboard/review" className="fa-link">Open</Link>
          </div>
          {flagged.length === 0 && <p className="fa-muted pad">All clear. Nothing needs a second look.</p>}
          {flagged.slice(0, 4).map((t) => (
            <div key={t._id} className="fa-qrow">
              <span className={`ico ${isDuplicate(t) ? 'bad' : 'warn'}`}>
                <Icon name={isDuplicate(t) ? 'alert' : 'clock'} size={16} />
              </span>
              <div className="main">
                <div className="t">{t.merchant}</div>
                <div className="s">{isDuplicate(t) ? 'Possible duplicate' : 'Low confidence'} · {reviewReason(t).split('. ')[0]}</div>
              </div>
              <div className="right">
                <div className="fa-amt">{formatMoney(t.amount, t.currency)}</div>
                <button type="button" className="fa-link" onClick={() => confirm(t._id)}>
                  {isDuplicate(t) ? 'Keep it' : 'Looks right'}
                </button>
              </div>
            </div>
          ))}
        </section>

        </div>
        <div className="fa-stack">
          <section className="fa-card">
            <div className="fa-card-head">
              <div>
                <h2>Where it went</h2>
                <span className="hint">This month · {formatINR0(catSum)}</span>
              </div>
            </div>
            {split.length === 0 ? (
              <p className="fa-muted">No spending yet this month.</p>
            ) : (
              <>
                <div className="fa-split" role="img" aria-label="Share of spending by category">
                  {split.map((c, i) => (
                    <i key={c.name} style={{ flexGrow: c.value, background: SPLIT_COLORS[i] }} title={`${c.name}: ${formatINR0(c.value)}`} />
                  ))}
                </div>
                <ul className="fa-legend">
                  {split.map((c, i) => (
                    <li key={c.name}>
                      <i style={{ background: SPLIT_COLORS[i] }} />
                      <span>{c.name}</span>
                      <b>{formatINR0(c.value)}</b>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="fa-card">
            <div className="fa-card-head">
              <div>
                <h2>Top merchants</h2>
                <span className="hint">By spend this month</span>
              </div>
              <Link to="/dashboard/analytics" className="fa-link">Analytics</Link>
            </div>
            {merchants.length === 0 && <p className="fa-muted">Nothing yet.</p>}
            {merchants.map((m) => (
              <div key={m.name} className="fa-list-row">
                <span className="fa-circle">{initialOf(m.name)}</span>
                <div className="main">
                  <div className="t">{m.name}</div>
                  <div className="s">{m.count} {m.count === 1 ? 'payment' : 'payments'}</div>
                </div>
                <div className="fa-amt">{formatINR0(m.value)}</div>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section className="fa-card flush">
          <div className="fa-card-head pad">
            <div>
              <h2>Latest transactions</h2>
              <span className="hint">Live feed · {todayLabel}</span>
            </div>
            <Link to="/dashboard/transactions" className="fa-link">View all</Link>
          </div>
          <div className="fa-lt" role="table" aria-label="Latest transactions">
            <div className="row head" role="row">
              <span role="columnheader">Merchant</span>
              <span role="columnheader" className="hide-sm">Category</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="r">Amount</span>
              <span role="columnheader" className="r hide-sm">Time</span>
            </div>
            {txns.slice(0, 6).map((t) => {
              const dupe = isDuplicate(t);
              const needs = flaggedIds.has(t._id);
              return (
                <div key={t._id} className="row" role="row">
                  <span className="who" role="cell">
                    <span className="fa-circle">{initialOf(t.merchant)}</span>
                    <span className="nm">
                      <b>{t.merchant}</b>
                      <em>{t.sourceApp || (t.source === 'manual' ? 'Manual entry' : t.source === 'simulator' ? 'Test SMS' : 'Phone alert')}</em>
                    </span>
                  </span>
                  <span role="cell" className="hide-sm"><span className="fa-cat">{t.category || 'Uncategorized'}</span></span>
                  <span role="cell">
                    <span className={`fa-status ${dupe ? 'bad' : needs ? 'warn' : 'good'}`}>
                      {dupe ? 'Duplicate' : needs ? 'Review' : t.type === 'credit' ? 'Received' : 'Captured'}
                    </span>
                  </span>
                  <span role="cell" className={`r fa-amt${t.type === 'credit' ? ' credit' : ''}${dupe ? ' dim' : ''}`}>
                    {t.type === 'credit' ? '+ ' : '− '}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                  <span role="cell" className="r hide-sm when">{timeAgo(t.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </section>
    </>
  );
}