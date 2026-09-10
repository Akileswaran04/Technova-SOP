/**
 * App.jsx — role-based entry point.
 * Single identity, single login: role comes from the JWT and routes the user
 * to the seller dashboard or the buyer app automatically.
 */
import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { clearSession, getSession, getSellerById, getProductsBySeller, updateSeller, getTotalUnread } from './services/storage';
import LoginScreen from './components/LoginScreen';
import OnboardingForm from './components/OnboardingForm';
import SellerHeader from './components/SellerHeader';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import { ProductGrid } from './modules/product-listing';
import { InventoryTable } from './modules/product-listing/components/inventory';
import { InboxTab } from './modules/unified-inbox';
import { CustomerList } from './modules/buyer-discovery';
import { ProfileForm } from './modules/seller-profile';
import { TAB_KEYS } from './modules/MODULES';
import Toast from './components/shared/Toast';
import './index.css';

// Heavy, role- or tab-specific screens are code-split so they only download
// when actually used (buyer app: buyers only; analytics: pulls in recharts).
const BuyerApp = lazy(() => import('./modules/buyer/BuyerApp'));
const AnalyticsTab = lazy(() =>
  import('./modules/analytics').then((m) => ({ default: m.AnalyticsTab }))
);

function FullScreenLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-[48px] text-primary animate-pulse">sync</span>
        <p className="text-body-md text-on-surface-variant mt-3">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const session = getSession();
  const [sessionRole, setSessionRole] = useState(session?.role || null);

  // Buyer app — routed automatically by JWT role
  if (sessionRole === 'buyer') {
    return (
      <Suspense fallback={<FullScreenLoading />}>
        <BuyerApp onLogout={() => setSessionRole(null)} />
      </Suspense>
    );
  }
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(!!session?.token);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.PRODUCTS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [products, setProducts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadKey, setUnreadKey] = useState(0);

  // Load seller profile from API on mount
  useEffect(() => {
    if (!session?.token) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const sellerData = await getSellerById();
        if (cancelled) return;
        setSeller(sellerData);
        if (!sellerData?.id) return;
        // Products load page-by-page: the first page unlocks the dashboard and
        // later pages append in the background instead of one giant response.
        let unlocked = false;
        await getProductsBySeller((page) => {
          if (cancelled) return;
          setProducts((prev) => [...prev, ...page]);
          if (!unlocked) { unlocked = true; setLoading(false); }
        });
      } catch (err) {
        console.error('Failed to load seller:', err);
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload products when refreshKey changes. Skip the very first run: the
  // mount effect and handleLogin already load products, so re-fetching here
  // after login would double the initial catalog request.
  useEffect(() => {
    if (!seller?.id || refreshKey === 0) return;
    let cancelled = false;
    (async () => {
      const prods = await getProductsBySeller();
      if (!cancelled) setProducts(prods);
    })();
    return () => { cancelled = true; };
  }, [seller?.id, refreshKey]);

  const refreshProducts = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleLogin = useCallback(async (loginData) => {
    // loginData comes from LoginScreen after successful API login
    if (loginData?.role === 'buyer') {
      setSessionRole('buyer');
      return;
    }
    setLoading(true);
    try {
      const [profile, prods] = await Promise.all([
        getSellerById(),
        getProductsBySeller(),
      ]);
      setSeller(profile);
      if (profile?.id) {
        setProducts(prods);
      }
    } catch (err) {
      console.error('Failed to load profile after login:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    setSeller(null);
    setProducts([]);
    setActiveTab(TAB_KEYS.PRODUCTS);
    setSessionRole(null);
  }, []);

  const handleOnboardingComplete = useCallback(async (data) => {
    try {
      const updated = await updateSeller(seller.id, data);
      if (updated) {
        const profile = await getSellerById();
        setSeller(profile);
        showToast('Welcome! Your store is set up');
      }
    } catch (err) {
      showToast('Failed to save profile', 'error');
    }
  }, [seller, showToast]);

  const handleSellerUpdate = useCallback((updatedSeller) => {
    setSeller(updatedSeller);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Unread message count — cheap aggregate endpoint, polled every 30s and
  // re-fetched immediately when refreshKey changes (e.g. after viewing a chat).
  // The old code re-listed every conversation on every product refresh.
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!seller?.id) return;
    let cancelled = false;
    let timer;
    const fetchUnread = async () => {
      const count = await getTotalUnread();
      if (!cancelled) setUnreadCount(count);
      if (!cancelled) timer = setTimeout(fetchUnread, 30000);
    };
    fetchUnread();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [seller?.id, unreadKey]);

  // Refresh only the unread badge (opening a chat shouldn't refetch products)
  const refreshUnread = useCallback(() => {
    setUnreadKey((k) => k + 1);
  }, []);

  // Low stock alerts
  const [alertDismissed, setAlertDismissed] = useState(false);
  const lowStockProducts = products.filter((p) => p.stock <= (p.lowStockThreshold || 5));
  const outOfStock = lowStockProducts.filter((p) => p.stock === 0);
  const lowStock = lowStockProducts.filter((p) => p.stock > 0);
  const showAlert = lowStockProducts.length > 0 && !alertDismissed;

  // Loading state
  if (loading) {
    return <FullScreenLoading />;
  }

  if (!session?.token || !seller) return <LoginScreen onLogin={handleLogin} />;
  if (!seller.business_name) return <OnboardingForm seller={seller} onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile/Tablet Header (hidden on lg+ where sidebar is part of layout) */}
      <div className="lg:hidden">
        <SellerHeader
          seller={seller}
          onSellerUpdate={handleSellerUpdate}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(true)}
        />
      </div>

      {/* Sidebar — tablet drawer overlay (hidden on lg+) */}
      <Sidebar
        seller={seller}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSellerUpdate={handleSellerUpdate}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content area — grows to fill right side */}
      <main className="flex-1 min-w-0 w-full max-w-max-width mx-auto px-4 lg:px-10 py-6 pb-24 sm:pb-6">
        {/* Low Stock Alert Banner */}
        {showAlert && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="material-symbols-outlined text-[24px] text-amber-600 mt-0.5">notification_important</span>
                <div className="min-w-0">
                  <p className="text-label-md text-amber-900 font-semibold">
                    {outOfStock.length > 0 && <>{outOfStock.length} out of stock</>}
                    {outOfStock.length > 0 && lowStock.length > 0 && <> · </>}
                    {lowStock.length > 0 && <>{lowStock.length} running low</>}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {outOfStock.map((p) => (
                      <li key={p.id} className="text-label-sm text-red-700 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px]">error</span>
                        <span className="truncate">{p.name}</span>
                        <span className="font-medium ml-auto flex-shrink-0">— 0 left</span>
                      </li>
                    ))}
                    {lowStock.map((p) => (
                      <li key={p.id} className="text-label-sm text-amber-700 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        <span className="truncate">{p.name}</span>
                        <span className="font-medium ml-auto flex-shrink-0">— {p.stock} left</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button onClick={() => setAlertDismissed(true)}
                className="p-1 hover:bg-amber-100 rounded-lg text-amber-500 flex-shrink-0 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <button onClick={() => setActiveTab(TAB_KEYS.INVENTORY)}
              className="mt-3 w-full h-10 bg-amber-100 hover:bg-amber-200 text-amber-800 text-label-md font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[16px]">shelves</span>
              Go to Inventory to restock
            </button>
          </div>
        )}

        {activeTab === TAB_KEYS.PRODUCTS && (
          <ProductGrid products={products} sellerId={seller.id} onUpdate={refreshProducts} onToast={showToast} />
        )}
        {activeTab === TAB_KEYS.INVENTORY && (
          <InventoryTable products={products} onUpdate={refreshProducts} onToast={showToast} />
        )}
        {activeTab === TAB_KEYS.INBOX && (
          <InboxTab sellerId={seller.id} onToast={showToast} onRefresh={refreshUnread} />
        )}
        {activeTab === TAB_KEYS.CUSTOMERS && (
          <CustomerList sellerId={seller.id} products={products} onUpdate={refreshProducts} onToast={showToast} />
        )}
        {activeTab === TAB_KEYS.ANALYTICS && (
          <Suspense fallback={<FullScreenLoading />}>
            <AnalyticsTab sellerId={seller.id} onToast={showToast} />
          </Suspense>
        )}
        {activeTab === TAB_KEYS.PROFILE && (
          <ProfileForm seller={seller} products={products} onSellerUpdate={handleSellerUpdate} onToast={showToast} />
        )}

      </main>

      {/* Mobile Bottom Nav (hidden on lg+ where sidebar takes over) */}
      <div className="lg:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
      </div>

      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
