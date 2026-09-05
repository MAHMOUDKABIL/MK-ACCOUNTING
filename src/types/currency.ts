export type CurrencyCode = 'EGP' | 'USD' | 'EUR' | 'SAR' | 'AED' | 'GBP' | 'KWD' | 'QAR';

export interface CurrencyConfig {
  code: CurrencyCode;
  nameAr: string;
  nameEn: string;
  symbol: string;
  flag: string;
  defaultRate: number; // سعر الصرف مقابل الجنيه المصري (EGP)
  isBase?: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'EGP',
    nameAr: 'الجنيه المصري (العملة الأساسية)',
    nameEn: 'Egyptian Pound',
    symbol: 'ج.م',
    flag: '🇪🇬',
    defaultRate: 1.0,
    isBase: true,
  },
  {
    code: 'USD',
    nameAr: 'الدولار الأمريكي',
    nameEn: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    defaultRate: 49.25,
  },
  {
    code: 'EUR',
    nameAr: 'اليورو الأوروبي',
    nameEn: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    defaultRate: 53.40,
  },
  {
    code: 'SAR',
    nameAr: 'الريال السعودي',
    nameEn: 'Saudi Riyal',
    symbol: 'ر.س',
    flag: '🇸🇦',
    defaultRate: 13.12,
  },
  {
    code: 'AED',
    nameAr: 'الدرهم الإماراتي',
    nameEn: 'UAE Dirham',
    symbol: 'د.إ',
    flag: '🇦🇪',
    defaultRate: 13.41,
  },
  {
    code: 'GBP',
    nameAr: 'الجنيه الإسترليني',
    nameEn: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    defaultRate: 63.80,
  },
  {
    code: 'KWD',
    nameAr: 'الدينار الكويتي',
    nameEn: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    flag: '🇰🇼',
    defaultRate: 160.50,
  },
  {
    code: 'QAR',
    nameAr: 'الريال القطري',
    nameEn: 'Qatari Riyal',
    symbol: 'ر.ق',
    flag: '🇶🇦',
    defaultRate: 13.52,
  },
];

export interface FXRevaluationItem {
  id: string;
  accountCode: string;
  accountName: string;
  accountCategory: 'assets' | 'liabilities';
  currency: CurrencyCode;
  foreignBalance: number; // الرصيد بالعملة الأجنبية
  bookExchangeRate: number; // سعر الصرف الدفتري السابق
  bookValueEGP: number; // القيمة الدفترية بالجنيه = foreignBalance * bookExchangeRate
  closingExchangeRate: number; // سعر الصرف في تاريخ التقييم (الإقفال)
  revaluedValueEGP: number; // القيمة بعد إعادة التقييم = foreignBalance * closingExchangeRate
  fxGainLossEGP: number; // فرق التقييم = revaluedValueEGP - bookValueEGP (أو العكس للالتزامات)
  type: 'gain' | 'loss';
}

export interface FXRevaluationReport {
  revaluationDate: string;
  fiscalYear: string;
  standardReference: string; // EAS 13 - معيار المحاسبة المصري رقم 13
  items: FXRevaluationItem[];
  totalGainsEGP: number;
  totalLossesEGP: number;
  netFXImpactEGP: number; // صافي أرباح/خسائر فروق العملة
  journalEntrySuggested: {
    description: string;
    debitLines: Array<{ accountCode: string; accountName: string; amount: number; note: string }>;
    creditLines: Array<{ accountCode: string; accountName: string; amount: number; note: string }>;
  };
}
