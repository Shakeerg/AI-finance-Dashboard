import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TransactionsProvider, useTransactions } from '../context/TransactionsContext';
import TransactionModal from '../components/dashboard/TransactionModal';
import Icon from '../components/ui/Icon';
import { LogoMark } from '../components/home/Navbar';
import { ensureFonts } from '../utils/fonts';
import { initialOf } from '../utils/format';
import '../styles/app.css';

const TITLES = {
  '/dashboard': ['Overview', 'Your money at a glance'],
  '/dashboard/transactions': ['Transactions', 'Everything FINA has captured, newest first'],
  '/dashboard/review': ['Review inbox', 'Only the items the AI was unsure about'],
  '/dashboard/analytics': ['Analytics', 'Trends, categories and merchants'],
  '/dashboard/budgets': ['Budgets', 'Monthly limits per category'],
  '/dashboard/devices': ['Phone & sources', 'Connect your phone and see where alerts come from'],
};

const readTheme = () => {
  try {
    return localStorage.getItem('fina_theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

function Shell() {
  const { user, logout } = useAuth();
  const { txns, flagged, connected, toast, modal, openCreate, closeModal, saveModal } = useTransactions();
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    ensureFonts();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('fina_theme', next);
    } catch {
      /* theme just won't be remembered */
    }
  };

  const [title, sub] = TITLES[pathname.replace(/\/+$/, '')] || TITLES['/dashboard'];
  const navClass = ({ isActive }) => `fa-navlink${isActive ? ' active' : ''}`;
  const verified = txns.length ? Math.round(((txns.length - flagged.length) / txns.length) * 100) : 100;

  return (
    <div className="fa-root" data-theme={theme}>
      <div className="fa-shell">
        <aside className="fa-side">
          <div className="fa-brandblock">
            <LogoMark size={34} />
            <div className="txt">
              <div className="name">FINA</div>
              <div className="sub">personal · {connected ? 'live' : 'offline'}</div>
            </div>
          </div>

          <nav className="fa-nav" aria-label="Main">
            <div className="fa-navgroup">
              <div className="fa-navlabel">Workspace</div>
              <NavLink to="/dashboard" end className={navClass}>
                <Icon name="overview" />
                <span className="grow">Overview</span>
              </NavLink>
              <NavLink to="/dashboard/transactions" className={navClass}>
                <Icon name="list" />
                <span className="grow">Transactions</span>
              </NavLink>
              <NavLink to="/dashboard/review" className={navClass}>
                <Icon name="inbox" />
                <span className="grow">Review inbox</span>
                {flagged.length > 0 && <span className="fa-badge">{flagged.length}</span>}
              </NavLink>
            </div>
            <div className="fa-navgroup">
              <div className="fa-navlabel">Insights</div>
              <NavLink to="/dashboard/analytics" className={navClass}>
                <Icon name="chart" />
                <span className="grow">Analytics</span>
              </NavLink>
              <NavLink to="/dashboard/budgets" className={navClass}>
                <Icon name="target" />
                <span className="grow">Budgets</span>
              </NavLink>
            </div>
            <div className="fa-navgroup">
              <div className="fa-navlabel">Connect</div>
              <NavLink to="/dashboard/devices" className={navClass}>
                <Icon name="phone" />
                <span className="grow">Phone &amp; sources</span>
              </NavLink>
            </div>
          </nav>

          <div className="fa-spacer" />

          {txns.length > 0 && (
            <div className="fa-sidecard">
              <div className="top">
                <span>Auto-verified</span>
                <b>{verified}%</b>
              </div>
              <div className="meter" role="img" aria-label={`${verified}% of transactions verified automatically`}>
                <i style={{ width: `${verified}%` }} />
              </div>
              <div className="foot">
                {flagged.length ? `${flagged.length} waiting in your inbox` : 'Nothing waiting for you'}
              </div>
            </div>
          )}

          <div className="fa-userbox">
            <span className="fa-avatar">{initialOf(user?.name)}</span>
            <div style={{ minWidth: 0, flexGrow: 1 }}>
              <div className="name">{user?.name || 'User'}</div>
              <div className="sub">Personal workspace</div>
            </div>
            <button type="button" className="fa-linkbtn" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="fa-main">
          <header className="fa-topbar">
            <nav className="fa-crumbs" aria-label="Breadcrumb">
              <span>FINA</span>
              <i aria-hidden="true">/</i>
              <b>{title}</b>
            </nav>
            <div className="fa-topbar-actions">
              <span className={`fa-live${connected ? ' on' : ''}`} title={connected ? 'New transactions appear instantly' : 'Reconnecting…'}>
                <i />
                {connected ? 'Live' : 'Offline'}
              </span>
              <button
                type="button"
                className="fa-iconbtn lg"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
              </button>
              <span className="fa-avatar dark" aria-hidden="true">{initialOf(user?.name)}</span>
            </div>
          </header>

          <div className="fa-content">
            <div className="fa-pagehead">
              <div>
                <h1>{title}</h1>
                <div className="sub">{sub}</div>
              </div>
              <button type="button" className="fa-btn primary" onClick={openCreate}>
                <Icon name="plus" size={16} />
                Add transaction
              </button>
            </div>
            <Outlet />
          </div>
        </main>
      </div>

      <TransactionModal
        isOpen={modal.open}
        onClose={closeModal}
        onSubmit={saveModal}
        initialData={modal.tx}
        loading={modal.saving}
      />

      {toast && (
        <div className={`fa-toast${toast.kind === 'error' ? ' error' : ''}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <TransactionsProvider>
      <Shell />
    </TransactionsProvider>
  );
}