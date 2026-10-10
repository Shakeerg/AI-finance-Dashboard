const features = [
  {
    title: "Smart SMS parsing",
    desc: "Gemini AI extracts merchant, amount, date and reference number from your bank SMS the moment it arrives.",
  },
  {
    title: "AI categorization",
    desc: "Every transaction is classified into Food, Shopping, Bills, Fuel and more — and low-confidence ones go to a review inbox.",
  },
  {
    title: "Clear analytics",
    desc: "See where your money goes with monthly trends, top merchants and category breakdowns.",
  },
  {
    title: "Budget tracking",
    desc: "Set monthly limits per category and watch your progress before you overspend.",
  },
  {
    title: "Real-time updates",
    desc: "New transactions appear on your dashboard instantly, powered by BullMQ, Redis and live sockets.",
  },
  {
    title: "Privacy first",
    desc: "No bank login required. Your data is isolated per account and processed with full transparency.",
  },
];

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="sec-deco right" aria-hidden="true">
        <span data-parallax="0.14">CAPTURE</span>
      </div>
      <div className="container">
        <p className="eyebrow">Features</p>
        <h2 data-reveal="blur">
          Everything you need to
          <br />
          manage money effortlessly.
        </h2>

        <div className="feature-list">
          {features.map((item, index) => (
            <article
              key={item.title}
              className="feature"
              data-reveal
              style={{ "--d": `${(index % 2) * 0.12}s` }}
            >
              <span className="feature-num">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}