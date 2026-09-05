import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Globe,
  Printer,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { GoogleSheetsExportModal } from './GoogleSheetsExportModal';
import { A4ReportViewerModal } from './A4ReportViewerModal';
import { CompanyProfile, TrialBalanceItem } from '../types/accounting';
import { db } from '../services/db';

interface TrialBalanceViewProps {
  trialBalanceData: {
    items: TrialBalanceItem[];
    totals: {
      openingDebit: number;
      openingCredit: number;
      periodDebit: number;
      periodCredit: number;
      totalDebit: number;
      totalCredit: number;
      balanceDebit: number;
      balanceCredit: number;
      isBalanced: boolean;
    };
  };
  companyProfile: CompanyProfile;
}

export const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({
  trialBalanceData,
  companyProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isA4PreviewOpen, setIsA4PreviewOpen] = useState(false);

  const { items, totals } = trialBalanceData;

  const filteredItems = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    return items.filter((item) => {
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      if (!matchCat) return false;
      if (!searchLower) return true;

      const codeStr = (item.accountCode || '').toLowerCase();
      const nameStr = (item.accountName || '').toLowerCase();

      return codeStr.includes(searchLower) || nameStr.includes(searchLower);
    });
  }, [items, searchTerm, categoryFilter]);

  const handleExportCsv = () => {
    let csv = `ميزان المراجعة بالمجاميع والأرصدة - ${companyProfile.name}\n`;
    csv += `السنة المالية:,2026\n`;
    csv += `تاريخ الاستخراج:,${new Date().toLocaleDateString('ar-EG')}\n\n`;
    csv += `رقم الحساب,اسم الحساب,رصيد أول مدين,رصيد أول دائن,حركة مدين,حركة دائن,مجموع مدين,مجموع دائن,رصيد ختامي مدين,رصيد ختامي دائن\n`;

    for (const item of filteredItems) {
      csv += `"${item.accountCode}","${item.accountName}",${item.openingDebit},${item.openingCredit},${item.periodDebit},${item.periodCredit},${item.totalDebit},${item.totalCredit},${item.balanceDebit},${item.balanceCredit}\n`;
    }

    csv += `"الإجمالي العام","",${totals.openingDebit},${totals.openingCredit},${totals.periodDebit},${totals.periodCredit},${totals.totalDebit},${totals.totalCredit},${totals.balanceDebit},${totals.balanceCredit}\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Trial_Balance_${companyProfile.fiscalYearEnd}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 font-somar">
      {/* Google Sheets Export Modal */}
      <GoogleSheetsExportModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        type="trial_balance"
        trialBalanceData={trialBalanceData}
        companyProfile={companyProfile}
      />

      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-somar flex items-center gap-2">
              ميزان المراجعة بالمجاميع والأرصدة (Trial Balance)
            </h2>
            <p className="text-xs text-slate-400">
              التحقق من توازن الحركات المحاسبية والأرصدة الافتتاحية والختامية لكافة الحسابات
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة ميزان المراجعة A4</span>
          </button>

          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير إلى Google Sheets</span>
          </button>

          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة سريعة A4</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Balance Verification Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 font-mono text-xs ${
          totals.isBalanced
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-2.5 font-somar font-bold text-sm">
          {totals.isBalanced ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <Scale className="w-5 h-5 text-rose-400" />
          )}
          <span>
            {totals.isBalanced
              ? 'ميزان المراجعة بالمجاميع والأرصدة متوازن ومطابق بنسبة 100%'
              : 'تنبيه: يوجد عدم توازن في ميزان المراجعة!'}
          </span>
        </div>

        <div className="flex items-center gap-6 font-bold text-xs">
          <div>
            <span className="text-slate-400 font-somar ml-1">إجمالي الأرصدة المدينة:</span>
            <span className="text-emerald-400">{(totals?.balanceDebit ?? 0).toLocaleString()} ج.م</span>
          </div>
          <div className="border-r border-slate-800 pr-6">
            <span className="text-slate-400 font-somar ml-1">إجمالي الأرصدة الدائنة:</span>
            <span className="text-emerald-400">{(totals?.balanceCredit ?? 0).toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs no-print shadow-md">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الحساب أو اسم الحساب..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-somar"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-somar"
          >
            <option value="all">كافة الحسابات (1 - 4)</option>
            <option value="assets">1 - الأصول (Assets)</option>
            <option value="liabilities">2 - الالتزامات (Liabilities)</option>
            <option value="equity">21 - حقوق الملكية (Equity)</option>
            <option value="revenue">3 - الإيرادات (Revenues)</option>
            <option value="expense">4 - المصروفات والتكاليف (Expenses)</option>
          </select>
        </div>
      </div>

      {/* Trial Balance Comprehensive Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800 text-[11px] font-bold text-center font-somar">
                <th rowSpan={2} className="py-3.5 px-3 w-28 text-right border-l border-slate-800">رقم الحساب</th>
                <th rowSpan={2} className="py-3.5 px-3 text-right border-l border-slate-800">اسم الحساب المحاسبي</th>
                <th colSpan={2} className="py-2 px-2 bg-slate-950/40 border-l border-slate-800 text-slate-300">أرصدة أول المدة</th>
                <th colSpan={2} className="py-2 px-2 bg-slate-950/40 border-l border-slate-800 text-slate-300">حركات الفترة</th>
                <th colSpan={2} className="py-2 px-2 bg-slate-950/40 border-l border-slate-800 text-slate-300">المجاميع الكلية</th>
                <th colSpan={2} className="py-2 px-2 bg-emerald-950/30 text-emerald-400 font-black">الأرصدة الختامية</th>
              </tr>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-mono">
                <th className="py-1 px-2 w-24 text-left">مدين</th>
                <th className="py-1 px-2 w-24 text-left border-l border-slate-800">دائن</th>
                <th className="py-1 px-2 w-24 text-left">مدين</th>
                <th className="py-1 px-2 w-24 text-left border-l border-slate-800">دائن</th>
                <th className="py-1 px-2 w-24 text-left">مدين</th>
                <th className="py-1 px-2 w-24 text-left border-l border-slate-800">دائن</th>
                <th className="py-1 px-2 w-24 text-left text-emerald-400 font-bold">مدين</th>
                <th className="py-1 px-2 w-24 text-left text-purple-400 font-bold">دائن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredItems.map((item) => (
                <tr key={item.accountCode} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-emerald-400 border-l border-slate-800/60 text-right">
                    {item.accountCode}
                  </td>
                  <td className="py-2.5 px-3 font-somar font-medium text-slate-200 border-l border-slate-800/60 text-right">
                    {item.accountName}
                  </td>
                  {/* Opening */}
                  <td className="py-2.5 px-2 text-left text-slate-400">
                    {item.openingDebit > 0 ? (Number(item?.openingDebit) || 0).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left text-slate-400 border-l border-slate-800/60">
                    {item.openingCredit > 0 ? (Number(item?.openingCredit) || 0).toLocaleString() : '-'}
                  </td>
                  {/* Period */}
                  <td className="py-2.5 px-2 text-left text-white font-semibold">
                    {item.periodDebit > 0 ? (Number(item?.periodDebit) || 0).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left text-slate-300 font-semibold border-l border-slate-800/60">
                    {item.periodCredit > 0 ? (Number(item?.periodCredit) || 0).toLocaleString() : '-'}
                  </td>
                  {/* Totals */}
                  <td className="py-2.5 px-2 text-left text-slate-400">
                    {item.totalDebit > 0 ? (Number(item?.totalDebit) || 0).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left text-slate-400 border-l border-slate-800/60">
                    {item.totalCredit > 0 ? (Number(item?.totalCredit) || 0).toLocaleString() : '-'}
                  </td>
                  {/* Net Balances */}
                  <td className="py-2.5 px-2 text-left font-black text-emerald-400 bg-slate-950/40">
                    {item.balanceDebit > 0 ? (Number(item?.balanceDebit) || 0).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left font-black text-purple-400 bg-slate-950/40">
                    {item.balanceCredit > 0 ? (Number(item?.balanceCredit) || 0).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-mono font-black text-xs border-t-2 border-slate-800 text-white">
                <td colSpan={2} className="py-3 px-3 text-right font-somar text-slate-300 border-l border-slate-800">
                  الإجمالي العام لميزان المراجعة:
                </td>
                <td className="py-3 px-2 text-left text-slate-300">{(totals?.openingDebit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-slate-300 border-l border-slate-800">{(totals?.openingCredit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-white">{(totals?.periodDebit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-slate-300 border-l border-slate-800">{(totals?.periodCredit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-white">{(totals?.totalDebit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-slate-300 border-l border-slate-800">{(totals?.totalCredit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-emerald-400 bg-slate-900 font-black">{(totals?.balanceDebit ?? 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-purple-400 bg-slate-900 font-black">{(totals?.balanceCredit ?? 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Google Sheets Export Modal */}
      <GoogleSheetsExportModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        type="trial_balance"
        trialBalanceData={trialBalanceData}
        companyProfile={companyProfile}
      />

      {/* Professional A4 Preview Modal */}
      <A4ReportViewerModal
        isOpen={isA4PreviewOpen}
        onClose={() => setIsA4PreviewOpen(false)}
        reportTitle="ميزان المراجعة بالأرصدة والمجاميع"
        reportSubtitle={`عن الفترة المالية المنتهية في ${new Date().toLocaleDateString('ar-EG')}`}
        companyProfile={companyProfile}
        auditorStatement={db.getAuditorStatement()}
        pdfFileName="ميزان_المراجعة_المعتمد_A4.pdf"
      >
        <div className="space-y-4 font-somar text-right">
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 flex items-center justify-between text-xs text-slate-800 font-sans">
            <div><strong>حالة توازن الميزان:</strong> {totals.isBalanced ? 'متوازن ومطابق نظامياً' : 'يوجد عدم توازن'}</div>
            <div><strong>عدد الحسابات:</strong> {filteredItems.length}</div>
            <div><strong>تاريخ الاستخراج:</strong> {new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <table className="w-full text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                <th rowSpan={2} className="border border-slate-400 p-1.5 text-center w-16">رقم الحساب</th>
                <th rowSpan={2} className="border border-slate-400 p-1.5 text-right">اسم الحساب</th>
                <th colSpan={2} className="border border-slate-400 p-1.5 text-center">أرصدة افتتاحية</th>
                <th colSpan={2} className="border border-slate-400 p-1.5 text-center">حركات الفترة</th>
                <th colSpan={2} className="border border-slate-400 p-1.5 text-center">المجاميع</th>
                <th colSpan={2} className="border border-slate-400 p-1.5 text-center bg-slate-300">أرصدة ختامية</th>
              </tr>
              <tr className="bg-slate-100 text-slate-800 text-[10px]">
                <th className="border border-slate-400 p-1 text-center">مدين</th>
                <th className="border border-slate-400 p-1 text-center">دائن</th>
                <th className="border border-slate-400 p-1 text-center">مدين</th>
                <th className="border border-slate-400 p-1 text-center">دائن</th>
                <th className="border border-slate-400 p-1 text-center">مدين</th>
                <th className="border border-slate-400 p-1 text-center">دائن</th>
                <th className="border border-slate-400 p-1 text-center bg-slate-200">مدين</th>
                <th className="border border-slate-400 p-1 text-center bg-slate-200">دائن</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item.accountId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 p-1 text-center font-mono text-[10px]">{item.accountCode}</td>
                  <td className="border border-slate-300 p-1 text-right font-medium">{item.accountName}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono">{item.openingDebit > 0 ? (item.openingDebit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono">{item.openingCredit > 0 ? (item.openingCredit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono">{item.periodDebit > 0 ? (item.periodDebit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono">{item.periodCredit > 0 ? (item.periodCredit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono">{item.totalDebit > 0 ? (item.totalDebit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono">{item.totalCredit > 0 ? (item.totalCredit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono font-bold bg-slate-100">{item.balanceDebit > 0 ? (item.balanceDebit || 0).toLocaleString() : '-'}</td>
                  <td className="border border-slate-300 p-1 text-left font-mono font-bold bg-slate-100">{item.balanceCredit > 0 ? (item.balanceCredit || 0).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-300 text-slate-950 font-bold text-[11px] border-t-2 border-slate-600">
                <td colSpan={2} className="border border-slate-400 p-1.5 text-center">الإجمالي العام لميزان المراجعة</td>
                <td className="border border-slate-400 p-1 text-left font-mono">{(totals?.openingDebit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono">{(totals?.openingCredit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono">{(totals?.periodDebit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono">{(totals?.periodCredit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono">{(totals?.totalDebit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono">{(totals?.totalCredit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono font-black">{(totals?.balanceDebit ?? 0).toLocaleString()}</td>
                <td className="border border-slate-400 p-1 text-left font-mono font-black">{(totals?.balanceCredit ?? 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </A4ReportViewerModal>
    </div>
  );
};
