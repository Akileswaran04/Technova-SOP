/**
 * CustomerDrawer — slide-in panel showing customer detail.
 *
 * Props:
 *   customer  — the customer object
 *   onClose   — callback()
 *   onEdit    — callback(customer)
 */
export default function CustomerDrawer({ customer, onClose, onEdit }) {
  if (!customer) return null;

  return (
    <div className="seller-drawer-backdrop" onClick={onClose}>
      <div
        className="seller-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="seller-drawer-header">
          <h2>Customer Detail</h2>
          <div className="seller-drawer-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onEdit(customer)}
            >
              ✏️ Edit
            </button>
            <button className="seller-drawer-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="seller-drawer-body">
          <div className="seller-detail-section">
            <h3>{customer.name}</h3>
            <p className="seller-drawer-contact">{customer.contact || "No contact info"}</p>
          </div>

          <div className="seller-detail-section">
            <div className="seller-detail-grid">
              <div className="seller-detail-item">
                <span className="seller-detail-label">Total Orders</span>
                <span className="seller-detail-value">{customer.totalOrders ?? 0}</span>
              </div>
              <div className="seller-detail-item">
                <span className="seller-detail-label">Total Spend</span>
                <span className="seller-detail-value">
                  ${(customer.totalSpend ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="seller-detail-item">
                <span className="seller-detail-label">Last Interaction</span>
                <span className="seller-detail-value">
                  {customer.lastInteraction
                    ? new Date(customer.lastInteraction).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="seller-detail-item">
                <span className="seller-detail-label">Tags</span>
                <div className="seller-detail-value">
                  {customer.tags?.length > 0
                    ? customer.tags.map((t) => (
                        <span key={t} className="seller-badge seller-badge-blue">
                          {t}
                        </span>
                      ))
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="seller-detail-section">
            <h4>Notes</h4>
            <p className="seller-drawer-notes">
              {customer.notes || "No notes yet."}
            </p>
          </div>

          <div className="seller-detail-section">
            <h4>Order History</h4>
            <div className="seller-order-placeholder">
              <p>📋 Order history will appear here once real orders are integrated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
