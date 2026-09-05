export type RatioCategory =
  | 'liquidity'
  | 'profitability'
  | 'leverage'
  | 'activity'
  | 'dupont';

export type RatioStatus = 'excellent' | 'good' | 'normal' | 'warning' | 'critical';

export interface FinancialRatioMetric {
  id: string;
  category: RatioCategory;
  categoryTitle: string;
  name: string;
  englishName: string;
  formula: string;
  unit: '%' | 'times' | 'days' | 'EGP';
  value2026: number; // السنة الحالية (2026)
  value2025: number; // السنة السابقة (2025)
  value2024: number; // سنة المقارنة الأساس (2024)
  changeYoY: number; // نسبة التغير السنوي %
  trend: 'up' | 'down' | 'stable';
  benchmark: string; // المعيار المصرفي والمحاسبي النموذجي
  status: RatioStatus;
  statusLabel: string;
  interpretation: string; // التفسير المالي الدقيق
  recommendation?: string; // التوصية الإدارية
}

export interface DuPontModel {
  netProfitMargin: number; // هامش صافي الربح %
  assetTurnover: number; // معدل دوران الأصول (مرات)
  equityMultiplier: number; // مضاعف الرفع المالي لحقوق الملكية
  roe: number; // العائد على حقوق الملكية ROE %
  priorRoe: number; // ROE العام السابق
  roeGrowth: number; // نسبة نمو العائد %
  roa: number; // العائد على الأصول ROA %
}

export interface MultiYearFinancialSummary {
  year: number;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  totalAssets: number;
  currentAssets: number;
  cashAndEquivalents: number;
  inventory: number;
  totalLiabilities: number;
  currentLiabilities: number;
  totalEquity: number;
  operatingCashFlow: number;
}

export interface FinancialHealthAssessment {
  overallScore: number; // درجة الصحة المالية من 100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  gradeLabel: string;
  liquidityHealth: string;
  profitabilityHealth: string;
  solvencyHealth: string;
  efficiencyHealth: string;
  auditorOpinionSummary: string;
  strategicRecommendations: string[];
}
