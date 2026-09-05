import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Building2,
  CheckCircle2,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Plus,
  Printer,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
  FileCheck,
  Scale,
  Briefcase,
  Landmark,
  BadgePercent,
  Calculator,
  HelpCircle,
} from 'lucide-react';
import { db } from '../services/db';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import {
  AccountingCertificate,
  CertificateType,
  ClientArchive,
  IncomeCertificateData,
  InvestedCapitalCertificateData,
  WorkingCapitalCertificateData,
  FinancialSolvencyCertificateData,
  ProfessionalRevenuesExpensesData,
  BankAuditCertificateData,
  AssetValuationData,
  TaxClearanceCertificateData,
} from '../types/office';
import { exportToExcel, exportToWordDoc, printDocument } from '../utils/exportUtils';
import { exportElementToPDF } from '../utils/pdfExport';
import { printA4Document } from '../utils/printA4Document';
import { tafqeetCurrency } from '../utils/tafqeet';
import { generateQrCodeDataUrl, getCertificateVerificationUrl } from '../utils/qrCode';
import { DigitalVerifiedCertificateView } from './DigitalVerifiedCertificateView';
import { CertificateVerificationCenterModal } from './CertificateVerificationCenterModal';

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
  const [digitalViewCert, setDigitalViewCert] = useState<AccountingCertificate | null>(null);
  const [certToDelete, setCertToDelete] = useState<{ id: string; serial: string } | null>(null);
  const [isVerificationCenterOpen, setIsVerificationCenterOpen] = useState(false);
  const [verificationSearchSerial, setVerificationSearchSerial] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [previewQrCodeUrl, setPreviewQrCodeUrl] = useState<string>('');
  const certPaperRef = useRef<HTMLDivElement>(null);

  // Synchronize a4-modal-open on document.body for zero-bleed certificate print isolation
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (previewCert) {
      document.body.classList.add('a4-modal-open');
    } else {
      document.body.classList.remove('a4-modal-open');
    }
    return () => {
      document.body.classList.remove('a4-modal-open');
    };
  }, [previewCert]);

  // Direct DOM isolation on beforeprint/afterprint when certificate is open
  useEffect(() => {
    if (!previewCert || typeof window === 'undefined') return;

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
  }, [previewCert]);

  // Active form type
  const [selectedType, setSelectedType] = useState<CertificateType>('income_no_tax');

  // Form Base State
  const initialBaseForm = {
    clientId: initialClientId || (clients[0]?.id ?? ''),
    clientName: clients.find((c) => c.id === initialClientId)?.name || (clients[0]?.name ?? 'طارق حسام الدين عبدالحميد'),
    nationalId: '29011150103987',
    address: 'محافظة الجيزة - 15 شارع فيصل الرئيسي',
    profession: 'أعمال استشارات تقنية حرة وتطوير برمجيات',
    facilityName: '',
    hasTaxCard: false,
    entityCategory: 'individual' as 'individual' | 'company',
    taxFileNumber: '',
    taxCardNumber: '',
    commercialReg: '',
    taxOffice: 'مأمورية ضرائب الجيزة ثان',
    certificateTitle: 'شهادة إثبات دخل لأفراد (بدون بطاقة ضريبية)',
    issueDate: new Date().toISOString().split('T')[0],
    fiscalPeriod: 'عن عام 2025 ومتوسط الدخل الشهري الحالي',
    issuedToParty: 'السادة / بنك مصر - إدارة التمويل العقاري والقروض الشخصية',
    purpose: 'استيفاء اشتراطات الحصول على تمويل عقاري وفق مبادرة البنك المركزي',
    basisOfCalculation: 'بناءً على فحص حركة المعاملات البنكية وإقرار صاحب الشأن بمصادر دخله الحرة والمعاينة الميدانية لمقر عمله الحر',
    notes: '',
  };

  const [baseForm, setBaseForm] = useState(initialBaseForm);

  // 1. Income Data State (With or without tax card)
  const [incomeData, setIncomeData] = useState<IncomeCertificateData>({
    hasTaxCard: false,
    grossAnnualRevenue: 540000,
    annualExpenses: 120000,
    netAnnualIncome: 420000,
    averageMonthlyIncome: 35000,
    revenueSourceDescription: 'إيرادات النشاط الحر والأعمال التقنية الحرة',
    evidenceType: 'bank_statements',
  });

  // 2. Invested Capital Data State (Companies and Individuals)
  const [investedCapitalData, setInvestedCapitalData] = useState<InvestedCapitalCertificateData>({
    entityCategory: 'company',
    fixedAssetsValue: 6500000,
    currentAssetsValue: 3800000,
    inventoryValue: 2100000,
    cashAndBanksValue: 1200000,
    receivablesValue: 500000,
    totalInvestedCapital: 10300000,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionDetails: 'تمت المعاينة الميدانية للمقر والآلات والمخازن وفحص فواتير الشراء وأذون الإضافة المخزنية',
  });

  // 3. Financial Solvency Data State
  const [solvencyData, setSolvencyData] = useState<FinancialSolvencyCertificateData>({
    totalOwnedAssets: 18500000,
    totalLiabilities: 4200000,
    netSolvencyEquity: 14300000,
    annualOperatingTurnover: 28000000,
    availableCashLiquidity: 5100000,
    solvencyRatio: 4.4,
    tenderTitle: 'المناقصة العامة رقم 8 لتوريد المعدات الكهربائية',
    solvencyAssessment: 'تتمتع المنشأة بملاءة مالية فائقة وتدفقات نقدية قوية وخالية من أي حجوزات أو تعثر مالي.',
  });

  // 4. Professional Revenues and Expenses State
  const [professionalData, setProfessionalData] = useState<ProfessionalRevenuesExpensesData>({
    syndicateName: 'نقابة المهن الهندسية',
    syndicateCardNumber: '148920/استشاري',
    clinicOrOfficeName: 'مكتب الدلتا للاستشارات الهندسية والتصميمات',
    professionalGrossRevenue: 1800000,
    operatingExpenses: 550000,
    netProfessionalIncome: 1250000,
    averageMonthlyProfessionalIncome: 104166,
  });

  // 5. Working Capital State
  const [workingCapitalData, setWorkingCapitalData] = useState<WorkingCapitalCertificateData>({
    currentAssets: 8600000,
    currentLiabilities: 3200000,
    netWorkingCapital: 5400000,
    currentRatio: 2.68,
    workingCapitalRatio: 2.68,
    analysisSummary: 'مؤشرات سيولة آمنة ورأس مال عامل يغطي الالتزامات قصيرة الأجل بمعدل 2.68 مرة',
  });

  const refreshData = () => {
    setCertificates(db.getCertificates());
    setClients(db.getClientArchives());
  };

  // Generate QR Code whenever previewCert changes
  useEffect(() => {
    if (previewCert) {
      const publicUrl = getCertificateVerificationUrl(previewCert.serialNumber);
      generateQrCodeDataUrl(publicUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#09090b', light: '#ffffff' },
      }).then((dataUrl) => {
        setPreviewQrCodeUrl(dataUrl);
      });
    } else {
      setPreviewQrCodeUrl('');
    }
  }, [previewCert]);

  // Recalculate Income Totals automatically
  const handleIncomeRevenueChange = (revenue: number) => {
    const expenses = incomeData.annualExpenses;
    const net = Math.max(0, revenue - expenses);
    setIncomeData({
      ...incomeData,
      grossAnnualRevenue: revenue,
      netAnnualIncome: net,
      averageMonthlyIncome: Math.round(net / 12),
    });
  };

  const handleIncomeExpensesChange = (expenses: number) => {
    const revenue = incomeData.grossAnnualRevenue || 0;
    const net = Math.max(0, revenue - expenses);
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

  // Recalculate Solvency automatically
  const handleSolvencyAssetsChange = (assets: number) => {
    const liab = solvencyData.totalLiabilities;
    const equity = Math.max(0, assets - liab);
    const ratio = liab > 0 ? Number((assets / liab).toFixed(2)) : assets > 0 ? 99 : 0;
    setSolvencyData({
      ...solvencyData,
      totalOwnedAssets: assets,
      netSolvencyEquity: equity,
      solvencyRatio: ratio,
    });
  };

  const handleSolvencyLiabChange = (liab: number) => {
    const assets = solvencyData.totalOwnedAssets;
    const equity = Math.max(0, assets - liab);
    const ratio = liab > 0 ? Number((assets / liab).toFixed(2)) : assets > 0 ? 99 : 0;
    setSolvencyData({
      ...solvencyData,
      totalLiabilities: liab,
      netSolvencyEquity: equity,
      solvencyRatio: ratio,
    });
  };

  // Recalculate Professional Revenues automatically
  const handleProfessionalGrossChange = (gross: number) => {
    const exp = professionalData.operatingExpenses;
    const net = Math.max(0, gross - exp);
    setProfessionalData({
      ...professionalData,
      professionalGrossRevenue: gross,
      netProfessionalIncome: net,
      averageMonthlyProfessionalIncome: Math.round(net / 12),
    });
  };

  const handleProfessionalExpChange = (exp: number) => {
    const gross = professionalData.professionalGrossRevenue;
    const net = Math.max(0, gross - exp);
    setProfessionalData({
      ...professionalData,
      operatingExpenses: exp,
      netProfessionalIncome: net,
      averageMonthlyProfessionalIncome: Math.round(net / 12),
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
        c.issuedToParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nationalId && c.nationalId.includes(searchTerm));

      const matchType =
        filterType === 'all' ||
        c.certificateType === filterType ||
        (filterType === 'income_all' &&
          (c.certificateType === 'income' ||
            c.certificateType === 'income_no_tax' ||
            c.certificateType === 'income_with_tax'));

      const matchClient = filterClient === 'all' || c.clientId === filterClient;

      return matchSearch && matchType && matchClient;
    });
  }, [certificates, searchTerm, filterType, filterClient]);

  // Handle Client selection in form
  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      const hasTax = Boolean(found.taxCardNumber || found.taxFileNumber);
      setBaseForm({
        ...baseForm,
        clientId,
        clientName: found.name,
        facilityName: found.commercialName || found.name,
        taxFileNumber: found.taxFileNumber || '',
        taxCardNumber: found.taxCardNumber || '',
        commercialReg: found.commercialRegistryNumber || '',
        address: found.address || '',
        profession: found.legalForm || 'تاجر ومستثمر',
        hasTaxCard: hasTax,
      });
    } else {
      setBaseForm({
        ...baseForm,
        clientId,
        clientName: '',
      });
    }
  };

  // Switch type and set appropriate default title
  const handleTypeSelect = (type: CertificateType) => {
    setSelectedType(type);
    let title = '';
    let basis = '';
    let hasTax = baseForm.hasTaxCard;

    switch (type) {
      case 'income_no_tax':
        title = 'شهادة إثبات دخل لأفراد (بدون بطاقة ضريبية)';
        basis = 'بناءً على فحص حركة المعاملات البنكية وإقرار صاحب الشأن بمصادر دخله الحرة والمعاينة الميدانية لمقر عمله الحر';
        hasTax = false;
        break;
      case 'income_with_tax':
        title = 'شهادة إثبات دخل لأفراد (ببطاقة ضريبية)';
        basis = 'بناءً على فحص الدفاتر المحاسبية المنتظمة، وفواتير المبيعات الإلكترونية، والإقرارات الضريبية المقدمة لمصلحة الضرائب المصرية';
        hasTax = true;
        break;
      case 'invested_capital':
        title = 'شهادة إثبات وتحديد رأس المال المستثمر للشركات والأفراد';
        basis = 'طبقاً لمعاينة مقر النشاط وخطوط الإنتاج وفحص سجل الأصول الثابتة وفواتير الشراء وجرد المخزون';
        break;
      case 'financial_solvency':
        title = 'شهادة القدرة المالية والملاءة المالية';
        basis = 'بناءً على فحص الميزانيات المعتمدة وشهادات الأرصدة البنكية ومطابقة الأصول والالتزامات';
        break;
      case 'revenue_expenses':
        title = 'شهادة إيرادات ومصروفات مهنية (أصحاب المهن الحرة)';
        basis = 'بناءً على فحص إيصالات وسجلات الإيرادات والمصروفات المهنية والإقرار الضريبي للمهن غير التجارية';
        break;
      case 'working_capital':
        title = 'شهادة رأس المال العامل ومؤشرات السيولة';
        basis = 'مستخرجة من ميزان المراجعة وقائمة المركز المالي بعد فحص الأصول والخصوم المتداولة';
        break;
      case 'audit_bank_facility':
        title = 'شهادة فحص وتدقيق للتمويل والتسهيلات البنكية';
        basis = 'بناءً على دراسة الجدارة الائتمانية والتدفقات النقدية التاريخية والمتوقعة وكشوف الحسابات البنكية';
        break;
      default:
        title = 'شهادة محاسبية مهنية معتمدة';
        basis = 'بناءً على الفحص والمراجعة المحاسبية للمستندات والبيانات المؤيدة المقدمة إلينا';
        break;
    }

    setBaseForm({
      ...baseForm,
      certificateTitle: title,
      basisOfCalculation: basis,
      hasTaxCard: hasTax,
    });
  };

  // Save Certificate
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseForm.clientName || !baseForm.issuedToParty) {
      alert('يرجى كتابة اسم العميل وتحديد الجهة الموجه إليها الشهادة');
      return;
    }

    const payload: Omit<AccountingCertificate, 'id' | 'serialNumber' | 'createdAt'> = {
      clientId: baseForm.clientId,
      clientName: baseForm.clientName,
      certificateType: selectedType,
      certificateTitle: baseForm.certificateTitle,
      nationalId: baseForm.nationalId,
      address: baseForm.address,
      profession: baseForm.profession,
      facilityName: baseForm.facilityName,
      hasTaxCard: selectedType === 'income_no_tax' ? false : selectedType === 'income_with_tax' ? true : baseForm.hasTaxCard,
      entityCategory: baseForm.entityCategory,
      taxFileNumber: baseForm.taxFileNumber,
      taxCardNumber: baseForm.taxCardNumber,
      commercialReg: baseForm.commercialReg,
      taxOffice: baseForm.taxOffice,
      issueDate: baseForm.issueDate,
      fiscalPeriod: baseForm.fiscalPeriod,
      issuedToParty: baseForm.issuedToParty,
      purpose: baseForm.purpose,
      basisOfCalculation: baseForm.basisOfCalculation,
      grossAnnualRevenue: selectedType === 'income_no_tax' || selectedType === 'income_with_tax' || selectedType === 'income' ? incomeData.grossAnnualRevenue : undefined,
      netAnnualIncome: selectedType === 'income_no_tax' || selectedType === 'income_with_tax' || selectedType === 'income' ? incomeData.netAnnualIncome : undefined,
      averageMonthlyIncome: selectedType === 'income_no_tax' || selectedType === 'income_with_tax' || selectedType === 'income' ? incomeData.averageMonthlyIncome : undefined,
      incomeData: selectedType === 'income_no_tax' || selectedType === 'income_with_tax' || selectedType === 'income' ? incomeData : undefined,
      investedCapitalData: selectedType === 'invested_capital' ? investedCapitalData : undefined,
      solvencyData: selectedType === 'financial_solvency' ? solvencyData : undefined,
      professionalData: selectedType === 'revenue_expenses' ? professionalData : undefined,
      workingCapitalData: selectedType === 'working_capital' ? workingCapitalData : undefined,
      auditorName: 'المحاسب القانوني',
      auditorTitle: 'محاسب ومراجع قانوني',
      auditorRegisterNumber: auditorStatement.registerNumber || '44887',
      notes: baseForm.notes,
    };

    const newCert = db.addCertificate(payload);
    refreshData();
    setIsAddModalOpen(false);
    setPreviewCert(newCert);
  };

  const handleDeleteCert = (id: string, serial: string) => {
    setCertToDelete({ id, serial });
  };

  const confirmDeleteCert = () => {
    if (!certToDelete) return;
    db.deleteCertificate(certToDelete.id);
    refreshData();
    setCertToDelete(null);
  };

  // Export List to Excel
  const handleExportExcel = () => {
    const data = filteredCertificates.map((c) => {
      let mainValue = '';
      if (c.certificateType === 'income' || c.certificateType === 'income_no_tax' || c.certificateType === 'income_with_tax') {
        mainValue = `صافي الدخل السنوي: ${(c.incomeData?.netAnnualIncome ?? c.netAnnualIncome ?? 0).toLocaleString()} ج.م`;
      } else if (c.certificateType === 'invested_capital') {
        mainValue = `رأس المال المستثمر: ${(c.investedCapitalData?.totalInvestedCapital ?? c.totalInvestedCapital ?? 0).toLocaleString()} ج.م`;
      } else if (c.certificateType === 'financial_solvency') {
        mainValue = `صافي الملاءة وحقوق الملكية: ${(c.solvencyData?.netSolvencyEquity ?? 0).toLocaleString()} ج.م`;
      } else if (c.certificateType === 'revenue_expenses') {
        mainValue = `صافي الإيراد المهني: ${(c.professionalData?.netProfessionalIncome ?? 0).toLocaleString()} ج.م`;
      } else {
        mainValue = `صافي رأس المال العامل: ${(c.workingCapitalData?.netWorkingCapital ?? 0).toLocaleString()} ج.م`;
      }

      return {
        'الرقم التسلسلي': c.serialNumber,
        'عنوان الشهادة': c.certificateTitle || c.certificateType,
        'اسم العميل / الصادر لصالحه': c.clientName,
        'الرقم القومي': c.nationalId || '-',
        'العنوان': c.address || '-',
        'المهنة / النشاط': c.profession || '-',
        'الموقف الضريبي': c.taxCardNumber || c.taxFileNumber ? 'مسجل ضريبياً' : 'أفراد بدون بطاقة ضريبية',
        'تاريخ الإصدار': c.issueDate,
        'الفترة المالية / المحاسبية': c.fiscalPeriod,
        'الجهة الموجه إليها': c.issuedToParty,
        'الغرض من الشهادة': c.purpose,
        'القيم المالية المعتمدة': mainValue,
        'المحاسب القانوني': 'يعتمد المحاسب القانوني',
        'سجل م.م': c.auditorRegisterNumber || '44887',
      };
    });

    exportToExcel(data, `سجل_الشهادات_المحاسبية_المعتمدة_${new Date().toISOString().split('T')[0]}`);
  };

  // Export Single Certificate to Word Doc
  const handleExportSingleCertWord = (cert: AccountingCertificate) => {
    const netIncome = cert.incomeData?.netAnnualIncome ?? cert.netAnnualIncome ?? (cert.annualNetIncome || 0);
    const tafqeetText = tafqeetCurrency(netIncome);

    const docContent = `
      <div style="direction: rtl; font-family: Cairo, Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <h3>مكتب المحاسب والمراجع القانوني</h3>
          <p>سجل المحاسبين والمراجعين بوزارة المالية رقم: ${cert.auditorRegisterNumber || auditorStatement.registerNumber || '44887'}</p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <h2 style="display: inline-block; border: 2px solid #000; padding: 8px 25px;">${cert.certificateTitle || 'شهادة محاسبية معتمدة'}</h2>
        </div>

        <p><strong>السادة / ${cert.issuedToParty}</strong></p>
        <p>تحية طيبة وبعد ،،،</p>

        <p style="line-height: 2; text-align: justify;">
          يشهد مكتب المحاسب والمراجع القانوني، والمقيد بسجل المحاسبين والمراجعين بوزارة المالية، بأن:
        </p>

        <div style="background-color: #f9f9f9; border: 1px solid #ccc; padding: 15px; margin: 15px 0; line-height: 1.8;">
          <p>• <strong>الاسم:</strong> ${cert.clientName}</p>
          <p>• <strong>الرقم القومي:</strong> ${cert.nationalId || '________________'}</p>
          <p>• <strong>العنوان:</strong> ${cert.address || '________________'}</p>
          <p>• <strong>المهنة / النشاط:</strong> ${cert.profession || 'أعمال حرة'}</p>
          ${cert.facilityName ? `<p>• <strong>اسم المنشأة:</strong> ${cert.facilityName}</p>` : ''}
          <p>• <strong>الموقف الضريبي:</strong> ${cert.taxCardNumber || cert.taxFileNumber ? `بطاقة ضريبية رقم ${cert.taxCardNumber || cert.taxFileNumber}` : 'أفراد (ليس لديه بطاقة ضريبية - أعمال حرة)'}</p>
        </div>

        <p style="line-height: 2; text-align: justify;">
          وأن صافي دخله السنوي من نشاط (<strong>${cert.profession || 'نشاطه'}</strong>) عن الفترة (<strong>${cert.fiscalPeriod}</strong>)
          هو مبلغ وقدره <strong>{(netIncome || 0).toLocaleString()} جنيهاً مصرياً</strong> (<strong>${tafqeetText}</strong>)،
          بمتوسط صافي دخل شهري قدره <strong>${((cert.incomeData?.averageMonthlyIncome ?? cert.averageMonthlyIncome ?? (netIncome / 12)) || 0).toLocaleString()} ج.م</strong>.
        </p>

        <p><strong>الغرض من الشهادة:</strong> ${cert.purpose || 'لتقديمها إلى الجهة المختصة'}</p>

        <div style="margin-top: 40px; text-align: left; padding: 15px; border: 1px solid #000; width: 260px; float: left;">
          <p style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 30px;">يعتمد المحاسب القانوني</p>
          <div style="height: 60px; border: 1px dashed #999; margin: 10px 0; text-align: center; line-height: 60px; color: #888;">(مكان التوقيع والختم)</div>
          <p style="text-align: center; font-size: 11px;">سجل المحاسبين والمراجعين بوزارة المالية</p>
        </div>
      </div>
    `;

    exportToWordDoc(docContent, `شهادة_${cert.serialNumber}_${cert.clientName}`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl no-print text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-cairo flex items-center gap-2.5">
                <span>إصدار وإدارة الشهادات المحاسبية المعتمدة</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  منظومة QR الإلكترونية
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                إصدار شهادات إثبات الدخل للأفراد (ببطاقة أو بدون)، ورأس المال المستثمر، والملاءة المالية، مع كود QR ومركز تحقق رقمي للعرض فقط
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Open Verification Center Portal */}
          <button
            onClick={() => {
              setVerificationSearchSerial('');
              setIsVerificationCenterOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>مركز التحقق من الشهادات (QR)</span>
          </button>

          {/* Add New Certificate Button */}
          <button
            onClick={() => {
              setBaseForm(initialBaseForm);
              setSelectedType('income_no_tax');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار شهادة جديدة</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير الأرشيف Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 no-print text-zinc-100">
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">إجمالي الشهادات المصدرة</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{certificates.length}</div>
          </div>
          <div className="p-2.5 bg-zinc-900 rounded-lg text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">إثبات دخل للأفراد (بدون بطاقة)</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {certificates.filter((c) => c.certificateType === 'income_no_tax' || (!c.hasTaxCard && c.certificateType === 'income')).length}
            </div>
          </div>
          <div className="p-2.5 bg-zinc-900 rounded-lg text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">رأس المال المستثمر والملاءة</div>
            <div className="text-2xl font-bold text-sky-400 font-mono mt-1">
              {certificates.filter((c) => c.certificateType === 'invested_capital' || c.certificateType === 'financial_solvency').length}
            </div>
          </div>
          <div className="p-2.5 bg-zinc-900 rounded-lg text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">الشهادات الموثقة بكود QR</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {certificates.length} (100%)
            </div>
          </div>
          <div className="p-2.5 bg-zinc-900 rounded-lg text-emerald-400">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الشهادة، اسم العميل، الرقم القومي، أو الجهة..."
              className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة أنواع الشهادات</option>
              <option value="income_no_tax">شهادة إثبات دخل لأفراد (بدون بطاقة ضريبية)</option>
              <option value="income_with_tax">شهادة إثبات دخل لأفراد (ببطاقة ضريبية)</option>
              <option value="invested_capital">شهادة رأس المال المستثمر (شركات وأفراد)</option>
              <option value="financial_solvency">شهادة القدرة المالية والملاءة المالية</option>
              <option value="revenue_expenses">شهادة إيرادات ومصروفات مهنية</option>
              <option value="working_capital">شهادة رأس المال العامل ومؤشرات السيولة</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة العملاء والمنشآت</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl no-print text-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 font-semibold">
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">الرقم التسلسلي</th>
                <th className="p-3.5">عنوان ونوع الشهادة</th>
                <th className="p-3.5">صاحب الشأن / العميل</th>
                <th className="p-3.5">الموقف الضريبي</th>
                <th className="p-3.5">تاريخ الإصدار</th>
                <th className="p-3.5">الجهة الموجه إليها</th>
                <th className="p-3.5 text-left">القيمة المعتمدة</th>
                <th className="p-3.5 text-center w-36">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award className="w-8 h-8 text-zinc-600" />
                      <p className="text-sm font-semibold">لا توجد شهادات مسجلة مطابقة لمعايير البحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert, idx) => {
                  const netIncome = cert.incomeData?.netAnnualIncome ?? cert.netAnnualIncome ?? (cert.annualNetIncome || 0);
                  const isNoTax = cert.certificateType === 'income_no_tax' || (cert.hasTaxCard === false && cert.certificateType === 'income');

                  return (
                    <tr key={cert.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3.5 text-center text-zinc-500 font-mono">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {cert.serialNumber}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-full font-bold text-[11px] inline-block">
                          {cert.certificateTitle || cert.certificateType}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        <div>{cert.clientName}</div>
                        {cert.nationalId && (
                          <div className="text-[11px] text-zinc-400 font-mono font-normal mt-0.5">
                            الرقم القومي: {cert.nationalId}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isNoTax ? (
                          <span className="bg-amber-950/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                            أفراد بدون بطاقة ضريبية
                          </span>
                        ) : cert.taxCardNumber || cert.taxFileNumber ? (
                          <span className="bg-zinc-900 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded font-mono text-[10px]">
                            {cert.taxCardNumber || cert.taxFileNumber}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-zinc-300 whitespace-nowrap">{cert.issueDate}</td>
                      <td className="p-3.5 text-zinc-300 truncate max-w-xs">{cert.issuedToParty}</td>
                      <td className="p-3.5 text-left font-mono font-bold text-white whitespace-nowrap">
                        {cert.certificateType === 'income' || cert.certificateType === 'income_no_tax' || cert.certificateType === 'income_with_tax'
                          ? `${(netIncome || 0).toLocaleString()} ج.م`
                          : cert.certificateType === 'invested_capital'
                          ? `${(cert.investedCapitalData?.totalInvestedCapital ?? cert.totalInvestedCapital ?? 0).toLocaleString()} ج.م`
                          : cert.certificateType === 'financial_solvency'
                          ? `${(cert.solvencyData?.netSolvencyEquity ?? 0).toLocaleString()} ج.م`
                          : `${(cert.workingCapitalData?.netWorkingCapital ?? 0).toLocaleString()} ج.م`}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Digital Read-Only View Button */}
                          <button
                            onClick={() => setDigitalViewCert(cert)}
                            title="عرض النسخة الرقمية المعتمدة للتحقق (للعرض فقط)"
                            className="p-1.5 text-emerald-400 hover:text-white bg-emerald-950/60 hover:bg-emerald-800 border border-emerald-700/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Official Preview & Print Modal */}
                          <button
                            onClick={() => setPreviewCert(cert)}
                            title="معاينة وطباعة الشهادة وتصدير PDF"
                            className="p-1.5 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Word Export */}
                          <button
                            onClick={() => handleExportSingleCertWord(cert)}
                            title="تصدير Word (.docx)"
                            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCert(cert.id, cert.serialNumber)}
                            title="حذف الشهادة"
                            className="p-1.5 text-zinc-500 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Certificate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 text-zinc-100">
            <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base font-cairo">
                    إصدار شهادة محاسبية مهنية معتمدة جديدة
                  </h3>
                  <p className="text-xs text-zinc-400">
                    مذيلة بعبارة "يعتمد المحاسب القانوني" دون كتابة اسم مع توليد كود QR ومركز تحقق رقمي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {/* Certificate Type Selector */}
              <div>
                <label className="block text-zinc-200 font-bold mb-2">
                  اختر نوع الشهادة المهنية المطلوب إصدارها:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {/* 1. Income without tax card */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('income_no_tax')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'income_no_tax'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">إثبات دخل أفراد (بدون بطاقة)</div>
                  </button>

                  {/* 2. Income with tax card */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('income_with_tax')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'income_with_tax'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">إثبات دخل أفراد (ببطاقة ضريبية)</div>
                  </button>

                  {/* 3. Invested Capital */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('invested_capital')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'invested_capital'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">رأس المال المستثمر (شركات وأفراد)</div>
                  </button>

                  {/* 4. Financial Solvency */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('financial_solvency')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'financial_solvency'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Scale className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">القدرة المالية والملاءة</div>
                  </button>

                  {/* 5. Professional Revenues */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('revenue_expenses')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'revenue_expenses'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">إيرادات ومصروفات مهنية</div>
                  </button>

                  {/* 6. Working Capital */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('working_capital')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'working_capital'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Layers className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">رأس المال العامل والسيولة</div>
                  </button>

                  {/* 7. Bank Audit & Facility */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('audit_bank_facility')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'audit_bank_facility'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Landmark className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">فحص وتأييد بنكي وتمويل</div>
                  </button>

                  {/* 8. Custom Professional Certificate */}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('custom')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedType === 'custom'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Award className="w-5 h-5 mb-1" />
                    <div className="text-[11px] leading-tight">شهادة مهنية مخصصة</div>
                  </button>
                </div>
              </div>

              {/* Certificate Title */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  عنوان الشهادة الرسمي (المعتمد في صدر الوثيقة) *
                </label>
                <input
                  type="text"
                  required
                  value={baseForm.certificateTitle}
                  onChange={(e) => setBaseForm({ ...baseForm, certificateTitle: e.target.value })}
                  placeholder="عنوان الشهادة"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Client Selection and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">استيراد بيانات من أرشيف العملاء:</label>
                  <select
                    value={baseForm.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- إدخال حر لعميل جديد --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.commercialName || c.legalForm || 'عميل'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">الاسم الرباعي لصاحب الشأن / العميل *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.clientName}
                    onChange={(e) => setBaseForm({ ...baseForm, clientName: e.target.value })}
                    placeholder="الاسم الرباعي"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* National ID, Profession, Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">الرقم القومي (14 رقم) *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.nationalId}
                    onChange={(e) => setBaseForm({ ...baseForm, nationalId: e.target.value })}
                    placeholder="29011150103987"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">المهنة أو النشاط الحر *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.profession}
                    onChange={(e) => setBaseForm({ ...baseForm, profession: e.target.value })}
                    placeholder="مثال: استشارات تقنية حرة / تاجر ومقاول"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">العنوان ومحل الإقامة بالتفصيل *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.address}
                    onChange={(e) => setBaseForm({ ...baseForm, address: e.target.value })}
                    placeholder="المحافظة - المدينة - الشارع"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Facility & Tax Card toggle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">اسم المنشأة / المحل (إن وجد):</label>
                  <input
                    type="text"
                    value={baseForm.facilityName}
                    onChange={(e) => setBaseForm({ ...baseForm, facilityName: e.target.value })}
                    placeholder="مؤسسة / محل / شركة"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">هل لديه بطاقة ضريبية؟</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!baseForm.hasTaxCard}
                        onChange={() => setBaseForm({ ...baseForm, hasTaxCard: false })}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-zinc-300 text-xs">لا (أفراد بدون بطاقة ضريبية)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={baseForm.hasTaxCard}
                        onChange={() => setBaseForm({ ...baseForm, hasTaxCard: true })}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-zinc-300 text-xs">نعم (مسجل ضريبياً)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">فئة الكيان (للشهادة):</label>
                  <select
                    value={baseForm.entityCategory}
                    onChange={(e) => setBaseForm({ ...baseForm, entityCategory: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="individual">أفراد / منشأة فردية / شخص طبيعي</option>
                    <option value="company">شركة اعتبارية (ش.م.م / ش.ذ.م.م / تضامن)</option>
                  </select>
                </div>
              </div>

              {/* Tax Details if Applicable */}
              {baseForm.hasTaxCard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <label className="block text-zinc-400 mb-1">رقم البطاقة الضريبية:</label>
                    <input
                      type="text"
                      value={baseForm.taxCardNumber}
                      onChange={(e) => setBaseForm({ ...baseForm, taxCardNumber: e.target.value })}
                      placeholder="318-721-654"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">رقم الملف الضريبي والمأمورية:</label>
                    <input
                      type="text"
                      value={baseForm.taxFileNumber}
                      onChange={(e) => setBaseForm({ ...baseForm, taxFileNumber: e.target.value })}
                      placeholder="89/12/تجاري"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">رقم السجل التجاري:</label>
                    <input
                      type="text"
                      value={baseForm.commercialReg}
                      onChange={(e) => setBaseForm({ ...baseForm, commercialReg: e.target.value })}
                      placeholder="44590"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Issued To Party, Period, Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">الجهة الموجه إليها الشهادة *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.issuedToParty}
                    onChange={(e) => setBaseForm({ ...baseForm, issuedToParty: e.target.value })}
                    placeholder="السادة / بنك مصر - قطاع التمويل"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">الفترة المالية أو المحاسبية *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.fiscalPeriod}
                    onChange={(e) => setBaseForm({ ...baseForm, fiscalPeriod: e.target.value })}
                    placeholder="السنة المنتهية في 31/12/2025"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">تاريخ تحرير الشهادة *</label>
                  <input
                    type="date"
                    required
                    value={baseForm.issueDate}
                    onChange={(e) => setBaseForm({ ...baseForm, issueDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Purpose & Basis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">الغرض من استخراج الشهادة *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.purpose}
                    onChange={(e) => setBaseForm({ ...baseForm, purpose: e.target.value })}
                    placeholder="لتقديمها للبنك للحصول على تمويل عقاري أو تسهيل ائتماني"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">سند الاحتساب والفحص *</label>
                  <input
                    type="text"
                    required
                    value={baseForm.basisOfCalculation}
                    onChange={(e) => setBaseForm({ ...baseForm, basisOfCalculation: e.target.value })}
                    placeholder="بناءً على فحص حركة الحسابات البنكية والإقرارات والمعاينة"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Specialized Fields: 1. Income (With or Without Tax Card) */}
              {(selectedType === 'income_no_tax' || selectedType === 'income_with_tax' || selectedType === 'income') && (
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>حسابات صافي الدخل السنوي والشهري للأفراد:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي الإيرادات السنوية (ج.م):</label>
                      <input
                        type="number"
                        value={incomeData.grossAnnualRevenue}
                        onChange={(e) => handleIncomeRevenueChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي المصروفات السنوية (ج.م):</label>
                      <input
                        type="number"
                        value={incomeData.annualExpenses}
                        onChange={(e) => handleIncomeExpensesChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-200 mb-1 font-bold">صافي الدخل السنوي المحسوب:</label>
                      <input
                        type="number"
                        readOnly
                        value={incomeData.netAnnualIncome}
                        className="w-full bg-zinc-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-400 font-mono font-extrabold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-200 mb-1 font-bold">متوسط صافي الدخل الشهري:</label>
                      <input
                        type="number"
                        readOnly
                        value={incomeData.averageMonthlyIncome}
                        className="w-full bg-zinc-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-400 font-mono font-extrabold"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                    <div>• التفقيط السنوي: <strong className="text-white">{tafqeetCurrency(incomeData.netAnnualIncome)}</strong></div>
                    <div>• التفقيط الشهري: <strong className="text-white">{tafqeetCurrency(incomeData.averageMonthlyIncome)}</strong></div>
                  </div>
                </div>
              )}

              {/* Specialized Fields: 2. Invested Capital */}
              {selectedType === 'invested_capital' && (
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>بيانات رأس المال المستثمر للشركات والأفراد:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">قيمة الأصول الثابتة والآلات (ج.م):</label>
                      <input
                        type="number"
                        value={investedCapitalData.fixedAssetsValue}
                        onChange={(e) => handleInvestedFixedChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">قيمة الأصول المتداولة المستثمرة (ج.م):</label>
                      <input
                        type="number"
                        value={investedCapitalData.currentAssetsValue}
                        onChange={(e) => handleInvestedCurrentChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-200 mb-1 font-bold">إجمالي رأس المال المستثمر:</label>
                      <input
                        type="number"
                        readOnly
                        value={investedCapitalData.totalInvestedCapital}
                        className="w-full bg-zinc-900 border border-sky-500/50 rounded-lg px-3 py-2 text-sky-400 font-mono font-extrabold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">تفاصيل المعاينة ومقر النشاط:</label>
                    <input
                      type="text"
                      value={investedCapitalData.inspectionDetails}
                      onChange={(e) => setInvestedCapitalData({ ...investedCapitalData, inspectionDetails: e.target.value })}
                      placeholder="تمت المعاينة ومطابقة الآلات وفحص فواتير الشراء"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Specialized Fields: 3. Solvency */}
              {selectedType === 'financial_solvency' && (
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    <span>مؤشرات الملاءة والقدرة المالية:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي الأصول المملوكة (ج.م):</label>
                      <input
                        type="number"
                        value={solvencyData.totalOwnedAssets}
                        onChange={(e) => handleSolvencyAssetsChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي الخصوم والالتزامات (ج.م):</label>
                      <input
                        type="number"
                        value={solvencyData.totalLiabilities}
                        onChange={(e) => handleSolvencyLiabChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-200 mb-1 font-bold">صافي الملاءة وحقوق الملكية:</label>
                      <input
                        type="number"
                        readOnly
                        value={solvencyData.netSolvencyEquity}
                        className="w-full bg-zinc-900 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-400 font-mono font-extrabold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">إقرار الملاءة وعدم التعثر:</label>
                    <input
                      type="text"
                      value={solvencyData.solvencyAssessment}
                      onChange={(e) => setSolvencyData({ ...solvencyData, solvencyAssessment: e.target.value })}
                      placeholder="تتمتع المنشأة بملاءة ممتازة وتدفقات مستقرة وخالية من أي تعثر مالي"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Specialized Fields: 4. Professional Revenues */}
              {selectedType === 'revenue_expenses' && (
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>إيرادات ومصروفات المهن الحرة (غير التجارية):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي الإيرادات المهنية (ج.م):</label>
                      <input
                        type="number"
                        value={professionalData.professionalGrossRevenue}
                        onChange={(e) => handleProfessionalGrossChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">المصروفات المهنية المباشرة (ج.م):</label>
                      <input
                        type="number"
                        value={professionalData.operatingExpenses}
                        onChange={(e) => handleProfessionalExpChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-200 mb-1 font-bold">صافي الإيراد المهني السنوي:</label>
                      <input
                        type="number"
                        readOnly
                        value={professionalData.netProfessionalIncome}
                        className="w-full bg-zinc-900 border border-violet-500/50 rounded-lg px-3 py-2 text-violet-400 font-mono font-extrabold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Specialized Fields: 5. Working Capital */}
              {selectedType === 'working_capital' && (
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>بيانات رأس المال العامل والسيولة:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي الأصول المتداولة (ج.م):</label>
                      <input
                        type="number"
                        value={workingCapitalData.currentAssets}
                        onChange={(e) => handleWorkingAssetsChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">إجمالي الخصوم المتداولة (ج.م):</label>
                      <input
                        type="number"
                        value={workingCapitalData.currentLiabilities}
                        onChange={(e) => handleWorkingLiabChange(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-200 mb-1 font-bold">صافي رأس المال العامل:</label>
                      <input
                        type="number"
                        readOnly
                        value={workingCapitalData.netWorkingCapital}
                        className="w-full bg-zinc-900 border border-teal-500/50 rounded-lg px-3 py-2 text-teal-400 font-mono font-extrabold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mandatory Footer Info Note */}
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  تنسيق الاعتماد الرسمي: ستُذيل الشهادة بعبارة <strong>"يعتمد المحاسب القانوني"</strong> دون طباعة اسم ومجهزة بإطار فارغ للتوقيع والختم اليدوي الرسمي مع رمز الاستجابة السريعة (QR Code).
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>اعتماد وإصدار الشهادة رسمياً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Paper Preview Modal with QR Code and Mandatory "يعتمد المحاسب القانوني" Footer */}
      {previewCert && createPortal(
        <div
          id="print-modal-portal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto font-sans print:!bg-white print:!backdrop-blur-none print:!p-0 print:!block print:!overflow-visible print:!min-h-screen"
        >
          <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 text-zinc-100 print:!bg-transparent print:!border-none print:!shadow-none print:!max-w-none print:!w-full print:!m-0">
            {/* Modal Top Bar */}
            <div className="no-print p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  معاينة الشهادة المعتمدة الرسمية ({previewCert.serialNumber})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Switch to Read-Only Digital Verified Portal View */}
                <button
                  onClick={() => {
                    setDigitalViewCert(previewCert);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-600/50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>عرض النسخة الرقمية للتحقق (QR)</span>
                </button>

                <button
                  onClick={async () => {
                    if (!certPaperRef.current) return;
                    setIsExportingPDF(true);
                    try {
                      await exportElementToPDF(
                        certPaperRef.current,
                        `شهادة_${previewCert.serialNumber}_${previewCert.clientName}.pdf`,
                        {
                          companyProfile,
                          auditorStatement,
                          reportTitle: previewCert.certificateTitle || 'شهادة محاسبية رسمية معتمدة',
                          includeLetterhead: false,
                          includeStamp: false,
                        }
                      );
                    } catch (err) {
                      console.error('PDF export failed:', err);
                    } finally {
                      setIsExportingPDF(false);
                    }
                  }}
                  disabled={isExportingPDF}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير PDF للطباعة'}</span>
                </button>

                <button
                  onClick={() => handleExportSingleCertWord(previewCert)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-zinc-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تصدير Word</span>
                </button>

                <button
                  onClick={() => {
                    if (certPaperRef.current && previewCert) {
                      printA4Document(
                        certPaperRef.current,
                        `شهادة محاسبية معتمدة - ${previewCert.clientName}`
                      );
                    } else {
                      printDocument();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-zinc-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة A4</span>
                </button>

                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Certificate Paper Layout - Exact Professional A4 Layout, Somar Sans, No Boxes, No Dividers */}
            <div className="p-4 sm:p-8 overflow-y-auto max-h-[82vh] bg-zinc-900/60 flex justify-center print:!p-0 print:!m-0 print:!bg-transparent print:!overflow-visible print:!block print:!max-h-none">
              <div
                ref={certPaperRef}
                className="bg-white text-zinc-950 p-8 sm:p-12 shadow-2xl font-somar max-w-[210mm] min-h-[297mm] w-full mx-auto space-y-6 select-text overflow-hidden print-a4-container print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 print:!min-h-0 print:!h-auto"
              >
                {/* Official Letterhead Header - Full CPA Info & QR Code Side-by-Side */}
                <div className="print-first-page-letterhead flex justify-between items-start gap-4 font-somar bg-white relative z-20">
                  <div className="text-right space-y-1 sm:max-w-[65%]">
                    <h3 className="text-[17px] font-black text-zinc-950 leading-tight font-somar">
                      {auditorStatement?.firmName || 'مكتب المحاسب القانوني محمود الباز قابيل للمحاسبة والمراجعة والضرائب'}
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

                  {/* QR Code and Serial - Clean, No Text Box */}
                  <div className="flex flex-col items-center shrink-0 text-center font-somar w-20">
                    {previewQrCodeUrl ? (
                      <img
                        src={previewQrCodeUrl}
                        alt="كود QR للتحقق الرقمي"
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
                      {previewCert.serialNumber}
                    </div>
                  </div>
                </div>

                {/* Centered Certificate Title - Somar Sans 16px, No Box or Divider */}
                <div className="text-center my-6">
                  <h2 className="text-[16px] font-black font-somar text-zinc-950 doc-title-text">
                    {(previewCert.certificateType === 'income_no_tax' ||
                      previewCert.certificateType === 'income_with_tax' ||
                      previewCert.certificateType === 'income' ||
                      previewCert.certificateTitle?.includes('دخل'))
                      ? 'شهادة دخل'
                      : (previewCert.certificateTitle || 'شهادة محاسبية رسمية معتمدة')}
                  </h2>
                </div>

                {/* Addressed To Party - Clean text */}
                <div className="text-sm font-bold text-zinc-950 font-somar py-1">
                  <div>السادة / {previewCert.issuedToParty}</div>
                  <div className="text-xs text-zinc-600 font-normal mt-0.5">تحية طيبة وبعد ،،،</div>
                </div>

                {/* Preamble with Exact Required Phrasing - Somar Sans 14px, No Text Boxes */}
                <div className="text-[14px] text-zinc-900 leading-relaxed text-justify space-y-4 font-somar doc-body-text">
                  <p className="leading-loose text-[14px]">
                    يشهد مكتب <strong className="font-bold">{auditorStatement?.firmName || auditorStatement?.auditorName || 'المحاسب القانوني محمود الباز قابيل'}</strong> والمسجل بسجل المحاسبين والمراجعين تحت رقم <strong className="font-mono font-bold">{auditorStatement?.registrationNumber || auditorStatement?.licenseNumber || 'س.م.م 44887'}</strong> وزارة المالية بأن:
                  </p>

                  {/* Standardized Client Details - Clean layout without text boxes or borders */}
                  <div className="space-y-2 text-sm pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-zinc-900 w-32 shrink-0">• الاسم / صاحب الشأن:</span>
                        <span className="font-bold text-zinc-950 text-base">{previewCert.clientName}</span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-zinc-900 w-32 shrink-0">• الرقم القومي:</span>
                        <span className="font-mono font-bold text-zinc-950 tracking-wider">
                          {previewCert.nationalId || '________________'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-zinc-900 w-32 shrink-0">• العنوان ومحل الإقامة:</span>
                      <span className="text-zinc-900 font-semibold">{previewCert.address || '________________'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-zinc-900 w-32 shrink-0">• المهنة / النشاط:</span>
                        <span className="text-zinc-950 font-bold">{previewCert.profession || 'أعمال حرة'}</span>
                      </div>

                      {previewCert.facilityName && (
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-zinc-900 w-32 shrink-0">• اسم المنشأة / المحل:</span>
                          <span className="text-zinc-900 font-semibold">{previewCert.facilityName}</span>
                        </div>
                      )}
                    </div>

                    {/* Tax Card Status: with or without tax card */}
                    <div className="pt-2 mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-bold text-zinc-800">• الموقف الضريبي:</span>
                      {previewCert.taxFileNumber || previewCert.taxCardNumber ? (
                        <span className="text-zinc-900 font-semibold">
                          مسجل ضريبياً - بطاقة ضريبية رقم: {previewCert.taxCardNumber || previewCert.taxFileNumber}
                        </span>
                      ) : (
                        <span className="text-zinc-800 font-bold">
                          أفراد (ليس لديه بطاقة ضريبية - أعمال ومهن حرة غير مسجلة ضريبياً)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Financial Statement Clause - Clean text, no background box */}
                  {(previewCert.certificateType === 'income_no_tax' ||
                    previewCert.certificateType === 'income_with_tax' ||
                    previewCert.certificateType === 'income') && (
                    <div className="space-y-3 pt-2">
                      <p className="leading-loose text-base">
                        وأن صافي دخله من نشاط (
                        <strong className="font-bold text-zinc-950">
                          {previewCert.profession || 'نشاطه الحر'}
                        </strong>
                        ) عن الفترة (
                        <strong className="font-bold text-zinc-950">
                          {previewCert.fiscalPeriod}
                        </strong>
                        ) هو مبلغ وقدره:{' '}
                        <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                          {(
                            previewCert.incomeData?.netAnnualIncome ??
                            previewCert.netAnnualIncome ??
                            (previewCert.annualNetIncome || 0)
                          ).toLocaleString()}{' '}
                          جنيهاً مصرياً
                        </strong>{' '}
                        (
                        <strong className="text-zinc-950 font-bold">
                          {tafqeetCurrency(
                            previewCert.incomeData?.netAnnualIncome ??
                              previewCert.netAnnualIncome ??
                              (previewCert.annualNetIncome || 0)
                          )}
                        </strong>
                        )، بمتوسط صافي دخل شهري قدره:{' '}
                        <strong className="font-mono font-extrabold text-zinc-950">
                          {(
                            previewCert.incomeData?.averageMonthlyIncome ??
                            previewCert.averageMonthlyIncome ??
                            (previewCert.monthlyNetIncome || 0)
                          ).toLocaleString()}{' '}
                          ج.م
                        </strong>{' '}
                        (
                        <strong className="text-zinc-950 font-bold">
                          {tafqeetCurrency(
                            previewCert.incomeData?.averageMonthlyIncome ??
                              previewCert.averageMonthlyIncome ??
                              (previewCert.monthlyNetIncome || 0)
                          )}
                        </strong>
                        ).
                      </p>
                      <p className="text-xs text-zinc-700">
                        <strong>سند الاحتساب:</strong> {previewCert.basisOfCalculation || 'بناءً على فحص حركة الحسابات البنكية وإقرار صاحب الشأن بمصادر دخله الحرة والمستندات المؤيدة المقدمة'}
                      </p>
                    </div>
                  )}

                  {previewCert.certificateType === 'invested_capital' && (
                    <div className="space-y-3 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200">
                      <p className="leading-loose text-base">
                        وأن إجمالي رأس المال المستثمر الفعلي في نشاط (
                        <strong className="font-bold text-zinc-950">{previewCert.facilityName || previewCert.profession || 'المنشأة'}</strong>
                        ) هو مبلغ وقدره:{' '}
                        <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                          {(previewCert.investedCapitalData?.totalInvestedCapital ?? previewCert.totalInvestedCapital ?? 0).toLocaleString()} جنيهاً مصرياً
                        </strong>{' '}
                        (
                        <strong className="text-zinc-950 font-bold">
                          {tafqeetCurrency(previewCert.investedCapitalData?.totalInvestedCapital ?? previewCert.totalInvestedCapital ?? 0)}
                        </strong>
                        ) يشمل أصولاً ثابتة قدرها {(previewCert.investedCapitalData?.fixedAssetsValue || 0).toLocaleString()} ج.م وأصولاً متداولة مستثمرة قدرها {(previewCert.investedCapitalData?.currentAssetsValue || 0).toLocaleString()} ج.م.
                      </p>
                      <p className="text-xs text-zinc-700">
                        <strong>سند المعاينة:</strong> {previewCert.investedCapitalData?.inspectionDetails || previewCert.basisOfCalculation || 'طبقاً للمعاينة الميدانية لمقر النشاط والآلات وفحص فواتير الشراء وأرصدة المخزون'}
                      </p>
                    </div>
                  )}

                  {previewCert.certificateType === 'financial_solvency' && (
                    <div className="space-y-3 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200">
                      <p className="leading-loose text-base">
                        يشهد المكتب بالملاءة والقدرة المالية التامة لصاحب الشأن / المنشأة، وأن إجمالي الأصول المملوكة تبلغ:{' '}
                        <strong className="font-mono font-bold">{(previewCert.solvencyData?.totalOwnedAssets || 0).toLocaleString()} ج.م</strong>، مقابل التزامات وديون إجمالية قدرها:{' '}
                        <strong className="font-mono font-bold">{(previewCert.solvencyData?.totalLiabilities || 0).toLocaleString()} ج.م</strong>، بصافي ملاءة فائضة قدرها:{' '}
                        <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                          {(previewCert.solvencyData?.netSolvencyEquity || 0).toLocaleString()} جنيهاً مصرياً
                        </strong>{' '}
                        (
                        <strong className="text-zinc-950 font-bold">
                          {tafqeetCurrency(previewCert.solvencyData?.netSolvencyEquity || 0)}
                        </strong>
                        ).
                      </p>
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        <strong>إقرار الملاءة:</strong> {previewCert.solvencyData?.solvencyAssessment || 'تتمتع المنشأة بملاءة ممتازة وتدفقات نقدية مستقرة وخالية من أي حجوزات أو تعثر مالي.'}
                      </p>
                    </div>
                  )}

                  {previewCert.certificateType === 'revenue_expenses' && (
                    <div className="space-y-3 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200">
                      <p className="leading-loose text-base">
                        بأن إجمالي الإيرادات المهنية بلغت مبلغاً وقدره:{' '}
                        <strong className="font-mono font-bold">{(previewCert.professionalData?.professionalGrossRevenue || 0).toLocaleString()} ج.م</strong>، ومصروفات مهنية قدرها:{' '}
                        <strong className="font-mono font-bold">{(previewCert.professionalData?.operatingExpenses || 0).toLocaleString()} ج.م</strong>، بصافي دخل مهني سنوي قدره:{' '}
                        <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                          {(previewCert.professionalData?.netProfessionalIncome || 0).toLocaleString()} جنيهاً مصرياً
                        </strong>{' '}
                        (
                        <strong className="text-zinc-950 font-bold">
                          {tafqeetCurrency(previewCert.professionalData?.netProfessionalIncome || 0)}
                        </strong>
                        ).
                      </p>
                    </div>
                  )}

                  {previewCert.certificateType === 'working_capital' && (
                    <div className="space-y-3 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200">
                      <p className="leading-loose text-base">
                        وأن صافي رأس المال العامل الفعلي هو مبلغ وقدره:{' '}
                        <strong className="text-lg font-extrabold font-mono text-zinc-950 underline decoration-2">
                          {(previewCert.workingCapitalData?.netWorkingCapital || 0).toLocaleString()} جنيهاً مصرياً
                        </strong>{' '}
                        (
                        <strong className="text-zinc-950 font-bold">
                          {tafqeetCurrency(previewCert.workingCapitalData?.netWorkingCapital || 0)}
                        </strong>
                        ) بنسبة تداول {(previewCert.workingCapitalData?.currentRatio || 2.5)} : 1.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    <p className="text-xs text-zinc-800">
                      <strong>الغرض من الشهادة:</strong> {previewCert.purpose}
                    </p>
                    <p className="text-[11px] text-zinc-500 italic">
                      * صدرت هذه الشهادة بناءً على طلب المنشأة والبيانات والمستندات المقدمة، ودون أدنى مسؤولية أو التزام مالي على مكتب المحاسب القانوني تجاه حقوق الغير، وهي صالحة للتقديم إلى الجهة الموجهة إليها فقط.
                    </p>
                  </div>
                </div>

                {/* Formal Endorsement & Approval Section - Exact User Specification:
                    Only "يعتمد المحاسب القانوني" and "تحريراً في: [التاريخ]" with clean open whitespace, no text boxes, no dividers */}
                <div className="pt-8 mt-8 flex flex-col sm:flex-row justify-between items-end gap-6 font-somar avoid-break">
                  {/* Security & Verification Metadata */}
                  <div className="text-right space-y-1 text-xs text-zinc-700 w-full sm:w-auto">
                    <div className="font-bold text-zinc-950 font-somar text-sm">
                      وثيقة محاسبية رسمية معتمدة
                    </div>
                    <div className="font-mono text-[11px] text-zinc-600">
                      رقم السيريال: {previewCert.serialNumber}
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
                      تحريراً في: {previewCert.issueDate}م
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Read-Only Digital Verified Certificate View Modal */}
      {digitalViewCert && (
        <DigitalVerifiedCertificateView
          certificate={digitalViewCert}
          companyProfile={companyProfile}
          auditorStatement={auditorStatement}
          onClose={() => setDigitalViewCert(null)}
        />
      )}

      {/* Certificate Verification Center Modal */}
      <CertificateVerificationCenterModal
        isOpen={isVerificationCenterOpen}
        onClose={() => setIsVerificationCenterOpen(false)}
        initialSerial={verificationSearchSerial}
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
      />

      {/* Delete Certificate Confirmation Modal */}
      {certToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 font-somar">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-somar">تأكيد حذف الشهادة المحاسبية</h3>
                <p className="text-xs text-slate-400">إلغاء الشهادة وتوثيق العملية في سجل الرقابة</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <p>
                هل أنت متأكد من رغبتك في حذف الشهادة المحاسبية التالية نهائياً؟
              </p>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="font-bold text-emerald-400 font-mono text-sm">
                  مسلسل: {certToDelete.serial}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCertToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteCert}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الشهادة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
