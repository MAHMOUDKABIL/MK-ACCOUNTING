import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Save,
  Scale,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Account } from '../types/accounting';

interface BalanceRow {
  debit: number;
  credit: number;
  note: string;
}

interface OpeningBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSaveBalances: (
    balances: { accountCode: string; debit: number; credit: number; note?: string }[],
    createEntry: boolean
  ) => void;
}

export const OpeningBalancesModal: React.FC<OpeningBalancesModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSaveBalances,
}) => {
  if (!isOpen) return null;

  // Filter only sub accounts (accounts that accept entries)
  const subAccounts = accounts.filter((a) => a.type === 'sub');

  // Local state for debit/credit amounts
  const [balanceRows, setBalanceRows] = useState<Record<string, BalanceRow>>(() => {
    const initial: Record<string, BalanceRow> = {};
    subAccounts.forEach((acc) => {
      const op = acc.openingBalance || 0;
      initial[acc.code] = {
        debit: op > 0 ? op : 0,
        credit: op < 0 ? Math.abs(op) : 0,
        note: '',
      };
    });
    return initial;
  });

  const [createOpeningEntry, setCreateOpeningEntry] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDebitChange = (code: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBalanceRows((prev) => ({
      ...prev,
      [code]: {
        debit: num,
        credit: num > 0 ? 0 : prev[code]?.credit || 0, // Auto clear credit if debit entered
        note: prev[code]?.note || '',
      },
    }));
  };

  const handleCreditChange = (code: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBalanceRows((prev) => ({
      ...prev,
      [code]: {
        credit: num,
        debit: num > 0 ? 0 : prev[code]?.debit || 0, // Auto clear debit if credit entered
        note: prev[code]?.note || '',
      },
    }));
  };

  // Calculations
  const totalDebit = (Object.values(balanceRows) as BalanceRow[]).reduce(
    (sum: number, r: BalanceRow) => sum + (r.debit || 0),
    0
  );
  const totalCredit = (Object.values(balanceRows) as BalanceRow[]).reduce(
    (sum: number, r: BalanceRow) => sum + (r.credit || 0),
    0
  );
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001;

  const filteredAccounts = subAccounts.filter((acc) => {
    const matchesCategory = filterCategory === 'all' || acc.category === filterCategory;
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleSave = () => {
    if (!isBalanced && createOpeningEntry) {
      if (
        !window.confirm(
          `القيد الافتتاحي غير متوازن! يوجد فارق قدره (${difference.toLocaleString()} ج.م).\nهل تريد المتابعة وحفظ الأرصدة بدون توليد قيد افتتاحي؟`
        )
      ) {
        return;
      }
    }

    const payload = Object.entries(balanceRows)
      .map(([code, vals]) => ({
        accountCode: code,
        debit: (vals as BalanceRow).debit || 0,
        credit: (vals as BalanceRow).credit || 0,
        note: (vals as BalanceRow).note,
      }))
      .filter((item) => item.debit > 0 || item.credit > 0);

    onSaveBalances(payload, isBalanced && createOpeningEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print select-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 md:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black font-cairo flex items-center gap-2">
                معالج إدخال الأرصدة الافتتاحية السريعة (Opening Balances)
              </h2>
              <p className="text-xs text-slate-400">
                تسجيل أرصدة أول المدة لكافة حسابات الأصول والالتزامات وحقوق الملكية وتوليد القيد الافتتاحي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Balance Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">إجمالي الأرصدة المدينة</span>
            <div className="text-base font-bold text-sky-950 font-mono">
              {totalDebit.toLocaleString()} ج.م
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">إجمالي الأرصدة الدائنة</span>
            <div className="text-base font-bold text-sky-950 font-mono">
              {totalCredit.toLocaleString()} ج.م
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border shadow-2xs ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span className="font-medium">الفارق (حالة التوازن)</span>
            <div className="text-base font-bold font-mono">
              {difference.toLocaleString()} ج.م
            </div>
          </div>
          <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            {isBalanced ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>القيد متوازن 100% وجاهز</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>غير متوازن (يوجد فارق)</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">تصفية التبويب:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="all">جميع الحسابات الفرعية ({subAccounts.length})</option>
              <option value="assets">الأصول (1)</option>
              <option value="liabilities">الالتزامات (2)</option>
              <option value="equity">حقوق الملكية (21)</option>
              <option value="revenue">الإيرادات (3)</option>
              <option value="expense">المصروفات (4)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <input
              type="text"
              placeholder="بحث برقم الحساب أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={createOpeningEntry}
              onChange={(e) => setCreateOpeningEntry(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <span>توليد وترحيل القيد الافتتاحي آلياً (JV-OPENING-2026)</span>
          </label>
        </div>

        {/* Accounts Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-300">
              <tr>
                <th className="p-2.5 w-24">كود الحساب</th>
                <th className="p-2.5">اسم الحساب</th>
                <th className="p-2.5 w-28">النوع / التبويب</th>
                <th className="p-2.5 w-20">الطبيعة</th>
                <th className="p-2.5 w-40 text-center">رصيد مدين (ج.م)</th>
                <th className="p-2.5 w-40 text-center">رصيد دائن (ج.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAccounts.map((acc) => {
                const row = balanceRows[acc.code] || { debit: 0, credit: 0, note: '' };
                const isDebitNature = acc.nature === 'debit';
                return (
                  <tr key={acc.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="p-2 font-mono font-bold text-sky-950">{acc.code}</td>
                    <td className="p-2">
                      <div className="font-bold text-slate-900">{acc.name}</div>
                      {acc.englishName && <div className="text-[10px] text-slate-400 font-sans">{acc.englishName}</div>}
                    </td>
                    <td className="p-2 text-slate-600">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {acc.category === 'assets' && 'أصول'}
                        {acc.category === 'liabilities' && 'التزامات'}
                        {acc.category === 'equity' && 'حقوق ملكية'}
                        {acc.category === 'revenue' && 'إيرادات'}
                        {acc.category === 'expense' && 'مصروفات'}
                      </span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isDebitNature ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isDebitNature ? 'مدين' : 'دائن'}
                      </span>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={row.debit === 0 ? '' : row.debit}
                        onChange={(e) => handleDebitChange(acc.code, e.target.value)}
                        className={`w-full text-left font-mono font-bold px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                          row.debit > 0
                            ? 'bg-sky-50 border-sky-400 text-sky-950'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={row.credit === 0 ? '' : row.credit}
                        onChange={(e) => handleCreditChange(acc.code, e.target.value)}
                        className={`w-full text-left font-mono font-bold px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                          row.credit > 0
                            ? 'bg-amber-50 border-amber-400 text-amber-950'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            * سيتم تحديث أرصدة أول المدة وتحديث ميزان المراجعة وقائمة المركز المالي مباشرة.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق الأرصدة الافتتاحية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
