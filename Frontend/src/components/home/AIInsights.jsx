const categories = [
  { name: "Food", value: 4300, color: "#c6f432" },
  { name: "Shopping", value: 2100, color: "#8fd14f" },
  { name: "Fuel", value: 1400, color: "#4fbf8a" },
  { name: "Bills", value: 3700, color: "#2f8f7a" },
  { name: "Other", value: 6930, color: "#44524a" },
];

const transactions = [
  { merchant: "Swiggy", amount: "−₹840", category: "Food" },
  { merchant: "Amazon", amount: "−₹1,260", category: "Shopping" },
  { merchant: "Indian Oil", amount: "−₹2,000", category: "Fuel" },
  { merchant: "Electricity", amount: "−₹1,450", category: "Bills" },
];

const total = categories.reduce((s, c) => s + c.value, 0);
const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

let acc = 0;
const stops = categories
  .map((c) => {
    const start = (acc / total) * 100;
    acc += c.value;
    const end = (acc / total) * 100;
    return `${c.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  })
  .join(", ");

export default function AIInsights() {
  return (
    <section id="insights" className="section">
      <div className="sec-deco right" aria-hidden="true">
        <span data-parallax="0.16">INSIGHT</span>
      </div>
      <div className="container">
        <p className="eyebrow">AI insights</p>
        <h2 data-reveal="blur">
          Understand your spending.
          <br />
          Instantly.
        </h2>

        <div className="insight-grid">
          <div className="panel" data-reveal data-tilt>
            <h3>Monthly breakdown</h3>

            <div className="donut-wrap" data-reveal="scale">
              <div className="donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label="Spending split by category" />
              <div className="donut-center">
                <span className="mono-label">This month</span>
                <b data-count={total} data-prefix="₹">{fmt(total)}</b>
              </div>
            </div>

            <ul className="cat-list">
              {categories.map((c, idx) => (
                <li key={c.name}>
                  <span className="cat-name">
                    <i style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="cat-bar">
                    <span style={{ width: `${(c.value / total) * 100}%`, background: c.color, "--i": idx }} />
                  </span>
                  <b data-count={c.value} data-prefix="₹">{fmt(c.value)}</b>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel" data-reveal data-tilt style={{ "--d": "0.15s" }}>
            <h3>Recent transactions</h3>

            <ul className="tx-list">
              {transactions.map((t, idx) => (
                <li key={t.merchant} data-reveal style={{ "--d": `${0.25 + idx * 0.12}s` }}>
                  <div>
                    <strong>{t.merchant}</strong>
                    <span>{t.category}</span>
                  </div>
                  <b>{t.amount}</b>
                </li>
              ))}
            </ul>

            <div className="gemini">
              <span className="mono-label">Gemini recommendation</span>
              <p>
                You spent <b>18%</b> more on food this month. Reducing food delivery twice a week could save
                <b> ₹2,000/month.</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}