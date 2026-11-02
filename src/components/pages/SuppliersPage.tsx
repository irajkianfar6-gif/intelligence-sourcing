import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronDown,
  ExternalLink,
  Plus,
  ShieldCheck,
  Building,
  Filter,
  Database,
  Sparkles,
} from 'lucide-react';
import {
  Supplier,
  PageId,
  ProductSpec,
  ExtractedSupplierCandidate,
  ContinuousExtractionJob,
} from '../../types';
import { StatusPill } from '../common/StatusPill';
import { HatchedProgressBar } from '../common/HatchedBar';
import { toPersianDigits, formatPersianNumber } from '../../utils/formatters';
import { FakeSupplierDetectorModal } from '../tools/FakeSupplierDetectorModal';
import { SupplierManagementModal } from '../suppliers/SupplierManagementModal';
import { DeepDiscoveryCenter } from '../discovery/DeepDiscoveryCenter';

interface SuppliersPageProps {
  suppliers: Supplier[];
  products?: ProductSpec[];
  continuousJobs?: ContinuousExtractionJob[];
  initialDiscoveryQuery?: { productName: string; hsCode: string };
  onImportCandidates?: (candidates: ExtractedSupplierCandidate[]) => void;
  onRunJobCycle?: (jobId: string) => void;
  onToggleJobStatus?: (jobId: string) => void;
  onCreateContinuousJob?: (job: ContinuousExtractionJob) => void;
  onSelectSupplier: (supplier: Supplier) => void;
  onNavigate: (page: PageId, targetId?: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'warning') => void;
  onAddToRFQ: (supplier: Supplier) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({
  suppliers,
  products = [],
  continuousJobs = [],
  initialDiscoveryQuery,
  onImportCandidates,
  onRunJobCycle,
  onToggleJobStatus,
  onCreateContinuousJob,
  onSelectSupplier,
  onNavigate,
  onShowToast,
  onAddToRFQ,
}) => {
  const [typeFilter, setTypeFilter] = useState<'همه' | 'تولیدکننده' | 'واسطه'>('همه');
  const [minTrustScore, setMinTrustScore] = useState<number>(0);
  const [selectedCountry, setSelectedCountry] = useState<string>('همه');
  const [maxLeadTime, setMaxLeadTime] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'trust' | 'lead' | 'price'>('trust');
  const [isFakeDetectorOpen, setIsFakeDetectorOpen] = useState(false);
  const [managingSupplier, setManagingSupplier] = useState<Supplier | null>(null);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(true);

  // Filtered & Sorted suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => {
        if (typeFilter !== 'همه' && s.type !== typeFilter) return false;
        if (s.trustScore < minTrustScore) return false;
        if (selectedCountry !== 'همه' && s.country !== selectedCountry) return false;
        if (s.leadTimeDays > maxLeadTime) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            s.name.toLowerCase().includes(q) ||
            s.faName.includes(q) ||
            s.country.includes(q) ||
            s.city.includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'trust') return b.trustScore - a.trustScore;
        if (sortBy === 'lead') return a.leadTimeDays - b.leadTimeDays;
        if (sortBy === 'price') return a.unitPriceUSD - b.unitPriceUSD;
        return 0;
      });
  }, [suppliers, typeFilter, minTrustScore, selectedCountry, maxLeadTime, searchQuery, sortBy]);

  // KPIs
  const verifiedCount = suppliers.filter((s) => s.type === 'تولیدکننده' && s.trustScore >= 75).length;
  const flaggedCount = suppliers.filter((s) => s.isFlaggedFake).length;
  const avgTrustScore = Math.round(
    suppliers.reduce((acc, s) => acc + s.trustScore, 0) / suppliers.length
  );

  // Country breakdown for chart
  const countryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    suppliers.forEach((s) => {
      map[s.country] = (map[s.country] || 0) + 1;
    });
    return Object.entries(map);
  }, [suppliers]);

  return (
    <div className="space-y-6">
      {/* Deep Supplier & Continuous Price Extraction Hub */}
      {isDiscoveryOpen ? (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsDiscoveryOpen(false)}
              className="text-xs font-bold text-[#73726E] hover:text-[#111111] px-3 py-1 rounded-full bg-white border border-[#E5E3DC]"
            >
              جمع‌کردن پنل کاوش عمیق و مشاهده فقط جدول دایرکتوری
            </button>
          </div>
          <DeepDiscoveryCenter
            products={products}
            existingSuppliers={suppliers}
            continuousJobs={continuousJobs}
            initialProductQuery={initialDiscoveryQuery?.productName}
            initialHsCode={initialDiscoveryQuery?.hsCode}
            onImportCandidates={(cands) => {
              if (onImportCandidates) onImportCandidates(cands);
            }}
            onInspectSupplierVerification={(cand) => {
              if (onImportCandidates) onImportCandidates([cand]);
              onSelectSupplier(cand.supplier);
              onNavigate('verification', cand.supplier.id);
            }}
            onAddCandidateToRfq={(cand) => {
              if (onImportCandidates) onImportCandidates([cand]);
              onAddToRFQ(cand.supplier);
            }}
            onRunJobCycle={(jobId) => {
              if (onRunJobCycle) onRunJobCycle(jobId);
            }}
            onToggleJobStatus={(jobId) => {
              if (onToggleJobStatus) onToggleJobStatus(jobId);
            }}
            onCreateContinuousJob={(job) => {
              if (onCreateContinuousJob) onCreateContinuousJob(job);
            }}
            onShowToast={onShowToast}
          />
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-[#111111] text-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F3F94A] text-[#111111] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black block">
                موتور کاوش عمیق و استخراج مستمر قیمت‌ها و مشخصات تأمین‌کنندگان
              </span>
              <span className="text-[11px] text-white/70">
                اسکن بارنامه‌های گمرکی B/L، رجیستری کارخانجات و استعلام قیمت‌های پلکانی
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDiscoveryOpen(true)}
            className="px-5 py-2 rounded-full bg-[#F3F94A] text-[#111111] text-xs font-black hover:bg-[#e5ec3b]"
          >
            بازکردن مرکز کاوش و استخراج عمیق
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="آمار تأمین‌کنندگان">
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#73726E]">تولیدکنندگان مستقیم تأییدشده</span>
            <div className="text-3xl font-black text-[#111111] mt-1">
              {toPersianDigits(verifiedCount)} کارخانه
            </div>
            <span className="text-[11px] text-[#2D7D32] font-semibold mt-0.5 block">
              احراز صلاحیت فیزیکی و آزمایشگاهی
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D5E8D4] text-[#2D7D32] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setIsFakeDetectorOpen(true)}
          className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] flex items-center justify-between cursor-pointer hover:border-[#C53030] transition-all group"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#73726E]">واسطه‌های نشانه‌گذاری‌شده (ریسک)</span>
              <span className="text-[10px] bg-[#FDEBE6] text-[#C53030] px-2 py-0.5 rounded-full font-bold">
                کلیک برای ممیزی
              </span>
            </div>
            <div className="text-3xl font-black text-[#C53030] mt-1">
              {toPersianDigits(flaggedCount)} شرکت
            </div>
            <span className="text-[11px] text-[#C53030] font-semibold mt-0.5 block">
              مشکوک به شرکت کاغذی / عدم وجود تأسیسات
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FDEBE6] text-[#C53030] flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#73726E]">میانگین امتیاز اعتماد دایرکتوری</span>
            <div className="text-3xl font-black text-[#111111] mt-1">
              {toPersianDigits(avgTrustScore)} از ۱۰۰
            </div>
            <span className="text-[11px] text-[#73726E] font-semibold mt-0.5 block">
              مبتنی بر ۸ لایه اعتبارسنجی مستقل
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F3F94A] text-[#111111] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#E5E3DC] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Segmented Filter: همه | تولیدکننده | واسطه */}
          <div className="inline-flex p-1 rounded-full bg-[#F5F4EE] border border-[#E5E3DC]">
            {(['همه', 'تولیدکننده', 'واسطه'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  typeFilter === type
                    ? 'bg-[#111111] text-white shadow-none'
                    : 'text-[#73726E] hover:text-[#111111]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMinTrustScore(minTrustScore === 70 ? 0 : 70)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                minTrustScore === 70
                  ? 'bg-[#111111] text-[#F3F94A] border-[#111111]'
                  : 'bg-[#F5F4EE] text-[#73726E] border-[#E5E3DC]'
              }`}
            >
              اعتبار ۷۰+
            </button>

            <button
              onClick={() => setMaxLeadTime(maxLeadTime === 30 ? 100 : 30)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                maxLeadTime === 30
                  ? 'bg-[#111111] text-[#F3F94A] border-[#111111]'
                  : 'bg-[#F5F4EE] text-[#73726E] border-[#E5E3DC]'
              }`}
            >
              تحویل سریع (زیر ۳۰ روز)
            </button>

            {/* Country Selector Chip */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5F4EE] border border-[#E5E3DC] text-[#73726E] focus:outline-none"
            >
              <option value="همه">همه کشورها</option>
              <option value="ویتنام">ویتنام</option>
              <option value="ترکیه">ترکیه</option>
              <option value="هند">هند</option>
              <option value="چین">چین</option>
              <option value="کره جنوبی">کره جنوبی</option>
              <option value="امارات">امارات</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#73726E]">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5F4EE] border border-[#E5E3DC] text-[#111111] focus:outline-none"
            >
              <option value="trust">امتیاز اعتماد (بیشترین)</option>
              <option value="lead">زمان تحویل (سریع‌ترین)</option>
              <option value="price">قیمت واحد (کمترین)</option>
            </select>
          </div>
        </div>

        {/* Live Search inside Table */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#73726E] absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جست‌وجو بر اساس نام لاتین، نام فارسی، شهر، کشور..."
            className="w-full pl-4 pr-10 py-2 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs focus:border-[#111111] focus:outline-none"
          />
        </div>
      </section>

      {/* Main Suppliers Table */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#E5E3DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#E5E3DC] bg-[#F5F4EE] text-[11px] font-bold text-[#73726E]">
                <th className="py-3 px-5">نام تأمین‌کننده (لاتین / فارسی)</th>
                <th className="py-3 px-4">مبدأ</th>
                <th className="py-3 px-4">نوع</th>
                <th className="py-3 px-4">امتیاز اعتماد</th>
                <th className="py-3 px-4">ظرفیت ماهانه</th>
                <th className="py-3 px-4">حداقل سفارش (MOQ)</th>
                <th className="py-3 px-4">زمان تحویل</th>
                <th className="py-3 px-4">قیمت واحد FOB</th>
                <th className="py-3 px-4">اینکوترمز</th>
                <th className="py-3 px-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DC] text-xs font-medium">
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-[#F5F4EE]/60 transition-colors group"
                >
                  {/* Name and Tags */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#111111] text-sm">
                        {supplier.name}
                      </span>
                      {supplier.isBestMatch && (
                        <StatusPill label="بهترین تطابق" variant="ai" showDot={false} />
                      )}
                      {supplier.isFlaggedFake && (
                        <StatusPill label="مشکوک به شرکت جعلی" variant="alert" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#73726E] mt-0.5">
                      {supplier.faName} | تأسیس: {toPersianDigits(supplier.foundedYear)}
                    </div>
                  </td>

                  {/* Origin */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-[#111111]">{supplier.country}</div>
                    <div className="text-[11px] text-[#73726E]">{supplier.city}</div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusPill
                      label={supplier.type}
                      variant={supplier.type === 'تولیدکننده' ? 'green' : 'neutral'}
                      showDot={false}
                    />
                  </td>

                  {/* Trust Score as Hatched Progress Bar */}
                  <td className="py-3.5 px-4 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#111111]">
                        {toPersianDigits(supplier.trustScore)}
                      </span>
                      <div className="flex-1">
                        <HatchedProgressBar
                          value={supplier.trustScore}
                          isActive={supplier.trustScore >= 85}
                          activeColor="yellow"
                          height="h-2.5"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Capacity */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#111111]">
                    {formatPersianNumber(supplier.capacityMonthly)} {supplier.capacityUnit}
                  </td>

                  {/* MOQ */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#111111]">
                    {toPersianDigits(supplier.moq)} تن
                  </td>

                  {/* Lead Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#111111]">
                    {toPersianDigits(supplier.leadTimeDays)} روز
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#111111]">
                    {toPersianDigits(supplier.unitPriceUSD)} $
                  </td>

                  {/* Incoterms */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {supplier.incoterms.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-[10px] font-bold text-[#73726E]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setManagingSupplier(supplier);
                          onSelectSupplier(supplier);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#111111] text-white hover:bg-black text-xs font-bold transition-all shadow-none"
                      >
                        مدیریت جامع
                      </button>
                      <button
                        onClick={() => {
                          onAddToRFQ(supplier);
                          onShowToast('به استعلام اضافه شد', `${supplier.name} به استعلام قیمت افزوده شد.`, 'success');
                        }}
                        title="افزودن به استعلام قیمت"
                        className="w-8 h-8 rounded-full bg-[#F5F4EE] hover:bg-[#E5E3DC] border border-[#E5E3DC] flex items-center justify-center text-[#111111] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two Inset Cards: Country Distribution & Duplicate / Similar Suppliers Detection */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Country distribution bar chart */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC]">
          <h4 className="text-sm font-bold text-[#111111] mb-1">
            پراکندگی جغرافیایی تأمین‌کنندگان در پایگاه
          </h4>
          <p className="text-xs text-[#73726E] mb-4">
            تعداد کارخانجات و شرکت‌های ثبت شده به تفکیک مبدأ صادراتی
          </p>

          <div className="space-y-3">
            {countryCounts.map(([country, count]) => {
              const pct = Math.round((count / suppliers.length) * 100);
              const isLead = country === 'ویتنام' || country === 'چین';
              return (
                <div key={country} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{country}</span>
                    <span className="text-[#73726E]">
                      {toPersianDigits(count)} تأمین‌کننده ({toPersianDigits(pct)}٪)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#E5E3DC] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        isLead ? 'bg-[#F3F94A]' : 'bg-hatched-pattern bg-[#F5F4EE]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duplicate and Similar Suppliers Alert Card */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#111111]">
                شناسایی تأمین‌کنندگان تکراری و ذی‌نفعان مشترک
              </h4>
              <StatusPill label="هوش مصنوعی ضد جعل" variant="ai" />
            </div>
            <p className="text-xs text-[#73726E] mb-4 leading-relaxed">
              الگوریتم شبکه‌ای SourcingIQ آدرس‌های ثبت شرکت، شماره‌های تماس و حساب‌های بانکی را تطبیق داده است:
            </p>

            <div className="p-4 rounded-2xl bg-[#FDEBE6] border border-[#FADCD5] text-xs space-y-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-[#C53030]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>اشتراک حساب بانکی بین دو واسطه هنگ‌کنگی:</span>
              </div>
              <p className="text-[#73726E] leading-relaxed">
                شرکت «Apex Global Sourcing» و یک بازرگانی دیگر دارای یک ذی‌نفع مشترک در بانک استاندارد هنگ‌کنگ هستند و در قیمت‌گذاری با یکدیگر هماهنگ عمل می‌کنند.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFakeDetectorOpen(true)}
            className="w-full py-2.5 rounded-full bg-[#111111] hover:bg-black text-xs font-bold text-[#F3F94A] transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>اجرای تست جامع ۸ شاخص شرکت‌های جعلی</span>
          </button>
        </div>
      </section>

      {/* Fake Supplier Detector Modal */}
      <FakeSupplierDetectorModal
        isOpen={isFakeDetectorOpen}
        onClose={() => setIsFakeDetectorOpen(false)}
        suppliers={suppliers}
      />

      {/* Comprehensive Supplier Management Modal */}
      <SupplierManagementModal
        supplier={managingSupplier}
        isOpen={Boolean(managingSupplier)}
        onClose={() => setManagingSupplier(null)}
        onAddToRFQ={onAddToRFQ}
        onOrderInspection={(s) => {
          setManagingSupplier(null);
          onSelectSupplier(s);
          onNavigate('verification', s.id);
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
