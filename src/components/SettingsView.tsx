import {
  Award,
  Building2,
  CheckCircle2,
  Database,
  Download,
  FolderArchive,
  HardDrive,
  History,
  Info,
  Key,
  Lock,
  PenTool,
  RefreshCw,
  Save,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { indexedDBBackupService, IndexedDBSnapshot } from '../services/indexedDBService';
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

  // IndexedDB snapshots state
  const [snapshots, setSnapshots] = useState<IndexedDBSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  const loadSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const list = await indexedDBBackupService.getAllSnapshots();
      setSnapshots(list);
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleCreateManualSnapshot = async () => {
    try {
      const result = await indexedDBBackupService.createSnapshot('نسخة يدوية من إعدادات النظام');
      if (result) {
        setNotification({ type: 'success', message: 'تم حفظ نسخة احتياطية فورية في المتصفح (IndexedDB) بنجاح!' });
        await loadSnapshots();
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'فشل في إنشاء النسخة الاحتياطية' });
    }
  };

  const handleRestoreSnapshot = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من استرجاع هذه النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية بالبيانات المحفوظة في هذه النسخة.')) {
      return;
    }
    try {
      const success = await indexedDBBackupService.restoreSnapshot(id);
      if (success) {
        setNotification({ type: 'success', message: 'تم استرجاع النسخة بنجاح! جاري إعادة التحميل...' });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setNotification({ type: 'error', message: 'تعذر استرجاع النسخة المحددة' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'حدث خطأ أثناء استرجاع النسخة' });
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await indexedDBBackupService.deleteSnapshot(id);
      await loadSnapshots();
      setNotification({ type: 'success', message: 'تم حذف النسخة الاحتياطية' });
    } catch (e) {
      setNotification({ type: 'error', message: 'فشل في حذف النسخة' });
    }
  };

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2 font-cairo">
            <Database className="w-5 h-5 text-zinc-800" />
            الإعدادات والنسخ الاحتياطي
          </h2>
          <p className="text-xs text-zinc-500">إدارة قاعدة البيانات، التوقيع الرقمي، والنسخ الاحتياطي التلقائي (IndexedDB)</p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-zinc-900 text-white border border-zinc-800'
              : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Grid: Database operations + Auditor Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. IndexedDB Browser Persistence & Backup Manager */}
        <div className="bg-white border border-zinc-300 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-zinc-800" />
              <div>
                <h3 className="font-bold text-zinc-900 text-sm font-cairo">
                  النسخ الاحتياطي التلقائي بالمتصفح (IndexedDB)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  حفظ دوري تلقائي كل 30 ثانية لضمان عدم ضياع أي بيانات عند إغلاق المتصفح
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateManualSnapshot}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>أخذ نسخة الآن</span>
            </button>
          </div>

          {/* Snapshots History List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-600 font-bold">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-zinc-500" />
                سجل النسخ الاحتياطية المحفوظة ({snapshots.length})
              </span>
              <button
                onClick={loadSnapshots}
                className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSnapshots ? 'animate-spin' : ''}`} />
                تحديث
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-300 rounded-lg text-xs text-zinc-400">
                لا توجد نسخ محفوظة حالياً. يقوم النظام بالحفظ التلقائي دورياً.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {snapshots.slice(0, 10).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-2 hover:border-zinc-400"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 truncate text-[12px]">{s.description || 'نسخة دورية تلقائية'}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(s.timestamp).toLocaleString('ar-EG')} • {((s.sizeBytes || 0) / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreSnapshot(s.id)}
                        className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded text-[11px] font-bold cursor-pointer"
                        title="استرجاع هذه النسخة"
                      >
                        استرجاع
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(s.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export / Import JSON actions */}
          <div className="pt-3 border-t border-zinc-200 space-y-2">
            <div className="text-xs font-bold text-zinc-700">تصدير واستيراد ملف خارجي (JSON):</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportDatabase}
                className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-lg cursor-pointer border border-zinc-300 flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير ملف JSON</span>
              </button>

              <label className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-lg cursor-pointer border border-zinc-300 flex items-center justify-center gap-1.5 text-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد ملف JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Clean Slate - Empty Company for Real Work */}
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-zinc-900">تفريغ وبدء شركة جديدة</div>
              <p className="text-[11px] text-zinc-500">تصفير قيود اليومية والفواتير والعملاء</p>
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
              className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer shrink-0 text-xs"
            >
              تفريغ
            </button>
          </div>
        </div>

        {/* 2. Auditor Info Card & Signature Studio */}
        <div className="bg-white border border-zinc-300 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
            <Award className="w-5 h-5 text-zinc-800" />
            <div>
              <h3 className="font-bold text-zinc-900 text-sm font-cairo">
                بيانات المحاسب والمراجع القانوني المعتمد
              </h3>
              <p className="text-[11px] text-zinc-500">
                تظهر هذه البيانات على كافة التقارير وسندات القيود والقوائم المالية المصدرة
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAuditor} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">اسم المحاسب والمراجع القانوني *</label>
              <input
                type="text"
                required
                value={auditorForm.auditorName}
                onChange={(e) => setAuditorForm({ ...auditorForm, auditorName: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">رقم القيد بسجل المحاسبين (س.م.م)</label>
                <input
                  type="text"
                  required
                  value={auditorForm.registerNumber}
                  onChange={(e) => setAuditorForm({ ...auditorForm, registerNumber: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">تاريخ تقرير المراجعة</label>
                <input
                  type="date"
                  required
                  value={auditorForm.reportDate}
                  onChange={(e) => setAuditorForm({ ...auditorForm, reportDate: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">اسم مكتب المحاسبة</label>
              <input
                type="text"
                value={auditorForm.firmName || ''}
                onChange={(e) => setAuditorForm({ ...auditorForm, firmName: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-zinc-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                حفظ بيانات المراجع
              </button>
            </div>
          </form>
        </div>

        {/* 3. Company Profile Settings */}
        <div className="bg-white border border-zinc-300 rounded-xl p-5 space-y-4 shadow-2xs lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
            <Building2 className="w-5 h-5 text-zinc-800" />
            <div>
              <h3 className="font-bold text-zinc-900 text-sm font-cairo">
                الملف التعريفي للمنشأة والبيانات الضريبية
              </h3>
              <p className="text-[11px] text-zinc-500">
                اسم الشركة، الشكل القانوني، الرقم الضريبي، والسجل التجاري
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">اسم المنشأة / الشركة *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">الشكل القانوني *</label>
                <input
                  type="text"
                  required
                  value={profileForm.legalForm}
                  onChange={(e) => setProfileForm({ ...profileForm, legalForm: e.target.value })}
                  placeholder="شركة مساهمة مصرية / ش.ذ.م.م"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">نهاية السنة المالية</label>
                <input
                  type="text"
                  value={profileForm.fiscalYearEnd}
                  onChange={(e) => setProfileForm({ ...profileForm, fiscalYearEnd: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">رقم التسجيل الضريبي (البطاقة الضريبية)</label>
                <input
                  type="text"
                  value={profileForm.taxCard}
                  onChange={(e) => setProfileForm({ ...profileForm, taxCard: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">رقم السجل التجاري</label>
                <input
                  type="text"
                  value={profileForm.commercialRegistry}
                  onChange={(e) => setProfileForm({ ...profileForm, commercialRegistry: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">مأمورية الضرائب التابع لها</label>
                <input
                  type="text"
                  value={profileForm.taxOffice}
                  onChange={(e) => setProfileForm({ ...profileForm, taxOffice: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">العنوان والمقر الرئيسي</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">الهاتف والبريد الإلكتروني</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer shadow-2xs"
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
