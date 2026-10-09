import React from 'react';
import { formatINR0 } from '../../utils/format';

/** Income vs spending per month. `data` = [{ key, label, income, expense }], oldest first. */
export default function MonthlyChart({ data = [] }) {
  const max = Math.max(1, ...data.map((m) => Math.max(m.income, m.expense)));
  return (
    <div>
      <div className="fa-bars tall" role="img" aria-label="Income and spending by month">
        {data.map((m) => (
          <div
            key={m.key}
            className="fa-bar-col"
            title={`${m.label} · in ${formatINR0(m.income)} · out ${formatINR0(m.expense)}`}
          >
            <div className="fa-bar income" style={{ height: `${Math.round((m.income / max) * 100)}%` }} />
            <div className="fa-bar expense" style={{ height: `${Math.round((m.expense / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="fa-bar-labels wide">
        {data.map((m) => (
          <span key={m.key}>{m.label}</span>
        ))}
      </div>
    </div>
  );
}