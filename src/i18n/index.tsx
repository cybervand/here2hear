import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import en, { type Translations } from './en';
import no from './no';

export type Locale = 'en' | 'no';

const KEY_LOCALE = 'locale';
const LOCALES: Locale[] = ['en', 'no'];

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'no', label: 'Norsk' },
];

const STRINGS: Record<Locale, Record<keyof Translations, string>> = { en, no };

export type TranslationKey = keyof Translations;

type TranslateFn = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

function detectLocale(): Locale {
  const stored = (localStorage.getItem(KEY_LOCALE) ?? '') as Locale;
  if ((LOCALES as string[]).includes(stored)) return stored;
  const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return (LOCALES as string[]).includes(browserLang) ? (browserLang as Locale) : 'en';
}

function applyVars(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TranslateFn;
}>({
  locale: 'en',
  setLocale: () => {},
  t: (key, vars) => applyVars(en[key] ?? String(key), vars),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(KEY_LOCALE, next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: ((key, vars) =>
        applyVars(
          STRINGS[locale][key] ?? STRINGS.en[key] ?? String(key),
          vars,
        )) as TranslateFn,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT() {
  return useContext(LocaleContext);
}
