const tech = ["React", "Node.js", "Express", "MongoDB", "Gemini AI", "Redis", "BullMQ", "Socket.io"];

export default function TechStrip() {
  return (
    <section className="tech-strip" aria-label="Built with">
      <div className="marquee">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="marquee-set" aria-hidden={copy === 1 ? "true" : undefined}>
              {tech.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <i aria-hidden="true">✦</i>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}