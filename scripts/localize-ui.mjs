import ts from 'typescript';
import fs from 'node:fs';

const files = ['src/components/Layout.tsx', ...fs.readdirSync('src/pages').map(f => `src/pages/${f}`)];
const catalogSource = fs.readFileSync('src/i18n/messages.ts', 'utf8');
const catalog = ts.createSourceFile('messages.ts', catalogSource, ts.ScriptTarget.Latest, true);
const keys = new Set();
function readKeys(node) {
  if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) keys.add(node.name.text);
  ts.forEachChild(node, readKeys);
}
readKeys(catalog);
const replacements = [
  ['{shareMembers.length} Share • {borrowerMembers.length} Borrower', '{tr("{shares} Share • {borrowers} Borrower", { shares: shareMembers.length, borrowers: borrowerMembers.length })}'],
  ['Distributing <strong className="font-mono text-emerald-400">₹{fmt(globalState.totalInterestCollected)}</strong> across {summary.length} share member(s) based on equity %.', '{tr("Distributing ₹{amount} across {count} share member(s) based on equity %.", { amount: fmt(globalState.totalInterestCollected), count: summary.length })}'],
  ['Export CSV ({filteredTransactions.length})', '{tr("Export CSV ({count})", { count: filteredTransactions.length })}'],
  ['out of {allTransactions.length} total logs', '{tr("out of {count} total logs", { count: allTransactions.length })}'],
  ['All Members ({users.length})', '{tr("All Members ({count})", { count: users.length })}'],
  ['Showing <strong className="text-slate-200">{filteredTransactions.length}</strong> transaction logs', '{tr("Showing {count} transaction logs", { count: filteredTransactions.length })}'],
  ['{activeLoans.length} active loan issue(s)', '{tr("{count} active loan issue(s)", { count: activeLoans.length })}'],
  ['{activeLoans.length} Active', '{tr("{count} Active", { count: activeLoans.length })}'],
  ['Full (₹{fmt(loan.outstandingPrincipal + interestDue)})', '{tr("Full (₹{amount})", { amount: fmt(loan.outstandingPrincipal + interestDue) })}'],
  ['Interest (₹{fmt(interestDue)})', '{tr("Interest (₹{amount})", { amount: fmt(interestDue) })}'],
  ['Deposit recurring share amount of <strong className="font-mono text-blue-400">₹{user.monthlyShareAmount.toLocaleString()}</strong> for {user.name}?', '{tr("Deposit recurring share amount of ₹{amount} for {name}?", { amount: fmt(user.monthlyShareAmount), name: user.name })}'],
  ['Issue Loan to {user.name}', '{tr("Issue Loan to {name}", { name: user.name })}'],
  ['(₹{fmt(repayLoan.outstandingPrincipal)} Principal + ₹{fmt(repayLoan.outstandingInterest)} Interest)', '{tr("(₹{principal} Principal + ₹{interest} Interest)", { principal: fmt(repayLoan.outstandingPrincipal), interest: fmt(repayLoan.outstandingInterest) })}'],
  ['(₹{fmt(parseFloat(partialAmount) || 0)} Principal + ₹{fmt(payInterest ? repayLoan.outstandingInterest : 0)} Interest)', '{tr("(₹{principal} Principal + ₹{interest} Interest)", { principal: fmt(parseFloat(partialAmount) || 0), interest: fmt(payInterest ? repayLoan.outstandingInterest : 0) })}'],
  ['placeholder={`Max ₹${fmt(repayLoan.outstandingPrincipal)}`}', 'placeholder={tr("Max ₹{amount}", { amount: fmt(repayLoan.outstandingPrincipal) })}'],
  ['Pay outstanding interest (₹{fmt(repayLoan.outstandingInterest)})', '{tr("Pay outstanding interest (₹{amount})", { amount: fmt(repayLoan.outstandingInterest) })}'],
  ['Principal remains unchanged at ₹{fmt(repayLoan.outstandingPrincipal)}.', '{tr("Principal remains unchanged at ₹{amount}.", { amount: fmt(repayLoan.outstandingPrincipal) })}'],
  ['All ({users.length})', '{tr("All ({count})", { count: users.length })}'],
  ["Share Members ({users.filter((u) => u.memberType === 'share').length})", '{tr("Share Members ({count})", { count: users.filter((u) => u.memberType === \'share\').length })}'],
  ["Borrowers Only ({users.filter((u) => u.memberType === 'borrower').length})", '{tr("Borrowers Only ({count})", { count: users.filter((u) => u.memberType === \'borrower\').length })}'],
  ["Switch to {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode", "{theme.palette.mode === 'dark' ? tr('Light Mode') : tr('Dark Mode')}"],
];
const missed = [];
for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  for (const [from, to] of replacements) source = source.replaceAll(from, to);
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, ' ').trim();
      if (keys.has(text)) {
        const leading = /^\s/.test(node.text) && !/[\r\n]/.test(node.text) ? ' ' : '';
        const trailing = /\s$/.test(node.text) && !/[\r\n]/.test(node.text) ? ' ' : '';
        edits.push([node.pos, node.end, `${leading}{tr(${JSON.stringify(text)})}${trailing}`]);
      } else if (/[a-zA-Z]/.test(text) && !["Patil's Bank", 'Vivek Patil'].includes(text)) missed.push(`${file}: ${text}`);
    }
    if (ts.isStringLiteral(node) && keys.has(node.text)) {
      const parent = node.parent;
      if (ts.isCallExpression(parent) && ['tr', 'setError'].includes(parent.expression.getText(ast))) return;
      const value = `tr(${JSON.stringify(node.text)})`;
      edits.push([node.getStart(ast), node.end, ts.isJsxAttribute(parent) ? `{${value}}` : value]);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + replacement + source.slice(end);
  source = "import { useLanguage } from '../i18n/LanguageContext';\n" + source;
  const hasFmt = source.includes('const fmt =');
  source = source.replace(/^const fmt = .*\r?\n/m, '');
  const extras = file.endsWith('Layout.tsx') ? ', language, setLanguage, fmt' : hasFmt ? ', fmt' : '';
  source = source.replace(/(export const \w+: React.FC = \(\) => \{)/, `$1\n  const { tr${extras} } = useLanguage();`);
  fs.writeFileSync(file, source);
}
console.log(missed.join('\n'));
