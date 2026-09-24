import React from 'react';

const colors = {
  paper: '#F5F1E8',
  ink: '#1C1B17',
  inkSoft: '#5B584E',
  rule: '#DCD5C4',
  emerald: '#1F5D45',
  red: '#9A3B2E',
};

const fonts = {
  serif: "'Fraunces', Georgia, serif",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
};

export default function DashboardHeader({ user, onLogout }) {
  return (
    <header style={styles.header}>
      <div>
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          FINA AI
        </div>
        <p style={styles.headerSub}>
          {user?.name || 'User'} · <span style={{ color: colors.emerald, fontWeight: 600 }}>Connected</span>
        </p>
      </div>
      <button
        onClick={onLogout}
        style={styles.logoutBtn}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.red;
          e.currentTarget.style.color = colors.paper;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.red;
        }}
      >
        Sign out
      </button>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
    paddingBottom: 24,
    borderBottom: `1px solid ${colors.rule}`,
  },
  brand: {
    fontFamily: fonts.serif,
    fontWeight: 600,
    fontSize: 22,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: colors.emerald,
    display: 'inline-block',
  },
  headerSub: { margin: '8px 0 0 0', color: colors.inkSoft, fontSize: 13.5 },
  logoutBtn: {
    padding: '9px 16px',
    background: 'transparent',
    border: `1px solid ${colors.red}`,
    color: colors.red,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    transition: 'all .15s',
    fontFamily: fonts.sans,
  },
};