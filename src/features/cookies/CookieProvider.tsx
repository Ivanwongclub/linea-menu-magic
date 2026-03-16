import { createContext, useContext, type ReactNode } from "react";
import { useCookieConsent } from "./useCookieConsent";

type CookieContextValue = ReturnType<typeof useCookieConsent>;

const CookieContext = createContext<CookieContextValue | null>(null);

export function CookieProvider({ children }: { children: ReactNode }) {
  const value = useCookieConsent();
  return <CookieContext.Provider value={value}>{children}</CookieContext.Provider>;
}

export function useCookieContext(): CookieContextValue {
  const ctx = useContext(CookieContext);
  if (!ctx) throw new Error("useCookieContext must be used within <CookieProvider>");
  return ctx;
}
