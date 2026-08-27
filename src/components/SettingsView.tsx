import {
  Award,
  Building2,
  CheckCircle2,
  Database,
  Download,
  FolderArchive,
  HardDrive,
  Info,
  Key,
  Lock,
  RefreshCw,
  Save,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useState } from 'react';
import { AuditorStatement, CompanyProfile } from '../types/accounting';

interface SettingsViewProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  onUpdateAuditorStatement: (statement: AuditorStatement) => void;
  onExportDatabase: () => void;
  onImportDatabase: (jsonString: string) => boolean;
  onResetToDefaults: () => void;
  onClearAllData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyProfile,
  auditorStatement,
  onUpdateCompanyProfile,
  onUpdateAuditorStatement,
  onExportDatabase,
  onImportDatabase,
  onResetToDefaults,
  onClearAllData,
}) => {
  const [profileForm, setProfileForm] = useState<CompanyProfile>(companyProfile);
  const [auditorForm, setAuditorForm] = useState<AuditorStatement>({
    ...auditorStatement,
    registerNumber: auditorStatement.registerNumber?.includes('18452')
      ? 'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية'
      : (auditorStatement.registerNumber || 'س.م.م 44887'),
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanyProfile(profileForm);
    setNotification({ type: 'success', message: 'تم حفظ بيانات المنشأة والملف الضريبي بنجاح' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveAuditor = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAuditorStatement(auditorForm);
    setNotification({ type: 'success', message: 'تم تحديث بيانات المحاسب القانوني ومراقب الحسابات' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = onImportDatabase(content);
        if (ok) {
          setNotification({ type: 'success', message: 'تم استرجاع قاعدة البيانات المحلية بنجاح!' });
        } else {
          setNotification({ type: 'error', message: 'ملف النسخة الاحتياطية غير صالح أو تالف!' });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <Database className="w-5 h-5 text-sky-600" />
            إعدادات النظام وقاعدة البيانات المحلية (Database & Config)
          </h2>
          <p className="text-xs text-slate-500">
            إدارة قاعدة البيانات المحلية الشبيهة بنظام Access، النسخ الاحتياطي، بيانات المنشأة والمراجع القانوني
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Grid: Database operations + Company Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Access-like Local Database Management Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardDrive className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm font-cairo">
                إدارة قاعدة البيانات المحلية (Local Database)
              </h3>
              <p className="text-[11px] text-slate-500">
                تخزين محلي فوري مشفر على جهاز الكمبيوتر بدون الحاجة لاتصال بالإنترنت
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Backup export */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>تصدير نسخة احتياطية كاملة (Backup)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  تنزيل ملف قاعدة البيانات بجميع الحسابات، قيود اليومية، الفواتير، والعملاء
                </p>
              </div>
              <button
                onClick={onExportDatabase}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shrink-0 shadow-sm"
              >
                تصدير الآن
              </button>
            </div>

            {/* Restore import */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-sky-600" />
                  <span>استرجاع نسخة احتياطية (Restore)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  استيراد قاعدة بيانات محفوظة مسبقاً بصيغة JSON
                </p>
              </div>
              <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer shrink-0 border border-slate-300 shadow-2xs">
                <span>اختيار ملف</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Clean Slate - Empty Company for Real Work */}
            <div className="bg-sky-50 p-3.5 rounded-xl border border-sky-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-sky-600" />
                  <span>تفريغ وتصفير النظام لبدء شركة جديدة (Clean Slate)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  تفريغ جميع قيود اليومية والفواتير والعملاء وتصفير الأرصدة الافتتاحية للبدء الفعلي فوراً
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من تفريغ كافة القيود والفواتير وتصفير الأرصدة لبدء شركة جديدة جاهزة للعمل الفعلي؟')) {
                    if (onClearAllData) {
                      onClearAllData();
                    } else {
                      onResetToDefaults();
                    }
                    setNotification({ type: 'success', message: 'تم تفريغ كافة البيانات وتجهيز النظام لشركة جديدة بنجاح!' });
                  }
                }}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shrink-0 shadow-sm"
              >
                تفريغ وبدء العمل
              </button>
            </div>
          </div>
        </div>

        {/* 2. Auditor Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm font-cairo">
                بيانات المحاسب والمراجع القانوني المعتمد
              </h3>
              <p className="text-[11px] text-slate-500">
                تظهر هذه البيانات على كافة التقارير وسندات القيود والقوائم المالية
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAuditor} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">اسم المحاسب والمراجع القانوني *</label>
              <input
                type="text"
                required
                value={auditorForm.auditorName}
                onChange={(e) => setAuditorForm({ ...auditorForm, auditorName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم القيد بسجل المحاسبين (س.م.م)</label>
                <input
                  type="text"
                  required
                  value={auditorForm.registerNumber}
                  onChange={(e) => setAuditorForm({ ...auditorForm, registerNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تاريخ تقرير المراجعة</label>
                <input
                  type="date"
                  required
                  value={auditorForm.reportDate}
                  onChange={(e) => setAuditorForm({ ...auditorForm, reportDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
              >
                حفظ بيانات المراجع
              </button>
            </div>
          </form>
        </div>

        {/* 3. Company Profile Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm font-cairo">
                الملف التعريفي للمنشأة والبيانات الضريبية
              </h3>
              <p className="text-[11px] text-slate-500">
                اسم الشركة، الشكل القانوني، الرقم الضريبي، والسجل التجاري
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المنشأة / الشركة *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الشكل القانوني *</label>
                <input
                  type="text"
                  required
                  value={profileForm.legalForm}
                  onChange={(e) => setProfileForm({ ...profileForm, legalForm: e.target.value })}
                  placeholder="شركة مساهمة مصرية / ش.ذ.م.م"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">نهاية السنة المالية</label>
                <input
                  type="text"
                  value={profileForm.fiscalYearEnd}
                  onChange={(e) => setProfileForm({ ...profileForm, fiscalYearEnd: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم التسجيل الضريبي (البطاقة الضريبية)</label>
                <input
                  type="text"
                  value={profileForm.taxCard}
                  onChange={(e) => setProfileForm({ ...profileForm, taxCard: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم السجل التجاري</label>
                <input
                  type="text"
                  value={profileForm.commercialRegistry}
                  onChange={(e) => setProfileForm({ ...profileForm, commercialRegistry: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">مأمورية الضرائب التابع لها</label>
                <input
                  type="text"
                  value={profileForm.taxOffice}
                  onChange={(e) => setProfileForm({ ...profileForm, taxOffice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">العنوان والمقر الرئيسي</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الهاتف والبريد الإلكتروني</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
              >
                حفظ بيانات المنشأة
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
