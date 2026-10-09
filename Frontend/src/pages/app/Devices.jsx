import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionsContext';
import DeviceKeyCard from '../../components/dashboard/DeviceKeyCard';
import SmsSimulator from '../../components/dashboard/SmsSimulator';
import { sourceSummary } from '../../utils/analytics';
import { timeAgo } from '../../utils/format';

const STEPS = [
  ['1 · PHONE', 'Bank alert arrives', 'The FINA app reads only bank and UPI notifications.'],
  ['2 · SERVER', 'Filter & queue', 'OTPs and offers are dropped. Retries never double-count.'],
  ['3 · AI', 'Understand it', 'Amount, merchant, category and a confidence score.'],
  ['4 · DASHBOARD', 'Appears live', 'Unsure items go to your review inbox.'],
];

export default function Devices() {
  const { txns, ingest } = useTransactions();
  const [smsInput, setSmsInput] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState(null);

  const onSms = async (e) => {
    e.preventDefault();
    if (!smsInput.trim()) return;
    setIngesting(true);
    setResult(null);
    const { queued, ignored, failed } = await ingest(smsInput);

    const parts = [];
    if (queued) parts.push(`${queued} sent to the AI parser. Results appear in a moment.`);
    if (ignored) parts.push(`${ignored} ignored (not a bank transaction alert: OTP, offer or chat).`);
    if (failed) parts.push(`${failed} failed to send.`);
    setResult({ type: failed ? 'error' : ignored && !queued ? 'warn' : 'success', text: parts.join(' ') });

    if (!failed) setSmsInput('');
    setIngesting(false);
  };

  const sources = sourceSummary(txns);

  return (
    <>
      <section className="fa-card">
        <div className="fa-card-head"><h2>How FINA gets your transactions</h2></div>
        <div className="fa-flow">
          {STEPS.flatMap(([k, t, d], i) => [
            <div key={k} className="fa-step">
              <div className="k">{k}</div>
              <div className="t">{t}</div>
              <div className="d">{d}</div>
            </div>,
            i < STEPS.length - 1 ? <div key={`a${i}`} className="fa-arrow" aria-hidden="true">→</div> : null,
          ])}
        </div>
      </section>

      <div className="fa-grid2">
        <DeviceKeyCard />

        <section className="fa-card">
          <div className="fa-card-head"><h2>Sources seen</h2></div>
          <p className="fa-note" style={{ marginBottom: 8 }}>
            Which apps your transactions came from. Two apps reporting the same payment get flagged.
          </p>
          {sources.length === 0 && <p className="fa-muted">Nothing yet.</p>}
          {sources.map((s) => (
            <div key={s.name} className="fa-list-row">
              <div className="main">
                <div className="t">{s.name}</div>
                <div className="s">Last seen {timeAgo(s.last)}</div>
              </div>
              <div className="fa-amt">{s.count}</div>
            </div>
          ))}
        </section>
      </div>

      <SmsSimulator
        smsInput={smsInput}
        setSmsInput={setSmsInput}
        onSmsSubmit={onSms}
        ingesting={ingesting}
        result={result}
      />
    </>
  );
}