import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminNav from "./AdminNav";

export default function AdminDeposits() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ amount: '', status: '' });
  const [saving, setSaving] = useState(false);
  const amountRef = useRef(null);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [users, setUsers] = useState([]);
  const [usersQuery, setUsersQuery] = useState('');
  
  const filteredUsers = users.filter((u) => {
    const q = String(usersQuery || '').toLowerCase();
    const name = String(u.name || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const matchesQuery = !q || name.includes(q) || email.includes(q);
    return matchesQuery;
  });

  const formatDate = (value) => {
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return value || '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dt.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatUser = (dep) => {
    const u = dep && dep.user;
    if (!u) return String(dep.user_id);
    const name = u.name || '';
    const email = u.email || '';
    if (name && email) return `${name} (${email})`;
    if (name) return name;
    if (email) return email;
    return String(dep.user_id);
  };

  const startEdit = (dep) => {
    setEditingId(dep.id);
    setForm({ amount: String(dep.amount || ''), status: dep.status || 'pending' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ amount: '', status: '' });
  };

  const saveEdit = async (dep) => {
    const payload = {};
    const amtNum = Number(form.amount);
    if (form.amount !== '' && Number.isFinite(amtNum) && amtNum !== Number(dep.amount)) {
      payload.amount = amtNum;
    }
    if (form.status && form.status !== dep.status) {
      payload.status = form.status;
    }
    if (!Object.keys(payload).length) {
      cancelEdit();
      return;
    }
    try {
      setSaving(true);
      const token = (() => {
        try {
          const pair = document.cookie.split('; ').find((row) => row.startsWith('jwt='));
          return pair ? pair.split('=')[1] : null;
        } catch (_) {
          return null;
        }
      })();
      const res = await axios.patch(`/api/v1/deposits/${dep.id}`, payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const updated = res?.data?.deposit || null;
      const merged = updated ? { ...dep, ...updated, user: dep.user } : dep;
      setItems((prev) => prev.map((it) => (it.id === dep.id ? merged : it)));
      cancelEdit();
    } catch (e) {
      setError('Failed to update deposit');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (editingId) {
      const onKey = (e) => {
        if (e.key === 'Escape') cancelEdit();
      };
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
      setTimeout(() => amountRef.current && amountRef.current.focus(), 0);

      const updateOffset = () => {
        let offset = 0;
        try {
          const vv = window.visualViewport;
          if (vv) {
            offset = Math.max(0, window.innerHeight - vv.height);
          }
        } catch (_) {}
        if (offset === 0 && window.innerWidth <= 480) offset = 40;
        setViewportOffset(Math.min(140, offset + 16));
      };
      updateOffset();
      const vv = window.visualViewport;
      if (vv && vv.addEventListener) vv.addEventListener('resize', updateOffset);

      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        if (vv && vv.removeEventListener) vv.removeEventListener('resize', updateOffset);
        setViewportOffset(0);
      };
    }
  }, [editingId]);

  useEffect(() => {
    (async () => {
      try {
        const prof = await axios.get('/api/v1/users/profile');
        const role = prof?.data?.user?.role;
        if (role !== 'admin') {
          setAuthorized(false);
          setLoading(false);
          navigate('/', { replace: true });
          return;
        }
        setAuthorized(true);
        const res = await axios.get('/api/v1/deposits?limit=100&offset=0');
        setItems(Array.isArray(res?.data?.deposits) ? res.data.deposits : []);
        setTotals(res?.data?.totals || null);
        const list = await axios.get('/api/v1/users/list');
        setUsers(Array.isArray(list?.data?.user) ? list.data.user : []);
      } catch (e) {
        setError('Failed to load deposits');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return null;
  if (!authorized) return null;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 16 }}>
      <AdminNav />
      <h1 style={{ marginBottom: 12 }}>Admin — Deposits</h1>

      {totals && (
        <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.85 }}>
          <span>Total successful: {totals.total}</span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Pending count: {totals.pending}</span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Failed count: {totals.failed}</span>
        </div>
      )}

      {error && <div style={{ color: '#ff7272' }}>{error}</div>}

      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(35,45,60,0.65)' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>ID</th>
              <th style={{ padding: 10, textAlign: 'left' }}>User</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Amount</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Currency</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Provider</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Chain</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Ref Code</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Date</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <td style={{ padding: 10 }}>{d.id}</td>
                <td style={{ padding: 10 }}>{formatUser(d)}</td>
                <td style={{ padding: 10 }}>{Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: 10 }}>{d.currency}</td>
                <td style={{ padding: 10 }}>{d.status}</td>
                <td style={{ padding: 10 }}>{d.provider}</td>
                <td style={{ padding: 10 }}>{d.chain}</td>
                <td style={{ padding: 10 }}>{d.reference_code}</td>
                <td style={{ padding: 10 }}>{formatDate(d.date)}</td>
                <td style={{ padding: 10 }}>
                  <button onClick={() => startEdit(d)} className="btnPrimary">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users && users.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 12 }}>Users</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <input
              value={usersQuery}
              onChange={(e) => setUsersQuery(e.target.value)}
              placeholder="Search by name or email"
              className="inputBase"
              style={{ flex: 1 }}
            />
            <div className="mutedText" style={{ fontSize: 13 }}>Found {filteredUsers.length}</div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12
            }}
          >
            {filteredUsers.map((u, idx) => {
              const name = u.name || (u.email ? String(u.email).split('@')[0] : 'Unnamed');
              const email = u.email || '';
              const initial = String(name || email || '?').trim().charAt(0).toUpperCase() || '?';
              const provider = (u.provider || '').toUpperCase();
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(35,45,60,0.65)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    padding: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}
                    >
                      {initial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div className="mutedText" style={{ fontSize: 13 }}>{email}</div>
                      <div className="mutedText" style={{ fontSize: 12, marginTop: 4 }}>
                        ID #{u.id}{u.unique_tag ? ` • Tag ${u.unique_tag}` : ''}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.14)'
                      }}
                    >
                      {provider || 'LOCAL'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredUsers.length === 0 && (
            <div className="mutedText" style={{ marginTop: 12 }}>Չկան արդյունքներ</div>
          )}
        </div>
      )}

      {editingId != null && (() => {
        const dep = items.find((it) => it.id === editingId);
        if (!dep) return null;
        const onOverlayClick = (e) => {
          if (e.target === e.currentTarget) cancelEdit();
        };
        return (
          <div
            role="dialog"
            aria-modal="true"
            onClick={onOverlayClick}
            className="modalOverlay"
            style={{ paddingTop: viewportOffset || undefined, alignItems: viewportOffset ? 'flex-start' : 'center', transition: 'padding-top 0.2s ease' }}
          >
            <div className="modalCard">
              <div className="modalHeader">
                <div className="modalTitle">Edit Deposit</div>
                <button onClick={cancelEdit} aria-label="Close" className="modalClose">✕</button>
              </div>

              <div className="modalBody">
                <div style={{ marginBottom: 12 }} className="mutedText">ID #{dep.id} • {formatUser(dep)} • Ref {dep.reference_code}</div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Amount</label>
                    <input
                      ref={amountRef}
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      className="inputBase"
                    />
                  </div>
                  <div style={{ width: 160 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="selectBase"
                    >
                      <option value="pending">pending</option>
                      <option value="success">success</option>
                      <option value="failed">failed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                  <button onClick={cancelEdit} disabled={saving} className="btnSecondary">
                    Cancel
                  </button>
                  <button onClick={() => saveEdit(dep)} disabled={saving} className="btnPrimary" aria-busy={saving}>
                    {saving ? (<><span className="spinner" />Saving...</>) : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
