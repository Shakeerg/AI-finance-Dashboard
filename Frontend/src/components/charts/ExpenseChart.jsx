import React from 'react';
import { formatINR0 } from '../../utils/format';

/** Daily spend bars. `data` = [{ key, value, label, title }], oldest first; the last bar (today) is highlighted. */
export default function ExpenseChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="fa-bars" role="img" aria-label="Daily spend over the last days">
        {data.map((d, i) => (
          <div key={d.key} className="fa-bar-col" title={`${d.title}: ${formatINR0(d.value)}`}>
            <div
              className={`fa-bar${i === data.length - 1 ? ' hi' : ''}`}
              style={{ height: `${Math.max(2, Math.round((d.value / max) * 100))}%` }}
            />
          </div>
        ))}
      </div>
      <div className="fa-bar-labels">
        {data.map((d, i) => (
          <span key={d.key}>{i % 2 === 1 || i === data.length - 1 ? d.label : ''}</span>
        ))}
      </div>
    </div>
  );
}