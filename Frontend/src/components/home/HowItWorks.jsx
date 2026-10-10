import { useEffect, useRef, useState } from "react";

const steps = [
  { tag: "Capture", title: "Receive the SMS", text: "Whenever your bank sends an alert after a transaction, FINA picks it up." },
  { tag: "Understand", title: "Gemini reads it", text: "AI extracts the merchant, amount, date and category — and ignores OTPs and offers." },
  { tag: "Store", title: "Saved securely", text: "Transactions are de-duplicated and stored safely in MongoDB, private to your account." },
  { tag: "See", title: "Live dashboard", text: "Charts, budgets and insights update instantly, with only the unsure items sent for review." },
];

export default function HowItWorks() {
  const refs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.dataset.i));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how" className="section how">
      <div className="sec-deco left" aria-hidden="true">
        <span data-parallax="0.18">FLOW</span>
      </div>
      <div className="container how-grid">
        <div className="how-side">
          <p className="eyebrow">How it works</p>
          <h2 data-reveal="blur">
            Four simple steps.
            <br />
            Zero manual tracking.
          </h2>
          <div className="how-counter" aria-hidden="true">
            <b>{String(active + 1).padStart(2, "0")}</b>
            <span>/ {String(steps.length).padStart(2, "0")}</span>
          </div>
        </div>

        <ol className="stages" style={{ "--prog": (active + 1) / steps.length }}>
          {steps.map((s, i) => (
            <li
              key={s.title}
              ref={(el) => (refs.current[i] = el)}
              data-i={i}
              className={`stage-item${active === i ? " is-active" : ""}`}
            >
              <span className="stage-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <span className="mono-label">Stage {String(i + 1).padStart(2, "0")} · {s.tag}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}