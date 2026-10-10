import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-card" data-reveal="scale">
          <p className="eyebrow">Start today</p>
          <h2>
            Let AI organize
            <br />
            your finances.
          </h2>
          <p className="cta-text">
            Create a free account, connect your phone and watch every payment land on your dashboard — already
            categorized.
          </p>

          <div className="cta-buttons">
            <Link to="/register" className="primary-btn">
              Create free account <span aria-hidden="true">→</span>
            </Link>
            <Link to="/login" className="secondary-btn">
              Login
            </Link>
          </div>

          <dl className="cta-stats">
            <div>
              <dt><span data-count="0.9" data-decimals="1" data-suffix=" s">0.9 s</span></dt>
              <dd>First paint</dd>
            </div>
            <div>
              <dt><span data-count="100">100</span></dt>
              <dd>Best-practices score</dd>
            </div>
            <div>
              <dt>0 ms</dt>
              <dd>Blocking time</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}