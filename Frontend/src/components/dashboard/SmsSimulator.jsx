import React from 'react';

const colors = {
  paper: '#F5F1E8',
  paperRaised: '#FBF8F1',
  paperGlass: 'rgba(251,248,241,0.6)',
  ink: '#1C1B17',
  inkSoft: '#5B584E',
  rule: '#DCD5C4',
  emerald: '#1F5D45',
};

const fonts = {
  serif: "'Fraunces', Georgia, serif",
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

export default function SmsSimulator({ smsInput, setSmsInput, onSmsSubmit, ingesting }) {
  return (
    <section style={{ ...glassCard, ...styles.simCard }}>
      <h3 style={styles.simTitle}>Simulate incoming bank SMS</h3>
      <p style={styles.simSub}>Paste one or more raw SMS lines — Gemini will parse each one.</p>
      <form onSubmit={onSmsSubmit}>
        <textarea
          value={smsInput}
          onChange={(e) => setSmsInput(e.target.value)}
          placeholder="Rs.840.00 debited from A/c XX3321 on 01-Jul-26 at SWIGGY. Avl bal Rs.14,205.10"
          rows="3"
          style={styles.textarea}
          onFocus={(e) => (e.target.style.borderColor = colors.emerald)}
          onBlur={(e) => (e.target.style.borderColor = colors.rule)}
        />
        <button
          type="submit"
          disabled={ingesting || !smsInput.trim()}
          style={{
            ...styles.simButton,
            background: ingesting ? colors.inkSoft : colors.ink,
            cursor: smsInput.trim() && !ingesting ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (!ingesting && smsInput.trim()) e.currentTarget.style.background = colors.emerald;
          }}
          onMouseLeave={(e) => {
            if (!ingesting && smsInput.trim()) e.currentTarget.style.background = colors.ink;
          }}
        >
          {ingesting ? 'Gemini is parsing…' : 'Send to AI parser →'}
        </button>
      </form>
    </section>
  );
}

const styles = {
  simCard: { padding: '24px', marginBottom: 28 },
  simTitle: { fontFamily: fonts.serif, fontWeight: 500, fontSize: 18, margin: 0 },
  simSub: { color: colors.inkSoft, fontSize: 13.5, margin: '6px 0 16px 0' },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 6,
    border: `1px solid ${colors.rule}`,
    background: colors.paperRaised,
    color: colors.ink,
    fontSize: 13.5,
    fontFamily: fonts.mono,
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color .15s',
  },
  simButton: {
    marginTop: 12,
    width: '100%',
    padding: '12px',
    color: colors.paper,
    border: 'none',
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 14.5,
    transition: 'background .15s',
  },
};