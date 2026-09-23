import type { Language } from '../i18n/core';
import type { Loan, Transaction, User } from './types';

export const SHARE_FACE_VALUE = 100;

export const MEMBER_LEDGER_HEADERS = {
  en: [
    'Sr. No.',
    'Fund Holder Name',
    'Shares',
    'Fund Deposited',
    'Interest Deposited',
    'Principal Deposited',
    'Penalty Deposited',
    'Interest-Bearing Amount',
    'Fund',
    'Months',
    'Fund Receivable',
    'Total Interest-Bearing Amount',
    'Total Interest Receivable',
    'Interest Balance',
    'Penalty Balance',
    'Total Amount to Deposit',
  ],
  mr: [
    'अ.क्र.',
    'फंड धारकाचे नाव',
    'शेअर्स',
    'फंड जमा',
    'व्याज जमा',
    'मुद्दल जमा',
    'दंड जमा',
    'व्याजी रक्कम',
    'फंड',
    'महिने',
    'फंड येणे रक्कम',
    'एकूण व्याजी असलेली रक्कम',
    'एकूण व्याज येणे बाकी',
    'व्याज बाकी',
    'दंड बाकी',
    'एकूण जमा करावयाची रक्कम',
  ],
} as const;

export interface MemberLedgerRow {
  serialNumber: number;
  fundHolderName: string;
  shares: number;
  fundDeposited: number;
  interestDeposited: number;
  principalDeposited: number;
  penaltyDeposited: number;
  interestBearingAmount: number;
  fund: number;
  months: number;
  fundReceivable: number;
  totalInterestBearingAmount: number;
  totalInterestReceivable: number;
  interestBalance: number;
  penaltyBalance: number;
  totalAmountToDeposit: number;
}

interface MemberLedgerInput {
  users: User[];
  loans: Loan[];
  transactions: Transaction[];
  monthKey: string;
}

const isInMonth = (date: string, monthKey: string): boolean => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  const transactionMonth = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  return transactionMonth === monthKey;
};

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export function buildMemberLedgerRows({
  users,
  loans,
  transactions,
  monthKey,
}: MemberLedgerInput): MemberLedgerRow[] {
  return users.map((user, index) => {
    const memberTransactions = transactions.filter(
      (transaction) => transaction.userId === user.id && isInMonth(transaction.date, monthKey),
    );
    const memberLoans = loans.filter((loan) => loan.userId === user.id);
    const fundDeposited = sum(
      memberTransactions.filter((transaction) => transaction.type === 'deposit').map((transaction) => transaction.amount),
    );
    const interestDeposited = sum(memberTransactions.map((transaction) => transaction.interestPaid ?? 0));
    const principalDeposited = sum(memberTransactions.map((transaction) => transaction.principalPaid ?? 0));
    const interestBearingAmount = sum(
      memberTransactions.filter((transaction) => transaction.type === 'borrow').map((transaction) => transaction.amount),
    );
    const totalInterestBearingAmount = sum(memberLoans.map((loan) => loan.outstandingPrincipal));
    const interestBalance = sum(memberLoans.map((loan) => loan.outstandingInterest));
    const totalInterestReceivable = sum(
      memberLoans.map((loan) => loan.totalInterestPaid + loan.outstandingInterest),
    );
    const fund = user.memberType === 'share' ? user.monthlyShareAmount : 0;
    const fundReceivable = fund;

    return {
      serialNumber: index + 1,
      fundHolderName: user.name,
      shares: fund / SHARE_FACE_VALUE,
      fundDeposited,
      interestDeposited,
      principalDeposited,
      penaltyDeposited: 0,
      interestBearingAmount,
      fund,
      months: 1,
      fundReceivable,
      totalInterestBearingAmount,
      totalInterestReceivable,
      interestBalance,
      penaltyBalance: 0,
      totalAmountToDeposit: fundReceivable + totalInterestBearingAmount + interestBalance,
    };
  });
}

export const memberLedgerRowValues = (row: MemberLedgerRow): (string | number)[] => [
  row.serialNumber,
  row.fundHolderName,
  row.shares,
  row.fundDeposited,
  row.interestDeposited,
  row.principalDeposited,
  row.penaltyDeposited,
  row.interestBearingAmount,
  row.fund,
  row.months,
  row.fundReceivable,
  row.totalInterestBearingAmount,
  row.totalInterestReceivable,
  row.interestBalance,
  row.penaltyBalance,
  row.totalAmountToDeposit,
];

function ledgerPeriodLabel(monthKey: string, language: Language): string {
  const [year, month] = monthKey.split('-').map(Number);
  const period = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(language === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(period);
}

export async function createMemberLedgerWorkbook(
  rows: MemberLedgerRow[],
  monthKey: string,
  language: Language,
): Promise<Blob> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = "Patil's Bank";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(language === 'mr' ? 'निधी खातेवही' : 'Fund Ledger', {
    views: [{ state: 'frozen', ySplit: 2 }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });
  worksheet.properties.defaultRowHeight = 22;
  worksheet.pageSetup.printTitlesRow = '1:2';

  worksheet.columns = [
    { width: 8 }, { width: 30 }, { width: 10 }, { width: 15 },
    { width: 15 }, { width: 15 }, { width: 14 }, { width: 18 },
    { width: 13 }, { width: 10 }, { width: 17 }, { width: 22 },
    { width: 20 }, { width: 15 }, { width: 14 }, { width: 22 },
  ];

  const period = ledgerPeriodLabel(monthKey, language);
  worksheet.mergeCells('A1:P1');
  worksheet.getCell('A1').value = language === 'mr'
    ? `${period} पर्यंत फंड, व्याज व बाकी येणे असलेल्या रकमेचा तपशील खालीलप्रमाणे:-`
    : `Fund, interest and outstanding amount details through ${period}`;
  worksheet.getCell('A1').font = { name: language === 'mr' ? 'Nirmala UI' : 'Arial', size: 13, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(1).height = 28;

  const headerRow = worksheet.addRow([...MEMBER_LEDGER_HEADERS[language]]);
  headerRow.height = 62;
  headerRow.eachCell((cell) => {
    cell.font = { name: language === 'mr' ? 'Nirmala UI' : 'Arial', size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  rows.forEach((row) => {
    const excelRow = worksheet.addRow(memberLedgerRowValues(row));
    excelRow.height = 23;
    excelRow.eachCell((cell, columnNumber) => {
      cell.font = { name: language === 'mr' ? 'Nirmala UI' : 'Arial', size: 10 };
      cell.alignment = {
        horizontal: columnNumber === 2 ? 'left' : columnNumber === 1 || columnNumber === 3 || columnNumber === 10 ? 'center' : 'right',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF808080' } },
        left: { style: 'thin', color: { argb: 'FF808080' } },
        bottom: { style: 'thin', color: { argb: 'FF808080' } },
        right: { style: 'thin', color: { argb: 'FF808080' } },
      };
      if (columnNumber === 3) cell.numFmt = '0.##';
      if (columnNumber >= 4 && columnNumber !== 10) cell.numFmt = '#,##0.00';
    });
  });

  worksheet.autoFilter = { from: 'A2', to: `P${Math.max(rows.length + 2, 2)}` };
  worksheet.pageSetup.printArea = `A1:P${Math.max(rows.length + 2, 2)}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
