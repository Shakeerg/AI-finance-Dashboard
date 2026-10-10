import React, { useState, useEffect, useCallback } from 'react';

const glassCard = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '12px',
};

const readStatus = () => {
  try {
    const raw = window.FinaNative?.status?.();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const timeAgo = (ms) => {
  if (!ms) return 'Never';
  const seconds = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

export default function NativeStatusCard() {
  const inApp = typeof window !== 'undefined' && !!window.FinaNative;
  const [status, setStatus] = useState(() => (inApp ? readStatus() : null));
  const [queued, setQueued] = useState(false);

  const refresh = useCallback(() => setStatus(readStatus()), []);

  useEffect(() => {
    if (!inApp) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, 5000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [inApp, refresh]);

  // Only shown inside the FINA Android app
  if (!inApp) return null;

  const handleTest = () => {
    try {
      window.FinaNative.sendTest();
      setQueued(true);
      setTimeout(() => {
        setQueued(false);
        refresh();
      }, 3000);
    } catch {
      /* ignore */
    }
  };

  const pending = status?.pending ?? 0;
  const failed = status?.failed ?? 0;
  const rows = status
    ? [
        { label: 'Notification access', value: status.listenerEnabled ? 'On' : 'Off', ok: !!status.listenerEnabled },
        { label: 'Device key', value: status.hasKey ? 'Saved' : 'Missing', ok: !!status.hasKey },
        { label: 'Battery', value: status.batteryRestricted ? 'Restricted' : 'OK', ok: !status.batteryRestricted },
        { label: 'Waiting to send', value: String(pending), ok: pending === 0 },
        { label: 'Failed', value: String(failed), ok: failed === 0 },
        { label: 'Last sent', value: timeAgo(status.lastSentAt), ok: true },
      ]
    : [];
  const allGood = status && status.listenerEnabled && status.hasKey && !status.batteryRestricted;

  return (
    <section style={{ ...glassCard, ...styles.card }}>
      <h3 style={styles.title}>This phone</h3>
      <p style={styles.sub}>
        {!status
          ? 'Could not read the phone status.'
          : allGood
          ? 'Capturing bank alerts.'
          : 'Setup needed in the FINA app (open the menu, then Setup).'}
      </p>

      {rows.map((row) => (
        <div key={row.label} style={styles.row}>
          <span style={styles.label}>{row.label}</span>
          <span style={styles.value}>
            <span
              aria-hidden="true"
              style={{ ...styles.dot, background: row.ok ? 'var(--accent)' : 'var(--amber)' }}
            />
            {row.value}
          </span>
        </div>
      ))}

      <div style={styles.actions}>
        <button type="button" onClick={handleTest} disabled={queued} style={styles.primaryBtn}>
          {queued ? 'Test queued ✓' : 'Send test alert'}
        </button>
      </div>
      <p style={styles.note}>The test adds a real ₹99 TESTSHOP transaction. Delete it afterwards.</p>
    </section>
  );
}

const styles = {
  card: { padding: '20px 22px' },
  title: { fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 17, margin: 0, color: 'var(--ink)' },
  sub: { color: 'var(--ink2)', fontSize: 13, margin: '6px 0 14px 0' },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 0',
    borderTop: '1px solid var(--line)',
    fontSize: 13,
  },
  label: { color: 'var(--ink2)' },
  value: { color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  actions: { display: 'flex', gap: 10, marginTop: 14 },
  primaryBtn: {
    background: 'var(--ink)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: 6,
    padding: '9px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  note: { color: 'var(--ink2)', fontSize: 12, margin: '10px 0 0 0' },
};