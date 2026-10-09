import React from 'react';

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

const RESULT_COLORS = { success: colors.emerald, warn: colors.amber, error: colors.red };

// result: { type: 'success' | 'warn' | 'error', text: string } | null
export default function SmsSimulator({ smsInput, setSmsInput, onSmsSubmit, ingesting, result }) {
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
          {ingesting ? 'Sending…' : 'Send to AI parser →'}
        </button>
      </form>

      {result && (
        <p style={{ ...styles.result, color: RESULT_COLORS[result.type] || colors.inkSoft }}>
          {result.text}
        </p>
      )}
    </section>
  );
}

const styles = {
  simCard: { padding: '24px' },
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
  result: { margin: '12px 0 0 0', fontSize: 13, lineHeight: 1.45 },
};