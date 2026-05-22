import * as React from "react";

export type Locale = "en" | "zh";

/** Inline bilingual string — `t()` picks the right side based on current locale. */
export type Bilingual = { en: string; zh: string };

type LocaleCtxValue = {
  locale: Locale;
  toggle: () => void;
  setLocale: (loc: Locale) => void;
  /** Resolve a Bilingual record to a string for the current locale.
   *  Pass-through for plain strings so call sites can mix locale-aware
   *  and locale-independent text without juggling types. */
  t: (m: Bilingual | string) => string;
};

const LOCALE_KEY = "anchor-locale";

function readInitial(): Locale {
  if (typeof localStorage !== "undefined") {
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === "zh" || v === "en") return v;
  }
  if (typeof navigator !== "undefined") {
    const lang = navigator.language?.toLowerCase() ?? "";
    if (lang.startsWith("zh")) return "zh";
  }
  return "en";
}

const LocaleCtx = React.createContext<LocaleCtxValue>({
  locale: "en",
  toggle: () => {},
  setLocale: () => {},
  t: (m) => (typeof m === "string" ? m : m.en),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(readInitial);

  const setLocale = React.useCallback((loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem(LOCALE_KEY, loc);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const toggle = React.useCallback(() => {
    setLocale(locale === "en" ? "zh" : "en");
  }, [locale, setLocale]);

  // Mirror locale onto <html lang> for screen-reader correctness.
  React.useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const t = React.useCallback(
    (m: Bilingual | string) => (typeof m === "string" ? m : m[locale]),
    [locale],
  );

  const value = React.useMemo<LocaleCtxValue>(
    () => ({ locale, toggle, setLocale, t }),
    [locale, toggle, setLocale, t],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): LocaleCtxValue {
  return React.useContext(LocaleCtx);
}
