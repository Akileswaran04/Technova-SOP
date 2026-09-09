/**
 * BuyerApp — buyer-facing application (new screens: discovery, chat, orders).
 * Single login: routed here automatically when the JWT role is 'buyer'.
 */
import { useState, useCallback } from 'react';
import DiscoverPage from './components/DiscoverPage';
import ProductDetail from './components/ProductDetail';
import BuyerInbox from './components/BuyerInbox';
import OrdersPage from './components/OrdersPage';
import BuyerProfilePage from './components/BuyerProfilePage';
import Toast from '../../components/shared/Toast';
import { getSession, clearSession } from '../../services/storage';

const TABS = [
  { key: 'discover', icon: 'search', label: 'Discover' },
  { key: 'inbox', icon: 'chat', label: 'Inbox' },
  { key: 'orders', icon: 'receipt_long', label: 'Orders' },
  { key: 'profile', icon: 'person', label: 'Profile' },
];

export default function BuyerApp({ onLogout }) {
  const session = getSession();
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [inboxKey, setInboxKey] = useState(0);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleChatOpened = useCallback((conversationId) => {
    setSelectedProduct(null);
    setActiveTab('inbox');
    setInboxKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-max-width mx-auto px-4 lg:px-10 h-16 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          </div>
          <div className="flex-1">
            <p className="text-label-md text-on-surface font-bold leading-tight">MSME Connect</p>
            <p className="text-label-sm text-on-surface-variant leading-tight">Buyer · {session?.email}</p>
          </div>
          <button
            onClick={() => { clearSession(); onLogout(); }}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>

        {/* Tabs */}
        <nav className="max-w-max-width mx-auto px-4 lg:px-10 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-label-md font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-max-width mx-auto px-4 lg:px-10 py-6 pb-24 sm:pb-6">
        {activeTab === 'discover' && <DiscoverPage onOpenProduct={setSelectedProduct} />}
        {activeTab === 'inbox' && <BuyerInbox key={inboxKey} buyerId={session?.buyerId} onToast={showToast} />}
        {activeTab === 'orders' && <OrdersPage onToast={showToast} />}
        {activeTab === 'profile' && <BuyerProfilePage onToast={showToast} />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant z-50 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center w-16 py-1 ${activeTab === tab.key ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className={`material-symbols-outlined ${activeTab === tab.key ? 'filled' : ''}`}>{tab.icon}</span>
              <span className="text-label-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {selectedProduct && (
        <ProductDetail
          productId={selectedProduct.id}
          onClose={() => setSelectedProduct(null)}
          onChatOpened={handleChatOpened}
          onToast={showToast}
        />
      )}

      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}