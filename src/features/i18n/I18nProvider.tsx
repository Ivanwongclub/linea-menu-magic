import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type AppLanguage } from "./translations";

const LANGUAGE_STORAGE_KEY = "wincyc.language";
const SUPPORTED_LANGUAGES: AppLanguage[] = ["en", "zh-Hant", "zh-Hans"];

type TranslateVariables = Record<string, string | number>;

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, variables?: TranslateVariables) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (!raw) return "en";
  if (SUPPORTED_LANGUAGES.includes(raw as AppLanguage)) return raw as AppLanguage;
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLanguage);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : language;
  }, [language]);

  const t = useCallback(
    (key: string, variables?: TranslateVariables) => {
      const template = translations[language][key] ?? translations.en[key] ?? key;

      if (!variables) return template;

      return template.replace(/\{(\w+)\}/g, (_, token: string) => {
        const value = variables[token];
        return value === undefined ? `{${token}}` : String(value);
      });
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

