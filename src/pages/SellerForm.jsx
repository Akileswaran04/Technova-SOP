import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createSeller, getSeller, updateSeller } from "../api";

const EMPTY = {
  business_name: "",
  owner_name: "",
  email: "",
  phone: "",
  license_number: "",
  license_type: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  business_description: "",
};

export default function SellerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getSeller(id).then((r) => {
        const d = r.data;
        setForm({
          business_name: d.business_name,
          owner_name: d.owner_name,
          email: d.email,
          phone: d.phone || "",
          license_number: d.license_number,
          license_type: d.license_type || "",
          address_line1: d.address_line1,
          address_line2: d.address_line2 || "",
          city: d.city,
          state: d.state,
          pincode: d.pincode,
          country: d.country,
          business_description: d.business_description || "",
        });
      });
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.business_name || form.business_name.length < 2)
      e.business_name = "Business name is required (min 2 chars)";
    if (!form.owner_name || form.owner_name.length < 2)
      e.owner_name = "Owner name is required";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email is required";
    if (!form.license_number || form.license_number.length < 3)
      e.license_number = "License number is required";
    if (!form.address_line1 || form.address_line1.length < 3)
      e.address_line1 = "Address is required";
    if (!form.city) e.city = "City is required";
    if (!form.state) e.state = "State is required";
    if (!form.pincode || form.pincode.length < 4)
      e.pincode = "Valid pincode is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await updateSeller(id, form);
      } else {
        await createSeller(form);
      }
      navigate("/sellers");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setServerError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = "text", required = true) => (
    <div className={`form-group ${name === "business_description" || name === "address_line2" ? "full" : ""}`}>
      <label htmlFor={name}>
        {label} {required && "*"}
      </label>
      {name === "business_description" ? (
        <textarea
          id={name}
          name={name}
          value={form[name]}
          onChange={handleChange}
          rows={3}
          placeholder="Brief description of the business..."
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
        />
      )}
      {errors[name] && (
        <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>
        {isEdit ? "Edit Seller Profile" : "Register New Seller"}
      </h1>

      {serverError && <div className="error-msg">{serverError}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: "1rem" }}>Business Information</h3>
          <div className="form-grid">
            {field("business_name", "Business Name")}
            {field("owner_name", "Owner Name")}
            {field("email", "Email", "email")}
            {field("phone", "Phone", "tel", false)}
            {field("license_number", "License Number")}
            <div className="form-group">
              <label htmlFor="license_type">License Type</label>
              <select
                id="license_type"
                name="license_type"
                value={form.license_type}
                onChange={handleChange}
              >
                <option value="">Select type...</option>
                <option value="GST">GST Registration</option>
                <option value="Udyam">Udyam Registration</option>
                <option value="FSSAI">FSSAI License</option>
                <option value="Trade">Trade License</option>
                <option value="MSME">MSME Certificate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {field("business_description", "Business Description", "text", false)}
          </div>

          <h3 style={{ margin: "1.5rem 0 1rem" }}>Address</h3>
          <div className="form-grid">
            {field("address_line1", "Address Line 1")}
            {field("address_line2", "Address Line 2", "text", false)}
            {field("city", "City")}
            {field("state", "State")}
            {field("pincode", "Pincode", "text")}
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="actions-bar">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEdit
                ? "Update Profile"
                : "Register Seller"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/sellers")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
