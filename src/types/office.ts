export type TaxInspectionStatus =
  | 'فحص حتى 2023 ومحاسب نهائياً'
  | 'فحص حتى 2022 وجاري فحص 2023'
  | 'جاري الفحص الضريبي حالياً'
  | 'لم يفحص بعد (ملف حديث/معفى)'
  | 'لجان طعن وإعادة نظر'
  | 'متصالح طبقاً لقانون التجاوز/المادة 3'
  | 'إنهاء نزاع ضريبي'
  | 'أخرى';

export type CommercialRegisterType = 'فردي' | 'شركة';

export type FacilityType =
  | 'منشأة فردية'
  | 'شركة مساهمة مصرية (ش.م.م)'
  | 'شركة ذات مسؤولية محدودة (ش.ذ.م.م)'
  | 'شركة الشخص الواحد (ش.ذ.م.م)'
  | 'شركة تضامن'
  | 'شركة توصية بسيطة'
  | 'فرع شركة أجنبية'
  | 'مهن حرة / مكتب مهني'
  | 'جمعية أو مؤسسة أهلية';

export interface ClientArchive {
  id: string;
  clientCode: string; // Auto serial CLI-2026-0001
  name: string; // اسم العميل / اسم المنشأة
  activityStartDate: string; // تاريخ بدء النشاط
  taxInspectionStatus: TaxInspectionStatus; // الموقف من الفحص الضريبي
  taxInspectionDetails?: string; // تفاصيل إضافية عن الفحص
  isVatSubject: boolean; // الخضوع لضريبة القيمة المضافة: نعم / لا
  vatRegistrationNumber?: string; // رقم التسجيل بضريبة القيمة المضافة
  commercialRegisterType: CommercialRegisterType; // نوع السجل التجاري: فردي / شركة
  facilityType: FacilityType; // نوع المكتب أو المنشأة
  
  // Tax & Legal Details
  taxCardNumber: string; // رقم البطاقة الضريبية
  taxFileNumber?: string; // رقم الملف الضريبي
  taxOffice?: string; // مأمورية الضرائب التابع لها
  commercialRegistryNumber?: string; // رقم السجل التجاري
  commercialRegistryOffice?: string; // مكتب السجل التجاري

  // Contact Details
  managerName?: string; // المدير المسؤول / المفوض
  phone: string;
  email?: string;
  address: string;
  city?: string;

  // Financial & Services
  monthlyFee?: number; // الأتعاب الشهرية المتفق عليها
  annualFee?: number; // الأتعاب السنوية
  linkedAccountId?: string; // كود الحساب في شجرة الحسابات

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TreasuryTransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'vodafone_cash' | 'instapay' | 'visa';

export type TreasuryCategory =
  | 'أتعاب محاسبة وإقرارات'
  | 'أتعاب محاسبة ومراجعة شهرية'
  | 'أتعاب إعداد واعتماد القوائم المالية'
  | 'أتعاب استشارات وحضور لجان فحص ضرائب'
  | 'أتعاب تأسيس وتعديل شركات وسجلات'
  | 'أتعاب استخراج شهادات محاسبية'
  | 'رسوم استخراج سجل تجاري وغرفة تجارية'
  | 'رسوم وتأمينات فحص ضرائب'
  | 'رسوم توثيق وتصديق نقابة ومحاماة'
  | 'مصروفات انتقال ومأموريات ونثرية'
  | 'أمانات ورسوم حكومية مسددة للعميل'
  | 'أخرى';

export interface IncomeCertificateData {
  grossAnnualRevenue?: number;
  annualRevenue: number;
  annualExpenses: number;
  netAnnualIncome: number;
  averageMonthlyIncome?: number;
  monthlyAverageIncome?: number;
  professionOrActivity?: string;
  sourceOfIncome?: string;
  revenueSourceDescription?: string;
  periodCovered?: string;
  basisOfCalculation?: string;
}

export interface InvestedCapitalCertificateData {
  fixedAssetsValue: number;
  currentAssetsValue: number;
  totalInvestedCapital: number;
  premisesType?: string;
  inspectionDate?: string;
  inspectionDetails?: string;
  capitalDistribution?: string;
}

export interface WorkingCapitalCertificateData {
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
  workingCapitalRatio?: number;
  currentRatio?: number;
  evaluationDate?: string;
  analysisSummary?: string;
}

export interface TreasuryTransaction {
  id: string;
  serialNumber: string; // REC-2026-0001 or PAY-2026-0001
  date: string;
  type: TreasuryTransactionType; // income (وارد من العميل) | expense (منصرف على الخدمات)
  clientId: string; // Linked client ID
  clientName: string;
  amount: number;
  category: TreasuryCategory;
  serviceDescription: string; // بيان الخدمة أو الإجراء المنصرف عليه
  paymentMethod: PaymentMethod;
  receivedBy?: string; // مستلم المبلغ / القائم بالصرف
  notes?: string;
  isSyncedToAccounting?: boolean;
  journalEntryId?: string;
  createdAt: string;
}

export type CertificateType = 'income' | 'invested_capital' | 'working_capital';

export interface AccountingCertificate {
  id: string;
  serialNumber: string; // CERT-2026-0001
  certificateType: CertificateType;
  clientId?: string;
  clientName: string;
  facilityType?: string;
  taxCardNumber?: string;
  commercialReg?: string;
  taxOffice?: string;
  issueDate: string;
  fiscalYear?: string;
  fiscalPeriod?: string;
  purpose?: string;
  issuedToParty: string; // الجهة الموجه إليها الشهادة (بنك، مرور، تمويل عقاري، الخ)
  currency?: string;

  // 1. Fields for Income Certificate (شهادة الدخل)
  professionOrActivity?: string; // المهنة أو النشاط
  annualRevenue?: number; // إجمالي المبيعات / الإيرادات السنوية
  annualExpenses?: number; // إجمالي المصروفات السنوية
  annualNetIncome?: number; // صافي الدخل السنوي
  monthlyNetIncome?: number; // متوسط صافي الدخل الشهري
  basisOfCalculation?: string; // مستند إلى الإقرارات الضريبية والدفاتر
  incomeData?: IncomeCertificateData;

  // 2. Fields for Invested Capital Certificate (شهادة رأس المال المستثمر)
  fixedAssetsValue?: number; // الأصول الثابتة والمعدات
  currentAssetsInvested?: number; // الأصول المتداولة المستثمرة
  totalInvestedCapital?: number; // إجمالي رأس المال المستثمر
  inspectionDate?: string; // تاريخ المعاينة
  investedCapitalData?: InvestedCapitalCertificateData;

  // 3. Fields for Working Capital Certificate (شهادة رأس المال العامل)
  currentAssets?: number; // إجمالي الأصول المتداولة
  currentLiabilities?: number; // إجمالي الالتزامات المتداولة
  netWorkingCapital?: number; // صافي رأس المال العامل (أصول - التزامات)
  workingCapitalRatio?: number; // نسبة رأس المال العامل
  workingCapitalData?: WorkingCapitalCertificateData;

  // Certified Signatures & Auditor
  auditorName: string;
  auditorTitle?: string;
  auditorRegNumber?: string; // س.م.م 44887
  auditorRegisterNumber?: string;
  legalDisclaimer?: string;
  status?: 'issued' | 'draft' | 'cancelled';
  notes?: string;
  createdAt: string;
}
