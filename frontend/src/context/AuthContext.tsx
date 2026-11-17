import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, readSessionId, writeSessionId } from '../lib/api';
import type { SignInInput, SignUpInput, User } from '../types/auth';

type AuthContextValue = {
  user: User | null;
  sessionId: string | null;
  loading: boolean;
  signIn: (payload: SignInInput) => Promise<User>;
  signUp: (payload: SignUpInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => readSessionId());
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    writeSessionId(null);
    setSessionId(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      active = false;
    };
  }, [clearSession, sessionId]);

  const setAuthSession = useCallback((nextSessionId: string | null, nextUser: User | null) => {
    writeSessionId(nextSessionId);
    setSessionId(nextSessionId);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(
    async (payload: SignInInput) => {
      const result = await authApi.signIn(payload);
      setAuthSession(result.sessionId, result.user);
      return result.user;
    },
    [setAuthSession],
  );

  const signUp = useCallback(
    async (payload: SignUpInput) => {
      const result = await authApi.signUp(payload);
      setAuthSession(result.sessionId, result.user);
      return result.user;
    },
    [setAuthSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore server-side cleanup errors and clear the local session anyway.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, sessionId, loading, signIn, signUp, logout }),
    [loading, logout, sessionId, signIn, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
