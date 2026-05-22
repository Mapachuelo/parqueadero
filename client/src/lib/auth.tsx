import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, AuthResponse } from "@/types";
import { authApi, setToken, clearToken, getToken } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isOperador: boolean;
  isCliente: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE = 5 * 60 * 1000;

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const resetTimers = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);

    warningTimer = setTimeout(() => {
      if (window.confirm("Tu sesión está por expirar. ¿Deseas continuar?")) {
        resetTimers();
      }
    }, SESSION_TIMEOUT - WARNING_BEFORE);

    inactivityTimer = setTimeout(() => {
      clearToken();
      setUser(null);
      queryClient.clear();
      window.location.href = "/login";
    }, SESSION_TIMEOUT);
  }, [queryClient]);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResponse> => {
      const res = await authApi.login(username, password);
      setToken(res.token);
      setUser(res.user);
      resetTimers();
      return res;
    },
    [resetTimers],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
    queryClient.clear();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);
  }, [queryClient]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .session()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          resetTimers();
        } else {
          clearToken();
        }
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setLoading(false));
  }, [resetTimers]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimers));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [resetTimers]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === "admin",
    isOperador: user?.role === "operador",
    isCliente: user?.role === "cliente",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
