
import { useState, useRef } from 'react';
import { updateProduct, deleteProduct } from '../../../services/storage';
import ReviewList from './ReviewList';
import { DEMO_PRODUCT_CATEGORIES } from '../../../data/demoProductImages';

function DemoImagePicker({ selectedImage, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(DEMO_PRODUCT_CATEGORIES[0].key);
  const currentCategory = DEMO_PRODUCT_CATEGORIES.find((c) => c.key === activeCategory) || DEMO_PRODUCT_CATEGORIES[0];

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low/30">
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
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
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

export default function ProductDetailModal({ product, onClose, onUpdate, onToast }) {
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: product.name, description: product.description || '', price: product.price,
    stock: product.stock, lowStockThreshold: product.lowStockThreshold || 5, image: product.image,
  });
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasUnsavedChanges = editing && (
    form.name.trim() !== (product.name || '') ||
    form.description.trim() !== (product.description || '') ||
    Number(form.price) !== Number(product.price) ||
    Number(form.stock) !== Number(product.stock) ||
    Number(form.lowStockThreshold) !== Number(product.lowStockThreshold || 5) ||
    form.image !== product.image
  );

  const handleClose = () => {
    if (hasUnsavedChanges) setConfirmClose(true);
    else onClose();
  };

  const handleConfirmClose = (discard) => {
    setConfirmClose(false);
    if (discard) {
      setEditing(false);
      setForm({ name: product.name, description: product.description || '', price: product.price,
        stock: product.stock, lowStockThreshold: product.lowStockThreshold || 5, image: product.image });
      onClose();
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => update('image', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError('');
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { setError('Price must be greater than 0'); return; }
    const stock = parseInt(form.stock, 10);
    if (isNaN(stock) || stock < 0) { setError('Stock must be 0 or more'); return; }

    setLoading(true);
    try {
      await updateProduct(product.id, {
        name: form.name.trim(), description: form.description.trim(), price, stock,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5, image: form.image,
      });
      setEditing(false);
      onUpdate();
      onToast('Product updated!');
    } catch (err) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(product.id);
      onUpdate();
      onToast('Product deleted');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleReply = (reviewId, replyText) => {

    onToast('Reply posted!');
  };

  const avgRating = product.reviews?.length > 0
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1) : null;

  const getStockColor = () => {
    if (product.stock === 0) return 'bg-error-container text-on-error-container';
    if (product.stock <= (product.lowStockThreshold || 5)) return 'bg-amber-100 text-amber-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={handleClose} />

      <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scroll shadow-lg">
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-headline-md text-on-surface truncate" style={{ fontWeight: 600 }}>
            {editing ? 'Edit Product' : product.name}
          </h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
          )}

          <div className="aspect-video bg-gradient-to-br from-primary-container/10 to-tertiary-container/10 rounded-xl overflow-hidden flex items-center justify-center">
            {editing ? (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-surface-container text-on-surface-variant transition-colors">
                {form.image ? (
                  <img src={form.image} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                    <span className="text-label-md">Tap to upload</span>
                  </>
                )}
              </button>
            ) : product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[48px] text-primary/25">inventory_2</span>
                <span className="text-label-sm text-on-surface-variant/50">No image available</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-label-md text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Or pick a demo image:
                </label>
                <DemoImagePicker
                  selectedImage={form.image}
                  onSelect={(url) => update('image', url)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface">Name</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface">Description</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface">Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} min="0" step="0.01"
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)} min="0"
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 h-12 bg-primary hover:bg-on-primary-fixed-variant disabled:opacity-50 text-on-primary text-label-md font-medium rounded-lg active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  ) : (
                    <>Save Changes</>
                  )}
                </button>
                <button onClick={() => { setEditing(false); setForm({ name: product.name, description: product.description || '',
                  price: product.price, stock: product.stock, lowStockThreshold: product.lowStockThreshold || 5, image: product.image }); }}
                  className="px-4 h-12 bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-md font-medium rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>{product.name}</h3>
                <p className="text-headline-lg text-primary mt-1" style={{ fontWeight: 700 }}>
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
              </div>

              {product.description && (
                <p className="text-body-md text-on-surface-variant leading-relaxed">{product.description}</p>
              )}

              <div className="flex flex-wrap gap-3 text-label-md">
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                  {product.likes || 0} likes
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] filled" style={{ color: '#f59e0b' }}>star</span>
                  {avgRating || 'No ratings'} {product.reviews?.length > 0 && `(${product.reviews.length} reviews)`}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium ${getStockColor()}`}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                  {product.stock === 0 ? 'Out of Stock' : product.stock <= (product.lowStockThreshold || 5) ? `Low Stock (${product.stock})` : `In Stock (${product.stock})`}
                </span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditing(true)}
                  className="flex-1 h-12 border border-primary text-primary rounded-lg text-label-md font-medium flex items-center justify-center gap-2 hover:bg-primary/5 active-scale transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Product
                </button>
                <button onClick={() => setConfirmDelete(true)}
                  className="h-12 px-4 bg-error-container/30 hover:bg-error-container/50 text-on-error-container text-label-md font-medium rounded-lg flex items-center gap-2 active-scale transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </button>
              </div>

              {confirmDelete && (
                <div className="bg-error-container/30 border border-error-container rounded-xl p-4 space-y-3">
                  <p className="text-sm text-on-error-container font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Are you sure you want to delete &quot;{product.name}&quot;? This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleDelete}
                      className="flex-1 h-10 bg-error text-on-error text-label-md font-medium rounded-lg active:scale-[0.98]">
                      Yes, Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="flex-1 h-10 bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-md font-medium rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-outline-variant pt-5">
            <h3 className="text-headline-md text-on-surface mb-3" style={{ fontWeight: 600 }}>
              Customer Reviews ({product.reviews?.length || 0})
            </h3>
            <ReviewList reviews={product.reviews || []} onReply={handleReply} />
          </div>
        </div>

        {confirmClose && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-inverse-surface/40">
            <div className="bg-surface-container-lowest rounded-xl shadow-lg p-6 mx-4 max-w-sm w-full space-y-4">
              <div className="text-center">
                <span className="material-symbols-outlined text-[32px] text-primary">save</span>
                <h3 className="text-headline-md text-on-surface mt-2" style={{ fontWeight: 600 }}>Unsaved Changes</h3>
                <p className="text-body-md text-on-surface-variant mt-1">You have unsaved edits. Do you want to discard them?</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleConfirmClose(true)}
                  className="flex-1 h-12 bg-error-container/30 hover:bg-error-container/50 text-on-error-container text-label-md font-medium rounded-lg active:scale-[0.98]">
                  Discard
                </button>
                <button onClick={() => handleConfirmClose(false)}
                  className="flex-1 h-12 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md font-medium rounded-lg active:scale-[0.98] shadow-sm">
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
