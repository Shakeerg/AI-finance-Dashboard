import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { loginUserApi, registerUserApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ensureFonts } from '../../utils/fonts';
import '../../styles/app.css';

const POINTS = [
  'Only bank and UPI alerts are sent. OTPs and offers are dropped.',
  'Duplicates across apps are caught before they reach your totals.',
  'Unsure items wait in a review inbox instead of being guessed.',
];

/** Shared sign-in / sign-up screen. mode = "login" | "register" */
export default function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false); // free-tier servers can take a while to wake up
  const [error, setError] = useState('');
  const slowTimer = useRef(null);

  useEffect(() => {
    ensureFonts();
    return () => clearTimeout(slowTimer.current);
  }, []);

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
    <div className="fa-root">
      <div className="fa-auth">
        <section className="fa-auth-brand">
          <div className="fa-brand" style={{ padding: 0 }}>
            <span className="fa-brand-mark mark">F</span>
            FINA
          </div>

          <div>
            <h1>Every rupee tracked, without typing a thing.</h1>
            <p className="lead">
              FINA reads your bank alerts on your phone, understands them with AI, and keeps your dashboard up to date in
              real time.
            </p>
            <ul>
              {POINTS.map((p) => (
                <li key={p}>
                  <i>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EAF4EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </i>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link to="/" style={{ color: '#8fb5a2', fontSize: 12.5 }}>← Back to home</Link>
        </section>

        <section className="fa-auth-form">
          <form onSubmit={handleSubmit}>
            <div>
              <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p className="sub">
                {isLogin ? 'Sign in to see your latest transactions.' : 'Start turning bank alerts into insight.'}
              </p>
            </div>

            {error && <div className="fa-error" role="alert">{error}</div>}

            {!isLogin && (
              <div>
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} autoComplete="name" />
              </div>
            )}

            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isLogin ? undefined : 6}
                required
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" className="submit" disabled={loading}>
              {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
            </button>

            {loading && (
              <p className="slow">
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