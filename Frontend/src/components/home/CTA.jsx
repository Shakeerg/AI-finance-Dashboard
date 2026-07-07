import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="cta">

      <div className="container">

        <div className="cta-card" data-aos="zoom-in">

          <p className="eyebrow">
            START TODAY
          </p>

          <h2>
            Let AI organize
            <br />
            your finances.
          </h2>

          <p className="cta-text">
            Join thousands of users using AI to automatically
            track expenses, understand spending,
            and save more every month.
          </p>

          <div className="cta-buttons">

            <Link
              to="/register"
              className="primary-btn"
            >
              Create Free Account →
            </Link>

            <Link
              to="/login"
              className="secondary-btn"
            >
              Login
            </Link>

          </div>

          <div className="cta-stats">

            <div>
              <h3>25K+</h3>
              <p>Transactions Processed</p>
            </div>

            <div>
              <h3>98%</h3>
              <p>Extraction Accuracy</p>
            </div>

            <div>
              <h3>24/7</h3>
              <p>AI Monitoring</p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}