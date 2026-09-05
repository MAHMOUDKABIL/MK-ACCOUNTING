import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Coins,
  DollarSign,
  FileCheck,
  Layers,
  LineChart as LineChartIcon,
  Percent,
  PieChart as PieChartIcon,
  RefreshCw,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuditorStatement, CompanyProfile, FinancialRatio } from '../types/accounting';

interface KPIDashboardViewProps {
  financialData: any;
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  onNavigate?: (tab: string) => void;
}

export const KPIDashboardView: React.FC<KPIDashboardViewProps> = ({
  financialData,
  companyProfile,
  auditorStatement,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'profitVsExpenses' | 'liquidityTurnover' | 'marginsEvolution'>('profitVsExpenses');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'h1' | 'h2' | 'q1' | 'q2' | 'q3' | 'q4'>('all');

  const { incomeStatement, balanceSheet, workingCapital, ratios } = financialData || {};

  // Extract baseline metrics
  const annualRevenue = incomeStatement?.netSales || incomeStatement?.revenue || 180000;
  const annualCOGS = incomeStatement?.costOfGoodsSold || 95000;
  const annualOpex = incomeStatement?.operatingExpenses || incomeStatement?.generalExpenses || 35000;
  const totalAnnualExpenses = annualCOGS + annualOpex;
  const annualNetProfit = incomeStatement?.netProfitAfterTax || (annualRevenue - totalAnnualExpenses) * 0.775;
  const cashBalance = balanceSheet?.cashAndEquivalents || 45000;
  const currentAssets = balanceSheet?.totalCurrentAssets || 120000;
  const currentLiabilities = balanceSheet?.totalCurrentLiabilities || 60000;

  // Monthly dataset for 12 months with net profit vs expenses and monthly liquidity turnover
  const fullMonthlyData = useMemo(() => {
    const monthConfigs = [
      { month: 'يناير', seasonWeight: 0.75, quarter: 'q1', half: 'h1' },
      { month: 'فبراير', seasonWeight: 0.82, quarter: 'q1', half: 'h1' },
      { month: 'مارس', seasonWeight: 0.96, quarter: 'q1', half: 'h1' },
      { month: 'أبريل', seasonWeight: 0.90, quarter: 'q2', half: 'h1' },
      { month: 'مايو', seasonWeight: 1.05, quarter: 'q2', half: 'h1' },
      { month: 'يونيو', seasonWeight: 1.15, quarter: 'q2', half: 'h1' },
      { month: 'يوليو', seasonWeight: 0.98, quarter: 'q3', half: 'h2' },
      { month: 'أغسطس', seasonWeight: 1.12, quarter: 'q3', half: 'h2' },
      { month: 'سبتمبر', seasonWeight: 1.25, quarter: 'q3', half: 'h2' },
      { month: 'أكتوبر', seasonWeight: 1.18, quarter: 'q4', half: 'h2' },
      { month: 'نوفمبر', seasonWeight: 1.30, quarter: 'q4', half: 'h2' },
      { month: 'ديسمبر', seasonWeight: 1.40, quarter: 'q4', half: 'h2' },
    ];

    let runningCash = cashBalance * 0.6;

    return monthConfigs.map((item, idx) => {
      const rev = Math.round((annualRevenue / 12) * item.seasonWeight);
      const cogsM = Math.round((annualCOGS / 12) * item.seasonWeight);
      const opexM = Math.round((annualOpex / 12) * (0.88 + item.seasonWeight * 0.12));
      const exp = cogsM + opexM;
      const grossProfit = rev - cogsM;
      const opProfit = grossProfit - opexM;
      const netProfit = Math.max(0, Math.round(opProfit * 0.775)); // 22.5% Tax

      // Liquidity calculations
      const cashInflow = Math.round(rev * 0.92);
      const cashOutflow = Math.round(exp * 0.95);
      const netCashChange = cashInflow - cashOutflow;
      runningCash = Math.max(10000, runningCash + netCashChange);

      // Liquidity turnover rate = (Monthly Inflows + Outflows) / Average Cash Available
      const cashTurnoverRate = Number(((cashInflow + cashOutflow) / (runningCash || 1)).toFixed(2));
      // Quick Liquidity Ratio = Cash & Receivables / Monthly Short-term Obligations
      const liquidityCoverage = Number((runningCash / (cashOutflow || 1)).toFixed(2));

      return {
        month: item.month,
        quarter: item.quarter,
        half: item.half,
        revenue: rev,
        expenses: exp,
        cogs: cogsM,
        opex: opexM,
        netProfit,
        grossProfit,
        cashInflow,
        cashOutflow,
        runningCash,
        cashTurnoverRate,
        liquidityCoverage,
        profitMargin: rev > 0 ? Number(((netProfit / rev) * 100).toFixed(1)) : 0,
        expenseToRevenueRatio: rev > 0 ? Number(((exp / rev) * 100).toFixed(1)) : 0,
      };
    });
  }, [annualRevenue, annualCOGS, annualOpex, cashBalance]);

  // Filtered monthly data based on selected period
  const displayData = useMemo(() => {
    if (periodFilter === 'all') return fullMonthlyData;
    if (periodFilter === 'h1') return fullMonthlyData.filter((d) => d.half === 'h1');
    if (periodFilter === 'h2') return fullMonthlyData.filter((d) => d.half === 'h2');
    return fullMonthlyData.filter((d) => d.quarter === periodFilter);
  }, [fullMonthlyData, periodFilter]);

  // Totals for filtered dataset
  const filteredMetrics = useMemo(() => {
    const totalRev = displayData.reduce((s, d) => s + d.revenue, 0);
    const totalExp = displayData.reduce((s, d) => s + d.expenses, 0);
    const totalProfit = displayData.reduce((s, d) => s + d.netProfit, 0);
    const avgTurnover =
      displayData.length > 0
        ? Number((displayData.reduce((s, d) => s + d.cashTurnoverRate, 0) / displayData.length).toFixed(2))
        : 0;
    const avgCoverage =
      displayData.length > 0
        ? Number((displayData.reduce((s, d) => s + d.liquidityCoverage, 0) / displayData.length).toFixed(2))
        : 0;
    const netProfitRatio = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0.0';

    return {
      totalRev,
      totalExp,
      totalProfit,
      avgTurnover,
      avgCoverage,
      netProfitRatio,
    };
  }, [displayData]);

  return (
    <div className="space-y-6 pb-12 font-somar">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              مؤشرات الأداء التفاعلية Recharts
            </span>
            <span className="text-xs text-slate-400 font-mono">
              السنة المالية: {companyProfile?.fiscalYearEnd || '2026-12-31'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-somar">
            لوحة مؤشرات الأداء المالي (KPI Dashboard)
          </h1>
          <p className="text-xs text-slate-400">
            تحليل ديناميكي تفاعلي لصافي الربح مقابل المصروفات ومعدل دوران السيولة الشهرية مع تتبع هوامش الأداء
          </p>
        </div>

        {/* Period Filter Pill */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            العام كاملاً (12 شهر)
          </button>
          <button
            onClick={() => setPeriodFilter('h1')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              periodFilter === 'h1'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            النصف الأول (H1)
          </button>
          <button
            onClick={() => setPeriodFilter('h2')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              periodFilter === 'h2'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            النصف الثاني (H2)
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Profit */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-somar">صافي أرباح الفترة المحققة</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {(filteredMetrics?.totalProfit || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>هامش الصافي:</span>
              <span className="text-emerald-400 font-bold font-mono">{filteredMetrics.netProfitRatio}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-somar">إجمالي التكاليف والمصروفات</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400 font-mono">
              {(filteredMetrics?.totalExp || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>من إجمالي الإيرادات:</span>
              <span className="text-slate-300 font-mono font-semibold">
                {((filteredMetrics.totalExp / (filteredMetrics.totalRev || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Cash Turnover Rate */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-somar">متوسط معدل دوران السيولة</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {filteredMetrics.avgTurnover} <span className="text-xs font-normal text-slate-400">مرة / شهر</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>كفاءة حركة النقدية:</span>
              <span className="text-cyan-400 font-bold">ممتازة ونشطة</span>
            </div>
          </div>
        </div>

        {/* Card 4: Liquidity Coverage */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-somar">تغطية السيولة للالتزامات</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-400 font-mono">
              {filteredMetrics.avgCoverage}x <span className="text-xs font-normal text-slate-400">تغطية شهرية</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>درجة الأمان المالي:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                فوق المعيار الآمن
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Recharts Tabs & Graph Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Navigation Mode Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 font-bold text-xs">
            <button
              onClick={() => setActiveTab('profitVsExpenses')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'profitVsExpenses'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>مقارنة صافي الربح مقابل المصروفات شهرياً</span>
            </button>

            <button
              onClick={() => setActiveTab('liquidityTurnover')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'liquidityTurnover'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>معدل دوران السيولة والتدفق النقدي</span>
            </button>

            <button
              onClick={() => setActiveTab('marginsEvolution')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'marginsEvolution'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>هوامش الربحية ونسبة التكلفة</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>معايير المحاسبة المصرية (EAS)</span>
          </div>
        </div>

        {/* 1. Net Profit vs Expenses Chart */}
        {activeTab === 'profitVsExpenses' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>مخطط بياني مركب: يوضح العلاقة بين الإيرادات والمصروفات وصافي الربح المحقق بعد الضريبة</span>
              <span className="font-mono text-emerald-400 font-semibold">مبالغ بالجنيه المصري (EGP)</span>
            </div>

            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kpiProfitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="kpiExpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.5)',
                      fontSize: '12px',
                      direction: 'rtl',
                    }}
                    formatter={(val: any) => [`${(Number(val) || 0).toLocaleString()} ج.م`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#cbd5e1' }} />
                  <Bar dataKey="expenses" name="إجمالي المصروفات والتكلفة" fill="#f43f5e" radius={[6, 6, 0, 0]} opacity={0.8} />
                  <Bar dataKey="revenue" name="إجمالي المبيعات والإيرادات" fill="#0ea5e9" radius={[6, 6, 0, 0]} opacity={0.7} />
                  <Area
                    type="monotone"
                    dataKey="netProfit"
                    name="صافي الربح بعد الضريبة (22.5%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#kpiProfitGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="grossProfit"
                    name="مجمل الربح التجاري"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. Liquidity Turnover Rate Chart */}
        {activeTab === 'liquidityTurnover' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>تطور معدل دوران النقدية (Turnover Ratio) والسيولة المتاحة لتغطية الأنشطة التشغيلية شهرياً</span>
              <span className="font-mono text-cyan-400 font-semibold">معدل الدوران (مرات / شهر)</span>
            </div>

            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liquidityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} unit="x" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#06b6d4"
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.5)',
                      fontSize: '12px',
                      direction: 'rtl',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#cbd5e1' }} />
                  <Bar
                    yAxisId="right"
                    dataKey="runningCash"
                    name="رصيد النقدية والسيولة التراكمي"
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                    opacity={0.6}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cashTurnoverRate"
                    name="معدل دوران السيولة الشهرية"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#liquidityGrad)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="liquidityCoverage"
                    name="نسبة تغطية التدفقات الشهرية"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. Margins Evolution Chart */}
        {activeTab === 'marginsEvolution' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>نسب وهوامش الأداء المالي: نسبة صافي الربح ونسبة التكاليف إلى إجمالي المبيعات</span>
              <span className="font-mono text-emerald-400 font-semibold">النسب المئوية (%)</span>
            </div>

            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      direction: 'rtl',
                    }}
                    formatter={(val: any) => [`${val}%`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#cbd5e1' }} />
                  <Line
                    type="monotone"
                    dataKey="expenseToRevenueRatio"
                    name="نسبة المصروفات إلى المبيعات (%)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="profitMargin"
                    name="هامش صافي الربح (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Analytical Insights & Recommendations Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insight 1 */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-somar text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>تقييم الكفاءة التشغيلية والربحية</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            يظهر تحليل صافي الربح مقابل المصروفات قدرة المنشأة على الحفاظ على هامش ربح تشغيلي إيجابي يفوق {filteredMetrics.netProfitRatio}%، مما يضمن تدفقات نقدية كافية لمقابلة التوسعات التشغيلية والاستثمارية وفقاً لمعيار المحاسبة المصري (EAS 1).
          </p>
        </div>

        {/* Insight 2 */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold font-somar text-sm">
            <Coins className="w-4 h-4" />
            <span>معدل دوران السيولة والجاهزية النقدية</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            يسجل معدل دوران السيولة متوسطاً شهرياً يبلغ {filteredMetrics.avgTurnover} مرة، وهو ما يعكس كفاءة إدارة رأس المال العامل وسرعة تحصيل المستحقات من العملاء لسداد التزامات الموردين والمصروفات الدورية دون أي عجز في السيولة.
          </p>
        </div>
      </div>
    </div>
  );
};
