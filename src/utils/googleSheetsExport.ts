import * as XLSX from 'xlsx';
import { CompanyProfile, TrialBalanceItem } from '../types/accounting';

export interface GoogleSheetsExportOptions {
  title: string;
  sheetName: string;
  companyProfile: CompanyProfile;
}

/**
 * Generates formatted workbook for Trial Balance with Excel/Google Sheets formulas
 */
export function exportTrialBalanceToGoogleSheets(
  items: TrialBalanceItem[],
  totals: any,
  companyProfile: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [];

  // Title & Metadata rows
  data.push([`ميزان المراجعة بالمجاميع والأرصدة - ${companyProfile.name}`]);
  data.push([`السنة المالية: 2026 | تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`]);
  data.push([`العملة: الجنيه المصري EGP | المعايير: معايير المحاسبة المصرية (EAS)`]);
  data.push([]); // blank row

  // Table Headers
  data.push([
    'كود الحساب',
    'اسم الحساب المحاسبي',
    'رصيد أول مدين',
    'رصيد أول دائن',
    'حركة الفترة مدين',
    'حركة الفترة دائن',
    'مجموع مدين',
    'مجموع دائن',
    'رصيد ختامي مدين',
    'رصيد ختامي دائن',
  ]);

  // Data rows
  const startRow = 6; // 1-indexed in Excel: row 6
  items.forEach((item) => {
    data.push([
      item.accountCode,
      item.accountName,
      Number(item.openingDebit) || 0,
      Number(item.openingCredit) || 0,
      Number(item.periodDebit) || 0,
      Number(item.periodCredit) || 0,
      Number(item.totalDebit) || 0,
      Number(item.totalCredit) || 0,
      Number(item.balanceDebit) || 0,
      Number(item.balanceCredit) || 0,
    ]);
  });

  const endRow = startRow + items.length - 1;
  const totalRowIndex = endRow + 1;

  // Formula-driven Totals Row
  data.push([
    'الإجمالي العام',
    'إجمالي ميزان المراجعة',
    { t: 'n', f: `SUM(C${startRow}:C${endRow})`, v: totals.openingDebit },
    { t: 'n', f: `SUM(D${startRow}:D${endRow})`, v: totals.openingCredit },
    { t: 'n', f: `SUM(E${startRow}:E${endRow})`, v: totals.periodDebit },
    { t: 'n', f: `SUM(F${startRow}:F${endRow})`, v: totals.periodCredit },
    { t: 'n', f: `SUM(G${startRow}:G${endRow})`, v: totals.totalDebit },
    { t: 'n', f: `SUM(H${startRow}:H${endRow})`, v: totals.totalCredit },
    { t: 'n', f: `SUM(I${startRow}:I${endRow})`, v: totals.balanceDebit },
    { t: 'n', f: `SUM(J${startRow}:J${endRow})`, v: totals.balanceCredit },
  ]);

  // Verification Row
  data.push([]);
  data.push([
    'فحص التوازن المحاسبي',
    { t: 's', f: `IF(I${totalRowIndex}=J${totalRowIndex},"ميزان المراجعة متوازن 100%","تنبيه: يوجد عدم توازن")`, v: totals.isBalanced ? 'متوازن 100%' : 'غير متوازن' }
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Code
    { wch: 35 }, // Name
    { wch: 16 }, // Op Debit
    { wch: 16 }, // Op Credit
    { wch: 16 }, // Per Debit
    { wch: 16 }, // Per Credit
    { wch: 18 }, // Tot Debit
    { wch: 18 }, // Tot Credit
    { wch: 18 }, // Bal Debit
    { wch: 18 }, // Bal Credit
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ميزان المراجعة');

  // Trigger file download
  const fileName = `Trial_Balance_${companyProfile.name.replace(/\s+/g, '_')}_2026.xlsx`;
  XLSX.writeFile(wb, fileName);

  return { fileName, rowCount: items.length };
}

/**
 * Generates formatted workbook for Financial Statements with tabs for Balance Sheet, Income Statement, Cash Flow
 */
export function exportFinancialStatementsToGoogleSheets(
  financialData: any,
  companyProfile: CompanyProfile
) {
  const { incomeStatement, balanceSheet, cashFlow, ratios } = financialData;
  const wb = XLSX.utils.book_new();

  // 1. Balance Sheet
  const bsData: any[][] = [
    [`قائمة المركز المالي (الميزانية) - ${companyProfile.name}`],
    [`كما في 31 ديسمبر 2026 (المبالغ بالجنيه المصري EGP)`],
    [],
    ['البيان / البند المحاسبي', 'القيمة الجزئية', 'الإجمالي بالجنيه المصري'],
    ['أولاً: الأصول غير المتداولة', '', ''],
    ['  الأصول الثابتة (بالتكلفة)', balanceSheet.nonCurrentAssetsGross || 0, ''],
    ['  يخصم: مجمع الإهلاك', -(balanceSheet.accumulatedDepreciation || 0), ''],
    ['  صافي الأصول الثابتة', '', balanceSheet.netFixedAssets || 0],
    ['  مشروعات تحت التنفيذ', '', balanceSheet.projectsInProgress || 0],
    ['  أصول غير ملموسة', '', balanceSheet.intangibleAssets || 0],
    ['إجمالي الأصول غير المتداولة', '', balanceSheet.totalNonCurrentAssets || 0],
    [],
    ['ثانياً: الأصول المتداولة', '', ''],
    ['  المخزون السلعي', '', balanceSheet.inventory || 0],
    ['  العملاء وأوراق القبض', '', (balanceSheet.tradeReceivables || 0) + (balanceSheet.notesReceivable || 0)],
    ['  المدينون والأرصدة المدينة الأخرى', '', balanceSheet.prepaidAndOtherDebtors || 0],
    ['  النقدية بالبنوك والخزينة', '', balanceSheet.cashAndEquivalents || 0],
    ['إجمالي الأصول المتداولة', '', balanceSheet.totalCurrentAssets || 0],
    [],
    ['إجمالي الأصول (الموجودات)', '', balanceSheet.totalAssets || 0],
    [],
    ['ثالثاً: حقوق الملكية', '', ''],
    ['  رأس المال المدفوع', '', balanceSheet.paidCapital || 0],
    ['  الاحتياطي القانوني والعام', '', (balanceSheet.legalReserve || 0) + (balanceSheet.generalReserve || 0)],
    ['  الأرباح المرحلة', '', balanceSheet.retainedEarnings || 0],
    ['  صافي أرباح العام الحالي', '', balanceSheet.netProfitAfterTax || 0],
    ['إجمالي حقوق الملكية', '', balanceSheet.totalEquity || 0],
    [],
    ['رابعاً: الالتزامات المتداولة وغير المتداولة', '', ''],
    ['  قروض طويلة الأجل ومخصصات', '', balanceSheet.totalNonCurrentLiabilities || 0],
    ['  الموردون وأوراق الدفع', '', (balanceSheet.tradePayables || 0) + (balanceSheet.notesPayable || 0)],
    ['  مصلحة الضرائب والدائنون', '', balanceSheet.taxesPayable || 0],
    ['  مخصص ضريبة الدخل (22.5%)', '', balanceSheet.corporateIncomeTax || 0],
    ['إجمالي الالتزامات', '', (balanceSheet.totalNonCurrentLiabilities || 0) + (balanceSheet.totalCurrentLiabilities || 0)],
    [],
    ['إجمالي الالتزامات وحقوق الملكية', '', balanceSheet.totalEquityAndLiabilities || 0],
  ];
  const wsBS = XLSX.utils.aoa_to_sheet(bsData);
  wsBS['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsBS, 'قائمة المركز المالي');

  // 2. Income Statement
  const isData: any[][] = [
    [`قائمة الدخل الشامل - ${companyProfile.name}`],
    [`عن السنة المالية المنتهية في 31 ديسمبر 2026 (بالجنيه المصري EGP)`],
    [],
    ['البيان المحاسبي', 'المبلغ بالجنيه'],
    ['إجمالي المبيعات والإيرادات', incomeStatement.grossSales || 0],
    ['يخصم: مردودات ومسموحات المبيعات والخصم', -(incomeStatement.salesReturns || 0) - (incomeStatement.salesDiscount || 0)],
    ['صافي إيرادات النشاط', incomeStatement.netSales || 0],
    ['يخصم: تكلفة البضاعة المباعة (COGS)', -(incomeStatement.costOfGoodsSold || 0)],
    ['مجمل الربح (Gross Profit)', incomeStatement.grossProfit || 0],
    ['يخصم: المصروفات البيعية والتسويقية', -(incomeStatement.sellingExpenses || 0)],
    ['يخصم: المصروفات الإدارية والعمومية والرواتب', -(incomeStatement.totalAdminExpenses || 0)],
    ['يخصم: إهلاك الأصول الثابتة', -(incomeStatement.depreciationExpense || 0)],
    ['أرباح التشغيل (Operating Profit)', incomeStatement.operatingProfit || 0],
    ['يضاف: إيرادات استثمارات وفروق عملة', incomeStatement.otherRevenues || 0],
    ['يخصم: مصروفات تمويلية وفوائد', -(incomeStatement.financeCosts || 0)],
    ['صافي الربح قبل ضريبة الدخل', incomeStatement.netProfitBeforeTax || 0],
    ['يخصم: ضريبة الدخل (22.5%)', -(incomeStatement.corporateIncomeTax || 0)],
    ['صافي ربح العام المالي بعد الضريبة (Net Income)', incomeStatement.netProfitAfterTax || 0],
  ];
  const wsIS = XLSX.utils.aoa_to_sheet(isData);
  wsIS['!cols'] = [{ wch: 50 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsIS, 'قائمة الدخل');

  // 3. Cash Flow
  const cfData: any[][] = [
    [`قائمة التدفقات النقدية (معيار EAS 4) - ${companyProfile.name}`],
    [`عن السنة المالية 2026`],
    [],
    ['البيان', 'القيمة بالجنيه'],
    ['صافي التدفقات النقدية من الأنشطة التشغيلية', cashFlow.operatingActivities?.netCashFromOperating || 0],
    ['صافي التدفقات النقدية المستخدمة في الأنشطة الاستثمارية', cashFlow.investingActivities?.netCashFromInvesting || 0],
    ['صافي التدفقات النقدية من الأنشطة التمويلية', cashFlow.financingActivities?.netCashFromFinancing || 0],
    ['صافي الزيادة (النقص) في النقدية خلال العام', cashFlow.netCashChange || 0],
    ['النقدية في بداية السنة المالية', cashFlow.beginningCash || 0],
    ['النقدية وما في حكمها في نهاية السنة المالية', cashFlow.endingCash || 0],
  ];
  const wsCF = XLSX.utils.aoa_to_sheet(cfData);
  wsCF['!cols'] = [{ wch: 55 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsCF, 'التدفقات النقدية');

  // Download
  const fileName = `Financial_Statements_${companyProfile.name.replace(/\s+/g, '_')}_2026.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName };
}

/**
 * Formats data as Tab-Separated Values (TSV) for instant 1-click paste into Google Sheets
 */
export function getTrialBalanceTSVForGoogleSheets(
  items: TrialBalanceItem[],
  totals: any,
  companyProfile: CompanyProfile
): string {
  const lines: string[] = [];
  lines.push(`ميزان المراجعة بالمجاميع والأرصدة - ${companyProfile.name}`);
  lines.push(`السنة المالية: 2026\tتاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`);
  lines.push('');
  lines.push('رقم الحساب\tاسم الحساب\tرصيد أول مدين\tرصيد أول دائن\tحركة مدين\tحركة دائن\tمجموع مدين\tمجموع دائن\tرصيد ختامي مدين\tرصيد ختامي دائن');

  for (const item of items) {
    lines.push(
      `${item.accountCode}\t${item.accountName}\t${item.openingDebit}\t${item.openingCredit}\t${item.periodDebit}\t${item.periodCredit}\t${item.totalDebit}\t${item.totalCredit}\t${item.balanceDebit}\t${item.balanceCredit}`
    );
  }

  lines.push(
    `الإجمالي العام\t\t${totals.openingDebit}\t${totals.openingCredit}\t${totals.periodDebit}\t${totals.periodCredit}\t${totals.totalDebit}\t${totals.totalCredit}\t${totals.balanceDebit}\t${totals.balanceCredit}`
  );

  return lines.join('\n');
}
