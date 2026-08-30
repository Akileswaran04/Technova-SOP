import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerStats, getSellers } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    getSellerStats().then((r) => setStats(r.data));
    getSellers({ limit: 5 }).then((r) => setRecent(r.data.sellers));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>Dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="number">{stats.total}</div>
            <div className="label">Total Sellers</div>
          </div>
          <div className="stat-card pending">
            <div className="number">{stats.pending}</div>
            <div className="label">Pending Verification</div>
          </div>
          <div className="stat-card verified">
            <div className="number">{stats.verified}</div>
            <div className="label">Verified Sellers</div>
          </div>
          <div className="stat-card rejected">
            <div className="number">{stats.rejected}</div>
            <div className="label">Rejected</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Recent Sellers</h2>
          <Link to="/sellers" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <p>No sellers registered yet.</p>
            <Link to="/sellers/new" className="btn btn-primary">
              Register First Seller
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>City</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/sellers/${s.id}`}>{s.business_name}</Link>
                    </td>
                    <td>{s.owner_name}</td>
                    <td>{s.city}</td>
                    <td>
                      <span className={`badge badge-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
