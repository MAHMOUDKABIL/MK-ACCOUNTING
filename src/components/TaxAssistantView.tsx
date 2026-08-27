import {
  AlertCircle,
  Award,
  BadgePercent,
  Building,
  Calculator,
  Calendar,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Info,
  Percent,
  Plus,
  Printer,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Account, AuditorStatement, CompanyProfile, Invoice, JournalEntry } from '../types/accounting';

interface TaxAssistantViewProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  invoices: Invoice[];
  accounts: Account[];
  onAddJournalEntry: (entry: any) => void;
}

export const TaxAssistantView: React.FC<TaxAssistantViewProps> = ({
  companyProfile,
  auditorStatement,
  invoices,
  accounts,
  onAddJournalEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'vat10' | 'form41' | 'payroll' | 'calendar'>('vat10');

  // VAT Model 10 calculations
  const salesInvoices = invoices.filter((i) => i.type === 'sales' || i.type === 'sale');
  const purchaseInvoices = invoices.filter((i) => i.type === 'purchases' || i.type === 'purchase');

  const totalSalesTaxable = salesInvoices.reduce((s, i) => s + (Number(i.taxableAmount ?? i.subtotal) || 0), 0);
  const totalOutputVat = salesInvoices.reduce((s, i) => s + (Number(i.vatAmount ?? i.vatTotal) || 0), 0);

  const totalPurchasesTaxable = purchaseInvoices.reduce((s, i) => s + (Number(i.taxableAmount ?? i.subtotal) || 0), 0);
  const totalInputVat = purchaseInvoices.reduce((s, i) => s + (Number(i.vatAmount ?? i.vatTotal) || 0), 0);

  const [carriedOverVatCredit, setCarriedOverVatCredit] = useState<number>(0);
  const netVatPayable = totalOutputVat - totalInputVat - carriedOverVatCredit;

  // Form 41 calculations (Withholding Tax أ/ت)
  const [form41Quarter, setForm41Quarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');

  // Payroll Calculator State (Egyptian Income Tax Law 91/2005 & recent amendments)
  const [grossSalary, setGrossSalary] = useState<number>(15000);
  const [hasIncentives, setHasIncentives] = useState<number>(2000);
  const [employeeCount, setEmployeeCount] = useState<number>(5);

  // Social insurance maximum limits (approx Egyptian standards 2026: ~14,000 EGP cap)
  const insuranceBase = Math.min(grossSalary, 14500);
  const employeeInsurance = insuranceBase * 0.11; // 11% حصة الموظف
  const companyInsurance = insuranceBase * 0.1875; // 18.75% حصة صاحب العمل

  // Egyptian Income Tax Calculation for salary:
  // Personal exemption (الإعفاء الشخصي): ~20,000 EGP annually (~1,666.67 monthly)
  // Standard progressive brackets
  const monthlyPersonalExemption = 1666.67;
  const taxableSalaryBase = Math.max(0, grossSalary + hasIncentives - employeeInsurance - monthlyPersonalExemption);
  const annualTaxableBase = taxableSalaryBase * 12;

  const calculateAnnualSalaryTax = (taxableAmount: number): number => {
    let tax = 0;
    if (taxableAmount <= 40000) {
      tax = 0;
    } else if (taxableAmount <= 55000) {
      tax = (taxableAmount - 40000) * 0.10;
    } else if (taxableAmount <= 70000) {
      tax = 15000 * 0.10 + (taxableAmount - 55000) * 0.15;
    } else if (taxableAmount <= 200000) {
      tax = 15000 * 0.10 + 15000 * 0.15 + (taxableAmount - 70000) * 0.20;
    } else if (taxableAmount <= 400000) {
      tax = 15000 * 0.10 + 15000 * 0.15 + 130000 * 0.20 + (taxableAmount - 200000) * 0.225;
    } else {
      tax = 15000 * 0.10 + 15000 * 0.15 + 130000 * 0.20 + 200000 * 0.225 + (taxableAmount - 400000) * 0.25;
    }
    return tax;
  };

  const monthlySalaryTaxPerEmployee = calculateAnnualSalaryTax(annualTaxableBase) / 12;
  const totalMonthlySalaryTax = monthlySalaryTaxPerEmployee * employeeCount;
  const totalMonthlyGross = (grossSalary + hasIncentives) * employeeCount;
  const totalMonthlyEmployeeInsurance = employeeInsurance * employeeCount;
  const totalMonthlyCompanyInsurance = companyInsurance * employeeCount;
  const netPayableSalaries = totalMonthlyGross - totalMonthlyEmployeeInsurance - totalMonthlySalaryTax;

  const [notification, setNotification] = useState<string | null>(null);

  // Generate Salary Journal Entry Automatically
  const handleGeneratePayrollEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const lines = [
      // Debit: Salaries & Wages Expense (411)
      {
        id: `line-sal-1`,
        accountId: accounts.find((a) => a.code === '411')?.id || '',
        accountCode: '411',
        accountName: 'الأجور والمرتبات النقدية والمكافآت',
        debit: totalMonthlyGross,
        credit: 0,
        note: `استحقاق مرتبات شهرية لعدد ${employeeCount} موظف`,
      },
      // Debit: Company Social Insurance Expense (412)
      {
        id: `line-sal-2`,
        accountId: accounts.find((a) => a.code === '412')?.id || '',
        accountCode: '412',
        accountName: 'حصة المنشأة في التأمينات الاجتماعية (18.75%)',
        debit: totalMonthlyCompanyInsurance,
        credit: 0,
        note: 'التأمينات الاجتماعية حصة صاحب العمل',
      },
      // Credit: Salary Tax Withheld (2322)
      {
        id: `line-sal-3`,
        accountId: accounts.find((a) => a.code === '2322')?.id || '',
        accountCode: '2322',
        accountName: 'مصلحة الضرائب - ضريبة كسب العمل المستقطعة',
        debit: 0,
        credit: totalMonthlySalaryTax,
        note: 'ضريبة كسب العمل المستقطعة من رواتب العاملين',
      },
      // Credit: Social Insurance Authority (2324)
      {
        id: `line-sal-4`,
        accountId: accounts.find((a) => a.code === '2324')?.id || '',
        accountCode: '2324',
        accountName: 'الهيئة القومية للتأمين الاجتماعي (حصة العامل + حصة المنشأة)',
        debit: 0,
        credit: totalMonthlyEmployeeInsurance + totalMonthlyCompanyInsurance,
        note: 'إجمالي استقطاعات التأمينات الاجتماعية الواجبة السداد',
      },
      // Credit: Accrued Salaries / Bank (2312 or 1242)
      {
        id: `line-sal-5`,
        accountId: accounts.find((a) => a.code === '2312')?.id || '',
        accountCode: '2312',
        accountName: 'حساب الأجور والمرتبات المستحقة (أو البنك الأهلي)',
        debit: 0,
        credit: netPayableSalaries,
        note: 'صافي الأجور المستحقة للصرف للموظفين',
      },
    ];

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    const entry = {
      date: today,
      referenceDoc: `PAYROLL-${today.substring(0, 7)}`,
      description: `قيد استحقاق رواتب وأجور العاملين والتأمينات والضرائب عن شهر ${today.substring(0, 7)}`,
      isPosted: true,
      postedBy: auditorStatement.auditorName || 'محمود الباز قابيل (محاسب قانوني)',
      createdBy: 'المحاسب المالي',
      sourceType: 'payroll',
      totalDebit,
      totalCredit,
      lines,
    };

    onAddJournalEntry(entry);
    setNotification('تم توليد وترحيل قيد استحقاق المرتبات والضرائب بنجاح إلى دفتر اليومية العامة!');
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <BadgePercent className="w-5 h-5 text-sky-600" />
            المستشار الضريبي والنماذج الضريبية المصرية (Egyptian Tax Hub)
          </h2>
          <p className="text-xs text-slate-500">
            نماذج الإقرارات (نموذج 10 ق.م، نموذج 41 خصم وتحصيل)، حاسبة كسب العمل، وأجندة الالتزامات الضريبية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة الإقرار A4</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 no-print">
        <button
          onClick={() => setActiveTab('vat10')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'vat10'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>إقرار ضريبة القيمة المضافة (نموذج 10)</span>
        </button>

        <button
          onClick={() => setActiveTab('form41')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'form41'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>نموذج 41 (خصم وتحصيل أ/ت)</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>حاسبة وقيد كسب العمل والتأمينات</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>أجندة المواعيد والإقرارات</span>
        </button>
      </div>

      {/* 1. VAT Return Model 10 */}
      {activeTab === 'vat10' && (
        <div className="space-y-6">
          {/* Header Card for VAT Return */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  مصلحة الضرائب المصرية - قانون الإجراءات الضريبية الموحد رقم 206 لسنة 2020
                </span>
                <h3 className="text-base font-black text-slate-900 font-cairo mt-2">
                  إقرار ضريبة القيمة المضافة الشهري (نموذج رقم 10 ض.ق.م)
                </h3>
                <p className="text-xs text-slate-500">
                  المسجل: <strong>{companyProfile.name}</strong> | رقم التسجيل الضريبي:{' '}
                  <span className="font-mono font-bold">{companyProfile.taxCard || 'غير محدد'}</span>
                </p>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-right space-y-1">
                <div>مراقب الحسابات: <strong className="text-slate-800">{auditorStatement.auditorName}</strong></div>
                <div className="text-sky-700 font-mono font-bold">{auditorStatement.registerNumber || 'س.م.م 44887'}</div>
              </div>
            </div>

            {/* VAT Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold">إجمالي المبيعات الخاضعة (14%)</span>
                  <span className="text-[11px] text-slate-500">{salesInvoices.length} فواتير</span>
                </div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {totalSalesTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
                </div>
                <div className="text-xs font-bold text-sky-700 pt-1 border-t border-slate-200">
                  ضريبة المخرجات المحصلة: {totalOutputVat.toLocaleString()} ج.م
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold">إجمالي المشتريات الخاضعة (14%)</span>
                  <span className="text-[11px] text-slate-500">{purchaseInvoices.length} فواتير</span>
                </div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {totalPurchasesTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
                </div>
                <div className="text-xs font-bold text-emerald-700 pt-1 border-t border-slate-200">
                  ضريبة المدخلات القابلة للخصم: {totalInputVat.toLocaleString()} ج.م
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-1 ${
                  netVatPayable >= 0
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>صافي الضريبة {netVatPayable >= 0 ? 'المستحقة للسداد' : 'رصيد دائن مرحل'}</span>
                  <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded">نموذج 10</span>
                </div>
                <div className="text-xl font-black font-mono">
                  {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
                </div>
                <div className="text-[11px] font-medium pt-1 border-t border-current/20">
                  {netVatPayable >= 0 ? 'واجبة التوريد خلال الشهر التالي' : 'رصيد دائن يرحل للشهر القادم'}
                </div>
              </div>
            </div>

            {/* Model 10 Detailed Tax Calculation Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-bold text-xs text-slate-800">
                جدول تفريغ بيانات الإقرار الضريبي الرسمي (نموذج 10)
              </div>
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-16 text-center">البند</th>
                    <th className="p-3">البيان والتفاصيل</th>
                    <th className="p-3 w-44 text-left font-mono">القيمة الخاضعة (ج.م)</th>
                    <th className="p-3 w-44 text-left font-mono">مبلغ الضريبة (14%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="p-3 text-center font-mono font-bold text-sky-800">01</td>
                    <td className="p-3 font-semibold">مبيعات السلع والخدمات الخاضعة للنسبة العامة 14%</td>
                    <td className="p-3 text-left font-mono">{totalSalesTaxable.toLocaleString()}</td>
                    <td className="p-3 text-left font-mono font-bold text-sky-800">{totalOutputVat.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">02</td>
                    <td className="p-3 font-semibold">مشتريات السلع والخدمات المحلية والمستوردة القابلة للخصم</td>
                    <td className="p-3 text-left font-mono">{totalPurchasesTaxable.toLocaleString()}</td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-800">({totalInputVat.toLocaleString()})</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-center font-mono font-bold text-slate-600">03</td>
                    <td className="p-3 font-semibold">رصيد ضريبة دائن سابق ومرحل من فترات سابقة</td>
                    <td className="p-3 text-left font-mono">-</td>
                    <td className="p-3 text-left font-mono">
                      <input
                        type="number"
                        min="0"
                        value={carriedOverVatCredit === 0 ? '' : carriedOverVatCredit}
                        onChange={(e) => setCarriedOverVatCredit(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-32 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-left font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </td>
                  </tr>
                  <tr className="bg-sky-50/50 font-bold">
                    <td className="p-3 text-center font-mono font-black text-sky-950">04</td>
                    <td className="p-3 font-black text-sky-950">
                      صافي الضريبة الواجبة السداد للمأمورية المختصة (أو رصيد دائن مرحل)
                    </td>
                    <td className="p-3 text-left font-mono">-</td>
                    <td className="p-3 text-left font-mono font-black text-base text-sky-950">
                      {netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Withholding Tax Form 41 */}
      {activeTab === 'form41' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  المادة (59) من قانون الضريبة على الدخل 91 لسنة 2005
                </span>
                <h3 className="text-base font-black text-slate-900 font-cairo mt-2">
                  نموذج رقم (41) خصم وتحصيل تحت حساب الضريبة (الربع سنوي)
                </h3>
                <p className="text-xs text-slate-500">
                  إجمالي المبالغ المستقطعة من الموردين ومؤدي الخدمات لحساب مصلحة الضرائب المصرية
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">الفترة الضريبية:</label>
                <select
                  value={form41Quarter}
                  onChange={(e: any) => setForm41Quarter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  <option value="Q1">الربع الأول (يناير - مارس)</option>
                  <option value="Q2">الربع الثاني (أبريل - يونيو)</option>
                  <option value="Q3">الربع الثالث (يوليو - سبتمبر)</option>
                  <option value="Q4">الربع الرابع (أكتوبر - ديسمبر)</option>
                </select>
              </div>
            </div>

            {/* Rates Reference */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">نسبة 1% - التوريدات والمقاولات</div>
                <div className="text-[11px] text-slate-500 mt-0.5">توريد سلع، خامات، ومقاولات البناء والتشييد</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">نسبة 3% - الخدمات والاستشارات</div>
                <div className="text-[11px] text-slate-500 mt-0.5">خدمات الصيانة، النقل، الاستشارات، والمهن الحرة</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">نسبة 0.5% - النشاط الصناعي والتجاري</div>
                <div className="text-[11px] text-slate-500 mt-0.5">الوكالات وتجارة السلع الأساسية والمحروقات</div>
              </div>
            </div>

            {/* Invoices List with Withholding */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>سجل تعاملات الموردين المستقطع منها ضريبة الخصم والتحصيل (أ/ت)</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  تورد المبالغ للمأمورية خلال الشهر التالي لانتهاء الربع
                </span>
              </div>

              {purchaseInvoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>لا توجد فواتير مشتريات مسجلة حالياً بنموذج الخصم.</p>
                  <p className="text-[11px] text-slate-400">
                    عند تسجيل فواتير شراء وتحديد نسبة الخصم (1% أو 3%) ستظهر العمليات هنا تلقائياً.
                  </p>
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">رقم الفاتورة</th>
                      <th className="p-2.5">اسم المورد / الجهة</th>
                      <th className="p-2.5">رقم التسجيل الضريبي</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5 text-left font-mono">القيمة الإجمالية</th>
                      <th className="p-2.5 text-left font-mono">النسبة</th>
                      <th className="p-2.5 text-left font-mono">مبلغ الخصم (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {purchaseInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold">{inv.formattedNumber || inv.invoiceNumber}</td>
                        <td className="p-2.5 font-semibold">{inv.partyName}</td>
                        <td className="p-2.5 font-mono text-slate-600">{inv.partyTaxNumber || 'مدرج بالملف'}</td>
                        <td className="p-2.5 font-mono text-slate-500">{inv.date}</td>
                        <td className="p-2.5 text-left font-mono">{inv.subtotal?.toLocaleString()}</td>
                        <td className="p-2.5 text-left font-mono">
                          {((inv.withholdingTaxRate || 0.01) * 100).toFixed(0)}%
                        </td>
                        <td className="p-2.5 text-left font-mono font-bold text-amber-800">
                          {(inv.withholdingTaxAmount || inv.withholdingTaxTotal || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Payroll & Social Insurance Calculator */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  قانون الضريبة على الدخل 91/2005 وقانون التأمينات الاجتماعية 148/2019
                </span>
                <h3 className="text-base font-black text-slate-900 font-cairo mt-2">
                  حاسبة كسب العمل وتوليد قيد استحقاق الرواتب والأجور آلياً
                </h3>
                <p className="text-xs text-slate-500">
                  احتساب الشرائح الضريبية التصاعدية، الإعفاء الشخصي، وحصص التأمينات الاجتماعية
                </p>
              </div>

              <button
                onClick={handleGeneratePayrollEntry}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>ترحيل قيد المرتبات إلى دفتر اليومية</span>
              </button>
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  متوسط الراتب الأساسي للموظف (ج.م) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الحوافز والبدلات الإضافية للموظف (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hasIncentives}
                  onChange={(e) => setHasIncentives(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  إجمالي عدد الموظفين والعاملين *
                </label>
                <input
                  type="number"
                  min="1"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs text-slate-600 font-semibold">إجمالي الأجور المستحقة (Gross)</div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {totalMonthlyGross.toLocaleString()} ج.م
                </div>
                <div className="text-[11px] text-slate-500">حساب مدين: 411 أجور ومرتبات</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs text-slate-600 font-semibold">حصة المنشأة في التأمينات (18.75%)</div>
                <div className="text-lg font-black text-sky-800 font-mono">
                  {totalMonthlyCompanyInsurance.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.م
                </div>
                <div className="text-[11px] text-slate-500">حساب مدين: 412 تأمينات اجتماعية</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs text-slate-600 font-semibold">ضريبة كسب العمل المستقطعة</div>
                <div className="text-lg font-black text-amber-800 font-mono">
                  {totalMonthlySalaryTax.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.م
                </div>
                <div className="text-[11px] text-slate-500">حساب دائن: 2322 مصلحة الضرائب</div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-1">
                <div className="text-xs text-emerald-900 font-bold">صافي الأجور المستحقة للصرف (Net)</div>
                <div className="text-lg font-black text-emerald-950 font-mono">
                  {netPayableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.م
                </div>
                <div className="text-[11px] text-emerald-800 font-medium">حساب دائن: 2312 رواتب مستحقة</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tax Calendar & Deadlines */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 font-cairo">
              أجندة المواعيد القانونية للإقرارات والالتزامات الضريبية المصرية
            </h3>
            <p className="text-xs text-slate-500">
              دليل المحاسب والمراجع القانوني لتجنب غرامات التأخير وفقاً لقانون الإجراءات الضريبية الموحد 206/2020
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">إقرار ضريبة القيمة المضافة (نموذج 10) - شهرياً</div>
                  <div className="text-slate-600">
                    يقدم شهرياً خلال الشهر التالي لانتهاء الفترة الضريبية (قبل نهاية اليوم الأخير من كل شهر ميلادي).
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">إقرار الخصم والتحصيل تحت حساب الضريبة (نموذج 41) - ربع سنوي</div>
                  <div className="text-slate-600">
                    يقدم في نهاية الأشهر: أبريل (للربع الأول)، يوليو (للربع الثاني)، أكتوبر (للربع الثالث)، يناير (للربع الرابع).
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">إقرار ضريبة كسب العمل والمرتبات والتسوية السنوية</div>
                  <div className="text-slate-600">
                    تقديم النموذج ربع السنوي (نموذج 4 مرتبات) والتسوية السنوية لكسب العمل قبل نهاية شهر يناير من كل عام.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">الإقرار الضريبي السنوي للأشخاص الاعتبارية (الشركات)</div>
                  <div className="text-slate-600">
                    يقدم خلال الفترة من أول يناير حتى نهاية شهر أبريل من كل عام معتمداً من مراقب الحسابات المقيد بوزارة المالية (رقم القيد: {auditorStatement.registerNumber || '44887'}).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
