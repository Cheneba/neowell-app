import { getLocales } from 'expo-localization';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { en } from './en';
import { fr } from './fr';

export type Locale = 'en' | 'fr';
const dictionaries = { en, fr };
const STORAGE_KEY = 'neowell.locale';

/** Plural category: French treats 0 and 1 as singular, English only 1. */
function pluralSuffix(locale: Locale, n: number): '_one' | '_other' {
  return (locale === 'fr' ? n < 2 : n === 1) ? '_one' : '_other';
}

/**
 * Looks up a dot path ("result.RED") and fills `{param}` placeholders.
 * With a numeric `n` param, `key_one` / `key_other` variants are used when present.
 * Falls back to English, then to the key itself.
 */
export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const lookup = (dict: unknown, path: string) =>
    path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dict);
  const find = (path: string) => lookup(dictionaries[locale], path) ?? lookup(en, path);
  const plural = typeof params?.n === 'number' ? find(key + pluralSuffix(locale, params.n)) : undefined;
  const raw = plural ?? find(key);
  if (typeof raw !== 'string') return key;
  return params ? raw.replace(/\{(\w+)\}/g, (_, p: string) => String(params[p] ?? `{${p}}`)) : raw;
}

/** A list of strings (e.g. "days"), falling back to English. */
export function translateList(locale: Locale, key: string): string[] {
  const value = (dictionaries[locale] as Record<string, unknown>)[key] ?? (en as Record<string, unknown>)[key];
  return Array.isArray(value) ? (value as string[]) : [];
}

export function deviceLocale(): Locale {
  return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
}

type I18n = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  list: (key: string) => string[];
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  useEffect(() => {
    storage.get(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'fr') setLocaleState(saved);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    void storage.set(STORAGE_KEY, l);
  }, []);

  const value = useMemo<I18n>(
    () => ({ locale, setLocale, t: (key, params) => translate(locale, key, params), list: (key) => translateList(locale, key) }),
    [locale, setLocale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
