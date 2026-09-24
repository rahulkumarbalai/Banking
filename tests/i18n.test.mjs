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
const monthlySharesURL = moduleURL(readFileSync(new URL('../src/services/monthlyShares.ts', import.meta.url), 'utf8'));
const loanInterestURL = moduleURL(readFileSync(new URL('../src/services/loanInterest.ts', import.meta.url), 'utf8'));
const storeURL = moduleURL(
  readFileSync(new URL('../src/services/store.ts', import.meta.url), 'utf8')
    .replace("import { v4 as uuidv4 } from 'uuid';", "const uuidv4 = (() => { let id = 0; return () => 'test-' + (++id); })();")
    .replace("'./shares'", JSON.stringify(sharesURL))
    .replace("'./monthlyShares'", JSON.stringify(monthlySharesURL))
    .replace("'./loanInterest'", JSON.stringify(loanInterestURL)),
);
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};
const { marathi } = await import(messagesURL);
const { resolveLanguage, translate, translateError, transactionLabel, describeTransaction } = await import(coreURL);
const { getFixedSharePercent, getTotalMonthlyShareValue } = await import(sharesURL);
const { MEMBER_LEDGER_HEADERS, buildMemberLedgerRows, memberLedgerRowValues } = await import(memberLedgerURL);
const { getLocalMonthKey, hasMonthlyShareDeposit, getPendingShareMembers } = await import(monthlySharesURL);
const { getLoanInterestAccrual, nextLoanMonthDate, normalizeIncompleteInterestAmount } = await import(loanInterestURL);
const { api } = await import(storeURL);

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

test('monthly share status allows only one deposit for each member and calendar month', () => {
  const september = new Date(2026, 8, 15, 12);
  const october = new Date(2026, 9, 1, 12);
  const transactions = [
    { userId: 'paid', type: 'deposit', date: new Date(2026, 8, 30, 12).toISOString() },
    { userId: 'other', type: 'deposit', date: new Date(2026, 8, 5, 12).toISOString() },
    { userId: 'paid', type: 'borrow', date: new Date(2026, 9, 5, 12).toISOString() },
    { userId: 'paid', type: 'deposit', date: 'not-a-date' },
  ];

  assert.equal(getLocalMonthKey('not-a-date'), null);
  assert.equal(hasMonthlyShareDeposit(transactions, 'paid', september), true);
  assert.equal(hasMonthlyShareDeposit(transactions, 'paid', october), false);
  assert.equal(hasMonthlyShareDeposit(transactions, 'missing', september), false);

  const members = [
    { id: 'paid', memberType: 'share' },
    { id: 'pending', memberType: 'share' },
    { id: 'borrower', memberType: 'borrower' },
  ];
  assert.deepEqual(
    getPendingShareMembers(members, transactions, september).map(member => member.id),
    ['pending'],
  );
});

test('loan interest starts after a full loan month and completed periods are idempotent', () => {
  const issuedAt = new Date(2026, 0, 15, 10);
  const firstDueAt = new Date(2026, 1, 15, 10);
  const secondDueAt = new Date(2026, 2, 15, 10);
  const loan = {
    date: issuedAt.toISOString(),
    lastInterestAppliedDate: issuedAt.toISOString(),
    outstandingPrincipal: 10000,
    outstandingInterest: 0,
    interestRatePercent: 3,
  };

  const beforeDue = getLoanInterestAccrual(loan, new Date(firstDueAt.getTime() - 1));
  assert.equal(beforeDue.completedMonths, 0);
  assert.equal(beforeDue.totalCompletedInterestDue, 0);
  assert.equal(beforeDue.incompleteMonthMaximum, 300);

  const atDue = getLoanInterestAccrual(loan, firstDueAt);
  assert.equal(atDue.completedMonths, 1);
  assert.equal(atDue.newlyCompletedInterest, 300);
  assert.equal(atDue.hasIncompleteMonth, false);

  const appliedLoan = {
    ...loan,
    lastInterestAppliedDate: atDue.accruedThroughDate,
    outstandingInterest: atDue.totalCompletedInterestDue,
  };
  const repeated = getLoanInterestAccrual(appliedLoan, firstDueAt);
  assert.equal(repeated.completedMonths, 0);
  assert.equal(repeated.totalCompletedInterestDue, 300);

  const caughtUp = getLoanInterestAccrual(loan, secondDueAt);
  assert.equal(caughtUp.completedMonths, 2);
  assert.equal(caughtUp.newlyCompletedInterest, 600);
});

test('loan-month anniversaries preserve month-end dates and incomplete interest can be reduced', () => {
  const januaryIssue = new Date(2024, 0, 31, 8, 30);
  const februaryDue = nextLoanMonthDate(januaryIssue, 31);
  const marchDue = nextLoanMonthDate(februaryDue, 31);
  assert.deepEqual(
    [februaryDue.getFullYear(), februaryDue.getMonth(), februaryDue.getDate(), februaryDue.getHours(), februaryDue.getMinutes()],
    [2024, 1, 29, 8, 30],
  );
  assert.deepEqual(
    [marchDue.getFullYear(), marchDue.getMonth(), marchDue.getDate(), marchDue.getHours(), marchDue.getMinutes()],
    [2024, 2, 31, 8, 30],
  );

  const resetAt = new Date(2026, 1, 20, 10);
  const resetDueAt = new Date(2026, 2, 20, 10);
  const resetCycleLoan = {
    date: new Date(2026, 0, 15, 10).toISOString(),
    lastInterestAppliedDate: resetAt.toISOString(),
    interestCycleDay: 20,
    outstandingPrincipal: 9000,
    outstandingInterest: 0,
    interestRatePercent: 3,
  };
  assert.equal(getLoanInterestAccrual(resetCycleLoan, new Date(resetDueAt.getTime() - 1)).completedMonths, 0);
  assert.equal(getLoanInterestAccrual(resetCycleLoan, resetDueAt).newlyCompletedInterest, 270);

  assert.equal(normalizeIncompleteInterestAmount(125.555, 300), 125.56);
  assert.throws(() => normalizeIncompleteInterestAmount(301, 300), /Invalid incomplete month interest amount/);
  assert.throws(() => normalizeIncompleteInterestAmount(-1, 300), /Invalid incomplete month interest amount/);
});

test('store enforces monthly deposits and full-month loan interest rules', () => {
  api.resetAllData();

  const shareMember = api.addUser('Fund Member', '', 'share', 50000);
  api.depositShare(shareMember.id, 50000);
  const beforeDuplicate = api.getGlobalState().totalLendingPool;
  const beforeTransactionCount = api.getTransactions().length;
  assert.throws(
    () => api.depositShare(shareMember.id, 50000),
    /Monthly share already deposited for this month/,
  );
  assert.equal(api.getGlobalState().totalLendingPool, beforeDuplicate);
  assert.equal(api.getTransactions().length, beforeTransactionCount);

  const backdateLoan = loanId => {
    const data = JSON.parse(localStorage.getItem('banking_app_data'));
    const loan = data.loans.find(item => item.id === loanId);
    const issuedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    loan.date = issuedAt.toISOString();
    loan.lastInterestAppliedDate = loan.date;
    loan.interestCycleDay = issuedAt.getDate();
    localStorage.setItem('banking_app_data', JSON.stringify(data));
  };

  const borrower = api.addUser('Early Borrower', '', 'borrower', 0);
  const earlyLoan = api.borrowMoney(borrower.id, 10000, 3).loan;
  assert.equal(earlyLoan.outstandingInterest, 0);
  backdateLoan(earlyLoan.id);

  const waived = api.repayFull(borrower.id, earlyLoan.id, 0);
  assert.equal(waived.principalPaid, 10000);
  assert.equal(waived.interestPaid, 0);
  assert.equal(waived.amount, 10000);
  assert.equal(waived.incompleteInterestWaived, 300);

  const reducedBorrower = api.addUser('Reduced Interest Borrower', '', 'borrower', 0);
  const reducedLoan = api.borrowMoney(reducedBorrower.id, 10000, 3).loan;
  backdateLoan(reducedLoan.id);
  const reduced = api.repayFull(reducedBorrower.id, reducedLoan.id, 125);
  assert.equal(reduced.interestPaid, 125);
  assert.equal(reduced.amount, 10125);
  assert.equal(reduced.incompleteInterestCharged, 125);
  assert.equal(reduced.incompleteInterestWaived, 175);

  const matureBorrower = api.addUser('Mature Borrower', '', 'borrower', 0);
  const matureLoan = api.borrowMoney(matureBorrower.id, 10000, 3).loan;
  const stored = JSON.parse(localStorage.getItem('banking_app_data'));
  const storedLoan = stored.loans.find(loan => loan.id === matureLoan.id);
  const matureIssuedAt = new Date(2026, 0, 15, 10);
  const matureAsOf = new Date(2026, 2, 15, 10);
  storedLoan.date = matureIssuedAt.toISOString();
  storedLoan.lastInterestAppliedDate = storedLoan.date;
  storedLoan.interestCycleDay = 15;
  localStorage.setItem('banking_app_data', JSON.stringify(stored));

  const result = api.applyMonthlyInterest(matureAsOf);
  assert.deepEqual(result, { loansUpdated: 1, monthsApplied: 2, interestAdded: 600 });
  assert.equal(api.getLoan(matureLoan.id).outstandingInterest, 600);

  const repeated = api.applyMonthlyInterest(matureAsOf);
  assert.deepEqual(repeated, { loansUpdated: 0, monthsApplied: 0, interestAdded: 0 });
  assert.equal(api.getLoan(matureLoan.id).outstandingInterest, 600);
});
