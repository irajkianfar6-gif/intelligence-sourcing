import React, { useState, useMemo } from 'react';
import {
  Package,
  Layers,
  Sparkles,
  UploadCloud,
  Check,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Globe,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { ProductSpec, PageId } from '../../types';
import { calculateProductCompleteness } from '../../utils/calculations';
import { toPersianDigits, formatPersianNumber } from '../../utils/formatters';
import { StatusPill } from '../common/StatusPill';

interface ProductsPageProps {
  products: ProductSpec[];
  onSelectProduct: (product: ProductSpec) => void;
  onAddProduct?: (product: ProductSpec) => void;
  onTriggerDeepDiscovery?: (productName: string, hsCode: string) => void;
  onNavigate: (page: PageId, targetId?: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'warning') => void;
}

const STEPS = [
  { id: 1, label: 'کالا' },
  { id: 2, label: 'مشخصات' },
  { id: 3, label: 'حجم' },
  { id: 4, label: 'مبدأ' },
  { id: 5, label: 'تحویل' },
  { id: 6, label: 'شرایط' },
];

const AVAILABLE_STANDARDS = [
  'DIN EN 10346',
  'JIS G3302',
  'ASTM A653',
  'ISO 9001',
  'CE Mark',
  'API 5L',
  'GB/T 2518',
  'FDA Food Grade',
];

const AVAILABLE_COUNTRIES = [
  'ویتنام',
  'ترکیه',
  'هند',
  'چین',
  'کره جنوبی',
  'ژاپن',
  'امارات',
  'تایوان',
];

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onSelectProduct,
  onAddProduct,
  onTriggerDeepDiscovery,
  onNavigate,
  onShowToast,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeProductList, setActiveProductList] = useState<ProductSpec[]>(products);

  // Active form state
  const [formData, setFormData] = useState({
    name: 'ورق فولادی گالوانیزه رول شده (Hot-Dip Galvanized Coil)',
    usage: 'صنایع ساختمانی، لوله و پروفیل و لوازم خانگی صنعتی',
    hsCode: '۷۲۱۰٫۴۹',
    brand: 'کیفیت تجاری Prime استاندارد',
    standards: ['DIN EN 10346', 'JIS G3302', 'ASTM A653'],
    material: 'فولاد نورد سرد کربنی DX51D+Z با پوشش روی Z275',
    dimensions: 'ضخامت ۰٫۸۰ میلیمتر | عرض ۱۲۵۰ میلیمتر',
    weight: 'کلاف‌های ۴ تا ۶ تن',
    packaging: 'بسته‌بندی دریایی چهارلایه ضدزنگ فلزی با پالت چوبی',
    qualityGrade: 'درجه یک تجاری منظم (Regular Spangle)',
    moq: 50,
    unit: 'تن متری',
    monthlyVolume: 250,
    annualVolume: 3000,
    acceptedCountries: ['ویتنام', 'ترکیه', 'هند', 'چین'],
    requiredLeadTimeDays: 30,
    targetBudgetUSD: 720,
    paymentTerms: 'اعتبار اسنادی LC ۶۰ روزه یا TT دیداری',
    finalDestination: 'بندر عباس (مجتمع بندری شهید رجایی)',
    incoterm: 'CIF' as 'FOB' | 'CIF' | 'DAP',
  });

  // Calculate live completeness score
  const completenessScore = useMemo(() => {
    return calculateProductCompleteness({
      name: formData.name,
      hsCode: formData.hsCode,
      usage: formData.usage,
      standardsCount: formData.standards.length,
      material: formData.material,
      dimensions: formData.dimensions,
      qualityGrade: formData.qualityGrade,
      moq: formData.moq,
      volume: formData.annualVolume,
      countriesCount: formData.acceptedCountries.length,
      leadTime: formData.requiredLeadTimeDays,
      budget: formData.targetBudgetUSD,
      paymentTerms: formData.paymentTerms,
      destination: formData.finalDestination,
      incoterm: formData.incoterm,
    });
  }, [formData]);

  // Dynamic matching suppliers count based on accepted countries
  const matchingSuppliersCount = useMemo(() => {
    if (formData.acceptedCountries.length === 0) return 0;
    // rough count for demo realism
    return Math.min(18, formData.acceptedCountries.length * 3 + 2);
  }, [formData.acceptedCountries]);

  const toggleStandard = (std: string) => {
    setFormData((prev) => ({
      ...prev,
      standards: prev.standards.includes(std)
        ? prev.standards.filter((s) => s !== std)
        : [...prev.standards, std],
    }));
  };

  const toggleCountry = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      acceptedCountries: prev.acceptedCountries.includes(country)
        ? prev.acceptedCountries.filter((c) => c !== country)
        : [...prev.acceptedCountries, country],
    }));
  };

  const handleSaveProduct = () => {
    const newProd: ProductSpec = {
      id: `prod-${Date.now()}`,
      name: formData.name,
      faUsage: formData.usage,
      hsCode: formData.hsCode,
      brand: formData.brand,
      standards: formData.standards,
      material: formData.material,
      dimensions: formData.dimensions,
      weight: formData.weight,
      packaging: formData.packaging,
      qualityGrade: formData.qualityGrade,
      moq: formData.moq,
      unit: formData.unit,
      monthlyVolume: formData.monthlyVolume,
      annualVolume: formData.annualVolume,
      acceptedCountries: formData.acceptedCountries,
      requiredLeadTimeDays: formData.requiredLeadTimeDays,
      targetBudgetUSD: formData.targetBudgetUSD,
      paymentTerms: formData.paymentTerms,
      finalDestination: formData.finalDestination,
      incoterm: formData.incoterm,
      completenessPercent: completenessScore,
    };
    setActiveProductList([newProd, ...activeProductList]);
    if (onAddProduct) {
      onAddProduct(newProd);
    }
    onShowToast('کالای جدید با موفقیت ثبت شد', 'مشخصات با پایگاه داده تأمین‌کنندگان تطبیق داده شد', 'success');
    return newProd;
  };

  return (
    <div className="space-y-6">
      {/* 6-Step Pill Stepper */}
      <section className="bg-[#FFFFFF] p-3 rounded-full border border-[#E5E3DC] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 min-w-[110px] py-2.5 px-4 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#111111] text-white shadow-none'
                  : isDone
                  ? 'bg-[#F3F94A] text-[#111111]'
                  : 'bg-[#F5F4EE] text-[#73726E] hover:text-[#111111]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  isActive
                    ? 'bg-white text-black'
                    : isDone
                    ? 'bg-black text-[#F3F94A]'
                    : 'bg-[#E5E3DC] text-[#73726E]'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : toPersianDigits(step.id)}
              </span>
              <span>مرحله {toPersianDigits(step.id)}: {step.label}</span>
            </button>
          );
        })}
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: کالا و شناسه گمرکی */}
          {currentStep === 1 && (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#111111]">گام ۱: مشخصات اولیه و کد تعرفه کالا</h3>
                  <p className="text-xs text-[#73726E] mt-0.5">نام تجاری، کاربرد صنعتی و کد سیستم هماهنگ‌شده (HS Code)</p>
                </div>
                <StatusPill label="شناسه کالا" variant="ai" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[#111111]">نام کالا (فارسی و انگلیسی)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                    placeholder="مثال: ورق فولادی گالوانیزه رول شده"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">کد تعرفه گمرکی (HS Code)</label>
                  <input
                    type="text"
                    value={formData.hsCode}
                    onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none text-left font-mono"
                    placeholder="7210.49"
                  />
                  <span className="text-[11px] text-[#73726E]">
                    محصولات نورد شده از آهن یا فولاد غیر ممزوج، با عرض ۶۰۰ میلیمتر یا بیشتر
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">برند / تیپ کیفی</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                    placeholder="کیفیت تجاری Prime"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[#111111]">کاربرد اصلی در زنجیره ارزش</label>
                  <textarea
                    rows={2}
                    value={formData.usage}
                    onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none resize-none"
                    placeholder="توضیح کاربرد محصول در کارخانه یا خطوط تولید"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: مشخصات فنی و استانداردها */}
          {currentStep === 2 && (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-5">
              <div className="border-b border-[#E5E3DC] pb-4">
                <h3 className="text-base font-bold text-[#111111]">گام ۲: مشخصات متالورژی، ابعاد و استانداردها</h3>
                <p className="text-xs text-[#73726E] mt-0.5">استانداردهای بین‌المللی مرجع و خصوصیات فیزیکی</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-2">
                  استانداردهای الزامی و گواهی‌نامه‌ها (انتخاب سریع چیپ‌ها)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_STANDARDS.map((std) => {
                    const selected = formData.standards.includes(std);
                    return (
                      <button
                        key={std}
                        type="button"
                        onClick={() => toggleStandard(std)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-[#F5F4EE] text-[#73726E] border-[#E5E3DC] hover:border-[#111111]'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {std}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">جنس و گرید متریال</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">ابعاد دقیق و ضخامت</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">بسته‌بندی و محافظت سطحی</label>
                  <input
                    type="text"
                    value={formData.packaging}
                    onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">درجه کیفی و وضعیت اسپنگل</label>
                  <input
                    type="text"
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: حجم و حداقل سفارش */}
          {currentStep === 3 && (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-5">
              <div className="border-b border-[#E5E3DC] pb-4">
                <h3 className="text-base font-bold text-[#111111]">گام ۳: مقادیر خرید و ظرفیت سفارش</h3>
                <p className="text-xs text-[#73726E] mt-0.5">حجم ماهانه، تقاضای سالانه و حداقل سفارش قابل‌قبول (MOQ)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">حداقل سفارش مجاز (MOQ)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                    />
                    <span className="px-3 py-2.5 bg-[#FFFFFF] border border-[#E5E3DC] rounded-full text-xs font-bold">تن</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">حجم برآوردی ماهانه</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({ ...formData, monthlyVolume: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                    />
                    <span className="px-3 py-2.5 bg-[#FFFFFF] border border-[#E5E3DC] rounded-full text-xs font-bold">تن</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">قرارداد سالانه کل</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.annualVolume}
                      onChange={(e) => setFormData({ ...formData, annualVolume: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                    />
                    <span className="px-3 py-2.5 bg-[#FFFFFF] border border-[#E5E3DC] rounded-full text-xs font-bold">تن</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#111111]">امتیاز تجاری حجم خرید:</span>
                  <p className="text-[11px] text-[#73726E] mt-0.5">حجم بالای ۳۰۰۰ تن در سال به شما قدرت چانه‌زنی تخفیف ۴ تا ۶ درصدی در قراردادهای FOB می‌دهد.</p>
                </div>
                <span className="px-3 py-1 bg-[#D5E8D4] text-[#2D7D32] rounded-full font-bold">تخفیف حجمی فعال</span>
              </div>
            </div>
          )}

          {/* Step 4: مبدأ و کشورهای مجاز */}
          {currentStep === 4 && (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-5">
              <div className="border-b border-[#E5E3DC] pb-4">
                <h3 className="text-base font-bold text-[#111111]">گام ۴: کشورهای مبدأ و ارزیابی ژئوپلیتیک</h3>
                <p className="text-xs text-[#73726E] mt-0.5">مشخص کنید استعلام‌های قیمت برای چه کشورهایی مجاز به صدور است</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-2">
                  کشورهای مورد تأیید برای ارسال استعلام (انتخاب چیپ‌ها)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COUNTRIES.map((c) => {
                    const selected = formData.acceptedCountries.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCountry(c)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          selected
                            ? 'bg-[#111111] text-[#F3F94A] border-[#111111]'
                            : 'bg-[#F5F4EE] text-[#73726E] border-[#E5E3DC] hover:border-[#111111]'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FDFDE8] border border-[#F3F94A] text-xs">
                <div className="flex items-center gap-2 font-bold text-[#111111] mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>توصیه هوشمند الگوریتم بازار:</span>
                </div>
                <p className="text-[#73726E] leading-relaxed">
                  افزودن کشور ویتنام به لیست مجاز موجب کشف ۳ تأمین‌کننده با ظرفیت آزاد و قیمت FOB زیر ۷۰۰ دلار شده است.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: تحویل و اینکوترمز */}
          {currentStep === 5 && (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-5">
              <div className="border-b border-[#E5E3DC] pb-4">
                <h3 className="text-base font-bold text-[#111111]">گام ۵: زمان تحویل و شرایط اینکوترمز (Incoterms)</h3>
                <p className="text-xs text-[#73726E] mt-0.5">تعیین محل انتقال مسئولیت و بارگیری</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-2">شرط تحویل بین‌المللی (Incoterm)</label>
                <div className="inline-flex p-1 rounded-full bg-[#F5F4EE] border border-[#E5E3DC]">
                  {(['FOB', 'CIF', 'DAP'] as const).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setFormData({ ...formData, incoterm: term })}
                      className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                        formData.incoterm === term
                          ? 'bg-[#111111] text-white'
                          : 'text-[#73726E] hover:text-[#111111]'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">بندر یا مقصد نهایی تحویل</label>
                  <input
                    type="text"
                    value={formData.finalDestination}
                    onChange={(e) => setFormData({ ...formData, finalDestination: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">حداکثر زمان تحویل مجاز (روز)</label>
                  <input
                    type="number"
                    value={formData.requiredLeadTimeDays}
                    onChange={(e) => setFormData({ ...formData, requiredLeadTimeDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: شرایط مالی و بارگذاری دسته‌ای */}
          {currentStep === 6 && (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-5">
              <div className="border-b border-[#E5E3DC] pb-4">
                <h3 className="text-base font-bold text-[#111111]">گام ۶: بودجه هدف و شرایط پرداخت</h3>
                <p className="text-xs text-[#73726E] mt-0.5">تعیین سقف بودجه و شرایط تسویه تجاری</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">بودجه هدف (دلار به ازای هر واحد)</label>
                  <input
                    type="number"
                    value={formData.targetBudgetUSD}
                    onChange={(e) => setFormData({ ...formData, targetBudgetUSD: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111111]">روش پرداخت ترجیحی</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-medium focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="pt-2">
                <label className="text-xs font-bold text-[#111111] block mb-2">
                  بارگذاری مشخصات فنی یا فایل لیست قطعات (Excel / CSV / PDF)
                </label>
                <div
                  onClick={() => onShowToast('فایل نمونه با موفقیت ضمیمه شد', 'مشخصات ابعادی فایل پردازش گردید', 'info')}
                  className="border-2 border-dashed border-[#D0CEBE] rounded-3xl p-6 text-center hover:border-[#111111] cursor-pointer bg-[#F5F4EE] transition-all"
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-[#73726E] mb-2" />
                  <span className="text-xs font-bold text-[#111111] block">
                    کلیک برای بارگذاری فایل مشخصات فنی کالا یا BOM
                  </span>
                  <span className="text-[11px] text-[#73726E] mt-1 block">
                    فرمت‌های مجاز: XLSX، CSV، PDF حداکثر تا سقف ۲۰ مگابایت
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#E5E3DC] text-xs font-semibold text-[#111111] hover:bg-[#F5F4EE] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>مرحله قبل</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProduct}
                className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#111111] text-xs font-bold text-[#111111] hover:bg-[#F5F4EE]"
              >
                ذخیره در پیش‌نویس‌ها
              </button>
              {currentStep < 6 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                  className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-black flex items-center gap-2"
                >
                  <span>مرحله بعد</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              ) : (
                  <button
                    onClick={() => {
                      handleSaveProduct();
                      if (onTriggerDeepDiscovery) {
                        onTriggerDeepDiscovery(formData.name, formData.hsCode);
                      } else {
                        onNavigate('suppliers');
                      }
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#F3F94A] text-[#111111] text-xs font-black hover:bg-[#e4eb31] flex items-center gap-2"
                  >
                    <span>کاوش عمیق و استخراج تأمین‌کنندگان</span>
                    <Search className="w-3.5 h-3.5" />
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Live Completeness + AI Suggestions (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Yellow Completeness Card */}
          <div className="p-6 rounded-3xl bg-[#F3F94A] border border-[#E5E3DC] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black bg-[#111111] text-[#F3F94A] px-3 py-1 rounded-full">
                کیفیت داده
              </span>
              <span className="text-xs text-[#111111] font-bold">موتور تطبیق خودکار</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#111111] block mb-1">
                کامل‌بودن مشخصات کالا
              </span>
              <div className="text-5xl font-black text-[#111111] tracking-tight">
                {toPersianDigits(completenessScore)}٪
              </div>
              <p className="text-xs text-[#111111]/80 mt-2 font-medium">
                {completenessScore >= 80
                  ? 'مشخصات فنی کافی برای استعلام بدون ابهام در بازارهای بین‌المللی است.'
                  : 'تکمیل ابعاد و استانداردهای مرجع، نرخ خطای قیمت‌گذاری را تا ۷۰٪ کاهش می‌دهد.'}
              </p>
            </div>

            {/* Inset matching count block */}
            <div className="p-3.5 bg-black text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-white/70 block">تأمین‌کنندگان منطبق در پایگاه:</span>
                <span className="text-sm font-bold text-[#F3F94A]">
                  آماده دریافت مستقیم RFQ
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {toPersianDigits(matchingSuppliersCount)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onTriggerDeepDiscovery) {
                  onTriggerDeepDiscovery(formData.name, formData.hsCode);
                } else {
                  onNavigate('suppliers');
                }
              }}
              className="w-full py-2.5 px-4 rounded-full bg-[#111111] text-[#F3F94A] hover:bg-black text-xs font-black transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>کاوش عمیق و استخراج قیمت برای این کالا</span>
            </button>
          </div>

          {/* AI Suggestions Card */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#111111]" />
              <h4 className="text-xs font-bold text-[#111111]">پیشنهادات هوشمند SourcingIQ</h4>
            </div>
            <div className="space-y-2.5 text-xs text-[#73726E]">
              <div className="p-3 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC]">
                <strong className="text-[#111111] block mb-1">الزام استاندارد پوشش روی (Zinc Coating):</strong>
                برای مصارف فضای باز یا لوله‌سازی، درج پوشش حداقل Z275 از ادعاهای حقوقی بعدی در گمرک پیشگیری می‌کند.
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC]">
                <strong className="text-[#111111] block mb-1">توصیه ترم تحویل:</strong>
                با توجه به نوسان کرایه‌های خطوط کشتیرانی، اخذ پیشنهاد به صورت FOB بندر مبدأ توصیه می‌شود تا قرارداد فورواردری به صورت متمرکز منعقد گردد.
              </div>
            </div>
          </div>

          {/* Existing Products Under Definition */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#111111]">کالاهای موجود تحت تعریف</h4>
              <span className="text-[11px] text-[#73726E] font-medium">
                {toPersianDigits(activeProductList.length)} کالا
              </span>
            </div>

            <div className="space-y-2">
              {activeProductList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    setFormData({
                      name: p.name,
                      usage: p.faUsage,
                      hsCode: p.hsCode,
                      brand: p.brand,
                      standards: p.standards,
                      material: p.material,
                      dimensions: p.dimensions,
                      weight: p.weight,
                      packaging: p.packaging,
                      qualityGrade: p.qualityGrade,
                      moq: p.moq,
                      unit: p.unit,
                      monthlyVolume: p.monthlyVolume,
                      annualVolume: p.annualVolume,
                      acceptedCountries: p.acceptedCountries,
                      requiredLeadTimeDays: p.requiredLeadTimeDays,
                      targetBudgetUSD: p.targetBudgetUSD,
                      paymentTerms: p.paymentTerms,
                      finalDestination: p.finalDestination,
                      incoterm: p.incoterm,
                    });
                    onShowToast(`کالای ${p.name.slice(0, 25)} بارگذاری شد`, '', 'info');
                  }}
                  className="p-3 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] hover:border-[#111111] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="truncate pl-2">
                    <div className="text-xs font-bold text-[#111111] truncate">{p.name}</div>
                    <div className="text-[10px] text-[#73726E] mt-0.5">
                      HS: {p.hsCode} | حجم: {toPersianDigits(p.monthlyVolume)} تن/ماه
                    </div>
                  </div>
                  <span className="text-[11px] font-black bg-white px-2 py-0.5 rounded-full border border-[#E5E3DC] shrink-0">
                    {toPersianDigits(p.completenessPercent)}٪
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
