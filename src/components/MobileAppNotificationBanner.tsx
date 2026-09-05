import {
  BellRing,
  CheckCircle2,
  Download,
  QrCode,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileAppNotificationBannerProps {
  onOpenInstallModal: () => void;
}

export const MobileAppNotificationBanner: React.FC<MobileAppNotificationBannerProps> = ({
  onOpenInstallModal,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If already running standalone, do not show prompt banner
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if user dismissed it recently in session
    const dismissed = sessionStorage.getItem('entersoft_pwa_banner_dismissed');
    if (!dismissed) {
      // Show notification banner after a brief graceful delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('entersoft_pwa_banner_dismissed', 'true');
  };

  const handleAction = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsVisible(false);
        return;
      }
    }
    onOpenInstallModal();
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-950 border-b border-emerald-500/30 text-white px-4 py-2.5 shadow-xl font-somar animate-in slide-in-from-top-3 duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Side: Notice & Icon */}
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 animate-pulse">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="font-black text-emerald-400">تطبيق الهاتف الذكي متاح الآن!</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.2 rounded-full border border-emerald-500/30">
                PWA فوري
              </span>
              <span className="text-slate-400 text-[11px] hidden md:inline">
                • تثبيت مباشر على هاتفك المحمول للعمل بدون إنترنت وبسرعة فائقة
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              ثبت البرنامج على جهازك للوصول السريع ومتابعة القيود والقوائم المالية من أي مكان.
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAction}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل وتثبيت للهاتف</span>
          </button>

          <button
            onClick={onOpenInstallModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>رمز الـ QR</span>
          </button>

          <button
            onClick={handleDismiss}
            aria-label="إغلاق الإشعار"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
