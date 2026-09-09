/**
 * App.jsx — role-based entry point.
 * Single identity, single login: role comes from the JWT and routes the user
 * to the seller dashboard or the buyer app automatically.
 */
import { useState, useCallback, useEffect } from 'react';
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
import { AnalyticsTab } from './modules/analytics';
import BuyerApp from './modules/buyer/BuyerApp';
import Toast from './components/shared/Toast';
import './index.css';

export default function App() {
  const session = getSession();
  const [sessionRole, setSessionRole] = useState(session?.role || null);

  // Buyer app — routed automatically by JWT role
  if (sessionRole === 'buyer') {
    return <BuyerApp onLogout={() => setSessionRole(null)} />;
  }
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(!!session?.token);
  const [activeTab, setActiveTab] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [products, setProducts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load seller profile from API on mount
  useEffect(() => {
    if (!session?.token) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const sellerData = await getSellerById();
        if (!cancelled) {
          setSeller(sellerData);
          // Load products after seller is loaded
          if (sellerData?.id) {
            const prods = await getProductsBySeller(sellerData.id);
            if (!cancelled) setProducts(prods);
          }
        }
      } catch (err) {
        console.error('Failed to load seller:', err);
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload products when refreshKey changes
  useEffect(() => {
    if (!seller?.id) return;
    let cancelled = false;
    (async () => {
      const prods = await getProductsBySeller(seller.id);
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
      const profile = await getSellerById();
      setSeller(profile);
      if (profile?.id) {
        const prods = await getProductsBySeller(profile.id);
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
    setActiveTab('products');
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

  // Unread message count
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!seller?.id) return;
    let cancelled = false;
    (async () => {
      const count = await getTotalUnread(seller.id);
      if (!cancelled) setUnreadCount(count);
    })();
    return () => { cancelled = true; };
  }, [seller?.id, refreshKey]);

  const refreshUnread = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Low stock alerts
  const [alertDismissed, setAlertDismissed] = useState(false);
  const lowStockProducts = products.filter((p) => p.stock <= (p.lowStockThreshold || 5));
  const outOfStock = lowStockProducts.filter((p) => p.stock === 0);
  const lowStock = lowStockProducts.filter((p) => p.stock > 0);
  const showAlert = lowStockProducts.length > 0 && !alertDismissed;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-primary animate-pulse">sync</span>
          <p className="text-body-md text-on-surface-variant mt-3">Loading...</p>
        </div>
      </div>
    );
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
            <button onClick={() => setActiveTab('inventory')}
              className="mt-3 w-full h-10 bg-amber-100 hover:bg-amber-200 text-amber-800 text-label-md font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[16px]">shelves</span>
              Go to Inventory to restock
            </button>
          </div>
        )}

        {activeTab === 'products' && (
          <ProductGrid products={products} sellerId={seller.id} onUpdate={refreshProducts} onToast={showToast} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTable products={products} onUpdate={refreshProducts} onToast={showToast} />
        )}
        {activeTab === 'inbox' && (
          <InboxTab sellerId={seller.id} onToast={showToast} onRefresh={refreshUnread} />
        )}
        {activeTab === 'customers' && (
          <CustomerList sellerId={seller.id} products={products} onUpdate={refreshProducts} onToast={showToast} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab sellerId={seller.id} onToast={showToast} />
        )}
        {activeTab === 'profile' && (
          <ProfileForm seller={seller} onSellerUpdate={handleSellerUpdate} onToast={showToast} />
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
