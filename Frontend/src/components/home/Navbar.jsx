import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar" data-aos="fade-down">
      <div className="container nav-inner">

        <Link to="/" className="logo">
          <span className="dot"></span>
          FINA AI
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it Works</a>
          <a href="#insights">AI Insights</a>
        </div>

        <div className="nav-actions">
          <Link to="login" className="login-btn">
            Login
          </Link>

          <Link to="register" className="primary-btn">
            Get Started
          </Link>
        </div>

      </div>
    </nav>
  );
}