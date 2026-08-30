/**
 * AddProductForm — simple form to add a new product.
 * MD3 theme: tonal inputs, Material icons, 48px touch targets.
 */
import { useState, useRef } from 'react';
import { createProduct } from '../../../services/storage';
import { generateId } from '../../../hooks/useLocalStorage';
import { DEMO_PRODUCT_CATEGORIES } from '../../../data/demoProductImages';

function DemoImagePicker({ selectedImage, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(DEMO_PRODUCT_CATEGORIES[0].key);
  const currentCategory = DEMO_PRODUCT_CATEGORIES.find((c) => c.key === activeCategory) || DEMO_PRODUCT_CATEGORIES[0];

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low/30">
      {/* Category tabs */}
      <div className="flex gap-1 p-2 overflow-x-auto hide-scrollbar bg-surface-container-low/50">
        {DEMO_PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              activeCategory === cat.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="p-3">
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
          {currentCategory.images.map((img) => (
            <button
              key={img.url}
              type="button"
              onClick={() => onSelect(img.url)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                selectedImage === img.url
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border-outline-variant hover:border-primary/50 hover:shadow-sm'
              }`}
              title={img.label}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {selectedImage === img.url && (
                <div className="absolute inset-0 bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px] bg-surface-container-lowest rounded-full p-1 shadow-md">check</span>
                </div>
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 text-white text-[10px] font-medium truncate">
                {img.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AddProductForm({ sellerId, onBack, onAdd }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', lowStockThreshold: '5', image: null,
  });
  const [error, setError] = useState('');

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => update('image', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Product name is required'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { setError('Please enter a valid price (greater than 0)'); return; }
    const stock = parseInt(form.stock, 10);
    if (isNaN(stock) || stock < 0) { setError('Please enter a valid stock quantity (0 or more)'); return; }

    createProduct({
      id: generateId(), sellerId, name: form.name.trim(), description: form.description.trim(),
      price, image: form.image, stock, lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
      likes: 0, reviews: [], createdAt: new Date().toISOString(),
    });
    onAdd();
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>Add New Product</h2>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        {error && (
          <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg mb-4 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface">Product Image</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-surface-container-low text-on-surface-variant transition-colors"
            >
              {form.image ? (
                <img src={form.image} alt="Preview" className="h-full object-contain rounded-lg" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                  <span className="text-label-md">Tap to upload image</span>
                </>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            
            {/* Category-based demo image picker */}
            <div className="flex flex-col gap-2">
              <span className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                Or choose a demo image by category:
              </span>
              <DemoImagePicker
                selectedImage={form.image}
                onSelect={(url) => update('image', url)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface" htmlFor="productName">Product Name *</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">inventory_2</span>
              <input id="productName" type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Organic Turmeric Powder"
                className="w-full h-12 pl-12 pr-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface" htmlFor="productDesc">Description</label>
            <textarea id="productDesc" value={form.description} onChange={(e) => update('description', e.target.value)}
              placeholder="Brief product description..." rows={3}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface" htmlFor="price">Price (₹) *</label>
              <input id="price" type="number" value={form.price} onChange={(e) => update('price', e.target.value)}
                placeholder="0" min="0" step="0.01"
                className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface" htmlFor="stock">Stock Qty *</label>
              <input id="stock" type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)}
                placeholder="0" min="0"
                className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface" htmlFor="threshold">Low Stock Alert Threshold</label>
            <input id="threshold" type="number" value={form.lowStockThreshold} onChange={(e) => update('lowStockThreshold', e.target.value)}
              min="0"
              className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
            <p className="text-label-sm text-on-surface-variant">You'll see a warning when stock falls below this number</p>
          </div>

          <button type="submit"
            className="w-full h-12 flex items-center justify-center bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md font-medium rounded-lg transition-all active:scale-[0.98] shadow-sm">
            <span className="material-symbols-outlined text-[18px] mr-2">add</span>
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
}
