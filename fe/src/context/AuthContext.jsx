import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  // Sync user from DB on app load so avatar/name are always fresh
  useEffect(() => {
    if (!token) return;
    API.get("/auth/me").then(({ data }) => {
      const fresh = { id: data._id, name: data.name, email: data.email, role: data.role, avatar: data.avatar || null, phone: data.phone || null };
      localStorage.setItem("user", JSON.stringify(fresh));
      setUser(fresh);
    }).catch(() => {});
  }, [token]);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
