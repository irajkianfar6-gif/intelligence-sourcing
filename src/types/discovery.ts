import { Supplier, LandedCostBreakdown } from './index';

export type ExtractionSourceType =
  | 'customs_bl'
  | 'factory_registry'
  | 'commodity_exchange'
  | 'b2b_verified';

export interface PriceTierQuote {
  minQty: number;
  maxQty: number | null;
  unitPriceFobUSD: number;
  unitPriceCifUSD: number;
  discountPercent: number;
}

export interface CustomsShipmentRecord {
  blNumber: string;
  shipmentDate: string;
  consigneeRegion: string;
  volumeMT: number;
  declaredValueUSD: number;
  portOfLoading: string;
  portOfDischarge: string;
  hsCode: string;
}

export interface ExtractedTechnicalSpec {
  parameterFa: string;
  extractedValue: string;
  targetRequirement: string;
  matchStatus: 'منطبق کامل' | 'انحراف جزئی قابل‌قبول' | 'نیازمند تأیید آزمایشگاه';
}

export interface VerifiedExtractionSource {
  title: string;
  url: string;
  sourceType: ExtractionSourceType;
  verifiedAt: string;
}

export interface SupplierContactMetadata {
  registryId: string;
  exportLicenseNo: string;
  chamberOfCommerce: string;
  portOfLoading: string;
  responseSlaHours: number;
  websiteDomain: string;
  verifiedEmailDomain: string;
}

export interface AlibabaVerificationProfile {
  storeSubdomain: string;
  storeUrl: string;
  badgeTier: 'Verified Pro (SGS/TÜV)' | 'Verified Supplier' | 'Gold Supplier';
  yearsOnAlibaba: number;
  tradeAssuranceLimitUSD: number;
  onlineRevenueLast12mUSD: number;
  onlineTransactionsCount: number;
  responseRatePercent: number;
  avgResponseTimeHours: number;
  onTimeDeliveryPercent: number;
  reorderRatePercent: number;
  storeRating: number; // out of 5.0
  reviewsCount: number;
  inspectionAgency: 'SGS' | 'TÜV Rheinland' | 'Bureau Veritas' | 'Intertek' | 'بدون ممیزی حضوری';
  auditReportNumber: string;
  businessTypeOnLicense: 'Manufacturer (تولیدکننده مستقیم در جواز کسب)' | 'Trading Company (بازرگانی / واسطه)' | 'Combined (تولیدی-بازرگانی)';
  oemOdmCapable: boolean;
  isBaitPriceFlagged: boolean;
  baitPriceNoteFa: string;
}

export interface ExtractedSupplierCandidate {
  id: string;
  supplier: Supplier;
  landedCostBreakdown: LandedCostBreakdown;
  specMatchPercent: number; // 0-100
  credibilityScore: number; // 0-100
  dataFreshnessFa: string;
  extractedAtIso: string;
  matchedHsCode: string;
  matchedProductName: string;
  priceTiers: PriceTierQuote[];
  priceHistory6m: number[];
  marketBenchmarkDiffPercent: number;
  customsRecords: CustomsShipmentRecord[];
  technicalSpecsComparison: ExtractedTechnicalSpec[];
  verifiedSources: VerifiedExtractionSource[];
  contactMetadata: SupplierContactMetadata;
  alibabaProfile?: AlibabaVerificationProfile;
  isImportedToDirectory?: boolean;
  aiGroundedSummaryFa?: string;
}

export interface AlibabaScanQueryInput {
  productKeyword: string;
  hsCode?: string;
  directAlibabaUrl?: string;
  onlyVerifiedPro: boolean;
  requireTradeAssurance: boolean;
  onlyDirectManufacturers: boolean;
  minYearsOnAlibaba: number;
  filterOutBaitPrices: boolean;
  targetMaxFobUSD?: number;
  orderQuantityMT?: number;
}

export interface DiscoveryQueryInput {
  productName: string;
  hsCode?: string;
  technicalSpecs?: string;
  targetCountries: string[];
  targetMaxFobUSD?: number;
  requiredStandards?: string[];
  minTrustScore?: number;
  includeIntermediaries?: boolean;
  sources: ExtractionSourceType[];
  orderQuantityMT?: number;
}

export interface DeepExtractionResult {
  queryId: string;
  executedAtFa: string;
  normalizedProduct: string;
  inferredHsCode: string;
  marketBenchmarkFobUSD: number;
  lowestDiscoveredFobUSD: number;
  averageCredibilityScore: number;
  totalScannedRecords: number;
  totalVerifiedCandidates: number;
  groundingUrls: { title: string; uri: string }[];
  candidates: ExtractedSupplierCandidate[];
  aiMarketSynthesisFa: string;
}

export interface CrawlLogEntry {
  id: string;
  timestampFa: string;
  eventFa: string;
  sourceBadge: string;
  priceQuotedUSD?: number;
  deltaPercent?: number;
  supplierName?: string;
  country?: string;
}

export interface ContinuousExtractionJob {
  id: string;
  productName: string;
  hsCode: string;
  targetCountries: string[];
  targetMaxFobUSD: number;
  requiredStandards: string[];
  frequency: 'هر ساعت' | 'هر ۶ ساعت' | 'روزانه' | 'بلادرنگ (Real-time)';
  status: 'فعال (در حال پایش)' | 'متوقف‌شده' | 'در حال استخراج...';
  sources: ExtractionSourceType[];
  lastRunFa: string;
  nextRunFa: string;
  totalSuppliersExtracted: number;
  totalPricePointsLogged: number;
  bestDiscoveredFobUSD: number;
  bestDiscoveredSupplierName: string;
  autoImportVerified: boolean;
  minCredibilityThreshold: number;
  recentLogs: CrawlLogEntry[];
}
