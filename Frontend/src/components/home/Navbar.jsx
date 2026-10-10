import { Link } from "react-router-dom";

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="15" fill="#111111" stroke="rgba(255,255,255,.18)" />
      <path d="M19 13h11v38H19z" fill="#ffffff" />
      <path d="M30 13h19l-4 10H30z" fill="#c6f432" />
      <path d="M30 29h14l-3.5 9H30z" fill="#9bd10f" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="logo" aria-label="FINA home">
          <LogoMark />
          <span>FINA</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#insights">Insights</a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="login-btn">
            Login
          </Link>
          <Link to="/register" className="nav-cta">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}