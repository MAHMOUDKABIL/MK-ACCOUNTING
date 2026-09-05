export type AssetCategory =
  | 'land'
  | 'buildings'
  | 'machinery'
  | 'vehicles'
  | 'furniture'
  | 'computers'
  | 'electronics'
  | 'tools'
  | 'other';

export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'double_declining';

export type AssetStatus = 'active' | 'under_maintenance' | 'disposed' | 'fully_depreciated';

export interface FixedAsset {
  id: string;
  code: string; // e.g. "AST-001"
  name: string; // e.g. "سيارة نقل جامبو إيسوزو"
  category: AssetCategory;
  acquisitionDate: string; // YYYY-MM-DD
  cost: number; // تكلفة الاستحواذ التاريخية
  salvageValue: number; // القيمة التخريدية المقدرة (الخردة)
  usefulLifeYears: number; // العمر الإنتاجي المقدر بالسنوات
  depreciationMethod: DepreciationMethod; // طريقة الإهلاك (قسط ثابت / متناقص)
  annualRate: number; // النسبة المئوية السنوية للإهلاك %
  
  // حسابات الإهلاك المرتبطة
  assetAccountCode: string; // حساب الأصل الثابت بالتكلفة (مثل 1113)
  accumulatedDepAccountCode: string; // حساب مجمع الإهلاك (مثل 1123)
  expenseAccountCode: string; // حساب مصروف الإهلاك في قائمة الدخل (مثل 423)

  // القيم المالية المحسوبة
  priorAccumulatedDepreciation: number; // مجمع الإهلاك السابق
  currentPeriodDepreciation: number; // قسط إهلاك الفترة المحاسبية الحالية
  totalAccumulatedDepreciation: number; // إجمالي مجمع الإهلاك حتى تاريخه
  netBookValue: number; // القيمة الدفترية الصافية الحالية

  // بيانات إدارية ورقابية
  location: string; // الموقع / الفرع
  custodian?: string; // مسؤول العهدة / السائق
  invoiceRef?: string; // رقم فاتورة الشراء أو المستند
  status: AssetStatus;
  lastDepreciationDate?: string;
  disposalDate?: string;
  disposalAmount?: number;
  disposalGainLoss?: number;
  notes?: string;
  createdAt: string;
}

export interface DepreciationScheduleRow {
  year: number;
  yearLabel: string;
  beginningBookValue: number;
  depreciationExpense: number;
  endingAccumulatedDepreciation: number;
  endingBookValue: number;
  isCurrentOrPast: boolean;
}

export interface AssetCategorySummary {
  category: AssetCategory;
  categoryNameAr: string;
  assetsCount: number;
  totalCost: number;
  totalAccumulatedDep: number;
  totalNetBookValue: number;
  currentDepreciationExpense: number;
}
