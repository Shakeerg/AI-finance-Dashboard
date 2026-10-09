import React from 'react';
import { formatINR0 } from '../../utils/format';

/** Horizontal share-of-spend bars. `items` = [{ name, value }] sorted high to low. */
export default function DistributionChart({ items = [], limit = 6 }) {
  const shown = items.slice(0, limit);
  const total = items.reduce((a, c) => a + c.value, 0) || 1;
  const max = shown.length ? shown[0].value : 1;

  if (!shown.length) return <p className="fa-muted">No spending yet this month.</p>;

  return (
    <div>
      {shown.map((c) => (
        <div key={c.name} className="fa-distrow">
          <div className="line">
            <span>{c.name}</span>
            <span className="num">
              {formatINR0(c.value)} <span className="fa-muted">· {Math.round((c.value / total) * 100)}%</span>
            </span>
          </div>
          <div className="fa-track">
            <div style={{ width: `${Math.max(3, Math.round((c.value / max) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}