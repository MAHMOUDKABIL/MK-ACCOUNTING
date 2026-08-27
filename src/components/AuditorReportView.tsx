import {
  Award,
  CheckCircle2,
  Download,
  Edit3,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  Scale,
  ShieldCheck,
  Stamp,
  UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { AuditorStatement, CompanyProfile } from '../types/accounting';

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
  const [formData, setFormData] = useState<AuditorStatement>(auditorStatement);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAuditorStatement(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            تقرير مراقب الحسابات المستقل (Independent Auditor's Report)
          </h2>
          <p className="text-xs text-slate-500">
            معد وفقاً لمعايير المراجعة المصرية، القانون 159 لسنة 1981، والقانون 91 لسنة 2005
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-sky-600" />
            <span>{isEditing ? 'إلغاء التعديل' : 'تخصيص نصوص التقرير والرأي'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير الرسمي A4</span>
          </button>
        </div>
      </div>

      {/* Edit Form Drawer / Card */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-xs no-print shadow-sm animate-in fade-in duration-150"
        >
          <h3 className="font-bold text-slate-900 text-sm font-cairo border-b border-slate-100 pb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-sky-600" />
            تعديل بيانات ورأي مراقب الحسابات
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">اسم المحاسب والمراجع القانوني</label>
              <input
                type="text"
                required
                value={formData.auditorName}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">رقم القيد بسجل المحاسبين والمراجعين (س.م.م)</label>
              <input
                type="text"
                required
                value={formData.registerNumber}
                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">نوع الرأي المهني للمراجع</label>
              <select
                value={formData.opinionType}
                onChange={(e) => setFormData({ ...formData, opinionType: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
              >
                <option value="unqualified">رأي غير متحفظ (نظيف - Unqualified Clean Opinion)</option>
                <option value="qualified">رأي متحفظ (Qualified Opinion)</option>
                <option value="adverse">رأي عكسي / سلبي (Adverse Opinion)</option>
                <option value="disclaimer">امتناع عن إبداء الرأي (Disclaimer)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">فقرة الرأي المهني (Opinion Paragraph)</label>
            <textarea
              rows={3}
              value={formData.opinionParagraph}
              onChange={(e) => setFormData({ ...formData, opinionParagraph: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">تقرير عن المتطلبات القانونية والتنظيمية الأخرى</label>
            <textarea
              rows={3}
              value={formData.legalRequirementsParagraph}
              onChange={(e) => setFormData({ ...formData, legalRequirementsParagraph: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
            >
              حفظ التقرير
            </button>
          </div>
        </form>
      )}

      {/* Official Report Presentation Sheet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-xs space-y-6 max-w-4xl mx-auto">
        {/* Auditor Official Letterhead */}
        <div className="border-b-2 border-slate-200 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          <div>
            <div className="text-xl font-black text-slate-900 font-cairo flex items-center justify-center md:justify-start gap-2">
              <Award className="w-6 h-6 text-sky-600" />
              مكتب المحاسب القانوني والمراجع
            </div>
            <div className="text-lg font-extrabold text-sky-700 font-cairo">
              {auditorStatement.auditorName}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              عضو جمعية المحاسبين والمراجعين المصرية | {auditorStatement.registerNumber}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-0.5 text-center md:text-left shadow-2xs">
            <div><strong>تاريخ التقرير:</strong> {auditorStatement.reportDate}</div>
            <div><strong>السنة المالية المنتهية:</strong> 31 ديسمبر 2026</div>
            <div className="text-sky-700 font-bold">معتمد رسمياً للجهات الحكومية والضرائب</div>
          </div>
        </div>

        {/* Addressee */}
        <div className="space-y-1 text-xs">
          <div className="text-sm font-black text-slate-900">إلى السادة / مساهمي وشركاء شركة {companyProfile.name}</div>
          <div className="text-slate-500 font-medium">
            تقرير مراقب الحسابات المستقل عن القوائم المالية للسنة المالية المنتهية في 31 ديسمبر 2026
          </div>
        </div>

        {/* 1. Opinion Section */}
        <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-800 font-cairo">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span>أولاً: الرأي المهني (Opinion)</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line">
            {auditorStatement.opinionParagraph || auditorStatement.opinionText || 'القوائم المالية تعبر بوضوح وعدالة عن المركز المالي للشركة ونتائج أعمالها وتدفقاتها النقدية وفقاً لمعايير المحاسبة المصرية.'}
          </p>
        </div>

        {/* 2. Basis for Opinion */}
        <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-cairo">
            <Scale className="w-4 h-4 text-slate-600" />
            <span>ثانياً: أساس الرأي (Basis for Opinion)</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
            {auditorStatement.basisForOpinion || auditorStatement.basisOfOpinion || 'تمت مراجعتنا وفقاً لمعايير المراجعة المصرية والقوانين السارية، ونحن مستقلون عن المنشأة وفقاً لقواعد سلوك المهنة.'}
          </p>
        </div>

        {/* 3. Key Audit Matters & Management Responsibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-600" />
              <span>مسؤولية الإدارة عن القوائم المالية</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
              {auditorStatement.managementResponsibility || auditorStatement.managementResponsibilities || 'تتحمل الإدارة مسؤولية إعداد وعرض القوائم المالية عرضاً عادلاً وفقاً لمعايير المحاسبة المصرية.'}
            </p>
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>مسؤولية مراقب الحسابات عن المراجعة</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
              {auditorStatement.auditorResponsibility || auditorStatement.auditorResponsibilities || 'الحصول على تأكيد معقول حول خلو القوائم المالية من التحريفات الجوهرية وإصدار تقرير الرأي المهني.'}
            </p>
          </div>
        </div>

        {/* 4. Legal & Regulatory Requirements */}
        <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-cairo">
            <Stamp className="w-4 h-4 text-sky-600" />
            <span>ثالثاً: تقرير عن المتطلبات القانونية والتنظيمية الأخرى (قانون 159 لسنة 1981)</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line">
            {auditorStatement.legalRequirementsParagraph || auditorStatement.otherLegalRequirements || 'تمسك الشركة حسابات ودفاتر وسجلات مالية منتظمة تتفق مع القوانين المصرية المعمول بها.'}
          </p>
        </div>

        {/* Signature & Official Seal */}
        <div className="pt-8 border-t-2 border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-1 text-center md:text-right">
            <div className="text-slate-500">القاهرة في {auditorStatement.reportDate}</div>
            <div className="text-slate-700 font-semibold">جمهورية مصر العربية</div>
          </div>

          {/* Official Stamp Box */}
          <div className="border-2 border-dashed border-sky-400 bg-sky-50/50 p-4 rounded-2xl text-center space-y-1.5 min-w-64">
            <div className="text-[10px] text-sky-800 font-bold tracking-wider uppercase">
              خاتم واعتماد مراقب الحسابات
            </div>
            <div className="font-black text-slate-900 text-sm font-cairo">{auditorStatement.auditorName}</div>
            <div className="text-[11px] text-sky-700 font-mono font-bold">
              {auditorStatement.registerNumber}
            </div>
            <div className="text-[9px] text-slate-500">
              محاسب ومراجع قانوني - زميل جمعية المحاسبين والمراجعين
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
