import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Plus,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { db } from '../services/db';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import {
  AccountingCertificate,
  CertificateType,
  ClientArchive,
  IncomeCertificateData,
  InvestedCapitalCertificateData,
  WorkingCapitalCertificateData,
} from '../types/office';
import { exportToExcel, exportToWordDoc, printDocument } from '../utils/exportUtils';

interface CertificatesManagementViewProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  initialClientId?: string;
}

export const CertificatesManagementView: React.FC<CertificatesManagementViewProps> = ({
  companyProfile,
  auditorStatement,
  initialClientId,
}) => {
  const [certificates, setCertificates] = useState<AccountingCertificate[]>(() =>
    db.getCertificates()
  );
  const [clients, setClients] = useState<ClientArchive[]>(() => db.getClientArchives());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>(initialClientId || 'all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState<AccountingCertificate | null>(null);

  // Active form type
  const [selectedType, setSelectedType] = useState<CertificateType>('income');

  // Form Base State
  const initialBaseForm = {
    clientId: initialClientId || (clients[0]?.id ?? ''),
    clientName: clients.find((c) => c.id === initialClientId)?.name || (clients[0]?.name ?? ''),
    issueDate: new Date().toISOString().split('T')[0],
    fiscalPeriod: 'السنة المالية المنتهية في 31/12/2025',
    issuedToParty: 'السادة / البنك الأهلي المصري - قطاع تمويل المشروعات',
    purpose: 'لتقديمها إلى البنك للحصول على تسهيل ائتماني وتمويل توسعات النشاط',
    notes: '',
  };

  const [baseForm, setBaseForm] = useState(initialBaseForm);

  // Specialized Type Data States
  const [incomeData, setIncomeData] = useState<IncomeCertificateData>({
    grossAnnualRevenue: 1200000,
    annualExpenses: 780000,
    netAnnualIncome: 420000,
    averageMonthlyIncome: 35000,
    revenueSourceDescription: 'إيرادات المبيعات والخدمات التجارية طبقاً لدفاتر وسجلات المنشأة',
  });

  const [investedCapitalData, setInvestedCapitalData] = useState<InvestedCapitalCertificateData>({
    fixedAssetsValue: 1500000,
    currentAssetsValue: 900000,
    totalInvestedCapital: 2400000,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionDetails: 'تمت المعاينة الميدانية لمقر ومخازن المنشأة ومراجعة فواتير شراء الأصول والآلات',
  });

  const [workingCapitalData, setWorkingCapitalData] = useState<WorkingCapitalCertificateData>({
    currentAssets: 1250000,
    currentLiabilities: 450000,
    netWorkingCapital: 800000,
    currentRatio: 2.78,
  });

  const refreshData = () => {
    setCertificates(db.getCertificates());
    setClients(db.getClientArchives());
  };

  // Recalculate Income Totals automatically
  const handleIncomeRevenueChange = (revenue: number) => {
    const expenses = incomeData.annualExpenses;
    const net = revenue - expenses;
    setIncomeData({
      ...incomeData,
      grossAnnualRevenue: revenue,
      netAnnualIncome: net,
      averageMonthlyIncome: Math.round(net / 12),
    });
  };

  const handleIncomeExpensesChange = (expenses: number) => {
    const revenue = incomeData.grossAnnualRevenue;
    const net = revenue - expenses;
    setIncomeData({
      ...incomeData,
      annualExpenses: expenses,
      netAnnualIncome: net,
      averageMonthlyIncome: Math.round(net / 12),
    });
  };

  // Recalculate Invested Capital Totals automatically
  const handleInvestedFixedChange = (fixed: number) => {
    const current = investedCapitalData.currentAssetsValue;
    setInvestedCapitalData({
      ...investedCapitalData,
      fixedAssetsValue: fixed,
      totalInvestedCapital: fixed + current,
    });
  };

  const handleInvestedCurrentChange = (current: number) => {
    const fixed = investedCapitalData.fixedAssetsValue;
    setInvestedCapitalData({
      ...investedCapitalData,
      currentAssetsValue: current,
      totalInvestedCapital: fixed + current,
    });
  };

  // Recalculate Working Capital Totals automatically
  const handleWorkingAssetsChange = (assets: number) => {
    const liab = workingCapitalData.currentLiabilities;
    const net = assets - liab;
    const ratio = liab > 0 ? Number((assets / liab).toFixed(2)) : 0;
    setWorkingCapitalData({
      ...workingCapitalData,
      currentAssets: assets,
      netWorkingCapital: net,
      currentRatio: ratio,
    });
  };

  const handleWorkingLiabChange = (liab: number) => {
    const assets = workingCapitalData.currentAssets;
    const net = assets - liab;
    const ratio = liab > 0 ? Number((assets / liab).toFixed(2)) : 0;
    setWorkingCapitalData({
      ...workingCapitalData,
      currentLiabilities: liab,
      netWorkingCapital: net,
      currentRatio: ratio,
    });
  };

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchSearch =
        c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.issuedToParty.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || c.certificateType === filterType;
      const matchClient = filterClient === 'all' || c.clientId === filterClient;

      return matchSearch && matchType && matchClient;
    });
  }, [certificates, searchTerm, filterType, filterClient]);

  // Handle Client selection in form
  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    setBaseForm({
      ...baseForm,
      clientId,
      clientName: found ? found.name : '',
    });
  };

  // Save Certificate
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseForm.clientName || !baseForm.issuedToParty) {
      alert('يرجى اختيار العميل وتحديد الجهة الموجه إليها الشهادة');
      return;
    }

    const payload: Omit<AccountingCertificate, 'id' | 'serialNumber' | 'createdAt'> = {
      clientId: baseForm.clientId,
      clientName: baseForm.clientName,
      certificateType: selectedType,
      issueDate: baseForm.issueDate,
      fiscalPeriod: baseForm.fiscalPeriod,
      issuedToParty: baseForm.issuedToParty,
      purpose: baseForm.purpose,
      auditorName: auditorStatement.auditorName || 'محمود الباز قابيل',
      auditorRegisterNumber: 'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية',
      incomeData: selectedType === 'income' ? incomeData : undefined,
      investedCapitalData: selectedType === 'invested_capital' ? investedCapitalData : undefined,
      workingCapitalData: selectedType === 'working_capital' ? workingCapitalData : undefined,
      notes: baseForm.notes,
    };

    const newCert = db.addCertificate(payload);
    refreshData();
    setIsAddModalOpen(false);
    setPreviewCert(newCert); // open preview directly
  };

  const handleDeleteCert = (id: string, serial: string) => {
    if (confirm(`هل أنت متأكد من حذف الشهادة رقم (${serial}) من الأرشيف؟`)) {
      db.deleteCertificate(id);
      refreshData();
    }
  };

  // Export List to Excel
  const handleExportExcel = () => {
    const data = filteredCertificates.map((c) => {
      let mainValue = '';
      if (c.certificateType === 'income') {
        mainValue = `صافي الدخل السنوي: ${c.incomeData?.netAnnualIncome?.toLocaleString() || 0} ج.م`;
      } else if (c.certificateType === 'invested_capital') {
        mainValue = `رأس المال المستثمر: ${c.investedCapitalData?.totalInvestedCapital?.toLocaleString() || 0} ج.م`;
      } else {
        mainValue = `صافي رأس المال العامل: ${c.workingCapitalData?.netWorkingCapital?.toLocaleString() || 0} ج.م`;
      }

      return {
        'الرقم التسلسلي': c.serialNumber,
        'نوع الشهادة':
          c.certificateType === 'income'
            ? 'شهادة إثبات صافي الدخل'
            : c.certificateType === 'invested_capital'
            ? 'شهادة رأس المال المستثمر'
            : 'شهادة رأس المال العامل',
        'اسم العميل / المنشأة': c.clientName,
        'تاريخ الإصدار': c.issueDate,
        'الفترة المالية / المحاسبية': c.fiscalPeriod,
        'الجهة الموجه إليها': c.issuedToParty,
        'الغرض من الشهادة': c.purpose,
        'القيم المالية المعتمدة': mainValue,
        'المحاسب القانوني المعتمد': c.auditorName,
        'رقم السجل': c.auditorRegisterNumber,
      };
    });

    exportToExcel(
      data,
      `أرشيف_الشهادات_المحاسبية_${new Date().toISOString().split('T')[0]}`,
      'الشهادات الصادرة'
    );
  };

  // Export Single Certificate to Word (.docx)
  const handleExportSingleCertWord = (cert: AccountingCertificate) => {
    const client = clients.find((c) => c.id === cert.clientId);
    let financialTableHtml = '';

    if (cert.certificateType === 'income' && cert.incomeData) {
      financialTableHtml = `
        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 50%;">إجمالي الإيرادات السنوية التقديرية/الفعلية:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${cert.incomeData.grossAnnualRevenue.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">إجمالي التكاليف والمصروفات السنوية:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${cert.incomeData.annualExpenses.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 15px; color: #166534;">صافي الدخل والأرباح السنوية:</td>
            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 15px; color: #166534;">${cert.incomeData.netAnnualIncome.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">متوسط صافي الدخل الشهري:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">${cert.incomeData.averageMonthlyIncome.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
        </table>
        <p><strong>بيان مصادر الدخل:</strong> ${cert.incomeData.revenueSourceDescription}</p>
      `;
    } else if (cert.certificateType === 'invested_capital' && cert.investedCapitalData) {
      financialTableHtml = `
        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 50%;">قيمة الأصول الثابتة المستثمرة (آلات ومعدات وتجهيزات):</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${cert.investedCapitalData.fixedAssetsValue.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">قيمة الأصول المتداولة المستثمرة (مخزون ونقدية ومدينون):</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${cert.investedCapitalData.currentAssetsValue.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 15px; color: #166534;">إجمالي رأس المال المستثمر في النشاط:</td>
            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 15px; color: #166534;">${cert.investedCapitalData.totalInvestedCapital.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
        </table>
        <p><strong>تاريخ وتفاصيل المعاينة الميدانية:</strong> تمت المعاينة بتاريخ ${cert.investedCapitalData.inspectionDate} - ${cert.investedCapitalData.inspectionDetails}</p>
      `;
    } else if (cert.certificateType === 'working_capital' && cert.workingCapitalData) {
      financialTableHtml = `
        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 50%;">إجمالي الأصول المتداولة (Current Assets):</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${cert.workingCapitalData.currentAssets.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">إجمالي الالتزامات والخصوم المتداولة (Current Liabilities):</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; color: #dc2626;">${cert.workingCapitalData.currentLiabilities.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 15px; color: #166534;">صافي رأس المال العامل (الأصول المتداولة - الالتزامات):</td>
            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 15px; color: #166534;">${cert.workingCapitalData.netWorkingCapital.toLocaleString()} جنيهاً مصرياً</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">نسبة التداول والسيولة (Current Ratio):</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">${cert.workingCapitalData.currentRatio} : 1</td>
          </tr>
        </table>
      `;
    }

    const typeTitle =
      cert.certificateType === 'income'
        ? 'شهادة إثبات صافي الدخل السنوي والشهري'
        : cert.certificateType === 'invested_capital'
        ? 'شهادة إثبات رأس المال المستثمر الفعلي'
        : 'شهادة تحديد صافي رأس المال العامل ومؤشرات السيولة';

    const wordContent = `
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px;">
        <h3 style="margin: 0; color: #475569; font-size: 14px;">مكتب المحاسب والمراجع القانوني</h3>
        <h1 style="margin: 5px 0; color: #0f172a; font-size: 22px;">محمود الباز قابيل</h1>
        <p style="margin: 2px 0; font-size: 12px; color: #334155;">سجل المحاسبين والمراجعين بوزارة المالية رقم: <strong>44887</strong></p>
        <p style="margin: 2px 0; font-size: 11px; color: #64748b;">عضو جمعية المحاسبين والمراجعين المصرية | خبير ضرائب واستشارات مالية</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
        <div>رقم الشهادة المسلسل: <strong>${cert.serialNumber}</strong></div>
        <div>تاريخ الإصدار: <strong>${cert.issueDate}</strong></div>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <span style="border: 2px solid #0f172a; padding: 8px 25px; font-size: 16px; font-weight: bold; background-color: #f1f5f9; border-radius: 4px;">
          ${typeTitle}
        </span>
      </div>

      <div style="margin-bottom: 15px; font-size: 14px;">
        <strong>إلى / ${cert.issuedToParty}</strong><br>
        <span style="font-size: 12px; color: #475569;">تحية طيبة وبعد ،،،</span>
      </div>

      <div style="font-size: 13px; line-height: 1.8; text-align: justify;">
        <p>
          يشهد مكتبنا المحاسبي بصفتنا المحاسب والمراجع القانوني للمنشأة / <strong>${cert.clientName}</strong>
          ${client ? `(بطاقة ضريبية رقم: ${client.taxCardNumber} - مأمورية ضرائب ${client.taxOffice || 'المختصة'} - سجل تجاري رقم ${client.commercialRegistryNumber || 'سجل فردي'})` : ''}،
          وبناءً على الفحص الميداني والمراجعة المستندية للدفاتر والسجلات المحاسبية والفواتير عن الفترة: <strong>${cert.fiscalPeriod}</strong>،
          وبعد الاطلاع على البيانات المالية المعتمدة، نفيد ونشهد بالآتي:
        </p>

        ${financialTableHtml}

        <p style="margin-top: 15px;">
          <strong>الغرض من الشهادة:</strong> ${cert.purpose}
        </p>
        <p style="font-size: 11px; color: #64748b;">
          * صدرت هذه الشهادة بناءً على طلب العميل ومسؤوليته التامة عن صحة المستندات والبيانات المقدمة، ودون أدنى مسؤولية أو التزام مالي على المكتب تجاه الغير، وهي صالحة للتقديم إلى الجهة الموجهة إليها فقط.
        </p>
      </div>

      <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 11px; color: #64748b;">
          رمز التحقق الإلكتروني: ${cert.serialNumber}-VERIFIED<br>
          نظام الباز للمحاسبة والمراجعة (إصدار معتمد)
        </div>
        <div style="border: 2px dashed #475569; padding: 12px 25px; text-align: center; border-radius: 6px; background-color: #f8fafc;">
          <div style="font-size: 12px; font-weight: bold; color: #0f172a;">المحاسب والمراجع القانوني</div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 4px 0;">محمود الباز قابيل</div>
          <div style="font-size: 11px; color: #334155;">س.م.م 44887</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">(خاتم وتوقيع الاعتماد الرسمي)</div>
        </div>
      </div>
    `;

    exportToWordDoc(
      `شهادة_${cert.serialNumber}`,
      wordContent,
      `شهادة_${cert.serialNumber}_${cert.clientName.replace(/\s+/g, '_')}.doc`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white font-tajawal">
                  وحدة وأرشيف الشهادات المحاسبية المعتمدة
                </h1>
                <p className="text-xs md:text-sm text-slate-400">
                  شهادات الدخل، رأس المال المستثمر، ورأس المال العامل بنماذج رسمية وترقيم آلي معتمد
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setSelectedType('income');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار شهادة محاسبية جديدة</span>
            </button>

            {/* Export list */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={handleExportExcel}
                title="تصدير سجل الشهادات إلى Excel"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/30"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={printDocument}
                title="طباعة"
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Types Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div
            onClick={() => {
              setSelectedType('income');
              setIsAddModalOpen(true);
            }}
            className="bg-slate-950/60 hover:bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                1. شهادات إثبات الدخل
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              إثبات صافي الدخل السنوي والشهري للبنوك، التمويل العقاري، المرور، والجهات الحكومية
            </p>
            <div className="mt-3 text-xs font-mono text-purple-400 font-bold">
              {certificates.filter((c) => c.certificateType === 'income').length} شهادة صادرة
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedType('invested_capital');
              setIsAddModalOpen(true);
            }}
            className="bg-slate-950/60 hover:bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                2. شهادات رأس المال المستثمر
              </span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              حصر وتقييم الأصول الثابتة والمتداولة المستثمرة بالنشاط بعد المعاينة الميدانية
            </p>
            <div className="mt-3 text-xs font-mono text-sky-400 font-bold">
              {certificates.filter((c) => c.certificateType === 'invested_capital').length} شهادة صادرة
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedType('working_capital');
              setIsAddModalOpen(true);
            }}
            className="bg-slate-950/60 hover:bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                3. شهادات رأس المال العامل
              </span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              قياس صافي رأس المال العامل (الأصول - الالتزامات المتداولة) ومعدلات ونسب السيولة
            </p>
            <div className="mt-3 text-xs font-mono text-amber-400 font-bold">
              {certificates.filter((c) => c.certificateType === 'working_capital').length} شهادة صادرة
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالرقم المسلسل، العميل، الجهة الموجه إليها..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">كل أنواع الشهادات</option>
            <option value="income">شهادات إثبات الدخل</option>
            <option value="invested_capital">شهادات رأس المال المستثمر</option>
            <option value="working_capital">شهادات رأس المال العامل</option>
          </select>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">كل العملاء</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.clientCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Certificates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCertificates.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-medium">لا توجد شهادات محاسبية مطابقة للبحث في الأرشيف</p>
          </div>
        ) : (
          filteredCertificates.map((cert) => {
            const isIncome = cert.certificateType === 'income';
            const isInvested = cert.certificateType === 'invested_capital';

            return (
              <div
                key={cert.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg relative group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isInvested
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isIncome
                        ? 'شهادة إثبات صافي الدخل'
                        : isInvested
                        ? 'شهادة رأس المال المستثمر'
                        : 'شهادة رأس المال العامل'}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-400">
                      {cert.serialNumber}
                    </span>
                  </div>

                  {/* Client & Party */}
                  <h3 className="text-base font-bold text-white font-tajawal mb-1 line-clamp-1">
                    {cert.clientName}
                  </h3>
                  <div className="text-xs text-slate-400 line-clamp-1 mb-3">
                    موجهة إلى: <strong className="text-slate-200">{cert.issuedToParty}</strong>
                  </div>

                  {/* Financial Value Highlight Box */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                    {isIncome && cert.incomeData && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">صافي الدخل السنوي:</span>
                          <strong className="text-emerald-400 font-mono">
                            {cert.incomeData.netAnnualIncome.toLocaleString()} ج.م
                          </strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>متوسط شهري:</span>
                          <span className="font-mono">{cert.incomeData.averageMonthlyIncome.toLocaleString()} ج.م</span>
                        </div>
                      </>
                    )}

                    {isInvested && cert.investedCapitalData && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">إجمالي رأس المال المستثمر:</span>
                          <strong className="text-sky-400 font-mono">
                            {cert.investedCapitalData.totalInvestedCapital.toLocaleString()} ج.م
                          </strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>تاريخ المعاينة:</span>
                          <span className="font-mono">{cert.investedCapitalData.inspectionDate}</span>
                        </div>
                      </>
                    )}

                    {cert.certificateType === 'working_capital' && cert.workingCapitalData && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">صافي رأس المال العامل:</span>
                          <strong className="text-amber-400 font-mono">
                            {cert.workingCapitalData.netWorkingCapital.toLocaleString()} ج.م
                          </strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>نسبة التداول:</span>
                          <span className="font-mono">{cert.workingCapitalData.currentRatio} : 1</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>تاريخ الإصدار: {cert.issueDate}</span>
                    <span>سجل: 44887</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewCert(cert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-purple-500/30"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة وطباعة</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportSingleCertWord(cert)}
                      title="تصدير الشهادة إلى Word (.docx)"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCert(cert.id, cert.serialNumber)}
                      title="حذف الشهادة"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Issue New Certificate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-tajawal">
                  إصدار شهادة محاسبية جديدة معتمدة
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Type Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اختر نوع الشهادة المحاسبية المراد إصدارها:
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedType('income')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                      selectedType === 'income'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    شهادة إثبات الدخل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('invested_capital')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                      selectedType === 'invested_capital'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    شهادة رأس المال المستثمر
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('working_capital')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                      selectedType === 'working_capital'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    شهادة رأس المال العامل
                  </button>
                </div>
              </div>

              {/* Client & Issue Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    العميل الصادر له الشهادة *
                  </label>
                  <select
                    required
                    value={baseForm.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.clientCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    تاريخ إصدار الشهادة *
                  </label>
                  <input
                    type="date"
                    required
                    value={baseForm.issueDate}
                    onChange={(e) => setBaseForm({ ...baseForm, issueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Issued To Party & Fiscal Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    الجهة الموجه إليها الشهادة *
                  </label>
                  <input
                    type="text"
                    required
                    value={baseForm.issuedToParty}
                    onChange={(e) => setBaseForm({ ...baseForm, issuedToParty: e.target.value })}
                    placeholder="مثال: السادة / البنك الأهلي المصري - فرع المهندسين"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    الفترة المحاسبية والمالية *
                  </label>
                  <input
                    type="text"
                    required
                    value={baseForm.fiscalPeriod}
                    onChange={(e) => setBaseForm({ ...baseForm, fiscalPeriod: e.target.value })}
                    placeholder="مثال: السنة المالية المنتهية في 31/12/2025"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  الغرض من استخراج الشهادة *
                </label>
                <input
                  type="text"
                  required
                  value={baseForm.purpose}
                  onChange={(e) => setBaseForm({ ...baseForm, purpose: e.target.value })}
                  placeholder="مثال: لتقديمها للبنك بغرض فتح اعتماد مستندي والحصول على تسهيلات ائتمانية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Type-Specific Fields Box */}
              {selectedType === 'income' && (
                <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-900/40 space-y-3">
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>بيانات وحسابات شهادة إثبات الدخل:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">إجمالي الإيرادات السنوية (ج.م):</label>
                      <input
                        type="number"
                        value={incomeData.grossAnnualRevenue}
                        onChange={(e) => handleIncomeRevenueChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">إجمالي المصروفات والتكاليف (ج.م):</label>
                      <input
                        type="number"
                        value={incomeData.annualExpenses}
                        onChange={(e) => handleIncomeExpensesChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-emerald-400 mb-1 font-bold">صافي الدخل السنوي المحسوب (ج.م):</label>
                      <input
                        type="number"
                        readOnly
                        value={incomeData.netAnnualIncome}
                        className="w-full bg-slate-950/80 border border-emerald-500/40 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-emerald-400 mb-1 font-bold">متوسط الدخل الشهري المحسوب (ج.م):</label>
                      <input
                        type="number"
                        readOnly
                        value={incomeData.averageMonthlyIncome}
                        className="w-full bg-slate-950/80 border border-emerald-500/40 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">بيان مصادر الدخل وطبيعة النشاط:</label>
                    <input
                      type="text"
                      value={incomeData.revenueSourceDescription}
                      onChange={(e) => setIncomeData({ ...incomeData, revenueSourceDescription: e.target.value })}
                      placeholder="إيرادات مبيعات وخدمات تجارية"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'invested_capital' && (
                <div className="bg-sky-950/20 p-4 rounded-xl border border-sky-900/40 space-y-3">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>بيانات وحسابات شهادة رأس المال المستثمر:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">الأصول الثابتة (آلات وتجهيزات):</label>
                      <input
                        type="number"
                        value={investedCapitalData.fixedAssetsValue}
                        onChange={(e) => handleInvestedFixedChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">الأصول المتداولة المستثمرة:</label>
                      <input
                        type="number"
                        value={investedCapitalData.currentAssetsValue}
                        onChange={(e) => handleInvestedCurrentChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-sky-400 mb-1 font-bold">إجمالي رأس المال المستثمر:</label>
                      <input
                        type="number"
                        readOnly
                        value={investedCapitalData.totalInvestedCapital}
                        className="w-full bg-slate-950/80 border border-sky-500/40 rounded-lg px-3 py-2 text-sm text-sky-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">تاريخ المعاينة الميدانية:</label>
                      <input
                        type="date"
                        value={investedCapitalData.inspectionDate}
                        onChange={(e) =>
                          setInvestedCapitalData({ ...investedCapitalData, inspectionDate: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">ملاحظات المعاينة:</label>
                      <input
                        type="text"
                        value={investedCapitalData.inspectionDetails}
                        onChange={(e) =>
                          setInvestedCapitalData({ ...investedCapitalData, inspectionDetails: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'working_capital' && (
                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-900/40 space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span>بيانات وحسابات شهادة رأس المال العامل والسيولة:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">الأصول المتداولة (ج.م):</label>
                      <input
                        type="number"
                        value={workingCapitalData.currentAssets}
                        onChange={(e) => handleWorkingAssetsChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">الالتزامات والخصوم المتداولة (ج.م):</label>
                      <input
                        type="number"
                        value={workingCapitalData.currentLiabilities}
                        onChange={(e) => handleWorkingLiabChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-400 mb-1 font-bold">صافي رأس المال العامل المحسوب:</label>
                      <input
                        type="number"
                        readOnly
                        value={workingCapitalData.netWorkingCapital}
                        className="w-full bg-slate-950/80 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-400 mb-1 font-bold">نسبة التداول (Current Ratio):</label>
                      <input
                        type="number"
                        readOnly
                        value={workingCapitalData.currentRatio}
                        className="w-full bg-slate-950/80 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition-colors cursor-pointer"
                >
                  اعتماد الشهادة وحفظها بالأرشيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Full Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-300">
                  معاينة الشهادة الرسمية المعتمدة ({previewCert.serialNumber})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSingleCertWord(previewCert)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تصدير Word (.docx)</span>
                </button>
                <button
                  onClick={printDocument}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الشهادة / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Certificate Paper */}
            <div className="p-8 overflow-y-auto max-h-[80vh] bg-slate-950">
              <div className="bg-white text-slate-900 p-10 rounded-xl shadow-2xl border-4 border-double border-slate-800 font-serif max-w-3xl mx-auto space-y-6">
                {/* Official Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="text-right">
                    <h3 className="text-xs text-slate-700 font-bold">مكتب المحاسب والمراجع القانوني</h3>
                    <h1 className="text-2xl font-extrabold text-slate-900">محمود الباز قابيل</h1>
                    <p className="text-xs text-slate-700 font-semibold">
                      سجل المحاسبين والمراجعين بوزارة المالية رقم: <strong>44887</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      عضو جمعية المحاسبين والمراجعين المصرية | خبير ضرائب واستشارات مالية
                    </p>
                  </div>

                  <div className="text-left space-y-1">
                    <div className="border border-slate-900 px-3 py-1 font-mono font-bold text-xs bg-slate-50">
                      {previewCert.serialNumber}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      التاريخ: {previewCert.issueDate}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      كود العميل: {previewCert.clientId}
                    </div>
                  </div>
                </div>

                {/* Certificate Title Badge */}
                <div className="text-center py-2">
                  <span className="inline-block border-2 border-slate-900 px-8 py-2 text-lg font-bold bg-slate-100 rounded-md">
                    {previewCert.certificateType === 'income'
                      ? 'شهادة إثبات صافي الدخل السنوي والشهري'
                      : previewCert.certificateType === 'invested_capital'
                      ? 'شهادة إثبات وتحديد رأس المال المستثمر'
                      : 'شهادة تحديد صافي رأس المال العامل ومؤشرات السيولة'}
                  </span>
                </div>

                {/* Addressed To */}
                <div className="text-sm font-semibold text-slate-800">
                  السادة / {previewCert.issuedToParty}
                  <div className="text-xs text-slate-600 font-normal mt-0.5">تحية طيبة وبعد ،،،</div>
                </div>

                {/* Body Text */}
                <div className="text-sm text-slate-800 leading-relaxed text-justify space-y-4">
                  <p>
                    يشهد مكتبنا المحاسبي بصفتنا المحاسب والمراجع القانوني للمنشأة / <strong>{previewCert.clientName}</strong>،
                    وبعد الفحص والمراجعة المستندية الدقيقة للدفاتر والسجلات المحاسبية والفواتير المعتمدة عن الفترة المالية: <strong>{previewCert.fiscalPeriod}</strong>،
                    نفيد ونشهد بالآتي:
                  </p>

                  {/* Financial Values Table */}
                  {previewCert.certificateType === 'income' && previewCert.incomeData && (
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <tbody>
                        <tr className="bg-slate-100">
                          <td className="p-2.5 border border-slate-300 font-bold w-1/2">إجمالي الإيرادات السنوية التقديرية / الفعلية:</td>
                          <td className="p-2.5 border border-slate-300 font-bold font-mono text-sky-800">
                            {previewCert.incomeData.grossAnnualRevenue.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300">إجمالي التكاليف والمصروفات السنوية:</td>
                          <td className="p-2.5 border border-slate-300 font-mono">
                            {previewCert.incomeData.annualExpenses.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr className="bg-emerald-50">
                          <td className="p-3 border border-slate-300 font-extrabold text-emerald-900 text-sm">
                            صافي الدخل والأرباح السنوية:
                          </td>
                          <td className="p-3 border border-slate-300 font-extrabold font-mono text-emerald-900 text-sm">
                            {previewCert.incomeData.netAnnualIncome.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-2.5 border border-slate-300 font-bold text-slate-900">
                            متوسط صافي الدخل الشهري:
                          </td>
                          <td className="p-2.5 border border-slate-300 font-bold font-mono text-slate-900">
                            {previewCert.incomeData.averageMonthlyIncome.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {previewCert.certificateType === 'invested_capital' && previewCert.investedCapitalData && (
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <tbody>
                        <tr className="bg-slate-100">
                          <td className="p-2.5 border border-slate-300 font-bold w-1/2">قيمة الأصول الثابتة المستثمرة (آلات وتجهيزات ومعدات):</td>
                          <td className="p-2.5 border border-slate-300 font-bold font-mono text-sky-800">
                            {previewCert.investedCapitalData.fixedAssetsValue.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300">قيمة الأصول المتداولة المستثمرة (مخزون ونقدية ومدينون):</td>
                          <td className="p-2.5 border border-slate-300 font-mono">
                            {previewCert.investedCapitalData.currentAssetsValue.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr className="bg-emerald-50">
                          <td className="p-3 border border-slate-300 font-extrabold text-emerald-900 text-sm">
                            إجمالي رأس المال المستثمر الفعلي بالنشاط:
                          </td>
                          <td className="p-3 border border-slate-300 font-extrabold font-mono text-emerald-900 text-sm">
                            {previewCert.investedCapitalData.totalInvestedCapital.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {previewCert.certificateType === 'working_capital' && previewCert.workingCapitalData && (
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <tbody>
                        <tr className="bg-slate-100">
                          <td className="p-2.5 border border-slate-300 font-bold w-1/2">إجمالي الأصول المتداولة (Current Assets):</td>
                          <td className="p-2.5 border border-slate-300 font-bold font-mono text-sky-800">
                            {previewCert.workingCapitalData.currentAssets.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300">إجمالي الالتزامات والخصوم المتداولة (Current Liabilities):</td>
                          <td className="p-2.5 border border-slate-300 font-mono text-rose-800">
                            {previewCert.workingCapitalData.currentLiabilities.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr className="bg-emerald-50">
                          <td className="p-3 border border-slate-300 font-extrabold text-emerald-900 text-sm">
                            صافي رأس المال العامل (الأصول - الالتزامات):
                          </td>
                          <td className="p-3 border border-slate-300 font-extrabold font-mono text-emerald-900 text-sm">
                            {previewCert.workingCapitalData.netWorkingCapital.toLocaleString()} جنيهاً مصرياً
                          </td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-2.5 border border-slate-300 font-bold text-slate-900">
                            نسبة التداول والسيولة السريعة:
                          </td>
                          <td className="p-2.5 border border-slate-300 font-bold font-mono text-slate-900">
                            {previewCert.workingCapitalData.currentRatio} : 1
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  <p>
                    <strong>الغرض من إصدار الشهادة:</strong> {previewCert.purpose}
                  </p>

                  <p className="text-[11px] text-slate-500 italic">
                    * صدرت هذه الشهادة بناءً على طلب المنشأة ومسؤوليتها التامة عن صحة المستندات والبيانات المقدمة، ودون أدنى مسؤولية أو التزام مالي على مكتبنا تجاه الغير، وهي صالحة للتقديم إلى الجهة الموجهة إليها فقط.
                  </p>
                </div>

                {/* Signatures & Official Office Stamp */}
                <div className="pt-8 border-t-2 border-slate-900 flex justify-between items-end">
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>رمز التحقق: <span className="font-mono font-bold text-slate-900">{previewCert.serialNumber}</span></div>
                    <div>تاريخ الاعتماد: {previewCert.issueDate}</div>
                    <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>شهادة رسمية صادرة ومسجلة بالأرشيف الإلكتروني للمكتب</span>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-800 p-4 rounded-xl text-center bg-slate-50 min-w-[220px]">
                    <div className="text-xs text-slate-700 font-bold">المحاسب والمراجع القانوني</div>
                    <div className="text-lg font-extrabold text-slate-900 my-0.5">محمود الباز قابيل</div>
                    <div className="text-xs text-slate-800 font-semibold">س.م.م 44887</div>
                    <div className="text-[10px] text-slate-500 mt-2 font-mono">(خاتم وتوقيع الاعتماد الرسمي)</div>
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
