import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Percent,
  Printer,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { AuditorStatement, CompanyProfile, FinancialRatio } from '../types/accounting';

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

  const { incomeStatement, balanceSheet, cashFlow, ratios, workingCapital } = financialData;

  const formatEGP = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('ar-EG')} ج.م`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            القوائم المالية والحسابات الختامية (معايير المحاسبة المصرية EAS)
          </h2>
          <p className="text-xs text-slate-500">
            قائمة المركز المالي، قائمة الدخل، قائمة التدفقات النقدية، وحسابات المتاجرة والأرباح والخسائر
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-600" />
            <span>طباعة القائمة المالية A4</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold no-print">
        <button
          onClick={() => setActiveSubTab('balance-sheet')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'balance-sheet'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>قائمة المركز المالي (الميزانية)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('income-statement')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'income-statement'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>قائمة الدخل والأرباح والخسائر</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cash-flow')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'cash-flow'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>قائمة التدفقات النقدية (EAS 4)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trading-pl')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'trading-pl'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>حساب المتاجرة والأرباح والخسائر (التقليدي)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ratios')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'ratios'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>المؤشرات والنسب المالية</span>
        </button>
      </div>

      {/* Financial Statement Content Document */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        {/* Printable Official Statement Header */}
        <div className="text-center border-b border-slate-200 pb-5 space-y-1">
          <h2 className="text-lg md:text-xl font-black text-slate-900 font-cairo">
            {companyProfile.name}
          </h2>
          <p className="text-xs text-slate-500">{companyProfile.legalForm}</p>
          <h3 className="text-sm font-bold text-sky-700 font-cairo pt-2">
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
              <h4 className="font-bold text-sm text-sky-800 bg-sky-50 px-3 py-2 rounded-lg border border-sky-200">
                أولاً: الأصول (Assets)
              </h4>

              {/* Non-current assets */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-700">الأصول غير المتداولة:</div>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>الأصول الثابتة (بالتكلفة الإجمالية)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.nonCurrentAssetsGross)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-600">
                    <span>يخصم: مجمع إهلاك الأصول الثابتة</span>
                    <span className="font-mono">({formatEGP(balanceSheet.accumulatedDepreciation)})</span>
                  </div>
                  <div className="flex justify-between py-1 font-semibold text-slate-900">
                    <span>صافي الأصول الثابتة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.netFixedAssets)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>مشروعات تحت التنفيذ</span>
                    <span className="font-mono">{formatEGP(balanceSheet.projectsInProgress)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>أصول غير ملموسة وبرمجيات</span>
                    <span className="font-mono">{formatEGP(balanceSheet.intangibleAssets)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-sky-700 border-t border-slate-200">
                    <span>إجمالي الأصول غير المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalNonCurrentAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Current assets */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-700">الأصول المتداولة:</div>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>المخزون السلعي (بضاعة بالمستودع واعتمادات)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.inventory)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>العملاء وأوراق القبض (شيكات برسم التحصيل)</span>
                    <span className="font-mono">
                      {formatEGP(balanceSheet.tradeReceivables + balanceSheet.notesReceivable)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>المدينون والأرصدة المدينة الأخرى (مصروفات مقدمة وضرائب)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.prepaidAndOtherDebtors)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>النقدية وما في حكمها (خزينة وحسابات جارية بالبنوك)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.cashAndEquivalents)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-sky-700 border-t border-slate-200">
                    <span>إجمالي الأصول المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalCurrentAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="flex justify-between p-3.5 bg-sky-50 border border-sky-200 rounded-xl font-bold text-sm text-sky-900 font-mono">
                <span className="font-sans">إجمالي الأصول (الموجودات)</span>
                <span>{formatEGP(balanceSheet.totalAssets)}</span>
              </div>
            </div>

            {/* Equity & Liabilities Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-sm text-slate-800 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                ثانياً: الالتزامات وحقوق الملكية (Equity & Liabilities)
              </h4>

              {/* Equity */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-700">حقوق الملكية (Equity):</div>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>رأس المال المصدر والمدفوع</span>
                    <span className="font-mono">{formatEGP(balanceSheet.paidCapital)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>الاحتياطي القانوني (5% من الأرباح وفق القانون 159)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.legalReserve)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>الاحتياطي النظامي والعام</span>
                    <span className="font-mono">{formatEGP(balanceSheet.generalReserve)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>الأرباح (الخسائر) المرحلة من سنوات سابقة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>جاري الشركاء / صاحب المنشأة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.partnersCurrent)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-sky-700">
                    <span>صافي أرباح الفترة الحالية (من قائمة الدخل)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.netProfitAfterTax)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-200">
                    <span>إجمالي حقوق الملكية للمساهمين</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalEquity)}</span>
                  </div>
                </div>
              </div>

              {/* Non-current liabilities */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-700">الالتزامات غير المتداولة (طويلة الأجل):</div>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>قروض وتسهيلات بنكية طويلة الأجل</span>
                    <span className="font-mono">{formatEGP(balanceSheet.longTermLoans)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>مخصص مكافأة نهاية الخدمة للعاملين</span>
                    <span className="font-mono">{formatEGP(balanceSheet.endOfServiceProvision)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-200">
                    <span>إجمالي الالتزامات غير المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalNonCurrentLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Current liabilities */}
              <div className="space-y-1 pr-2">
                <div className="font-bold text-slate-700">الالتزامات المتداولة (قصيرة الأجل):</div>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>الموردون وأوراق الدفع (شيكات مستحقة)</span>
                    <span className="font-mono">
                      {formatEGP(balanceSheet.tradePayables + balanceSheet.notesPayable)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>الدائنون ومصلحة الضرائب والتأمينات الاجتماعية</span>
                    <span className="font-mono">{formatEGP(balanceSheet.taxesPayable)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>مصروفات مستحقة وإيرادات مقدمة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.accruedExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-amber-700 font-semibold">
                    <span>مخصص ضريبة الدخل المستحقة للعام (22.5%)</span>
                    <span className="font-mono">{formatEGP(balanceSheet.corporateIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-200">
                    <span>إجمالي الالتزامات المتداولة</span>
                    <span className="font-mono">{formatEGP(balanceSheet.totalCurrentLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="flex justify-between p-3.5 bg-slate-100 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 font-mono">
                <span className="font-sans">إجمالي الالتزامات وحقوق الملكية</span>
                <span>{formatEGP(balanceSheet.totalEquityAndLiabilities)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. INCOME STATEMENT (قائمة الدخل الشامل) */}
        {activeSubTab === 'income-statement' && (
          <div className="space-y-4 text-xs">
            <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
              <div className="flex justify-between py-1 text-slate-700">
                <span>إجمالي إيرادات المبيعات والخدمات</span>
                <span className="font-mono font-bold text-slate-900">{formatEGP(incomeStatement.grossSales)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-600">
                <span>يخصم: مردودات ومسموحات المبيعات والخصم المسموح به</span>
                <span className="font-mono">
                  ({formatEGP(incomeStatement.salesReturns + incomeStatement.salesDiscount)})
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded border border-slate-200">
                <span>صافي إيرادات النشاط</span>
                <span className="font-mono text-sky-700">{formatEGP(incomeStatement.netSales)}</span>
              </div>

              <div className="flex justify-between py-1 text-rose-600 pt-2">
                <span>يخصم: تكلفة المبيعات والبضاعة المباعة (COGS)</span>
                <span className="font-mono">({formatEGP(incomeStatement.costOfGoodsSold)})</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded border border-slate-200">
                <span>مجمل الربح (Gross Profit)</span>
                <span className="font-mono text-emerald-700">{formatEGP(incomeStatement.grossProfit)}</span>
              </div>

              <div className="pt-2 space-y-1 text-slate-600">
                <div className="font-bold text-slate-800">يخصم: المصروفات التشغيلية والبيعية والإدارية:</div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>المصروفات البيعية والتسويقية وعمولات البيع</span>
                  <span className="font-mono">{formatEGP(incomeStatement.sellingExpenses)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>المرتبات والأجور وبدلات العاملين الإداريين</span>
                  <span className="font-mono">{formatEGP(incomeStatement.adminSalaries)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>تأمينات اجتماعية حصة المنشأة (18.75%)</span>
                  <span className="font-mono">{formatEGP(incomeStatement.adminSocialInsurance)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>إيجار المقار والكهرباء والمياه والاتصالات</span>
                  <span className="font-mono">
                    {formatEGP(incomeStatement.adminRent + incomeStatement.adminUtilities)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>استشارات قانونية وأتعاب المحاسبة والمراجعة</span>
                  <span className="font-mono">{formatEGP(incomeStatement.adminAuditConsulting)}</span>
                </div>
                <div className="flex justify-between py-0.5 pr-3">
                  <span>إهلاك الأصول الثابتة للفترة</span>
                  <span className="font-mono">{formatEGP(incomeStatement.depreciationExpense)}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-rose-600 pr-1">
                  <span>إجمالي المصروفات التشغيلية</span>
                  <span className="font-mono">({formatEGP(incomeStatement.operatingExpenses)})</span>
                </div>
              </div>

              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded border border-slate-200">
                <span>أرباح التشغيل قبل الإيرادات والأعباء الأخرى</span>
                <span className="font-mono">{formatEGP(incomeStatement.operatingProfit)}</span>
              </div>

              <div className="flex justify-between py-1 text-emerald-700">
                <span>يضاف: إيرادات استثمارات وفروق عملة وأرباح رأسمالية</span>
                <span className="font-mono">{formatEGP(incomeStatement.otherRevenues)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-600">
                <span>يخصم: المصروفات التمويلية وفوائد القروض</span>
                <span className="font-mono">({formatEGP(incomeStatement.financeCosts)})</span>
              </div>

              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-100 px-3 rounded">
                <span>صافي الربح قبل ضريبة الدخل</span>
                <span className="font-mono">{formatEGP(incomeStatement.netProfitBeforeTax)}</span>
              </div>

              <div className="flex justify-between py-1 text-amber-800 font-semibold">
                <span>يخصم: ضريبة الدخل على أرباح الأشخاص الاعتبارية (22.5%)</span>
                <span className="font-mono">({formatEGP(incomeStatement.corporateIncomeTax)})</span>
              </div>

              <div className="flex justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-sm text-emerald-900 font-mono">
                <span className="font-sans">صافي ربح العام المالي بعد الضريبة (Net Income)</span>
                <span>{formatEGP(incomeStatement.netProfitAfterTax)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. CASH FLOW STATEMENT */}
        {activeSubTab === 'cash-flow' && (
          <div className="space-y-4 text-xs">
            <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
              <div className="font-bold text-sm text-sky-800 pb-1">
                1. التدفقات النقدية من الأنشطة التشغيلية:
              </div>
              <div className="flex justify-between py-1 text-slate-700 pr-3">
                <span>صافي الربح قبل الضريبة</span>
                <span className="font-mono">{formatEGP(cashFlow.operatingActivities.netProfitBeforeTax)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700 pr-3">
                <span>تعديل: إهلاك الأصول الثابتة (مصروف غير نقدي)</span>
                <span className="font-mono">
                  {formatEGP(cashFlow.operatingActivities.depreciationAdjustment)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 pr-3">
                <span>التغير في رأس المال العامل (المخزون والعملاء والموردين)</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.operatingActivities.workingCapitalChanges.receivablesChange))})
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded border border-slate-200">
                <span>صافي التدفقات النقدية الناتجة من الأنشطة التشغيلية</span>
                <span className="font-mono text-sky-700">
                  {formatEGP(cashFlow.operatingActivities.netCashFromOperating)}
                </span>
              </div>

              <div className="font-bold text-sm text-slate-800 pt-3 pb-1">
                2. التدفقات النقدية من الأنشطة الاستثمارية:
              </div>
              <div className="flex justify-between py-1 text-rose-600 pr-3">
                <span>المدفوعات لشراء وتطوير أصول ثابتة ومشروعات</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.investingActivities.purchaseOfFixedAssets))})
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded border border-slate-200">
                <span>صافي النقدية المستخدمة في الأنشطة الاستثمارية</span>
                <span className="font-mono text-rose-600">
                  ({formatEGP(Math.abs(cashFlow.investingActivities.netCashFromInvesting))})
                </span>
              </div>

              <div className="font-bold text-sm text-slate-800 pt-3 pb-1">
                3. التدفقات النقدية من الأنشطة التمويلية:
              </div>
              <div className="flex justify-between py-1 text-rose-600 pr-3">
                <span>سداد أقساط القروض البنكية طويلة الأجل</span>
                <span className="font-mono">
                  ({formatEGP(Math.abs(cashFlow.financingActivities.loanRepayments))})
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded border border-slate-200">
                <span>صافي النقدية المستخدمة في الأنشطة التمويلية</span>
                <span className="font-mono text-rose-600">
                  ({formatEGP(Math.abs(cashFlow.financingActivities.netCashFromFinancing))})
                </span>
              </div>

              <div className="pt-3 space-y-1 border-t-2 border-slate-200">
                <div className="flex justify-between py-1 font-bold text-slate-800">
                  <span>صافي الزيادة (النقص) في النقدية خلال السنة</span>
                  <span className="font-mono text-sky-700">{formatEGP(cashFlow.netCashChange)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-500">
                  <span>النقدية وما في حكمها في بداية السنة المالية</span>
                  <span className="font-mono">{formatEGP(cashFlow.beginningCash)}</span>
                </div>
                <div className="flex justify-between p-3.5 bg-sky-50 border border-sky-200 rounded-xl font-bold text-sm text-sky-900 font-mono">
                  <span className="font-sans">النقدية وما في حكمها في نهاية السنة المالية</span>
                  <span className="text-sky-700 font-black">{formatEGP(cashFlow.endingCash)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRADING & P&L */}
        {activeSubTab === 'trading-pl' && (
          <div className="space-y-6 text-xs">
            {/* Trading Account */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-50 px-4 py-2.5 font-bold text-sm text-sky-800 border-b border-slate-200">
                حساب المتاجرة عن السنة المالية 2026
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 bg-white">
                {/* Debit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-600 border-b border-slate-100 pb-1">الجانب المدين:</div>
                  <div className="flex justify-between">
                    <span>مشتريات بضائع بغرض البيع</span>
                    <span className="font-mono">{formatEGP(incomeStatement.costOfGoodsPurchases)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مصروفات نقل ورسوم مشتريات</span>
                    <span className="font-mono">{formatEGP(incomeStatement.freightPurchases)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sky-700 pt-3 border-t border-slate-100">
                    <span>مجمل الربح (المرحل لحساب أ.خ)</span>
                    <span className="font-mono">{formatEGP(incomeStatement.grossProfit)}</span>
                  </div>
                </div>
                {/* Credit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-600 border-b border-slate-100 pb-1">الجانب الدائن:</div>
                  <div className="flex justify-between">
                    <span>صافي المبيعات</span>
                    <span className="font-mono">{formatEGP(incomeStatement.netSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مردودات وخصم المشتريات المكتسب</span>
                    <span className="font-mono">
                      {formatEGP(incomeStatement.purchaseReturns + incomeStatement.purchaseDiscounts)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit & Loss Account */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-50 px-4 py-2.5 font-bold text-sm text-slate-800 border-b border-slate-200">
                حساب الأرباح والخسائر عن السنة المالية 2026
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 bg-white">
                {/* Debit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-600 border-b border-slate-100 pb-1">الجانب المدين (المصروفات):</div>
                  <div className="flex justify-between">
                    <span>المصروفات البيعية والتسويقية</span>
                    <span className="font-mono">{formatEGP(incomeStatement.sellingExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المصروفات العمومية والإدارية والرواتب</span>
                    <span className="font-mono">{formatEGP(incomeStatement.totalAdminExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إهلاك الأصول الثابتة</span>
                    <span className="font-mono">{formatEGP(incomeStatement.depreciationExpense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المصروفات التمويلية</span>
                    <span className="font-mono">{formatEGP(incomeStatement.financeCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة الدخل (22.5%)</span>
                    <span className="font-mono">{formatEGP(incomeStatement.corporateIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 pt-3 border-t border-slate-100">
                    <span>صافي الربح القابل للتوزيع (المرحل لحقوق الملكية)</span>
                    <span className="font-mono">{formatEGP(incomeStatement.netProfitAfterTax)}</span>
                  </div>
                </div>
                {/* Credit side */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-600 border-b border-slate-100 pb-1">الجانب الدائن (الإيرادات والأرباح):</div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>مجمل الربح (المنقول من حساب المتاجرة)</span>
                    <span className="font-mono">{formatEGP(incomeStatement.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إيرادات استثمارات وفروق عملة وأرباح رأسمالية</span>
                    <span className="font-mono">{formatEGP(incomeStatement.otherRevenues)}</span>
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
                className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 hover:border-sky-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">{ratio.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      ratio.status === 'optimal'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ratio.status === 'warning'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {ratio.status === 'optimal' ? 'ممتاز' : ratio.status === 'warning' ? 'يحتاج متابعة' : 'طبيعي'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{ratio.formatted}</div>
                <div className="text-[11px] text-slate-500">{ratio.description}</div>
                <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                  المعيار القياسي الموصى به: {ratio.benchmark}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Official Auditor Signature Stamp on Financial Statements */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-center md:text-right">
          <div>
            <div className="font-bold text-slate-900">{companyProfile.name}</div>
            <div className="text-slate-500">مجلس الإدارة والمدير المالي</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 border border-sky-200">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sky-800">مراقب الحسابات والمحاسب القانوني</div>
              <div className="font-black text-slate-900">{auditorStatement.auditorName}</div>
              <div className="text-[10px] text-slate-500">{auditorStatement.registerNumber}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
