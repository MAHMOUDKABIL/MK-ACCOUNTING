import {
  AlertCircle,
  ArrowRightLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  Coins,
  DollarSign,
  Edit2,
  FileCheck2,
  Globe,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, CompanyProfile, JournalEntry } from '../types/accounting';
import {
  CurrencyCode,
  FXRevaluationItem,
  FXRevaluationReport,
  SUPPORTED_CURRENCIES,
} from '../types/currency';

interface CurrencyRevaluationViewProps {
  accounts: Account[];
  companyProfile: CompanyProfile;
  onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'>) => void;
}

export const CurrencyRevaluationView: React.FC<CurrencyRevaluationViewProps> = ({
  accounts,
  companyProfile,
  onAddJournalEntry,
}) => {
  // Rates table state
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({
    EGP: 1.0,
    USD: 49.35,
    EUR: 53.60,
    SAR: 13.15,
    AED: 13.44,
    GBP: 63.90,
    KWD: 160.80,
    QAR: 13.55,
  });

  const [revaluationDate, setRevaluationDate] = useState('2026-12-31');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick converter state
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcFromCurrency, setCalcFromCurrency] = useState<CurrencyCode>('USD');
  const [calcToCurrency, setCalcToCurrency] = useState<CurrencyCode>('EGP');

  // Multi-currency demo/active items for evaluation
  const [revalItems, setRevalItems] = useState<FXRevaluationItem[]>([
    {
      id: '1',
      accountCode: '1241',
      accountName: 'حساب بنك CIB - حساب جاري بالدولار الأمريكي (USD)',
      accountCategory: 'assets',
      currency: 'USD',
      foreignBalance: 25000,
      bookExchangeRate: 48.20,
      bookValueEGP: 25000 * 48.20, // 1,205,000
      closingExchangeRate: 49.35,
      revaluedValueEGP: 25000 * 49.35, // 1,233,750
      fxGainLossEGP: 25000 * (49.35 - 48.20), // +28,750 gain
      type: 'gain',
    },
    {
      id: '2',
      accountCode: '1242',
      accountName: 'حساب البنك الأهلي المصري - يورو (EUR)',
      accountCategory: 'assets',
      currency: 'EUR',
      foreignBalance: 12000,
      bookExchangeRate: 54.10,
      bookValueEGP: 12000 * 54.10, // 649,200
      closingExchangeRate: 53.60,
      revaluedValueEGP: 12000 * 53.60, // 643,200
      fxGainLossEGP: 12000 * (53.60 - 54.10), // -6,000 loss
      type: 'loss',
    },
    {
      id: '3',
      accountCode: '1211',
      accountName: 'عملاء خارجيين (تصدير بالدولار) - شركة المشرق الدولية',
      accountCategory: 'assets',
      currency: 'USD',
      foreignBalance: 15000,
      bookExchangeRate: 48.50,
      bookValueEGP: 15000 * 48.50, // 727,500
      closingExchangeRate: 49.35,
      revaluedValueEGP: 15000 * 49.35, // 740,250
      fxGainLossEGP: 15000 * (49.35 - 48.50), // +12,750 gain
      type: 'gain',
    },
    {
      id: '4',
      accountCode: '2111',
      accountName: 'موردون خارجيون (استيراد خامات باليورو) - Global Tech Germany',
      accountCategory: 'liabilities',
      currency: 'EUR',
      foreignBalance: 8000,
      bookExchangeRate: 52.80,
      bookValueEGP: 8000 * 52.80, // 422,400
      closingExchangeRate: 53.60,
      revaluedValueEGP: 8000 * 53.60, // 428,800
      fxGainLossEGP: -(8000 * (53.60 - 52.80)), // -6,400 loss (liability increase)
      type: 'loss',
    },
  ]);

  // Recalculate revaluation based on closing rates
  const handleRateChange = (curr: CurrencyCode, newRate: number) => {
    setRates((prev) => ({ ...prev, [curr]: newRate }));

    setRevalItems((prev) =>
      prev.map((item) => {
        if (item.currency === curr) {
          const closing = newRate;
          const revalued = item.foreignBalance * closing;
          const diff = item.accountCategory === 'assets'
            ? revalued - item.bookValueEGP
            : item.bookValueEGP - revalued;

          return {
            ...item,
            closingExchangeRate: closing,
            revaluedValueEGP: revalued,
            fxGainLossEGP: diff,
            type: diff >= 0 ? 'gain' : 'loss',
          };
        }
        return item;
      })
    );
  };

  // Revaluation Totals
  const revalSummary = useMemo(() => {
    let totalGains = 0;
    let totalLosses = 0;

    for (const item of revalItems) {
      if (item.fxGainLossEGP > 0) {
        totalGains += item.fxGainLossEGP;
      } else {
        totalLosses += Math.abs(item.fxGainLossEGP);
      }
    }

    const netImpact = totalGains - totalLosses;

    return {
      totalGains,
      totalLosses,
      netImpact,
      isNetGain: netImpact >= 0,
    };
  }, [revalItems]);

  // Quick Currency Conversion calculation
  const convertedResult = useMemo(() => {
    const fromRate = rates[calcFromCurrency] || 1;
    const toRate = rates[calcToCurrency] || 1;

    // Convert to EGP first, then to target currency
    const amountInEGP = calcAmount * fromRate;
    const finalAmount = amountInEGP / toRate;

    return {
      amountInEGP,
      finalAmount,
      rate: fromRate / toRate,
    };
  }, [calcAmount, calcFromCurrency, calcToCurrency, rates]);

  // Create FX Revaluation Journal Entry
  const handleGenerateFXJournalEntry = () => {
    const lines: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    // 1. Process Assets & Liabilities adjustments
    revalItems.forEach((item, idx) => {
      const diff = Math.abs(item.fxGainLossEGP);
      if (diff === 0) return;

      if (item.accountCategory === 'assets') {
        if (item.fxGainLossEGP > 0) {
          // Asset value increased -> Debit Asset
          lines.push({
            id: `fx-${idx}-1`,
            accountId: item.accountCode,
            accountCode: item.accountCode,
            accountName: item.accountName,
            debit: diff,
            credit: 0,
            note: `إثبات أرباح فروق تقييم عملة (${item.currency}) في ${revaluationDate}`,
          });
          totalDebit += diff;
        } else {
          // Asset value decreased -> Credit Asset
          lines.push({
            id: `fx-${idx}-1`,
            accountId: item.accountCode,
            accountCode: item.accountCode,
            accountName: item.accountName,
            debit: 0,
            credit: diff,
            note: `إثبات خسائر فروق تقييم عملة (${item.currency}) في ${revaluationDate}`,
          });
          totalCredit += diff;
        }
      } else {
        // Liabilities
        if (item.fxGainLossEGP > 0) {
          // Liability decreased -> Debit Liability
          lines.push({
            id: `fx-${idx}-1`,
            accountId: item.accountCode,
            accountCode: item.accountCode,
            accountName: item.accountName,
            debit: diff,
            credit: 0,
            note: `تسوية فروق عملة دائنين (${item.currency})`,
          });
          totalDebit += diff;
        } else {
          // Liability increased -> Credit Liability
          lines.push({
            id: `fx-${idx}-1`,
            accountId: item.accountCode,
            accountCode: item.accountCode,
            accountName: item.accountName,
            debit: 0,
            credit: diff,
            note: `زيادة التزام دائنين ناتجة عن فروق سعر الصرف (${item.currency})`,
          });
          totalCredit += diff;
        }
      }
    });

    // 2. Balancing Line to FX Gains/Losses Account (EAS 13 P&L)
    if (revalSummary.netImpact > 0) {
      // Net FX Gain -> Credit FX Gain account 372
      lines.push({
        id: 'fx-gain-total',
        accountId: '372',
        accountCode: '372',
        accountName: 'أرباح فروق تقييم العملات الأجنبية (EAS 13)',
        debit: 0,
        credit: revalSummary.netImpact,
        note: `صافي أرباح فروق تقييم أسعار الصرف للسنة المالية المنتهية في ${revaluationDate}`,
      });
      totalCredit += revalSummary.netImpact;
    } else if (revalSummary.netImpact < 0) {
      // Net FX Loss -> Debit FX Loss account 472
      const lossAmount = Math.abs(revalSummary.netImpact);
      lines.push({
        id: 'fx-loss-total',
        accountId: '472',
        accountCode: '472',
        accountName: 'خسائر فروق تقييم العملات الأجنبية (EAS 13)',
        debit: lossAmount,
        credit: 0,
        note: `صافي خسائر فروق تقييم أسعار الصرف للسنة المالية المنتهية في ${revaluationDate}`,
      });
      totalDebit += lossAmount;
    }

    const newEntry = {
      date: revaluationDate,
      description: `قيد تسوية وإثبات فروق تقييم العملات الأجنبية وفق معيار المحاسبة المصري EAS 13 كما في ${revaluationDate}`,
      referenceDoc: `FX-REVAL-${revaluationDate.replace(/-/g, '')}`,
      lines,
      totalDebit,
      totalCredit,
      isPosted: true,
      createdBy: 'مدير الحسابات والنقد الأجنبي',
      sourceType: 'closing' as const,
      notes: 'تم احتساب فروق التقييم بناءً على أسعار الإقفال المعتمدة من البنك المركزي المصري',
    };

    onAddJournalEntry(newEntry);
    setToastMessage(
      `تم إنشاء وترحيل قيد تسوية فروق العملة بنجاح بقيمة إجمالية ${(totalDebit || 0).toLocaleString()} ج.م ومطابق للتوازن المحاسبي 100%!`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 font-cairo flex items-center gap-2">
              فروق العملة
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateFXJournalEntry}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>توليد قيد التسوية آلياً</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Exchange Rates Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 font-cairo">
              جدول أسعار الصرف الرسمية المعتمدة (مقابل الجنيه المصري EGP)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            العملة الأساسية للنظام: <strong>الجنيه المصري (EGP)</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {SUPPORTED_CURRENCIES.map((curr) => {
            const isBase = curr.code === 'EGP';
            return (
              <div
                key={curr.code}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isBase
                    ? 'bg-sky-50/60 border-sky-200 ring-1 ring-sky-300'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xl mb-1">{curr.flag}</div>
                <div className="font-bold text-xs text-slate-900 font-mono">{curr.code}</div>
                <div className="text-[10px] text-slate-500 truncate">{curr.nameAr}</div>

                {isBase ? (
                  <div className="mt-2 text-xs font-black text-sky-700 font-mono">1.000 (الأساس)</div>
                ) : (
                  <div className="mt-2">
                    <input
                      type="number"
                      step="0.01"
                      value={rates[curr.code]}
                      onChange={(e) =>
                        handleRateChange(curr.code, parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    <div className="text-[9px] text-slate-400 mt-0.5">ج.م لكل 1 {curr.code}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Currency Converter & Revaluation Date Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick FX Converter */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 font-cairo">
              حاسبة التحويل اللحظي بين العملات
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="text-xs text-slate-500 block mb-1">المبلغ المراد تحويله:</label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">من عملة:</label>
              <select
                value={calcFromCurrency}
                onChange={(e) => setCalcFromCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">إلى عملة:</label>
              <select
                value={calcToCurrency}
                onChange={(e) => setCalcToCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversion Output Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-sky-800 font-bold">النتيجة المعادلة: </span>
              <strong className="text-base font-black font-mono text-sky-950 ml-1">
                {(convertedResult?.finalAmount || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{' '}
                {calcToCurrency}
              </strong>
            </div>
            <div className="text-[11px] text-sky-700 font-mono">
              سعر التحويل: 1 {calcFromCurrency} = {convertedResult.rate.toFixed(4)} {calcToCurrency}
            </div>
          </div>
        </div>

        {/* Closing Valuation Parameters */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Scale className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 font-cairo">
              معايير إقفال وتقييم العملة
            </h3>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">تاريخ تقييم المركز المالي:</label>
            <input
              type="date"
              value={revaluationDate}
              onChange={(e) => setRevaluationDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800">المعيار المحاسبي المطبق:</div>
            <div className="text-[11px] text-slate-500">
              معيار المحاسبة المصري رقم (13) - آثار التغيرات في أسعار صرف العملات الأجنبية.
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>إجمالي أرباح فروق العملة</span>
          </div>
          <div className="text-xl font-black text-emerald-950 font-mono mt-1">
            +{(revalSummary?.totalGains || 0).toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">تسجل بحساب إيرادات فروق تقييم العملة</div>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
          <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>إجمالي خسائر فروق العملة</span>
          </div>
          <div className="text-xl font-black text-rose-950 font-mono mt-1">
            -{(revalSummary?.totalLosses || 0).toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">تسجل بحساب مصروفات فروق تقييم العملة</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            revalSummary.isNetGain
              ? 'bg-sky-50 border-sky-200 text-sky-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>صافي أثر التقييم على قائمة الدخل</span>
          </div>
          <div className="text-xl font-black font-mono mt-1">
            {revalSummary.isNetGain ? '+' : ''}
            {(revalSummary?.netImpact || 0).toLocaleString()} ج.م
          </div>
          <div className="text-[11px] opacity-80 mt-0.5">
            {revalSummary.isNetGain ? 'صافي أرباح نقد أجنبي دائنة' : 'صافي خسائر نقد أجنبي مدينة'}
          </div>
        </div>
      </div>

      {/* FX Revaluation Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-cairo">
            جدول تفصيلي لإعادة تقييم الحسابات ذات الأرصدة بالعملة الأجنبية
          </h3>
          <span className="text-xs text-slate-500">
            عدد الحسابات المقومة: {revalItems.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                <th className="py-3 px-3">رقم الحساب</th>
                <th className="py-3 px-3">اسم الحساب المحاسبي</th>
                <th className="py-3 px-2 text-center">العملة</th>
                <th className="py-3 px-3 text-left">الرصيد بالعملة</th>
                <th className="py-3 px-2 text-left">سعر الصرف الدفتري</th>
                <th className="py-3 px-3 text-left">القيمة الدفترية (ج.م)</th>
                <th className="py-3 px-2 text-left">سعر الإقفال الحالي</th>
                <th className="py-3 px-3 text-left">القيمة المقومة (ج.م)</th>
                <th className="py-3 px-3 text-left">فرق التقييم (ج.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {revalItems.map((item) => {
                const isGain = item.fxGainLossEGP >= 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-sky-700">{item.accountCode}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                      {item.accountName}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                        {item.currency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900">
                      {(item?.foreignBalance || 0).toLocaleString()} {item.currency}
                    </td>
                    <td className="py-2.5 px-2 text-left text-slate-500">
                      {item.bookExchangeRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-left text-slate-700">
                      {(item?.bookValueEGP || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-left text-sky-700 font-bold">
                      {item.closingExchangeRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900">
                      {(item?.revaluedValueEGP || 0).toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-left font-black ${
                        isGain ? 'text-emerald-700 bg-emerald-50/40' : 'text-rose-700 bg-rose-50/40'
                      }`}
                    >
                      {isGain ? '+' : ''}
                      {(item?.fxGainLossEGP || 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-mono font-black text-xs border-t-2 border-slate-200">
                <td colSpan={2} className="py-3 px-3 text-right font-sans text-slate-900">
                  صافي أثر فروق تقييم أسعار الصرف:
                </td>
                <td colSpan={6} className="py-3 px-2 text-left font-sans text-slate-500">
                  وفق القيد المحاسبي المقترح
                </td>
                <td
                  className={`py-3 px-3 text-left font-black text-sm ${
                    revalSummary.isNetGain ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {revalSummary.isNetGain ? '+' : ''}
                  {(revalSummary?.netImpact || 0).toLocaleString()} ج.م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
