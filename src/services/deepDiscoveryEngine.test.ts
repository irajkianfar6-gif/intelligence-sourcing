import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDiscoveryQuery,
  executeAuthoritativeExtraction,
  mergeCandidateIntoAppState,
  getInitialContinuousJobs,
  runContinuousJobCycle,
  detectAlibabaBaitPrice,
  executeAlibabaDeepScan,
} from './deepDiscoveryEngine';
import { MOCK_SUPPLIERS, MOCK_LANDED_COST_ITEMS } from '../data/mockData';

test('normalizeDiscoveryQuery infers HS code and category accurately', () => {
  const pipeQuery = normalizeDiscoveryQuery({
    productName: 'لوله‌های بدون درز کربن‌استیل API 5L',
    targetCountries: ['چین', 'هند'],
    sources: ['customs_bl', 'factory_registry'],
  });
  assert.equal(pipeQuery.category, 'steel_pipe');
  assert.equal(pipeQuery.hsCode, '۷۳۰۴٫۱۹');
  assert.ok(pipeQuery.baseBenchmarkFobUSD >= 800);

  const polymerQuery = normalizeDiscoveryQuery({
    productName: 'گرانول پلی‌اتیلن ترفتالات PET',
    targetCountries: ['کره جنوبی'],
    sources: ['commodity_exchange'],
  });
  assert.equal(polymerQuery.category, 'polymer_resin');
  assert.equal(polymerQuery.hsCode, '۳۹۰۷٫۶۱');
});

test('executeAuthoritativeExtraction generates rich verified candidates with price tiers and B/L records', () => {
  const result = executeAuthoritativeExtraction({
    productName: 'ورق فولادی گالوانیزه گرم Z275',
    hsCode: '۷۲۱۰٫۴۹',
    targetCountries: ['ویتنام', 'ترکیه', 'هند'],
    targetMaxFobUSD: 700,
    requiredStandards: ['DIN EN 10346', 'JIS G3302'],
    includeIntermediaries: false,
    sources: ['customs_bl', 'factory_registry', 'commodity_exchange', 'b2b_verified'],
    orderQuantityMT: 100,
  });

  assert.ok(result.candidates.length >= 4);
  assert.ok(result.lowestDiscoveredFobUSD > 0);
  assert.ok(result.averageCredibilityScore >= 85);

  const first = result.candidates[0];
  assert.equal(first.priceTiers.length, 3);
  assert.ok(first.priceTiers[2].unitPriceFobUSD < first.priceTiers[0].unitPriceFobUSD);
  assert.ok(first.customsRecords.length >= 2);
  assert.ok(first.technicalSpecsComparison.length >= 4);
  assert.ok(first.supplier.verificationLayers && first.supplier.verificationLayers.length === 8);
  assert.ok(first.landedCostBreakdown.unitLandedCost > first.supplier.unitPriceUSD);
});

test('executeAuthoritativeExtraction merges AI-grounded items with deterministic validation', () => {
  const result = executeAuthoritativeExtraction(
    {
      productName: 'ورق استنلس استیل ۳۰۴',
      targetCountries: ['ویتنام', 'کره جنوبی'],
      sources: ['customs_bl'],
    },
    [
      {
        name: 'Posco VST Stainless Co.',
        faName: 'پوسکو استنلس ویتنام',
        country: 'ویتنام',
        city: 'دونگ نای',
        unitPriceFobUSD: 1710,
        moq: 25,
        capacityMonthly: 35000,
        descriptionFa: 'تولیدکننده تخصصی ورق استنلس استیل ۳۰۴ و ۳۱۶ در جنوب ویتنام.',
      },
    ],
    [{ title: 'Posco VST Official Export Portal', uri: 'https://poscovst.com' }]
  );

  const aiMatched = result.candidates.find((c) => c.supplier.name === 'Posco VST Stainless Co.');
  assert.ok(aiMatched, 'AI grounded supplier should be present in extraction candidates');
  assert.equal(aiMatched.supplier.unitPriceUSD, 1710);
  assert.equal(aiMatched.verifiedSources[0].url, 'https://poscovst.com');
});

test('mergeCandidateIntoAppState adds new candidates and recalculates best landed cost option', () => {
  const extraction = executeAuthoritativeExtraction({
    productName: 'ورق گالوانیزه',
    targetCountries: ['ویتنام'],
    sources: ['customs_bl'],
  });

  const { updatedSuppliers, updatedLandedCosts, addedCount } = mergeCandidateIntoAppState(
    [extraction.candidates[0]],
    MOCK_SUPPLIERS,
    MOCK_LANDED_COST_ITEMS
  );

  assert.equal(addedCount, 1);
  assert.equal(updatedSuppliers.length, MOCK_SUPPLIERS.length + 1);
  assert.equal(updatedLandedCosts.length, MOCK_LANDED_COST_ITEMS.length + 1);
  assert.ok(updatedLandedCosts.some((c) => c.isBestOption));
});

test('runContinuousJobCycle updates job metrics, logs price quote, and creates alert', () => {
  const jobs = getInitialContinuousJobs();
  const initialJob = jobs[0];
  const prevPoints = initialJob.totalPricePointsLogged;

  const { updatedJob, updatedSuppliers, generatedAlert } = runContinuousJobCycle(
    initialJob,
    MOCK_SUPPLIERS
  );

  assert.ok(updatedJob.totalPricePointsLogged > prevPoints);
  assert.equal(updatedJob.recentLogs[0].timestampFa, 'هم‌اکنون');
  assert.ok(updatedSuppliers.length >= MOCK_SUPPLIERS.length);
  assert.ok(generatedAlert.title.includes('$'));
});

test('detectAlibabaBaitPrice flags unrealistically low bait listings and passes genuine FOB quotes', () => {
  const baitCheck = detectAlibabaBaitPrice(430, 665);
  assert.equal(baitCheck.isBait, true);
  assert.ok(baitCheck.noteFa.includes('قیمت طعمه‌ای'));

  const validCheck = detectAlibabaBaitPrice(632, 665);
  assert.equal(validCheck.isBait, false);
  assert.ok(validCheck.noteFa.includes('Trade Assurance'));
});

test('executeAlibabaDeepScan filters Verified Pro manufacturers and extracts direct Alibaba URLs', () => {
  const verifiedScan = executeAlibabaDeepScan({
    productKeyword: 'Hot-Dip Galvanized Steel Coil DX51D Z275',
    directAlibabaUrl: 'https://baosteel-export.en.alibaba.com',
    onlyVerifiedPro: true,
    requireTradeAssurance: true,
    minYearsOnAlibaba: 5,
    onlyDirectManufacturers: true,
    filterOutBaitPrices: true,
    orderQuantityMT: 100,
  });

  assert.ok(verifiedScan.candidates.length >= 4);
  assert.ok(verifiedScan.candidates.every((c) => c.alibabaProfile?.badgeTier === 'Verified Pro (SGS/TÜV)'));
  assert.ok(verifiedScan.candidates.every((c) => !c.alibabaProfile?.isBaitPriceFlagged));
  assert.ok(
    verifiedScan.candidates.some((c) => c.alibabaProfile?.storeSubdomain === 'baosteel-export.en.alibaba.com'),
    'Direct Alibaba store URL should be parsed and included in candidates'
  );
});

