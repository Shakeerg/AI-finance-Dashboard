import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionsContext';
import Icon from '../../components/ui/Icon';
import { CATEGORIES } from '../../utils/categories';
import { downloadCsv } from '../../utils/csv';
import { formatDateTime, formatMoney } from '../../utils/format';
import { isDuplicate, needsReview } from '../../utils/txFlags';

const PAGE = 50;
const FILTERS = [
  ['all', 'All'],
  ['debit', 'Money out'],
  ['credit', 'Money in'],
  ['review', 'Needs review'],
];

// "2026-10-09" -> local start / end of that day
const dayStart = (s) => (s ? new Date(`${s}T00:00:00`).getTime() : null);
const dayEnd = (s) => (s ? new Date(`${s}T23:59:59.999`).getTime() : null);

export default function TransactionsPage() {
  const { txns, loading, error, confirm, remove, bulkConfirm, bulkRemove, openEdit, notify } = useTransactions();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState({});
  const [shown, setShown] = useState(PAGE);

  const q = search.trim().toLowerCase();
  const fromMs = dayStart(from);
  const toMs = dayEnd(to);

  const filtered = txns.filter((t) => {
    if (filter === 'debit' && t.type !== 'debit') return false;
    if (filter === 'credit' && t.type !== 'credit') return false;
    if (filter === 'review' && !needsReview(t)) return false;
    if (category && t.category !== category) return false;
    const ms = new Date(t.createdAt).getTime();
    if (fromMs !== null && ms < fromMs) return false;
    if (toMs !== null && ms > toMs) return false;
    if (q && `${t.merchant} ${t.bank}`.toLowerCase().indexOf(q) < 0) return false;
    return true;
  });

  const rows = filtered.slice(0, shown);
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const allChecked = filtered.length > 0 && filtered.every((t) => selected[t._id]);

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    if (allChecked) setSelected({});
    else setSelected(Object.fromEntries(filtered.map((t) => [t._id, true])));
  };
  const clear = () => setSelected({});

  const exportRows = (list, label) => {
    if (!list.length) return notify('Nothing to export.', 'error');
    downloadCsv('fina-transactions.csv', list);
    notify(`Exported ${list.length} ${label}.`);
  };

  const onBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} transaction(s)? This cannot be undone.`)) return;
    await bulkRemove(selectedIds);
    clear();
  };
  const onBulkConfirm = async () => {
    await bulkConfirm(selectedIds);
    clear();
  };
  const onDelete = (id) => {
    if (window.confirm('Delete this transaction?')) remove(id);
  };

  if (loading) return <p className="fa-muted">Loading your records…</p>;
  if (error) return <div className="fa-error">⚠️ {error}</div>;

  return (
    <>
      <div className="fa-toolbar">
        <div className="fa-seg" role="group" aria-label="Filter by type">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" className={filter === key ? 'on' : ''} onClick={() => { setFilter(key); setShown(PAGE); }}>
              {label}
            </button>
          ))}
        </div>
        <div className="group">
          <label className="fa-field">
            <Icon name="search" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShown(PAGE); }}
              placeholder="Search merchant or bank"
              aria-label="Search merchant or bank"
            />
          </label>
          <label className="fa-field">
            <select value={category} onChange={(e) => { setCategory(e.target.value); setShown(PAGE); }} aria-label="Category">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="fa-field">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" style={{ minWidth: 0 }} />
          </label>
          <label className="fa-field">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" style={{ minWidth: 0 }} />
          </label>
          <button type="button" className="fa-btn" onClick={() => exportRows(filtered, 'rows')}>
            <Icon name="download" size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fa-bulk">
          <span className="count">{selectedIds.length} selected</span>
          <button type="button" onClick={onBulkConfirm}>Confirm</button>
          <button type="button" onClick={() => exportRows(txns.filter((t) => selected[t._id]), 'selected rows')}>Export</button>
          <button type="button" onClick={onBulkDelete}>Delete</button>
          <button type="button" className="plain" onClick={clear}>Clear</button>
        </div>
      )}

      <div className="fa-tablewrap">
        <div className="fa-table">
          <div className="fa-trow head">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all rows" />
            <span>Merchant</span>
            <span>Category</span>
            <span>Date</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
            <span />
          </div>

          {rows.length === 0 && (
            <div className="fa-empty" style={{ border: 'none', borderRadius: 0 }}>
              {txns.length === 0 ? 'No transactions yet.' : 'No transactions match these filters.'}
            </div>
          )}

          {rows.map((t) => {
            const dup = isDuplicate(t);
            const review = needsReview(t);
            return (
              <div key={t._id} className={`fa-trow${selected[t._id] ? ' sel' : dup ? ' dupe' : ''}`}>
                <input type="checkbox" checked={Boolean(selected[t._id])} onChange={() => toggle(t._id)} aria-label={`Select ${t.merchant}`} />
                <div style={{ minWidth: 0 }}>
                  <div className="merchant">{t.merchant || 'Unknown merchant'}</div>
                  <div className="meta">
                    <span>{t.bank || 'Unknown bank'}{t.sourceApp ? ` · ${t.sourceApp}` : ''}</span>
                    {review && <span className={`fa-flag${dup ? ' dup' : ''}`}>{dup ? 'Possible duplicate' : 'Needs review'}</span>}
                  </div>
                </div>
                <div><span className="fa-cat">{t.category || 'Uncategorized'}</span></div>
                <div className="when">{formatDateTime(t.createdAt)}</div>
                <div className={`fa-amt amt${t.type === 'credit' ? ' credit' : ''}${dup ? ' dim' : ''}`}>
                  {t.type === 'credit' ? '+ ' : '− '}
                  {formatMoney(t.amount, t.currency)}
                </div>
                <div className="acts">
                  {review && (
                    <button type="button" className="fa-iconbtn ok" onClick={() => confirm(t._id)} title={dup ? 'Keep it' : 'Looks right'} aria-label="Confirm transaction">
                      <Icon name="check" size={15} />
                    </button>
                  )}
                  <button type="button" className="fa-iconbtn" onClick={() => openEdit(t)} title="Edit" aria-label="Edit transaction">
                    <Icon name="pencil" size={15} />
                  </button>
                  <button type="button" className="fa-iconbtn bad" onClick={() => onDelete(t._id)} title="Delete" aria-label="Delete transaction">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length > shown && (
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="fa-btn" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({filtered.length - shown} left)
          </button>
        </div>
      )}
      <div className="fa-note">
        Showing {rows.length} of {filtered.length}. Possible duplicates are dimmed and left out of every total until you confirm them.
      </div>
    </>
  );
}