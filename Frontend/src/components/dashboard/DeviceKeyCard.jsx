import React, { useState, useEffect, useCallback } from 'react';
import { getDeviceKeyStatus, createDeviceKey, revokeDeviceKey } from '../../services/api';

const colors = {
  paper: 'var(--bg)',
  paperRaised: 'var(--surface2)',
  paperGlass: 'var(--surface)',
  ink: 'var(--ink)',
  inkSoft: 'var(--ink2)',
  rule: 'var(--line)',
  emerald: 'var(--accent)',
  emeraldSoft: 'var(--accentSoft)',
  amber: 'var(--amber)',
  amberSoft: 'var(--amberSoft)',
  red: 'var(--red)',
  redSoft: 'var(--redSoft)',
};

const fonts = {
  serif: 'var(--sans)',
  sans: 'var(--sans)',
  mono: 'var(--mono)',
};

const glassCard = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '12px',
};

const timeAgo = (value) => {
  if (!value) return null;
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

export default function DeviceKeyCard() {
  const [status, setStatus] = useState(null); // { hasKey, prefix, createdAt, lastSeenAt }
  const [newKey, setNewKey] = useState(null); // plain key, shown once
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getDeviceKeyStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load phone-app status.');
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 30000); // keeps "last sent" fresh
    return () => clearInterval(id);
  }, [loadStatus]);

  const handleGenerate = async () => {
    if (
      status?.hasKey &&
      !window.confirm('Generating a new key stops the old one working on your phone. Continue?')
    ) {
      return;
    }
    setBusy(true);
    try {
      const data = await createDeviceKey();
      setNewKey(data.deviceKey);
      setCopied(false);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create a key.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Revoke this key? Your phone app will stop sending until you add a new one.')) return;
    setBusy(true);
    try {
      await revokeDeviceKey();
      setNewKey(null);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not revoke the key.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
    } catch {
      setError('Copy failed. Select the key and copy it manually.');
    }
  };

  const lastSeen = timeAgo(status?.lastSeenAt);

  return (
    <section style={{ ...glassCard, ...styles.card }}>
      <h3 style={styles.title}>Phone app connection</h3>
      <p style={styles.sub}>
        The FINA phone app sends your bank notifications here using a private device key.
      </p>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {newKey && (
        <div style={styles.keyBox}>
          <div style={styles.keyWarn}>Copy this key now. It is shown only once.</div>
          <code style={styles.keyText}>{newKey}</code>
          <button type="button" onClick={handleCopy} style={styles.copyBtn}>
            {copied ? 'Copied ✓' : 'Copy key'}
          </button>
        </div>
      )}

      {status && (
        <div style={styles.statusRow}>
          <span
            style={{
              ...styles.dot,
              background: status.hasKey ? (lastSeen ? colors.emerald : colors.amber) : colors.rule,
            }}
          />
          <span style={styles.statusText}>
            {!status.hasKey && 'No phone connected yet'}
            {status.hasKey && lastSeen && (
              <>
                Connected · <span style={styles.mono}>{status.prefix}…</span> · last sent {lastSeen}
              </>
            )}
            {status.hasKey && !lastSeen && (
              <>
                Key created · <span style={styles.mono}>{status.prefix}…</span> · waiting for the first
                notification
              </>
            )}
          </span>
        </div>
      )}

      <div style={styles.actions}>
        <button type="button" onClick={handleGenerate} disabled={busy || !status} style={styles.primaryBtn}>
          {status?.hasKey ? 'Generate new key' : 'Generate device key'}
        </button>
        {status?.hasKey && (
          <button type="button" onClick={handleRevoke} disabled={busy} style={styles.revokeBtn}>
            Revoke
          </button>
        )}
      </div>
    </section>
  );
}

const styles = {
  card: { padding: '20px 22px' },
  title: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 17, margin: 0, color: colors.ink },
  sub: { color: colors.inkSoft, fontSize: 13, margin: '6px 0 14px 0' },
  error: { color: colors.red, fontSize: 12.5, marginBottom: 10 },
  keyBox: {
    background: colors.emeraldSoft,
    border: `1px solid ${colors.emerald}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  keyWarn: { fontSize: 12, color: colors.emerald, fontWeight: 500, marginBottom: 6 },
  keyText: {
    display: 'block',
    fontFamily: fonts.mono,
    fontSize: 12,
    wordBreak: 'break-all',
    color: colors.ink,
    marginBottom: 8,
  },
  copyBtn: {
    background: colors.emerald,
    color: 'var(--onAccent)',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12.5,
    cursor: 'pointer',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  statusText: { fontSize: 13, color: colors.inkSoft },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  actions: { display: 'flex', gap: 10 },
  primaryBtn: {
    background: colors.ink,
    color: 'var(--bg)',
    border: 'none',
    borderRadius: 6,
    padding: '9px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  revokeBtn: {
    background: 'transparent',
    color: colors.red,
    border: `1px solid ${colors.rule}`,
    borderRadius: 6,
    padding: '9px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
};