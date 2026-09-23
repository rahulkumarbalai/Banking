import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Exercise the TypeScript helpers without adding a test runtime dependency.
const moduleURL = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString('base64')}`;
const messagesURL = moduleURL(readFileSync(new URL('../src/i18n/messages.ts', import.meta.url), 'utf8'));
const coreURL = moduleURL(readFileSync(new URL('../src/i18n/core.ts', import.meta.url), 'utf8').replace("'./messages'", JSON.stringify(messagesURL)));
const sharesURL = moduleURL(readFileSync(new URL('../src/services/shares.ts', import.meta.url), 'utf8'));
const memberLedgerURL = moduleURL(readFileSync(new URL('../src/services/memberLedgerExport.ts', import.meta.url), 'utf8'));
const { marathi } = await import(messagesURL);
const { resolveLanguage, translate, translateError, transactionLabel, describeTransaction } = await import(coreURL);
const { getFixedSharePercent, getTotalMonthlyShareValue } = await import(sharesURL);
const { MEMBER_LEDGER_HEADERS, buildMemberLedgerRows, memberLedgerRowValues } = await import(memberLedgerURL);

test('saved preference wins; invalid preferences use the browser language', () => {
  assert.equal(resolveLanguage('en', ['mr-IN']), 'en');
  assert.equal(resolveLanguage('mr', ['en-IN']), 'mr');
  assert.equal(resolveLanguage(null, ['mr-IN']), 'mr');
  assert.equal(resolveLanguage('invalid', ['en-US']), 'en');
  assert.equal(resolveLanguage(null, []), 'en');
});

test('every translation is nonempty Marathi and preserves interpolation values', () => {
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [english, translated] of Object.entries(marathi)) {
    assert.match(translated, /[\u0900-\u097f]/, english);
    assert.deepEqual(placeholders(translated), placeholders(english), english);
    assert.equal(translate('en', english), english);
  }
});

test('interpolation handles Marathi word order, zero, and literal user input', () => {
  assert.equal(translate('mr', 'Issue Loan to {name}', { name: 'राहुल {amount} $&' }), 'राहुल {amount} $& यांना कर्ज द्या');
  assert.equal(translate('mr', 'All ({count})', { count: 0 }), 'सर्व (0)');
  assert.equal(translate('en', 'Max ₹{amount}', { amount: '1,00,000.00' }), 'Max ₹1,00,000.00');
});

test('API errors translate with an intact fallback for unknown messages', () => {
  assert.equal(translateError('mr', 'Not enough funds in the lending pool'), 'कर्ज देण्यासाठी पुरेसा निधी उपलब्ध नाही');
  assert.equal(translateError('mr', 'Unexpected storage error'), 'Unexpected storage error');
});

test('all seven banking transaction types have translated labels', () => {
  for (const type of ['deposit', 'borrow', 'repay_full', 'repay_partial', 'interest_only', 'withdraw', 'interest_distribution']) {
    assert.match(transactionLabel('mr', type), /[\u0900-\u097f]/);
  }
});

test('stored transaction descriptions translate without changing names or amounts', () => {
  const entries = [
    'Monthly share deposit of ₹1,000.00 by Rahul Patil',
    'Borrowed ₹5,000.00 at 3% interest',
    'Full repayment — ₹5,000.00 principal + ₹150.00 interest (3%)',
    'Partial repayment — ₹500.00 principal. Remaining Principal: ₹4,500.00',
    'Partial repayment — ₹500.00 principal + ₹150.00 outstanding interest. Remaining Principal: ₹4,500.00',
    'Interest-only payment of ₹150.00 on ₹5,000.00 outstanding (3%)',
    'Share withdrawal of ₹500.00 by Rahul Patil',
    'Interest distribution — ₹150.00 (50.0% share of ₹300.00 pool)',
  ];
  for (const entry of entries) {
    const translated = describeTransaction('mr', entry);
    assert.match(translated, /[\u0900-\u097f]/);
    for (const amount of entry.match(/₹[\d,.]+/g)) assert.ok(translated.includes(amount), amount);
    if (entry.includes('Rahul Patil')) assert.ok(translated.includes('Rahul Patil'));
    assert.equal(describeTransaction('en', entry), entry);
  }
  assert.equal(describeTransaction('mr', 'Custom note: paid by cheque'), 'Custom note: paid by cheque');
});

test('share equity is fixed by monthly share value, not deposits or payment status', () => {
  const rahul = { id: '1', memberType: 'share', monthlyShareAmount: 500, totalDeposited: 500 };
  const seema = { id: '2', memberType: 'share', monthlyShareAmount: 1500, totalDeposited: 6000 };
  const borrower = { id: '3', memberType: 'borrower', monthlyShareAmount: 0, totalDeposited: 0 };
  const members = [rahul, seema, borrower];

  assert.equal(getTotalMonthlyShareValue(members), 2000);
  assert.equal(getFixedSharePercent(rahul, members), 25);

  rahul.totalDeposited += rahul.monthlyShareAmount;
  assert.equal(getFixedSharePercent(rahul, members), 25, 'another monthly deposit must not change ownership');

  const newMember = { id: '4', memberType: 'share', monthlyShareAmount: 500, totalDeposited: 0 };
  assert.equal(getFixedSharePercent(rahul, [...members, newMember]), 20, 'a new configured share changes ownership');
});

test('member ledger export matches the 16-column reference table', () => {
  assert.deepEqual(MEMBER_LEDGER_HEADERS.mr, [
    'अ.क्र.', 'फंड धारकाचे नाव', 'शेअर्स', 'फंड जमा', 'व्याज जमा', 'मुद्दल जमा', 'दंड जमा',
    'व्याजी रक्कम', 'फंड', 'महिने', 'फंड येणे रक्कम', 'एकूण व्याजी असलेली रक्कम',
    'एकूण व्याज येणे बाकी', 'व्याज बाकी', 'दंड बाकी', 'एकूण जमा करावयाची रक्कम',
  ]);

  const rows = buildMemberLedgerRows({
    monthKey: '2026-09',
    users: [{ id: 'member-1', name: 'राहुल पाटील', memberType: 'share', monthlyShareAmount: 3000 }],
    loans: [{ userId: 'member-1', outstandingPrincipal: 9500, totalInterestPaid: 100, outstandingInterest: 300 }],
    transactions: [
      { userId: 'member-1', type: 'deposit', amount: 3000, date: '2026-09-05T12:00:00' },
      { userId: 'member-1', type: 'borrow', amount: 10000, date: '2026-09-06T12:00:00' },
      { userId: 'member-1', type: 'repay_partial', amount: 600, principalPaid: 500, interestPaid: 100, date: '2026-09-10T12:00:00' },
      { userId: 'member-1', type: 'deposit', amount: 3000, date: '2026-08-05T12:00:00' },
    ],
  });

  assert.equal(rows.length, 1);
  assert.deepEqual(memberLedgerRowValues(rows[0]), [
    1, 'राहुल पाटील', 30, 3000, 100, 500, 0, 10000, 3000, 1, 3000, 9500, 400, 300, 0, 12800,
  ]);
});
