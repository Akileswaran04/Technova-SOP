import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getSellers } from "../api";

export default function SellerList() {
  const [sellers, setSellers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const limit = 10;

  const load = useCallback(() => {
    const params = { skip: page * limit, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    getSellers(params).then((r) => {
      setSellers(r.data.sellers);
      setTotal(r.data.total);
    });
  }, [page, status, search]);

  useEffect(() => load(), [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    load();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="card-header">
        <h1>Seller Profiles</h1>
        <Link to="/sellers/new" className="btn btn-primary">
          + Register Seller
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="search-bar">
        <form onSubmit={handleSearch} style={{ display: "flex", flex: 1, gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search by name, license, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      <div className="filter-btns" style={{ marginBottom: "1rem" }}>
        {["", "pending", "verified", "rejected"].map((s) => (
          <button
            key={s}
            className={`filter-btn ${status === s ? "active" : ""}`}
            onClick={() => { setStatus(s); setPage(0); }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      {sellers.length === 0 ? (
        <div className="empty-state">
          <p>No sellers found.</p>
          <Link to="/sellers/new" className="btn btn-primary">
            Register a Seller
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Business Name</th>
                  <th>Owner</th>
                  <th>License</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      <Link to={`/sellers/${s.id}`}>{s.business_name}</Link>
                    </td>
                    <td>{s.owner_name}</td>
                    <td>{s.license_number}</td>
                    <td>{s.city}</td>
                    <td>
                      <span className={`badge badge-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>
          <span style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
