export default function HowItWorks() {

  const steps = [
    {
      icon: "📩",
      title: "Receive SMS",
      text: "Whenever your bank sends an SMS after a transaction."
    },
    {
      icon: "🧠",
      title: "Gemini AI",
      text: "AI extracts merchant, amount, date and category."
    },
    {
      icon: "💾",
      title: "Store Securely",
      text: "Transactions are saved safely inside MongoDB."
    },
    {
      icon: "📊",
      title: "Visual Dashboard",
      text: "Beautiful analytics and insights are generated instantly."
    }
  ];

  return (

    <section
      id="how"
      className="section"
    >

      <div className="container">

        <p className="eyebrow">
          HOW IT WORKS
        </p>

        <h2>
          Four simple steps.
          <br />
          Zero manual tracking.
        </h2>

        <div className="timeline">

          {steps.map((step, index) => (
            <div
              className="timeline-card"
              key={index}
              data-aos="zoom-in"
              data-aos-delay={index * 150}
            >

              <div className="timeline-icon">
                {step.icon}
              </div>

              <h3>{step.title}</h3>

              <p>{step.text}</p>

            </div>

          ))}

        </div>

      </div>

    </section>

  );

}