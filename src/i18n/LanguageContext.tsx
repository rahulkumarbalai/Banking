import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LANGUAGE_STORAGE_KEY, resolveLanguage, translate, translateError, transactionLabel, describeTransaction } from './core';
import type { Transaction } from '../services/types';
import type { Language, MessageValues } from './core';
import type { MessageKey } from './messages';

function useLanguageState() {
  const [language, setLanguage] = useState<Language>(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
    return resolveLanguage(saved, navigator.languages);
  });

  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Switching still works in memory. */ }
  }, [language]);

  return useMemo(() => {
    // Keep familiar Latin digits and Indian amount grouping in both languages.
    const locale = language === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN';
    const numberFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return {
      language,
      setLanguage,
      locale,
      formatDate: (value: string | Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(value)),
      relativeTime: (value: string) => {
        const seconds = (new Date(value).getTime() - Date.now()) / 1000;
        const units: [Intl.RelativeTimeFormatUnit, number][] = [
          ['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
        ];
        const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) ?? units[units.length - 1];
        return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
      },
      tr: (key: MessageKey, values?: MessageValues) => translate(language, key, values),
      translateError: (message: string) => translateError(language, message),
      transactionLabel: (type: Transaction['type']) => transactionLabel(language, type),
      describeTransaction: (description: string) => describeTransaction(language, description),
      fmt: (value: number) => numberFormat.format(value),
    };
  }, [language]);
}

const LanguageContext = createContext<ReturnType<typeof useLanguageState> | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useLanguageState();
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
