import {
  BarChart3,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Home,
  LayoutGrid,
  Menu,
  PieChart,
  Smartphone,
  Wallet,
} from 'lucide-react';
import React from 'react';

interface MobileBottomNavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onToggleMobileDrawer: () => void;
  onOpenInstallModal: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onToggleMobileDrawer,
  onOpenInstallModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'journal-entries', label: 'القيود', icon: BookOpen },
    { id: 'kpi-dashboard', label: 'المؤشرات', icon: BarChart3 },
    { id: 'financial-statements', label: 'القوائم', icon: FileSpreadsheet },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-1.5 font-somar shadow-2xl flex items-center justify-around text-[10px] md:hidden print:hidden no-print">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-transform ${
                isActive ? 'bg-emerald-500/20 scale-110' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="mt-0.5 whitespace-nowrap">{item.label}</span>
            {isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-emerald-400 rounded-full" />
            )}
          </button>
        );
      })}

      {/* More / Menu Drawer Trigger */}
      <button
        onClick={onToggleMobileDrawer}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-4 h-4" />
        </div>
        <span className="mt-0.5 whitespace-nowrap">الأقسام</span>
      </button>

      {/* Direct Phone Install Button in Bottom Bar */}
      <button
        onClick={onOpenInstallModal}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
        title="تثبيت التطبيق على الهاتف"
      >
        <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Smartphone className="w-4 h-4 animate-bounce" />
        </div>
        <span className="mt-0.5 whitespace-nowrap font-bold">تثبيت</span>
      </button>
    </div>
  );
};
