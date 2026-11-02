import React, { useState } from 'react';
import {
  PageId,
  Supplier,
  ProductSpec,
  RankingWeights,
  LandedCostBreakdown,
  MonitoringAlert,
  ExtractedSupplierCandidate,
  ContinuousExtractionJob,
} from './types';
import {
  MOCK_SUPPLIERS,
  MOCK_PRODUCTS,
  MOCK_LANDED_COST_ITEMS,
  MOCK_RFQS,
  MOCK_ALTERNATIVE_MARKETS,
  MOCK_ALERTS,
  INITIAL_RANKING_WEIGHTS,
} from './data/mockData';
import {
  mergeCandidateIntoAppState,
  getInitialContinuousJobs,
  runContinuousJobCycle,
} from './services/deepDiscoveryEngine';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './components/pages/DashboardPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { SuppliersPage } from './components/pages/SuppliersPage';
import { VerificationPage } from './components/pages/VerificationPage';
import { ComparisonPage } from './components/pages/ComparisonPage';
import { RfqPage } from './components/pages/RfqPage';
import { MarketsPage } from './components/pages/MarketsPage';
import { MonitoringPage } from './components/pages/MonitoringPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { MarketDataProvider } from './context/MarketDataContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [products, setProducts] = useState<ProductSpec[]>(MOCK_PRODUCTS);
  const [landedCostItems, setLandedCostItems] = useState<LandedCostBreakdown[]>(MOCK_LANDED_COST_ITEMS);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>(MOCK_ALERTS);
  const [continuousJobs, setContinuousJobs] = useState<ContinuousExtractionJob[]>(getInitialContinuousJobs);
  const [discoveryQuery, setDiscoveryQuery] = useState<{ productName: string; hsCode: string }>({
    productName: MOCK_PRODUCTS[0].name,
    hsCode: MOCK_PRODUCTS[0].hsCode,
  });
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('hanoi-steel');
  const [rfqs, setRfqs] = useState(MOCK_RFQS);
  const [rankingWeights, setRankingWeights] = useState<RankingWeights>(INITIAL_RANKING_WEIGHTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Selected supplier object
  const currentSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'info' | 'warning' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (page: PageId, targetId?: string) => {
    setCurrentPage(page);
    if (targetId) {
      if (page === 'verification') {
        setSelectedSupplierId(targetId);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportCandidates = (candidates: ExtractedSupplierCandidate[]) => {
    if (candidates.length === 0) return;
    const { updatedSuppliers, updatedLandedCosts, addedCount } = mergeCandidateIntoAppState(
      candidates,
      suppliers,
      landedCostItems
    );
    setSuppliers(updatedSuppliers);
    setLandedCostItems(updatedLandedCosts);

    if (addedCount > 0) {
      showToast(
        `${addedCount.toLocaleString('fa-IR')} تأمین‌کننده جدید به پایگاه و ماتریس مقایسه افزوده شد`,
        'مشخصات فنی، لایه‌های اعتبارسنجی و بهای تمام‌شده Landed Cost همگام‌سازی گردید.',
        'success'
      );
    } else {
      showToast(
        'قیمت‌ها و مشخصات تأمین‌کننده در پایگاه به‌روزرسانی شد',
        'آخرین نرخ FOB و محاسبات Landed Cost اعمال گردید.',
        'info'
      );
    }
  };

  const handleRunJobCycle = (jobId: string) => {
    const targetJob = continuousJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const { updatedJob, extractedResult, updatedSuppliers, generatedAlert } =
      runContinuousJobCycle(targetJob, suppliers);

    setContinuousJobs((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));
    setSuppliers(updatedSuppliers);
    if (extractedResult.candidates.length > 0) {
      const merged = mergeCandidateIntoAppState(
        [extractedResult.candidates[0]],
        updatedSuppliers,
        landedCostItems
      );
      setLandedCostItems(merged.updatedLandedCosts);
    }
    setAlerts((prev) => [generatedAlert, ...prev]);

    showToast(
      `سیکل استخراج خزنده «${targetJob.productName.slice(0, 24)}» اجرا شد`,
      `بهترین نرخ FOB کشف‌شده: ${updatedJob.bestDiscoveredFobUSD.toLocaleString('fa-IR')} دلار (${updatedJob.bestDiscoveredSupplierName})`,
      'success'
    );
  };

  const handleToggleJobStatus = (jobId: string) => {
    setContinuousJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const isCurrentlyActive = j.status.includes('فعال');
        return {
          ...j,
          status: isCurrentlyActive ? 'متوقف‌شده' : 'فعال (در حال پایش)',
        };
      })
    );
    showToast('وضعیت خزنده مستمر تغییر یافت', '', 'info');
  };

  const handleCreateContinuousJob = (newJob: ContinuousExtractionJob) => {
    setContinuousJobs((prev) => [newJob, ...prev]);
    showToast(
      `خزنده مستمر برای «${newJob.productName}» فعال شد`,
      'رصد بارنامه‌های گمرکی و لیست قیمت کارخانجات در پس‌زمینه آغاز گردید.',
      'success'
    );
  };

  const handleTriggerDeepDiscovery = (productName: string, hsCode: string) => {
    setDiscoveryQuery({ productName, hsCode });
    setCurrentPage('suppliers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      `موتور کاوش عمیق برای «${productName.slice(0, 28)}» آماده شد`,
      `پارامترهای فنی و کد تعرفه ${hsCode} در مرکز استخراج بارگذاری گردید.`,
      'info'
    );
  };

  const handleTriggerDownload = (filename: string, format: 'PDF' | 'XLSX' | 'CSV') => {
    showToast(
      `دانلود فایل ${format} آغاز شد`,
      `سند «${filename}.${format.toLowerCase()}» با موفقیت صادر گردید.`,
      'success'
    );
  };

  const handleAddToRFQ = (supplier: Supplier) => {
    showToast(
      `تأمین‌کننده «${supplier.name}» به استعلام قیمت افزوده شد`,
      'در صفحه درخواست قیمت می‌توانید پیش‌نویس استعلام را ارسال فرمایید.',
      'success'
    );
    handleNavigate('rfq');
  };

  const handleRequestSample = (supplier: Supplier) => {
    showToast(
      `درخواست نمونه محصول ثبت شد`,
      `استعلام نمونه برای ${supplier.name} ارسال شد. شماره پیگیری: SMP-9284`,
      'success'
    );
  };

  // Primary page CTA trigger
  const handleTriggerPageCTA = (page: PageId) => {
    switch (page) {
      case 'dashboard':
        handleNavigate('rfq');
        showToast('فرم درخواست قیمت باز شد', 'می‌توانید استعلام جدید برای تأمین‌کنندگان صادر کنید.', 'info');
        break;
      case 'products':
        handleNavigate('suppliers');
        showToast('جست‌وجوی خودکار تأمین‌کنندگان آغاز شد', 'تأمین‌کنندگان منطبق با استانداردهای تعریف‌شده لیست شدند.', 'info');
        break;
      case 'suppliers':
        handleNavigate('rfq');
        showToast('افزودن به استعلام قیمت فعال شد', 'تأمین‌کنندگان انتخاب‌شده به فرم ارسال RFQ منتقل شدند.', 'info');
        break;
      case 'verification':
        handleRequestSample(currentSupplier);
        break;
      case 'comparison':
        handleTriggerDownload('ماتریس_مقایسه_هزینه_نهایی_Landed_Cost', 'XLSX');
        break;
      case 'rfq':
        showToast('یادآوری خودکار ارسال شد', 'برای ۳ تأمین‌کننده‌ای که هنوز پاسخ نداده‌اند ایمیل یادآوری ارسال گردید.', 'info');
        break;
      case 'markets':
        handleNavigate('suppliers');
        showToast('تأمین‌کنندگان بازارهای جایگزین فیلتر شدند', '', 'info');
        break;
      case 'monitoring':
        if (continuousJobs.length > 0) {
          handleRunJobCycle(continuousJobs[0].id);
        } else {
          showToast('پرونده پایش جدید ایجاد شد', 'سیگنال‌های نوسان کالا در لیست رصد لحظه‌ای قرار گرفت.', 'success');
        }
        break;
      case 'reports':
        handleTriggerDownload('گزارش_جامع_مدیریت_سورسینگ_و_واردات_۱۴۰۳', 'PDF');
        break;
      case 'settings':
        showToast('تمامی تغییرات با موفقیت ذخیره شدند', '', 'success');
        break;
    }
  };

  return (
    <MarketDataProvider>
      <Shell
        currentPage={currentPage}
        onNavigate={handleNavigate}
        products={products}
        selectedProductId={selectedProductId}
        onSelectProduct={(id) => {
          setSelectedProductId(id);
          const p = products.find((item) => item.id === id);
          if (p) {
            setDiscoveryQuery({ productName: p.name, hsCode: p.hsCode });
            showToast(`فیلتر روی کالای «${p.name.slice(0, 28)}» اعمال شد`, '', 'info');
          }
        }}
        alerts={alerts}
        onTriggerPageCTA={handleTriggerPageCTA}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentPage !== 'suppliers' && currentPage !== 'products') {
            setCurrentPage('suppliers');
          }
        }}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            suppliers={suppliers}
            rfqs={rfqs}
            alerts={alerts}
            onTriggerDownload={handleTriggerDownload}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            onSelectProduct={(p) => {
              setSelectedProductId(p.id);
              setDiscoveryQuery({ productName: p.name, hsCode: p.hsCode });
            }}
            onAddProduct={(newProd) => {
              setProducts((prev) => [newProd, ...prev]);
              setSelectedProductId(newProd.id);
              setDiscoveryQuery({ productName: newProd.name, hsCode: newProd.hsCode });
            }}
            onTriggerDeepDiscovery={handleTriggerDeepDiscovery}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'suppliers' && (
          <SuppliersPage
            suppliers={suppliers}
            products={products}
            continuousJobs={continuousJobs}
            initialDiscoveryQuery={discoveryQuery}
            onImportCandidates={handleImportCandidates}
            onRunJobCycle={handleRunJobCycle}
            onToggleJobStatus={handleToggleJobStatus}
            onCreateContinuousJob={handleCreateContinuousJob}
            onSelectSupplier={(s) => setSelectedSupplierId(s.id)}
            onNavigate={handleNavigate}
            onShowToast={showToast}
            onAddToRFQ={handleAddToRFQ}
          />
        )}

        {currentPage === 'verification' && (
          <VerificationPage
            supplier={currentSupplier}
            allSuppliers={suppliers}
            onSelectSupplier={(s) => setSelectedSupplierId(s.id)}
            onNavigate={handleNavigate}
            onRequestSample={handleRequestSample}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'comparison' && (
          <ComparisonPage
            baseItems={landedCostItems}
            rankingWeights={rankingWeights}
            onUpdateWeights={setRankingWeights}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'rfq' && (
          <RfqPage
            rfqs={rfqs}
            allSuppliers={suppliers}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'markets' && (
          <MarketsPage
            markets={MOCK_ALTERNATIVE_MARKETS}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'monitoring' && (
          <MonitoringPage
            alerts={alerts}
            products={products}
            continuousJobs={continuousJobs}
            onRunJobCycle={handleRunJobCycle}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'reports' && (
          <ReportsPage
            onTriggerDownload={handleTriggerDownload}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            rankingWeights={rankingWeights}
            onUpdateWeights={setRankingWeights}
            onShowToast={showToast}
          />
        )}

        {/* Floating Toast Notification Container */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </Shell>
    </MarketDataProvider>
  );
}

