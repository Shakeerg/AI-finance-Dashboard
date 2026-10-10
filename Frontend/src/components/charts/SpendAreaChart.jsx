import React, { useEffect, useRef, useState } from 'react';
import { formatINR0 } from '../../utils/format';

const H = 250;
const PAD = { top: 14, right: 12, bottom: 28, left: 54 };

const niceMax = (v) => {
  if (v <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(v));
  const f = v / pow;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return step * pow;
};

const short = (n) => (n >= 100000 ? `${+(n / 100000).toFixed(1)}L` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(Math.round(n)));

/** Smooth area chart of daily spend. `data` = [{ key, value, label, title }], oldest first. */
export default function SpendAreaChart({ data = [] }) {
  const wrap = useRef(null);
  const [w, setW] = useState(720);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const measure = () => setW(Math.max(280, el.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const iw = w - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => PAD.top + ih - (v / top) * ih;
  const pts = data.map((d, i) => [x(i), y(d.value)]);

  let line = '';
  if (n) {
    line = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < n; i += 1) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      line += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
    }
  }
  const base = PAD.top + ih;
  const area = n ? `${line} L${pts[n - 1][0]} ${base} L${pts[0][0]} ${base} Z` : '';
  const ticks = [0, 1, 2, 3, 4].map((k) => (top / 4) * k);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));

  const pick = (clientX) => {
    const r = wrap.current.getBoundingClientRect();
    const px = clientX - r.left;
    const i = Math.round(((px - PAD.left) / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setHover((h) => Math.min(n - 1, (h ?? -1) + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, (h ?? n) - 1)); }
    if (e.key === 'Escape') setHover(null);
  };
  const hv = hover !== null ? data[hover] : null;

  return (
    <div
      className="fa-area"
      ref={wrap}
      tabIndex={0}
      role="img"
      aria-label={`Daily spend, ${n} days. Use the arrow keys to read each day.`}
      onMouseMove={(e) => pick(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onBlur={() => setHover(null)}
      onKeyDown={onKey}
    >
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`}>
        <defs>
          <linearGradient id="faAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="axis" x={PAD.left - 10} y={y(t) + 4} textAnchor="end">₹{short(t)}</text>
          </g>
        ))}
        {data.map((d, i) => ((n - 1 - i) % every === 0) && (
          <text key={d.key} className="axis" x={x(i)} y={H - 8} textAnchor="middle">{d.title}</text>
        ))}
        {n > 0 && <path className="area" d={area} fill="url(#faAreaFill)" />}
        {n > 0 && <path className="stroke" d={line} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />}
        {hv && (
          <g>
            <line className="cursor" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={base} />
            <circle className="dot" cx={x(hover)} cy={y(hv.value)} r="5" />
          </g>
        )}
      </svg>
      {hv && (
        <div className="fa-tip" style={{ left: Math.min(w - 150, Math.max(4, x(hover) - 70)), top: Math.max(0, y(hv.value) - 62) }}>
          <span>{hv.title}</span>
          <strong>{formatINR0(hv.value)}</strong>
        </div>
      )}
    </div>
  );
}