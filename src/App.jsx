/**
 * App.jsx — Seller Dashboard single-page application.
 * MD3 theme: tonal surfaces, Material icons, Inter font.
 */
import { useState, useCallback } from 'react';
import { clearSession, getSellerById, getProductsBySeller, updateSeller, getTotalUnread } from './services/storage';
import { useLocalStorage } from './hooks/useLocalStorage';
import LoginScreen from './components/LoginScreen';
import OnboardingForm from './components/OnboardingForm';
import SellerHeader from './components/SellerHeader';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import { ProductGrid } from './modules/products';
import { InventoryTable } from './modules/inventory';
import { InboxTab } from './modules/inbox';
import { CustomerList } from './modules/customers';
import { ProfileForm } from './modules/profile';
import OrdersModule from './modules/orders';
import AnalyticsModule from './modules/analytics';
import ListingsModule from './modules/listings';
import Toast from './components/shared/Toast';
import { getActiveModules } from './modules/MODULES';
import './index.css';

export default function App() {
  const [session, setSession] = useLocalStorage('msme_session', null);
  const [seller, setSeller] = useState(() => {
    if (session?.loggedInSellerId) return getSellerById(session.loggedInSellerId);
    return null;
  });

  const [activeTab, setActiveTab] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [products, setProducts] = useState(() => seller ? getProductsBySeller(seller.id) : []);

  const refreshProducts = useCallback(() => {
    if (seller) setProducts(getProductsBySeller(seller.id));
  }, [seller]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleLogin = useCallback((sellerData) => {
    setSession({ loggedInSellerId: sellerData.id });
    setSeller(sellerData);
  }, [setSession]);

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setSeller(null);
    setProducts([]);
    setActiveTab('products');
  }, [setSession]);

  const handleOnboardingComplete = useCallback((data) => {
    const updated = updateSeller(seller.id, data);
    if (updated) {
      setSeller(updated);
      showToast('Welcome! Your store is set up');
    }
  }, [seller, showToast]);

  const handleSellerUpdate = useCallback((updatedSeller) => {
    setSeller(updatedSeller);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Unread message count
  const [unreadCount, setUnreadCount] = useState(() => seller ? getTotalUnread(seller.id) : 0);
  const refreshUnread = useCallback(() => {
    if (seller) setUnreadCount(getTotalUnread(seller.id));
  }, [seller]);

  // Low stock alerts
  const [alertDismissed, setAlertDismissed] = useState(false);
  const lowStockProducts = products.filter((p) => p.stock <= (p.lowStockThreshold || 5));
  const outOfStock = lowStockProducts.filter((p) => p.stock === 0);
  const lowStock = lowStockProducts.filter((p) => p.stock > 0);
  const showAlert = lowStockProducts.length > 0 && !alertDismissed;

  if (!seller) return <LoginScreen onLogin={handleLogin} />;
  if (!seller.storeName) return <OnboardingForm seller={seller} onComplete={handleOnboardingComplete} />;

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
        {activeTab === 'profile' && (
          <ProfileForm seller={seller} onSellerUpdate={handleSellerUpdate} onToast={showToast} />
        )}
        {activeTab === 'orders' && <OrdersModule />}
        {activeTab === 'analytics' && <AnalyticsModule />}
        {activeTab === 'listings' && <ListingsModule />}
      </main>

      {/* Mobile Bottom Nav (hidden on lg+ where sidebar takes over) */}
      <div className="lg:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
      </div>

      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
