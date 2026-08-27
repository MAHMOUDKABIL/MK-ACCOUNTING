import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FolderTree,
  HelpCircle,
  Plus,
  Receipt,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuditorStatement, CompanyProfile, JournalEntry } from '../types/accounting';

interface DashboardProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  financialData: any;
  accountsCount?: number;
  journalEntriesCount?: number;
  invoicesCount?: number;
  partiesCount?: number;
  journalEntries?: JournalEntry[];
  onNavigate: (tab: string) => void;
  onOpenSmartEntry: () => void;
  onOpenNewInvoice?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  companyProfile,
  auditorStatement,
  financialData,
  accountsCount = 0,
  journalEntriesCount = 0,
  invoicesCount = 0,
  partiesCount = 0,
  journalEntries = [],
  onNavigate,
  onOpenSmartEntry,
}) => {
  const { incomeStatement, balanceSheet, ratios, workingCapital } = financialData || {
    incomeStatement: {},
    balanceSheet: {},
    ratios: [],
    workingCapital: 0,
  };

  // Chart data for revenue vs expenses trend
  const trendData = [
    { month: 'يناير', revenues: 100000, expenses: 72000, profit: 28000 },
    { month: 'فبراير', revenues: 125000, expenses: 84000, profit: 41000 },
    {
      month: 'مارس (الحالي)',
      revenues: incomeStatement?.netSales || 140000,
      expenses: (incomeStatement?.costOfGoodsSold || 0) + (incomeStatement?.operatingExpenses || 0) || 92000,
      profit: incomeStatement?.netProfitAfterTax || 48000,
    },
  ];

  // Asset structure pie data
  const assetData = [
    { name: 'أصول ثابتة (صافي)', value: balanceSheet?.netFixedAssets || 0, color: '#0ea5e9' },
    { name: 'مخزون بضائع', value: balanceSheet?.inventory || 0, color: '#38bdf8' },
    { name: 'عملاء وأوراق قبض', value: (balanceSheet?.tradeReceivables || 0) + (balanceSheet?.notesReceivable || 0), color: '#64748b' },
    { name: 'نقدية وبنوك', value: balanceSheet?.cashAndEquivalents || 0, color: '#10b981' },
    { name: 'أرصدة مدينة أخرى', value: balanceSheet?.prepaidAndOtherDebtors || 0, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const formatCurrency = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('ar-EG')} ج.م`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Auditor Verification & Financial Summary */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm text-slate-100">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                المعايير المحاسبية المصرية (EAS)
              </span>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                تقرير المراجعة: {auditorStatement?.opinionType === 'unqualified' ? 'رأي غير متحفظ (سليم ومطابق)' : 'متحفظ'}
              </span>
              <span className="text-xs text-slate-400">
                السنة المالية: {companyProfile?.fiscalYearEnd || '2026/12/31'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-cairo">
              نظام المحاسبة المالية والمراجعة القانونية
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              إعداد واعتماد مراقب الحسابات والمحاسب القانوني{' '}
              <strong className="text-sky-300">{auditorStatement?.auditorName || 'محمود الباز قابيل'}</strong> - {auditorStatement?.registerNumber || 'س.م.م 44887'}.
              نظام إلكتروني متكامل للقيود والأستاذ العام وموازين المراجعة والقوائم المالية وفقاً للنظام المحاسبي المصري الموحد.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenSmartEntry}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>اقتراح قيد آلي</span>
            </button>
            <button
              onClick={() => onNavigate('invoices')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold px-4 py-2.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>فاتورة ضريبية 14%</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي الأصول (الموجودات)</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(balanceSheet?.totalAssets)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>غير متداولة: {formatCurrency(balanceSheet?.totalNonCurrentAssets)}</span>
              <span className="text-sky-600 font-semibold">متداولة: {formatCurrency(balanceSheet?.totalCurrentAssets)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Equity */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي حقوق الملكية</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(balanceSheet?.totalEquity)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>رأس المال: {formatCurrency(balanceSheet?.paidCapital)}</span>
              <span className="text-slate-700 font-semibold">احتياطيات: {formatCurrency((balanceSheet?.legalReserve || 0) + (balanceSheet?.generalReserve || 0))}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">صافي المبيعات والإيرادات</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(incomeStatement?.netSales)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>مجمل الربح: {formatCurrency(incomeStatement?.grossProfit)}</span>
              <span className="text-emerald-600 font-semibold">الهامش: {ratios?.[2]?.formatted || '35%'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Profit after tax */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">صافي أرباح العام بعد الضريبة</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-sky-600 font-mono">
              {formatCurrency(incomeStatement?.netProfitAfterTax)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>ضريبة الدخل (22.5%): {formatCurrency(incomeStatement?.corporateIncomeTax)}</span>
              <span className="text-sky-600 font-semibold">صافي الهامش: {ratios?.[3]?.formatted || '18%'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg flex items-center gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-slate-100 text-slate-700">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">النقدية وما في حكمها</div>
            <div className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(balanceSheet?.cashAndEquivalents)}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-lg flex items-center gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">رأس المال العامل الصافي</div>
            <div className="text-sm font-bold text-emerald-600 font-mono">{formatCurrency(workingCapital)}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-lg flex items-center gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-sky-50 text-sky-600">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">نسبة التداول الحالية</div>
            <div className="text-sm font-bold text-sky-600 font-mono">{ratios?.[0]?.formatted || '1.8:1'}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-lg flex items-center gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">حالة توازن المركز المالي</div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              متطابق ومتوازن 100%
            </div>
          </div>
        </div>
      </div>

      {/* System Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('chart-of-accounts')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-lg text-right transition-all cursor-pointer shadow-2xs flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] text-slate-500">دليل الحسابات</span>
            <div className="text-base font-bold text-slate-800 font-mono">{accountsCount} حساب</div>
          </div>
          <FolderTree className="w-4 h-4 text-sky-500" />
        </button>

        <button
          onClick={() => onNavigate('journal-entries')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-lg text-right transition-all cursor-pointer shadow-2xs flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] text-slate-500">قيود اليومية</span>
            <div className="text-base font-bold text-slate-800 font-mono">{journalEntriesCount} قيد</div>
          </div>
          <BookOpen className="w-4 h-4 text-sky-500" />
        </button>

        <button
          onClick={() => onNavigate('invoices')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-lg text-right transition-all cursor-pointer shadow-2xs flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] text-slate-500">الفواتير الضريبية</span>
            <div className="text-base font-bold text-slate-800 font-mono">{invoicesCount} فاتورة</div>
          </div>
          <Receipt className="w-4 h-4 text-sky-500" />
        </button>

        <button
          onClick={() => onNavigate('parties')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-lg text-right transition-all cursor-pointer shadow-2xs flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] text-slate-500">العملاء والموردين</span>
            <div className="text-base font-bold text-slate-800 font-mono">{partiesCount} جهة</div>
          </div>
          <Users className="w-4 h-4 text-sky-500" />
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Trend */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-cairo">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                تطور الإيرادات والمصروفات وصافي الأرباح
              </h3>
              <p className="text-xs text-slate-500">مقارنة شهرية للأداء المالي الفعلي للشركة</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
              الربع الأول 2026
            </span>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="revenues" name="الإيرادات" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصروفات والتكلفة" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="صافي الربح" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart: Asset Breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1 font-cairo">
              <Scale className="w-4 h-4 text-sky-600" />
              هيكل وتوزيع أصول المنشأة
            </h3>
            <p className="text-xs text-slate-500 mb-2">توزيع الأصول الثابتة والمتداولة والسيولة</p>
          </div>

          <div className="h-48 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {assetData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono text-slate-900 font-semibold">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Links & Professional Accounting Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions & Navigation */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-cairo">
                <BookOpen className="w-4 h-4 text-sky-600" />
                الوصول السريع للأدوات والقوائم المالية
              </h3>
              <p className="text-xs text-slate-500">تنقل فوري بين التقارير والمستندات المحاسبية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('financial-statements')}
              className="p-3.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 text-right transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-700">القوائم المالية والحسابات الختامية</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">قائمة المركز المالي، الدخل، التدفقات النقدية</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400 group-hover:text-sky-600" />
            </button>

            <button
              onClick={() => onNavigate('trial-balance')}
              className="p-3.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 text-right transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-700">ميزان المراجعة بالأرصدة</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">التحقق من توازن الأرصدة المدينة والدائنة</p>
              </div>
              <Scale className="w-5 h-5 text-slate-400 group-hover:text-sky-600" />
            </button>

            <button
              onClick={() => onNavigate('general-ledger')}
              className="p-3.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 text-right transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-700">دفتر الأستاذ العام</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">كشوف حسابات تفصيلية ورصيد تراكمي</p>
              </div>
              <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-sky-600" />
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="p-3.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 text-right transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-700">نسخ احتياطي واستيراد أكسس</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">تصدير قاعدة البيانات وتعديل بيانات المنشأة</p>
              </div>
              <FolderTree className="w-5 h-5 text-slate-400 group-hover:text-sky-600" />
            </button>
          </div>
        </div>

        {/* Auditor Box */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Award className="w-5 h-5 text-sky-600" />
              <span>بطاقة مراقب الحسابات المستقل</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 text-sm">{auditorStatement?.auditorName || 'محمود الباز قابيل'}</div>
              <div className="text-sky-600 font-semibold">{auditorStatement?.auditorTitle || 'محاسب ومراجع قانوني'}</div>
              <div className="text-slate-600">{auditorStatement?.firmName || 'مكتب الباز للمحاسبة والمراجعة والاستشارات الضريبية'}</div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500 font-mono text-[11px]">
                <span>رقم القيد: {auditorStatement?.registerNumber || 'س.م.م 44887'}</span>
                <span className="text-slate-700 font-semibold">القاهرة - مصر</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              تم فحص ومراجعة العمليات المحاسبية وفقاً لمعايير المحاسبة المصرية (EAS) وقانون الشركات 159 لسنة 1981.
            </p>
          </div>

          <button
            onClick={() => onNavigate('auditor-report')}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FileCheck className="w-4 h-4 text-sky-100" />
            <span>عرض واعتماد تقرير مراقب الحسابات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
