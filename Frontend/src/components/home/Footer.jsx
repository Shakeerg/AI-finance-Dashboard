import { Link } from "react-router-dom";
import { LogoMark } from "./Navbar";

const REPO = "https://github.com/Shakeerg/AI-finance-Dashboard";

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12 .5a11.5 11.5 0 0 0-3.63 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "AI insights", href: "#insights" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Create account", to: "/register" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Built with",
    links: [
      { label: "React & Vite", text: true },
      { label: "Node & MongoDB", text: true },
      { label: "Gemini AI", text: true },
      { label: "Redis & BullMQ", text: true },
    ],
  },
  {
    title: "Project",
    links: [{ label: "GitHub", href: REPO, external: true, icon: <GithubIcon /> }],
  },
];

function FooterLink({ item }) {
  const inner = (
    <>
      {item.icon}
      <span>{item.label}</span>
      {!item.icon && <i aria-hidden="true">→</i>}
    </>
  );
  if (item.text) return <span className="flink plain">{item.label}</span>;
  if (item.to)
    return (
      <Link to={item.to} className="flink">
        {inner}
      </Link>
    );
  return (
    <a
      href={item.href}
      className="flink"
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-line" aria-hidden="true" />

      <div className="container footer-top">
        <div className="footer-about" data-reveal>
          <div className="footer-brand">
            <LogoMark size={30} />
            <span>FINA</span>
          </div>
          <p>AI-powered expense tracking using Gemini AI. Every rupee, understood automatically.</p>
          <small>© 2026 FINA. All rights reserved.</small>
        </div>

        <div className="footer-cols">
          {GROUPS.map((g, i) => (
            <div key={g.title} className="footer-col" data-reveal style={{ "--d": `${0.08 + i * 0.1}s` }}>
              <h2 className="footer-title">{g.title}</h2>
              <ul>
                {g.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink item={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="container footer-bottom">
        <small>Made for people who hate manual tracking.</small>
        <a href="#main" className="to-top">
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </div>

      <span className="footer-ghost" aria-hidden="true" data-reveal>
        FINA
      </span>
    </footer>
  );
}