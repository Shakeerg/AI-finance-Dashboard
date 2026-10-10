import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { loginUserApi, registerUserApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LogoMark } from '../home/Navbar';
import '../../styles/auth.css';

const POINTS = [
  'Only bank and UPI alerts are sent. OTPs and offers are dropped.',
  'Duplicates across apps are caught before they reach your totals.',
  'Unsure items wait in a review inbox instead of being guessed.',
];

const DUST = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 41 + 9) % 100}%`,
  top: `${(i * 57 + 13) % 100}%`,
  size: 2 + (i % 3),
  dur: `${9 + (i % 5) * 2}s`,
  delay: `${-(i % 7)}s`,
}));

/** Shared sign-in / sign-up screen. mode = "login" | "register" */
export default function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false); // free-tier servers can take a while to wake up
  const [error, setError] = useState('');
  const slowTimer = useRef(null);

  useEffect(() => () => clearTimeout(slowTimer.current), []);

  // Already signed in: skip the form
  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) return;

    setLoading(true);
    setError('');
    setSlow(false);
    slowTimer.current = setTimeout(() => setSlow(true), 4000);

    try {
      const data = isLogin
        ? await loginUserApi(email, password)
        : await registerUserApi(name, email, password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
    } finally {
      clearTimeout(slowTimer.current);
      setLoading(false);
      setSlow(false);
    }
  };

  return (
    <div className="auth">
      <span className="auth-ghost" aria-hidden="true">FINA</span>
      <div className="auth-dust" aria-hidden="true">
        {DUST.map((d, k) => (
          <i key={k} style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDuration: d.dur, animationDelay: d.delay }} />
        ))}
      </div>

      <div className="auth-grid">
        <section className="auth-brand">
          <Link to="/" className="auth-logo rise" style={{ '--d': '0.05s' }} aria-label="FINA home">
            <LogoMark size={30} />
            <span>FINA</span>
          </Link>

          <div>
            <p className="auth-eyebrow rise" style={{ '--d': '0.15s' }}>
              {isLogin ? 'Welcome back' : 'Get started'}
            </p>
            <h1>
              <span className="line"><span className="line-in" style={{ '--d': '0.25s' }}>Every rupee</span></span>
              <span className="line accent"><span className="line-in" style={{ '--d': '0.4s' }}>tracked, untyped.</span></span>
            </h1>
            <p className="lead rise" style={{ '--d': '0.6s' }}>
              FINA reads your bank alerts on your phone, understands them with AI, and keeps your dashboard up to date
              in real time.
            </p>
            <ul className="auth-points">
              {POINTS.map((p, i) => (
                <li key={p} className="rise" style={{ '--d': `${0.75 + i * 0.12}s` }}>
                  <i>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </i>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link to="/" className="auth-back rise" style={{ '--d': '1.1s' }}>← Back to home</Link>
        </section>

        <section className="auth-side">
          <form className="auth-card" onSubmit={handleSubmit} noValidate={false}>
            <div className="auth-card-head">
              <h2>{isLogin ? 'Sign in' : 'Create your account'}</h2>
              <p className="sub">
                {isLogin ? 'Sign in to see your latest transactions.' : 'Start turning bank alerts into insight.'}
              </p>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            {!isLogin && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} autoComplete="name" />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="pw">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={isLogin ? undefined : 6}
                  required
                  disabled={loading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading && <span className="spin" aria-hidden="true" />}
              <span>{loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}</span>
              {!loading && <b aria-hidden="true">→</b>}
            </button>

            {loading && (
              <p className="slow" role="status">
                {slow ? 'Waking up the server… this can take up to a minute on first load.' : 'One moment…'}
              </p>
            )}

            <p className="alt">
              {isLogin ? (
                <>New to FINA? <Link to="/register">Create an account</Link></>
              ) : (
                <>Already have an account? <Link to="/login">Sign in</Link></>
              )}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}