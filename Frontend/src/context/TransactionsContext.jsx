import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchTransactions,
  processIncomingSMS,
  deleteTransaction,
  createManualTransaction,
  updateTransaction,
  confirmTransaction,
} from '../services/api';
import { useAuth } from './AuthContext';
import useTransactionSocket from '../hooks/useTransactionSocket';
import { isDuplicate, needsReview } from '../utils/txFlags';

const TransactionsContext = createContext(null);

const PAGE_SIZE = 100; // the server caps a page at 100
const MAX_PAGES = 10; // up to 1,000 recent transactions are kept in memory
const MAX_TXNS = PAGE_SIZE * MAX_PAGES; // live updates must not grow this without limit

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const errorText = (err) => err?.response?.data?.message || err?.message || 'Something went wrong.';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function TransactionsProvider({ children }) {
  const { token, logout } = useAuth();

  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { text, kind }
  const [modal, setModal] = useState({ open: false, tx: null, saving: false });

  // Everything async below checks this, so nothing touches state after sign-out/unmount
  const alive = useRef(true);
  const reloadTimer = useRef(null);
  const reloadSeq = useRef(0);
  const toastTimer = useRef(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(toastTimer.current);
      clearTimeout(reloadTimer.current);
    };
  }, []);

  const notify = useCallback((text, kind = 'info') => {
    setToast({ text, kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  /* ---------- loading ---------- */
  const reload = useCallback(async () => {
    // Only the newest request may write its result: a slow older one must not overwrite fresher data
    const seq = (reloadSeq.current += 1);
    try {
      let page = 1;
      let pages = 1;
      let all = [];
      do {
        const data = await fetchTransactions(page, PAGE_SIZE);
        all = all.concat(data.transactions || []);
        pages = data.pages || 1;
        page += 1;
      } while (page <= pages && page <= MAX_PAGES);
      if (!alive.current || seq !== reloadSeq.current) return;
      setTxns(all);
      setError(null);
    } catch (err) {
      if (!alive.current || seq !== reloadSeq.current) return;
      setError(errorText(err));
      if (err?.response?.status === 401) logout();
    } finally {
      if (alive.current && seq === reloadSeq.current) setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ---------- local state helpers ---------- */
  const upsert = useCallback((tx) => {
    if (!tx?._id) return;
    setTxns((prev) => {
      const i = prev.findIndex((t) => t._id === tx._id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = tx;
        return next;
      }
      return [tx, ...prev].sort(byNewest).slice(0, MAX_TXNS);
    });
  }, []);

  const removeLocal = useCallback((id) => {
    setTxns((prev) => prev.filter((t) => t._id !== id));
  }, []);

  /* ---------- live updates ---------- */
  const firstConnect = useRef(true);
  const { connected } = useTransactionSocket(token, {
    onNew: upsert,
    onUpdated: upsert,
    onDeleted: (payload) => removeLocal(payload?.id),
    // After a reconnect, reload once to pick up anything missed while offline
    onConnect: () => {
      if (firstConnect.current) {
        firstConnect.current = false;
        return;
      }
      reload();
    },
  });

  /* ---------- actions ---------- */
  const confirm = useCallback(async (id) => {
    try {
      const res = await confirmTransaction(id);
      if (res?.transaction) upsert(res.transaction);
      notify('Confirmed. It now counts in your totals.');
    } catch (err) {
      notify(errorText(err), 'error');
    }
  }, [upsert, notify]);

  const remove = useCallback(async (id) => {
    try {
      await deleteTransaction(id);
      removeLocal(id);
      notify('Transaction removed.');
    } catch (err) {
      notify(errorText(err), 'error');
    }
  }, [removeLocal, notify]);

  // One request at a time keeps us well inside the API rate limit
  const bulk = useCallback(async (ids, fn, done) => {
    let ok = 0;
    for (const id of ids) {
      if (!alive.current) return;
      try {
        await fn(id);
        ok += 1;
      } catch {
        /* counted below */
      }
    }
    notify(
      ok === ids.length ? `${ok} ${done}.` : `${ok} of ${ids.length} ${done}. The rest failed.`,
      ok === ids.length ? 'info' : 'error'
    );
  }, [notify]);

  const bulkConfirm = useCallback(
    (ids) => bulk(ids, async (id) => { const res = await confirmTransaction(id); if (res?.transaction) upsert(res.transaction); }, 'confirmed'),
    [bulk, upsert]
  );

  const bulkRemove = useCallback(
    (ids) => bulk(ids, async (id) => { await deleteTransaction(id); removeLocal(id); }, 'removed'),
    [bulk, removeLocal]
  );

  const openCreate = useCallback(() => setModal({ open: true, tx: null, saving: false }), []);
  const openEdit = useCallback((tx) => setModal({ open: true, tx, saving: false }), []);
  const closeModal = useCallback(() => setModal({ open: false, tx: null, saving: false }), []);

  const saveModal = useCallback(async (formData) => {
    const editing = modal.tx;
    setModal((m) => ({ ...m, saving: true }));
    try {
      const res = editing
        ? await updateTransaction(editing._id, formData)
        : await createManualTransaction(formData);
      if (res?.transaction) upsert(res.transaction);
      setModal({ open: false, tx: null, saving: false });
      notify(editing ? 'Changes saved.' : 'Transaction added.');
    } catch (err) {
      setModal((m) => ({ ...m, saving: false }));
      notify(errorText(err), 'error');
    }
  }, [modal.tx, upsert, notify]);

  // Sends each pasted line to the server. Results arrive by socket when the AI finishes.
  const ingest = useCallback(async (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    let queued = 0;
    let ignored = 0;
    let failed = 0;
    for (const line of lines) {
      if (!alive.current) break;
      try {
        const data = await processIncomingSMS(line);
        if (data?.ignored) ignored += 1;
        else queued += 1;
        await sleep(200);
      } catch {
        failed += 1;
      }
    }
    // Socket down? Fall back to a reload once the AI has had time to finish.
    if (queued && !connected && alive.current) {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(reload, 6000);
    }
    return { queued, ignored, failed };
  }, [connected, reload]);

  /* ---------- derived ---------- */
  const flagged = useMemo(() => txns.filter(needsReview), [txns]);
  const counted = useMemo(() => txns.filter((t) => !isDuplicate(t)), [txns]);

  // Stable unless something actually changed, so pages don't re-render for no reason
  const value = useMemo(
    () => ({
      txns, counted, flagged, loading, error, connected,
      reload, confirm, remove, bulkConfirm, bulkRemove, ingest,
      modal, openCreate, openEdit, closeModal, saveModal,
      toast, notify,
    }),
    [txns, counted, flagged, loading, error, connected, reload, confirm, remove, bulkConfirm, bulkRemove, ingest, modal, openCreate, openEdit, closeModal, saveModal, toast, notify]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used inside <TransactionsProvider>');
  return ctx;
}