import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Printer,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CompanyProfile, TrialBalanceItem } from '../types/accounting';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <Scale className="w-5 h-5 text-sky-600" />
            ميزان المراجعة بالمجاميع والأرصدة (Trial Balance)
          </h2>
          <p className="text-xs text-slate-500">
            مراجعة الحركات والأرصدة الافتتاحية والختامية والتحقق من التوازن المحاسبي العام
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-600" />
            <span>طباعة ميزان المراجعة A4</span>
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

      {/* Balance Verification Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 font-mono text-xs ${
          totals.isBalanced
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}
      >
        <div className="flex items-center gap-2 font-sans font-bold">
          {totals.isBalanced ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <Scale className="w-5 h-5 text-rose-600" />
          )}
          <span>
            {totals.isBalanced
              ? 'ميزان المراجعة بالمجاميع والأرصدة متوازن ومطابق بنسبة 100%'
              : 'يوجد عدم توازن في ميزان المراجعة!'}
          </span>
        </div>

        <div className="flex items-center gap-6 font-bold">
          <div>
            <span className="text-slate-600 font-sans ml-1">إجمالي الأرصدة المدينة:</span>
            <span className="text-slate-900">{totals.balanceDebit.toLocaleString()} ج.م</span>
          </div>
          <div>
            <span className="text-slate-600 font-sans ml-1">إجمالي الأرصدة الدائنة:</span>
            <span className="text-sky-800">{totals.balanceCredit.toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs no-print shadow-xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الحساب أو اسم الحساب..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
          >
            <option value="all">كافة الحسابات (1 - 4)</option>
            <option value="assets">1 - الأصول</option>
            <option value="liabilities">2 - الالتزامات</option>
            <option value="equity">21 - حقوق الملكية</option>
            <option value="revenue">3 - الإيرادات</option>
            <option value="expense">4 - المصروفات والتكاليف</option>
          </select>
        </div>
      </div>

      {/* Trial Balance Comprehensive Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-bold text-center">
                <th rowSpan={2} className="py-3 px-3 w-28 text-right border-l border-slate-200">رقم الحساب</th>
                <th rowSpan={2} className="py-3 px-3 text-right border-l border-slate-200">اسم الحساب المحاسبي</th>
                <th colSpan={2} className="py-2 px-2 bg-slate-100/60 border-l border-slate-200 text-slate-700">أرصدة أول المدة</th>
                <th colSpan={2} className="py-2 px-2 bg-slate-100/60 border-l border-slate-200 text-slate-700">حركات الفترة</th>
                <th colSpan={2} className="py-2 px-2 bg-slate-100/60 border-l border-slate-200 text-slate-700">المجاميع الكلية</th>
                <th colSpan={2} className="py-2 px-2 bg-sky-50 text-sky-800">الأرصدة الختامية</th>
              </tr>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-mono">
                <th className="py-1 px-2 w-24 text-left">مدين</th>
                <th className="py-1 px-2 w-24 text-left border-l border-slate-200">دائن</th>
                <th className="py-1 px-2 w-24 text-left">مدين</th>
                <th className="py-1 px-2 w-24 text-left border-l border-slate-200">دائن</th>
                <th className="py-1 px-2 w-24 text-left">مدين</th>
                <th className="py-1 px-2 w-24 text-left border-l border-slate-200">دائن</th>
                <th className="py-1 px-2 w-24 text-left text-sky-700 font-bold">مدين</th>
                <th className="py-1 px-2 w-24 text-left text-amber-700 font-bold">دائن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredItems.map((item) => (
                <tr key={item.accountCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-sky-700 border-l border-slate-100 text-right">
                    {item.accountCode}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800 border-l border-slate-100 text-right">
                    {item.accountName}
                  </td>
                  {/* Opening */}
                  <td className="py-2.5 px-2 text-left text-slate-600">
                    {item.openingDebit > 0 ? Number(item.openingDebit).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left text-slate-600 border-l border-slate-100">
                    {item.openingCredit > 0 ? Number(item.openingCredit).toLocaleString() : '-'}
                  </td>
                  {/* Period */}
                  <td className="py-2.5 px-2 text-left text-slate-900 font-semibold">
                    {item.periodDebit > 0 ? Number(item.periodDebit).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left text-amber-700 font-semibold border-l border-slate-100">
                    {item.periodCredit > 0 ? Number(item.periodCredit).toLocaleString() : '-'}
                  </td>
                  {/* Totals */}
                  <td className="py-2.5 px-2 text-left text-slate-600">
                    {item.totalDebit > 0 ? Number(item.totalDebit).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left text-slate-600 border-l border-slate-100">
                    {item.totalCredit > 0 ? Number(item.totalCredit).toLocaleString() : '-'}
                  </td>
                  {/* Net Balances */}
                  <td className="py-2.5 px-2 text-left font-black text-sky-700 bg-sky-50/40">
                    {item.balanceDebit > 0 ? Number(item.balanceDebit).toLocaleString() : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-left font-black text-amber-700 bg-amber-50/40">
                    {item.balanceCredit > 0 ? Number(item.balanceCredit).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-mono font-black text-xs border-t-2 border-slate-200">
                <td colSpan={2} className="py-3 px-3 text-right font-sans text-slate-900 border-l border-slate-200">
                  الإجمالي العام لميزان المراجعة:
                </td>
                <td className="py-3 px-2 text-left text-slate-800">{totals.openingDebit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-slate-800 border-l border-slate-200">{totals.openingCredit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-slate-800">{totals.periodDebit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-amber-700 border-l border-slate-200">{totals.periodCredit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-slate-800">{totals.totalDebit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-amber-700 border-l border-slate-200">{totals.totalCredit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-sky-700 bg-sky-50 font-black">{totals.balanceDebit.toLocaleString()}</td>
                <td className="py-3 px-2 text-left text-amber-700 bg-amber-50 font-black">{totals.balanceCredit.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
