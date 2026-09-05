export type AccountType = 'main' | 'sub';
export type AccountNature = 'debit' | 'credit';
export type AccountCategory = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expense';
export type PartyType = 'customer' | 'supplier';
export type InvoiceType = 'sales' | 'purchase' | 'sales_return' | 'purchase_return' | 'purchases';

export interface Account {
  id: string;
  code: string;
  name: string;
  englishName?: string;
  category: AccountCategory;
  type: AccountType; // main (رئيسي) or sub (فرعي - يقبل قيود)
  nature: AccountNature; // طبيعة الحساب (مدين أو دائن)
  parentCode: string | null;
  level: number;
  openingBalance: number;
  currentDebit?: number;
  currentCredit?: number;
  currentBalance?: number;
  currency?: string; // e.g. 'EGP', 'USD', 'EUR'
  foreignOpeningBalance?: number;
  description?: string;
  isActive: boolean;
  isSystem?: boolean;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  currency?: string; // رمز العملة مثل 'USD'
  exchangeRate?: number; // سعر الصرف مقابل الجنيه المصري
  foreignDebit?: number; // المبلغ المدين بالعملة الأجنبية
  foreignCredit?: number; // المبلغ الدائن بالعملة الأجنبية
  note?: string;
  costCenter?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  formattedNumber: string; // e.g. "JV-2026-0001"
  date: string; // YYYY-MM-DD
  referenceDoc?: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  currency?: string; // العملة الأساسية للقيد (افتراضياً EGP)
  exchangeRate?: number;
  isPosted: boolean;
  postedAt?: string;
  postedBy?: string;
  createdBy: string;
  createdAt: string;
  sourceType?: 'manual' | 'invoice' | 'smart_template' | 'depreciation' | 'payroll' | 'closing';
  sourceId?: string;
  notes?: string;
}

export interface Party {
  id: string;
  type: PartyType;
  code: string;
  name: string;
  taxNumber?: string; // البطاقة الضريبية
  commercialReg?: string; // السجل التجاري
  commercialRegistry?: string; // الاسم البديل
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  accountId?: string; // الحساب المرتبط بشجرة الحسابات
  linkedAccountCode?: string;
  openingBalance?: number;
  currentBalance?: number;
  creditLimit?: number;
  isActive?: boolean;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatRate?: number; // e.g. 0.14 for 14%
  vatAmount?: number;
  withholdingTaxRate?: number; // e.g. 0.01 for 1%
  withholdingTaxAmount?: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  formattedNumber?: string;
  type: string;
  partyId: string;
  partyName: string;
  partyTaxNumber?: string;
  partyCommercialReg?: string;
  partyAddress?: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  discountTotal?: number;
  taxableAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  vatTotal?: number;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  withholdingTaxTotal?: number;
  totalAmount?: number;
  grandTotal?: number;
  paymentMethod?: 'cash' | 'bank' | 'credit';
  status?: string;
  paidAmount?: number;
  remainingAmount?: number;
  currency?: string; // e.g. 'EGP', 'USD', 'EUR', 'SAR'
  exchangeRate?: number; // سعر الصرف مقابل الجنيه المصري
  foreignTotalAmount?: number; // إجمالي الفاتورة بالعملة الأجنبية
  foreignRemainingAmount?: number; // المتبقي بالعملة الأجنبية
  journalEntryId?: string;
  notes?: string;
  paymentTerms?: string;
  qrCodeData?: string;
  createdAt?: string;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  category: AccountCategory;
  level: number;
  isMain: boolean;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  totalDebit: number;
  totalCredit: number;
  balanceDebit: number;
  balanceCredit: number;
}

export interface FinancialRatio {
  name: string;
  value: number;
  formatted: string;
  status: 'optimal' | 'warning' | 'normal';
  benchmark: string;
  description: string;
}

export interface AuditorStatement {
  auditorName: string;
  auditorTitle?: string;
  firmName?: string;
  registerNumber: string; // رقم القيد بسجل المحاسبين والمراجعين
  taxCardNumber?: string;
  fellowship?: string; // زميل جمعية المحاسبين والمراجعين المصرية
  opinionType?: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer';
  reportDate: string;
  fiscalYear?: string;
  companyName?: string;
  legalForm?: string;
  opinionParagraph?: string;
  opinionText?: string;
  basisForOpinion?: string;
  basisOfOpinion?: string;
  managementResponsibility?: string;
  managementResponsibilities?: string;
  auditorResponsibility?: string;
  auditorResponsibilities?: string;
  legalRequirementsParagraph?: string;
  otherLegalRequirements?: string;
  auditorSignature?: string; // Base64 digital signature image (drawn or uploaded)
  auditorStamp?: string; // Base64 official seal/stamp image
  officeLogo?: string; // Base64 office logo image
}

export interface CompanyProfile {
  name: string;
  legalForm: string;
  commercialRegistry: string;
  commercialRegister?: string;
  taxCard: string;
  taxCardNumber?: string;
  taxRegistrationNumber?: string;
  description?: string;
  taxOffice?: string;
  vatNumber?: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  fiscalYearStart?: string;
  fiscalYearEnd: string;
  auditorName?: string;
  auditorTitle?: string;
  auditorSignature?: string;
  auditorStamp?: string;
  logo?: string;
}

export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'post'
  | 'unpost'
  | 'export'
  | 'import'
  | 'closing'
  | 'backup'
  | 'restore'
  | 'setting_change';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "2026-09-02 12:45:10"
  actionType: AuditActionType;
  module: string; // e.g. 'قيود اليومية', 'دليل الحسابات', 'الشهادات', 'أرشيف العملاء', 'خزينة المكتب', 'الفواتير', 'القوائم المالية'
  description: string;
  recordIdentifier?: string; // e.g. "JV-2026-0004" or "CERT-2026-0001"
  user: string; // e.g. "المحاسب القانوني / محمود الباز قابيل"
  details?: string;
  isDeleted: boolean; // Soft delete by user
  deletedAt?: string;
  deletedBy?: string;
  deletionNote?: string;
}

