import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Search,
  Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, CompanyProfile, JournalEntry } from '../types/accounting';
import { A4ReportViewerModal } from './A4ReportViewerModal';
import { db } from '../services/db';

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
  const [isA4PreviewOpen, setIsA4PreviewOpen] = useState(false);

  const subAccounts = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'sub')
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [accounts]);

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
    <div className="space-y-6 font-somar">
      {/* Top Header & Account Picker */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-somar flex items-center gap-2">
                دفتر الأستاذ العام (General Ledger)
              </h2>
              <p className="text-xs text-slate-400">
                كشف حساب تحليلي تفصيلي لكافة الحركات اليومية والأرصدة التراكمية لكل حساب فرعي
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة كشف الحساب A4</span>
          </button>

          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة سريعة A4</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Account Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md text-xs no-print">
        <div className="md:col-span-2">
          <label className="block text-slate-300 font-bold mb-1.5 font-somar">اختر الحساب المحاسبي المراد تحليله وعرضه *</label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 font-somar"
          >
            {subAccounts.map((acc) => (
              <option key={acc.code} value={acc.code}>
                {acc.code} - {acc.name} ({acc.nature === 'debit' ? 'طبيعة مدينة' : 'طبيعة دائنة'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5 font-somar">من تاريخ</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5 font-somar">إلى تاريخ</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Account Info Banner */}
      {currentAccount && (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-black text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                {currentAccount.code}
              </span>
              <h3 className="text-base font-black text-white font-somar">{currentAccount.name}</h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  currentAccount.nature === 'debit'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                }`}
              >
                طبيعة: {currentAccount.nature === 'debit' ? 'مدين (Debit)' : 'دائن (Credit)'}
              </span>
            </div>
            <p className="text-slate-400">
              التبويب: <span className="text-slate-200">{currentAccount.category}</span> | الرصيد الافتتاحي:{' '}
              <strong className="text-emerald-400 font-mono">
                {Number(currentAccount.openingBalance || 0).toLocaleString()} ج.م
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 font-mono">
            <div>
              <div className="text-[10px] text-slate-400 font-somar font-bold">حركة المدين للفترة</div>
              <div className="text-sm font-bold text-white">
                {(ledgerData?.totalPeriodDebit ?? 0).toLocaleString()} ج.م
              </div>
            </div>
            <div className="border-r border-slate-800 pr-6">
              <div className="text-[10px] text-slate-400 font-somar font-bold">حركة الدائن للفترة</div>
              <div className="text-sm font-bold text-slate-300">
                {(ledgerData?.totalPeriodCredit ?? 0).toLocaleString()} ج.م
              </div>
            </div>
            <div className="border-r border-slate-800 pr-6">
              <div className="text-[10px] text-slate-400 font-somar font-bold">الرصيد الختامي الحالي</div>
              <div className="text-base font-black text-emerald-400">
                {(ledgerData?.closingBalance ?? 0).toLocaleString()} ج.م
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] font-bold font-somar">
                <th className="py-3.5 px-4 w-28">التاريخ</th>
                <th className="py-3.5 px-4 w-32">رقم القيد</th>
                <th className="py-3.5 px-4 w-28">المستند</th>
                <th className="py-3.5 px-4">شرح وبيان الحركة المحاسبية</th>
                <th className="py-3.5 px-4 w-32 text-left">مدين (ج.م)</th>
                <th className="py-3.5 px-4 w-32 text-left">دائن (ج.م)</th>
                <th className="py-3.5 px-4 w-36 text-left">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {ledgerData?.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    idx === 0 ? 'bg-slate-950/40 font-bold text-white' : 'text-slate-300'
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-400">{row.date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">{row.entryNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{row.docRef || '-'}</td>
                  <td className="py-3 px-4 text-slate-200 font-somar">{row.description}</td>
                  <td className="py-3 px-4 font-mono text-left font-bold text-slate-100">
                    {row.debit > 0 ? `${Number(row.debit || 0).toLocaleString()} ج.م` : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-left font-bold text-slate-300">
                    {row.credit > 0 ? `${Number(row.credit || 0).toLocaleString()} ج.م` : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-left font-black text-emerald-400 bg-slate-950/40">
                    {Number(row.balance || 0).toLocaleString()} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-mono font-bold text-xs border-t border-slate-800 text-white">
                <td colSpan={4} className="py-3.5 px-4 text-right font-somar text-slate-300">
                  إجمالي حركات الفترة ورصيد الإقفال:
                </td>
                <td className="py-3.5 px-4 text-left text-white font-black">
                  {(ledgerData?.totalPeriodDebit ?? 0).toLocaleString()} ج.م
                </td>
                <td className="py-3.5 px-4 text-left text-white font-black">
                  {(ledgerData?.totalPeriodCredit ?? 0).toLocaleString()} ج.م
                </td>
                <td className="py-3.5 px-4 text-left text-emerald-400 font-black bg-slate-900">
                  {(ledgerData?.closingBalance ?? 0).toLocaleString()} ج.م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Professional A4 Preview Modal */}
      {currentAccount && ledgerData && (
        <A4ReportViewerModal
          isOpen={isA4PreviewOpen}
          onClose={() => setIsA4PreviewOpen(false)}
          reportTitle={`كشف حساب أستاذ عام: ${currentAccount.name}`}
          reportSubtitle={`كود الحساب (${currentAccount.code}) - ${currentAccount.nature === 'debit' ? 'طبيعة مدينة' : 'طبيعة دائنة'} - للفترة من ${startDate || 'بداية النشاط'} إلى ${endDate || 'تاريخه'}`}
          companyProfile={companyProfile}
          auditorStatement={db.getAuditorStatement()}
          pdfFileName={`كشف_أستاذ_${currentAccount.code}_${currentAccount.name}.pdf`}
        >
          <div className="space-y-4 font-somar text-right">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs text-slate-800 font-sans">
              <div><strong>رقم الحساب:</strong> <span className="font-mono">{currentAccount.code}</span></div>
              <div><strong>اسم الحساب:</strong> {currentAccount.name}</div>
              <div><strong>طبيعة الحساب:</strong> {currentAccount.nature === 'debit' ? 'مدين' : 'دائن'}</div>
              <div><strong>الرصيد الختامي:</strong> <span className="font-mono font-bold">{(ledgerData?.closingBalance ?? 0).toLocaleString()} ج.م</span></div>
            </div>

            <table className="w-full text-[11px] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                  <th className="border border-slate-400 p-1.5 text-center w-20">التاريخ</th>
                  <th className="border border-slate-400 p-1.5 text-center w-24">رقم القيد</th>
                  <th className="border border-slate-400 p-1.5 text-center w-20">المستند</th>
                  <th className="border border-slate-400 p-1.5 text-right">البيان والشرح التحليلي</th>
                  <th className="border border-slate-400 p-1.5 text-left w-24">مدين</th>
                  <th className="border border-slate-400 p-1.5 text-left w-24">دائن</th>
                  <th className="border border-slate-400 p-1.5 text-left w-28 bg-slate-300">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px]">{row.date}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px] text-slate-700">{row.entryNumber}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-600 text-[10px]">{row.docRef || '-'}</td>
                    <td className="border border-slate-300 p-1.5 text-right text-slate-900 font-medium">{row.description}</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono">{row.debit > 0 ? (row.debit || 0).toLocaleString() : '-'}</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono">{row.credit > 0 ? (row.credit || 0).toLocaleString() : '-'}</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono font-bold bg-slate-100">{Number(row.balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-300 text-slate-950 font-bold text-[11px] border-t-2 border-slate-600">
                  <td colSpan={4} className="border border-slate-400 p-2 text-center">إجمالي حركات الفترة والرصيد النهائي</td>
                  <td className="border border-slate-400 p-2 text-left font-mono font-bold">{(ledgerData?.totalPeriodDebit ?? 0).toLocaleString()}</td>
                  <td className="border border-slate-400 p-2 text-left font-mono font-bold">{(ledgerData?.totalPeriodCredit ?? 0).toLocaleString()}</td>
                  <td className="border border-slate-400 p-2 text-left font-mono font-black text-slate-950">{(ledgerData?.closingBalance ?? 0).toLocaleString()} ج.م</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </A4ReportViewerModal>
      )}
    </div>
  );
};
