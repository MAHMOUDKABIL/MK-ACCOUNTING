import {
  Award,
  Building2,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Printer,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { AuditorStatement, CompanyProfile } from '../types/accounting';

interface HeaderProps {
  companyProfile: CompanyProfile;
  auditorStatement?: AuditorStatement;
  onOpenSmartEntry: () => void;
  onOpenOpeningBalances?: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companyProfile,
  auditorStatement,
  onOpenSmartEntry,
  onOpenOpeningBalances,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 shadow-xs no-print select-none">
      {/* Top Professional Auditor Banner (Sleek Dark Ribbon) */}
      <div className="bg-slate-900 text-slate-300 px-4 md:px-6 py-1.5 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            نظام المعايير المحاسبية المصرية (EAS)
          </span>
          <span className="text-slate-400 hidden md:inline">
            إشراف وإعداد: <strong className="text-slate-200">محاسب ومراجع قانوني / {auditorStatement?.auditorName || 'محمود الباز قابيل'}</strong> ({auditorStatement?.registerNumber || 'س.م.م 44887'})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            قاعدة بيانات مالية محلية جاهزة للعمل
          </span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700">
            سجل مراجعين: 44887
          </span>
        </div>
      </div>

      {/* Main App Bar (Sleek Clean White/Slate Header) */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Company Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm text-white shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-wide flex items-center gap-2 font-cairo">
              {companyProfile.name || 'الشركة الجديدة للتجارة والصناعة (ش.م.م)'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {companyProfile.taxCard ? `الرقم الضريبي: ${companyProfile.taxCard} | ` : ''}
              {companyProfile.commercialRegistry ? `السجل التجاري: ${companyProfile.commercialRegistry} | ` : ''}
              {companyProfile.legalForm || 'شركة مساهمة مصرية'}
            </p>
          </div>
        </div>

        {/* Action Controls & Auditor Tools */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Opening Balances Setup Button */}
          {onOpenOpeningBalances && (
            <button
              onClick={onOpenOpeningBalances}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
              title="إدخال الأرصدة الافتتاحية السريعة وتوليد القيد الافتتاحي"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>الأرصدة الافتتاحية</span>
            </button>
          )}

          {/* Smart Entry Assistant Button */}
          <button
            onClick={onOpenSmartEntry}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
            title="إنشاء قيد محاسبي ذكي وفق النماذج المحاسبية المصرية"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>اقتراح قيد آلي ذكي</span>
          </button>

          {/* Quick Print Current View */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="طباعة التقرير / المستند الحالي A4"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">طباعة A4</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="إعدادات النظام وقاعدة البيانات وتفريغ البيانات"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">الإعدادات</span>
          </button>
        </div>
      </div>
    </header>
  );
};
