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
  hasTaxCard?: boolean; // هل لديه بطاقة ضريبية؟ (نعم / لا)
  grossAnnualRevenue?: number;
  annualRevenue?: number;
  annualExpenses: number;
  netAnnualIncome: number;
  averageMonthlyIncome?: number;
  monthlyAverageIncome?: number;
  professionOrActivity?: string;
  sourceOfIncome?: string;
  revenueSourceDescription?: string;
  periodCovered?: string;
  basisOfCalculation?: string;
  evidenceType?: 'inspection' | 'tax_returns' | 'bank_statements' | 'witness_affidavit' | 'commercial_records';
}

export interface InvestedCapitalCertificateData {
  entityCategory?: 'individual' | 'company'; // أفراد أو شركات
  fixedAssetsValue: number;
  currentAssetsValue: number;
  inventoryValue?: number;
  cashAndBanksValue?: number;
  receivablesValue?: number;
  totalInvestedCapital: number;
  premisesType?: string;
  inspectionDate?: string;
  inspectionDetails?: string;
  capitalDistribution?: string;
  headquartersAddress?: string;
}

export interface FinancialSolvencyCertificateData {
  totalOwnedAssets: number; // إجمالي الأصول المملوكة
  totalLiabilities: number; // إجمالي الخصوم والالتزامات
  netSolvencyEquity: number; // صافي الملاءة وحقوق الملكية الفائضة
  annualOperatingTurnover: number; // حجم التعاملات والعمليات السنوية
  availableCashLiquidity: number; // السيولة النقدية الحالية بالبنوك والخزينة
  solvencyRatio: number; // نسبة الملاءة (الأصول إلى الالتزامات)
  tenderTitle?: string; // اسم المناقصة أو التسهيل
  solvencyAssessment: string; // إقرار الملاءة وعدم وجود حجوزات أو تعثر
}

export interface ProfessionalRevenuesExpensesData {
  syndicateName?: string; // النقابة المهنية (أطباء، مهندسين، محامين، تجاريين)
  syndicateCardNumber?: string; // رقم القيد بالنقابة
  clinicOrOfficeName?: string; // اسم العيادة / المكتب الاستشاري
  professionalGrossRevenue: number; // إجمالي الإيرادات المهنية
  operatingExpenses: number; // المصروفات العمومية والإدارية المباشرة
  netProfessionalIncome: number; // صافي الإيراد المهني السنوي
  averageMonthlyProfessionalIncome: number; // متوسط الإيراد المهني الشهري
  taxExemptionYears?: number; // سنوات الإعفاء بالقانون (إن وجد)
}

export interface BankAuditCertificateData {
  bankName: string;
  facilityTypeRequested: string; // قرض متوسط الأجل، اعتماد مستندي، خطابات ضمان
  annualBankDeposits: number; // إجمالي الإيداعات البنكية السنوية
  averageMonthlyTurnover: number; // متوسط حركة الحساب الشهري
  existingDebtObligations: number; // الالتزامات البنكية القائمة
  auditorCreditOpinion: string; // رأي المحاسب القانوني في الجدارة الائتمانية والتدفقات
}

export interface AssetValuationData {
  machineryAndEquipmentValue: number;
  vehiclesAndTransportationValue: number;
  realEstateAndPremisesValue: number;
  officeFurnitureAndDevicesValue: number;
  totalMarketValuation: number;
  totalBookValuation: number;
  valuationMethod: string; // القيمة السوقية العادلة / القيمة الاستبدالية
  inspectionCommittee: string;
}

export interface TaxClearanceCertificateData {
  lastInspectedTaxYear: string; // آخر سنة تم فحصها نهائياً
  corporateTaxStatus: string; // موقف ضريبة الدخل
  vatTaxStatus: string; // موقف ضريبة القيمة المضافة
  payrollTaxStatus: string; // موقف كسب العمل
  socialInsuranceStatus: string; // موقف التأمينات الاجتماعية
  noLawsuitsCertificate: boolean; // خلو المنشأة من قضايا التهرب أو النزاعات
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

export type CertificateType =
  | 'income_no_tax'         // شهادة إثبات دخل للأفراد (ليس لهم بطاقة ضريبية)
  | 'income_with_tax'       // شهادة إثبات دخل للأفراد (لهم بطاقة ضريبية)
  | 'income'                // شهادة إثبات دخل عامة
  | 'invested_capital'      // شهادة رأس المال المستثمر للشركات والأفراد
  | 'financial_solvency'    // شهادة القدرة المالية والملاءة المالية
  | 'revenue_expenses'      // شهادة إيرادات ومصروفات مهنية (أصحاب المهن الحرة)
  | 'audit_bank_facility'   // شهادة فحص وتدقيق للتمويل والقروض وتأييد الحسابات البنكية
  | 'asset_valuation'       // شهادة حصر وتقييم أصول وممتلكات ومعدات
  | 'tax_clearance'         // شهادة الموقف الضريبي والتأميني وخلو الالتزامات
  | 'working_capital'       // شهادة رأس المال العامل ومؤشرات السيولة
  | 'custom';               // شهادات مهنية مخصصة

export interface AccountingCertificate {
  id: string;
  serialNumber: string; // CERT-2026-0001
  certificateType: CertificateType;
  certificateTitle?: string; // e.g. "شهادة إثبات دخل" or "شهادة دخل"
  clientId?: string;
  clientName: string; // الاسم الرباعي لصاحب الشأن
  nationalId?: string; // الرقم القومي (14 رقم)
  address?: string; // العنوان ومحل الإقامة
  profession?: string; // المهنة أو النشاط
  professionOrActivity?: string; // المهنة أو النشاط التجاري/المهني
  facilityName?: string; // اسم المنشأة أو المحل أو الشركة
  facilityType?: string;
  taxCardNumber?: string;
  taxFileNumber?: string;
  commercialReg?: string;
  taxOffice?: string;
  issueDate: string;
  fiscalYear?: string;
  fiscalPeriod?: string;
  purpose?: string;
  issuedToParty: string; // الجهة الموجه إليها الشهادة (بنك، مرور، تمويل عقاري، الخ)
  currency?: string;

  // Additional Metadata
  hasTaxCard?: boolean; // هل لديه بطاقة ضريبية؟
  entityCategory?: 'individual' | 'company'; // أفراد أو شركات
  qrCodeDataUrl?: string; // كود QR المولد للتحقق
  verificationUrl?: string; // رابط التحقق الرسمي
  verificationHash?: string; // هاش رقمي للأمان

  // 1. Fields for Income Certificate (شهادة الدخل)
  annualRevenue?: number;
  grossAnnualRevenue?: number;
  annualExpenses?: number;
  annualNetIncome?: number;
  netAnnualIncome?: number;
  monthlyNetIncome?: number;
  averageMonthlyIncome?: number;
  basisOfCalculation?: string;
  incomeData?: IncomeCertificateData;

  // 2. Fields for Invested Capital Certificate (شهادة رأس المال المستثمر)
  fixedAssetsValue?: number;
  currentAssetsInvested?: number;
  totalInvestedCapital?: number;
  inspectionDate?: string;
  investedCapitalData?: InvestedCapitalCertificateData;

  // 3. Fields for Financial Solvency Certificate (شهادة القدرة المالية والملاءة المالية)
  solvencyData?: FinancialSolvencyCertificateData;

  // 4. Fields for Professional Revenues and Expenses (شهادة إيرادات ومصروفات مهنية)
  professionalData?: ProfessionalRevenuesExpensesData;

  // 5. Fields for Bank Audit & Credit Facility (شهادة فحص الحسابات البنكية والتمويل)
  bankAuditData?: BankAuditCertificateData;

  // 6. Fields for Asset Valuation (شهادة حصر وتقييم أصول)
  assetValuationData?: AssetValuationData;

  // 7. Fields for Tax and Social Insurance Clearance (شهادة الموقف الضريبي والتأميني)
  taxClearanceData?: TaxClearanceCertificateData;

  // 8. Fields for Working Capital Certificate (شهادة رأس المال العامل)
  currentAssets?: number;
  currentLiabilities?: number;
  netWorkingCapital?: number;
  workingCapitalRatio?: number;
  workingCapitalData?: WorkingCapitalCertificateData;

  // Certified Signatures & Auditor
  auditorName: string;
  auditorTitle?: string;
  auditorRegNumber?: string;
  auditorRegisterNumber?: string;
  legalDisclaimer?: string;
  status?: 'issued' | 'draft' | 'cancelled';
  notes?: string;
  createdAt: string;
}

