import { useState, useMemo } from "react";
import CustomerDrawer from "./CustomerDrawer";

/**
 * CustomerTable — CRM-style customer list with CRUD and detail drawer.
 *
 * Props:
 *   customers  — array of customer objects
 *   onUpdate   — callback(updatedCustomers)
 */
export default function CustomerTable({ customers, onUpdate }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [search, setSearch] = useState("");

  // --- CRUD helpers (local to this component) ---
  const addCustomer = (data) => {
    const newC = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      ...data,
      totalOrders: 0,
      totalSpend: 0,
      lastInteraction: new Date().toISOString(),
      tags: data.tags || [],
      notes: data.notes || "",
    };
    onUpdate([...customers, newC]);
    setShowForm(false);
  };

  const updateCustomer = (data) => {
    onUpdate(
      customers.map((c) =>
        c.id === data.id ? { ...c, ...data, lastInteraction: new Date().toISOString() } : c
      )
    );
    setShowForm(false);
    setEditCustomer(null);
    // Update drawer selection too
    if (selectedCustomer?.id === data.id) {
      setSelectedCustomer({ ...selectedCustomer, ...data });
    }
  };

  const deleteCustomer = (id) => {
    if (!confirm("Delete this customer?")) return;
    onUpdate(customers.filter((c) => c.id !== id));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
      setDrawerOpen(false);
    }
  };

  const openDrawer = (customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const openEdit = (customer) => {
    setEditCustomer(customer);
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.contact?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [customers, search]);

  return (
    <div className="seller-customers">
      {customers.length === 0 && !showForm ? (
        <div className="seller-empty-state">
          <div className="seller-empty-icon">👥</div>
          <h3>No customers yet</h3>
          <p>Add your first customer to start building relationships.</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditCustomer(null);
              setShowForm(true);
            }}
          >
            ➕ Add First Customer
          </button>
        </div>
      ) : (
        <>
          <div className="seller-listings-toolbar">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="seller-search-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditCustomer(null);
                setShowForm(true);
              }}
            >
              ➕ Add Customer
            </button>
          </div>

          <div className="seller-table-wrap">
            <table className="seller-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Total Spend</th>
                  <th>Last Interaction</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="seller-customer-row"
                    onClick={() => openDrawer(c)}
                  >
                    <td className="seller-cust-name">{c.name}</td>
                    <td>{c.contact || "—"}</td>
                    <td>{c.totalOrders ?? 0}</td>
                    <td>${(c.totalSpend ?? 0).toFixed(2)}</td>
                    <td>
                      {c.lastInteraction
                        ? new Date(c.lastInteraction).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {c.tags?.map((t) => (
                        <span key={t} className="seller-badge seller-badge-blue">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td className="seller-cust-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomer(c.id);
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Inline add/edit form */}
      {showForm && (
        <CustomerForm
          customer={editCustomer}
          onSave={editCustomer ? updateCustomer : addCustomer}
          onCancel={() => {
            setShowForm(false);
            setEditCustomer(null);
          }}
        />
      )}

      {/* Detail drawer */}
      {drawerOpen && selectedCustomer && (
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedCustomer(null);
          }}
          onEdit={(c) => {
            setDrawerOpen(false);
            openEdit(c);
          }}
        />
      )}
    </div>
  );
}

/* ─── Inline Customer Form ─────────────────────────────────────────── */
function CustomerForm({ customer, onSave, onCancel }) {
  const blank = {
    name: "",
    contact: "",
    tags: [],
    notes: "",
  };
  const [form, setForm] = useState(customer ? { ...blank, ...customer } : blank);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) =>
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Customer name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      totalOrders: Number(form.totalOrders) || customer?.totalOrders || 0,
      totalSpend: Number(form.totalSpend) || customer?.totalSpend || 0,
    });
  };

  return (
    <div className="seller-modal-backdrop" onClick={onCancel}>
      <div className="seller-modal seller-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="seller-modal-header">
          <h2>{customer ? "Edit Customer" : "Add Customer"}</h2>
          <button className="seller-modal-close" onClick={onCancel}>✕</button>
        </div>
        <form className="seller-modal-body" onSubmit={handleSubmit}>
          <div className="seller-form-grid">
            <div className="seller-form-group">
              <label>Name *</label>
              <input value={form.name} onChange={set("name")} placeholder="John Smith" />
              {errors.name && <span className="seller-field-error">{errors.name}</span>}
            </div>
            <div className="seller-form-group">
              <label>Contact (email/phone)</label>
              <input value={form.contact} onChange={set("contact")} placeholder="john@example.com" />
            </div>
            <div className="seller-form-group seller-form-full">
              <label>Tags</label>
              <div className="seller-tags-input">
                {form.tags.map((t) => (
                  <span key={t} className="seller-badge seller-badge-blue">
                    {t} <button type="button" onClick={() => removeTag(t)}>✕</button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Type a tag and press Enter"
                  className="seller-tag-field"
                />
              </div>
            </div>
            <div className="seller-form-group seller-form-full">
              <label>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Internal notes about this customer..."
              />
            </div>
          </div>
          <div className="seller-modal-footer">
            <button type="submit" className="btn btn-primary">
              {customer ? "💾 Save" : "➕ Add Customer"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
