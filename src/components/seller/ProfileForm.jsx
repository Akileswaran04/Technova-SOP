import { useState, useEffect, useMemo } from "react";

/**
 * ProfileForm — editable form for seller profile details.
 *
 * Props:
 *   profile   — current profile object
 *   onSave    — callback(updatedProfile)
 *   onCancel  — callback()
 */
export default function ProfileForm({ profile, onSave, onCancel }) {
  // Key that changes when the profile is saved externally (e.g. after save)
  const profileKey = useMemo(() => JSON.stringify(profile), [profile]);
  const [form, setForm] = useState(profile);
  const [errors, setErrors] = useState({});

  // Sync form when parent profile changes externally
  useEffect(() => {
    setForm(profile);
  }, [profileKey]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.storeName?.trim()) errs.storeName = "Store name is required";
    if (!form.ownerName?.trim()) errs.ownerName = "Owner name is required";
    if (!form.category?.trim()) errs.category = "Category is required";
    if (form.contact?.email && !/^\S+@\S+\.\S+$/.test(form.contact.email)) {
      errs.email = "Invalid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const social = form.socials || {};

  const setSocial = (platform) => (e) =>
    setForm((prev) => ({
      ...prev,
      socials: { ...(prev.socials || {}), [platform]: e.target.value },
    }));

  return (
    <form className="seller-profile-form" onSubmit={handleSubmit}>
      <h2 className="seller-section-title">Edit Profile</h2>

      <div className="seller-form-grid">
        {/* Store Name */}
        <div className="seller-form-group">
          <label>Store Name *</label>
          <input
            value={form.storeName || ""}
            onChange={set("storeName")}
            placeholder="My Awesome Store"
          />
          {errors.storeName && (
            <span className="seller-field-error">{errors.storeName}</span>
          )}
        </div>

        {/* Owner Name */}
        <div className="seller-form-group">
          <label>Owner Name *</label>
          <input
            value={form.ownerName || ""}
            onChange={set("ownerName")}
            placeholder="Jane Doe"
          />
          {errors.ownerName && (
            <span className="seller-field-error">{errors.ownerName}</span>
          )}
        </div>

        {/* Category */}
        <div className="seller-form-group">
          <label>Business Category *</label>
          <input
            value={form.category || ""}
            onChange={set("category")}
            placeholder="Electronics, Fashion, etc."
          />
          {errors.category && (
            <span className="seller-field-error">{errors.category}</span>
          )}
        </div>

        {/* Bio */}
        <div className="seller-form-group seller-form-full">
          <label>Description / Bio</label>
          <textarea
            rows={3}
            value={form.bio || ""}
            onChange={set("bio")}
            placeholder="Tell customers about your store..."
          />
        </div>

        {/* Phone */}
        <div className="seller-form-group">
          <label>Phone</label>
          <input
            value={form.contact?.phone || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                contact: { ...prev.contact, phone: e.target.value },
              }))
            }
            placeholder="+1 555 123 4567"
          />
        </div>

        {/* Email */}
        <div className="seller-form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.contact?.email || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                contact: { ...prev.contact, email: e.target.value },
              }))
            }
            placeholder="jane@example.com"
          />
          {errors.email && (
            <span className="seller-field-error">{errors.email}</span>
          )}
        </div>

        {/* Address */}
        <div className="seller-form-group seller-form-full">
          <label>Address</label>
          <input
            value={form.address || ""}
            onChange={set("address")}
            placeholder="123 Main St, City, State"
          />
        </div>

        {/* Business Hours */}
        <div className="seller-form-group seller-form-full">
          <label>Business Hours</label>
          <input
            value={form.hours || ""}
            onChange={set("hours")}
            placeholder="Mon-Fri 9AM-6PM"
          />
        </div>

        {/* Social Links */}
        <div className="seller-form-group">
          <label>Instagram</label>
          <input
            value={social.instagram || ""}
            onChange={setSocial("instagram")}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div className="seller-form-group">
          <label>Facebook</label>
          <input
            value={social.facebook || ""}
            onChange={setSocial("facebook")}
            placeholder="https://facebook.com/..."
          />
        </div>
        <div className="seller-form-group">
          <label>Twitter / X</label>
          <input
            value={social.twitter || ""}
            onChange={setSocial("twitter")}
            placeholder="https://x.com/..."
          />
        </div>
        <div className="seller-form-group">
          <label>Website</label>
          <input
            value={social.website || ""}
            onChange={setSocial("website")}
            placeholder="https://mystore.com"
          />
        </div>
      </div>

      <div className="seller-form-actions">
        <button type="submit" className="btn btn-primary">
          💾 Save Profile
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
