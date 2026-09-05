import {
  Award,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  Scale,
  ShieldCheck,
  Stamp,
  UserCheck,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import { exportElementToPDF } from '../utils/pdfExport';
import { A4ReportViewerModal } from './A4ReportViewerModal';

interface AuditorReportViewProps {
  auditorStatement: AuditorStatement;
  companyProfile: CompanyProfile;
  financialData: any;
  onUpdateAuditorStatement: (statement: AuditorStatement) => void;
}

export const AuditorReportView: React.FC<AuditorReportViewProps> = ({
  auditorStatement,
  companyProfile,
  financialData,
  onUpdateAuditorStatement,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [formData, setFormData] = useState<AuditorStatement>(auditorStatement);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAuditorStatement(formData);
    setIsEditing(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportElementToPDF(
        reportRef.current,
        `تقرير_مراقب_الحسابات_${companyProfile.name || 'الشركة'}_2026.pdf`,
        {
          companyProfile,
          auditorStatement,
          reportTitle: 'تقرير مراقب الحسابات المستقل',
          includeLetterhead: true,
          includeStamp: true,
        }
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-somar">
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-somar flex items-center gap-2">
              تقرير مراقب الحسابات المستقل
            </h2>
            <p className="text-xs text-slate-400">
              تقرير مراقب الحسابات وفقاً لمعايير المراجعة المصرية وقانون الشركات 159 لسنة 1981
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة تقرير المراجعة A4</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>{isEditing ? 'إلغاء التعديل' : 'تخصيص نصوص التقرير والرأي'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-700/20 disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPDF ? 'جاري تصدير PDF...' : 'تصدير PDF'}</span>
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة A4</span>
          </button>
        </div>
      </div>

      {/* Edit Form Drawer / Card */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs no-print shadow-xl"
        >
          <h3 className="font-bold text-white text-sm font-somar border-b border-slate-800 pb-3 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>تعديل بيانات ورأي مراقب الحسابات</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">اسم المحاسب والمراجع القانوني</label>
              <input
                type="text"
                required
                value={formData.auditorName}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم القيد بسجل المحاسبين والمراجعين (س.م.م)</label>
              <input
                type="text"
                required
                value={formData.registerNumber}
                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">نوع الرأي المهني للمراجع</label>
              <select
                value={formData.opinionType}
                onChange={(e) => setFormData({ ...formData, opinionType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="unqualified">رأي غير متحفظ (نظيف - Unqualified Clean Opinion)</option>
                <option value="qualified">رأي متحفظ (Qualified Opinion)</option>
                <option value="adverse">رأي عكسي / سلبي (Adverse Opinion)</option>
                <option value="disclaimer">امتناع عن إبداء الرأي (Disclaimer)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">فقرة الرأي المهني (Opinion Paragraph)</label>
            <textarea
              rows={3}
              value={formData.opinionParagraph}
              onChange={(e) => setFormData({ ...formData, opinionParagraph: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">تقرير عن المتطلبات القانونية والتنظيمية الأخرى</label>
            <textarea
              rows={3}
              value={formData.legalRequirementsParagraph}
              onChange={(e) => setFormData({ ...formData, legalRequirementsParagraph: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl cursor-pointer font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              حفظ التقرير
            </button>
          </div>
        </form>
      )}

      {/* Official Report Presentation Sheet */}
      <div
        ref={reportRef}
        id="auditor-report-print-sheet"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-xl space-y-6 max-w-4xl mx-auto text-slate-100"
      >
        {/* Auditor Official Letterhead */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          <div>
            <div className="text-xl font-black text-white font-somar flex items-center justify-center md:justify-start gap-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <span>{auditorStatement.firmName || 'مكتب المحاسب القانوني والمراجع'}</span>
            </div>
            <div className="text-lg font-black text-emerald-400 font-somar mt-0.5">
              {auditorStatement.auditorName}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">
              عضو جمعية المحاسبين والمراجعين المصرية | {auditorStatement.registerNumber}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 text-center md:text-left shadow-md">
            <div><strong>تاريخ التقرير:</strong> {auditorStatement.reportDate}</div>
            <div><strong>السنة المالية المنتهية:</strong> 31 ديسمبر 2026</div>
            <div className="text-emerald-400 font-bold">معتمد رسمياً للجهات الحكومية والضرائب</div>
          </div>
        </div>

        {/* Addressee */}
        <div className="space-y-1 text-xs">
          <div className="text-base font-black text-white font-somar">
            إلى السادة / مساهمي وشركاء شركة {companyProfile.name}
          </div>
          <div className="text-slate-400 font-medium">
            تقرير مراقب الحسابات المستقل عن القوائم المالية للسنة المالية المنتهية في 31 ديسمبر 2026
          </div>
        </div>

        {/* 1. Opinion Section */}
        <div className="space-y-2 text-xs bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 font-somar">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>أولاً: الرأي المهني (Opinion)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-justify whitespace-pre-line">
            {auditorStatement.opinionParagraph ||
              auditorStatement.opinionText ||
              'القوائم المالية تعبر بوضوح وعدالة عن المركز المالي للشركة ونتائج أعمالها وتدفقاتها النقدية وفقاً لمعايير المحاسبة المصرية.'}
          </p>
        </div>

        {/* 2. Basis for Opinion */}
        <div className="space-y-2 text-xs bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 font-somar">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>ثانياً: أساس الرأي (Basis for Opinion)</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-justify whitespace-pre-line">
            {auditorStatement.basisForOpinion ||
              auditorStatement.basisOfOpinion ||
              'تمت مراجعتنا وفقاً لمعايير المراجعة المصرية والقوانين السارية، ونحن مستقلون عن المنشأة وفقاً لقواعد سلوك المهنة.'}
          </p>
        </div>

        {/* 3. Key Audit Matters & Management Responsibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            <div className="font-bold text-white text-xs flex items-center gap-1.5 font-somar">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>مسؤولية الإدارة عن القوائم المالية</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-justify whitespace-pre-line">
              {auditorStatement.managementResponsibility ||
                auditorStatement.managementResponsibilities ||
                'تتحمل الإدارة مسؤولية إعداد وعرض القوائم المالية عرضاً عادلاً وفقاً لمعايير المحاسبة المصرية.'}
            </p>
          </div>

          <div className="space-y-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            <div className="font-bold text-white text-xs flex items-center gap-1.5 font-somar">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>مسؤولية مراقب الحسابات عن المراجعة</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-justify whitespace-pre-line">
              {auditorStatement.auditorResponsibility ||
                auditorStatement.auditorResponsibilities ||
                'الحصول على تأكيد معقول حول خلو القوائم المالية من التحريفات الجوهرية وإصدار تقرير الرأي المهني.'}
            </p>
          </div>
        </div>

        {/* 4. Legal & Regulatory Requirements */}
        <div className="space-y-2 text-xs bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 font-somar">
            <Stamp className="w-4 h-4 text-emerald-400" />
            <span>ثالثاً: تقرير عن المتطلبات القانونية والتنظيمية الأخرى (قانون 159 لسنة 1981)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-justify whitespace-pre-line">
            {auditorStatement.legalRequirementsParagraph ||
              auditorStatement.otherLegalRequirements ||
              'تمسك الشركة حسابات ودفاتر وسجلات مالية منتظمة تتفق مع القوانين المصرية المعمول بها.'}
          </p>
        </div>

        {/* Signature & Official Seal */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-1 text-center md:text-right">
            <div className="text-slate-400">القاهرة في {auditorStatement.reportDate}</div>
            <div className="text-white font-bold font-somar">جمهورية مصر العربية</div>
          </div>

          {/* Official Stamp & Signature Box (Clean Official Hand-Sign & Stamp Area) */}
          <div className="border border-slate-700 bg-slate-900/80 p-5 rounded-2xl text-center space-y-2 min-w-64 shadow-md">
            <div className="text-xs font-black text-emerald-400 tracking-wider uppercase">
              يعتمد مراقب الحسابات والمحاسب القانوني
            </div>

            <div className="font-black text-white text-sm font-somar">{auditorStatement.auditorName}</div>
            <div className="text-[11px] text-emerald-400 font-mono font-bold">
              {auditorStatement.registerNumber}
            </div>

            <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-dashed border-slate-700 text-[10px] text-slate-300">
              <div className="p-2 border border-slate-800 rounded-lg bg-slate-950">
                <div>(مكان التوقيع اليدوي)</div>
                <div className="mt-1 text-[9px] text-slate-500">توقيع المراجع</div>
              </div>
              <div className="p-2 border border-slate-800 rounded-lg bg-slate-950">
                <div>(مكان الخاتم الرسمي)</div>
                <div className="mt-1 text-[9px] text-slate-500">خاتم المكتب</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              محاسب ومراجع قانوني - زميل جمعية المحاسبين والمراجعين المصرية
            </div>
          </div>
        </div>
      </div>

      {/* Full A4 Print / Preview Modal */}
      <A4ReportViewerModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        reportTitle="تقرير مراقب الحسابات المستقل السنوي"
        reportSubtitle={`عن القوائم المالية للسنة المالية المنتهية في 31 ديسمبر 2026`}
        reportCode="AUD-REP-2026"
        fiscalYear="2026"
        date={auditorStatement.reportDate || new Date().toLocaleDateString('ar-EG')}
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
        legalNotice="تم إعداد هذا التقرير والتأكيدات المهنية طبقاً لمعايير المراجعة المصرية الصادرة بالقرار الوزاري رقم 166 لسنة 2019 وقانون الشركات رقم 159 لسنة 1981."
      >
        <div className="space-y-5 text-sm font-somar">
          {/* Addressee */}
          <div className="font-bold text-zinc-950 text-base">
            إلى السادة / مساهمي وشركاء {companyProfile.name}
          </div>

          {/* 1. Opinion */}
          <div className="space-y-1.5">
            <h4 className="font-black text-zinc-950 text-base font-somar">
              أولاً: الرأي المهني (Opinion)
            </h4>
            <p className="text-zinc-800 leading-relaxed text-justify whitespace-pre-line text-sm">
              {auditorStatement.opinionParagraph ||
                auditorStatement.opinionText ||
                'القوائم المالية تعبر بوضوح وعدالة عن المركز المالي للشركة ونتائج أعمالها وتدفقاتها النقدية وفقاً لمعايير المحاسبة المصرية.'}
            </p>
          </div>

          {/* 2. Basis for Opinion */}
          <div className="space-y-1.5">
            <h4 className="font-black text-zinc-950 text-base font-somar">
              ثانياً: أساس الرأي (Basis for Opinion)
            </h4>
            <p className="text-zinc-700 leading-relaxed text-justify whitespace-pre-line text-sm">
              {auditorStatement.basisForOpinion ||
                auditorStatement.basisOfOpinion ||
                'تمت مراجعتنا وفقاً لمعايير المراجعة المصرية والقوانين السارية، ونحن مستقلون عن المنشأة وفقاً لقواعد سلوك المهنة.'}
            </p>
          </div>

          {/* 3. Responsibilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h5 className="font-bold text-zinc-900 text-sm font-somar">مسؤولية الإدارة عن القوائم المالية</h5>
              <p className="text-xs text-zinc-700 leading-relaxed text-justify">
                {auditorStatement.managementResponsibility ||
                  auditorStatement.managementResponsibilities ||
                  'تتحمل الإدارة مسؤولية إعداد وعرض القوائم المالية عرضاً عادلاً وفقاً لمعايير المحاسبة المصرية.'}
              </p>
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-zinc-900 text-sm font-somar">مسؤولية مراقب الحسابات عن المراجعة</h5>
              <p className="text-xs text-zinc-700 leading-relaxed text-justify">
                {auditorStatement.auditorResponsibility ||
                  auditorStatement.auditorResponsibilities ||
                  'الحصول على تأكيد معقول حول خلو القوائم المالية من التحريفات الجوهرية وإصدار تقرير الرأي المهني.'}
              </p>
            </div>
          </div>

          {/* 4. Legal requirements */}
          <div className="space-y-1.5">
            <h4 className="font-black text-zinc-950 text-base font-somar">
              ثالثاً: تقرير عن المتطلبات القانونية والتنظيمية الأخرى
            </h4>
            <p className="text-zinc-800 leading-relaxed text-justify whitespace-pre-line text-sm">
              {auditorStatement.legalRequirementsParagraph ||
                auditorStatement.otherLegalRequirements ||
                'تمسك الشركة حسابات ودفاتر وسجلات مالية منتظمة تتفق مع القوانين المصرية المعمول بها وتتضمن كل ما نص القانون ونظام الشركة على وجوب إثباته فيها.'}
            </p>
          </div>
        </div>
      </A4ReportViewerModal>
    </div>
  );
};
