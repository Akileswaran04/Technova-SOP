import { useState, useCallback, useRef } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { generateId } from "../services/storage";
import Toast from "../components/seller/Toast";
import ProfileHeader from "../components/seller/ProfileHeader";
import ProfileForm from "../components/seller/ProfileForm";
import ListingsGrid from "../components/seller/ListingsGrid";
import ListingModal from "../components/seller/ListingModal";
import InventoryTable from "../components/seller/InventoryTable";
import CustomerTable from "../components/seller/CustomerTable";

/* ─── Default data ───────────────────────────────────────────────── */
const DEFAULT_PROFILE = {
  storeName: "",
  ownerName: "",
  category: "",
  bio: "",
  contact: { phone: "", email: "" },
  address: "",
  hours: "",
  socials: { instagram: "", facebook: "", twitter: "", website: "" },
  bannerImage: "",
  avatarImage: "",
};

const TABS = [
  { id: "profile", label: "👤 Profile" },
  { id: "listings", label: "📦 My Listings" },
  { id: "inventory", label: "📋 Inventory" },
  { id: "customers", label: "👥 Customers" },
];

/**
 * SellerProfile — single-page seller management module.
 * All data persists via localStorage, isolated in hooks/storage service
 * for easy migration to real APIs later.
 */
export default function SellerProfile() {
  // --- persistent state (localStorage) --------------------------------
  const [profile, setProfile] = useLocalStorage("sellerProfile", DEFAULT_PROFILE);
  const [products, setProducts] = useLocalStorage("sellerProducts", []);
  const [customers, setCustomers] = useLocalStorage("sellerCustomers", []);

  // --- UI state -------------------------------------------------------
  const [activeTab, setActiveTab] = useState("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [listingModal, setListingModal] = useState({ open: false, product: null });
  const [toast, setToast] = useState({ message: "", type: "success" });
  const importRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // --- Profile handlers -----------------------------------------------
  const handleProfileSave = (updated) => {
    setProfile(updated);
    setEditingProfile(false);
    showToast("Profile saved successfully! ✅");
  };

  const handleProfileFieldUpdate = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // --- Product handlers -----------------------------------------------
  const handleAddProduct = () => {
    setListingModal({ open: true, product: null });
  };

  const handleEditProduct = (product) => {
    setListingModal({ open: true, product });
  };

  const handleSaveProduct = (data) => {
    if (data.id) {
      // Edit existing
      setProducts((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
      );
      showToast("Product updated! ✅");
    } else {
      // Add new
      const newProduct = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [...prev, newProduct]);
      showToast("Product added! ✅");
    }
    setListingModal({ open: false, product: null });
  };

  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Product deleted.", "warning");
  };

  // --- Inventory handlers (syncs with products) -----------------------
  const handleInventoryUpdate = (id, fields) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p))
    );
  };

  // --- Customer handlers ----------------------------------------------
  const handleCustomersUpdate = (updated) => {
    setCustomers(updated);
  };

  // --- Export / Import ------------------------------------------------
  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 1,
      profile,
      products,
      customers,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const storeSlug = (profile.storeName || "seller")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    a.download = `${storeSlug || "seller"}-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data exported successfully! ✅");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data || typeof data !== "object") throw new Error("Invalid file");

        if (!confirm("This will replace all current data. Continue?")) return;

        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        showToast(`Imported ${data.products?.length ?? 0} products, ${data.customers?.length ?? 0} customers. ✅`);
      } catch {
        showToast("Failed to import — invalid JSON file.", "error");
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported
    e.target.value = "";
  };

  // --- Tab content ----------------------------------------------------
  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return editingProfile ? (
          <ProfileForm
            profile={profile}
            onSave={handleProfileSave}
            onCancel={() => setEditingProfile(false)}
          />
        ) : (
          <div className="seller-profile-view">
            <div className="seller-profile-fields">
              <div className="seller-field">
                <span className="seller-field-label">Store Name</span>
                <span className="seller-field-value">{profile.storeName || "—"}</span>
              </div>
              <div className="seller-field">
                <span className="seller-field-label">Owner</span>
                <span className="seller-field-value">{profile.ownerName || "—"}</span>
              </div>
              <div className="seller-field">
                <span className="seller-field-label">Category</span>
                <span className="seller-field-value">{profile.category || "—"}</span>
              </div>
              <div className="seller-field seller-field-full">
                <span className="seller-field-label">Description</span>
                <span className="seller-field-value">{profile.bio || "—"}</span>
              </div>
              <div className="seller-field">
                <span className="seller-field-label">Phone</span>
                <span className="seller-field-value">{profile.contact?.phone || "—"}</span>
              </div>
              <div className="seller-field">
                <span className="seller-field-label">Email</span>
                <span className="seller-field-value">{profile.contact?.email || "—"}</span>
              </div>
              <div className="seller-field seller-field-full">
                <span className="seller-field-label">Address</span>
                <span className="seller-field-value">{profile.address || "—"}</span>
              </div>
              <div className="seller-field seller-field-full">
                <span className="seller-field-label">Business Hours</span>
                <span className="seller-field-value">{profile.hours || "—"}</span>
              </div>
              {profile.socials && Object.values(profile.socials).some(Boolean) && (
                <div className="seller-field seller-field-full">
                  <span className="seller-field-label">Social Links</span>
                  <div className="seller-social-links">
                    {profile.socials.instagram && (
                      <a href={profile.socials.instagram} target="_blank" rel="noreferrer">Instagram</a>
                    )}
                    {profile.socials.facebook && (
                      <a href={profile.socials.facebook} target="_blank" rel="noreferrer">Facebook</a>
                    )}
                    {profile.socials.twitter && (
                      <a href={profile.socials.twitter} target="_blank" rel="noreferrer">Twitter</a>
                    )}
                    {profile.socials.website && (
                      <a href={profile.socials.website} target="_blank" rel="noreferrer">Website</a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: "1.5rem" }}
              onClick={() => setEditingProfile(true)}
            >
              ✏️ Edit Profile
            </button>
          </div>
        );

      case "listings":
        return (
          <ListingsGrid
            products={products}
            onAdd={handleAddProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        );

      case "inventory":
        return <InventoryTable products={products} onUpdate={handleInventoryUpdate} />;

      case "customers":
        return (
          <CustomerTable customers={customers} onUpdate={handleCustomersUpdate} />
        );

      default:
        return null;
    }
  };

  return (
    <div className="seller-module">
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ message: "", type: "success" })}
      />

      {/* Header */}
      <ProfileHeader
        profile={profile}
        products={products}
        onEdit={() => {
          setActiveTab("profile");
          setEditingProfile(true);
        }}
        onUpdate={handleProfileFieldUpdate}
      />

      {/* Tabs */}
      <div className="seller-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`seller-tab ${activeTab === tab.id ? "seller-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Export / Import toolbar */}
      <div className="seller-data-toolbar">
        <span className="seller-data-toolbar-label">Data</span>
        <button className="btn btn-outline btn-sm" onClick={handleExport}>
          📥 Export JSON
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => importRef.current?.click()}
        >
          📤 Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          hidden
        />
      </div>

      {/* Tab content */}
      <div className="seller-tab-content">{renderTab()}</div>

      {/* Listing modal */}
      {listingModal.open && (
        <ListingModal
          product={listingModal.product}
          onSave={handleSaveProduct}
          onClose={() => setListingModal({ open: false, product: null })}
        />
      )}
    </div>
  );
}
