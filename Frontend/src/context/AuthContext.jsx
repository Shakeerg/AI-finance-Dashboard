import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const TOKEN_KEY = "fina_token";
const USER_KEY = "fina_user";

const AuthContext = createContext(null);

// Storage can throw (blocked cookies, private mode) and a saved user can be corrupt:
// neither should ever white-screen the app.
const safeGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* signed in for this tab only */
  }
};
const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to do */
  }
};
const readUser = () => {
  try {
    const parsed = JSON.parse(safeGet(USER_KEY));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeGet(TOKEN_KEY));
  const [user, setUser] = useState(readUser);

  const login = useCallback((t, u) => {
    safeSet(TOKEN_KEY, t);
    safeSet(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Signing out (or in) in another tab keeps this tab in step
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== null && e.key !== TOKEN_KEY && e.key !== USER_KEY) return;
      setToken(safeGet(TOKEN_KEY));
      setUser(readUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({ token, user, login, logout }), [token, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}