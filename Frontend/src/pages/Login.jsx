import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUserApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const colors = {
  paper: '#F5F1E8',
  paperRaised: '#FBF8F1',
  paperGlass: 'rgba(251,248,241,0.6)',
  ink: '#1C1B17',
  inkSoft: '#5B584E',
  rule: '#DCD5C4',
  emerald: '#1F5D45',
  emeraldSoft: '#E6EEE7',
  amber: '#B5772C',
  amberSoft: '#F4E9D8',
  red: '#9A3B2E',
  redSoft: '#F5E6E2',
};

const fonts = {
  serif: "'Fraunces', Georgia, serif",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

const glassCard = {
  background: colors.paperGlass,
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.5)',
  borderRadius: '12px',
  boxShadow: '0 16px 34px -20px rgba(28,27,23,0.25), inset 0 1px 0 rgba(255,255,255,0.55)',
};

export default function Login() {
  useEffect(() => {
    const id = 'fina-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      // 1. Hit the login API endpoint
      const data = await loginUserApi(email, password);

      // 2. Commit token & user profiles to the global AuthContext state
      login(data.token, data.user);

      // 3. Clear fields and route straight past the ProtectedRoute guard
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    } catch (err) {
      alert('Sign in failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={{ ...glassCard, ...styles.card }}>
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          FINA AI
        </div>

        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to see where your money went.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = colors.emerald)}
              onBlur={(e) => (e.target.style.borderColor = colors.rule)}
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = colors.emerald)}
              onBlur={(e) => (e.target.style.borderColor = colors.rule)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              background: loading ? colors.inkSoft : colors.ink,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.emerald; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = colors.ink; }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p style={styles.footerText}>
          New to FINA?{' '}
          <Link to="/register" style={styles.link}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: colors.paper,
    fontFamily: fonts.sans,
    color: colors.ink,
    overflow: 'hidden',
    padding: '24px',
  },
  glow1: {
    position: 'absolute',
    width: 420, height: 420, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(31,93,69,0.22), transparent 70%)',
    filter: 'blur(70px)', top: -140, right: -60, pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: 340, height: 340, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(181,119,44,0.18), transparent 70%)',
    filter: 'blur(70px)', bottom: -140, left: -80, pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 400,
    padding: '40px 36px',
  },
  brand: {
    fontFamily: fonts.serif,
    fontWeight: 600,
    fontSize: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  brandDot: {
    width: 7, height: 7, borderRadius: '50%', background: colors.emerald, display: 'inline-block',
  },
  title: {
    fontFamily: fonts.serif,
    fontWeight: 500,
    fontSize: 28,
    margin: '0 0 6px 0',
  },
  subtitle: {
    color: colors.inkSoft,
    fontSize: 14.5,
    margin: '0 0 28px 0',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  label: {
    display: 'block', fontFamily: fonts.mono, fontSize: 11.5,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    color: colors.inkSoft, marginBottom: 6,
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 6,
    border: `1px solid ${colors.rule}`, background: colors.paperRaised,
    color: colors.ink, fontSize: 14.5, fontFamily: fonts.sans,
    boxSizing: 'border-box', outline: 'none', transition: 'border-color .15s',
  },
  button: {
    marginTop: 6, padding: '13px', color: colors.paper, border: 'none',
    borderRadius: 6, fontWeight: 500, fontSize: 14.5, transition: 'background .15s',
  },
  footerText: {
    textAlign: 'center', marginTop: 24, fontSize: 13.5, color: colors.inkSoft,
  },
  link: { color: colors.emerald, fontWeight: 600, textDecoration: 'none' },
};