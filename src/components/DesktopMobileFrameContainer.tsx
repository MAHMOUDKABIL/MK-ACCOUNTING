import {
  Apple,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Laptop,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  QrCode,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DesktopMobileFrameContainerProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenInstallModal: () => void;
  companyName?: string;
}

export const DesktopMobileFrameContainer: React.FC<DesktopMobileFrameContainerProps> = ({
  children,
  activeTab,
  onSelectTab,
  onOpenInstallModal,
  companyName = 'ENTERSOFT ACCOUNTING',
}) => {
  const { isMobileDevice, isInstallable, install } = usePWAInstall();
  // On desktop, default to 'mobile-frame' so the user sees the requested professional mobile app look!
  const [viewMode, setViewMode] = useState<'mobile-frame' | 'desktop'>(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'mobile-frame' : 'desktop'
  );
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'galaxy' | 'tablet'>('iphone');
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isCopied, setIsCopied] = useState(false);

  // Update clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ai.studio';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&color=020617&bgcolor=ffffff&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // If viewing on real small mobile screen or if user toggled to full desktop mode:
  if (viewMode === 'desktop') {
    return (
      <div className="relative min-h-screen flex flex-col">
        {/* Subtle Desktop Mode Floating Switcher */}
        <div className="hidden lg:flex fixed bottom-5 left-5 z-40 bg-slate-900/90 border border-emerald-500/40 text-white px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md items-center gap-3 font-somar text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-slate-200">وضع سطح المكتب</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => setViewMode('mobile-frame')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-md cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>عرض كتطبيق موبايل احترافي</span>
          </button>
          <button
            onClick={onOpenInstallModal}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white transition-colors cursor-pointer"
            title="تحميل التطبيق للهاتف"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Mobile App Frame Mode (Professional Mockup on Computer)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 flex flex-col font-somar selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Top Desktop Bar */}
      <header className="bg-slate-950/80 border-b border-slate-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm md:text-base text-white tracking-tight">
                ENTERSOFT <span className="text-emerald-400">MOBILE APP</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                محاكي تطبيق الهاتف
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              واجهة تفاعلية تحاكي تجربة التطبيق الأصلي على الهواتف الذكية مع إمكانية التحميل الفوري
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switch */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Device Model Selector */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setDeviceModel('iphone')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceModel === 'iphone'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone 16 Pro</span>
            </button>
            <button
              onClick={() => setDeviceModel('galaxy')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceModel === 'galaxy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Galaxy S25</span>
            </button>
            <button
              onClick={() => setDeviceModel('tablet')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceModel === 'tablet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>iPad Mini</span>
            </button>
          </div>

          {/* Switch to Full Desktop View Button */}
          <button
            onClick={() => setViewMode('desktop')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="التبديل إلى وضع شاشة سطح المكتب الكاملة"
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>عرض شاشة سطح المكتب</span>
          </button>

          {/* Download for Phone Button */}
          <button
            onClick={onOpenInstallModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل للتليفون</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: Side Control Hub + Centered Phone Chassis */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Left Side Companion Panel (on Desktop) */}
        <div className="w-full lg:w-80 space-y-4 shrink-0 order-2 lg:order-1">
          {/* Install & QR Code Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <QrCode className="w-4 h-4" />
              <span>فتح التطبيق على هاتفك فوراً</span>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code للتطبيق"
                className="w-40 h-40 rounded-lg object-contain"
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed text-center">
              افتح كاميرا الهاتف واقرأ الرمز لفتح التطبيق السحابي وتثبيته كبرنامج دائم على شاشتك.
            </p>

            <button
              onClick={handleCopy}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ رابط البرنامج</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ رابط الهاتف المباشر</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenInstallModal}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>خطوات التثبيت لأجهزة Android و iOS</span>
            </button>
          </div>

          {/* PWA Advantages Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 backdrop-blur-md text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ميزات تطبيق الهاتف PWA:</span>
            </div>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>حفظ محلي فوري والعمل بدون إنترنت</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>واجهة لمس مريحة وسريعة التنقل</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>متوافق تماماً مع معايير المحاسبة المصرية</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Center: The Photorealistic Smartphone Chassis */}
        <div className="order-1 lg:order-2 flex justify-center w-full max-w-[430px]">
          <div
            className={`relative transition-all duration-300 ${
              deviceModel === 'tablet'
                ? 'w-[520px] max-w-full'
                : 'w-[390px] sm:w-[410px]'
            }`}
          >
            {/* Phone Outer Chassis Border (Titanium Gloss Rim) */}
            <div className="relative rounded-[54px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] border-[4px] border-slate-700/80">
              {/* Physical Volume Buttons (Left side) */}
              <div className="absolute -left-2 top-24 w-1.5 h-12 bg-slate-600 rounded-l-md" />
              <div className="absolute -left-2 top-40 w-1.5 h-12 bg-slate-600 rounded-l-md" />

              {/* Physical Power Button (Right side) */}
              <div className="absolute -right-2 top-32 w-1.5 h-16 bg-slate-600 rounded-r-md" />

              {/* Inner Screen Bezel */}
              <div className="relative rounded-[42px] bg-slate-950 overflow-hidden border-[3px] border-slate-950 shadow-inner flex flex-col h-[780px] sm:h-[840px]">
                {/* Mobile Status Bar (Authentic Top Ribbon) */}
                <div className="bg-slate-950 text-white px-6 pt-3 pb-1 flex items-center justify-between text-xs font-sans z-40 select-none border-b border-slate-900 shrink-0">
                  {/* Local Real Time Clock */}
                  <span className="font-bold text-[13px] tracking-tight">{currentTime}</span>

                  {/* Dynamic Island / Camera Pill */}
                  <div className="w-24 h-5 bg-black rounded-full border border-slate-800/80 flex items-center justify-center gap-2 px-2 shadow-inner">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                  </div>

                  {/* Icons: 5G, Wi-Fi, Battery */}
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className="font-bold text-[10px]">5G</span>
                    <Wifi className="w-3.5 h-3.5 text-slate-300" />
                    {/* Battery Pill */}
                    <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-emerald-400 rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Inner App Container with Smooth Touch Scrolling */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-950 text-slate-100 flex flex-col">
                  {children}
                </div>

                {/* Bottom Virtual Home Indicator Pill */}
                <div className="bg-slate-950 py-1.5 flex items-center justify-center shrink-0 border-t border-slate-900/50">
                  <div className="w-32 h-1 bg-slate-500/60 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
