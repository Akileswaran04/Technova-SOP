/**
 * CustomerList — list of customers with MD3 theme.
 * Material icons, tonal chips, 48px touch targets.
 * Data loaded from backend API + derived from product reviews.
 */
import { useState, useEffect } from 'react';
import { createCustomer, getCustomersBySeller, getDerivedCustomers } from '../../../services/storage';
import CustomerDrawer from './CustomerDrawer';

export default function CustomerList({ sellerId, products: _products, onUpdate, onToast }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [manualCustomers, setManualCustomers] = useState([]);
  const [derivedCustomers, setDerivedCustomers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [manual, derived] = await Promise.all([
          getCustomersBySeller(sellerId),
          getDerivedCustomers(sellerId),
        ]);
        if (!cancelled) {
          setManualCustomers(manual);
          setDerivedCustomers(derived);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sellerId]);

  const allCustomers = [];
  const seen = new Set();

  for (const [key, data] of Object.entries(derivedCustomers)) {
    const manual = manualCustomers.find((mc) => (mc.name || '').toLowerCase().trim() === key);
    allCustomers.push({
      id: manual?.id || `derived_${key}`, sellerId, name: data.name,
      contact: manual?.phone || '', notes: manual?.email || '',
      lastInteraction: data.lastDate, reviewCount: data.reviews.length,
      avgRating: data.reviews.length > 0 ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1) : null,
      reviews: data.reviews, isManual: false,
    });
    seen.add(key);
  }

  for (const mc of manualCustomers) {
    const key = (mc.name || '').toLowerCase().trim();
    if (!seen.has(key)) {
      allCustomers.push({ ...mc, contact: mc.phone || '', notes: mc.email || '', reviewCount: 0, avgRating: null, reviews: [], isManual: true });
    }
  }

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCustomer({ name: newName.trim(), contact: newContact.trim() });
      setNewName('');
      setNewContact('');
      setShowAddForm(false);
      // Reload customers
      const updated = await getCustomersBySeller(sellerId);
      setManualCustomers(updated);
      onUpdate();
      onToast('Customer added!');
    } catch (err) {
      onToast('Failed to add customer', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-headline-lg text-on-surface mb-4" style={{ fontWeight: 600 }}>Customers</h2>
        <div className="flex items-center justify-center py-16">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant animate-pulse">sync</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
        <div>
          <h2 className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>Customers</h2>
          <p className="text-body-md text-on-surface-variant mt-1">People who've interacted with your products.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="h-12 px-4 bg-primary text-on-primary rounded-xl text-label-md font-medium flex items-center gap-2 hover:bg-on-primary-fixed-variant active-scale transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Customer
        </button>
      </div>

      {showAddForm && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-4 shadow-sm">
          <form onSubmit={handleAddCustomer} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Customer name"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" autoFocus />
            </div>
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">call</span>
              <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="Phone/email (optional)"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
            </div>
            <button type="submit"
              className="h-12 px-6 bg-primary text-on-primary text-label-md font-medium rounded-lg active:scale-[0.98] shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span> Add
            </button>
          </form>
        </div>
      )}

      {allCustomers.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-outline opacity-50">group</span>
          <p className="text-on-surface-variant text-body-lg mt-4 mb-1">No customers yet</p>
          <p className="text-on-surface-variant text-body-md">Customers appear here when they review your products</p>
        </div>
      )}

      <div className="space-y-3">
        {allCustomers.map((customer) => (
          <button key={customer.id} onClick={() => setSelectedCustomer(customer)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-left hover-ambient active-scale focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0">
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-label-md text-on-surface font-semibold truncate">{customer.name}</h3>
                  {customer.isManual && (
                    <span className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant rounded text-label-sm">manual</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-label-sm text-on-surface-variant mt-0.5">
                  {customer.contact && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">call</span>{customer.contact}</span>}
                  {customer.reviewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] filled" style={{ color: '#f59e0b' }}>star</span>
                      {customer.avgRating} ({customer.reviewCount})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-label-sm text-on-surface-variant">
                  {customer.lastInteraction ? new Date(customer.lastInteraction).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedCustomer && (
        <CustomerDrawer customer={selectedCustomer} sellerId={sellerId}
          onClose={() => setSelectedCustomer(null)} onUpdate={onUpdate} onToast={onToast} />
      )}
    </div>
  );
}
