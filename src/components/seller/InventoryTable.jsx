import { useState } from "react";

/**
 * InventoryTable — tabular inventory view with inline quantity editing.
 * Shares the same product records as Listings (no duplication).
 *
 * Props:
 *   products  — array of product objects
 *   onUpdate  — callback(productId, updatedFields)
 */
export default function InventoryTable({ products, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditValue(String(product.quantity));
  };

  const commitEdit = (product) => {
    const qty = parseInt(editValue, 10);
    if (!isNaN(qty) && qty >= 0) {
      onUpdate(product.id, { quantity: qty });
    }
    setEditingId(null);
  };

  const adjustQty = (product, delta) => {
    const newQty = Math.max(0, product.quantity + delta);
    onUpdate(product.id, { quantity: newQty });
  };

  if (products.length === 0) {
    return (
      <div className="seller-empty-state">
        <div className="seller-empty-icon">📋</div>
        <h3>No inventory to display</h3>
        <p>Add products in the "My Listings" tab first.</p>
      </div>
    );
  }

  return (
    <div className="seller-table-wrap">
      <table className="seller-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Quantity</th>
            <th>Low-Stock Threshold</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const isLow = p.quantity <= (p.lowStockThreshold || 5);
            const isEditing = editingId === p.id;

            return (
              <tr key={p.id} className={isLow ? "seller-row-low" : ""}>
                <td className="seller-inv-name">{p.name}</td>
                <td className="seller-inv-sku">
                  {p.sku || `SKU-${p.id.slice(0, 6).toUpperCase()}`}
                </td>
                <td>
                  {isEditing ? (
                    <div className="seller-inline-edit">
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(p)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(p);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="seller-inline-input"
                      />
                    </div>
                  ) : (
                    <div className="seller-qty-stepper">
                      <button
                        className="seller-qty-btn"
                        onClick={() => adjustQty(p, -1)}
                        disabled={p.quantity <= 0}
                      >
                        −
                      </button>
                      <span
                        className="seller-qty-value"
                        onClick={() => startEdit(p)}
                        title="Click to edit"
                      >
                        {p.quantity}
                      </span>
                      <button
                        className="seller-qty-btn"
                        onClick={() => adjustQty(p, 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </td>
                <td>{p.lowStockThreshold || 5}</td>
                <td>
                  {isLow ? (
                    <span className="seller-badge seller-badge-red">
                      ⚠️ Low Stock
                    </span>
                  ) : (
                    <span className="seller-badge seller-badge-green">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="seller-inv-date">
                  {p.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString()
                    : p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
