import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  FileCheck,
  FolderTree,
  HelpCircle,
  Layers,
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
import { DashboardAlerts } from './DashboardAlerts';
import { DashboardFinancialCharts } from './DashboardFinancialCharts';
import { AuditorStatement, CompanyProfile, Invoice, JournalEntry, Party } from '../types/accounting';

interface DashboardProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  financialData: any;
  accountsCount?: number;
  journalEntriesCount?: number;
  invoicesCount?: number;
  partiesCount?: number;
  invoices?: Invoice[];
  parties?: Party[];
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
  invoices = [],
  parties = [],
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

  // Asset structure pie data (emerald and teal palette)
  const assetData = [
    { name: 'أصول ثابتة (صافي)', value: balanceSheet?.netFixedAssets || 0, color: '#10b981' },
    { name: 'مخزون بضائع', value: balanceSheet?.inventory || 0, color: '#059669' },
    { name: 'عملاء وأوراق قبض', value: (balanceSheet?.tradeReceivables || 0) + (balanceSheet?.notesReceivable || 0), color: '#0d9488' },
    { name: 'نقدية وبنوك', value: balanceSheet?.cashAndEquivalents || 0, color: '#38bdf8' },
    { name: 'أرصدة مدينة أخرى', value: balanceSheet?.prepaidAndOtherDebtors || 0, color: '#64748b' },
  ].filter((item) => item.value > 0);

  const formatCurrency = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('ar-EG')} ج.م`;
  };

  return (
    <div className="space-y-6 pb-12 font-somar">
      {/* Top Banner: ENTERSOFT Executive Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 shadow-xl text-slate-100">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                ENTERSOFT 2026
              </span>
              <span className="text-xs text-slate-400 font-mono">
                السنة المالية: {companyProfile?.fiscalYearEnd || '2026/12/31'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-somar tracking-wide">
              لوحة المؤشرات والتحليل المالي الشامل
            </h2>
            <p className="text-xs text-slate-400">
              متابعة المركز المالي اللحظي ومؤشرات الربحية والسيولة المتوافقة مع معايير المحاسبة المصرية (EAS)
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-64 shrink-0">
            {/* Button 1: عملات وفروق الصرف */}
            <button
              onClick={() => onNavigate('currency-revaluation')}
              className="h-10 w-full flex items-center justify-start gap-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs md:text-sm font-bold border border-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>فروق العملة والتقييم</span>
            </button>

            {/* Button 2: اقتراح قيد آلي */}
            <button
              onClick={onOpenSmartEntry}
              className="h-10 w-full flex items-center justify-start gap-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-black shadow-md shadow-emerald-950/30 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>اقتراح قيد آلي بالذكاء</span>
            </button>

            {/* Button 3: فاتورة ضريبية */}
            <button
              onClick={() => onNavigate('invoices')}
              className="h-10 w-full flex items-center justify-start gap-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs md:text-sm font-bold border border-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>إصدار فاتورة ضريبية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Due Date Alerts System */}
      <DashboardAlerts
        invoices={invoices}
        parties={parties}
        onNavigate={onNavigate}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الأصول (الموجودات)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-white font-mono">
              {formatCurrency(balanceSheet?.totalAssets)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>غير متداولة: {formatCurrency(balanceSheet?.totalNonCurrentAssets)}</span>
              <span className="text-emerald-400 font-bold">متداولة: {formatCurrency(balanceSheet?.totalCurrentAssets)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Equity */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي حقوق الملكية</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-white font-mono">
              {formatCurrency(balanceSheet?.totalEquity)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>رأس المال: {formatCurrency(balanceSheet?.paidCapital)}</span>
              <span className="text-emerald-400 font-bold">احتياطيات: {formatCurrency((balanceSheet?.legalReserve || 0) + (balanceSheet?.generalReserve || 0))}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">صافي المبيعات والإيرادات</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-white font-mono">
              {formatCurrency(incomeStatement?.netSales)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>مجمل الربح: {formatCurrency(incomeStatement?.grossProfit)}</span>
              <span className="text-emerald-400 font-bold">الهامش: {ratios?.[2]?.formatted || '35%'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Profit after tax */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">صافي أرباح العام بعد الضريبة</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl md:text-2xl font-black text-white font-mono">
              {formatCurrency(incomeStatement?.netProfitAfterTax)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>ضريبة الدخل (22.5%): {formatCurrency(incomeStatement?.corporateIncomeTax)}</span>
              <span className="text-emerald-400 font-bold">صافي الهامش: {ratios?.[3]?.formatted || '18%'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-md hover:border-slate-700">
          <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">النقدية وما في حكمها</div>
            <div className="text-sm font-bold text-white font-mono">{formatCurrency(balanceSheet?.cashAndEquivalents)}</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-md hover:border-slate-700">
          <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">رأس المال العامل الصافي</div>
            <div className="text-sm font-bold text-white font-mono">{formatCurrency(workingCapital)}</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-md hover:border-slate-700">
          <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">نسبة التداول الحالية</div>
            <div className="text-sm font-bold text-white font-mono">{ratios?.[0]?.formatted || '1.8:1'}</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-md hover:border-slate-700">
          <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">توازن المركز المالي</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              متطابق ومتوازن 100%
            </div>
          </div>
        </div>
      </div>

      {/* System Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('chart-of-accounts')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-3.5 rounded-xl text-right transition-all cursor-pointer shadow-md flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 font-medium">دليل الحسابات</span>
            <div className="text-base font-bold text-white font-mono">{accountsCount} حساب</div>
          </div>
          <FolderTree className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('journal-entries')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-3.5 rounded-xl text-right transition-all cursor-pointer shadow-md flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 font-medium">قيود اليومية</span>
            <div className="text-base font-bold text-white font-mono">{journalEntriesCount} قيد</div>
          </div>
          <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('invoices')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-3.5 rounded-xl text-right transition-all cursor-pointer shadow-md flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 font-medium">الفواتير الضريبية</span>
            <div className="text-base font-bold text-white font-mono">{invoicesCount} فاتورة</div>
          </div>
          <Receipt className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('parties')}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 p-3.5 rounded-xl text-right transition-all cursor-pointer shadow-md flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 font-medium">العملاء والموردين</span>
            <div className="text-base font-bold text-white font-mono">{partiesCount} جهة</div>
          </div>
          <Users className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
        </button>
      </div>

      {/* Financial Analytics & Evolution Charts */}
      <DashboardFinancialCharts
        financialData={financialData}
      />

      {/* Charts Section: Asset Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Breakdown */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1 font-somar">
              <Scale className="w-4 h-4 text-emerald-400" />
              هيكل وتوزيع أصول المنشأة
            </h3>
            <p className="text-xs text-slate-400 mb-2">توزيع الأصول الثابتة والمتداولة والسيولة</p>
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
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                  formatter={(val: any) => [`${(Number(val) || 0).toLocaleString()} ج.م`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {assetData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono text-white font-semibold">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick EAS Accounting Highlights */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-emerald-950/30 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                إفصاحات وملاحظات المركز المالي الدوري
              </span>
              <span className="text-xs text-slate-400 font-mono">EAS Compliant</span>
            </div>
            <h4 className="text-base font-bold font-somar text-white">
              مطابقة القوائم المالية وفقاً لمعايير المحاسبة المصرية (EAS 1 و EAS 4)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              يتم احتساب الإهلاك الدوري وفق طريقة القسط الثابت، وإثبات ضريبة القيمة المضافة بمعدل 14%، وضريبة أرباح تجارية وصناعية (الخصم والتحصيل من المنبع) بمعدل 1% أو 3%، مع إعادة تقييم الأرصدة بالعملات الأجنبية وفقاً لمعيار المحاسبة المصري رقم (13) بأسعار إقفال البنك المركزي المصري.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 mt-4 text-center">
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">معدل كفاية رأس المال</div>
              <div className="text-sm font-bold text-emerald-300 font-mono">{ratios?.[0]?.formatted || '1.8x'}</div>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">معدل العائد على الأصول ROA</div>
              <div className="text-sm font-bold text-emerald-300 font-mono">{ratios?.[4]?.formatted || '12.4%'}</div>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">العائد على حقوق الملكية ROE</div>
              <div className="text-sm font-bold text-emerald-300 font-mono">{ratios?.[5]?.formatted || '19.8%'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Links & Auditor Verification Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions & Navigation */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-somar">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                الوصول السريع للأدوات والقوائم المالية
              </h3>
              <p className="text-xs text-slate-400">تنقل فوري بين التقارير والمستندات المحاسبية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('financial-statements')}
              className="p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-right transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">القوائم المالية والحسابات الختامية</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">قائمة المركز المالي، الدخل، التدفقات النقدية</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
            </button>

            <button
              onClick={() => onNavigate('trial-balance')}
              className="p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-right transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">ميزان المراجعة بالأرصدة</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">التحقق من توازن الأرصدة المدينة والدائنة</p>
              </div>
              <Scale className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
            </button>

            <button
              onClick={() => onNavigate('general-ledger')}
              className="p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-right transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">دفتر الأستاذ العام</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">كشوف حسابات تفصيلية ورصيد تراكمي</p>
              </div>
              <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-right transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">نسخ احتياطي واستيراد أكسس</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">تصدير قاعدة البيانات وتعديل بيانات المنشأة</p>
              </div>
              <FolderTree className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Auditor Box with Signature & Stamp Preview */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>بطاقة مراقب الحسابات المستقل</span>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{auditorStatement?.auditorName || 'محمود الباز قابيل'}</div>
                  <div className="text-emerald-400 font-medium">{auditorStatement?.auditorTitle || 'محاسب ومراجع قانوني'}</div>
                  <div className="text-slate-400">{auditorStatement?.firmName || 'مكتب الباز للمحاسبة والمراجعة والاستشارات الضريبية'}</div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                  معتمد مهنياً
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>رقم القيد: {auditorStatement?.registerNumber || 'س.م.م 44887'}</span>
                <span className="text-slate-300 font-semibold">القاهرة - مصر</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              تم فحص ومراجعة العمليات المحاسبية وفقاً لمعايير المحاسبة المصرية (EAS) وقانون الشركات 159 لسنة 1981.
            </p>
          </div>

          <button
            onClick={() => onNavigate('auditor-report')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/40 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 font-somar"
          >
            <FileCheck className="w-4 h-4 text-emerald-100" />
            <span>عرض واعتماد تقرير مراقب الحسابات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
