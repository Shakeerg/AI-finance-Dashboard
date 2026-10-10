import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const FEED = [
  { merchant: "Swiggy", amount: "−₹840", cat: "Food" },
  { merchant: "Amazon", amount: "−₹1,260", cat: "Shopping" },
  { merchant: "Indian Oil", amount: "−₹2,000", cat: "Fuel" },
  { merchant: "Electricity", amount: "−₹1,450", cat: "Bills" },
];

const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 2 + (i % 3),
  dur: `${9 + (i % 5) * 2}s`,
  delay: `${-(i % 7)}s`,
}));

const ridge = (ys) =>
  `M0,320 L0,${ys[0]} ` + ys.map((y, i) => `L${Math.round((i / (ys.length - 1)) * 1440)},${y}`).join(" ") + " L1440,320 Z";

const RIDGES = [
  { cls: "r1", d: ridge([150, 118, 170, 88, 140, 66, 128, 98, 158, 108, 150]) },
  { cls: "r2", d: ridge([212, 170, 222, 150, 200, 128, 190, 160, 216, 176, 206]) },
  { cls: "r3", d: ridge([272, 250, 286, 240, 276, 230, 268, 256, 282, 258, 272]) },
];

export default function Hero() {
  const stage = useRef(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % FEED.length), 2800);
    return () => clearInterval(t);
  }, []);

  const onMove = (e) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 18).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const el = stage.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  const live = FEED[i];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <span className="hero-ghost" aria-hidden="true">
        FINA
      </span>

      <div className="ridges" aria-hidden="true">
        {RIDGES.map((r) => (
          <svg key={r.cls} className={`ridge ${r.cls}`} viewBox="0 0 1440 320" preserveAspectRatio="none" focusable="false">
            <path d={r.d} />
          </svg>
        ))}
      </div>

      <div className="dust" aria-hidden="true">
        {DUST.map((d, k) => (
          <i key={k} style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDuration: d.dur, animationDelay: d.delay }} />
        ))}
      </div>

      <div className="hero-meta top rise" style={{ "--d": "0.1s" }}>
        <span className="mono-label">
          <i className="pulse" /> Autonomous finance
        </span>
        <span className="mono-label">01 / Capture</span>
      </div>

      <div className="hero-grid">
        <div className="hero-left">
          <p className="eyebrow rise" style={{ "--d": "0.2s" }}>AI-powered personal finance</p>

          <h1 id="hero-title">
            <span className="line">
              <span className="line-in" style={{ "--d": "0.35s" }}>Every rupee,</span>
            </span>
            <span className="line accent">
              <span className="line-in" style={{ "--d": "0.5s" }}>on autopilot.</span>
            </span>
          </h1>

          <p className="hero-text rise" style={{ "--d": "0.75s" }}>
            FINA reads your bank SMS, extracts every transaction with Gemini AI, categorizes it and turns it into
            insights — without a single manual entry.
          </p>

          <div className="hero-buttons rise" style={{ "--d": "0.9s" }}>
            <Link to="/register" className="primary-btn">
              Start free <span aria-hidden="true">→</span>
            </Link>
            <a href="#how" className="secondary-btn">
              See how it works
            </a>
          </div>

          <p className="hero-note rise" style={{ "--d": "1.05s" }}>
            <span>No bank login</span>
            <span>Private by design</span>
            <span>Live updates</span>
          </p>
        </div>

        <div className="stage" ref={stage} onMouseMove={onMove} onMouseLeave={onLeave}>
          <div className="tilt">
            <div className="orbit o1" aria-hidden="true" />
            <div className="orbit o2" aria-hidden="true" />

            <div className="glass-card">
              <p className="mono-label">Monthly spending</p>
              <div className="big-number" data-count="18430" data-prefix="₹">₹18,430</div>

              <div className="mini-chart" aria-hidden="true">
                <div className="bar h1" />
                <div className="bar h2" />
                <div className="bar h3" />
                <div className="bar h4" />
                <div className="bar h5" />
                <div className="bar h6" />
              </div>

              <ul className="mini-cats">
                <li><span>Food</span><b>₹4,300</b></li>
                <li><span>Shopping</span><b>₹2,100</b></li>
                <li><span>Bills</span><b>₹3,700</b></li>
                <li><span>Fuel</span><b>₹1,400</b></li>
              </ul>
            </div>

            <div className="chip-pos pos-a">
              <div className="chip chip-live" key={i} aria-live="off">
                <span className="mono-label">New SMS · parsed</span>
                <strong>{live.merchant}</strong>
                <span className="chip-row">
                  <em>{live.cat}</em>
                  <b>{live.amount}</b>
                </span>
              </div>
            </div>

            <div className="chip-pos pos-b">
              <div className="chip chip-ai">
                <span className="mono-label">Gemini insight</span>
                <p>
                  Food is up <b>18%</b>. Order twice less a week and save about <b>₹2,000</b>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-meta bottom">
        <span className="mono-label">Scroll ↓</span>
        <span className="mono-label">Drag or hover the card</span>
      </div>
    </section>
  );
}