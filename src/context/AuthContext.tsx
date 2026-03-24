import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import funcUrls from "../../backend/func2url.json";

interface User {
  bitrix_id: number;
  name: string;
  role: "admin" | "editor" | "viewer";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  token: null,
});

const AUTH_URL = funcUrls["bitrix-auth"];
const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const verifyToken = useCallback(async (t: string) => {
    try {
      const resp = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token: t }),
      });
      const data = await resp.json();
      if (data.valid && data.user) {
        setUser(data.user);
        setToken(t);
        return true;
      }
    } catch (e) {
      console.error("Token verify failed", e);
    }
    logout();
    return false;
  }, [logout]);

  const exchangeCode = useCallback(async (code: string) => {
    try {
      const redirectUri = AUTH_URL;
      const resp = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exchange_code", code, redirect_uri: redirectUri }),
      });
      const data = await resp.json();
      if (data.token && data.user) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        window.history.replaceState({}, "", "/");
        return true;
      }
      if (data.error === "access_denied") {
        window.history.replaceState({}, "", "/login?error=access_denied&name=" + encodeURIComponent(data.name || "") + "&bitrix_id=" + (data.bitrix_id || ""));
        return false;
      }
    } catch (e) {
      console.error("Code exchange failed", e);
    }
    window.history.replaceState({}, "", "/login?error=auth_failed");
    return false;
  }, []);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code && window.location.pathname === "/auth/callback") {
        await exchangeCode(code);
        setLoading(false);
        return;
      }

      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        await verifyToken(savedToken);
      }
      setLoading(false);
    };
    init();
  }, [exchangeCode, verifyToken]);

  const login = useCallback(async () => {
    const redirectUri = AUTH_URL;
    try {
      const resp = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_auth_url", redirect_uri: redirectUri }),
      });
      const data = await resp.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
        return;
      }
    } catch (e) {
      console.error("Failed to get auth URL", e);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;