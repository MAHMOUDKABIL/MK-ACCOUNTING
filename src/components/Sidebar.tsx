import {
  Award,
  BarChart3,
  BookOpen,
  Building,
  Calculator,
  Coins,
  Database,
  FileCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  FolderTree,
  Globe,
  HelpCircle,
  History,
  Layers,
  LayoutDashboard,
  Receipt,
  Scale,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuSections = [
    {
      title: 'الرئيسية',
      items: [
        { id: 'dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard },
        { id: 'kpi-dashboard', label: 'مؤشرات الأداء (KPIs)', icon: BarChart3 },
      ],
    },
    {
      title: 'المكتب',
      items: [
        {
          id: 'clients-archive',
          label: 'أرشيف المكتب',
          icon: FolderArchive,
        },
        {
          id: 'treasury-financial',
          label: 'خزينة المكتب',
          icon: Wallet,
        },
        {
          id: 'certificates-management',
          label: 'الشهادات المعتمدة',
          icon: Award,
        },
      ],
    },
    {
      title: 'المحاسبة',
      items: [
        { id: 'chart-of-accounts', label: 'دليل الحسابات', icon: FolderTree },
        {
          id: 'journal-entries',
          label: 'قيود اليومية',
          icon: BookOpen,
        },
        { id: 'fixed-assets', label: 'الأصول الثابتة والإهلاك', icon: Layers },
        { id: 'general-ledger', label: 'الأستاذ العام', icon: FileSpreadsheet },
        { id: 'trial-balance', label: 'ميزان المراجعة', icon: Scale },
      ],
    },
    {
      title: 'التقارير والقوائم',
      items: [
        {
          id: 'financial-scenario-builder',
          label: 'سيناريوهات القوائم المالية',
          icon: Sparkles,
        },
        { id: 'financial-analysis', label: 'التحليل المالي والنسب', icon: BarChart3 },
        { id: 'financial-statements', label: 'القوائم المالية', icon: FileCheck },
        {
          id: 'auditor-report',
          label: 'تقرير المراجع',
          icon: FileCheck2,
        },
      ],
    },
    {
      title: 'الضرائب والفواتير',
      items: [
        {
          id: 'einvoice-eta',
          label: 'الفاتورة الإلكترونية',
          icon: Globe,
        },
        { id: 'invoices', label: 'الفواتير الضريبية', icon: Receipt },
        { id: 'tax-assistant', label: 'الضرائب ونموذج 41', icon: Calculator },
        { id: 'bank-reconciliation', label: 'تسوية البنك والخزينة', icon: Coins },
        { id: 'parties', label: 'العملاء والموردين', icon: Users },
      ],
    },
    {
      title: 'الرقابة والنظام',
      items: [
        { id: 'audit-logs', label: 'سجل العمليات والرقابة', icon: ShieldAlert },
        { id: 'settings', label: 'الإعدادات والنسخ', icon: Database },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-l border-slate-800 text-slate-400 flex flex-col h-[calc(100vh-65px)] sticky top-[65px] shrink-0 overflow-y-auto no-print select-none">
      {/* Navigation Sections */}
      <div className="p-3 space-y-4 flex-1">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 font-somar">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all text-right cursor-pointer group font-somar ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-950/40 border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Clean Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 m-2 rounded-xl text-center space-y-0.5">
        <div className="flex items-center justify-center gap-1.5 text-slate-200 font-bold text-xs font-somar">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>ENTERSOFT 2026</span>
        </div>
        <p className="text-[10px] text-slate-500 font-somar">
          نظام المحاسبة والمراجعة المعتمد
        </p>
      </div>
    </aside>
  );
};
