import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Percent,
  Printer,
  Scale,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { GoogleSheetsExportModal } from './GoogleSheetsExportModal';
import { AuditorStatement, CompanyProfile, FinancialRatio } from '../types/accounting';
import { exportMultipleSheetsToExcel, exportToWordDoc } from '../utils/exportUtils';
import { exportElementToPDF } from '../utils/pdfExport';
import { A4ReportViewerModal } from './A4ReportViewerModal';

interface FinancialStatementsViewProps {
  financialData: any;
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
}

export const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({
  financialData,
  companyProfile,
  auditorStatement,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'balance-sheet' | 'income-statement' | 'cash-flow' | 'trading-pl' | 'ratios'
  >('balance-sheet');
  const [isLetterheadMode, setIsLetterheadMode] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isA4PreviewOpen, setIsA4PreviewOpen] = useState<boolean>(false);
  const statementRef = useRef<HTMLDivElement>(null);

  const { incomeStatement, balanceSheet, cashFlow, ratios, workingCapital } = financialData;

  const formatEGP = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('ar-EG')} ج.م`;
  };

  const getSubTabTitle = () => {
    switch (activeSubTab) {
      case 'balance-sheet': return 'قائمة المركز المالي';
      case 'income-statement': return 'قائمة الدخل';
      case 'cash-flow': return 'قائمة التدفقات النقدية';
      case 'trading-pl': return 'حساب المتاجرة والأرباح والخسائر';
      case 'ratios': return 'المؤشرات والنسب المالية';
    }
  };

  const handleExportPDF = async () => {
    if (!statementRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportElementToPDF(
        statementRef.current,
        `${getSubTabTitle()}_${companyProfile.name || 'الشركة'}_2026.pdf`,
        {
          companyProfile,
          auditorStatement,
          reportTitle: getSubTabTitle(),
          includeLetterhead: !isLetterheadMode,
          includeStamp: true,
        }
      );
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    const isData = incomeStatement ? [
      { 'البند المحاسبي': 'إيرادات المبيعات', 'المبلغ': incomeStatement.revenue || 0 },
      { 'البند المحاسبي': 'تكلفة المبيعات', 'المبلغ': incomeStatement.costOfGoodsSold || 0 },
      { 'البند المحاسبي': 'مجمل الربح', 'المبلغ': incomeStatement.grossProfit || 0 },
      { 'البند المحاسبي': 'المصروفات العمومية والإدارية', 'المبلغ': incomeStatement.generalExpenses || 0 },
      { 'البند المحاسبي': 'إهلاك الأصول الثابتة', 'المبلغ': incomeStatement.depreciationExpense || 0 },
      { 'البند المحاسبي': 'أرباح التشغيل (EBIT)', 'المبلغ': incomeStatement.operatingProfit || 0 },
      { 'البند المحاسبي': 'صافي أرباح العام بعد الضرائب', 'المبلغ': incomeStatement.netIncome || 0 },
    ] : [];

    const bsData = balanceSheet ? [
      { 'الجانب': 'الأصول غير المتداولة', 'البند': 'صافي الأصول الثابتة', 'المبلغ': balanceSheet.nonCurrentAssets?.fixedAssets || 0 },
      { 'الجانب': 'الأصول غير المتداولة', 'البند': 'إجمالي الأصول غير المتداولة', 'المبلغ': balanceSheet.nonCurrentAssets?.total || 0 },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'المخزون السلعي', 'المبلغ': balanceSheet.currentAssets?.inventory || 0 },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'العملاء والمدينون', 'المبلغ': balanceSheet.currentAssets?.receivables || 0 },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'النقدية وما في حكمها', 'المبلغ': balanceSheet.currentAssets?.cash || 0 },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'إجمالي الأصول المتداولة', 'المبلغ': balanceSheet.currentAssets?.total || 0 },
      { 'الجانب': 'إجمالي الأصول', 'البند': 'مجموع الأصول الكاملة', 'المبلغ': balanceSheet.totalAssets || 0 },
      { 'الجانب': 'حقوق الملكية', 'البند': 'رأس المال والاحتياطيات والأرباح', 'المبلغ': balanceSheet.equity?.total || 0 },
      { 'الجانب': 'الالتزامات', 'البند': 'إجمالي الالتزامات المتداولة وغير المتداولة', 'المبلغ': (balanceSheet.currentLiabilities?.total || 0) + (balanceSheet.nonCurrentLiabilities?.total || 0) },
      { 'الجانب': 'المجموع', 'البند': 'إجمالي الالتزامات وحقوق الملكية', 'المبلغ': balanceSheet.totalLiabilitiesAndEquity || 0 },
    ] : [];

    exportMultipleSheetsToExcel(
      [
        { sheetName: 'قائمة المركز المالي', data: bsData },
        { sheetName: 'قائمة الدخل', data: isData },
      ],
      `القوائم_المالية_${companyProfile.name || 'الشركة'}_2026.xlsx`
    );
  };

  const handleExportWord = () => {
    if (!statementRef.current) return;
    const contentHtml = statementRef.current.innerHTML;
    exportToWordDoc(
      `${getSubTabTitle()} - ${companyProfile.name || 'الشركة'}`,
      contentHtml,
      `${getSubTabTitle()}_${companyProfile.name || 'الشركة'}_2026.doc`
    );
  };

  return (
    <div className="space-y-6 pb-12 font-somar">
      {/* Google Sheets Modal */}
      <GoogleSheetsExportModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        type="financial_statements"
        financialData={financialData}
        companyProfile={companyProfile}
      />

      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-somar flex items-center gap-2">
              القوائم المالية الختامية (Financial Statements)
            </h2>
            <p className="text-xs text-slate-400">
              القوائم المالية المعتمدة وفق معايير المحاسبة المصرية (EAS) وقانون الشركات 159
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* A4 Report Sheet Preview Modal Trigger */}
          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة القائمة A4</span>
          </button>

          {/* Letterhead Print Mode Toggle */}
          <button
            onClick={() => setIsLetterheadMode(!isLetterheadMode)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-md ${
              isLetterheadMode
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isLetterheadMode ? (
              <ToggleRight className="w-5 h-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-500" />
            )}
            <span>طباعة ورق مروّس (Letterhead)</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير PDF مع الاعتماد'}</span>
          </button>

          {/* Export Word */}
          <button
            onClick={handleExportWord}
            title="تصدير إلى ملف Microsoft Word (.doc)"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>تصدير WORD</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            title="تصدير إلى مصنف Excel (.xlsx)"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير EXCEL</span>
          </button>

          {/* Export to Google Sheets */}
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <FileUp className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة A4</span>
          </button>
        </div>
      </div>

      {/* Letterhead Mode Active Banner */}
      {isLetterheadMode && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 flex items-center justify-between no-print shadow-md">
          <div className="flex items-center gap-2.5 font-bold font-somar">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>
              نمط الطباعة على ورق ذي رأسية مفعل: تم حجز مسافة علوية (Header Margin) لأوراق الشركة الرسمية.
            </span>
          </div>
          <button
            onClick={() => setIsLetterheadMode(false)}
            className="text-xs underline text-white font-bold cursor-pointer shrink-0 ml-2"
          >
            إلغاء وتعيين الطباعة الكاملة
          </button>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs font-bold no-print">
        <button
          onClick={() => setActiveSubTab('balance-sheet')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'balance-sheet'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>قائمة المركز المالي (الميزانية)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('income-statement')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'income-statement'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>قائمة الدخل الشامل (الأرباح والخسائر)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cash-flow')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cash-flow'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>قائمة التدفقات النقدية (EAS 4)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trading-pl')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'trading-pl'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>حساب المتاجرة والأرباح والخسائر</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ratios')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'ratios'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>المؤشرات والنسب المالية</span>
        </button>
      </div>

      {/* Financial Statement Content Document */}
      <div
        ref={statementRef}
        id="financial-statement-print-sheet"
        className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 transition-all text-slate-100 ${
          isLetterheadMode ? 'print:pt-32 print:border-none print:shadow-none print:p-0' : ''
        }`}
      >
        {/* Printable Official Statement Header */}
        <div className="text-center border-b border-slate-800 pb-5 space-y-1">
          {!isLetterheadMode ? (
            <>
              <h2 className="text-lg md:text-xl font-black text-white font-somar">
                {companyProfile.name}
              </h2>
              <p className="text-xs text-slate-400">{companyProfile.legalForm}</p>
            </>
          ) : (
            <div className="print:hidden bg-slate-950 border border-dashed border-slate-800 p-2.5 rounded-xl text-[11px] text-slate-400 font-mono">
              [ مساحة مخصصة للترويسة الرسمية المطبوعة مسبقاً على ورق الشركة - Letterhead Area 3.5cm ]
            </div>
          )}
          <h3 className="text-sm font-bold text-emerald-400 font-somar pt-2">
            {activeSubTab === 'balance-sheet' && 'قائمة المركز المالي كما في 31 ديسمبر 2026'}
            {activeSubTab === 'income-statement' && 'قائمة الدخل عن السنة المالية المنتهية في 31 ديسمبر 2026'}
            {activeSubTab === 'cash-flow' && 'قائمة التدفقات النقدية عن السنة المالية المنتهية في 31 ديسمبر 2026'}
            {activeSubTab === 'trading-pl' && 'حساب المتاجرة والأرباح والخسائر الختامي لعام 2026'}
            {activeSubTab === 'ratios' && 'تقرير التحليل المالي والمؤشرات الرقابية وفق المعايير المصرية'}
          </h3>
          <div className="text-[11px] text-slate-400 font-mono">
            (المبالغ بالجنيه المصري EGP - معدة وفقاً لمعايير المحاسبة المصرية)
          </div>
        </div>

        {/* 1. BALANCE SHEET (قائمة المركز المالي) */}
        {activeSubTab === 'balance-sheet' && (
          <div className="space-y-6 text-xs">
            {/* Assets Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-emerald-400 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 font-somar">
                أولاً: الأصول (Assets)
              </h4>

              {/* Non-current assets */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-300 font-somar">الأصول غير المتداولة (الثابتة):</div>
                <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-4 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>الأصول الثابتة (بالتكلفة الإجمالية)</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.nonCurrentAssetsGross)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-400">
                    <span>يخصم: مجمع إهلاك الأصول الثابتة</span>
                    <span className="font-mono">({formatEGP(balanceSheet.accumulatedDepreciation)})</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-emerald-400">
                    <span>صافي الأصول الثابتة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.netFixedAssets)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>مشروعات تحت التنفيذ</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.projectsInProgress)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>أصول غير ملموسة وبرمجيات</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.intangibleAssets)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-emerald-400 border-t border-slate-800 text-sm">
                    <span>إجمالي الأصول غير المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalNonCurrentAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Current assets */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-300 font-somar">الأصول المتداولة:</div>
                <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-4 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>المخزون السلعي (بضاعة بالمستودع واعتمادات)</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.inventory)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>العملاء وأوراق القبض (شيكات برسم التحصيل)</span>
                    <span className="font-mono text-white">
                      {formatEGP(balanceSheet.tradeReceivables + balanceSheet.notesReceivable)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>المدينون والأرصدة المدينة الأخرى (مصروفات مقدمة وضرائب)</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.prepaidAndOtherDebtors)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>النقدية وما في حكمها (خزينة وحسابات جارية بالبنوك)</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.cashAndEquivalents)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-emerald-400 border-t border-slate-800 text-sm">
                    <span>إجمالي الأصول المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalCurrentAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="flex justify-between p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl font-bold text-sm text-emerald-300 font-mono">
                <span className="font-somar font-black">إجمالي الأصول (الموجودات)</span>
                <span className="text-emerald-400 font-black text-base">{formatEGP(balanceSheet.totalAssets)}</span>
              </div>
            </div>

            {/* Equity & Liabilities Section */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-bold text-sm text-purple-400 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 font-somar">
                ثانياً: الالتزامات وحقوق الملكية (Equity & Liabilities)
              </h4>

              {/* Equity */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-300 font-somar">حقوق الملكية (Equity):</div>
                <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-4 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>رأس المال المصدر والمدفوع</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.paidCapital)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>الاحتياطي القانوني (5% من الأرباح وفق القانون 159)</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.legalReserve)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>الاحتياطي النظامي والعام</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.generalReserve)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>الأرباح (الخسائر) المرحلة من سنوات سابقة</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>جاري الشركاء / صاحب المنشأة</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.partnersCurrent)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-emerald-400">
                    <span>صافي أرباح الفترة الحالية (من قائمة الدخل)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.netProfitAfterTax)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-purple-400 border-t border-slate-800 text-sm">
                    <span>إجمالي حقوق الملكية للمساهمين</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalEquity)}</span>
                  </div>
                </div>
              </div>

              {/* Non-current liabilities */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-300 font-somar">الالتزامات غير المتداولة (طويلة الأجل):</div>
                <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-4 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>قروض وتسهيلات بنكية طويلة الأجل</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.longTermLoans)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>مخصص مكافأة نهاية الخدمة للعاملين</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.endOfServiceProvision)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-slate-200 border-t border-slate-800 text-sm">
                    <span>إجمالي الالتزامات غير المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalNonCurrentLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Current liabilities */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-300 font-somar">الالتزامات المتداولة (قصيرة الأجل):</div>
                <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-4 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>الموردون وأوراق الدفع (شيكات مستحقة)</span>
                    <span className="font-mono text-white">
                      {formatEGP(balanceSheet.tradePayables + balanceSheet.notesPayable)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>الدائنون ومصلحة الضرائب والتأمينات الاجتماعية</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.taxesPayable)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>مصروفات مستحقة وإيرادات مقدمة</span>
                    <span className="font-mono text-white">{formatEGP(balanceSheet.accruedExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-amber-400 font-semibold">
                    <span>مخصص ضريبة الدخل المستحقة للعام (22.5%)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.corporateIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-slate-200 border-t border-slate-800 text-sm">
                    <span>إجمالي الالتزامات المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalCurrentLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="flex justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl font-bold text-sm text-white font-mono">
                <span className="font-somar font-black">إجمالي الالتزامات وحقوق الملكية</span>
                <span className="text-emerald-400 font-black text-base">{formatEGP(balanceSheet.totalEquityAndLiabilities)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. INCOME STATEMENT (قائمة الدخل الشامل) */}
        {activeSubTab === 'income-statement' && (
          <div className="space-y-4 text-xs">
            <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-5 space-y-2.5 border border-slate-800">
              <div className="flex justify-between py-1 text-slate-300">
                <span>إجمالي إيرادات المبيعات والخدمات</span>
                <span className="font-mono font-bold text-white">{formatEGP(incomeStatement.grossSales)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-400">
                <span>يخصم: مردودات ومسموحات المبيعات والخصم المسموح به</span>
                <span className="font-mono">
                  ({formatEGP(incomeStatement.salesReturns + incomeStatement.salesDiscount)})
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-emerald-400 bg-slate-900 px-3.5 rounded-lg border border-slate-800">
                <span>صافي إيرادات النشاط</span>
                <span className="font-mono">{formatEGP(incomeStatement.netSales)}</span>
              </div>

              <div className="flex justify-between py-1 text-rose-400 pt-2">
                <span>يخصم: تكلفة المبيعات والبضاعة المباعة (COGS)</span>
                <span className="font-mono">({formatEGP(incomeStatement.costOfGoodsSold)})</span>
              </div>
              <div className="flex justify-between py-2 font-black text-emerald-400 bg-emerald-950/30 px-3.5 rounded-lg border border-emerald-500/30 text-sm">
                <span>مجمل الربح (Gross Profit)</span>
                <span className="font-mono">{formatEGP(incomeStatement.grossProfit)}</span>
              </div>

              <div className="pt-2 space-y-1 text-slate-400">
                <div className="font-bold text-slate-200 font-somar">يخصم: المصروفات التشغيلية والبيعية والإدارية:</div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>المصروفات البيعية والتسويقية وعمولات البيع</span>
                  <span className="font-mono text-white">{formatEGP(incomeStatement.sellingExpenses)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>المرتبات والأجور وبدلات العاملين الإداريين</span>
                  <span className="font-mono text-white">{formatEGP(incomeStatement.adminSalaries)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>تأمينات اجتماعية حصة المنشأة (18.75%)</span>
                  <span className="font-mono text-white">{formatEGP(incomeStatement.adminSocialInsurance)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>إيجار المقار والكهرباء والمياه والاتصالات</span>
                  <span className="font-mono text-white">
                    {formatEGP(incomeStatement.adminRent + incomeStatement.adminUtilities)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>استشارات قانونية وأتعاب المحاسبة والمراجعة</span>
                  <span className="font-mono text-white">{formatEGP(incomeStatement.adminAuditConsulting)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>إهلاك الأصول الثابتة للفترة</span>
                  <span className="font-mono text-white">{formatEGP(incomeStatement.depreciationExpense)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-rose-400 pr-1">
                  <span>إجمالي المصروفات التشغيلية</span>
                  <span className="font-mono">({formatEGP(incomeStatement.operatingExpenses)})</span>
                </div>
              </div>

              <div className="flex justify-between py-2 font-bold text-white bg-slate-900 px-3.5 rounded-lg border border-slate-800">
                <span>أرباح التشغيل قبل الإيرادات والأعباء الأخرى</span>
                <span className="font-mono">{formatEGP(incomeStatement.operatingProfit)}</span>
              </div>

              <div className="flex justify-between py-1 text-emerald-400">
                <span>يضاف: إيرادات استثمارات وفروق عملة وأرباح رأسمالية</span>
                <span className="font-mono">{formatEGP(incomeStatement.otherRevenues)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-400">
                <span>يخصم: المصروفات التمويلية وفوائد القروض</span>
                <span className="font-mono">({formatEGP(incomeStatement.financeCosts)})</span>
              </div>

              <div className="flex justify-between py-2 font-bold text-white bg-slate-900 px-3.5 rounded-lg border border-slate-800">
                <span>صافي الربح قبل ضريبة الدخل</span>
                <span className="font-mono">{formatEGP(incomeStatement.netProfitBeforeTax)}</span>
              </div>

              <div className="flex justify-between py-1 text-amber-400 font-semibold">
                <span>يخصم: ضريبة الدخل على أرباح الأشخاص الاعتبارية (22.5%)</span>
                <span className="font-mono">({formatEGP(incomeStatement.corporateIncomeTax)})</span>
              </div>

              <div className="flex justify-between p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl font-black text-sm text-emerald-300 font-mono">
                <span className="font-somar text-base">صافي ربح العام المالي بعد الضريبة (Net Income)</span>
                <span className="text-emerald-400 text-lg">{formatEGP(incomeStatement.netProfitAfterTax)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. CASH FLOW STATEMENT */}
        {activeSubTab === 'cash-flow' && (
          <div className="space-y-4 text-xs">
            <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-5 space-y-2.5 border border-slate-800">
              <div className="font-bold text-sm text-emerald-400 pb-1 font-somar">
                1. التدفقات النقدية من الأنشطة التشغيلية:
              </div>
              <div className="flex justify-between py-1 text-slate-300 pr-3">
                <span>صافي الربح قبل الضريبة</span>
                <span className="font-mono text-white">{formatEGP(cashFlow.operatingActivities.netProfitBeforeTax)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-400 pr-3">
                <span>تعديل: إهلاك الأصول الثابتة (مصروف غير نقدي)</span>
                <span className="font-mono">
                  {formatEGP(cashFlow.operatingActivities.depreciationAdjustment)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-400 pr-3">
                <span>التغير في رأس المال العامل (المخزون والعملاء والموردين)</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.operatingActivities.workingCapitalChanges.receivablesChange))})
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-emerald-400 bg-slate-900 px-3.5 rounded-lg border border-slate-800">
                <span>صافي التدفقات النقدية الناتجة من الأنشطة التشغيلية</span>
                <span className="font-mono">
                  {formatEGP(cashFlow.operatingActivities.netCashFromOperating)}
                </span>
              </div>

              <div className="font-bold text-sm text-slate-200 pt-3 pb-1 font-somar">
                2. التدفقات النقدية من الأنشطة الاستثمارية:
              </div>
              <div className="flex justify-between py-1 text-rose-400 pr-3">
                <span>المدفوعات لشراء وتطوير أصول ثابتة ومشروعات</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.investingActivities.purchaseOfFixedAssets))})
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-rose-400 bg-slate-900 px-3.5 rounded-lg border border-slate-800">
                <span>صافي النقدية المستخدمة في الأنشطة الاستثمارية</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.investingActivities.netCashFromInvesting))})
                </span>
              </div>

              <div className="font-bold text-sm text-slate-200 pt-3 pb-1 font-somar">
                3. التدفقات النقدية من الأنشطة التمويلية:
              </div>
              <div className="flex justify-between py-1 text-rose-400 pr-3">
                <span>سداد أقساط القروض البنكية طويلة الأجل</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.financingActivities.loanRepayments))})
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-rose-400 bg-slate-900 px-3.5 rounded-lg border border-slate-800">
                <span>صافي النقدية المستخدمة في الأنشطة التمويلية</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.financingActivities.netCashFromFinancing))})
                </span>
              </div>

              <div className="pt-3 space-y-1.5 border-t-2 border-slate-800">
                <div className="flex justify-between py-1 font-bold text-white">
                  <span>صافي الزيادة (النقص) في النقدية خلال السنة</span>
                  <span className="font-mono text-emerald-400">{formatEGP(cashFlow.netCashChange)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>النقدية وما في حكمها في بداية السنة المالية</span>
                  <span className="font-mono text-white">{formatEGP(cashFlow.beginningCash)}</span>
                </div>
                <div className="flex justify-between p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl font-bold text-sm text-emerald-300 font-mono">
                  <span className="font-somar font-black">النقدية وما في حكمها في نهاية السنة المالية</span>
                  <span className="text-emerald-400 font-black text-base">{formatEGP(cashFlow.endingCash)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRADING & P&L */}
        {activeSubTab === 'trading-pl' && (
          <div className="space-y-6 text-xs">
            {/* Trading Account */}
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="bg-slate-950 px-4 py-3 font-bold text-sm text-emerald-400 border-b border-slate-800 font-somar">
                حساب المتاجرة عن السنة المالية 2026
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800 bg-slate-900">
                {/* Debit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 font-somar">الجانب المدين:</div>
                  <div className="flex justify-between text-slate-300">
                    <span>مشتريات بضائع بغرض البيع</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.costOfGoodsPurchases)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>مصروفات نقل ورسوم مشتريات</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.freightPurchases)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 pt-3 border-t border-slate-800">
                    <span>مجمل الربح (المرحل لحساب أ.خ)</span>
                    <span className="font-mono">{formatEGP(incomeStatement.grossProfit)}</span>
                  </div>
                </div>
                {/* Credit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 font-somar">الجانب الدائن:</div>
                  <div className="flex justify-between text-slate-300">
                    <span>صافي المبيعات</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.netSales)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>مردودات وخصم المشتريات المكتسب</span>
                    <span className="font-mono text-white">
                      {formatEGP(incomeStatement.purchaseReturns + incomeStatement.purchaseDiscounts)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit & Loss Account */}
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="bg-slate-950 px-4 py-3 font-bold text-sm text-purple-400 border-b border-slate-800 font-somar">
                حساب الأرباح والخسائر عن السنة المالية 2026
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800 bg-slate-900">
                {/* Debit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 font-somar">الجانب المدين (المصروفات):</div>
                  <div className="flex justify-between text-slate-300">
                    <span>المصروفات البيعية والتسويقية</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.sellingExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>المصروفات العمومية والإدارية والرواتب</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.totalAdminExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>إهلاك الأصول الثابتة</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.depreciationExpense)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>المصروفات التمويلية</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.financeCosts)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ضريبة الدخل (22.5%)</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.corporateIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 pt-3 border-t border-slate-800">
                    <span>صافي الربح القابل للتوزيع (المرحل لحقوق الملكية)</span>
                    <span className="font-mono">{formatEGP(incomeStatement.netProfitAfterTax)}</span>
                  </div>
                </div>
                {/* Credit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 font-somar">الجانب الدائن (الإيرادات والأرباح):</div>
                  <div className="flex justify-between font-bold text-white">
                    <span>مجمل الربح (المنقول من حساب المتاجرة)</span>
                    <span className="font-mono text-emerald-400">{formatEGP(incomeStatement.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>إيرادات استثمارات وفروق عملة وأرباح رأسمالية</span>
                    <span className="font-mono text-white">{formatEGP(incomeStatement.otherRevenues)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. FINANCIAL RATIOS */}
        {activeSubTab === 'ratios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratios.map((ratio: FinancialRatio, idx: number) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-2.5 hover:border-emerald-500/40 transition-colors shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-somar">{ratio.name}</span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      ratio.status === 'optimal'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : ratio.status === 'warning'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {ratio.status === 'optimal' ? 'ممتاز' : ratio.status === 'warning' ? 'يحتاج متابعة' : 'طبيعي'}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{ratio.formatted}</div>
                <div className="text-[11px] text-slate-400 font-somar">{ratio.description}</div>
                <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
                  المعيار القياسي الموصى به: {ratio.benchmark}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Official Auditor Signature & Endorsement Box on Financial Statements */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-center md:text-right">
          <div>
            <div className="font-bold text-white font-somar">{companyProfile.name}</div>
            <div className="text-slate-400">مجلس الإدارة والمدير المالي</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">التوقيع: .....................</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 shadow-md text-right">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-800 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-400 font-somar text-[11px]">يعتمد مراقب الحسابات والمحاسب القانوني</div>
              <div className="font-black text-white font-somar text-sm">{auditorStatement.auditorName}</div>
              <div className="text-[10px] text-slate-400 font-mono">{auditorStatement.registerNumber}</div>
            </div>
            <div className="flex items-center gap-2 border-r border-slate-800 pr-3 text-[9px] text-slate-400">
              <div className="border border-dashed border-slate-700 bg-slate-900/60 p-2 rounded-lg text-center">
                <span>(مكان التوقيع اليدوي)</span>
              </div>
              <div className="border border-dashed border-slate-700 bg-slate-900/60 p-2 rounded-lg text-center">
                <span>(مكان الخاتم الرسمي)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full A4 Print / Preview Modal for Financial Statements */}
      <A4ReportViewerModal
        isOpen={isA4PreviewOpen}
        onClose={() => setIsA4PreviewOpen(false)}
        reportTitle={getSubTabTitle()}
        reportSubtitle={`للسنة المالية المنتهية في 31 ديسمبر 2026`}
        reportCode={`FS-${activeSubTab.toUpperCase()}-2026`}
        fiscalYear="2026"
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
        legalNotice="تم إعداد هذه القوائم المالية وعرضها طبقاً لمعايير المحاسبة المصرية وقانون الشركات رقم 159 لسنة 1981 ولائحته التنفيذية وتعديلاتهما."
      >
        {activeSubTab === 'balance-sheet' && balanceSheet && (
          <div className="space-y-4 avoid-break print:break-inside-avoid">
            <div className="grid grid-cols-2 gap-4 avoid-break print:break-inside-avoid">
              {/* Assets Side */}
              <div className="border border-zinc-300 rounded-lg overflow-hidden avoid-break print:break-inside-avoid">
                <div className="bg-zinc-100 p-2 text-center font-black text-xs border-b border-zinc-300 text-zinc-900">
                  الأصول (Assets)
                </div>
                <div className="p-3 space-y-2 text-[11px]">
                  <div className="font-bold text-zinc-800 border-b pb-1">الأصول غير المتداولة:</div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>صافي الأصول الثابتة</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.nonCurrentAssets?.fixedAssets || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold bg-zinc-50 border-t border-zinc-200">
                    <span>إجمالي الأصول غير المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.nonCurrentAssets?.total || 0)}</span>
                  </div>

                  <div className="font-bold text-zinc-800 border-b pb-1 pt-2">الأصول المتداولة:</div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>المخزون السلعي</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.currentAssets?.inventory || 0)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>العملاء والمدينون</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.currentAssets?.receivables || 0)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>النقدية وما في حكمها</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.currentAssets?.cash || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold bg-zinc-50 border-t border-zinc-200">
                    <span>إجمالي الأصول المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.currentAssets?.total || 0)}</span>
                  </div>
                </div>
                <div className="bg-zinc-200 p-2.5 flex justify-between font-black text-xs border-t-2 border-zinc-400">
                  <span>إجمالي الأصول</span>
                  <span className="font-mono">{formatEGP(balanceSheet.totalAssets || 0)}</span>
                </div>
              </div>

              {/* Liabilities & Equity Side */}
              <div className="border border-zinc-300 rounded-lg overflow-hidden avoid-break print:break-inside-avoid">
                <div className="bg-zinc-100 p-2 text-center font-black text-xs border-b border-zinc-300 text-zinc-900">
                  الالتزامات وحقوق الملكية (Liabilities & Equity)
                </div>
                <div className="p-3 space-y-2 text-[11px]">
                  <div className="font-bold text-zinc-800 border-b pb-1">حقوق الملكية:</div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>رأس المال المصدر والمدفوع</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.equity?.capital || 0)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>الاحتياطيات والأرباح المرحلة</span>
                    <span className="font-mono font-bold">{formatEGP((balanceSheet.equity?.reserves || 0) + (balanceSheet.equity?.retainedEarnings || 0))}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold bg-zinc-50 border-t border-zinc-200">
                    <span>إجمالي حقوق الملكية</span>
                    <span className="font-mono">{formatEGP(balanceSheet.equity?.total || 0)}</span>
                  </div>

                  <div className="font-bold text-zinc-800 border-b pb-1 pt-2">الالتزامات:</div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>الموردون والدائنون</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.currentLiabilities?.payables || 0)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-zinc-700">
                    <span>التزامات متداولة أخرى</span>
                    <span className="font-mono font-bold">{formatEGP(balanceSheet.currentLiabilities?.otherPayables || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold bg-zinc-50 border-t border-zinc-200">
                    <span>إجمالي الالتزامات المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.currentLiabilities?.total || 0)}</span>
                  </div>
                </div>
                <div className="bg-zinc-200 p-2.5 flex justify-between font-black text-xs border-t-2 border-zinc-400">
                  <span>إجمالي الالتزامات وحقوق الملكية</span>
                  <span className="font-mono">{formatEGP(balanceSheet.totalLiabilitiesAndEquity || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'income-statement' && incomeStatement && (
          <div className="border border-zinc-300 rounded-lg overflow-hidden">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 font-black">
                  <th className="py-2.5 px-4">البيان المحاسبي</th>
                  <th className="py-2.5 px-4 text-left font-mono">المبلغ (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="py-2 px-4 font-bold">إيرادات النشاط والمبيعات</td>
                  <td className="py-2 px-4 text-left font-mono font-bold">{formatEGP(incomeStatement.revenue || 0)}</td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-2 px-4 text-zinc-700">يخصم: تكلفة المبيعات (Cost of Goods Sold)</td>
                  <td className="py-2 px-4 text-left font-mono text-rose-700">({formatEGP(incomeStatement.costOfGoodsSold || 0)})</td>
                </tr>
                <tr className="bg-zinc-100 font-bold">
                  <td className="py-2 px-4">مجمل الربح (Gross Profit)</td>
                  <td className="py-2 px-4 text-left font-mono text-emerald-800">{formatEGP(incomeStatement.grossProfit || 0)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-zinc-700">يخصم: المصروفات البيعية والتسويقية والإدارية</td>
                  <td className="py-2 px-4 text-left font-mono text-rose-700">({formatEGP(incomeStatement.generalExpenses || 0)})</td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-2 px-4 text-zinc-700">يخصم: إهلاك الأصول الثابتة للفترة</td>
                  <td className="py-2 px-4 text-left font-mono text-rose-700">({formatEGP(incomeStatement.depreciationExpense || 0)})</td>
                </tr>
                <tr className="bg-zinc-100 font-bold">
                  <td className="py-2 px-4">صافي أرباح النشاط قبل الضرائب (Operating Profit)</td>
                  <td className="py-2 px-4 text-left font-mono">{formatEGP(incomeStatement.operatingProfit || 0)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-zinc-700">يخصم: ضريبة الدخل المقدرة</td>
                  <td className="py-2 px-4 text-left font-mono text-rose-700">({formatEGP(incomeStatement.taxExpense || 0)})</td>
                </tr>
                <tr className="bg-zinc-200 font-black text-sm border-t-2 border-zinc-400">
                  <td className="py-3 px-4">صافي ربح الفترة القابل للتوزيع (Net Income)</td>
                  <td className="py-3 px-4 text-left font-mono text-emerald-900">{formatEGP(incomeStatement.netIncome || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab !== 'balance-sheet' && activeSubTab !== 'income-statement' && (
          <div className="border border-zinc-300 rounded-lg p-6 bg-zinc-50 text-center space-y-2">
            <h4 className="font-bold text-zinc-900 text-sm">{getSubTabTitle()}</h4>
            <p className="text-zinc-600 text-xs">
              جميع بنود وتفاصيل القائمة المالية معتمدة وموثقة دفترياً بسجلات الشركة للسنة المالية 2026.
            </p>
          </div>
        )}
      </A4ReportViewerModal>

      {/* Google Sheets Export Modal */}
      <GoogleSheetsExportModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        type="financial_statements"
        financialData={financialData}
        companyProfile={companyProfile}
      />
    </div>
  );
};
