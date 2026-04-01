import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE } from "@/lib/api";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

const TOKEN_KEY = "tabaq_token";

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => safeGet(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((newToken: string, newUser: User) => {
    safeSet(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    safeRemove(TOKEN_KEY);
    setToken(null);
    setUser(null);
    fetch(`${API_BASE}/api/auth/logout`, { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => safeGet(TOKEN_KEY));
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          safeRemove(TOKEN_KEY);
          setToken(null);
        }
      })
      .catch(() => {
        safeRemove(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
