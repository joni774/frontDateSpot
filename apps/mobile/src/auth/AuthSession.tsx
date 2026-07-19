/** In-memory session flag — requires login each cold app start even if JWT is stored. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthSessionContextValue = {
  isSessionActive: boolean;
  activateSession: () => void;
  clearSession: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [isSessionActive, setIsSessionActive] = useState(false);

  const activateSession = useCallback(() => setIsSessionActive(true), []);
  const clearSession = useCallback(() => setIsSessionActive(false), []);

  const value = useMemo(
    () => ({ isSessionActive, activateSession, clearSession }),
    [isSessionActive, activateSession, clearSession]
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}
