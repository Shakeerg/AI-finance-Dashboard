import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("fina_token")
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("fina_user")) || null
  );

  const login = (tokenData, userData) => {
    localStorage.setItem("fina_token", tokenData);
    localStorage.setItem("fina_user", JSON.stringify(userData));

    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("fina_token");
    localStorage.removeItem("fina_user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}