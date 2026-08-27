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
  LayoutDashboard,
  Receipt,
  Scale,
  Send,
  Settings,
  Shield,
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
      title: 'الرئيسية والتحليلات',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم والمؤشرات', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      title: 'أرشيف وخدمات مكتب المحاسب',
      items: [
        {
          id: 'clients-archive',
          label: 'أرشيف وسجل ملفات العملاء',
          icon: FolderArchive,
          badge: 'الملف الضريبي',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
        {
          id: 'treasury-financial',
          label: 'نظام الخزينة والماليات والأتعاب',
          icon: Wallet,
          badge: 'الوارد والمنصرف',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'certificates-management',
          label: 'وحدة الشهادات المحاسبية المعتمدة',
          icon: Award,
          badge: 'سجل 44887',
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        },
      ],
    },
    {
      title: 'العمليات المحاسبية الأساسية',
      items: [
        { id: 'chart-of-accounts', label: 'شجرة ودليل الحسابات', icon: FolderTree, badge: 'EAS' },
        {
          id: 'journal-entries',
          label: 'قيود اليومية العامة',
          icon: BookOpen,
          badge: null,
        },
        { id: 'general-ledger', label: 'دفتر الأستاذ العام', icon: FileSpreadsheet, badge: null },
        { id: 'trial-balance', label: 'ميزان المراجعة بالأرصدة', icon: Scale, badge: null },
      ],
    },
    {
      title: 'القوائم المالية والرقابة المهنية',
      items: [
        { id: 'financial-statements', label: 'القوائم المالية والحسابات الختامية', icon: BarChart3, badge: 'المعايير المصرية' },
        {
          id: 'auditor-report',
          label: 'تقرير مراقب الحسابات',
          icon: FileCheck2,
          badge: 'رأي المراجع',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
      ],
    },
    {
      title: 'المعاملات التجارية ومنظومة الضرائب',
      items: [
        {
          id: 'einvoice-eta',
          label: 'الفاتورة والإيصال الإلكتروني (ETA)',
          icon: Globe,
          badge: 'SDK Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono',
        },
        { id: 'invoices', label: 'الفواتير الضريبية (14% ق.م)', icon: Receipt, badge: 'نموذج الفاتورة' },
        { id: 'tax-assistant', label: 'المستشار الضريبي ونموذج 41', icon: Calculator, badge: 'ضرائب مصرية', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
        { id: 'bank-reconciliation', label: 'مذكرة تسوية البنك والخزينة', icon: Coins, badge: 'تسويات' },
        { id: 'parties', label: 'إدارة العملاء والموردين', icon: Users, badge: null },
      ],
    },
    {
      title: 'قاعدة البيانات المدمجة والإعدادات',
      items: [
        { id: 'settings', label: 'قاعدة البيانات والإعدادات', icon: Database, badge: 'Single File DB' },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 text-slate-400 flex flex-col h-[calc(100vh-90px)] sticky top-[90px] shrink-0 overflow-y-auto no-print select-none">
      {/* Navigation Sections */}
      <div className="p-3 space-y-5 flex-1">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 font-tajawal">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all text-right cursor-pointer group ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 font-bold border-r-2 border-sky-400'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Auditor Footer Badge in Sidebar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 m-2 rounded-xl text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-sky-400 font-bold text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>المراجعة القانونية معتمدة</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          المحاسب والمراجع القانوني<br />
          <strong className="text-slate-200">محمود الباز قابيل</strong>
        </p>
        <div className="text-[10px] text-sky-400 font-mono">
          سجل محاسبين ومراجعين: 44887
        </div>
      </div>
    </aside>
  );
};
