import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  ShieldCheck,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import { exportElementToPDF } from '../utils/pdfExport';
import { printA4Document } from '../utils/printA4Document';
import { generateQrCodeDataUrl, getReportVerificationUrl } from '../utils/qrCode';

export interface A4ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportSubtitle?: string;
  reportCode?: string;
  fiscalYear?: string;
  date?: string;
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  children: React.ReactNode;
  summaryCards?: Array<{
    label: string;
    value: string | number;
    sublabel?: string;
    color?: string;
  }>;
  legalNotice?: string;
}

export const A4ReportViewerModal: React.FC<A4ReportViewerModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  reportSubtitle,
  reportCode,
  fiscalYear = '2026',
  date = new Date().toLocaleDateString('ar-EG'),
  companyProfile,
  auditorStatement,
  children,
  summaryCards,
  legalNotice,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isMultiPage, setIsMultiPage] = useState<boolean>(false);
  const a4PageRef = useRef<HTMLDivElement>(null);

  const reportSerial = useMemo(() => {
    return reportCode || `REP-${fiscalYear}-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [reportCode, fiscalYear]);

  // Check if content overflows standard A4 height (~1123px at 96 DPI)
  useEffect(() => {
    if (!isOpen || !a4PageRef.current) return;
    const checkHeight = () => {
      if (a4PageRef.current) {
        setIsMultiPage(a4PageRef.current.scrollHeight > 1130);
      }
    };
    checkHeight();
    const observer = new ResizeObserver(checkHeight);
    observer.observe(a4PageRef.current);
    return () => observer.disconnect();
  }, [isOpen, children]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchQr = async () => {
      const verifyUrl = getReportVerificationUrl(reportSerial, reportTitle);
      const url = await generateQrCodeDataUrl(verifyUrl, { width: 160, margin: 1 });
      if (isMounted) {
        setQrCodeDataUrl(url);
      }
    };
    fetchQr();
    return () => {
      isMounted = false;
    };
  }, [isOpen, reportSerial, reportTitle]);

  // Synchronize a4-modal-open on document.body for zero-bleed print isolation
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.classList.add('a4-modal-open');
    } else {
      document.body.classList.remove('a4-modal-open');
    }
    return () => {
      document.body.classList.remove('a4-modal-open');
    };
  }, [isOpen]);

  // Direct DOM isolation on beforeprint/afterprint: guarantees #root cannot render in print preview
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleBeforePrint = () => {
      document.body.classList.add('a4-modal-open');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.display = 'none';
        rootEl.style.visibility = 'hidden';
      }
    };

    const handleAfterPrint = () => {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.display = '';
        rootEl.style.visibility = '';
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.display = '';
        rootEl.style.visibility = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const firmName =
    auditorStatement?.firmName ||
    'مكتب المحاسب والمراجع القانوني محمود الباز قابيل للمحاسبة والمراجعة والضرائب';
  const auditorName = auditorStatement?.auditorName || companyProfile?.auditorName || 'محمود الباز قابيل';
  const regNumber =
    auditorStatement?.registerNumber || 'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية';

  const handlePrint = () => {
    if (a4PageRef.current) {
      printA4Document(a4PageRef.current, `${reportTitle} - ${companyProfile?.name || 'ENTERSOFT'}`);
    } else {
      if (typeof document !== 'undefined') {
        document.body.classList.add('a4-modal-open');
      }
      window.print();
    }
  };

  const handleExportPDF = async () => {
    if (!a4PageRef.current) return;
    setIsExportingPDF(true);
    try {
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${companyProfile?.name || 'تقرير'}_2026.pdf`;
      await exportElementToPDF(a4PageRef.current, fileName, {
        reportTitle,
        companyProfile,
        auditorStatement,
        includeLetterhead: false, // letterhead is already cleanly baked into the A4 container
        includeStamp: false,
      });
    } catch (e) {
      console.error('Error generating PDF from A4 preview:', e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = () => {
    if (!a4PageRef.current) return;
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: 'Cairo', 'Somar', 'Arial', sans-serif; direction: rtl; background: white; color: black; }
          .no-print { display: none !important; }
          * { background: transparent !important; color: black !important; border-color: #cbd5e1 !important; }
          img { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
        </style>
      </head>
      <body>
    `;
    const footer = "</body></html>";
    const clone = a4PageRef.current.cloneNode(true) as HTMLElement;
    
    // Cleanup classes and unwanted UI before exporting
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    
    const sourceHTML = header + clone.outerHTML + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, '_')}_${companyProfile?.name || 'تقرير'}_2026.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const zoomScale = zoomLevel / 100;

  return createPortal(
    <div
      id="print-modal-portal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200 print:!bg-white print:!backdrop-blur-none print:!static print:!h-auto print:!w-full print:!overflow-visible"
    >
      {/* Top Modal Navigation & Action Bar (Excluded from Print) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4 shrink-0 shadow-lg text-white font-somar">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-black text-white">{reportTitle}</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 font-mono">
                معاينة ورق A4 رسمي
              </span>
              {isMultiPage && (
                <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                  متعدد الصفحات
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {companyProfile.name} • جمهورية مصر العربية
            </div>
          </div>
        </div>

        {/* Center: Zoom Controls */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
          <button
            onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            title="تصغير المعاينة"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] font-bold text-emerald-400 px-1.5 min-w-12 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            title="تكبير المعاينة"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="text-[10px] text-slate-400 hover:text-white px-1 font-bold border-r border-slate-800 mr-1"
          >
            100%
          </button>
        </div>

        {/* Right Actions: Print, PDF, Word, Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95"
            title="طباعة الصفحة A4 فورياً"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xl:inline">طباعة فورية</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            title="تصدير مستند PDF جاهز للطباعة"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">
              {isExportingPDF ? 'جاري التصدير...' : 'PDF'}
            </span>
          </button>
          
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-md active:scale-95"
            title="تصدير مستند Word"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span className="hidden xl:inline">Word</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إغلاق المعاينة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main A4 Canvas Viewport with Gray Background & Scroll */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/90 print:!p-0 print:!m-0 print:!bg-transparent print:!overflow-visible print:!block print:!w-full">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="print:!transform-none w-full flex justify-center print:!block print:!w-full"
        >
          {/* Authentic High-Quality A4 Paper Sheet (210mm x 297mm proportions) */}
          <div
            ref={a4PageRef}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-950 shadow-2xl p-8 sm:p-10 border border-zinc-300 rounded-xs flex flex-col justify-between font-somar font-sans mx-auto print-a4-container print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 print:!min-h-0 print:!h-auto print:!justify-start selection:bg-zinc-200"
            dir="rtl"
          >
            {/* Header: Official Egyptian Accounting Firm Letterhead - Somar Sans, No Boxes, No Dividers */}
            <div className="print-first-page-letterhead pb-2 mb-4 text-zinc-950 font-somar bg-white relative z-20">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                {/* Right: Full Auditor & Office Information */}
                <div className="space-y-1 sm:max-w-[62%] text-right">
                  <h1 className="text-[17px] font-black text-zinc-950 leading-tight font-somar">
                    {firmName}
                  </h1>
                  <p className="text-[13px] font-bold text-emerald-900 font-somar">
                    محاسب ومراجع قانوني • خبير ضرائب واستشارات مالية
                  </p>
                  <p className="text-[12px] font-semibold text-zinc-800 font-somar">
                    سجل المحاسبين والمراجعين بوزارة المالية رقم: {regNumber}
                  </p>
                  <p className="text-[11px] text-zinc-600 font-somar">
                    عضو جمعية المحاسبين والمراجعين المصرية (ESAA) • سجل الخبراء الضريبيين
                  </p>
                  <p className="text-[11px] text-zinc-600 font-somar">
                    {auditorStatement?.address || 'القاهرة - جمهورية مصر العربية'} {auditorStatement?.phone ? `• ت: ${auditorStatement.phone}` : ''}
                  </p>
                </div>

                {/* Left: Verification QR Code & Clean Metadata (No Text Boxes) */}
                <div className="flex items-start gap-4 text-left w-full sm:w-auto justify-between sm:justify-end shrink-0">
                  {/* Company Info - Clean text layout without box borders */}
                  <div className="text-left space-y-0.5 text-xs font-somar">
                    <div className="text-[10px] text-zinc-500 font-bold">المنشأة:</div>
                    <div className="font-bold text-zinc-950 text-[13px]">{companyProfile.name}</div>
                    <div className="text-[11px] text-zinc-600">{companyProfile.legalForm}</div>
                    {companyProfile.taxCard && (
                      <div className="text-[11px] text-zinc-600 font-mono">
                        ب.ض: {companyProfile.taxCard}
                      </div>
                    )}
                    {companyProfile.commercialRegistry && (
                      <div className="text-[11px] text-zinc-600 font-mono">
                        س.ت: {companyProfile.commercialRegistry}
                      </div>
                    )}
                    <div className="text-[11px] text-zinc-700 font-bold font-mono">
                      السنة المالية: {fiscalYear}
                    </div>
                  </div>

                  {/* Clean QR Code for Verification (No Heavy Box Border) */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-20 text-center font-somar">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="كود التحقق الرقمي"
                        className="w-18 h-18 object-contain"
                      />
                    ) : (
                      <div className="w-18 h-18 bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400">
                        كود التحقق
                      </div>
                    )}
                    <span className="text-[8.5px] font-bold text-zinc-800 mt-1">
                      التحقق الرقمي
                    </span>
                    <span className="text-[7.5px] text-zinc-500 font-mono">
                      {reportSerial.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Report Title - SOMARSANS 16px, Pure Clean Spacing, No Boxes or Dividers */}
              <div className="mt-5 mb-3 text-center">
                <h2 className="text-[16px] font-black text-zinc-950 tracking-wide font-somar doc-title-text">
                  {reportTitle}
                </h2>
                {reportSubtitle && (
                  <p className="text-[13px] font-medium text-zinc-700 mt-1 font-somar">
                    {reportSubtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Top Summary Badges / Metrics if provided - Clean text flow without nested cards */}
            {summaryCards && summaryCards.length > 0 && (
              <div className="flex flex-wrap items-center justify-around gap-4 py-2 mb-4 font-somar text-center">
                {summaryCards.map((c, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="text-[11px] text-zinc-500">{c.label}</div>
                    <div className="text-sm font-bold font-mono text-zinc-950">
                      {typeof c.value === 'number' ? (c.value ?? 0).toLocaleString() : (c.value ?? '-')}
                    </div>
                    {c.sublabel && (
                      <div className="text-[10px] text-zinc-500">{c.sublabel}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Document Dynamic Body Content - 14px Somar Sans, No text boxes, No dividers */}
            <div className="flex-1 space-y-4 text-[14px] leading-relaxed text-zinc-900 doc-body-text font-somar">
              {children}
            </div>

            {/* Legal / Basis Notice if provided - Clean text */}
            {legalNotice && (
              <div className="mt-6 text-[12px] text-zinc-700 leading-relaxed text-justify font-somar avoid-break">
                <span className="font-bold text-zinc-950">ملاحظة مهنية: </span>
                {legalNotice}
              </div>
            )}

            {/* Formal Endorsement & Approval Section - Exact User Specification:
                Only "يعتمد المحاسب القانوني" and "تحريراً في: [التاريخ]" with clean open whitespace, no text boxes, no dividers */}
            <div className="mt-8 print:mt-4 pt-4 flex flex-col sm:flex-row justify-between items-end gap-6 font-somar avoid-break print:break-inside-avoid">
              {/* Left Side: Document Serial & Integrity */}
              <div className="text-right space-y-1 text-xs text-zinc-700">
                <div className="font-bold text-zinc-950 font-somar">
                  وثيقة محاسبية رسمية معتمدة
                </div>
                <div className="font-mono text-[11px] text-zinc-600">
                  رقم السيريال: {reportSerial}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  تم الاستخراج إلكترونياً • نظام المحاسبة والمراجعة المصري
                </div>
              </div>

              {/* Right/Endorsement: Exact Requested Text and Open Space for Signature & Stamp */}
              <div className="text-center space-y-6 print:space-y-2 min-w-[220px]">
                <div className="text-[16px] font-black text-zinc-950 font-somar">
                  يعتمد المحاسب القانوني
                </div>

                {/* Clean unboxed generous whitespace for manual signature and rubber stamp */}
                <div className="h-14 print:h-8" />

                <div className="text-[13px] font-bold text-zinc-900 font-somar">
                  تحريراً في: {date}م
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
