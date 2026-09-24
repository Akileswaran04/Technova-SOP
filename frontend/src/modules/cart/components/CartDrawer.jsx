/**
 * CartDrawer — buyer's cart, with an inline checkout step (address select/add
 * → payment method → confirm). Checkout splits into one order per seller
 * server-side; this component just shows the result.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getCart, updateCartItem, removeCartItem,
  getAddresses, createAddress, checkoutCart,
} from '../../../services/storage';

const PAYMENT_METHODS = [
  { key: 'upi', label: 'UPI' },
  { key: 'card', label: 'Card' },
  { key: 'cod', label: 'Cash on Delivery' },
];

export default function CartDrawer({ onClose, onToast, onCartUpdate, onOrderPlaced }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout'

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', city: '', state: '', postalCode: '', country: 'India' });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [placing, setPlacing] = useState(false);

  const refreshCart = useCallback(async () => {
    const c = await getCart();
    setCart(c);
    onCartUpdate?.(c);
    return c;
  }, [onCartUpdate]);

  useEffect(() => {
    (async () => {
      await refreshCart();
      setLoading(false);
    })();
  }, [refreshCart]);

  const handleQuantityChange = async (item, delta) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    if (next > item.availableStock) {
      onToast?.(`Only ${item.availableStock} in stock`, 'error');
      return;
    }
    try {
      const c = await updateCartItem(item.id, next);
      setCart(c);
      onCartUpdate?.(c);
    } catch (err) {
      onToast?.(err.message || 'Could not update quantity', 'error');
    }
  };

  const handleRemove = async (item) => {
    try {
      const c = await removeCartItem(item.id);
      setCart(c);
      onCartUpdate?.(c);
    } catch (err) {
      onToast?.(err.message || 'Could not remove item', 'error');
    }
  };

  const goToCheckout = async () => {
    if (!cart.items.length) return;
    const list = await getAddresses();
    setAddresses(list);
    const preferred = list.find((a) => a.isDefault) || list[0] || null;
    setSelectedAddressId(preferred?.id || null);
    setAddingAddress(list.length === 0);
    setStep('checkout');
  };

  const handleSaveAddress = async () => {
    if (!newAddress.line1 || !newAddress.city) {
      onToast?.('Address line and city are required', 'error');
      return;
    }
    try {
      const saved = await createAddress(newAddress);
      const list = await getAddresses();
      setAddresses(list);
      setSelectedAddressId(saved.id);
      setAddingAddress(false);
    } catch (err) {
      onToast?.(err.message || 'Could not save address', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      onToast?.('Select a delivery address', 'error');
      return;
    }
    setPlacing(true);
    try {
      const orders = await checkoutCart(selectedAddressId, { paymentMethod });
      onToast?.(`Order${orders.length > 1 ? 's' : ''} placed successfully`);
      onCartUpdate?.({ items: [], subtotal: 0, itemCount: 0 });
      onOrderPlaced?.(orders);
      onClose();
    } catch (err) {
      onToast?.(err.message || 'Checkout failed', 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        className="bg-surface-container-lowest w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant px-4 py-3 flex items-center justify-between">
          <h2 className="text-title-md text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">{step === 'cart' ? 'shopping_cart' : 'local_shipping'}</span>
            {step === 'cart' ? 'Your Cart' : 'Checkout'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant">sync</span>
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="flex-1 p-4 space-y-3">
              {cart.items.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">shopping_cart</span>
                  <p className="text-body-md text-on-surface-variant mt-2">Your cart is empty</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-surface rounded-xl border border-outline-variant">
                    <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      {item.productImageUrl ? (
                        <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant/40">inventory_2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md text-on-surface font-medium truncate">{item.productName}</p>
                      <p className="text-label-sm text-on-surface-variant mt-0.5">${item.unitPrice.toLocaleString()} each</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleQuantityChange(item, -1)} className="w-7 h-7 rounded-md border border-outline-variant flex items-center justify-center text-label-md">−</button>
                          <span className="w-6 text-center text-label-md">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item, 1)} className="w-7 h-7 rounded-md border border-outline-variant flex items-center justify-center text-label-md">+</button>
                        </div>
                        <button onClick={() => handleRemove(item)} className="text-on-surface-variant hover:text-error">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant p-4 space-y-3">
                <div className="flex items-center justify-between text-title-sm font-semibold text-on-surface">
                  <span>Subtotal</span>
                  <span>${cart.subtotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={goToCheckout}
                  className="w-full h-12 rounded-lg bg-primary text-on-primary text-label-md font-medium"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 p-4 space-y-5">
              <div>
                <h3 className="text-label-md text-on-surface font-semibold mb-2">Delivery Address</h3>
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label key={a.id} className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer ${selectedAddressId === a.id ? 'border-primary bg-primary-container/20' : 'border-outline-variant'}`}>
                      <input type="radio" name="address" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1" />
                      <div className="min-w-0">
                        <p className="text-label-md text-on-surface font-medium">{a.label}{a.isDefault && <span className="ml-2 text-label-sm text-primary">Default</span>}</p>
                        <p className="text-label-sm text-on-surface-variant">{[a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {addingAddress ? (
                  <div className="mt-3 p-3 rounded-xl border border-outline-variant space-y-2">
                    <input placeholder="Address line" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline-variant text-body-sm" />
                    <div className="flex gap-2">
                      <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="flex-1 h-10 px-3 rounded-lg border border-outline-variant text-body-sm" />
                      <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="flex-1 h-10 px-3 rounded-lg border border-outline-variant text-body-sm" />
                    </div>
                    <input placeholder="Postal code" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline-variant text-body-sm" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveAddress} className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-label-sm font-medium">Save Address</button>
                      {addresses.length > 0 && (
                        <button onClick={() => setAddingAddress(false)} className="h-9 px-3 rounded-lg border border-outline-variant text-label-sm">Cancel</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingAddress(true)} className="mt-2 text-label-sm text-primary font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add new address
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-label-md text-on-surface font-semibold mb-2">Payment Method</h3>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex-1 h-10 rounded-lg border text-label-sm font-medium ${paymentMethod === m.key ? 'border-primary bg-primary-container/20 text-primary' : 'border-outline-variant text-on-surface-variant'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-label-md text-on-surface font-semibold mb-2">Order Summary</h3>
                <div className="space-y-1">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-body-sm text-on-surface-variant">
                      <span className="truncate">{item.quantity} × {item.productName}</span>
                      <span>${item.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-title-sm font-semibold text-on-surface mt-2 pt-2 border-t border-outline-variant">
                  <span>Total</span>
                  <span>${cart.subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant p-4 space-y-2">
              <button onClick={() => setStep('cart')} className="w-full h-10 rounded-lg border border-outline-variant text-label-md text-on-surface-variant">
                Back to Cart
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId}
                className="w-full h-12 rounded-lg bg-primary text-on-primary text-label-md font-medium disabled:opacity-50"
              >
                {placing ? 'Placing Order...' : `Place Order · $${cart.subtotal.toLocaleString()}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
