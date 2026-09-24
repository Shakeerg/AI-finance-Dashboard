import React from 'react';

const colors = {
  paperGlass: 'rgba(251,248,241,0.6)',
  inkSoft: '#5B584E',
  emerald: '#1F5D45',
  red: '#9A3B2E',
};

const fonts = {
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

export default function MetricsCards({ inflow = 0, outflow = 0, net = 0 }) {
  return (
    <div style={styles.metricsGrid}>
      <div style={{ ...glassCard, ...styles.metricCard, borderLeft: `3px solid ${colors.emerald}` }}>
        <div style={styles.metricLabel}>Total inflow</div>
        <div style={{ ...styles.metricValue, color: colors.emerald }}>
          ₹{inflow.toLocaleString('en-IN')}
        </div>
      </div>

      <div style={{ ...glassCard, ...styles.metricCard, borderLeft: `3px solid ${colors.red}` }}>
        <div style={styles.metricLabel}>Total outflow</div>
        <div style={{ ...styles.metricValue, color: colors.red }}>
          ₹{outflow.toLocaleString('en-IN')}
        </div>
      </div>

      <div style={{ ...glassCard, ...styles.metricCard, borderLeft: `3px solid ${net >= 0 ? colors.emerald : colors.red}` }}>
        <div style={styles.metricLabel}>Net balance</div>
        <div style={{ ...styles.metricValue, color: net >= 0 ? colors.emerald : colors.red }}>
          ₹{net.toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
}

const styles = {
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 28,
  },
  metricCard: { padding: '20px 22px' },
  metricLabel: {
    fontFamily: fonts.mono,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: colors.inkSoft,
  },
  metricValue: { fontFamily: fonts.mono, fontSize: 26, fontWeight: 500, marginTop: 8 },
};