import React from 'react';
import { formatINR0 } from '../../utils/format';

/** Spend per weekday. `data` = [{ label, value }] Monday first; the highest day is highlighted. */
export default function WeekdayChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="fa-bars tall" role="img" aria-label="Spending by weekday">
        {data.map((d) => (
          <div key={d.label} className="fa-bar-col" title={`${d.label}: ${formatINR0(d.value)}`}>
            <div
              className={`fa-bar${d.value === max && d.value > 0 ? ' hi' : ''}`}
              style={{ height: `${Math.max(2, Math.round((d.value / max) * 100))}%` }}
            />
          </div>
        ))}
      </div>
      <div className="fa-bar-labels wide">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}