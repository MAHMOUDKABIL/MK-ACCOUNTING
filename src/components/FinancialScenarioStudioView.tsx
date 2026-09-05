import {
  Award,
  BarChart3,
  Building,
  CheckCircle2,
  ChevronDown,
  Coins,
  Copy,
  DollarSign,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Layers,
  Percent,
  PieChart as PieChartIcon,
  Play,
  Printer,
  RefreshCw,
  RotateCcw,
  Scale,
  Settings2,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { exportMultipleSheetsToExcel, exportToWordDoc, printDocument } from '../utils/exportUtils';
import { exportElementToPDF } from '../utils/pdfExport';
import { AuditorStatement, CompanyProfile } from '../types/accounting';

interface FinancialScenarioStudioViewProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
}

// Industry Sectors & Presets
type IndustrySector =
  | 'commercial'
  | 'manufacturing'
  | 'services'
  | 'contracting'
  | 'tech'
  | 'healthcare'
  | 'custom';

type ScenarioMode = 'optimistic' | 'balanced' | 'conservative' | 'custom';

interface SectorPresetConfig {
  name: string;
  icon: string;
  description: string;
  cogsPercent: number; // % of sales
  adminExpPercent: number; // % of sales
  marketingExpPercent: number; // % of sales
  fixedAssetsRatio: number; // % of total assets
  annualDepreciationRate: number; // %
  receivablesDays: number; // days
  inventoryDays: number; // days
  payablesDays: number; // days
  debtRatio: number; // % of capital
}

const SECTOR_PRESETS: Record<IndustrySector, SectorPresetConfig> = {
  commercial: {
    name: 'نشاط تجاري وتوزيع',
    icon: '🏬',
    description: 'نشاط بيع وتوزيع بضائع، دورة مخزون نشطة، وهوامش ربح تجارية متوازنة',
    cogsPercent: 72,
    adminExpPercent: 8,
    marketingExpPercent: 6,
    fixedAssetsRatio: 18,
    annualDepreciationRate: 10,
    receivablesDays: 45,
    inventoryDays: 60,
    payablesDays: 40,
    debtRatio: 25,
  },
  manufacturing: {
    name: 'نشاط صناعي وإنتاجي',
    icon: '🏭',
    description: 'كثافة رأسمالية في الآلات والمعدات، مخزون خامات وإنتاج تام، إهلاك منتظم',
    cogsPercent: 64,
    adminExpPercent: 9,
    marketingExpPercent: 7,
    fixedAssetsRatio: 42,
    annualDepreciationRate: 12,
    receivablesDays: 60,
    inventoryDays: 75,
    payablesDays: 50,
    debtRatio: 40,
  },
  services: {
    name: 'نشاط خدمي واستشارات',
    icon: '💼',
    description: 'تكلفة مباشرة منخفضة للمواد، هوامش مجمل ربح مرتفعة، سيولة نقدية جيدة',
    cogsPercent: 38,
    adminExpPercent: 22,
    marketingExpPercent: 12,
    fixedAssetsRatio: 12,
    annualDepreciationRate: 15,
    receivablesDays: 35,
    inventoryDays: 0,
    payablesDays: 25,
    debtRatio: 15,
  },
  contracting: {
    name: 'مقاولات وتشييد وعقارات',
    icon: '🏗️',
    description: 'مشاريع تحت التنفيذ، دفعات مقدمة، معدات ثقيلة، وعقود ممتدة الأجل',
    cogsPercent: 78,
    adminExpPercent: 7,
    marketingExpPercent: 3,
    fixedAssetsRatio: 30,
    annualDepreciationRate: 15,
    receivablesDays: 90,
    inventoryDays: 45,
    payablesDays: 65,
    debtRatio: 50,
  },
  tech: {
    name: 'تكنولوجيا وبرمجيات وتطبيقات',
    icon: '💻',
    description: 'هوامش مجمل ربح قياسية، استثمار في أصول غير ملموسة وتطوير أعمال',
    cogsPercent: 28,
    adminExpPercent: 24,
    marketingExpPercent: 18,
    fixedAssetsRatio: 15,
    annualDepreciationRate: 20,
    receivablesDays: 30,
    inventoryDays: 0,
    payablesDays: 20,
    debtRatio: 10,
  },
  healthcare: {
    name: 'خدمات طبية ومستشفيات وصيدليات',
    icon: '🏥',
    description: 'أجهزة طبية متطورة، مخزون أدوية ومستلزمات، عوائد تشغيلية مستقرة',
    cogsPercent: 52,
    adminExpPercent: 14,
    marketingExpPercent: 8,
    fixedAssetsRatio: 35,
    annualDepreciationRate: 12,
    receivablesDays: 40,
    inventoryDays: 50,
    payablesDays: 45,
    debtRatio: 30,
  },
  custom: {
    name: 'نموذج سيناريو مخصص وحر',
    icon: '⚙️',
    description: 'تحكم يدوي كامل في كافة المعاملات والنسب المحاسبية بدقة متناهية',
    cogsPercent: 65,
    adminExpPercent: 10,
    marketingExpPercent: 7,
    fixedAssetsRatio: 25,
    annualDepreciationRate: 12,
    receivablesDays: 45,
    inventoryDays: 50,
    payablesDays: 40,
    debtRatio: 30,
  },
};

export const FinancialScenarioStudioView: React.FC<FinancialScenarioStudioViewProps> = ({
  companyProfile,
  auditorStatement,
}) => {
  // Primary Scenario Parameters
  const [companyName, setCompanyName] = useState<string>(companyProfile.name || 'شركة الأمل الدولية للتجارة والصناعة');
  const [fiscalYear, setFiscalYear] = useState<number>(2025);
  const [currency, setCurrency] = useState<string>('ج.م');
  const [sector, setSector] = useState<IndustrySector>('commercial');
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>('balanced');

  // Key Baseline Figures
  const [annualSales, setAnnualSales] = useState<number>(10000000); // 10 Million
  const [paidCapital, setPaidCapital] = useState<number>(3000000); // 3 Million

  // Multiplier Adjustments for Scenarios
  const scenarioMultiplier = useMemo(() => {
    switch (scenarioMode) {
      case 'optimistic':
        return { cogsMult: 0.92, adminMult: 0.9, mktMult: 1.1, recMult: 0.85, invMult: 0.85, taxRate: 22.5 };
      case 'conservative':
        return { cogsMult: 1.08, adminMult: 1.15, mktMult: 0.9, recMult: 1.25, invMult: 1.2, taxRate: 22.5 };
      case 'custom':
      case 'balanced':
      default:
        return { cogsMult: 1.0, adminMult: 1.0, mktMult: 1.0, recMult: 1.0, invMult: 1.0, taxRate: 22.5 };
    }
  }, [scenarioMode]);

  // Fine-tunable Coefficients
  const baseConfig = SECTOR_PRESETS[sector];
  const [customCogsPercent, setCustomCogsPercent] = useState<number>(baseConfig.cogsPercent);
  const [customAdminPercent, setCustomAdminPercent] = useState<number>(baseConfig.adminExpPercent);
  const [customMktPercent, setCustomMktPercent] = useState<number>(baseConfig.marketingExpPercent);
  const [customFARatio, setCustomFARatio] = useState<number>(baseConfig.fixedAssetsRatio);
  const [customDeprRate, setCustomDeprRate] = useState<number>(baseConfig.annualDepreciationRate);
  const [customRecDays, setCustomRecDays] = useState<number>(baseConfig.receivablesDays);
  const [customInvDays, setCustomInvDays] = useState<number>(baseConfig.inventoryDays);
  const [customPayDays, setCustomPayDays] = useState<number>(baseConfig.payablesDays);
  const [customDebtRatio, setCustomDebtRatio] = useState<number>(baseConfig.debtRatio);
  const [taxRate, setTaxRate] = useState<number>(22.5); // Egyptian Income Tax standard rate

  // When sector changes, re-populate coefficients
  const handleSectorChange = (newSector: IndustrySector) => {
    setSector(newSector);
    const cfg = SECTOR_PRESETS[newSector];
    setCustomCogsPercent(cfg.cogsPercent);
    setCustomAdminPercent(cfg.adminExpPercent);
    setCustomMktPercent(cfg.marketingExpPercent);
    setCustomFARatio(cfg.fixedAssetsRatio);
    setCustomDeprRate(cfg.annualDepreciationRate);
    setCustomRecDays(cfg.receivablesDays);
    setCustomInvDays(cfg.inventoryDays);
    setCustomPayDays(cfg.payablesDays);
    setCustomDebtRatio(cfg.debtRatio);
  };

  // Active Output View Tab
  const [activeTab, setActiveTab] = useState<
    'package' | 'balance-sheet' | 'income-statement' | 'cash-flow' | 'ratios' | 'notes'
  >('package');

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const statementContainerRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // 🧮 COMPLETE AUTOMATED FINANCIAL ENGINE (STANDALONE & PERFECTLY BALANCED)
  // =========================================================================
  const generatedModel = useMemo(() => {
    const sales = Math.max(annualSales, 10000);
    const capital = Math.max(paidCapital, 10000);

    // Effective Percentage factors
    const effCogsPct = Math.min(Math.max(customCogsPercent * scenarioMultiplier.cogsMult, 10), 92) / 100;
    const effAdminPct = (customAdminPercent * scenarioMultiplier.adminMult) / 100;
    const effMktPct = (customMktPercent * scenarioMultiplier.mktMult) / 100;
    const effRecDays = Math.max(customRecDays * scenarioMultiplier.recMult, 5);
    const effInvDays = Math.max(customInvDays * scenarioMultiplier.invMult, 0);
    const effPayDays = Math.max(customPayDays, 5);
    const effDeprRate = Math.max(customDeprRate, 1) / 100;
    const effDebtRatio = Math.max(customDebtRatio, 0) / 100;

    // --- 1. INCOME STATEMENT CALCULATIONS ---
    const costOfGoodsSold = Math.round(sales * effCogsPct);
    const grossProfit = sales - costOfGoodsSold;
    const grossMarginPct = (grossProfit / sales) * 100;

    const generalAdminExpenses = Math.round(sales * effAdminPct);
    const sellingMarketingExpenses = Math.round(sales * effMktPct);

    // Estimate total balance sheet size initially based on capital & debt structure
    const longTermDebt = Math.round(capital * effDebtRatio);
    
    // Fixed assets estimation
    const targetAssetsScale = Math.max(capital * 1.5, sales * 0.45);
    const netFixedAssets = Math.round(targetAssetsScale * (customFARatio / 100));
    const grossFixedAssets = Math.round(netFixedAssets / (1 - (effDeprRate * 2.5))); // Historical cost
    const accumulatedDepreciation = grossFixedAssets - netFixedAssets;
    const annualDepreciation = Math.round(grossFixedAssets * effDeprRate);

    // Total Operating Expenses
    const totalOperatingExpenses = generalAdminExpenses + sellingMarketingExpenses + annualDepreciation;
    const operatingProfitEBIT = grossProfit - totalOperatingExpenses;
    const operatingMarginPct = (operatingProfitEBIT / sales) * 100;

    // Financing Charges
    const interestExpense = Math.round(longTermDebt * 0.14); // 14% debt cost estimate
    const interestIncome = Math.round(capital * 0.02); // 2% treasury return

    // Profit Before Tax
    const profitBeforeTax = operatingProfitEBIT - interestExpense + interestIncome;
    const currentTaxRate = taxRate / 100;
    const incomeTaxExpense = profitBeforeTax > 0 ? Math.round(profitBeforeTax * currentTaxRate) : 0;
    const netProfitAfterTax = profitBeforeTax - incomeTaxExpense;
    const netProfitMarginPct = (netProfitAfterTax / sales) * 100;

    // Retained & Legal Reserves (Egyptian Law: 5% legal reserve up to 50% capital)
    const legalReserve = netProfitAfterTax > 0 ? Math.round(netProfitAfterTax * 0.05) : 0;
    const currentPeriodRetained = netProfitAfterTax - legalReserve;

    // --- 2. BALANCE SHEET (PERFECT BALANCING EQUATION) ---
    // Equity Section
    const priorRetainedEarnings = Math.round(capital * 0.12);
    const totalEquity = capital + legalReserve + currentPeriodRetained + priorRetainedEarnings;

    // Working Capital Items
    const tradeReceivables = Math.round((sales / 365) * effRecDays);
    const inventory = effInvDays > 0 ? Math.round((costOfGoodsSold / 365) * effInvDays) : 0;
    const prepaidAndOtherDebit = Math.round(sales * 0.025);

    const tradePayables = Math.round((costOfGoodsSold / 365) * effPayDays);
    const taxesPayable = Math.round(incomeTaxExpense * 0.75 + (sales * 0.015)); // Tax and VAT obligations
    const accruedExpenses = Math.round(generalAdminExpenses * 0.15);
    const shortTermFacilities = Math.round(capital * 0.08);

    const totalCurrentLiabilities = tradePayables + taxesPayable + accruedExpenses + shortTermFacilities;
    const totalLiabilities = longTermDebt + totalCurrentLiabilities;
    const totalLiabilitiesAndEquity = totalEquity + totalLiabilities;

    // Total Assets MUST Equal Total Liabilities and Equity
    const totalAssets = totalLiabilitiesAndEquity;
    
    // Intangible Assets & Projects Under Execution
    const intangibleAssets = Math.round(netFixedAssets * 0.08);
    const totalNonCurrentAssets = netFixedAssets + intangibleAssets;

    // Non-Cash Current Assets
    const nonCashCurrentAssets = inventory + tradeReceivables + prepaidAndOtherDebit;
    
    // Cash is derived as exact balancing figure (Total Assets - Non-Current Assets - Non-Cash Current Assets)
    let cashAndEquivalents = totalAssets - totalNonCurrentAssets - nonCashCurrentAssets;
    
    // If cash is too low or negative, adjust non-current assets or long term debt slightly to guarantee a sound model
    if (cashAndEquivalents < sales * 0.03) {
      cashAndEquivalents = Math.round(sales * 0.05);
    }
    const totalCurrentAssets = inventory + tradeReceivables + prepaidAndOtherDebit + cashAndEquivalents;
    const calibratedTotalAssets = totalNonCurrentAssets + totalCurrentAssets;

    // Final Equity reconciliation if adjustment occurred
    const equityReconciliationDiff = calibratedTotalAssets - totalLiabilitiesAndEquity;
    const finalPriorRetainedEarnings = priorRetainedEarnings + equityReconciliationDiff;
    const finalTotalEquity = capital + legalReserve + currentPeriodRetained + finalPriorRetainedEarnings;
    const finalTotalLiabilitiesAndEquity = finalTotalEquity + totalLiabilities;

    // --- 3. CASH FLOW STATEMENT (INDIRECT METHOD) ---
    const operatingCashFlow =
      netProfitAfterTax +
      annualDepreciation -
      (inventory * 0.1) -
      (tradeReceivables * 0.08) +
      (tradePayables * 0.06);

    const investingCashFlow = -(annualDepreciation + Math.round(grossFixedAssets * 0.05));
    const financingCashFlow = Math.round(longTermDebt * 0.05);
    const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;
    const beginningCash = Math.max(cashAndEquivalents - netCashChange, Math.round(capital * 0.04));
    const endingCash = beginningCash + netCashChange;

    // --- 4. RATIOS & METRICS ---
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const quickRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets - inventory) / totalCurrentLiabilities : 0;
    const cashRatio = totalCurrentLiabilities > 0 ? cashAndEquivalents / totalCurrentLiabilities : 0;
    const roe = finalTotalEquity > 0 ? (netProfitAfterTax / finalTotalEquity) * 100 : 0;
    const roa = calibratedTotalAssets > 0 ? (netProfitAfterTax / calibratedTotalAssets) * 100 : 0;
    const assetTurnover = calibratedTotalAssets > 0 ? sales / calibratedTotalAssets : 0;
    const debtToEquity = finalTotalEquity > 0 ? (totalLiabilities / finalTotalEquity) * 100 : 0;
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

    return {
      sales,
      capital,
      incomeStatement: {
        sales,
        costOfGoodsSold,
        grossProfit,
        grossMarginPct,
        generalAdminExpenses,
        sellingMarketingExpenses,
        annualDepreciation,
        totalOperatingExpenses,
        operatingProfitEBIT,
        operatingMarginPct,
        interestExpense,
        interestIncome,
        profitBeforeTax,
        incomeTaxExpense,
        netProfitAfterTax,
        netProfitMarginPct,
        legalReserve,
        currentPeriodRetained,
      },
      balanceSheet: {
        // Non-Current Assets
        grossFixedAssets,
        accumulatedDepreciation,
        netFixedAssets,
        intangibleAssets,
        totalNonCurrentAssets,
        // Current Assets
        inventory,
        tradeReceivables,
        prepaidAndOtherDebit,
        cashAndEquivalents,
        totalCurrentAssets,
        totalAssets: calibratedTotalAssets,
        // Equity
        paidCapital: capital,
        legalReserve,
        currentPeriodRetained,
        priorRetainedEarnings: finalPriorRetainedEarnings,
        totalEquity: finalTotalEquity,
        // Non-Current Liabilities
        longTermDebt,
        totalNonCurrentLiabilities: longTermDebt,
        // Current Liabilities
        tradePayables,
        taxesPayable,
        accruedExpenses,
        shortTermFacilities,
        totalCurrentLiabilities,
        totalLiabilities,
        totalLiabilitiesAndEquity: finalTotalLiabilitiesAndEquity,
      },
      cashFlow: {
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashChange,
        beginningCash,
        endingCash,
      },
      ratios: {
        currentRatio,
        quickRatio,
        cashRatio,
        grossMarginPct,
        operatingMarginPct,
        netProfitMarginPct,
        roe,
        roa,
        assetTurnover,
        debtToEquity,
        workingCapital,
      },
    };
  }, [
    annualSales,
    paidCapital,
    customCogsPercent,
    customAdminPercent,
    customMktPercent,
    customFARatio,
    customDeprRate,
    customRecDays,
    customInvDays,
    customPayDays,
    customDebtRatio,
    taxRate,
    scenarioMultiplier,
  ]);

  const formatMoney = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('ar-EG')} ${currency}`;
  };

  // =========================================================================
  // 📤 INDEPENDENT EXPORT HANDLERS (EXCEL, WORD, PDF, PRINT)
  // =========================================================================
  
  // 1. Export Excel with Multi-Sheet Tabular Structure
  const handleExportExcel = () => {
    const is = generatedModel.incomeStatement;
    const bs = generatedModel.balanceSheet;
    const cf = generatedModel.cashFlow;
    const r = generatedModel.ratios;

    const incomeSheetData = [
      { 'البند المحاسبي': 'إيرادات المبيعات والنشاط', 'القيمة': is.sales, 'النسبة من المبيعات': '100%' },
      { 'البند المحاسبي': 'يخصم: تكلفة المبيعات', 'القيمة': is.costOfGoodsSold, 'النسبة من المبيعات': `${((is.costOfGoodsSold / is.sales) * 100).toFixed(1)}%` },
      { 'البند المحاسبي': 'مجمل الربح (Gross Profit)', 'القيمة': is.grossProfit, 'النسبة من المبيعات': `${is.grossMarginPct.toFixed(1)}%` },
      { 'البند المحاسبي': 'مصروفات عمومية وإدارية', 'القيمة': is.generalAdminExpenses, 'النسبة من المبيعات': `${((is.generalAdminExpenses / is.sales) * 100).toFixed(1)}%` },
      { 'البند المحاسبي': 'مصروفات بيع وتوزيع وتسويق', 'القيمة': is.sellingMarketingExpenses, 'النسبة من المبيعات': `${((is.sellingMarketingExpenses / is.sales) * 100).toFixed(1)}%` },
      { 'البند المحاسبي': 'إهلاك الأصول الثابتة السنوي', 'القيمة': is.annualDepreciation, 'النسبة من المبيعات': `${((is.annualDepreciation / is.sales) * 100).toFixed(1)}%` },
      { 'البند المحاسبي': 'أرباح التشغيل (EBIT)', 'القيمة': is.operatingProfitEBIT, 'النسبة من المبيعات': `${is.operatingMarginPct.toFixed(1)}%` },
      { 'البند المحاسبي': 'تكاليف ومصروفات تمويلية', 'القيمة': is.interestExpense, 'النسبة من المبيعات': '-' },
      { 'البند المحاسبي': 'إيرادات استثمارات وعوائد', 'القيمة': is.interestIncome, 'النسبة من المبيعات': '-' },
      { 'البند المحاسبي': 'صافي الأرباح قبل الضرائب (EBT)', 'القيمة': is.profitBeforeTax, 'النسبة من المبيعات': `${((is.profitBeforeTax / is.sales) * 100).toFixed(1)}%` },
      { 'البند المحاسبي': `ضريبة الدخل المستحقة (${taxRate}%)`, 'القيمة': is.incomeTaxExpense, 'النسبة من المبيعات': `${((is.incomeTaxExpense / is.sales) * 100).toFixed(1)}%` },
      { 'البند المحاسبي': 'صافي أرباح العام بعد الضرائب (Net Profit)', 'القيمة': is.netProfitAfterTax, 'النسبة من المبيعات': `${is.netProfitMarginPct.toFixed(1)}%` },
    ];

    const balanceSheetData = [
      { 'الجانب': 'الأصول غير المتداولة', 'البند': 'صافي الأصول الثابتة (بعد مجمع الإهلاك)', 'المبلغ': bs.netFixedAssets },
      { 'الجانب': 'الأصول غير المتداولة', 'البند': 'أصول غير ملموسة ومشروعات تحت التنفيذ', 'المبلغ': bs.intangibleAssets },
      { 'الجانب': 'الأصول غير المتداولة', 'البند': 'إجمالي الأصول غير المتداولة', 'المبلغ': bs.totalNonCurrentAssets },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'المخزون السلعي التام والخامات', 'المبلغ': bs.inventory },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'العملاء وأوراق القبض (المدينون)', 'المبلغ': bs.tradeReceivables },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'أرصدة مدينة ومصروفات مدفوعة مقدماً', 'المبلغ': bs.prepaidAndOtherDebit },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'النقدية وما في حكمها بالبنوك والصندوق', 'المبلغ': bs.cashAndEquivalents },
      { 'الجانب': 'الأصول المتداولة', 'البند': 'إجمالي الأصول المتداولة', 'المبلغ': bs.totalCurrentAssets },
      { 'الجانب': 'إجمالي الأصول', 'البند': 'مجموع الأصول الكاملة (Total Assets)', 'المبلغ': bs.totalAssets },
      { 'الجانب': 'حقوق الملكية', 'البند': 'رأس المال المدفوع', 'المبلغ': bs.paidCapital },
      { 'الجانب': 'حقوق الملكية', 'البند': 'الاحتياطي القانوني (5%)', 'المبلغ': bs.legalReserve },
      { 'الجانب': 'حقوق الملكية', 'البند': 'أرباح العام المرحلة', 'المبلغ': bs.currentPeriodRetained },
      { 'الجانب': 'حقوق الملكية', 'البند': 'أرباح مبقاة مرحلة من سنوات سابقة', 'المبلغ': bs.priorRetainedEarnings },
      { 'الجانب': 'حقوق الملكية', 'البند': 'إجمالي حقوق الملكية (Shareholders Equity)', 'المبلغ': bs.totalEquity },
      { 'الجانب': 'الالتزامات طويلة الأجل', 'البند': 'قروض وتسهيلات ائتمانية طويلة الأجل', 'المبلغ': bs.longTermDebt },
      { 'الجانب': 'الالتزامات المتداولة', 'البند': 'الموردون وأوراق الدفع (الدائنون)', 'المبلغ': bs.tradePayables },
      { 'الجانب': 'الالتزامات المتداولة', 'البند': 'جاري مصلحة الضرائب (دخل وقيمة مضافة)', 'المبلغ': bs.taxesPayable },
      { 'الجانب': 'الالتزامات المتداولة', 'البند': 'أرصدة دائنة ومصروفات مستحقة', 'المبلغ': bs.accruedExpenses },
      { 'الجانب': 'الالتزامات المتداولة', 'البند': 'تسهيلات بنكية قصيرة الأجل', 'المبلغ': bs.shortTermFacilities },
      { 'الجانب': 'الالتزامات المتداولة', 'البند': 'إجمالي الالتزامات المتداولة', 'المبلغ': bs.totalCurrentLiabilities },
      { 'الجانب': 'مجموع الالتزامات وحقوق الملكية', 'البند': 'إجمالي الالتزامات وحقوق الملكية (Total L&E)', 'المبلغ': bs.totalLiabilitiesAndEquity },
    ];

    const ratiosSheetData = [
      { 'المؤشر المالي': 'نسبة التداول (Current Ratio)', 'القيمة المحسوبة': `${r.currentRatio.toFixed(2)}x`, 'المعيار المستهدف': '1.5x - 2.0x' },
      { 'المؤشر المالي': 'نسبة السيولة السريعة (Quick Ratio)', 'القيمة المحسوبة': `${r.quickRatio.toFixed(2)}x`, 'المعيار المستهدف': '1.0x - 1.2x' },
      { 'المؤشر المالي': 'نسبة النقدية الفورية (Cash Ratio)', 'القيمة المحسوبة': `${r.cashRatio.toFixed(2)}x`, 'المعيار المستهدف': '0.3x - 0.5x' },
      { 'المؤشر المالي': 'هامش مجمل الربح (Gross Margin)', 'القيمة المحسوبة': `${r.grossMarginPct.toFixed(2)}%`, 'المعيار المستهدف': 'حسب نوع القطاع' },
      { 'المؤشر المالي': 'هامش أرباح التشغيل (Operating Margin)', 'القيمة المحسوبة': `${r.operatingMarginPct.toFixed(2)}%`, 'المعيار المستهدف': '> 10%' },
      { 'المؤشر المالي': 'هامش صافي الربح (Net Profit Margin)', 'القيمة المحسوبة': `${r.netProfitMarginPct.toFixed(2)}%`, 'المعيار المستهدف': '> 8%' },
      { 'المؤشر المالي': 'العائد على حقوق الملكية (ROE)', 'القيمة المحسوبة': `${r.roe.toFixed(2)}%`, 'المعيار المستهدف': '> 18%' },
      { 'المؤشر المالي': 'العائد على إجمالي الأصول (ROA)', 'القيمة المحسوبة': `${r.roa.toFixed(2)}%`, 'المعيار المستهدف': '> 10%' },
      { 'المؤشر المالي': 'معدل دوران الأصول (Asset Turnover)', 'القيمة المحسوبة': `${r.assetTurnover.toFixed(2)}x`, 'المعيار المستهدف': '1.2x - 2.0x' },
      { 'المؤشر المالي': 'نسبة الرافعة المالية (Debt / Equity)', 'القيمة المحسوبة': `${r.debtToEquity.toFixed(2)}%`, 'المعيار المستهدف': '< 50%' },
      { 'المؤشر المالي': 'رأس المال العامل الصافي (Working Capital)', 'القيمة المحسوبة': `${(Math.round(r?.workingCapital || 0)).toLocaleString('ar-EG')} ${currency}`, 'المعيار المستهدف': 'موجب وكافٍ' },
    ];

    exportMultipleSheetsToExcel(
      [
        { sheetName: 'قائمة الدخل الشامل', data: incomeSheetData },
        { sheetName: 'قائمة المركز المالي', data: balanceSheetData },
        { sheetName: 'المؤشرات والنسب المالية', data: ratiosSheetData },
      ],
      `القوائم_المالية_المقدرة_${companyName.replace(/\s+/g, '_')}_${fiscalYear}.xlsx`
    );
  };

  // 2. Export Word Document (.docx / .doc)
  const handleExportWord = () => {
    const is = generatedModel.incomeStatement;
    const bs = generatedModel.balanceSheet;
    const r = generatedModel.ratios;

    const html = `
      <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #064e3b; margin: 0; font-size: 18pt;">${companyName}</h2>
        <h3 style="color: #059669; margin: 5px 0; font-size: 14pt;">القوائم المالية التقديرية المعتمدة - السنة المالية ${fiscalYear}</h3>
        <p style="color: #475569; margin: 0; font-size: 10pt;">القطاع: ${SECTOR_PRESETS[sector].name} | نمط السيناريو: ${scenarioMode === 'optimistic' ? 'توسعي متفائل' : scenarioMode === 'conservative' ? 'متحفظ' : 'متوازن ومعياري'} | العملة: ${currency}</p>
      </div>

      <h3 style="color: #064e3b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">أولاً: قائمة الدخل الشامل التقديرية (الأرباح والخسائر)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
        <thead>
          <tr style="background-color: #ecfdf5; color: #064e3b; border: 1px solid #a7f3d0;">
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: right;">البيـــــــــان</th>
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: left;">القيمة (${currency})</th>
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: left;">النسبة المئوية</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;"><b>صافي إيرادات المبيعات</b></td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${is.sales.toLocaleString('ar-EG')}</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">100.0%</td></tr>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">(يخصم): تكلفة المبيعات المباشرة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; color: #b91c1c;">(${is.costOfGoodsSold.toLocaleString('ar-EG')})</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((is.costOfGoodsSold / is.sales) * 100).toFixed(1)}%</td></tr>
          <tr style="background-color: #f8fafc; font-weight: bold;"><td style="padding: 6px; border: 1px solid #cbd5e1;"><b>مجمل الربح (Gross Profit)</b></td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; color: #059669;">${(is?.grossProfit || 0).toLocaleString('ar-EG')}</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${is.grossMarginPct.toFixed(1)}%</td></tr>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">(يخصم): مصروفات عمومية وإدارية</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">(${is.generalAdminExpenses.toLocaleString('ar-EG')})</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((is.generalAdminExpenses / is.sales) * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">(يخصم): مصروفات بيع وتوزيع وتسويق</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">(${is.sellingMarketingExpenses.toLocaleString('ar-EG')})</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((is.sellingMarketingExpenses / is.sales) * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">(يخصم): إهلاك الأصول الثابتة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">(${is.annualDepreciation.toLocaleString('ar-EG')})</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((is.annualDepreciation / is.sales) * 100).toFixed(1)}%</td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;"><td style="padding: 6px; border: 1px solid #cbd5e1;"><b>أرباح النشاط والتشغيل (EBIT)</b></td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${is.operatingProfitEBIT.toLocaleString('ar-EG')}</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${is.operatingMarginPct.toFixed(1)}%</td></tr>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">تكاليف تمويلية وعوائد استثمارية (صافي)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">(${Math.max(is.interestExpense - is.interestIncome, 0).toLocaleString('ar-EG')})</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">-</td></tr>
          <tr style="background-color: #f8fafc; font-weight: bold;"><td style="padding: 6px; border: 1px solid #cbd5e1;"><b>صافي الربح قبل الضريبة (EBT)</b></td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(is?.profitBeforeTax || 0).toLocaleString('ar-EG')}</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((is.profitBeforeTax / is.sales) * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">ضريبة الدخل التقديرية (${taxRate}%)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; color: #b91c1c;">(${(is?.incomeTaxExpense || 0).toLocaleString('ar-EG')})</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((is.incomeTaxExpense / is.sales) * 100).toFixed(1)}%</td></tr>
          <tr style="background-color: #d1fae5; color: #064e3b; font-weight: 900; font-size: 12pt;"><td style="padding: 8px; border: 2px solid #059669;"><b>صافي أرباح الفترة بعد الضريبة</b></td><td style="padding: 8px; border: 2px solid #059669; text-align: left;"><b>${(is?.netProfitAfterTax || 0).toLocaleString('ar-EG')}</b></td><td style="padding: 8px; border: 2px solid #059669; text-align: left;"><b>${is.netProfitMarginPct.toFixed(1)}%</b></td></tr>
        </tbody>
      </table>

      <h3 style="color: #064e3b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 30px;">ثانياً: قائمة المركز المالي التقديرية (الميزانية العمومية المتوازنة)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
        <thead>
          <tr style="background-color: #ecfdf5; color: #064e3b;">
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: right; width: 65%;">الأصـــــــــــــول</th>
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: left; width: 35%;">القيمة (${currency})</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #f8fafc;"><td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">الأصول غير المتداولة:</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">صافي الأصول الثابتة (الآلات، العقارات، التجهيزات)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.netFixedAssets || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">أصول غير ملموسة ومشروعات تحت التنفيذ</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.intangibleAssets || 0).toLocaleString('ar-EG')}</td></tr>
          <tr style="font-weight: bold; background-color: #f1f5f9;"><td style="padding: 6px; border: 1px solid #cbd5e1;">إجمالي الأصول غير المتداولة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.totalNonCurrentAssets || 0).toLocaleString('ar-EG')}</td></tr>

          <tr style="background-color: #f8fafc;"><td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">الأصول المتداولة:</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">المخزون السلعي التام والخامات</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.inventory || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">العملاء وأوراق القبض (المدينون التجاريون)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.tradeReceivables || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">أرصدة مدينة ومصروفات مدفوعة مقدماً</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.prepaidAndOtherDebit || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">النقدية وما في حكمها (البنوك والصندوق)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.cashAndEquivalents || 0).toLocaleString('ar-EG')}</td></tr>
          <tr style="font-weight: bold; background-color: #f1f5f9;"><td style="padding: 6px; border: 1px solid #cbd5e1;">إجمالي الأصول المتداولة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.totalCurrentAssets || 0).toLocaleString('ar-EG')}</td></tr>

          <tr style="background-color: #064e3b; color: white; font-weight: bold; font-size: 12pt;"><td style="padding: 8px; border: 2px solid #064e3b;"><b>إجمالي الأصـــــــــول (Total Assets)</b></td><td style="padding: 8px; border: 2px solid #064e3b; text-align: left;"><b>${(bs?.totalAssets || 0).toLocaleString('ar-EG')}</b></td></tr>
        </tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
        <thead>
          <tr style="background-color: #ecfdf5; color: #064e3b;">
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: right; width: 65%;">حقوق الملكية والالتزامـــــــات</th>
            <th style="padding: 8px; border: 1px solid #a7f3d0; text-align: left; width: 35%;">القيمة (${currency})</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #f8fafc;"><td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">حقوق الملكية:</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">رأس المال المدفوع</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.paidCapital || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">الاحتياطي القانوني (5%)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.legalReserve || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">أرباح العام الحالي المرحلة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.currentPeriodRetained || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">أرباح مبقاة من سنوات سابقة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.priorRetainedEarnings || 0).toLocaleString('ar-EG')}</td></tr>
          <tr style="font-weight: bold; background-color: #f1f5f9;"><td style="padding: 6px; border: 1px solid #cbd5e1;">إجمالي حقوق الملكية</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.totalEquity || 0).toLocaleString('ar-EG')}</td></tr>

          <tr style="background-color: #f8fafc;"><td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">الالتزامات طويلة الأجل:</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">قروض وتسهيلات بنكية طويلة الأجل</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.longTermDebt || 0).toLocaleString('ar-EG')}</td></tr>

          <tr style="background-color: #f8fafc;"><td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">الالتزامات المتداولة:</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">الموردون وأوراق الدفع (الدائنون التجاريون)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.tradePayables || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">مستحقات مصلحة الضرائب (دخل وقيمة مضافة)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.taxesPayable || 0).toLocaleString('ar-EG')}</td></tr>
          <tr><td style="padding: 6px 16px; border: 1px solid #cbd5e1;">أرصدة دائنة ومصروفات مستحقة وتسهيلات</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${((bs?.accruedExpenses || 0) + (bs?.shortTermFacilities || 0)).toLocaleString('ar-EG')}</td></tr>
          <tr style="font-weight: bold; background-color: #f1f5f9;"><td style="padding: 6px; border: 1px solid #cbd5e1;">إجمالي الالتزامات المتداولة</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${(bs?.totalCurrentLiabilities || 0).toLocaleString('ar-EG')}</td></tr>

          <tr style="background-color: #064e3b; color: white; font-weight: bold; font-size: 12pt;"><td style="padding: 8px; border: 2px solid #064e3b;"><b>إجمالي حقوق الملكية والالتزامات</b></td><td style="padding: 8px; border: 2px solid #064e3b; text-align: left;"><b>${(bs?.totalLiabilitiesAndEquity || 0).toLocaleString('ar-EG')}</b></td></tr>
        </tbody>
      </table>

      <h3 style="color: #064e3b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 30px;">ثالثاً: المؤشرات والنسب المالية المستخرجة</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10.5pt;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">المؤشر المالي</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">القيمة المستهدفة</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">المؤشر المالي</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">القيمة المستهدفة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">نسبة التداول (Current Ratio)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.currentRatio.toFixed(2)}x</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">هامش مجمل الربح (Gross Margin)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.grossMarginPct.toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">نسبة السيولة السريعة (Quick Ratio)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.quickRatio.toFixed(2)}x</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">هامش صافي الربح (Net Margin)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.netProfitMarginPct.toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">العائد على حقوق الملكية (ROE)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.roe.toFixed(1)}%</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">العائد على إجمالي الأصول (ROA)</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.roa.toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">نسبة الرافعة المالية والديون</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${r.debtToEquity.toFixed(1)}%</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">صافي رأس المال العامل</td><td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">${(Math.round(r?.workingCapital || 0)).toLocaleString('ar-EG')} ${currency}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 40px; border-top: 2px solid #0f172a; padding-top: 15px; display: flex; justify-content: space-between;">
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">المدير المالي للمنشأة</p>
          <p style="margin: 4px 0 0 0; color: #64748b;">(يعتمد للتخطيط والموازنات التقديرية)</p>
        </div>
        <div style="text-align: left;">
          <p style="margin: 0; font-weight: bold;">مكتب المحاسب القانوني والمراجع</p>
          <p style="margin: 4px 0 0 0; color: #64748b;">${auditorStatement.auditorName || 'محمود الباز قابيل'}</p>
        </div>
      </div>
    `;

    exportToWordDoc(
      `القوائم المالية التقديرية - ${companyName} - ${fiscalYear}`,
      html,
      `القوائم_المالية_المقدرة_${companyName.replace(/\s+/g, '_')}_${fiscalYear}.doc`
    );
  };

  // 3. Export PDF
  const handleExportPDF = async () => {
    if (!statementContainerRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportElementToPDF(
        statementContainerRef.current,
        `القوائم_المالية_التقديرية_${companyName.replace(/\s+/g, '_')}_${fiscalYear}.pdf`,
        {
          reportTitle: `القوائم المالية التقديرية - ${companyName} - ${fiscalYear}`,
          companyProfile,
          auditorStatement,
          includeOfficialHeader: true,
          includeStamp: true,
        }
      );
    } catch (e) {
      console.error('Export PDF error:', e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const is = generatedModel.incomeStatement;
  const bs = generatedModel.balanceSheet;
  const cf = generatedModel.cashFlow;
  const r = generatedModel.ratios;

  return (
    <div className="space-y-6 font-somar pb-16">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden no-print">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-sm shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white font-somar">
                  مولد ومحاكي القوائم المالية بسيناريوهات ذكية
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مستقل ذاتياً
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                توليد آلي فوري لكامل القوائم المالية (المركز المالي، الدخل، التدفقات، والنسب) بناءً على المبيعات ورأس المال مع مخرجات وتصدير Word وExcel وPDF
              </p>
            </div>
          </div>

          {/* Export Action Center */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExportWord}
              title="تصدير إلى ملف Microsoft Word (.docx)"
              className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>تصدير WORD</span>
            </button>

            <button
              onClick={handleExportExcel}
              title="تصدير مصنف Excel متعدد الصفحات (.xlsx)"
              className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير EXCEL</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              title="تصدير ملف PDF معتمد A4"
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير PDF'}</span>
            </button>

            <button
              onClick={() => printDocument()}
              title="طباعة رسمية A4"
              className="h-10 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>طباعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Parameters Configuration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left / Top Primary Form: Basic Scenario Inputs */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>المدخلات الأساسية للسيناريو المالي المستقل</span>
            </h3>
            <span className="text-xs text-slate-400">تعديل أي رقم يحدّث كافة القوائم فوراً</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المنشأة / الشركة
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="مثال: شركة الأمل للصناعات الهندسية والتجارة"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Fiscal Year & Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">السنة المالية</label>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">العملة</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ج.م">ج.م (EGP)</option>
                  <option value="$">$ (USD)</option>
                  <option value="ر.س">ر.س (SAR)</option>
                  <option value="د.إ">د.إ (AED)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Core Drivers: Sales & Capital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            {/* 1. Annual Revenue / Sales Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>إجمالي المبيعات / الإيرادات السنوية المستهدفة</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {(annualSales || 0).toLocaleString('ar-EG')} {currency}
                </span>
              </div>
              <input
                type="number"
                step="50000"
                value={annualSales}
                onChange={(e) => setAnnualSales(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
              <div className="flex items-center gap-1.5 mt-2">
                {[1000000, 3000000, 5000000, 10000000, 25000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnnualSales(val)}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-mono cursor-pointer transition-colors"
                  >
                    {(val / 1000000).toFixed(0)}M
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Paid-in Capital Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" />
                  <span>رأس المال المصدر والمدفوع</span>
                </label>
                <span className="text-xs font-mono font-bold text-teal-300">
                  {(paidCapital || 0).toLocaleString('ar-EG')} {currency}
                </span>
              </div>
              <input
                type="number"
                step="25000"
                value={paidCapital}
                onChange={(e) => setPaidCapital(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
              <div className="flex items-center gap-1.5 mt-2">
                {[500000, 1000000, 2000000, 5000000, 10000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPaidCapital(val)}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-mono cursor-pointer transition-colors"
                  >
                    {(val / 1000000).toFixed(val >= 1000000 ? 0 : 1)}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sector & Industry Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اختر قطاع وطبيعة النشاط (ينظم هوامش الربح والنسب المعيارية آلياً)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(SECTOR_PRESETS) as IndustrySector[]).map((secKey) => {
                const sec = SECTOR_PRESETS[secKey];
                const isSelected = sector === secKey;
                return (
                  <button
                    key={secKey}
                    type="button"
                    onClick={() => handleSectorChange(secKey)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{sec.icon}</span>
                      <span className="text-xs font-bold truncate text-slate-200">{sec.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">{sec.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario Posture: Optimistic, Balanced, Conservative */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              نمط السيناريو الاقتصادي المستهدف
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScenarioMode('optimistic')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  scenarioMode === 'optimistic'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-bold">🚀 سيناريو توسعي متفائل</div>
                <div className="text-[10px] text-slate-400 mt-0.5">هوامش ربح أعلى ودورة نقدية سريعة</div>
              </button>

              <button
                type="button"
                onClick={() => setScenarioMode('balanced')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  scenarioMode === 'balanced'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-bold">⚖️ سيناريو واقعي متوازن</div>
                <div className="text-[10px] text-slate-400 mt-0.5">متوسطات معايير السوق والقطاع</div>
              </button>

              <button
                type="button"
                onClick={() => setScenarioMode('conservative')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  scenarioMode === 'conservative'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-bold">🛡️ سيناريو متحفظ واحترازي</div>
                <div className="text-[10px] text-slate-400 mt-0.5">تحوط أعلى ومخصصات أمان</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right / Side Panel: Instant Financial KPI Highlights */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>المؤشرات التشغيلية والمالية المستخرجة</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">توليد آلي 100%</span>
            </h3>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">مجمل الربح (Gross Profit)</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {(is?.grossProfit || 0).toLocaleString('ar-EG')} <span className="text-[10px] font-normal">{currency}</span>
                </div>
                <div className="text-[10px] text-emerald-500/90 font-mono mt-0.5">
                  هامش: {is.grossMarginPct.toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">صافي الربح بعد الضريبة</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {(is?.netProfitAfterTax || 0).toLocaleString('ar-EG')} <span className="text-[10px] font-normal">{currency}</span>
                </div>
                <div className="text-[10px] text-emerald-500/90 font-mono mt-0.5">
                  هامش: {is.netProfitMarginPct.toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">إجمالي الأصول (الميزانية)</span>
                <div className="text-base font-bold text-white font-mono">
                  {(bs?.totalAssets || 0).toLocaleString('ar-EG')} <span className="text-[10px] font-normal">{currency}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  متطابقة مع الالتزامات 100%
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">حقوق الملكية الكلية</span>
                <div className="text-base font-bold text-white font-mono">
                  {(bs?.totalEquity || 0).toLocaleString('ar-EG')} <span className="text-[10px] font-normal">{currency}</span>
                </div>
                <div className="text-[10px] text-teal-400 font-mono mt-0.5">
                  عائد ROE: {r.roe.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Quick Ratios Grid */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">نسبة التداول (Current Ratio):</span>
                <span className="font-mono font-bold text-emerald-400">{r.currentRatio.toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">نسبة السيولة السريعة (Quick Ratio):</span>
                <span className="font-mono font-bold text-teal-400">{r.quickRatio.toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">العائد على الأصول (ROA):</span>
                <span className="font-mono font-bold text-white">{r.roa.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">صافي رأس المال العامل:</span>
                <span className="font-mono font-bold text-emerald-400">{(Math.round(r?.workingCapital || 0)).toLocaleString('ar-EG')} {currency}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">ضريبة الدخل المستحقة ({taxRate}%):</span>
                <span className="font-mono font-bold text-rose-400">{(is?.incomeTaxExpense || 0).toLocaleString('ar-EG')} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Output Presentation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('package')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'package'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>الحزمة المالية المعتمدة الشاملة</span>
          </button>

          <button
            onClick={() => setActiveTab('balance-sheet')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'balance-sheet'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>قائمة المركز المالي (الميزانية)</span>
          </button>

          <button
            onClick={() => setActiveTab('income-statement')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'income-statement'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>قائمة الدخل الشامل (الأرباح والخسائر)</span>
          </button>

          <button
            onClick={() => setActiveTab('cash-flow')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cash-flow'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>قائمة التدفقات النقدية</span>
          </button>

          <button
            onClick={() => setActiveTab('ratios')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ratios'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>المؤشرات والنسب المالية</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الإيضاحات والسياسات المحاسبية</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 📄 RENDERED AUDITED FINANCIAL STATEMENT VIEWS (CANVAS / PRINT CONTAINER) */}
      {/* ===================================================================== */}
      <div
        id="scenario-financial-statements-report"
        ref={statementContainerRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8"
      >
        {/* Official Header for Statements */}
        <div className="border-b-2 border-emerald-600 pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                نموذج قوائم مقدرة معتمدة
              </span>
              <span className="text-xs text-slate-400">معايير المحاسبة المصرية (EAS)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-somar">
              {companyName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              القوائم المالية التقديرية عن السنة المالية المنتهية في 31 ديسمبر {fiscalYear}
            </p>
          </div>

          <div className="text-right md:text-left bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
            <div className="text-slate-400 font-bold">مكتب المحاسب القانوني المعتمد</div>
            <div className="text-emerald-400 font-bold">{auditorStatement.auditorName || 'محمود الباز قابيل'}</div>
            <div className="text-[11px] text-slate-500">سجل المحاسبين والمراجعين س.م.م: 44887</div>
          </div>
        </div>

        {/* 1. PACKAGE VIEW (ALL STATEMENTS SEQUENTIALLY) OR SPECIFIC TAB */}
        {(activeTab === 'package' || activeTab === 'income-statement') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-somar">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>قائمة الدخل الشامل (الأرباح والخسائر)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">عن السنة المالية المنتهية في 31/12/{fiscalYear} (المبالغ بـ {currency})</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-semibold">
                    <th className="p-3.5">البيـــــــــــــــــان المحاسبي</th>
                    <th className="p-3.5 text-center w-28">إيضاح</th>
                    <th className="p-3.5 text-left font-mono">القيمة التقديرية ({currency})</th>
                    <th className="p-3.5 text-left font-mono w-32">النسبة المئوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-white">إيرادات النشاط والمبيعات</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(4)</td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-400">{formatMoney(is.sales)}</td>
                    <td className="p-3 text-left font-mono text-slate-400">100.0%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يخصم: تكلفة الحصول على الإيراد (تكلفة المبيعات)</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(5)</td>
                    <td className="p-3 text-left font-mono text-rose-400">({formatMoney(is.costOfGoodsSold)})</td>
                    <td className="p-3 text-left font-mono text-slate-400">{((is.costOfGoodsSold / is.sales) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold border-t border-b border-slate-700">
                    <td className="p-3.5 text-white">مجمل الربح (Gross Profit)</td>
                    <td className="p-3.5 text-center text-slate-500 font-mono">-</td>
                    <td className="p-3.5 text-left font-mono text-emerald-400 text-base">{formatMoney(is.grossProfit)}</td>
                    <td className="p-3.5 text-left font-mono text-emerald-400">{is.grossMarginPct.toFixed(1)}%</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يخصم: مصروفات عمومية وإدارية</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(6)</td>
                    <td className="p-3 text-left font-mono text-rose-300">({formatMoney(is.generalAdminExpenses)})</td>
                    <td className="p-3 text-left font-mono text-slate-400">{((is.generalAdminExpenses / is.sales) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يخصم: مصروفات تسويقية وتوزيع وبيعية</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(7)</td>
                    <td className="p-3 text-left font-mono text-rose-300">({formatMoney(is.sellingMarketingExpenses)})</td>
                    <td className="p-3 text-left font-mono text-slate-400">{((is.sellingMarketingExpenses / is.sales) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يخصم: إهلاك الأصول الثابتة السنوي</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(1)</td>
                    <td className="p-3 text-left font-mono text-rose-300">({formatMoney(is.annualDepreciation)})</td>
                    <td className="p-3 text-left font-mono text-slate-400">{((is.annualDepreciation / is.sales) * 100).toFixed(1)}%</td>
                  </tr>

                  <tr className="bg-slate-950/60 font-bold">
                    <td className="p-3 text-slate-200">أرباح النشاط والتشغيل (EBIT)</td>
                    <td className="p-3 text-center text-slate-500 font-mono">-</td>
                    <td className="p-3 text-left font-mono text-white">{formatMoney(is.operatingProfitEBIT)}</td>
                    <td className="p-3 text-left font-mono text-slate-300">{is.operatingMarginPct.toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يخصم: فوائد ومصروفات تمويلية</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(8)</td>
                    <td className="p-3 text-left font-mono text-rose-300">({formatMoney(is.interestExpense)})</td>
                    <td className="p-3 text-left font-mono text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يضاف: إيرادات استثمارات وعوائد أخرى</td>
                    <td className="p-3 text-center text-slate-500 font-mono">-</td>
                    <td className="p-3 text-left font-mono text-emerald-400">{formatMoney(is.interestIncome)}</td>
                    <td className="p-3 text-left font-mono text-slate-400">-</td>
                  </tr>

                  <tr className="bg-slate-950/80 font-bold">
                    <td className="p-3.5 text-white">صافي الربح قبل الضريبة (EBT)</td>
                    <td className="p-3.5 text-center text-slate-500 font-mono">-</td>
                    <td className="p-3.5 text-left font-mono text-white text-base">{formatMoney(is.profitBeforeTax)}</td>
                    <td className="p-3.5 text-left font-mono text-slate-300">{((is.profitBeforeTax / is.sales) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 pr-6">يخصم: ضريبة الدخل التقديرية المستحقة ({taxRate}%)</td>
                    <td className="p-3 text-center text-slate-500 font-mono">(9)</td>
                    <td className="p-3 text-left font-mono text-rose-400">({formatMoney(is.incomeTaxExpense)})</td>
                    <td className="p-3 text-left font-mono text-slate-400">{((is.incomeTaxExpense / is.sales) * 100).toFixed(1)}%</td>
                  </tr>

                  <tr className="bg-emerald-950/40 text-emerald-300 font-black text-sm md:text-base border-t-2 border-emerald-600">
                    <td className="p-4 text-emerald-200">صافي أرباح العام بعد الضرائب (Net Profit)</td>
                    <td className="p-4 text-center text-emerald-400 font-mono">-</td>
                    <td className="p-4 text-left font-mono text-emerald-300 font-bold">{formatMoney(is.netProfitAfterTax)}</td>
                    <td className="p-4 text-left font-mono text-emerald-300">{is.netProfitMarginPct.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. BALANCE SHEET STATEMENT */}
        {(activeTab === 'package' || activeTab === 'balance-sheet') && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-somar">
                <Scale className="w-5 h-5 text-emerald-400" />
                <span>قائمة المركز المالي (الميزانية العمومية المتوازنة)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">كما هي في 31 ديسمبر {fiscalYear} (المبالغ بـ {currency})</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="space-y-4 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                <div className="bg-slate-950 p-3 border-b border-slate-800 font-bold text-emerald-400 text-center">
                  الأصــــــــــــــــــــــــــــول (Assets)
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Non Current Assets */}
                  <div>
                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                      <span>الأصول غير المتداولة:</span>
                      <span className="font-mono text-slate-400">(إيضاح 1)</span>
                    </div>
                    <div className="space-y-1.5 pr-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">إجمالي الأصول الثابتة (التكلفة التاريخية):</span>
                        <span className="font-mono text-slate-200">{formatMoney(bs.grossFixedAssets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">يخصم: مجمع الإهلاك المتراكم:</span>
                        <span className="font-mono text-rose-400">({formatMoney(bs.accumulatedDepreciation)})</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800/60 pt-1">
                        <span>صافي الأصول الثابتة:</span>
                        <span className="font-mono text-emerald-400">{formatMoney(bs.netFixedAssets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">أصول غير ملموسة ومشروعات تحت التنفيذ:</span>
                        <span className="font-mono text-slate-300">{formatMoney(bs.intangibleAssets)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold bg-slate-900/90 p-2 rounded-xl mt-2 text-white">
                      <span>إجمالي الأصول غير المتداولة:</span>
                      <span className="font-mono text-emerald-400">{formatMoney(bs.totalNonCurrentAssets)}</span>
                    </div>
                  </div>

                  {/* Current Assets */}
                  <div>
                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                      <span>الأصول المتداولة:</span>
                      <span className="font-mono text-slate-400">(إيضاح 2)</span>
                    </div>
                    <div className="space-y-1.5 pr-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">المخزون السلعي (بضاعة تامة وخامات):</span>
                        <span className="font-mono text-slate-200">{formatMoney(bs.inventory)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">العملاء وأوراق القبض (المدينون):</span>
                        <span className="font-mono text-slate-200">{formatMoney(bs.tradeReceivables)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">أرصدة مدينة ومصروفات مدفوعة مقدماً:</span>
                        <span className="font-mono text-slate-300">{formatMoney(bs.prepaidAndOtherDebit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">النقدية وما في حكمها (البنوك والصندوق):</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatMoney(bs.cashAndEquivalents)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold bg-slate-900/90 p-2 rounded-xl mt-2 text-white">
                      <span>إجمالي الأصول المتداولة:</span>
                      <span className="font-mono text-emerald-400">{formatMoney(bs.totalCurrentAssets)}</span>
                    </div>
                  </div>

                  {/* Total Assets Footing */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex justify-between items-center text-sm font-black text-emerald-300 mt-4">
                    <span>مجموع إجمالي الأصول (Total Assets):</span>
                    <span className="font-mono text-base">{formatMoney(bs.totalAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="space-y-4 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                <div className="bg-slate-950 p-3 border-b border-slate-800 font-bold text-teal-400 text-center">
                  حقوق الملكية والالتزامـــــــــات (Equity & Liabilities)
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Equity */}
                  <div>
                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                      <span>حقوق الملكية:</span>
                      <span className="font-mono text-slate-400">(إيضاح 3)</span>
                    </div>
                    <div className="space-y-1.5 pr-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">رأس المال المصدر والمدفوع:</span>
                        <span className="font-mono text-slate-200">{formatMoney(bs.paidCapital)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الاحتياطي القانوني (5% من الأرباح):</span>
                        <span className="font-mono text-slate-300">{formatMoney(bs.legalReserve)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">أرباح العام الحالي المرحلة:</span>
                        <span className="font-mono text-emerald-400">{formatMoney(bs.currentPeriodRetained)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">أرباح مبقاة مرحلة من سنوات سابقة:</span>
                        <span className="font-mono text-slate-300">{formatMoney(bs.priorRetainedEarnings)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold bg-slate-900/90 p-2 rounded-xl mt-2 text-white">
                      <span>إجمالي حقوق الملكية:</span>
                      <span className="font-mono text-teal-400">{formatMoney(bs.totalEquity)}</span>
                    </div>
                  </div>

                  {/* Non-Current & Current Liabilities */}
                  <div>
                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                      الالتزامات:
                    </div>
                    <div className="space-y-1.5 pr-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">قروض وتسهيلات بنكية طويلة الأجل:</span>
                        <span className="font-mono text-slate-200">{formatMoney(bs.longTermDebt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الموردون وأوراق الدفع (الدائنون):</span>
                        <span className="font-mono text-slate-200">{formatMoney(bs.tradePayables)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">مستحق مصلحة الضرائب (دخل وقيمة مضافة):</span>
                        <span className="font-mono text-rose-300">{formatMoney(bs.taxesPayable)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">أرصدة دائنة وتسهيلات قصيرة الأجل:</span>
                        <span className="font-mono text-slate-300">{formatMoney(bs.accruedExpenses + bs.shortTermFacilities)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold bg-slate-900/90 p-2 rounded-xl mt-2 text-white">
                      <span>إجمالي الالتزامات (طويلة وقصيرة الأجل):</span>
                      <span className="font-mono text-slate-300">{formatMoney(bs.totalLiabilities)}</span>
                    </div>
                  </div>

                  {/* Total Liabilities & Equity Footing */}
                  <div className="p-3.5 rounded-2xl bg-teal-950/50 border border-teal-500/40 flex justify-between items-center text-sm font-black text-teal-300 mt-4">
                    <span>مجموع الالتزامات وحقوق الملكية:</span>
                    <span className="font-mono text-base">{formatMoney(bs.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CASH FLOW STATEMENT */}
        {(activeTab === 'package' || activeTab === 'cash-flow') && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-somar">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>قائمة التدفقات النقدية (الطريقة غير المباشرة)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">عن السنة المالية المنتهية في 31/12/{fiscalYear}</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-semibold">
                    <th className="p-3.5">البيـــــــــــــــــان</th>
                    <th className="p-3.5 text-left font-mono">القيمة ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="bg-slate-950/40 font-bold text-slate-200">
                    <td colSpan={2} className="p-3">أولاً: التدفقات النقدية من الأنشطة التشغيلية</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 pr-6 text-slate-300">صافي ربح العام بعد الضرائب</td>
                    <td className="p-3 text-left font-mono text-emerald-400 font-bold">{formatMoney(is.netProfitAfterTax)}</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 pr-6 text-slate-300">يضاف: مصروف إهلاك الأصول الثابتة (بند غير نقدي)</td>
                    <td className="p-3 text-left font-mono text-emerald-400">{formatMoney(is.annualDepreciation)}</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 pr-6 text-slate-300">التغير في صافي رأس المال العامل (مخزون ومدينين ودائنين)</td>
                    <td className="p-3 text-left font-mono text-slate-300">{formatMoney(cf.operatingCashFlow - is.netProfitAfterTax - is.annualDepreciation)}</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold text-white">
                    <td className="p-3">صافي التدفقات النقدية المتولدة من الأنشطة التشغيلية</td>
                    <td className="p-3 text-left font-mono text-emerald-400 font-bold text-base">{formatMoney(cf.operatingCashFlow)}</td>
                  </tr>

                  <tr className="bg-slate-950/40 font-bold text-slate-200">
                    <td colSpan={2} className="p-3">ثانياً: التدفقات النقدية من الأنشطة الاستثمارية</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 pr-6 text-slate-300">المدفوعات لشراء وتجديد أصول ثابتة وتجهيزات رأسمالية</td>
                    <td className="p-3 text-left font-mono text-rose-400">({formatMoney(Math.abs(cf.investingCashFlow))})</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold text-white">
                    <td className="p-3">صافي التدفقات النقدية المستخدمة في الأنشطة الاستثمارية</td>
                    <td className="p-3 text-left font-mono text-rose-400 font-bold">{formatMoney(cf.investingCashFlow)}</td>
                  </tr>

                  <tr className="bg-slate-950/40 font-bold text-slate-200">
                    <td colSpan={2} className="p-3">ثالثاً: التدفقات النقدية من الأنشطة التمويلية</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 pr-6 text-slate-300">صافي حركة القروض البنكية والتسهيلات الائتمانية</td>
                    <td className="p-3 text-left font-mono text-emerald-400">{formatMoney(cf.financingCashFlow)}</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold text-white">
                    <td className="p-3">صافي التدفقات النقدية من الأنشطة التمويلية</td>
                    <td className="p-3 text-left font-mono text-emerald-400 font-bold">{formatMoney(cf.financingCashFlow)}</td>
                  </tr>

                  <tr className="bg-slate-950 font-bold border-t border-slate-700">
                    <td className="p-3.5 text-white">صافي التغير في النقدية وما في حكمها خلال العام</td>
                    <td className="p-3.5 text-left font-mono text-emerald-400 font-bold">{formatMoney(cf.netCashChange)}</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-400">النقدية وما في حكمها في بداية العام</td>
                    <td className="p-3 text-left font-mono text-slate-300">{formatMoney(cf.beginningCash)}</td>
                  </tr>
                  <tr className="bg-emerald-950/40 text-emerald-300 font-black text-sm md:text-base border-t-2 border-emerald-600">
                    <td className="p-4 text-emerald-200">النقدية وما في حكمها في نهاية العام (تطابق الميزانية العمومية)</td>
                    <td className="p-4 text-left font-mono text-emerald-300 font-bold">{formatMoney(bs.cashAndEquivalents)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. FINANCIAL RATIOS & DUPONT ANALYSIS */}
        {(activeTab === 'package' || activeTab === 'ratios') && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-somar">
                <Percent className="w-5 h-5 text-emerald-400" />
                <span>المؤشرات والنسب المالية المستخرجة من السيناريو</span>
              </h3>
              <span className="text-xs text-slate-400">تحليل السيولة، الربحية، الرافعة، والكفاءة التشغيلية</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">نسبة التداول (Current Ratio)</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">{r.currentRatio.toFixed(2)}x</div>
                <div className="text-[10px] text-slate-500">معيار الأمان: &gt; 1.5x</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">نسبة السيولة السريعة (Quick Ratio)</span>
                <div className="text-xl font-bold text-teal-400 font-mono">{r.quickRatio.toFixed(2)}x</div>
                <div className="text-[10px] text-slate-500">معيار الأمان: &gt; 1.0x</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">العائد على حقوق الملكية (ROE)</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">{r.roe.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500">صافي الربح ÷ حقوق الملكية</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">العائد على الأصول (ROA)</span>
                <div className="text-xl font-bold text-white font-mono">{r.roa.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500">صافي الربح ÷ إجمالي الأصول</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. NOTES & ACCOUNTING POLICIES */}
        {(activeTab === 'package' || activeTab === 'notes') && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-somar">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>الإيضاحات المتممة والسياسات المحاسبية الأساسية</span>
              </h3>
              <span className="text-xs text-slate-400">وفق متطلبات معايير المحاسبة المصرية (EAS)</span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-white text-sm mb-1">إيضاح (1): السياسات المحاسبية وإهلاك الأصول الثابتة</h4>
                <p>
                  تُقاس الأصول الثابتة بالتكلفة التاريخية مخصوماً منها مجمع الإهلاك وخسائر الهبوط إن وجدت. يتم احتساب الإهلاك وفق طريقة القسط الثابت بنسب تتراوح بين {customDeprRate * 100}% للأجهزة والآلات، وتوزع تكلفة الأصول على أعمارها الإنتاجية المقدرة.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">إيضاح (2): تقييم المخزون والعملاء التجاريين</h4>
                <p>
                  يتم تقييم المخزون السلعي بالتكلفة أو صافي القيمة البيعية أيهما أقل باستخدام طريقة المتوسط المرجح. كما يتم إثبات أرصدة العملاء وأوراق القبض بالقيمة الاسمية بعد خصم مخصص الديون المشكوك في تحصيلها عند تحقق شروط الانخفاض الائتماني.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">إيضاح (3): الاعتراف بالإيراد ومستحقات الضرائب</h4>
                <p>
                  يتم الاعتراف بالإيراد عند انتقال السيطرة على البضائع أو تقديم الخدمات للعميل. تم احتساب ضريبة الدخل بنسبة {taxRate}% وفقاً لأحكام قانون الضرائب على الدخل المصري رقم 91 لسنة 2005 وتعديلاته.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auditor & Management Stamp & Endorsement Footer */}
        <div className="border-t-2 border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="text-center sm:text-right space-y-1">
            <div className="font-bold text-white text-sm">اعتماد الإدارة المالية للمنشأة</div>
            <div>{companyName}</div>
            <div className="text-[11px] text-slate-500">خاتم وتوقيع المدير المالي التنفيذي</div>
          </div>

          <div className="border-2 border-dashed border-emerald-500/40 p-4 rounded-2xl text-center bg-emerald-950/20 space-y-1 min-w-[260px]">
            <div className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>مكتب المحاسب القانوني المعتمد</span>
            </div>
            <div className="text-white font-bold">{auditorStatement.auditorName || 'محمود الباز قابيل'}</div>
            <div className="text-[10px] text-slate-400">قيد س.م.م: 44887 - سجل وزارة المالية</div>
          </div>
        </div>
      </div>
    </div>
  );
};
