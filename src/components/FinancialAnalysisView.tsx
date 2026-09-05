import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Coins,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LineChart,
  Percent,
  PieChart,
  Printer,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { db } from '../services/db';
import { FinancialRatioMetric, MultiYearFinancialSummary } from '../types/analysis';

export const FinancialAnalysisView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ratios' | 'dupont' | 'multiyear' | 'report'>('ratios');

  // Load live computed financial analysis data
  const analysisData = useMemo(() => {
    return db.getFinancialAnalysisData();
  }, []);

  const auditorStatement = useMemo(() => {
    return db.getAuditorStatement();
  }, []);

  const companyProfile = useMemo(() => {
    return db.getCompanyProfile();
  }, []);

  // Filtered metrics list
  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'all') return analysisData.metrics;
    return analysisData.metrics.filter((m) => m.category === selectedCategory);
  }, [analysisData, selectedCategory]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header with Auditor Seal */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white font-somar">
                  أداة التحليل المالي والنسب المقارنة المتقدمة
                </h1>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/30">
                  2024 - 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                فحص ومقارنة مؤشرات السيولة، الربحية، الرافعة المالية، ونموذج دوبونت (DuPont Model) مع تقرير المحاسب القانوني
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>طباعة التقرير التحليلي</span>
          </button>
        </div>
      </div>

      {/* Financial Health Scorecard & Key Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Rating Card */}
        <div className="bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 font-somar">مؤشر الجدارة والسلامة المالية</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{analysisData.healthAssessment.overallScore}</span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
            <span className="mr-auto px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-black">
              {analysisData.healthAssessment.grade}
            </span>
          </div>
          <div className="text-[11px] text-emerald-300/90 font-somar font-medium mt-2">
            {analysisData.healthAssessment.gradeLabel}
          </div>
        </div>

        {/* Liquidity Strength */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">نسبة التداول الحالية (Current Ratio)</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {analysisData.metrics.find((m) => m.id === 'curr-ratio')?.value2026}
              <span className="text-xs font-normal text-slate-400 mr-1">مرة</span>
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +15.2%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            تغطية قوية للديون المتداولة تفوق المعدل المعياري
          </div>
        </div>

        {/* Profitability ROE */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">العائد على حقوق الملكية (ROE)</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {analysisData.dupont.roe}%
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +{analysisData.dupont.roeGrowth}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            عائد قياسي متفوق للمساهمين والشركاء
          </div>
        </div>

        {/* Solvency / Independence */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">نسبة الاستقلال المالي</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {analysisData.metrics.find((m) => m.id === 'fin-independence')?.value2026}%
            </span>
            <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> أمان مالي
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            حقوق الملكية تمول 64.4% من مجمل أصول الشركة
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 no-print">
        <button
          onClick={() => setActiveTab('ratios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ratios'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>جدول النسب والمؤشرات المالية المقارنة</span>
        </button>

        <button
          onClick={() => setActiveTab('dupont')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dupont'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>هيكل وتحليل دوبونت (DuPont ROE Tree)</span>
        </button>

        <button
          onClick={() => setActiveTab('multiyear')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'multiyear'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>مقارنة القوائم المالية (2024 - 2026)</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'report'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>تقرير وتوصيات المحاسب القانوني</span>
        </button>
      </div>

      {/* TAB 1: COMPARATIVE FINANCIAL RATIOS TABLE */}
      {activeTab === 'ratios' && (
        <div className="space-y-4">
          {/* Sub-Category Filters */}
          <div className="flex items-center flex-wrap gap-2 no-print">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              كافة النسب ({analysisData.metrics.length})
            </button>
            <button
              onClick={() => setSelectedCategory('liquidity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'liquidity'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              💧 نسب السيولة
            </button>
            <button
              onClick={() => setSelectedCategory('profitability')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'profitability'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              📈 نسب الربحية والعائد
            </button>
            <button
              onClick={() => setSelectedCategory('leverage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'leverage'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              ⚖️ الرافعة المالية والمديونية
            </button>
            <button
              onClick={() => setSelectedCategory('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'activity'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              ⚡ نسب النشاط والكفاءة
            </button>
          </div>

          {/* Ratios Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] font-bold font-somar">
                    <th className="py-4 px-4 w-72">النسبة والمؤشر المالي</th>
                    <th className="py-4 px-4 w-52">معادلة الاحتساب المحاسبية</th>
                    <th className="py-4 px-4 text-center font-mono text-emerald-400 bg-emerald-950/20">
                      عام 2026 (الحالي)
                    </th>
                    <th className="py-4 px-4 text-center font-mono text-slate-300 bg-slate-950/40">
                      عام 2025 (السابق)
                    </th>
                    <th className="py-4 px-4 text-center font-mono text-slate-400">
                      عام 2024 (الأساس)
                    </th>
                    <th className="py-4 px-4 text-center">التغير السنوي</th>
                    <th className="py-4 px-4 text-center w-28">المعدل المعياري</th>
                    <th className="py-4 px-4 text-center w-24">التقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredMetrics.map((m) => {
                    const isPositive = m.trend === 'up';

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                        {/* Name & English */}
                        <td className="py-3.5 px-4 font-somar">
                          <div className="font-extrabold text-white text-xs">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{m.englishName}</div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{m.interpretation}</div>
                        </td>

                        {/* Formula */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 bg-slate-950/30">
                          {m.formula}
                        </td>

                        {/* 2026 Value */}
                        <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-emerald-400 bg-emerald-950/10">
                          {m.unit === 'EGP'
                            ? `${(m?.value2026 || 0).toLocaleString()} ج.م`
                            : m.unit === '%'
                            ? `${m.value2026}%`
                            : m.unit === 'days'
                            ? `${m.value2026} يوم`
                            : `${m.value2026} مرة`}
                        </td>

                        {/* 2025 Value */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300 bg-slate-950/20">
                          {m.unit === 'EGP'
                            ? `${(m?.value2025 || 0).toLocaleString()} ج.م`
                            : m.unit === '%'
                            ? `${m.value2025}%`
                            : m.unit === 'days'
                            ? `${m.value2025} يوم`
                            : `${m.value2025} مرة`}
                        </td>

                        {/* 2024 Value */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          {m.unit === 'EGP'
                            ? `${(m?.value2024 || 0).toLocaleString()} ج.م`
                            : m.unit === '%'
                            ? `${m.value2024}%`
                            : m.unit === 'days'
                            ? `${m.value2024} يوم`
                            : `${m.value2024} مرة`}
                        </td>

                        {/* YoY Change */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {m.changeYoY > 0 ? `+${m.changeYoY}%` : `${m.changeYoY}%`}
                          </span>
                        </td>

                        {/* Benchmark */}
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                          {m.benchmark}
                        </td>

                        {/* Status Label */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-somar">
                            {m.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DUPONT 3-STEP ROE MODEL */}
      {activeTab === 'dupont' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-white font-somar flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-400" />
                  نموذج تحليل دوبونت لتفكيك العائد على حقوق الملكية (DuPont ROE Model)
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  تفكيك العائد على حقوق الملكية إلى 3 ركائز رئيسية: هامش الربح الصافي × معدل دوران الأصول × مضاعف حقوق الملكية
                </p>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-slate-400 block font-somar">العائد الإجمالي (ROE)</span>
                <span className="text-2xl font-black text-emerald-400">{analysisData.dupont.roe}%</span>
              </div>
            </div>

            {/* DuPont 3 Components Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Component 1: Net Profit Margin */}
              <div className="bg-slate-950 p-5 rounded-xl border border-indigo-500/30 relative">
                <div className="text-xs font-bold text-indigo-400 font-somar flex items-center justify-between">
                  <span>1. كفاءة الربحية التشغيلية</span>
                  <Percent className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-sm font-bold text-white font-somar mt-2">
                  هامش صافي الربح (Net Profit Margin)
                </div>
                <div className="text-3xl font-black text-indigo-400 font-mono mt-2">
                  {analysisData.dupont.netProfitMargin}%
                </div>
                <div className="text-xs text-slate-400 mt-2 font-somar">
                  (صافي الربح ÷ المبيعات)
                </div>
                <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
                  يقيس مدى قدرة الشركة على تحويل المبيعات إلى أرباح صافية بعد خصم كافة التكاليف والضرائب.
                </div>
              </div>

              {/* Component 2: Asset Turnover */}
              <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 relative">
                <div className="text-xs font-bold text-cyan-400 font-somar flex items-center justify-between">
                  <span>2. كفاءة تشغيل واستخدام الأصول</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-sm font-bold text-white font-somar mt-2">
                  معدل دوران الأصول (Asset Turnover)
                </div>
                <div className="text-3xl font-black text-cyan-400 font-mono mt-2">
                  {analysisData.dupont.assetTurnover} <span className="text-base text-slate-400">مرة</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 font-somar">
                  (صافي المبيعات ÷ إجمالي الأصول)
                </div>
                <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
                  يقيس حجم المبيعات المتولدة من كل جنيه مستثمر في أصول المنشأة الثابتة والمتداولة.
                </div>
              </div>

              {/* Component 3: Equity Multiplier */}
              <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 relative">
                <div className="text-xs font-bold text-amber-400 font-somar flex items-center justify-between">
                  <span>3. الرافعة المالية والتمويل</span>
                  <Scale className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-sm font-bold text-white font-somar mt-2">
                  مضاعف حقوق الملكية (Equity Multiplier)
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                  {analysisData.dupont.equityMultiplier} <span className="text-base text-slate-400">مرة</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 font-somar">
                  (إجمالي الأصول ÷ حقوق الملكية)
                </div>
                <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
                  يقيس مدى اعتماد المنشأة على أموال الديون والالتزامات لتمويل أصولها مقارنة بحقوق المساهمين.
                </div>
              </div>
            </div>

            {/* Formula Visual Breakdown Box */}
            <div className="mt-6 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono text-sm text-slate-200">
              <span className="text-emerald-400 font-bold font-somar">العائد على حقوق الملكية (ROE)</span> ={' '}
              <span className="text-indigo-400 font-bold">{analysisData.dupont.netProfitMargin}%</span> ×{' '}
              <span className="text-cyan-400 font-bold">{analysisData.dupont.assetTurnover}</span> ×{' '}
              <span className="text-amber-400 font-bold">{analysisData.dupont.equityMultiplier}</span> ={' '}
              <span className="text-emerald-400 font-black text-base">{analysisData.dupont.roe}%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-YEAR FINANCIAL STATEMENTS COMPARISON */}
      {activeTab === 'multiyear' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-black text-white text-sm font-somar flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                المقارنة السنوية لبنود قائمة الدخل والمركز المالي (2024 - 2025 - 2026)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] font-bold font-somar">
                    <th className="py-3 px-4">البند المالي (Financial Line Item)</th>
                    <th className="py-3 px-4 text-center font-mono text-emerald-400 bg-emerald-950/20">عام 2026</th>
                    <th className="py-3 px-4 text-center font-mono text-slate-300">عام 2025</th>
                    <th className="py-3 px-4 text-center font-mono text-slate-400">عام 2024</th>
                    <th className="py-3 px-4 text-center">معدل النمو (2025-2026)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Revenue */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-somar font-bold text-white">إجمالي إيرادات النشاط والمبيعات</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-emerald-950/10">
                      {(analysisData.multiYearData[2]?.revenue || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {(analysisData.multiYearData[1]?.revenue || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {(analysisData.multiYearData[0]?.revenue || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">+17.7%</td>
                  </tr>

                  {/* Gross Profit */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-somar font-bold text-slate-200">مجمل الربح (Gross Profit)</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-emerald-950/10">
                      {(analysisData.multiYearData[2]?.grossProfit || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {(analysisData.multiYearData[1]?.grossProfit || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {(analysisData.multiYearData[0]?.grossProfit || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">+25.0%</td>
                  </tr>

                  {/* Net Income */}
                  <tr className="hover:bg-slate-800/40 bg-indigo-950/10">
                    <td className="py-3 px-4 font-somar font-black text-indigo-300">صافي الربح بعد الضرائب (Net Income)</td>
                    <td className="py-3 px-4 text-center font-black text-indigo-300 bg-emerald-950/10">
                      {(analysisData.multiYearData[2]?.netIncome || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {(analysisData.multiYearData[1]?.netIncome || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {(analysisData.multiYearData[0]?.netIncome || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">+28.4%</td>
                  </tr>

                  {/* Total Assets */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-somar font-bold text-white">إجمالي الأصول (Total Assets)</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-emerald-950/10">
                      {(analysisData.multiYearData[2]?.totalAssets || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {(analysisData.multiYearData[1]?.totalAssets || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {(analysisData.multiYearData[0]?.totalAssets || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">+16.9%</td>
                  </tr>

                  {/* Total Equity */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-somar font-bold text-white">إجمالي حقوق الملكية (Total Equity)</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-emerald-950/10">
                      {(analysisData.multiYearData[2]?.totalEquity || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {(analysisData.multiYearData[1]?.totalEquity || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {(analysisData.multiYearData[0]?.totalEquity || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">+20.9%</td>
                  </tr>

                  {/* Total Liabilities */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-somar font-bold text-slate-300">إجمالي الالتزامات والديون</td>
                    <td className="py-3 px-4 text-center text-slate-200 bg-emerald-950/10">
                      {(analysisData.multiYearData[2]?.totalLiabilities || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {(analysisData.multiYearData[1]?.totalLiabilities || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {(analysisData.multiYearData[0]?.totalLiabilities || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">+10.1%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDITOR'S OFFICIAL ANALYSIS REPORT & STRATEGIC RECOMMENDATIONS */}
      {activeTab === 'report' && (
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white font-somar">
                  تقرير الفحص والتحليل المالي المعتمد
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  صادر عن مكتب المحاسب والمراجع القانوني: {auditorStatement.accountantName || 'محمود الباز قابيل'}
                </p>
              </div>
              <div className="text-left font-mono text-xs text-slate-400">
                <span>رقم القيد: </span>
                <span className="text-white font-bold">{auditorStatement.registerNumber || '44887'}</span>
              </div>
            </div>
          </div>

          {/* Health Dimensions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 font-somar mb-1">
                💧 تقييم موقف السيولة ورأس المال العامل
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-somar">
                {analysisData.healthAssessment.liquidityHealth}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-indigo-400 font-somar mb-1">
                📈 تقييم الربحية ومعدلات العائد
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-somar">
                {analysisData.healthAssessment.profitabilityHealth}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-amber-400 font-somar mb-1">
                ⚖️ تقييم الملاءة والمديونية وهيكل التمويل
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-somar">
                {analysisData.healthAssessment.solvencyHealth}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-cyan-400 font-somar mb-1">
                ⚡ تقييم كفاءة إدارة الأصول والمخزون والتحصيل
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-somar">
                {analysisData.healthAssessment.efficiencyHealth}
              </p>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white font-somar flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              التوصيات الاستراتيجية للمحاسب القانوني والإدارة المالية:
            </h4>
            <ul className="space-y-2">
              {analysisData.healthAssessment.strategicRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-somar">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Signatures and Stamp */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 font-somar">اعتماد المحاسب القانوني والمراجع:</div>
              <div className="text-sm font-black text-white font-somar mt-1">
                {auditorStatement.accountantName || 'محمود الباز قابيل'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {auditorStatement.registerNumber || 'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية'}
              </div>
            </div>

            <div className="w-28 h-28 border-2 border-dashed border-slate-700 rounded-full flex flex-col items-center justify-center text-center p-2">
              <span className="text-[9px] text-slate-400 font-somar font-bold">خاتم وتوقيع</span>
              <span className="text-[10px] text-emerald-400 font-somar font-black">المحاسب القانوني</span>
              <span className="text-[9px] text-slate-500 font-mono">سجل 44887</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
