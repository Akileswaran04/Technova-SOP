
import { useState } from 'react';
import ProductDetailModal from './ProductDetailModal';
import AddProductForm from './AddProductForm';

export default function ProductGrid({ products, sellerId, onUpdate, onToast }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    const threshold = p.lowStockThreshold || 5;
    let matchesStock = true;
    if (stockFilter === 'in') matchesStock = p.stock > threshold;
    else if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= threshold;
    else if (stockFilter === 'out') matchesStock = p.stock === 0;
    return matchesSearch && matchesStock;
  });

  const getStockBadge = (stock, threshold) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-error-container text-on-error-container', dot: 'bg-error' };
    if (stock <= (threshold || 5)) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' };
  };

  const getAvgRating = (reviews) => {
    if (!reviews || reviews.length === 0) return null;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  };

  if (showAddForm) {
    return (
      <AddProductForm
        sellerId={sellerId}
        onBack={() => setShowAddForm(false)}
        onAdd={(_product) => {
          onUpdate();
          setShowAddForm(false);
          onToast('Product added successfully!');
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
        <div>
          <h2 className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>Products</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Manage your catalog and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="h-12 px-4 bg-primary text-on-primary rounded-xl text-label-md font-medium flex items-center gap-2 hover:bg-on-primary-fixed-variant active-scale transition-colors hover-ambient shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Product
          </button>
        </div>
      </div>

      {products.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-outline opacity-50">inventory_2</span>
          <p className="text-on-surface-variant text-body-lg mt-4 mb-1">No products yet</p>
          <p className="text-on-surface-variant text-body-md mb-6">Add your first product to start selling</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="h-12 px-6 bg-primary text-on-primary text-label-md font-medium rounded-lg active:scale-[0.98] shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">add</span>
            Add Your First Product
          </button>
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-4">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="w-full h-12 pl-12 pr-10 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
            {[
              { key: 'all', label: 'All', icon: 'inventory_2' },
              { key: 'in', label: 'In Stock', icon: 'check_circle' },
              { key: 'low', label: 'Low Stock', icon: 'warning' },
              { key: 'out', label: 'Out of Stock', icon: 'block' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStockFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  stockFilter === f.key
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-[40px] text-outline opacity-50">search_off</span>
          <p className="text-on-surface font-medium mt-3">No products match your search</p>
          <p className="text-on-surface-variant text-body-md mt-1">Try a different keyword or filter</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const stock = getStockBadge(product.stock, product.lowStockThreshold);
            const avgRating = getAvgRating(product.reviews);
            const reviewCount = product.reviews?.length || 0;

            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden text-left hover-ambient active-scale flex flex-col cursor-pointer group"
              >
                <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-primary-container/10 to-tertiary-container/10 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[40px] text-primary/25">inventory_2</span>
                      <span className="text-label-sm text-on-surface-variant/40">No image</span>
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-label-sm font-medium flex items-center gap-1 shadow-sm ${stock.color}`}>
                    <span className={`w-2 h-2 rounded-full ${stock.dot}`}></span>
                    {stock.label}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-headline-md text-on-surface truncate mb-1" style={{ fontWeight: 600 }}>{product.name}</h3>
                  <p className="text-body-md text-on-surface-variant line-clamp-2 text-sm mb-3 flex-grow">{product.description || 'No description'}</p>

                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-outline-variant">
                    <span className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                        {product.likes || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px] filled" style={{ color: '#f59e0b' }}>star</span>
                        {avgRating || '—'}
                        {reviewCount > 0 && <span>({reviewCount})</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onUpdate={() => { onUpdate(); setSelectedProduct(null); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
