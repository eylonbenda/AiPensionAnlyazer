export type Locale = 'en' | 'he';

export const LOCALE_STORAGE_KEY = 'analysis-locale';

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'he') return stored;

  if (navigator.language.toLowerCase().startsWith('he')) return 'he';
  return 'en';
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function toggleLocale(locale: Locale): Locale {
  return locale === 'he' ? 'en' : 'he';
}
