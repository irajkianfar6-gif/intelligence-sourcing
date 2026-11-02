import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Bell,
  Sparkles,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Mail,
  Smartphone,
  Zap,
} from 'lucide-react';
import { MonitoringAlert, ProductSpec, PageId, ContinuousExtractionJob } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Sparkline } from '../common/Sparkline';
import { toPersianDigits, formatPersianNumber } from '../../utils/formatters';
import { LiveMarketTicker } from '../market/LiveMarketTicker';

interface MonitoringPageProps {
  alerts: MonitoringAlert[];
  products: ProductSpec[];
  continuousJobs?: ContinuousExtractionJob[];
  onRunJobCycle?: (jobId: string) => void;
  onNavigate: (page: PageId, targetId?: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'warning') => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  alerts,
  products,
  continuousJobs = [],
  onRunJobCycle,
  onNavigate,
  onShowToast,
}) => {
  const [period, setPeriod] = useState<'30d' | 'quarter' | 'year'>('30d');
  const [activeFilter, setActiveFilter] = useState<string>('همه');

  // Interactive notification channel toggles
  const [channels, setChannels] = useState({
    dashboard: true,
    email: true,
    sms: false,
    instantPush: true,
  });

  const toggleChannel = (key: keyof typeof channels) => {
    const updated = { ...channels, [key]: !channels[key] };
    setChannels(updated);
    onShowToast(`تنظیمات کانال ${key === 'dashboard' ? 'داشبورد' : key === 'email' ? 'ایمیل' : key === 'sms' ? 'پیامک' : 'اعلان فوری'} ذخیره شد`, '', 'info');
  };

  const signals = [
    'تغییرات تعرفه گمرکی کتاب مقررات صادرات و واردات',
    'شاخص کرایه کانتینری SCFI بنادر شانگهای و نینگبو',
    'نرخ برابری ارز و حواله درهم/یوان',
    'قیمت ورق گرم HRC در بورس فلزات لندن و شانگهای',
    'اعلام ظرفیت‌های خالی کارخانجات در پلتفرم‌های بین‌المللی',
  ];

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'همه') return true;
    return a.type === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls: Period Segmented & CTA */}
      <section className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E5E3DC] flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-[#111111]">رادار پایش مستمر بازار و سیگنال‌های ریسک</h2>
          <p className="text-xs text-[#73726E] mt-0.5">
            رصد ۲۴ ساعته تغییرات ژئوپلیتیک، نرخ حمل دریایی، نرخ تعرفه‌ها و رفتارهای تأمین‌کنندگان
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented: ۳۰ روز | فصل | سال */}
          <div className="inline-flex p-1 rounded-full bg-[#F5F4EE] border border-[#E5E3DC]">
            {[
              { id: '30d', label: '۳۰ روز اخیر' },
              { id: 'quarter', label: 'فصل جاری' },
              { id: 'year', label: 'سالانه' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  period === p.id ? 'bg-[#111111] text-white' : 'text-[#73726E]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (continuousJobs.length > 0 && onRunJobCycle) {
                onRunJobCycle(continuousJobs[0].id);
              } else {
                onNavigate('suppliers');
              }
            }}
            className="px-5 py-2.5 rounded-full bg-[#111111] text-white hover:bg-black font-semibold text-xs transition-all flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-[#F3F94A]" />
            <span>استخراج آنی قیمت‌ها و تأمین‌کنندگان</span>
          </button>
        </div>
      </section>

      {/* Live Market Indicators Ticker */}
      <LiveMarketTicker onShowToast={onShowToast} showScenarioPills={true} />

      {/* Featured Alert Hero Card */}
      <section className="p-6 rounded-3xl bg-[#FDFDE8] border-2 border-[#F3F94A] relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-[#111111] text-[#F3F94A] px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>هشدار ویژه هوش مصنوعی SourcingIQ</span>
            </span>
            <StatusPill label="تأمین‌کننده جدید" variant="ai" showDot={false} />
          </div>
          <span className="text-xs font-bold text-[#73726E]">شناسایی شده امروز ساعت ۱۰:۲۴</span>
        </div>

        <h3 className="text-base font-black text-[#111111] mb-2">
          کشف تولیدکننده منطبق در ویتنام با صرفه‌جویی ۸٫۷٪ نسبت به قیمت جاری
        </h3>

        <p className="text-sm text-[#111111] font-medium leading-relaxed max-w-4xl mb-4">
          «یک تأمین‌کننده در ویتنام برای کالای موردنظر شما شناسایی شده است. هزینه نهایی برآوردی آن ۸٫۷ درصد کمتر از تأمین فعلی است، ظرفیت سالانه کافی دارد و سابقه صادرات به سه کشور منطقه ثبت شده است. پیشنهاد می‌شود نمونه و مدارک شرکت بررسی شود.»
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-[#F3F94A]/60 flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs text-[#73726E]">
            <span>نام کارخانه: <strong className="text-[#111111]">Hanoi Steel Works</strong></span>
            <span>•</span>
            <span>کالای هدف: <strong className="text-[#111111]">ورق فولادی گالوانیزه ۷۲۱۰٫۴۹</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('verification', 'hanoi-steel')}
              className="px-5 py-2 rounded-full bg-[#111111] text-white hover:bg-black font-bold text-xs flex items-center gap-1.5"
            >
              <span>بررسی پروفایل و مدارک کارخانه</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#F3F94A]" />
            </button>
          </div>
        </div>
      </section>

      {/* Middle Row: 24m Price Index Chart + Yellow FX Card + Freight Cost Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 24-month Price Index Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#111111]">شاخص قیمت جهانی ورق فولادی (۲۴ ماهه)</h4>
              <span className="text-xs font-bold text-[#2D7D32]">−۱۴٫۲٪ از سقف</span>
            </div>
            <p className="text-xs text-[#73726E] mb-4">
              نمودار تغییرات شاخص کلاف نورد سرد در بورس‌های شانگهای و لندن
            </p>

            <div className="h-32 flex items-center justify-center p-2 bg-[#F5F4EE] rounded-2xl border border-[#E5E3DC]">
              <Sparkline
                data={[820, 810, 795, 780, 765, 750, 740, 725, 710, 695, 688, 685]}
                color="#111111"
                width={380}
                height={70}
                strokeWidth={3}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E3DC] flex justify-between text-xs text-[#73726E]">
            <span>میانگین قیمت ۲۴ ماهه: ۷۴۵ دلار</span>
            <span className="font-bold text-[#111111]">قیمت فعلی: ۶۸۵ دلار</span>
          </div>
        </div>

        {/* Yellow FX Card (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-[#F3F94A] border border-[#E5E3DC] flex flex-col justify-between">
          <div>
            <span className="text-xs font-black bg-[#111111] text-[#F3F94A] px-3 py-1 rounded-full">
              ریسک تسعیر ارز
            </span>
            <div className="mt-4">
              <span className="text-xs font-bold text-[#111111] block mb-1">
                نوسان نرخ برابری درهم / دلار
              </span>
              <div className="text-3xl font-black text-[#111111] tracking-tight">
                ۳٫۶۷۲۵ AED
              </div>
              <p className="text-xs text-[#111111]/80 mt-2 font-medium leading-relaxed">
                نرخ برابری باثبات در خلیج فارس؛ پیشنهاد می‌شود حواله‌های پرداخت از طریق حساب‌های تراستی دبی تسویه گردند.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-black/10 text-xs text-[#111111] font-bold">
            کارمزد تبدیل ارز: ۱٫۲٪ ثابت
          </div>
        </div>

        {/* Freight Cost Chart (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-[#111111]">شاخص کرایه کانتینری مسیرها</h4>
              <span className="text-xs font-bold text-[#C53030]">+۱۸٫۷٪ افزایش</span>
            </div>
            <p className="text-xs text-[#73726E] mb-3">نرخ کانتینر ۴۰ فوت های‌کیوب به بندر عباس</p>

            <div className="space-y-2.5 text-xs">
              {[
                { route: 'شانگهای به بندر عباس', rate: 2850, prev: 2400, isSurge: true },
                { route: 'هایفونگ (ویتنام) به بندر عباس', rate: 1950, prev: 1900, isSurge: false },
                { route: 'ناوا شیوا (هند) به بندر عباس', rate: 1200, prev: 1150, isSurge: false },
              ].map((r, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#111111]">{r.route}</div>
                    <div className="text-[10px] text-[#73726E]">قبلی: {formatPersianNumber(r.prev)} $</div>
                  </div>
                  <span className={`font-black text-sm ${r.isSurge ? 'text-[#C53030]' : 'text-[#2D7D32]'}`}>
                    {formatPersianNumber(r.rate)} $
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E3DC] text-xs text-[#73726E]">
            صرفه‌جویی کرایه حمل در خط ویتنام: ۹۰۰ دلار در هر کانتینر
          </div>
        </div>
      </section>

      {/* Watched Signals Chips Bar */}
      <section className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC]">
        <h4 className="text-xs font-bold text-[#111111] mb-2.5">
          سیگنال‌های بازار تحت رصد بلادرنگ الگوریتم (Real-time Signals):
        </h4>
        <div className="flex flex-wrap gap-2">
          {signals.map((sig, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1.5 rounded-full bg-[#F5F4EE] border border-[#E5E3DC] text-xs font-semibold text-[#111111] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D32]" />
              {sig}
            </span>
          ))}
        </div>
      </section>

      {/* Alert Feed with Yellow Tags & Working Buttons + Channel Toggles */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Alert Feed (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC]">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h4 className="text-base font-bold text-[#111111]">فید اعلان‌ها و هشدارهای زنجیره تأمین</h4>
              <p className="text-xs text-[#73726E] mt-0.5">ثبت رویدادهای بازار با برچسب‌های زرد اختصاصی</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['همه', 'تأمین‌کننده جدید', 'کاهش قیمت', 'افزایش هزینه حمل', 'تغییر تعرفه'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveFilter(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeFilter === tag
                      ? 'bg-[#111111] text-[#F3F94A]'
                      : 'bg-[#F5F4EE] text-[#73726E] hover:text-[#111111]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] hover:border-[#111111] transition-all flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusPill label={alert.type} variant="ai" showDot={false} />
                    <span className="text-xs font-bold text-[#111111]">{alert.title}</span>
                    <span className="text-[11px] text-[#73726E]">{alert.date} - {alert.time}</span>
                  </div>
                  <p className="text-xs text-[#73726E] leading-relaxed mb-2">
                    {alert.description}
                  </p>
                  <div className="text-[11px] text-[#73726E]">
                    کالای مرتبط: <strong className="text-[#111111]">{alert.productName}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(alert.targetPage, alert.targetId)}
                  className="px-4 py-2 rounded-full bg-[#111111] text-white hover:bg-black text-xs font-bold shrink-0 transition-all flex items-center gap-1"
                >
                  <span>بررسی</span>
                  <ExternalLink className="w-3 h-3 text-[#F3F94A]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist & Notification Channel Toggles (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Notification Channel Toggles */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#111111]">کانال‌های ارسال هشدار فوری</h4>
              <p className="text-xs text-[#73726E] mt-0.5">تنظیم مسیر دریافت اخطارهای حیاتی بازار</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'dashboard', label: 'داشبورد مدیریتی SourcingIQ', icon: Radio },
                { key: 'instantPush', label: 'اعلان مرورگر (Push Notification)', icon: Zap },
                { key: 'email', label: 'ایمیل گزارش روزانه (sara@atlas.ir)', icon: Mail },
                { key: 'sms', label: 'پیامک نوسانات ارزی و جهش حمل', icon: Smartphone },
              ].map((ch) => {
                const Icon = ch.icon;
                const isChecked = (channels as any)[ch.key];
                return (
                  <div
                    key={ch.key}
                    onClick={() => toggleChannel(ch.key as any)}
                    className="p-3 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] flex items-center justify-between cursor-pointer hover:border-[#111111] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[#111111]" />
                      <span className="text-xs font-bold text-[#111111]">{ch.label}</span>
                    </div>
                    {/* Toggle button */}
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                        isChecked ? 'bg-[#111111] justify-end' : 'bg-[#D0CEBE] justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Watchlist & Continuous Crawlers Cards Per Product */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E3DC] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#111111]">ربات‌های خزنده مستمر قیمت و تأمین‌کننده</h4>
              <span className="text-[11px] font-bold text-[#2D7D32]">
                {toPersianDigits(continuousJobs.length || products.length)} خزنده فعال
              </span>
            </div>
            <div className="space-y-2.5">
              {(continuousJobs.length > 0 ? continuousJobs : []).map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-2xl bg-[#F5F4EE] border border-[#E5E3DC] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate pl-2">
                      <div className="font-bold text-[#111111] truncate">{job.productName}</div>
                      <div className="text-[10px] text-[#73726E]">
                        HS {job.hsCode} | بهترین نرخ: {formatPersianNumber(job.bestDiscoveredFobUSD)} $
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2D7D32] shrink-0" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E5E3DC]">
                    <span className="text-[10px] text-[#73726E]">آخرین اسکن: {job.lastRunFa}</span>
                    {onRunJobCycle && (
                      <button
                        type="button"
                        onClick={() => onRunJobCycle(job.id)}
                        className="px-2.5 py-1 rounded-full bg-[#111111] text-[#F3F94A] text-[10px] font-bold hover:bg-black"
                      >
                        استخراج آنی
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
