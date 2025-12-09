import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminNav from "./AdminNav";

export default function AdminReferrals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  const filtered = items.filter((u) => {
    const q = String(query || "").toLowerCase();
    if (!q) return true;
    const name = String(u.name || "").toLowerCase();
    const email = String(u.email || "").toLowerCase();
    const tag = String(u.unique_tag || "").toLowerCase();
    const rname = String(u.referrer?.name || "").toLowerCase();
    const remail = String(u.referrer?.email || "").toLowerCase();
    const rtag = String(u.referrer?.unique_tag || "").toLowerCase();
    return (
      name.includes(q) || email.includes(q) || tag.includes(q) || rname.includes(q) || remail.includes(q) || rtag.includes(q)
    );
  });

  const formatDate = (value) => {
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return value || "";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = String(dt.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const prof = await axios.get("/api/v1/users/profile");
        const role = prof?.data?.user?.role;
        if (role !== "admin") {
          setAuthorized(false);
          setLoading(false);
          navigate("/", { replace: true });
          return;
        }
        setAuthorized(true);
        const res = await axios.get("/api/v1/referrals?limit=100&offset=0");
        setItems(Array.isArray(res?.data?.users) ? res.data.users : []);
      } catch (e) {
        setError("Failed to load referrals");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return null;
  if (!authorized) return null;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: 16 }}>
      <AdminNav />
      <h1 style={{ marginBottom: 12 }}>Admin — Referrals</h1>

      {error && <div style={{ color: "#ff7272" }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by user or referrer"
          className="inputBase"
          style={{ flex: 1 }}
        />
        <div className="mutedText" style={{ fontSize: 13 }}>Found {filtered.length}</div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(35,45,60,0.65)" }}>
              <th style={{ padding: 10, textAlign: "left" }}>User</th>
              <th style={{ padding: 10, textAlign: "left" }}>Email</th>
              <th style={{ padding: 10, textAlign: "left" }}>Tag</th>
              <th style={{ padding: 10, textAlign: "left" }}>Joined</th>
              <th style={{ padding: 10, textAlign: "left" }}>Invited By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const inviter = u.referrer;
              return (
                <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <td style={{ padding: 10 }}>{u.name || "—"}</td>
                  <td style={{ padding: 10 }}>{u.email}</td>
                  <td style={{ padding: 10 }}>{u.unique_tag}</td>
                  <td style={{ padding: 10 }}>{formatDate(u.date)}</td>
                  <td style={{ padding: 10 }}>
                    {inviter ? (
                      <span>
                        {inviter.name || "—"} ({inviter.email})
                      </span>
                    ) : (
                      <span className="mutedText">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
