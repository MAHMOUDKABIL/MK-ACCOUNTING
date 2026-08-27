import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Lock,
  Percent,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Account, AuditorStatement, CompanyProfile } from '../types/accounting';

interface YearEndClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  onExecuteClosing: (closingDate: string) => { success: boolean; message: string; netProfit: number };
}

export const YearEndClosingModal: React.FC<YearEndClosingModalProps> = ({
  isOpen,
  onClose,
  accounts,
  companyProfile,
  auditorStatement,
  onExecuteClosing,
}) => {
  if (!isOpen) return null;

  const [closingDate, setClosingDate] = useState<string>(
    companyProfile.fiscalYearEnd || '2026-12-31'
  );
  const [result, setResult] = useState<{ success: boolean; message: string; netProfit: number } | null>(
    null
  );

  // Compute Revenue accounts balances (3)
  const revenueAccounts = accounts.filter(
    (a) => a.category === 'revenue' && a.type === 'sub' && (a.currentBalance || 0) !== 0
  );
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance || 0), 0);

  // Compute Expense accounts balances (4)
  const expenseAccounts = accounts.filter(
    (a) => a.category === 'expense' && a.type === 'sub' && (a.currentBalance || 0) !== 0
  );
  const totalExpense = expenseAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance || 0), 0);

  const estimatedNetProfit = totalRevenue - totalExpense;

  const handleRunClosing = () => {
    if (
      !window.confirm(
        `هل أنت متأكد من تنفيذ قيد إقفال السنة المالية لتاريخ ${closingDate}؟\nسيتم إقفال كافة حسابات الإيرادات والمصروفات وترحيل صافي ${
          estimatedNetProfit >= 0 ? 'الربح' : 'الخسارة'
        } (${Math.abs(estimatedNetProfit).toLocaleString()} ج.م) لحساب الأرباح والخسائر.`
      )
    ) {
      return;
    }

    const res = onExecuteClosing(closingDate);
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print select-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 md:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black font-cairo flex items-center gap-2">
                معالج إقفال السنة المالية والحسابات الختامية
              </h2>
              <p className="text-xs text-slate-400">
                إقفال حسابات قائمة الدخل (الإيرادات والمصروفات) وترحيل صافي الأرباح/الخسائر
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

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {result && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                result.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {result.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{result.message}</span>
            </div>
          )}

          {/* Legal / Auditor Note */}
          <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl flex items-start gap-3 text-xs text-sky-950">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">إشراف واعتماد مراقب الحسابات والمحاسب القانوني:</div>
              <div className="text-slate-700">
                {auditorStatement.auditorName} - {auditorStatement.registerNumber || 'س.م.م 44887'}.
                يتم توليد قيد الإقفال وفقاً للمعايير المحاسبية المصرية (EAS) وإقفال أرصدة الإيرادات مديناً والمصروفات دائناً.
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>إجمالي الإيرادات (3)</span>
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {totalRevenue.toLocaleString()} ج.م
              </div>
              <div className="text-[11px] text-slate-500">عدد الحسابات: {revenueAccounts.length}</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>إجمالي المصروفات (4)</span>
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {totalExpense.toLocaleString()} ج.م
              </div>
              <div className="text-[11px] text-slate-500">عدد الحسابات: {expenseAccounts.length}</div>
            </div>

            <div
              className={`border p-4 rounded-xl space-y-1 ${
                estimatedNetProfit >= 0
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Scale className="w-4 h-4" />
                <span>صافي {estimatedNetProfit >= 0 ? 'الربح' : 'الخسارة'} المرحل</span>
              </div>
              <div className="text-lg font-black font-mono">
                {Math.abs(estimatedNetProfit).toLocaleString()} ج.م
              </div>
              <div className="text-[11px] font-medium">
                يرحل لحساب: 212 الأرباح (الخسائر) المرحلة
              </div>
            </div>
          </div>

          {/* Date Picker & Confirmation */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              تاريخ تنفيذ قيد إقفال السنة المالية:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <span className="text-xs text-slate-500">
                (نهاية الفترة المحاسبية المعتمدة بالقوائم المالية)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={handleRunClosing}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>توليد وترحيل قيد إقفال السنة المالية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
