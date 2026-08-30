import { useRef, useCallback } from "react";

/**
 * ProfileHeader — LinkedIn-inspired banner + avatar + quick stats.
 *
 * Props:
 *   profile    — current sellerProfile object
 *   products   — array of products (for stat counts)
 *   onEdit     — callback to open edit mode
 *   onUpdate   — callback(field, value) to update profile
 */
export default function ProfileHeader({ profile, products, onEdit, onUpdate }) {
  const bannerRef = useRef(null);
  const avatarRef = useRef(null);

  // --- image helpers ---------------------------------------------------
  const readAsBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handleBannerDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const base64 = await readAsBase64(file);
        onUpdate("bannerImage", base64);
      }
    },
    [onUpdate]
  );

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readAsBase64(file);
      onUpdate("bannerImage", base64);
    }
  };

  const handleAvatarDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const base64 = await readAsBase64(file);
        onUpdate("avatarImage", base64);
      }
    },
    [onUpdate]
  );

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readAsBase64(file);
      onUpdate("avatarImage", base64);
    }
  };

  // --- stats -----------------------------------------------------------
  const totalProducts = products?.length ?? 0;
  const totalCustomers = 0; // placeholder — wired later if needed
  const avgRating = 0;

  return (
    <div className="seller-header">
      {/* Banner */}
      <div
        className="seller-banner"
        ref={bannerRef}
        onClick={() => bannerRef.current?.querySelector("input")?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleBannerDrop}
        style={
          profile.bannerImage
            ? { backgroundImage: `url(${profile.bannerImage})` }
            : {}
        }
      >
        {!profile.bannerImage && (
          <div className="seller-banner-placeholder">
            <span>📷 Click or drag to upload banner</span>
          </div>
        )}
        <div className="seller-banner-overlay">
          <span>✏️ Change banner</span>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          hidden
        />
      </div>

      {/* Avatar overlapping banner */}
      <div className="seller-header-body">
        <div
          className="seller-avatar-wrap"
          ref={avatarRef}
          onClick={() => avatarRef.current?.querySelector("input")?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleAvatarDrop}
        >
          {profile.avatarImage ? (
            <img
              src={profile.avatarImage}
              alt="Store logo"
              className="seller-avatar-img"
            />
          ) : (
            <div className="seller-avatar-placeholder">🏪</div>
          )}
          <div className="seller-avatar-overlay">📷</div>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            hidden
          />
        </div>

        <div className="seller-header-info">
          <h1 className="seller-store-name">
            {profile.storeName || "Your Store Name"}
            <span className="seller-badge-verified" title="Verified seller">
              ✓
            </span>
          </h1>
          <p className="seller-tagline">
            {profile.category || "Business category"}
            {profile.address ? ` · 📍 ${profile.address}` : ""}
          </p>
        </div>

        <button className="btn btn-primary" onClick={onEdit}>
          ✏️ Edit Profile
        </button>
      </div>

      {/* Quick stats */}
      <div className="seller-stats-row">
        <div className="seller-stat-card">
          <div className="seller-stat-num">{totalProducts}</div>
          <div className="seller-stat-label">Products</div>
        </div>
        <div className="seller-stat-card">
          <div className="seller-stat-num">{totalCustomers}</div>
          <div className="seller-stat-label">Customers</div>
        </div>
        <div className="seller-stat-card">
          <div className="seller-stat-num">{avgRating || "—"}</div>
          <div className="seller-stat-label">Avg Rating</div>
        </div>
      </div>
    </div>
  );
}
