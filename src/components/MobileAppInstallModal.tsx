import {
  AlertCircle,
  Apple,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Info,
  Layers,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const MobileAppInstallModal: React.FC<MobileAppInstallModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'android'
  );
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    appUrl || (typeof window !== 'undefined' ? window.location.href : 'https://ai.studio');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=020617&bgcolor=ffffff&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTriggerInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-somar animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/70 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2.5 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-somar">
                  تثبيت وتحميل تطبيق الهاتف
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PWA الذكي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                احصل على التطبيق على شاشة هاتفك مباشرة بدون متجر وبسرعة فائقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Features Row */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-200">يعمل بدون إنترنت</div>
              <div className="text-[10px] text-slate-400">حفظ محلي فوري وآمن</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-200">سرعة تشغيل فائقة</div>
              <div className="text-[10px] text-slate-400">بدون انتظار أو تحميل ثقيل</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-200">تشفير وحماية تامة</div>
              <div className="text-[10px] text-slate-400">بياناتك على جهازك فقط</div>
            </div>
          </div>

          {/* QR Code & Scan Option for Mobile */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
            {/* Scannable QR Code */}
            <div className="bg-white p-2.5 rounded-2xl shadow-xl border-2 border-emerald-500/30 shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code لفتح البرنامج على الهاتف"
                className="w-36 h-36 rounded-lg object-contain"
                loading="eager"
              />
            </div>

            <div className="space-y-3 text-center sm:text-right flex-1">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 font-bold text-sm">
                  <QrCode className="w-4 h-4" />
                  <span>امسح الكود بكاميرا الهاتف</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  وجّه كاميرا هاتفك الذكي (آيفون أو أندرويد) نحو رمز الاستجابة السريعة وسيفتح التطبيق فوراً في متصفح الموبايل.
                </p>
              </div>

              {/* Copy URL Input */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/70 rounded-xl p-1.5">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-transparent text-xs text-slate-400 flex-1 px-2 font-mono truncate focus:outline-none"
                  dir="ltr"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Platform Tab Selector */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400">
              طريقة التثبيت على الهاتف حسب نوع جهازك:
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedPlatform('android')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedPlatform === 'android'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>هواتف أندرويد (Android)</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('ios')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedPlatform === 'ios'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>آيفون وآيباد (iPhone / iOS)</span>
              </button>
            </div>

            {/* Android Instructions */}
            {selectedPlatform === 'android' && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
                {isInstallable && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-emerald-300 font-semibold">
                      متصفحك يدعم التثبيت المباشر الآن بنقرة واحدة!
                    </span>
                    <button
                      onClick={handleTriggerInstall}
                      disabled={installing}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{installing ? 'جارِ التثبيت...' : 'تثبيت البرنامج الآن'}</span>
                    </button>
                  </div>
                )}

                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      1
                    </span>
                    <p>افتح الرابط في متصفح <strong>Google Chrome</strong> على هاتف الأندرويد.</p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      2
                    </span>
                    <p>
                      اضغط على قائمة الثلاث نقاط <strong>(⋮)</strong> بأعلى المتصفح.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      3
                    </span>
                    <p>
                      اختر <strong>"تثبيت التطبيق" (Install app)</strong> أو <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      4
                    </span>
                    <p>ستظهر أيقونة النظام الرسمية على شاشة هاتفك مع شاشة افتتاحية كاملة.</p>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {selectedPlatform === 'ios' && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
                <div className="space-y-2.5 text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      1
                    </span>
                    <p>افتح الرابط عبر متصفح <strong>Safari</strong> على جهاز iPhone أو iPad.</p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      2
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span>اضغط على زر المشاركة</span>
                      <span className="inline-flex items-center justify-center p-1 bg-slate-800 rounded-md text-cyan-400">
                        <Share2 className="w-3.5 h-3.5" />
                      </span>
                      <span>(Share) في شريط المتصفح السفلي.</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      3
                    </span>
                    <p>
                      مرر للأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen ⊞)</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-black shrink-0">
                      4
                    </span>
                    <p>اضغط <strong>إضافة (Add)</strong> في أعلى الزاوية، وسيعمل التطبيق كبرنامج أصلي بدون أشرطة تصفح.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>نظام ENTERSOFT معتمد ومطابق لمواصفات PWA العالمية</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
