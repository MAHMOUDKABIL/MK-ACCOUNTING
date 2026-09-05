import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Key,
  Layers,
  Send,
  Share2,
  Sparkles,
  Table,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { GoogleSheetsApiService } from '../services/googleSheetsService';
import { CompanyProfile, TrialBalanceItem } from '../types/accounting';
import {
  exportFinancialStatementsToGoogleSheets,
  exportTrialBalanceToGoogleSheets,
  getTrialBalanceTSVForGoogleSheets,
} from '../utils/googleSheetsExport';

interface GoogleSheetsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'trial_balance' | 'financial_statements';
  trialBalanceData?: {
    items: TrialBalanceItem[];
    totals: any;
  };
  financialData?: any;
  companyProfile: CompanyProfile;
}

export const GoogleSheetsExportModal: React.FC<GoogleSheetsExportModalProps> = ({
  isOpen,
  onClose,
  type,
  trialBalanceData,
  financialData,
  companyProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'quick' | 'api'>('quick');

  // API Config States
  const [apiKey, setApiKey] = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem('entersoft_gsheets_api_key') || '' : '')
  );
  const [spreadsheetId, setSpreadsheetId] = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem('entersoft_gsheets_sheet_id') || '' : '')
  );
  const [targetSheetName, setTargetSheetName] = useState(
    type === 'trial_balance' ? 'ميزان المراجعة' : 'القوائم المالية'
  );
  const [isExportingApi, setIsExportingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const title =
    type === 'trial_balance'
      ? 'تصدير ميزان المراجعة إلى Google Sheets'
      : 'تصدير القوائم المالية والحسابات الختامية إلى Google Sheets';

  const handleExportViaAxiosApi = async () => {
    if (!apiKey.trim() || !spreadsheetId.trim()) {
      setApiError('يرجى إدخال مفتاح API ومعرّف جدول البيانات (Spreadsheet ID)');
      return;
    }
    setIsExportingApi(true);
    setApiError(null);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('entersoft_gsheets_api_key', apiKey.trim());
        localStorage.setItem('entersoft_gsheets_sheet_id', spreadsheetId.trim());
      }

      let res;
      if (type === 'trial_balance' && trialBalanceData) {
        res = await GoogleSheetsApiService.exportTrialBalance(
          { apiKey: apiKey.trim(), spreadsheetId: spreadsheetId.trim(), sheetName: targetSheetName },
          trialBalanceData.items,
          trialBalanceData.totals,
          companyProfile
        );
      } else if (financialData) {
        res = await GoogleSheetsApiService.exportFinancialStatements(
          { apiKey: apiKey.trim(), spreadsheetId: spreadsheetId.trim(), sheetName: targetSheetName },
          financialData,
          companyProfile
        );
      }

      if (res?.success) {
        setExportSuccess(`تم التصدير بنجاح عبر Axios API إلى جدول Google Sheets (ورقة "${targetSheetName}")!`);
      } else {
        setApiError(res?.message || 'فشل الاتصال بـ Google Sheets API. تأكد من صحة المفتاح والأذونات.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'حدث خطأ في طلب Axios أثناء التصدير.');
    } finally {
      setIsExportingApi(false);
    }
  };

  const handleDownloadXlsx = () => {
    try {
      if (type === 'trial_balance' && trialBalanceData) {
        const res = exportTrialBalanceToGoogleSheets(
          trialBalanceData.items,
          trialBalanceData.totals,
          companyProfile
        );
        setExportSuccess(`تم تنزيل ملف ${res.fileName} بنجاح! جاهز للاستيراد المباشر في Google Sheets`);
      } else if (type === 'financial_statements' && financialData) {
        const res = exportFinancialStatementsToGoogleSheets(financialData, companyProfile);
        setExportSuccess(`تم تنزيل مصنف ${res.fileName} بنجاح بكافة تبويبات القوائم المالية!`);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenGoogleSheetsNew = () => {
    // Copy data to clipboard first
    if (type === 'trial_balance' && trialBalanceData) {
      const tsv = getTrialBalanceTSVForGoogleSheets(
        trialBalanceData.items,
        trialBalanceData.totals,
        companyProfile
      );
      navigator.clipboard.writeText(tsv);
      setCopied(true);
    }

    // Open Google Sheets in new tab
    window.open('https://sheets.new', '_blank');
    setExportSuccess('تم نسخ البيانات وجارٍ فتح جدول جديد في Google Sheets. اضغط (Ctrl+V) للصق الجدول فوراً!');
  };

  const handleCopyTSV = () => {
    if (type === 'trial_balance' && trialBalanceData) {
      const tsv = getTrialBalanceTSVForGoogleSheets(
        trialBalanceData.items,
        trialBalanceData.totals,
        companyProfile
      );
      navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-cairo flex items-center gap-2">
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                تصدير مهيأ بالصيغ والمعادلات المحاسبية للتداول والتحليل المهني الخارجي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast if any */}
        {exportSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Error toast if any */}
        {apiError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode('quick')}
            className={`py-2 px-3 rounded-lg text-xs font-bold font-cairo transition-all cursor-pointer ${
              activeMode === 'quick'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التصدير السريع / المصنفات
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('api')}
            className={`py-2 px-3 rounded-lg text-xs font-bold font-cairo flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'api'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>الربط المباشر API (Axios)</span>
          </button>
        </div>

        {/* API Form Mode */}
        {activeMode === 'api' ? (
          <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-600 leading-relaxed font-cairo">
              يتيح لك هذا الخيار تحديث جدول Google Sheets مباشر عبر خدمة <strong>Axios REST API</strong>.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-cairo">
                  Google Sheets API Key *
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-cairo">
                  معرّف جدول البيانات (Spreadsheet ID أو الرابط) *
                </label>
                <input
                  type="text"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-cairo">
                  اسم ورقة العمل المستهدفة (Sheet Tab Name)
                </label>
                <input
                  type="text"
                  value={targetSheetName}
                  onChange={(e) => setTargetSheetName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-emerald-500 font-cairo"
                />
              </div>

              <button
                type="button"
                onClick={handleExportViaAxiosApi}
                disabled={isExportingApi}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                {isExportingApi ? (
                  <span>جارٍ التصدير عبر Axios...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>تصدير فوري إلى Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Options List */
          <div className="space-y-3">
          {/* Option 1: Instant 1-Click Open in Google Sheets */}
          <div
            onClick={handleOpenGoogleSheetsNew}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white font-bold shrink-0 mt-0.5 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 font-cairo flex items-center gap-2">
                  فتح فوري في Google Sheets (جدول بيانات سحابي جديد)
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    مستحسن
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  ينسخ البيانات المالية مهيأة بالأعمدة ويفتح صفحة Google Sheets جديدة للصق والتحليل الفوري والمشاركة
                </p>
              </div>
            </div>

            <ExternalLink className="w-5 h-5 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* Option 2: Download .xlsx with Formulas */}
          <div
            onClick={handleDownloadXlsx}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-sky-600 text-white font-bold shrink-0 mt-0.5 shadow-xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 font-cairo">
                  تنزيل مصنف مهيأ بالمعادلات (.xlsx)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  يحتوي على معادلات الجمع والتوازن المحاسبي، ويدعم الفتح في Google Drive / Sheets و MS Excel
                </p>
              </div>
            </div>

            <Download className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
          </div>

          {/* Option 3: Copy Formatted TSV */}
          {type === 'trial_balance' && (
            <div
              onClick={handleCopyTSV}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-slate-700 text-white font-bold shrink-0 mt-0.5 shadow-xs">
                  {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 font-cairo flex items-center gap-2">
                    نسخ بيانات ميزان المراجعة للحافظة (Clipboard)
                    {copied && <span className="text-emerald-600 text-[10px] font-bold">تم النسخ!</span>}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    جاهز للصق المباشر في أي جدول إلكتروني أو برنامج حسابات خارجي
                  </p>
                </div>
              </div>

              <Copy className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
            </div>
          )}
        </div>
      )}

        {/* Feature Highlights */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 font-cairo">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>مزايا التصدير وفق معايير المحاسبة المصرية (EAS):</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>معادلات ديناميكية لإجمالي المدين والدائن</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>صيغ فحص وتأكيد التوازن المحاسبي</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>فصل الحسابات بالأكواد الشجرية المعتمدة</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>جاهزية فورية للمشاركة مع المراجع الخارجي</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
