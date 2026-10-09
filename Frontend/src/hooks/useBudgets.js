import { useCallback, useEffect, useState } from 'react';

const STEP = 500;

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Monthly budgets per category.
 * Saved in this browser only for now; a backend endpoint can replace this later
 * without changing the pages that use it.
 */
export default function useBudgets(userKey) {
  const storageKey = `fina_budgets_${userKey || 'me'}`;
  const [budgets, setBudgets] = useState(() => read(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(budgets));
    } catch {
      /* private mode or storage blocked: budgets just won't persist */
    }
  }, [budgets, storageKey]);

  const add = useCallback((category, limit) => {
    const value = Math.round(Number(limit));
    if (!category || !(value > 0)) return false;
    setBudgets((prev) => (prev.some((b) => b.category === category) ? prev : [...prev, { category, limit: value }]));
    return true;
  }, []);

  const adjust = useCallback((category, direction) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit: Math.max(STEP, b.limit + direction * STEP) } : b))
    );
  }, []);

  const remove = useCallback((category) => {
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  }, []);

  return { budgets, add, adjust, remove, step: STEP };
}