import { useState, useCallback, useEffect } from "react";

export type CookieCategory = "necessary" | "analytics" | "marketing" | "functional";

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

export type ConsentStatus = "pending" | "accepted_all" | "rejected_all" | "customised";

interface StoredConsent {
  status: ConsentStatus;
  consent: CookieConsent;
  savedAt: string;
}

const STORAGE_KEY = "wincyc_cookie_consent";
const MAX_AGE_DAYS = 365;

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
};

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    const savedAt = new Date(parsed.savedAt).getTime();
    if (isNaN(savedAt)) return null;
    const age = Date.now() - savedAt;
    if (age > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(status: ConsentStatus, consent: CookieConsent) {
  const entry: StoredConsent = { status, consent, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function useCookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>("pending");
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setStatus(stored.status);
      setConsent({ ...stored.consent, necessary: true });
      setShowBanner(false);
    } else {
      setStatus("pending");
      setConsent(defaultConsent);
      setShowBanner(true);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const all: CookieConsent = { necessary: true, analytics: true, marketing: true, functional: true };
    setConsent(all);
    setStatus("accepted_all");
    setShowBanner(false);
    setShowCustomise(false);
    writeStored("accepted_all", all);
  }, []);

  const rejectAll = useCallback(() => {
    const minimal: CookieConsent = { necessary: true, analytics: false, marketing: false, functional: false };
    setConsent(minimal);
    setStatus("rejected_all");
    setShowBanner(false);
    setShowCustomise(false);
    writeStored("rejected_all", minimal);
  }, []);

  const saveCustom = useCallback((custom: CookieConsent) => {
    const safe = { ...custom, necessary: true };
    setConsent(safe);
    setStatus("customised");
    setShowBanner(false);
    setShowCustomise(false);
    writeStored("customised", safe);
  }, []);

  const openCustomise = useCallback(() => setShowCustomise(true), []);
  const closeCustomise = useCallback(() => setShowCustomise(false), []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStatus("pending");
    setConsent(defaultConsent);
    setShowBanner(true);
    setShowCustomise(false);
  }, []);

  return {
    status,
    consent,
    showBanner,
    showCustomise,
    acceptAll,
    rejectAll,
    saveCustom,
    openCustomise,
    closeCustomise,
    resetConsent,
  };
}
