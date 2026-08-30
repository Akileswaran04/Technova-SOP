import { useState, useRef, useCallback, useMemo } from "react";

/**
 * ListingModal — modal form for add / edit a product listing.
 *
 * Props:
 *   product    — product object to edit (null for "add new")
 *   onSave     — callback(productData)
 *   onClose    — callback()
 */
export default function ListingModal({ product, onSave, onClose }) {
  const initialForm = useMemo(
    () =>
      product
        ? { name: "", description: "", price: "", category: "", status: "active", quantity: 0, lowStockThreshold: 5, image: "", ...product, price: String(product.price ?? "") }
        : { name: "", description: "", price: "", category: "", status: "active", quantity: 0, lowStockThreshold: 5, image: "" },
    [product?.id] // only re-init when switching products
  );

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const imgRef = useRef(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // --- image upload ---------------------------------------------------
  const readAsBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readAsBase64(file);
      setForm((prev) => ({ ...prev, image: base64 }));
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await readAsBase64(file);
      setForm((prev) => ({ ...prev, image: base64 }));
    }
  }, []);

  // --- validation -----------------------------------------------------
  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Product name is required";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = "Valid price is required";
    if (!form.category?.trim()) errs.category = "Category is required";
    if (
      form.quantity === "" ||
      isNaN(Number(form.quantity)) ||
      Number(form.quantity) < 0
    )
      errs.quantity = "Quantity must be a non-negative number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
    });
  };

  return (
    <div className="seller-modal-backdrop" onClick={onClose}>
      <div
        className="seller-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="seller-modal-header">
          <h2>{product ? "Edit Listing" : "Add New Listing"}</h2>
          <button className="seller-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="seller-modal-body" onSubmit={handleSubmit}>
          {/* Image upload */}
          <div
            className="seller-image-dropzone"
            ref={imgRef}
            onClick={() => imgRef.current?.querySelector("input")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {form.image ? (
              <img src={form.image} alt="Preview" className="seller-image-preview" />
            ) : (
              <div className="seller-image-placeholder">
                📷 Click or drag to upload image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              hidden
            />
          </div>

          <div className="seller-form-grid">
            <div className="seller-form-group">
              <label>Product Name *</label>
              <input value={form.name} onChange={set("name")} placeholder="Widget Pro" />
              {errors.name && <span className="seller-field-error">{errors.name}</span>}
            </div>

            <div className="seller-form-group">
              <label>Category *</label>
              <input
                value={form.category}
                onChange={set("category")}
                placeholder="Electronics"
              />
              {errors.category && (
                <span className="seller-field-error">{errors.category}</span>
              )}
            </div>

            <div className="seller-form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={set("price")}
                placeholder="29.99"
              />
              {errors.price && <span className="seller-field-error">{errors.price}</span>}
            </div>

            <div className="seller-form-group">
              <label>Status</label>
              <select value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="seller-form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={set("quantity")}
                placeholder="0"
              />
              {errors.quantity && (
                <span className="seller-field-error">{errors.quantity}</span>
              )}
            </div>

            <div className="seller-form-group">
              <label>Low-Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={set("lowStockThreshold")}
              />
            </div>

            <div className="seller-form-group seller-form-full">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe your product..."
              />
            </div>
          </div>

          <div className="seller-modal-footer">
            <button type="submit" className="btn btn-primary">
              {product ? "💾 Save Changes" : "➕ Add Listing"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
