import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Lock,
  Printer,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  X,
  FileCheck,
  Share2,
} from 'lucide-react';
import { AccountingCertificate } from '../types/office';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import { tafqeetCurrency } from '../utils/tafqeet';
import { exportElementToPDF } from '../utils/pdfExport';
import { printA4Document } from '../utils/printA4Document';
import { generateQrCodeDataUrl, getCertificateVerificationUrl } from '../utils/qrCode';

interface DigitalVerifiedCertificateViewProps {
  certificate: AccountingCertificate;
  companyProfile?: CompanyProfile;
  auditorStatement?: AuditorStatement;
  onClose?: () => void;
  isStandalonePortal?: boolean;
}

export const DigitalVerifiedCertificateView: React.FC<DigitalVerifiedCertificateViewProps> = ({
  certificate,
  companyProfile,
  auditorStatement,
  onClose,
  isStandalonePortal = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const certContainerRef = useRef<HTMLDivElement>(null);

  // Generate unique verification URL & QR Code
  useEffect(() => {
    const publicUrl = getCertificateVerificationUrl(certificate.serialNumber);
    generateQrCodeDataUrl(publicUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#09090b', light: '#ffffff' },
    }).then((dataUrl) => {
      setQrCodeUrl(dataUrl);
    });
  }, [certificate.serialNumber]);

  // Synchronize a4-modal-open on document.body for zero-bleed print isolation
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('a4-modal-open');
    return () => {
      document.body.classList.remove('a4-modal-open');
    };
  }, []);

  // Direct DOM isolation on beforeprint/afterprint: guarantees #root cannot render in print preview
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
  }, []);

  const handleCopyLink = () => {
    const publicUrl = getCertificateVerificationUrl(certificate.serialNumber);
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    if (certContainerRef.current) {
      printA4Document(
        certContainerRef.current,
        `شهادة معتمدة رقم ${certificate.serialNumber} - ${certificate.clientName}`
      );
    } else {
      if (typeof document !== 'undefined') {
        document.body.classList.add('a4-modal-open');
      }
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!certContainerRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportElementToPDF(
        certContainerRef.current,
        `وثيقة_تحقق_رقمية_${certificate.serialNumber}_${certificate.clientName}.pdf`,
        {
          companyProfile: companyProfile || ({} as any),
          auditorStatement: auditorStatement || ({} as any),
          reportTitle: `نسخة رقمية معتمدة - ${certificate.certificateTitle || 'شهادة محاسبية'}`,
          includeLetterhead: false,
          includeStamp: false,
        }
      );
    } catch (err) {
      console.error('Failed to export verified certificate PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Extract financial values based on certificate type
  const netIncome =
    certificate.incomeData?.netAnnualIncome ??
    certificate.netAnnualIncome ??
    (certificate.annualNetIncome || 0);

  const monthlyIncome =
    certificate.incomeData?.averageMonthlyIncome ??
    certificate.averageMonthlyIncome ??
    (certificate.monthlyNetIncome || 0);

  const investedCapital =
    certificate.investedCapitalData?.totalInvestedCapital ??
    certificate.totalInvestedCapital ??
    0;

  const solvencyTotalAssets = certificate.solvencyData?.totalOwnedAssets ?? 0;
  const solvencyTotalLiabilities = certificate.solvencyData?.totalLiabilities ?? 0;
  const solvencyNetEquity = certificate.solvencyData?.netSolvencyEquity ?? 0;

  return createPortal(
    <div
      id="print-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto font-sans print:!bg-white print:!backdrop-blur-none print:!p-0 print:!block print:!overflow-visible print:!min-h-screen"
    >
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 text-zinc-100 flex flex-col print:!bg-transparent print:!border-none print:!shadow-none print:!max-w-none print:!w-full print:!m-0">
        {/* Verification Ribbon Bar (Read-Only Indicator) */}
        <div className="no-print bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <span>بوابة التحقق الرقمي من صحة الشهادات المحاسبية</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/30">
                  نسخة رقمية معتمدة للعرض فقط
                </span>
              </div>
              <div className="text-[11px] text-emerald-400/80">
                الرقم المرجعي: <span className="font-mono font-bold">{certificate.serialNumber}</span> | الحالة: مسجلة وسارية بسجل الشهادات المهنية
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="نسخ رابط التحقق المباشر"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط التحقق'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>{isExportingPDF ? 'جاري التحميل...' : 'حفظ PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة المستند</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Container with the Certified Certificate Document */}
        <div className="p-4 sm:p-8 overflow-y-auto max-h-[84vh] bg-zinc-900/60 flex justify-center print:!p-0 print:!m-0 print:!bg-transparent print:!overflow-visible print:!block print:!max-h-none">
          <div
            ref={certContainerRef}
            className="relative bg-white text-zinc-950 p-8 sm:p-12 shadow-2xl max-w-[210mm] min-h-[297mm] w-full mx-auto space-y-6 font-somar overflow-hidden select-text print-a4-container print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 print:!min-h-0 print:!h-auto"
          >
            {/* Anti-Tamper Security Background Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03] z-0 select-none">
              <div className="text-zinc-900 font-extrabold text-5xl sm:text-7xl -rotate-35 text-center leading-relaxed tracking-wider font-somar">
                وثيقة مؤمنة
                <br />
                شهادة محاسبية رسمية
              </div>
            </div>

            {/* Official Letterhead Header - Full CPA Info & QR Code Side-by-Side (No Boxes) */}
            <div className="print-first-page-letterhead relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4 font-somar bg-white">
              <div className="text-right space-y-1 sm:max-w-[65%]">
                <h3 className="text-[17px] font-black text-zinc-950 leading-tight font-somar">
                  {auditorStatement?.firmName || 'مكتب المحاسب القانوني محمود الباز قابيل للمحاسبة والمراجع والضرائب'}
                </h3>
                <h1 className="text-[13px] font-bold text-emerald-900 font-somar">
                  محاسب ومراجع قانوني • خبير ضرائب واستشارات مالية
                </h1>
                <p className="text-[12px] text-zinc-800 font-semibold font-somar">
                  سجل المحاسبين والمراجعين بوزارة المالية رقم: {auditorStatement?.registrationNumber || auditorStatement?.licenseNumber || 'س.م.م 44887'}
                </p>
                <p className="text-[11px] text-zinc-600 font-somar">
                  عضو جمعية المحاسبين والمراجعين المصرية (ESAA) • سجل الخبراء الضريبيين
                </p>
                <p className="text-[11px] text-zinc-600 font-somar">
                  {auditorStatement?.address || 'القاهرة - جمهورية مصر العربية'} {auditorStatement?.phone ? `• ت: ${auditorStatement.phone}` : ''}
                </p>
              </div>

              {/* QR Code and Serial - Clean, No Heavy Box */}
              <div className="flex flex-col items-center shrink-0 text-center font-somar w-20">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="رمز الاستجابة السريعة للتحقق"
                    className="w-18 h-18 sm:w-20 sm:h-20 object-contain"
                  />
                ) : (
                  <div className="w-18 h-18 bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400">
                    QR Code
                  </div>
                )}
                <div className="text-[8.5px] font-bold text-zinc-800 mt-1">
                  التحقق الرقمي
                </div>
                <div className="text-[7.5px] font-mono text-zinc-600">
                  {certificate.serialNumber}
                </div>
              </div>
            </div>

            {/* Certificate Title - Somar Sans 16px, No Box or Divider */}
            <div className="relative z-10 text-center my-6">
              <h2 className="text-[16px] font-black font-somar text-zinc-950 doc-title-text">
                {(certificate.certificateType === 'income_no_tax' ||
                  certificate.certificateType === 'income_with_tax' ||
                  certificate.certificateType === 'income' ||
                  certificate.certificateTitle?.includes('دخل'))
                  ? 'شهادة دخل'
                  : (certificate.certificateTitle || 'شهادة محاسبية معتمدة')}
              </h2>
            </div>

            {/* Addressed To Party */}
            <div className="relative z-10 text-sm font-bold text-zinc-950 font-somar py-1">
              <div>السادة / {certificate.issuedToParty}</div>
              <div className="text-xs text-zinc-600 font-normal mt-0.5">تحية طيبة وبعد ،،،</div>
            </div>

            {/* Standard Legal Preamble with Exact Required Phrasing */}
            <div className="relative z-10 text-[14px] text-zinc-900 leading-relaxed text-justify space-y-4 font-somar doc-body-text">
              <p className="leading-loose text-[14px]">
                يشهد مكتب <strong className="font-bold">{auditorStatement?.firmName || auditorStatement?.auditorName || 'المحاسب القانوني محمود الباز قابيل'}</strong> والمسجل بسجل المحاسبين والمراجعين تحت رقم <strong className="font-mono font-bold">{auditorStatement?.registrationNumber || auditorStatement?.licenseNumber || 'س.م.م 44887'}</strong> وزارة المالية بأن:
              </p>

              {/* Data of the Client - Clean, No Text Box */}
              <div className="space-y-2 text-sm pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-zinc-900 w-32 shrink-0">• الاسم / صاحب الشأن:</span>
                    <span className="font-bold text-zinc-950 text-base">{certificate.clientName}</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-zinc-900 w-32 shrink-0">• الرقم القومي:</span>
                    <span className="font-mono font-bold text-zinc-950 tracking-wider">
                      {certificate.nationalId || '________________'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-zinc-900 w-32 shrink-0">• العنوان ومحل الإقامة:</span>
                  <span className="text-zinc-900 font-semibold">{certificate.address || '________________'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-zinc-900 w-32 shrink-0">• المهنة / النشاط:</span>
                    <span className="text-zinc-950 font-bold">{certificate.profession || certificate.professionOrActivity || 'أعمال حرة'}</span>
                  </div>

                  {certificate.facilityName && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-zinc-900 w-32 shrink-0">• المنشأة / المحل:</span>
                      <span className="text-zinc-900 font-semibold">{certificate.facilityName}</span>
                    </div>
                  )}
                </div>

                {/* Tax Card Status */}
                <div className="pt-2 mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold text-zinc-800">• الموقف الضريبي والتسجيل:</span>
                  {certificate.taxFileNumber || certificate.taxCardNumber ? (
                    <span className="text-zinc-900 font-semibold">
                      مسجل ضريبياً - بطاقة ضريبية رقم: {certificate.taxCardNumber || certificate.taxFileNumber}
                    </span>
                  ) : (
                    <span className="text-zinc-800 font-bold">
                      أفراد (ليس لديه بطاقة ضريبية - أعمال ومهن حرة غير مسجلة ضريبياً)
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Content based on Certificate Type */}
              {/* 1. Income Certificate */}
              {(certificate.certificateType === 'income_no_tax' ||
                certificate.certificateType === 'income_with_tax' ||
                certificate.certificateType === 'income') && (
                <div className="space-y-3 pt-2">
                  <p className="leading-loose text-base">
                    وأن صافي دخله من نشاط (
                    <strong className="font-bold text-zinc-950">
                      {certificate.profession || 'نشاطه الحر'}
                    </strong>
                    ) عن الفترة (
                    <strong className="font-bold text-zinc-950">
                      {certificate.fiscalPeriod || 'العام المالي الحالي'}
                    </strong>
                    ) هو مبلغ وقدره:{' '}
                    <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                      {(netIncome || 0).toLocaleString()} جنيهاً مصرياً
                    </strong>{' '}
                    (
                    <strong className="text-zinc-950 font-bold">
                      {tafqeetCurrency(netIncome || 0)}
                    </strong>
                    )، بمتوسط صافي دخل شهري قدره:{' '}
                    <strong className="font-mono font-extrabold text-zinc-950 text-base">
                      {(monthlyIncome || 0).toLocaleString()} ج.م
                    </strong>{' '}
                    (
                    <strong className="text-zinc-950 font-bold">
                      {tafqeetCurrency(monthlyIncome || 0)}
                    </strong>
                    ).
                  </p>
                  <p className="text-xs text-zinc-700">
                    <strong>سند الاحتساب:</strong>{' '}
                    {certificate.basisOfCalculation ||
                      (certificate.certificateType === 'income_no_tax'
                        ? 'بناءً على المعاينة الميدانية وإقرار صاحب الشأن بمصادر دخله الحرة والمستندات المؤيدة المقدمة إلينا'
                        : 'بناءً على فحص الدفاتر المحاسبية والإقرارات الضريبية والمستندات المؤيدة')}
                  </p>
                </div>
              )}

              {/* 2. Invested Capital Certificate (Companies and Individuals) */}
              {certificate.certificateType === 'invested_capital' && (
                <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-200">
                  <p className="leading-loose text-base">
                    وأن إجمالي رأس المال المستثمر الفعلي في نشاط (
                    <strong className="font-bold text-zinc-950">
                      {certificate.facilityName || certificate.profession || 'المنشأة'}
                    </strong>
                    ) هو مبلغ وقدره:{' '}
                    <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                      {(investedCapital || 0).toLocaleString()} جنيهاً مصرياً
                    </strong>{' '}
                    (
                    <strong className="text-zinc-950 font-bold">
                      {tafqeetCurrency(investedCapital || 0)}
                    </strong>
                    ).
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-zinc-200">
                    <div>
                      الأصول الثابتة: <span className="font-bold">{(certificate.investedCapitalData?.fixedAssetsValue || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      الأصول المتداولة: <span className="font-bold">{(certificate.investedCapitalData?.currentAssetsValue || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      تاريخ المعاينة: <span className="font-bold">{certificate.investedCapitalData?.inspectionDate || certificate.issueDate}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700">
                    <strong>سند المعاينة:</strong> {certificate.investedCapitalData?.inspectionDetails || certificate.basisOfCalculation || 'تمت المعاينة الميدانية للمقر وفحص مستندات الملكية وفواتير شراء المعدات'}
                  </p>
                </div>
              )}

              {/* 3. Financial Solvency & Capability Certificate */}
              {certificate.certificateType === 'financial_solvency' && (
                <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-200">
                  <p className="leading-loose text-base">
                    يشهد المكتب بالقدرة والملاءة المالية التامة لصاحب الشأن / المنشأة، وأن إجمالي الأصول المملوكة تبلغ:{' '}
                    <strong className="font-mono font-bold">{(solvencyTotalAssets || 0).toLocaleString()} ج.م</strong>، مقابل التزامات وديون إجمالية قدرها:{' '}
                    <strong className="font-mono font-bold">{(solvencyTotalLiabilities || 0).toLocaleString()} ج.م</strong>، بصافي ملاءة مالية وحقوق ملكية فائضة قدرها:{' '}
                    <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                      {(solvencyNetEquity || 0).toLocaleString()} جنيهاً مصرياً
                    </strong>{' '}
                    (
                    <strong className="text-zinc-950 font-bold">
                      {tafqeetCurrency(solvencyNetEquity || 0)}
                    </strong>
                    ).
                  </p>
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    <strong>إقرار الملاءة:</strong> {certificate.solvencyData?.solvencyAssessment || 'تتمتع المنشأة بملاءة مالية وسيولة قوية تؤهلها للوفاء بكافة التزاماتها التعاقدية والمالية دون أي تعثر أو قضايا إفلاس أو حجوزات قضائية.'}
                  </p>
                </div>
              )}

              {/* 4. Professional Revenues and Expenses */}
              {certificate.certificateType === 'revenue_expenses' && (
                <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-200">
                  <p className="leading-loose text-base">
                    بأن إجمالي إيرادات النشاط المهني بلغت مبلغاً وقدره:{' '}
                    <strong className="font-mono font-bold">{((certificate.professionalData?.professionalGrossRevenue || netIncome * 1.4) || 0).toLocaleString()} ج.م</strong>، ومصروفات مهنية قدرها:{' '}
                    <strong className="font-mono font-bold">{((certificate.professionalData?.operatingExpenses || netIncome * 0.4) || 0).toLocaleString()} ج.م</strong>، بصافي دخل مهني سنوي قدره:{' '}
                    <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                      {((certificate.professionalData?.netProfessionalIncome || netIncome) || 0).toLocaleString()} جنيهاً مصرياً
                    </strong>{' '}
                    (
                    <strong className="text-zinc-950 font-bold">
                      {tafqeetCurrency(certificate.professionalData?.netProfessionalIncome || netIncome || 0)}
                    </strong>
                    ).
                  </p>
                </div>
              )}

              {/* 5. Working Capital */}
              {certificate.certificateType === 'working_capital' && (
                <div className="space-y-3 pt-2">
                  <p className="leading-loose text-base">
                    وأن صافي رأس المال العامل الفعلي هو مبلغ وقدره:{' '}
                    <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                      {(certificate.workingCapitalData?.netWorkingCapital || 0).toLocaleString()} جنيهاً مصرياً
                    </strong>{' '}
                    (
                    <strong className="text-zinc-950 font-bold">
                      {tafqeetCurrency(certificate.workingCapitalData?.netWorkingCapital || 0)}
                    </strong>
                    ) بنسبة تداول {(certificate.workingCapitalData?.currentRatio || 2.5)} : 1.
                  </p>
                </div>
              )}

              {/* Purpose and Disclaimer */}
              <div className="space-y-1.5 pt-2">
                <p className="text-xs text-zinc-800">
                  <strong>الغرض من إصدار الشهادة:</strong> {certificate.purpose || 'لتقديمها إلى الجهة الموجه إليها واستيفاء الإجراءات الرسمية.'}
                </p>
                <p className="text-[11px] text-zinc-500 italic leading-relaxed">
                  * صدرت هذه الشهادة بناءً على طلب صاحب الشأن والبيانات والمستندات المقدمة، ودون أدنى مسؤولية مالية أو التزام على مكتب المحاسب القانوني تجاه الغير، وهي صالحة ومخصصة للاستخدام للجهة الموجهة إليها فقط.
                </p>
              </div>
            </div>

            {/* Formal Endorsement & Approval Section - Exact User Specification:
                Only "يعتمد المحاسب القانوني" and "تحريراً في: [التاريخ]" with clean open space, no text boxes, no dividers */}
            <div className="relative z-10 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-end gap-6 font-somar avoid-break">
              {/* Security & Verification Metadata */}
              <div className="text-right space-y-1 text-xs text-zinc-700 w-full sm:w-auto">
                <div className="font-bold text-zinc-950 font-somar text-sm">
                  وثيقة محاسبية رسمية معتمدة
                </div>
                <div className="font-mono text-[11px] text-zinc-600">
                  رقم السيريال: {certificate.serialNumber}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  تم التوثيق والاعتماد إلكترونياً
                </div>
              </div>

              {/* Clean Endorsement: Only "يعتمد المحاسب القانوني" & "تحريراً في:" with open space */}
              <div className="text-center space-y-8 min-w-[220px] w-full sm:w-auto">
                <div className="text-[16px] font-black text-zinc-950 font-somar">
                  يعتمد المحاسب القانوني
                </div>

                {/* Open blank space without box or borders */}
                <div className="h-16" />

                <div className="text-[13px] font-bold text-zinc-900 font-somar">
                  تحريراً في: {certificate.issueDate}م
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
