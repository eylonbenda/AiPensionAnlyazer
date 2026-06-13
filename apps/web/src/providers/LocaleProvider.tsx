"use client";

import * as React from "react";

import { detectInitialLocale, persistLocale, toggleLocale, type Locale } from "@/lib/locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
  dir: "ltr" | "rtl";
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const toggle = React.useCallback(() => {
    setLocaleState((prev) => {
      const next = toggleLocale(prev);
      persistLocale(next);
      return next;
    });
  }, []);

  const dir = locale === "he" ? "rtl" : "ltr";

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value = React.useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, toggle, dir }),
    [locale, setLocale, toggle, dir],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
