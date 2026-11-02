export type PageId =
  | 'dashboard'
  | 'products'
  | 'suppliers'
  | 'verification'
  | 'comparison'
  | 'rfq'
  | 'markets'
  | 'monitoring'
  | 'reports'
  | 'settings';

export type SupplierType = 'تولیدکننده' | 'واسطه';

export interface VerificationLayer {
  id: string;
  title: string;
  status: 'تأیید شده' | 'در حال بررسی' | 'نیاز به مدرک' | 'هشدار ریسک';
  score: number; // 0-100
  description: string;
  iconName: string;
}

export interface SupplierDocument {
  id: string;
  name: string;
  category: string;
  date: string;
  size: string;
  verified: boolean;
}

export interface SupplierReview {
  id: string;
  buyerName: string;
  country: string;
  date: string;
  rating: number;
  comment: string;
  orderVolume: string;
}

export interface ProductionCapacityDetails {
  annualCapacity: number;
  monthlyCapacity: number;
  unit: string;
  activeLinesCount: number;
  utilizationRate: number; // 0-100
  factoryAreaM2: string;
  leadTimeDays: number;
  equipmentMakers: string[];
  warehouseCapacityTons: number;
}

export interface PerformanceScorecard {
  overallScore: number; // 0-100
  onTimeDeliveryRate: number; // e.g. 98.2%
  qualityPassRate: number; // e.g. 99.4%
  rfqResponseHours: number; // e.g. 3.5 hrs
  priceStabilityScore: number; // 0-100
  sampleApprovalRate: number; // e.g. 100%
  historicalOrdersCount: number;
}

export interface RiskAssessmentDetails {
  overallRiskLevel: 'کم‌خطر' | 'ریسک متوسط' | 'ریسک بالا' | 'بحرانی';
  financialStabilityScore: number; // 0-100
  fraudShellRiskScore: number; // 0-100 (low = safe)
  geopoliticalLogisticsRisk: number; // 0-100
  legalDisputeRecordsCount: number;
  riskSummaryFa: string;
  mitigationRecommendation: string;
}

export interface CooperationRecord {
  id: string;
  orderNumber: string;
  date: string;
  productName: string;
  volumeTons: number;
  totalAmountUSD: number;
  incoterm: string;
  blNumber: string;
  status: 'تحویل‌شده و تسویه‌شده' | 'در حال حمل دریایی' | 'در مرحله ترخیص گمرکی' | 'سفارش در جریان تولید';
  qualityRating: number; // 1-5
  notes: string;
}

export interface Supplier {
  id: string;
  name: string; // Latin name
  faName: string;
  type: SupplierType;
  country: string;
  countryCode: string;
  city: string;
  foundedYear: number;
  trustScore: number; // 0-100
  isBestMatch?: boolean;
  isFlaggedFake?: boolean;
  capacityMonthly: number; // tons or units
  capacityUnit: string;
  moq: number;
  leadTimeDays: number;
  incoterms: string[];
  unitPriceUSD: number;
  paymentTerms: string;
  sampleAvailable: boolean;
  sampleCostUSD: number;
  exportMarkets: string[];
  description: string;
  employeesCount: string;
  factoryArea: string;
  certifications: string[];
  verificationLayers?: VerificationLayer[];
  documents?: SupplierDocument[];
  complaintsHistory?: {
    date: string;
    type: string;
    resolution: string;
    status: 'حل‌شده' | 'در حال پیگیری';
  }[];
  reviews?: SupplierReview[];
  productionDetails?: ProductionCapacityDetails;
  performanceScorecard?: PerformanceScorecard;
  riskAssessment?: RiskAssessmentDetails;
  cooperationHistory?: CooperationRecord[];
}

export interface ProductSpec {
  id: string;
  name: string;
  faUsage: string;
  hsCode: string;
  brand: string;
  standards: string[];
  material: string;
  dimensions: string;
  weight: string;
  packaging: string;
  qualityGrade: string;
  moq: number;
  unit: string;
  monthlyVolume: number;
  annualVolume: number;
  acceptedCountries: string[];
  requiredLeadTimeDays: number;
  targetBudgetUSD: number;
  paymentTerms: string;
  finalDestination: string;
  incoterm: 'FOB' | 'CIF' | 'DAP';
  completenessPercent: number;
}

export interface RFQResponse {
  id: string;
  supplierId: string;
  supplierName: string;
  unitPriceUSD: number;
  incoterm: 'FOB' | 'CIF' | 'DAP';
  normalizedCifUSD: number;
  moq: number;
  leadTimeDays: number;
  paymentTerms: string;
  sampleProvided: 'رایگان' | 'با هزینه' | 'ارائه نمی‌شود';
  status: 'دریافت شد' | 'اطلاعات ناقص' | 'در انتظار';
  responseDate: string;
}

export interface RFQItem {
  id: string;
  code: string;
  title: string;
  productName: string;
  hsCode: string;
  createdDate: string;
  deadlineDate: string;
  sentCount: number;
  openedCount: number;
  respondedCount: number;
  shortlistedCount: number;
  status: 'فعال' | 'پایان‌یافته' | 'در حال مذاکره';
  responses: RFQResponse[];
}

export interface LandedCostBreakdown {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  currency: string;
  deliveryPoint: string;
  incoterm: string;
  packaging: number;
  inlandFreight: number;
  internationalFreight: number;
  insurance: number;
  duties: number;
  customsClearance: number;
  otherExpenses: number;
  totalLandedCost: number;
  unitLandedCost: number;
  leadTimeDays: number;
  paymentTerms: string;
  fxRisk: 'پایین' | 'متوسط' | 'بالا';
  inspectionCost: number;
  isBestOption?: boolean;
  isCheapestRisky?: boolean;
}

export interface MarketAlternative {
  country: string;
  countryCode: string;
  countryFa: string;
  exportVolumeMT: number;
  avgExportPriceUSD: number;
  priceTrend24m: number[];
  freightToDestinationUSD: number;
  tradeRestrictions: string;
  riskLevel: 'کم' | 'متوسط' | 'زیاد';
  savingsPercentVsCurrent: number;
  topSuppliersCount: number;
  politicalRisk: number; // 0-100
  fxRisk: number;
  logisticsRisk: number;
  customsRisk: number;
}

export interface MonitoringAlert {
  id: string;
  type:
    | 'تأمین‌کننده جدید'
    | 'کاهش قیمت'
    | 'افزایش هزینه حمل'
    | 'تغییر تعرفه'
    | 'هشدار ظرفیت'
    | 'اختلال در کشور مبدأ';
  title: string;
  description: string;
  date: string;
  time: string;
  productName: string;
  country?: string;
  supplierName?: string;
  deltaPercent?: number;
  isFeatured?: boolean;
  read: boolean;
  targetPage: PageId;
  targetId?: string;
}

export interface RankingWeights {
  landedCost: number; // default 30%
  trustScore: number; // default 20%
  quality: number; // default 15%
  capacity: number; // default 10%
  leadTime: number; // default 10%
  paymentTerms: number; // default 5%
  countryRisk: number; // default 5%
  responsiveness: number; // default 5%
}

export * from './discovery';

