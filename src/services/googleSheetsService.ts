import axios from 'axios';
import { CompanyProfile, FinancialRatio, TrialBalanceItem } from '../types/accounting';

export interface GoogleSheetsExportConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName?: string;
  action?: 'append' | 'overwrite';
}

export interface GoogleSheetsExportResponse {
  success: boolean;
  message: string;
  updatedRange?: string;
  updatedRows?: number;
  spreadsheetUrl?: string;
}

/**
 * Service to connect and export accounting reports and financial statements
 * directly to Google Sheets using Axios and the Google Sheets REST API v4.
 */
export class GoogleSheetsApiService {
  private static BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

  /**
   * Test API connectivity to the target Spreadsheet
   */
  public static async testConnection(
    apiKey: string,
    spreadsheetId: string
  ): Promise<{ success: boolean; title?: string; sheetNames?: string[]; message: string }> {
    if (!apiKey || !spreadsheetId) {
      return {
        success: false,
        message: 'يرجى إدخال مفتاح الـ API ومعرّف جدول البيانات (Spreadsheet ID)',
      };
    }

    try {
      const cleanId = this.extractSpreadsheetId(spreadsheetId);
      const url = `${this.BASE_URL}/${cleanId}?key=${apiKey.trim()}`;
      const response = await axios.get(url, {
        timeout: 10000,
      });

      const sheets = response.data.sheets || [];
      const sheetNames = sheets.map((s: any) => s.properties?.title || 'Sheet1');
      const docTitle = response.data.properties?.title || 'جدول بيانات Google';

      return {
        success: true,
        title: docTitle,
        sheetNames,
        message: `تم الاتصال بنجاح بجدول "${docTitle}" (${sheetNames.length} أوراق عمل متاحة)`,
      };
    } catch (error: any) {
      console.error('Google Sheets API Connection Error:', error);
      const errDetail =
        error.response?.data?.error?.message ||
        error.message ||
        'فشل الاتصال بـ Google Sheets API. تأكد من صحة المفتاح والأذونات.';
      return {
        success: false,
        message: `خطأ في الاتصال: ${errDetail}`,
      };
    }
  }

  /**
   * Export structured 2D table data to a specific sheet in Google Sheets
   */
  public static async exportValuesToSheet(
    config: GoogleSheetsExportConfig,
    values: any[][],
    customRange?: string
  ): Promise<GoogleSheetsExportResponse> {
    const { apiKey, spreadsheetId, sheetName = 'ورقة1' } = config;

    if (!apiKey || !spreadsheetId) {
      return {
        success: false,
        message: 'مفتاح الـ API ومعرف الجدول مطلوبان لإتمام عملية التصدير السحابي',
      };
    }

    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    const range = customRange || `'${sheetName}'!A1`;
    const encodedRange = encodeURIComponent(range);
    const url = `${this.BASE_URL}/${cleanId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&key=${apiKey.trim()}`;

    try {
      const payload = {
        range,
        majorDimension: 'ROWS',
        values,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const updates = response.data.updates || {};
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

      return {
        success: true,
        message: `تم تصدير ${values.length} صف إلى ورقة "${sheetName}" في Google Sheets بنجاح!`,
        updatedRange: updates.updatedRange,
        updatedRows: updates.updatedRows || values.length,
        spreadsheetUrl: sheetUrl,
      };
    } catch (error: any) {
      console.error('Google Sheets Export Error:', error);
      const errMsg =
        error.response?.data?.error?.message ||
        error.message ||
        'حدث خطأ أثناء كتابة البيانات لـ Google Sheets API';
      return {
        success: false,
        message: `فشل التصدير: ${errMsg}`,
      };
    }
  }

  /**
   * Prepare Trial Balance Data Rows for Google Sheets
   */
  public static buildTrialBalanceRows(
    items: TrialBalanceItem[],
    totals: any,
    companyProfile: CompanyProfile
  ): any[][] {
    const rows: any[][] = [];
    rows.push([`ميزان المراجعة بالأرصدة والمجاميع - ${companyProfile.name || 'الشركة'}`]);
    rows.push([`السنة المالية 2026 | تم التصدير عبر نظام ENTERSOFT المحاسبي | ${new Date().toLocaleDateString('ar-EG')}`]);
    rows.push([]);
    rows.push([
      'كود الحساب',
      'اسم الحساب المحاسبي',
      'رصيد أول مدين',
      'رصيد أول دائن',
      'حركة الفترة مدين',
      'حركة الفترة دائن',
      'المجموع مدين',
      'المجموع دائن',
      'الرصيد الختامي مدين',
      'الرصيد الختامي دائن',
    ]);

    items.forEach((item) => {
      rows.push([
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

    rows.push([
      'الإجمالي العام',
      'مجموع ميزان المراجعة',
      totals.openingDebit || 0,
      totals.openingCredit || 0,
      totals.periodDebit || 0,
      totals.periodCredit || 0,
      totals.totalDebit || 0,
      totals.totalCredit || 0,
      totals.balanceDebit || 0,
      totals.balanceCredit || 0,
    ]);

    return rows;
  }

  /**
   * Prepare Financial Statements Data Rows for Google Sheets
   */
  public static buildFinancialStatementsRows(
    financialData: any,
    companyProfile: CompanyProfile
  ): any[][] {
    const { incomeStatement, balanceSheet, workingCapital, ratios } = financialData || {};
    const rows: any[][] = [];

    rows.push([`القوائم المالية والحسابات الختامية الرسمية - ${companyProfile.name || 'الشركة'}`]);
    rows.push([`السنة المالية المنتهية في: ${companyProfile.fiscalYearEnd || '2026-12-31'} | العملة: EGP`]);
    rows.push([]);

    // 1. Income Statement
    rows.push(['=== قائمة الدخل الشامل (Income Statement) ===', '']);
    rows.push(['البند المحاسبي', 'القيمة (ج.م)']);
    rows.push(['إيرادات وصافي المبيعات', incomeStatement?.netSales || incomeStatement?.revenue || 0]);
    rows.push(['تكلفة المبيعات والبضاعة المباعة (COGS)', incomeStatement?.costOfGoodsSold || 0]);
    rows.push(['مجمل الربح (Gross Profit)', incomeStatement?.grossProfit || 0]);
    rows.push(['المصروفات العمومية والإدارية', incomeStatement?.generalExpenses || incomeStatement?.operatingExpenses || 0]);
    rows.push(['مصروف إهلاك الأصول الثابتة', incomeStatement?.depreciationExpense || 0]);
    rows.push(['أرباح التشغيل قبل الفوائد والضرائب (EBIT)', incomeStatement?.operatingProfit || 0]);
    rows.push(['مخصص ضريبة الدخل (22.5%)', incomeStatement?.corporateIncomeTax || incomeStatement?.tax || 0]);
    rows.push(['صافي أرباح العام بعد الضريبة', incomeStatement?.netProfitAfterTax || incomeStatement?.netIncome || 0]);
    rows.push([]);

    // 2. Balance Sheet
    rows.push(['=== قائمة المركز المالي (الميزانية العمومية) ===', '']);
    rows.push(['الجانب المحاسبي', 'البند', 'القيمة (ج.م)']);
    rows.push(['الأصول غير المتداولة', 'صافي الأصول الثابتة', balanceSheet?.netFixedAssets || balanceSheet?.nonCurrentAssets?.fixedAssets || 0]);
    rows.push(['الأصول غير المتداولة', 'إجمالي الأصول غير المتداولة', balanceSheet?.totalNonCurrentAssets || balanceSheet?.nonCurrentAssets?.total || 0]);
    rows.push(['الأصول المتداولة', 'المخزون السلعي', balanceSheet?.inventory || balanceSheet?.currentAssets?.inventory || 0]);
    rows.push(['الأصول المتداولة', 'العملاء والمدينون', balanceSheet?.tradeReceivables || balanceSheet?.currentAssets?.receivables || 0]);
    rows.push(['الأصول المتداولة', 'النقدية وما في حكمها', balanceSheet?.cashAndEquivalents || balanceSheet?.currentAssets?.cash || 0]);
    rows.push(['الأصول المتداولة', 'إجمالي الأصول المتداولة', balanceSheet?.totalCurrentAssets || balanceSheet?.currentAssets?.total || 0]);
    rows.push(['مجموع الأصول', 'إجمالي الأصول الكاملة', balanceSheet?.totalAssets || 0]);
    rows.push(['حقوق الملكية', 'رأس المال المدفوع والاحتياطيات والأرباح', balanceSheet?.totalEquity || balanceSheet?.equity?.total || 0]);
    rows.push(['الالتزامات', 'إجمالي الالتزامات المتداولة وطويلة الأجل', balanceSheet?.totalLiabilities || 0]);
    rows.push(['المجموع المتوازن', 'إجمالي الالتزامات وحقوق الملكية', balanceSheet?.totalLiabilitiesAndEquity || 0]);
    rows.push([]);

    // 3. Financial Ratios
    if (ratios && Array.isArray(ratios)) {
      rows.push(['=== المؤشرات والنسب المالية المحاسبية ===', '']);
      rows.push(['اسم النسبة / المؤشر', 'القيمة المحتسبة', 'المعيار المستهدف']);
      ratios.forEach((r: FinancialRatio) => {
        rows.push([r.name, r.formatted || r.value, r.benchmark || '-']);
      });
    }

    return rows;
  }

  /**
   * High-level export helper for Trial Balance
   */
  public static async exportTrialBalance(
    config: GoogleSheetsExportConfig,
    items: TrialBalanceItem[],
    totals: any,
    companyProfile: CompanyProfile
  ): Promise<GoogleSheetsExportResponse> {
    const rows = this.buildTrialBalanceRows(items, totals, companyProfile);
    return this.exportValuesToSheet(config, rows);
  }

  /**
   * High-level export helper for Financial Statements
   */
  public static async exportFinancialStatements(
    config: GoogleSheetsExportConfig,
    financialData: any,
    companyProfile: CompanyProfile
  ): Promise<GoogleSheetsExportResponse> {
    const rows = this.buildFinancialStatementsRows(financialData, companyProfile);
    return this.exportValuesToSheet(config, rows);
  }

  /**
   * Helper to extract clean spreadsheet ID if user pasted a full Google Docs URL
   */
  public static extractSpreadsheetId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    // Matches https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  }
}
