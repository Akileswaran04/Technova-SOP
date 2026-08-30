import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSeller, deleteSeller, verifySeller } from "../api";

export default function SellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const load = () =>
    getSeller(id)
      .then((r) => setSeller(r.data))
      .catch(() => setError("Seller not found"));

  useEffect(() => { load(); }, [id]);

  const handleVerify = async () => {
    try {
      await verifySeller(id, { action: "verify" });
      load();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to verify");
    }
  };

  const handleReject = async () => {
    try {
      await verifySeller(id, { action: "reject", reason: rejectReason });
      setShowReject(false);
      setRejectReason("");
      load();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to reject");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this seller?")) return;
    try {
      await deleteSeller(id);
      navigate("/sellers");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to delete");
    }
  };

  if (!seller) return <div className="empty-state"><p>Loading...</p></div>;

  const row = (label, value) => (
    <div className="detail-item">
      <span className="label">{label}</span>
      <span className="value">{value || "-"}</span>
    </div>
  );

  return (
    <div>
      <div className="card-header">
        <div>
          <h1>{seller.business_name}</h1>
          <span className={`badge badge-${seller.status}`} style={{ fontSize: "0.85rem" }}>
            {seller.status}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to={`/sellers/${id}/edit`} className="btn btn-outline btn-sm">
            Edit
          </Link>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Business Information</h3>
        <div className="detail-grid">
          {row("Owner Name", seller.owner_name)}
          {row("Email", seller.email)}
          {row("Phone", seller.phone)}
          {row("License Number", seller.license_number)}
          {row("License Type", seller.license_type)}
          {row("Business Description", seller.business_description)}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Address</h3>
        <div className="detail-grid">
          {row("Address Line 1", seller.address_line1)}
          {row("Address Line 2", seller.address_line2)}
          {row("City", seller.city)}
          {row("State", seller.state)}
          {row("Pincode", seller.pincode)}
          {row("Country", seller.country)}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Timestamps</h3>
        <div className="detail-grid">
          {row("Created", new Date(seller.created_at).toLocaleString())}
          {row("Last Updated", new Date(seller.updated_at).toLocaleString())}
          {seller.rejection_reason && row("Rejection Reason", seller.rejection_reason)}
        </div>
      </div>

      {/* Admin Verification Panel */}
      <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
        <h3 style={{ marginBottom: "1rem" }}>Admin Verification</h3>
        {seller.status === "pending" ? (
          <div>
            <p style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>
              This seller profile is pending verification. Review the details above and approve or reject.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-success" onClick={handleVerify}>
                ✓ Verify & Approve
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowReject(!showReject)}
              >
                ✕ Reject
              </button>
            </div>
            {showReject && (
              <div style={{ marginTop: "1rem" }}>
                <textarea
                  placeholder="Reason for rejection (optional)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                  rows={3}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button className="btn btn-danger btn-sm" onClick={handleReject}>
                    Confirm Rejection
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { setShowReject(false); setRejectReason(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : seller.status === "verified" ? (
          <p style={{ color: "var(--success)", fontWeight: 600 }}>
            ✓ This seller has been verified and approved.
          </p>
        ) : (
          <div>
            <p style={{ color: "var(--danger)", fontWeight: 600, marginBottom: "0.5rem" }}>
              ✕ This seller profile has been rejected.
            </p>
            {seller.rejection_reason && (
              <p style={{ color: "var(--text-muted)" }}>
                Reason: {seller.rejection_reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
