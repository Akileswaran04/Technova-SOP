/**
 * InventoryTable — stock-focused view with MD3 theme.
 * Material icons, 48px touch targets, tonal chips.
 */
import { useState } from 'react';
import { updateProduct } from '../../../../services/storage';

export default function InventoryTable({ products, onUpdate, onToast }) {
  const [sortBy, setSortBy] = useState('lowStock');

  const adjustStock = (productId, delta) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    updateProduct(productId, { stock: newStock });
    onUpdate();
    if (newStock === 0) onToast(`${product.name} is now out of stock!`, 'info');
    else if (newStock <= (product.lowStockThreshold || 5)) onToast(`${product.name} is low on stock`, 'info');
  };

  const getStatusBadge = (stock, threshold) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-error-container text-on-error-container', dot: 'bg-error' };
    if (stock <= (threshold || 5)) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' };
  };

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'lowStock') {
      const aAlert = a.stock <= (a.lowStockThreshold || 5) ? 0 : 1;
      const bAlert = b.stock <= (b.lowStockThreshold || 5) ? 0 : 1;
      if (aAlert !== bAlert) return aAlert - bAlert;
      return a.stock - b.stock;
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'stock') return a.stock - b.stock;
    return 0;
  });

  if (products.length === 0) {
    return (
      <div>
        <h2 className="text-headline-lg text-on-surface mb-4" style={{ fontWeight: 600 }}>Inventory</h2>
        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-outline opacity-50">shelves</span>
          <p className="text-on-surface-variant text-body-lg mt-4 mb-1">No inventory to track</p>
          <p className="text-on-surface-variant text-body-md">Add products first — they'll appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>Inventory Management</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Track and adjust your current stock levels.</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'lowStock', label: 'Low First', icon: 'warning' },
            { key: 'name', label: 'Name', icon: 'sort_by_alpha' },
            { key: 'stock', label: 'Stock', icon: 'straighten' },
          ].map((opt) => (
            <button key={opt.key} onClick={() => setSortBy(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-sm font-medium transition-colors ${
                sortBy === opt.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
              }`}>
              <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-3">
        {sorted.map((product) => {
          const status = getStatusBadge(product.stock, product.lowStockThreshold);
          return (
            <div key={product.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-label-md text-on-surface font-semibold truncate">{product.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium ${status.color}`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">Threshold: {product.lowStockThreshold || 5}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustStock(product.id, -1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-8 text-center font-semibold text-body-md text-on-surface">{product.stock}</span>
                  <button onClick={() => adjustStock(product.id, 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 py-3 text-label-md text-on-surface-variant font-medium">Product</th>
                <th className="px-4 py-3 text-label-md text-on-surface-variant font-medium">Status</th>
                <th className="px-4 py-3 text-label-md text-on-surface-variant font-medium text-right">Threshold</th>
                <th className="px-4 py-3 text-label-md text-on-surface-variant font-medium text-right">Stock</th>
                <th className="px-4 py-3 text-label-md text-on-surface-variant font-medium text-center">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {sorted.map((product) => {
                const status = getStatusBadge(product.stock, product.lowStockThreshold);
                return (
                  <tr key={product.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-variant flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[20px] text-outline opacity-50">image</span>
                          )}
                        </div>
                        <span className="text-label-md text-on-surface font-semibold truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-label-sm font-medium ${status.color}`}>
                        <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-body-md text-on-surface-variant">{product.lowStockThreshold || 5}</td>
                    <td className={`px-4 py-3 text-right font-semibold text-body-md ${product.stock === 0 ? 'text-error' : product.stock <= (product.lowStockThreshold || 5) ? 'text-amber-700' : 'text-on-surface'}`}>
                      {product.stock}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => adjustStock(product.id, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <button onClick={() => adjustStock(product.id, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
