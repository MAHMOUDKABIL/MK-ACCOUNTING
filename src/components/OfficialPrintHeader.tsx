import {
  Award,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  MapPin,
  Phone,
  Printer,
  Scale,
  ShieldCheck,
  Stamp,
  UserCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import { generateQrCodeDataUrl, getReportVerificationUrl } from '../utils/qrCode';

interface OfficialPrintHeaderProps {
  companyProfile?: CompanyProfile;
  auditorStatement?: AuditorStatement;
  reportTitle: string;
  reportSubtitle?: string;
  fiscalYear?: string;
  date?: string;
  reportSerial?: string;
  isCompact?: boolean;
}

export const OfficialPrintHeader: React.FC<OfficialPrintHeaderProps> = ({
  companyProfile,
  auditorStatement,
  reportTitle,
  reportSubtitle,
  fiscalYear = '2026',
  date = new Date().toLocaleDateString('ar-EG'),
  reportSerial = 'REP-2026-OFFICIAL',
  isCompact = false,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const firmName =
    auditorStatement?.firmName ||
    'مكتب المحاسب القانوني محمود الباز قابيل للمحاسبة والمراجعة والضرائب';
  const regNumber =
    auditorStatement?.registerNumber ||
    auditorStatement?.registrationNumber ||
    'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية';

  useEffect(() => {
    let isMounted = true;
    const fetchQr = async () => {
      const verifyUrl = getReportVerificationUrl(reportSerial, reportTitle);
      const url = await generateQrCodeDataUrl(verifyUrl, { width: 140, margin: 1 });
      if (isMounted) {
        setQrCodeDataUrl(url);
      }
    };
    fetchQr();
    return () => {
      isMounted = false;
    };
  }, [reportSerial, reportTitle]);

  return (
    <div className="official-print-header border-b-2 border-zinc-900 pb-4 mb-5 font-somar text-zinc-950">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Right Section: Auditor Office Info */}
        <div className="space-y-1 sm:max-w-[55%]">
          <h2 className="text-[17px] font-black text-zinc-950 leading-tight font-cairo">
            {firmName}
          </h2>
          <p className="text-[13px] font-bold text-emerald-800">
            محاسب ومراجع قانوني • خبير ضرائب واستشارات مالية
          </p>
          <div className="text-[12px] text-zinc-700 font-mono font-semibold">
            {regNumber}
          </div>
          <p className="text-[11px] text-zinc-600">
            {auditorStatement?.address || 'القاهرة - جمهورية مصر العربية'} {auditorStatement?.phone ? `• ت: ${auditorStatement.phone}` : ''}
          </p>
        </div>

        {/* Center / Left Section: Company Under Audit + QR Code */}
        <div className="flex items-start gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-left min-w-[180px] text-xs">
            <div className="text-zinc-500 text-[10px] font-bold">المنشأة الخاضعة للمراجعة والاعتماد:</div>
            <div className="font-extrabold text-zinc-950 text-sm mt-0.5">
              {companyProfile?.name || 'الشركة المصرية للتجارة والصناعة'}
            </div>
            <div className="text-[11px] text-zinc-600 font-mono mt-0.5 space-y-0.5">
              {companyProfile?.taxCard && <div>ب.ض: {companyProfile.taxCard}</div>}
              {companyProfile?.commercialRegistry && <div>س.ت: {companyProfile.commercialRegistry}</div>}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
              السنة المالية: {fiscalYear}
            </div>
          </div>

          {/* QR Code Box */}
          <div className="flex flex-col items-center justify-center p-1.5 bg-zinc-50 border border-zinc-300 rounded-lg shadow-2xs shrink-0 w-[88px] text-center">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="كود التحقق الرقمي"
                className="w-14 h-14 object-contain"
              />
            ) : (
              <div className="w-14 h-14 bg-zinc-200 animate-pulse rounded flex items-center justify-center text-[8px] text-zinc-400">
                QR
              </div>
            )}
            <span className="text-[8px] font-bold text-zinc-800 mt-0.5">
              التحقق الرقمي
            </span>
          </div>
        </div>
      </div>

      {/* Title & Document Banner - size 16 */}
      <div className="mt-4 pt-2.5 border-t border-zinc-200 text-center bg-zinc-100 py-2 px-4 rounded-xs border-y">
        <h2 className="text-[16px] font-black text-zinc-950 tracking-wide font-cairo doc-title-text">
          {reportTitle}
        </h2>
        {reportSubtitle && (
          <p className="text-[12px] text-zinc-700 font-semibold mt-0.5">{reportSubtitle}</p>
        )}
      </div>
    </div>
  );
};

interface OfficialPrintFooterProps {
  auditorStatement?: AuditorStatement;
  companyProfile?: CompanyProfile;
  date?: string;
  notes?: string;
  reportSerial?: string;
}

export const OfficialPrintFooter: React.FC<OfficialPrintFooterProps> = ({
  auditorStatement,
  companyProfile,
  date = new Date().toLocaleDateString('ar-EG'),
  notes = 'تم الفحص والمراجعة والاعتماد وفقاً لمعايير المحاسبة المصرية (EAS) وقانون الشركات 159 لسنة 1981.',
  reportSerial = 'REP-2026-SECURED',
}) => {
  const auditorName = auditorStatement?.auditorName || 'محمود الباز قابيل';
  const regNumber =
    auditorStatement?.registerNumber ||
    auditorStatement?.registrationNumber ||
    'س.م.م 44887';

  return (
    <div className="official-print-footer mt-8 pt-5 border-t-2 border-zinc-900 font-somar text-zinc-950">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
        {/* Verification Text */}
        <div className="text-xs space-y-2 text-zinc-600">
          <div className="flex items-center gap-1.5 font-bold text-zinc-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>شهادة مطابقة واعتماد مراقب الحسابات المستقل:</span>
          </div>
          <p className="leading-relaxed text-justify text-[12px] text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 doc-body-text">
            {notes}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black rounded text-[11px] border border-emerald-300">
              وثيقة مؤمنة
            </span>
            <span className="font-bold text-zinc-800 font-mono text-[11px]">
              رقم السيريال: {reportSerial}
            </span>
          </div>
        </div>

        {/* Official Endorsement: "ويعتمد ،،،" + "المحاسب القانوني" + clean blank spaces */}
        <div className="border border-zinc-300 bg-zinc-50/60 rounded-xl p-3.5 text-center space-y-2.5 shadow-xs">
          <div className="text-[15px] font-black text-zinc-950 font-cairo">
            ويعتمد ،،،
          </div>
          <div className="text-[13px] font-bold text-zinc-900">
            المحاسب القانوني
          </div>
          <div className="text-[11px] font-mono font-bold text-emerald-800">
            {regNumber}
          </div>

          {/* Clean Hand-Sign and Stamp Areas */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-[10px] text-zinc-600">
            <div className="h-16 border border-dashed border-zinc-400 rounded-lg flex flex-col items-center justify-center bg-white p-1">
              <span className="text-[10px] font-bold text-zinc-600">(مكان التوقيع اليدوي)</span>
              <span className="text-[8px] text-zinc-400 mt-0.5">توقيع معتمد</span>
            </div>
            <div className="h-16 border border-dashed border-zinc-400 rounded-lg flex flex-col items-center justify-center bg-white p-1">
              <span className="text-[10px] font-bold text-zinc-600">(مكان الخاتم الرسمي)</span>
              <span className="text-[8px] text-zinc-400 mt-0.5">خاتم المكتب</span>
            </div>
          </div>

          <div className="text-[10px] text-zinc-600 pt-0.5">
            تحريراً في: {date}م
          </div>
        </div>
      </div>
    </div>
  );
};
