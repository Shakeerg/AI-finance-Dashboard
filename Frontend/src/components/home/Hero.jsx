import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <header className="hero">
      
      {/* Background Glow */}
      <div className="hero-glow glow1"></div>
      <div className="hero-glow glow2"></div>

      <div className="container hero-grid">

        {/* LEFT */}

        <div className="hero-left" data-aos="fade-right">

          <p className="eyebrow">
            AI Powered Personal Finance
          </p>

          <h1>
            Every Rupee.
            <br />
            <span>Automatically Understood.</span>
          </h1>

          <p className="hero-text">
            FINA AI reads your bank SMS,
            extracts transactions using Gemini AI,
            categorizes every expense,
            and generates beautiful insights—
            without manual tracking.
          </p>

          <div className="hero-buttons">

            <Link
              to="/register"
              className="primary-btn"
            >
              Start Free →
            </Link>

            <a
              href="#how"
              className="secondary-btn"
            >
              Watch Demo
            </a>

          </div>

          <p className="hero-note">
            ✓ No Bank Login &nbsp;&nbsp; • &nbsp;&nbsp;
            ✓ Secure &nbsp;&nbsp; • &nbsp;&nbsp;
            ✓ AI Powered
          </p>

        </div>

        {/* RIGHT */}

        <div className="hero-right" data-aos="fade-left">

<div className="dashboard-card">

<div className="dashboard-top">

<p>Monthly Spending</p>

<h2>₹18,430</h2>

<div className="mini-chart">
<div className="bar h1"></div>
<div className="bar h2"></div>
<div className="bar h3"></div>
<div className="bar h4"></div>
<div className="bar h5"></div>
<div className="bar h6"></div>
</div>

</div>

<div className="categories">

<div className="row">
<span>Food</span>
<span>₹4,300</span>
</div>

<div className="row">
<span>Shopping</span>
<span>₹2,100</span>
</div>

<div className="row">
<span>Bills</span>
<span>₹3,700</span>
</div>

<div className="row">
<span>Fuel</span>
<span>₹1,400</span>
</div>

</div>

<div className="ai-tip">

<h4>Gemini Insight</h4>

<p>
You spent <strong>18%</strong> more on food this month.
Ordering twice less every week can save around
<strong> ₹2,000.</strong>
</p>

</div>

</div>

</div>

      </div>

    </header>
  );
}