import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Layers,
  Printer,
  Settings,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { indexedDBBackupService } from '../services/indexedDBService';
import { CompanyProfile } from '../types/accounting';

interface HeaderProps {
  companyProfile: CompanyProfile;
  auditorStatement?: any;
  onOpenSmartEntry: () => void;
  onOpenOpeningBalances?: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companyProfile,
  onOpenSmartEntry,
  onOpenOpeningBalances,
  onOpenSettings,
}) => {
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(indexedDBBackupService.getLastBackupTime());

  useEffect(() => {
    const unsubscribe = indexedDBBackupService.subscribe(() => {
      setLastBackupTime(indexedDBBackupService.getLastBackupTime());
    });
    return unsubscribe;
  }, []);

  const formatBackupTime = (iso: string | null) => {
    if (!iso) return 'جاري المزامنة...';
    const date = new Date(iso);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-30 shadow-md no-print select-none bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Company Identity */}
        <div className="flex items-center gap-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md shadow-emerald-950/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-black tracking-tight text-white font-somar">
                  ENTERSOFT <span className="text-emerald-400 font-bold">ACCOUNTING</span>
                </span>
                {/* Auto Backup Live Badge */}
                <div
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-bold text-emerald-300 shadow-xs"
                  title="النسخ الاحتياطي التلقائي المستمر في قاعدة بيانات المتصفح IndexedDB"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>IndexedDB محفوظ ({formatBackupTime(lastBackupTime)})</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-xs md:max-w-md font-sans">
                {companyProfile.name || 'الشركة الجديدة للتجارة والصناعة (ش.م.م)'}
                {companyProfile.taxCard ? ` • ضريبي: ${companyProfile.taxCard}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Opening Balances Setup Button */}
          {onOpenOpeningBalances && (
            <button
              onClick={onOpenOpeningBalances}
              className="h-9 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold px-3.5 rounded-xl transition-all cursor-pointer active:scale-95"
              title="إدخال الأرصدة الافتتاحية السريعة وتوليد القيد الافتتاحي"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>الأرصدة الافتتاحية</span>
            </button>
          )}

          {/* Smart Entry Assistant Button */}
          <button
            onClick={onOpenSmartEntry}
            className="h-9 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs md:text-sm font-bold px-4 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
            title="إنشاء قيد محاسبي ذكي وفق النماذج المحاسبية المصرية"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>اقتراح قيد آلي</span>
          </button>

          {/* Quick Print Current View */}
          <button
            onClick={() => window.print()}
            className="h-9 flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold px-3 rounded-xl transition-all cursor-pointer"
            title="طباعة التقرير / المستند الحالي A4"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">طباعة A4</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="h-9 flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold px-3 rounded-xl transition-all cursor-pointer"
            title="إعدادات النظام وقاعدة البيانات وتفريغ البيانات"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            <span className="hidden md:inline">الإعدادات</span>
          </button>
        </div>
      </div>
    </header>
  );
};

