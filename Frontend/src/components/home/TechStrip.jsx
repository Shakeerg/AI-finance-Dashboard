export default function TechStrip() {

  const tech = [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "Gemini AI",
    "Redis",
    "BullMQ"
  ];

  return (
    <section className="tech-strip">
      <div className="container">

        <div className="tech-strip-inner">

          <span className="tech-title">
            BUILT WITH
          </span>

          <div className="tech-list">
            {tech.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}