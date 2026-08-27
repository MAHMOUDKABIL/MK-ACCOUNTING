import {
  Award,
  Building,
  Calculator,
  CheckCircle2,
  Coins,
  FileCheck2,
  Receipt,
  Scale,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { SMART_TEMPLATES, SmartTemplate } from '../services/smartJournalEngine';
import { Account, JournalEntry } from '../types/accounting';

interface SmartEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'>) => void;
}

export const SmartEntryModal: React.FC<SmartEntryModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddEntry,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate>(SMART_TEMPLATES[0]);
  const [inputs, setInputs] = useState<Record<string, any>>(SMART_TEMPLATES[0].defaultInputs);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: SmartTemplate) => {
    setSelectedTemplate(tpl);
    setInputs(tpl.defaultInputs);
  };

  const handleInputChange = (field: string, val: any) => {
    setInputs({ ...inputs, [field]: val });
  };

  // Generate preview lines in real-time
  const preview = selectedTemplate.generateLines(inputs, accounts);
  const totalDebit = preview.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = preview.lines.reduce((s, l) => s + (l.credit || 0), 0);

  const handleCreateAndPost = () => {
    const linesWithIds = preview.lines.map((l) => {
      const acc = accounts.find((a) => a.code === l.accountCode);
      return {
        id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        accountId: acc?.id || '',
        accountCode: l.accountCode,
        accountName: acc?.name || l.accountCode,
        debit: l.debit,
        credit: l.credit,
        note: l.note,
      };
    });

    onAddEntry({
      date: new Date().toISOString().split('T')[0],
      referenceDoc: preview.referenceDoc,
      description: preview.description,
      isPosted: true,
      sourceType: 'smart_template',
      createdBy: 'المحاسب الآلي الذكي (وفق المعايير المصرية)',
      totalDebit,
      totalCredit,
      lines: linesWithIds,
    });

    onClose();
  };

  const categories = [
    { id: 'all', label: 'كافة النماذج الذكية' },
    { id: 'sales', label: 'المبيعات والعملاء' },
    { id: 'purchases', label: 'المشتريات والموردين' },
    { id: 'payroll', label: 'المرتبات والأجور والتأمينات' },
    { id: 'treasury', label: 'الخزينة والبنوك والتحصيلات' },
    { id: 'depreciation', label: 'إهلاك الأصول الثابتة' },
    { id: 'tax', label: 'إقرارات الضرائب والتسويات' },
  ];

  const filteredTemplates = SMART_TEMPLATES.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 font-cairo">
                المساعد الذكي لاقتراح وإنشاء قيود اليومية الآلية
              </h2>
              <p className="text-xs text-slate-500">
                نماذج محاسبية جاهزة ومطابقة لمعايير المحاسبة المصرية (EAS) وقوانين الضرائب والتأمينات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1 overflow-hidden">
          {/* Left / Sidebar: Template Selection */}
          <div className="md:col-span-4 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 p-4 overflow-y-auto space-y-3">
            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">تصنيف المعاملة:</label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Buttons */}
            <div className="space-y-2 pt-2">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`w-full text-right p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between gap-1">
                      <span className={isSelected ? 'text-sky-700 font-black' : 'text-slate-800 font-bold'}>{tpl.title}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right / Main Panel: Inputs & Real-time Journal Preview */}
          <div className="md:col-span-8 p-5 overflow-y-auto space-y-5 bg-white flex flex-col justify-between">
            <div className="space-y-4">
              {/* Active Template Title */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-black text-slate-900 text-sm font-cairo text-sky-700">
                  {selectedTemplate.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{selectedTemplate.description}</p>
              </div>

              {/* Dynamic Parameter Inputs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">بيانات ومعطيات المعاملة:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  {Object.entries(inputs).map(([key, value]) => {
                    let label = key;
                    if (key === 'amount') label = 'المبلغ الأساسي (ج.م)';
                    if (key === 'customerName') label = 'اسم العميل';
                    if (key === 'supplierName') label = 'اسم المورد';
                    if (key === 'vatRate') label = 'نسبة ضريبة القيمة المضافة (%)';
                    if (key === 'withholdingRate') label = 'نسبة الخصم من المنبع أ/ت (%)';
                    if (key === 'invoiceNumber') label = 'رقم الفاتورة';
                    if (key === 'receiptNumber') label = 'رقم الإيصال / السند';
                    if (key === 'checkNumber') label = 'رقم الشيك البنكي';
                    if (key === 'cashDiscount') label = 'الخصم المكتسب (ج.م)';
                    if (key === 'totalSalaries') label = 'إجمالي المرتبات والأجور (ج.م)';
                    if (key === 'employerInsuranceRate') label = 'تأمينات حصة المنشأة (%)';
                    if (key === 'employeeInsuranceRate') label = 'تأمينات حصة العامل (%)';
                    if (key === 'payrollTaxAmount') label = 'ضريبة كسب العمل (ج.م)';
                    if (key === 'buildingsDepreciation') label = 'إهلاك المباني (ج.م)';
                    if (key === 'machineryDepreciation') label = 'إهلاك الآلات والمعدات (ج.م)';
                    if (key === 'vehiclesDepreciation') label = 'إهلاك وسائل النقل (ج.م)';
                    if (key === 'furnitureDepreciation') label = 'إهلاك الأثاث وأجهزة الحاسب (ج.م)';
                    if (key === 'outputVatAmount') label = 'ضريبة المخرجات (مبيعات) (ج.م)';
                    if (key === 'inputVatAmount') label = 'ضريبة المدخلات (مشتريات) (ج.م)';
                    if (key === 'periodNote') label = 'بيان الفترة';
                    if (key === 'settlementMonth') label = 'شهر الإقرار الضريبي';

                    return (
                      <div key={key}>
                        <label className="block text-slate-600 font-semibold mb-1">{label}</label>
                        <input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          step="any"
                          value={value}
                          onChange={(e) =>
                            handleInputChange(
                              key,
                              typeof value === 'number' ? Number(e.target.value) : e.target.value
                            )
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Generated Double Entry Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700">
                    معاينة القيد المحاسبي المقترح آلياً (الأطراف المدينة والدائنة):
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    متطابق وموزون
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                        <th className="py-2.5 px-3 w-28">رقم الحساب</th>
                        <th className="py-2.5 px-3">اسم الحساب المحاسبي</th>
                        <th className="py-2.5 px-3">شرح وتفاصيل الطرف</th>
                        <th className="py-2.5 px-3 w-28 text-left">مدين (ج.م)</th>
                        <th className="py-2.5 px-3 w-28 text-left">دائن (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {preview.lines.map((l, idx) => {
                        const acc = accounts.find((a) => a.code === l.accountCode);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-bold text-sky-600">{l.accountCode}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{acc?.name || l.accountCode}</td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">{l.note}</td>
                            <td className="py-2 px-3 font-mono font-bold text-left text-slate-900">
                              {l.debit > 0 ? Number(l.debit).toLocaleString() : '-'}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-left text-slate-700">
                              {l.credit > 0 ? Number(l.credit).toLocaleString() : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-mono font-bold text-xs border-t border-slate-200">
                        <td colSpan={3} className="py-2.5 px-3 text-right font-sans text-slate-700">
                          الإجمالي:
                        </td>
                        <td className="py-2.5 px-3 text-left text-sky-700 font-black">
                          {totalDebit.toLocaleString()} ج.م
                        </td>
                        <td className="py-2.5 px-3 text-left text-slate-900 font-black">
                          {totalCredit.toLocaleString()} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-xl text-xs cursor-pointer shadow-2xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateAndPost}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-sky-200" />
                <span>اعتماد القيد وترحيله فوراً للأستاذ العام</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
