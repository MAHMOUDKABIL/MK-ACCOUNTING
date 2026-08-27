import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Search,
  Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, CompanyProfile, JournalEntry } from '../types/accounting';

interface GeneralLedgerViewProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  companyProfile: CompanyProfile;
  initialAccountCode?: string;
}

export const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({
  accounts,
  journalEntries,
  companyProfile,
  initialAccountCode = '1242', // default to National Bank of Egypt
}) => {
  const [selectedCode, setSelectedCode] = useState<string>(initialAccountCode);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const subAccounts = useMemo(() => accounts.filter((a) => a.type === 'sub'), [accounts]);
  const currentAccount = useMemo(() => accounts.find((a) => a.code === selectedCode), [accounts, selectedCode]);

  // Compute ledger lines
  const ledgerData = useMemo(() => {
    if (!currentAccount) return null;

    const postedEntries = journalEntries
      .filter((e) => e.isPosted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = Number(currentAccount.openingBalance || 0);

    const rows: Array<{
      date: string;
      entryNumber: string;
      docRef?: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    // Opening balance row
    rows.push({
      date: 'بداية العام',
      entryNumber: 'رصيد افتتاحي',
      docRef: '-',
      description: 'الرصيد الافتتاحي المنقول من السنة السابقة',
      debit: currentAccount.nature === 'debit' && runningBalance >= 0 ? runningBalance : 0,
      credit: currentAccount.nature === 'credit' && runningBalance >= 0 ? runningBalance : 0,
      balance: runningBalance,
    });

    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    for (const entry of postedEntries) {
      if (startDate && entry.date < startDate) continue;
      if (endDate && entry.date > endDate) continue;

      for (const line of entry.lines) {
        if (line.accountCode === selectedCode) {
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);

          if (currentAccount.nature === 'debit') {
            runningBalance += debit - credit;
          } else {
            runningBalance += credit - debit;
          }

          totalPeriodDebit += debit;
          totalPeriodCredit += credit;

          rows.push({
            date: entry.date,
            entryNumber: entry.formattedNumber,
            docRef: entry.referenceDoc,
            description: line.note || entry.description,
            debit,
            credit,
            balance: runningBalance,
          });
        }
      }
    }

    return {
      rows,
      totalPeriodDebit,
      totalPeriodCredit,
      closingBalance: runningBalance,
    };
  }, [currentAccount, journalEntries, selectedCode, startDate, endDate]);

  const handleExportCsv = () => {
    if (!ledgerData || !currentAccount) return;

    let csv = `كشف حساب أستاذ عام - ${companyProfile.name}\n`;
    csv += `الحساب:,${currentAccount.code} - ${currentAccount.name}\n`;
    csv += `طبيعة الحساب:,${currentAccount.nature === 'debit' ? 'مدين' : 'دائن'}\n`;
    csv += `تاريخ التصدير:,${new Date().toLocaleDateString('ar-EG')}\n\n`;
    csv += `التاريخ,رقم القيد,المستند المرجعي,البيان,مدين,دائن,الرصيد\n`;

    for (const row of ledgerData.rows) {
      csv += `"${row.date}","${row.entryNumber}","${row.docRef || ''}","${row.description.replace(/"/g, '""')}",${row.debit},${row.credit},${row.balance}\n`;
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ledger_${currentAccount.code}_${currentAccount.name}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Account Picker */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <FileSpreadsheet className="w-5 h-5 text-sky-600" />
            دفتر الأستاذ العام والأستاذ المساعد (General Ledger)
          </h2>
          <p className="text-xs text-slate-500">
            كشف حركة الحسابات التفصيلية، احتساب الرصيد التراكمي الجاري، وتتبع القيود اليومية
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-600" />
            <span>طباعة كشف الحساب A4</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>تصدير Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Account Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs no-print">
        <div className="md:col-span-2">
          <label className="block text-slate-600 font-semibold mb-1">اختر الحساب المحاسبي المراد عرضه *</label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          >
            {subAccounts.map((acc) => (
              <option key={acc.code} value={acc.code}>
                {acc.code} - {acc.name} ({acc.nature === 'debit' ? 'طبيعة مدينة' : 'طبيعة دائنة'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">من تاريخ</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Account Info Banner */}
      {currentAccount && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {currentAccount.code}
              </span>
              <h3 className="text-base font-black text-slate-900 font-cairo">{currentAccount.name}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  currentAccount.nature === 'debit'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                طبيعة: {currentAccount.nature === 'debit' ? 'مدين (Debit)' : 'دائن (Credit)'}
              </span>
            </div>
            <p className="text-slate-500">
              التبويب: {currentAccount.category} | الرصيد الافتتاحي:{' '}
              <strong className="text-slate-800 font-mono">
                {Number(currentAccount.openingBalance || 0).toLocaleString()} ج.م
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 font-mono">
            <div>
              <div className="text-[10px] text-slate-500 font-sans font-medium">حركة المدين للفترة</div>
              <div className="text-sm font-bold text-slate-900">
                {ledgerData?.totalPeriodDebit.toLocaleString()} ج.م
              </div>
            </div>
            <div className="border-r border-slate-200 pr-6">
              <div className="text-[10px] text-slate-500 font-sans font-medium">حركة الدائن للفترة</div>
              <div className="text-sm font-bold text-slate-700">
                {ledgerData?.totalPeriodCredit.toLocaleString()} ج.م
              </div>
            </div>
            <div className="border-r border-slate-200 pr-6">
              <div className="text-[10px] text-slate-500 font-sans font-medium">الرصيد الختامي الحالي</div>
              <div className="text-sm font-black text-sky-700">
                {ledgerData?.closingBalance.toLocaleString()} ج.م
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                <th className="py-3 px-4 w-28">التاريخ</th>
                <th className="py-3 px-4 w-32">رقم القيد</th>
                <th className="py-3 px-4 w-28">المستند</th>
                <th className="py-3 px-4">شرح وبيان الحركة المحاسبية</th>
                <th className="py-3 px-4 w-32 text-left">مدين (ج.م)</th>
                <th className="py-3 px-4 w-32 text-left">دائن (ج.م)</th>
                <th className="py-3 px-4 w-36 text-left">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {ledgerData?.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    idx === 0 ? 'bg-slate-50/50 font-semibold text-slate-700' : 'text-slate-700'
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono text-slate-500">{row.date}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-sky-600">{row.entryNumber}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{row.docRef || '-'}</td>
                  <td className="py-2.5 px-4 text-slate-800 font-medium">{row.description}</td>
                  <td className="py-2.5 px-4 font-mono text-left font-bold text-slate-900">
                    {row.debit > 0 ? `${Number(row.debit).toLocaleString()} ج.م` : '-'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-left font-bold text-slate-700">
                    {row.credit > 0 ? `${Number(row.credit).toLocaleString()} ج.م` : '-'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-left font-black text-sky-700 bg-sky-50/30">
                    {Number(row.balance).toLocaleString()} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-mono font-bold text-xs border-t border-slate-200">
                <td colSpan={4} className="py-3 px-4 text-right font-sans text-slate-700">
                  إجمالي حركات الفترة ورصيد الإقفال:
                </td>
                <td className="py-3 px-4 text-left text-slate-900 font-black">
                  {ledgerData?.totalPeriodDebit.toLocaleString()} ج.م
                </td>
                <td className="py-3 px-4 text-left text-slate-900 font-black">
                  {ledgerData?.totalPeriodCredit.toLocaleString()} ج.م
                </td>
                <td className="py-3 px-4 text-left text-sky-700 font-black bg-slate-100">
                  {ledgerData?.closingBalance.toLocaleString()} ج.م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
