import { marathi, type MessageKey } from './messages';
import type { Transaction } from '../services/types';

export type Language = 'en' | 'mr';
export type MessageValues = Record<string, string | number>;
export const LANGUAGE_STORAGE_KEY = 'banking-language';

export function resolveLanguage(saved: string | null, browserLanguages: readonly string[] = []): Language {
  if (saved === 'en' || saved === 'mr') return saved;
  return browserLanguages[0]?.toLowerCase().startsWith('mr') ? 'mr' : 'en';
}

export function translate(language: Language, key: MessageKey, values: MessageValues = {}): string {
  const message = language === 'mr' ? marathi[key] : key;
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : placeholder,
  );
}

// API errors remain language-neutral in storage and are translated when shown.
export function translateError(language: Language, message: string): string {
  return Object.hasOwn(marathi, message) ? translate(language, message as MessageKey) : message;
}

const transactionMessages: Record<Transaction['type'], MessageKey> = {
  deposit: 'Share Deposit', borrow: 'Loan Disbursed', repay_full: 'Full Repayment',
  repay_partial: 'Partial Repayment', interest_only: 'Interest Only Payment',
  withdraw: 'Share Withdrawal', interest_distribution: 'Interest Distribution',
};

export function transactionLabel(language: Language, type: Transaction['type']): string {
  return translate(language, transactionMessages[type]);
}

// Only translate recognized system-generated descriptions. Historical entries
// remain intact in storage, and arbitrary notes and member names are preserved.
const descriptionPatterns: [RegExp, MessageKey, string[]][] = [
  [/^Monthly share deposit of ₹(.+) by (.+)$/, 'Monthly share deposit of ₹{amount} by {name}', ['amount', 'name']],
  [/^Borrowed ₹(.+) at (.+)% interest$/, 'Borrowed ₹{amount} at {rate}% interest', ['amount', 'rate']],
  [/^Full repayment — ₹(.+) principal \+ ₹(.+) interest \((.+)%\)$/, 'Full repayment — ₹{principal} principal + ₹{interest} interest ({rate}%)', ['principal', 'interest', 'rate']],
  [/^Partial repayment — ₹(.+) principal\. Remaining Principal: ₹(.+)$/, 'Partial repayment — ₹{principal} principal. Remaining Principal: ₹{remaining}', ['principal', 'remaining']],
  [/^Partial repayment — ₹(.+) principal \+ ₹(.+) (?:outstanding )?interest\. Remaining Principal: ₹(.+)$/, 'Partial repayment — ₹{principal} principal + ₹{interest} outstanding interest. Remaining Principal: ₹{remaining}', ['principal', 'interest', 'remaining']],
  [/^Interest-only payment of ₹(.+) on ₹(.+) outstanding \((.+)%\)$/, 'Interest-only payment of ₹{interest} on ₹{principal} outstanding ({rate}%)', ['interest', 'principal', 'rate']],
  [/^Share withdrawal of ₹(.+) by (.+)$/, 'Share withdrawal of ₹{amount} by {name}', ['amount', 'name']],
  [/^Interest distribution — ₹(.+) \((.+)% share of ₹(.+) pool\)$/, 'Interest distribution — ₹{amount} ({share}% share of ₹{pool} pool)', ['amount', 'share', 'pool']],
];

export function describeTransaction(language: Language, description: string): string {
  if (language === 'en') return description;
  for (const [pattern, key, names] of descriptionPatterns) {
    const match = pattern.exec(description);
    if (match) return translate(language, key, Object.fromEntries(names.map((name, i) => [name, match[i + 1]])));
  }
  return description;
}
