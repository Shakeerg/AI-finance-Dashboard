export default function Features() {

  const features = [
    {
      icon: "📩",
      title: "Smart SMS Parsing",
      desc: "Gemini AI automatically extracts merchant, amount, date and category from your bank SMS."
    },
    {
      icon: "🧠",
      title: "AI Categorization",
      desc: "Every transaction is intelligently classified into Food, Shopping, Bills, Fuel and more."
    },
    {
      icon: "📊",
      title: "Beautiful Analytics",
      desc: "Understand where your money goes with modern charts and monthly insights."
    },
    {
      icon: "🎯",
      title: "Budget Tracking",
      desc: "Set monthly budgets and receive alerts before overspending."
    },
    {
      icon: "⚡",
      title: "Real-time Updates",
      desc: "Every new SMS instantly updates your dashboard using BullMQ and Redis."
    },
    {
      icon: "🔒",
      title: "Privacy First",
      desc: "No bank login required. Your SMS is processed securely with complete transparency."
    }
  ];

  return (
    <section id="features" className="section">
      <div className="container">

        <p className="eyebrow">
          FEATURES
        </p>

        <h2>
          Everything you need to manage money effortlessly.
        </h2>

        <div className="feature-grid">

          {features.map((item, index) => (
            <div
              key={index} /* 👈 Added the unique key prop here to fix the console warning */
              className="feature-card"
              data-aos="fade-up"
              data-aos-delay={index * 120}
            >
              <div className="feature-icon">
                {item.icon}
              </div>

              <h3>
                {item.title}
              </h3>

              <p>
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}