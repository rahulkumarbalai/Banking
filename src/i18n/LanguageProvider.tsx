import type { ReactNode } from 'react';
import { LanguageContext, useLanguageState } from './LanguageContext';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useLanguageState();
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
