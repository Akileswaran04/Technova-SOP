import { useState, useMemo } from "react";

/**
 * ListingsGrid — card grid of seller's products with search & filter.
 *
 * Props:
 *   products  — array of product objects
 *   onAdd     — callback to open add modal
 *   onEdit    — callback(product)
 *   onDelete  — callback(productId)
 */
export default function ListingsGrid({ products, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Unique categories from products
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        filterCategory === "all" || p.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" || p.status === filterStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "name_asc":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name_desc":
        sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "price_asc":
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case "oldest":
        sorted.sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
    }

    return sorted;
  }, [products, search, filterCategory, filterStatus, sortBy]);

  const statusColor = (s) => {
    switch (s) {
      case "active":
        return "seller-badge-green";
      case "draft":
        return "seller-badge-gray";
      case "out_of_stock":
        return "seller-badge-red";
      default:
        return "seller-badge-gray";
    }
  };

  const statusLabel = (s) =>
    s === "out_of_stock" ? "Out of Stock" : s?.charAt(0).toUpperCase() + s?.slice(1);

  if (products.length === 0) {
    return (
      <div className="seller-empty-state">
        <div className="seller-empty-icon">📦</div>
        <h3>No listings yet</h3>
        <p>Add your first product to get started selling!</p>
        <button className="btn btn-primary" onClick={onAdd}>
          ➕ Add First Listing
        </button>
      </div>
    );
  }

  return (
    <div className="seller-listings">
      {/* Search & filters */}
      <div className="seller-listings-toolbar">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="seller-search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="seller-filter-select"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="seller-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="seller-filter-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name A → Z</option>
          <option value="name_desc">Name Z → A</option>
          <option value="price_asc">Price Low → High</option>
          <option value="price_desc">Price High → Low</option>
        </select>
        <button className="btn btn-primary" onClick={onAdd}>
          ➕ Add New Listing
        </button>
      </div>

      {/* Product cards */}
      <div className="seller-products-grid">
        {filtered.map((product) => (
          <div key={product.id} className="seller-product-card">
            <div className="seller-product-img-wrap">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="seller-product-img-placeholder">🛍️</div>
              )}
              <span
                className={`seller-product-status ${statusColor(product.status)}`}
              >
                {statusLabel(product.status)}
              </span>
            </div>
            <div className="seller-product-info">
              <h4 className="seller-product-name">{product.name}</h4>
              <p className="seller-product-category">{product.category}</p>
              <p className="seller-product-price">
                ${Number(product.price).toFixed(2)}
              </p>
              <div className="seller-product-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onEdit(product)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm(`Delete "${product.name}"?`)) onDelete(product.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && products.length > 0 && (
        <div className="seller-empty-state">
          <p>No products match your filters.</p>
        </div>
      )}
    </div>
  );
}
