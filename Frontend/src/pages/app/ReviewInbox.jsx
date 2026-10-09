import React from 'react';
import { useTransactions } from '../../context/TransactionsContext';
import { formatDateTime, formatMoney } from '../../utils/format';
import { isDuplicate, reviewReason } from '../../utils/txFlags';

export default function ReviewInbox() {
  const { flagged, loading, error, confirm, remove, openEdit } = useTransactions();

  if (loading) return <p className="fa-muted">Loading your records…</p>;
  if (error) return <div className="fa-error">⚠️ {error}</div>;

  const onRemove = (id) => {
    if (window.confirm('Remove this transaction? Use this if it is not yours or was captured by mistake.')) remove(id);
  };

  return (
    <>
      <p style={{ maxWidth: 640, color: 'var(--ink2)' }}>
        FINA only asks when it is unsure: a low AI confidence score, an unclear category, or the same payment reported by
        two apps. Everything else is saved automatically.
      </p>

      {flagged.length === 0 && (
        <div className="fa-empty">
          <strong>Inbox zero</strong>
          New items appear here the moment the AI is unsure.
        </div>
      )}

      <div className="fa-stack">
        {flagged.map((t) => {
          const dup = isDuplicate(t);
          const raw = t.rawText && t.rawText !== 'MANUAL_ENTRY' ? t.rawText : null;
          return (
            <section key={t._id} className="fa-review">
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className={`fa-flag${dup ? ' dup' : ''}`}>{dup ? 'Possible duplicate' : 'Low confidence'}</span>
                  <span className="fa-note">
                    {formatDateTime(t.createdAt)}
                    {t.sourceApp ? ` · ${t.sourceApp}` : ''}
                  </span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 500, marginTop: 10 }}>
                  {t.merchant}{' '}
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 400 }}>{formatMoney(t.amount, t.currency)}</span>
                </div>
                <div style={{ color: 'var(--ink2)', marginTop: 4, fontSize: 13.5 }}>{reviewReason(t)}</div>
                {raw && <div className="fa-raw">{raw}</div>}
              </div>
              <div className="fa-actions">
                <button type="button" className="fa-btn primary" onClick={() => confirm(t._id)}>
                  {dup ? 'Keep it' : 'Looks right'}
                </button>
                <button type="button" className="fa-btn" onClick={() => openEdit(t)}>Edit details</button>
                <button type="button" className="fa-btn danger" onClick={() => onRemove(t._id)}>Not mine</button>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}