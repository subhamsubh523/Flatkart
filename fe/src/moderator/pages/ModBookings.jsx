import { useState, useEffect } from "react";
import ModAPI from "../modApi";
import AdminTable from "../../admin/components/AdminTable";

const statusColor = {
  pending:  { bg: "#fef9e7", color: "#f39c12" },
  approved: { bg: "#eafaf1", color: "#27ae60" },
  rejected: { bg: "#fdf0f0", color: "#e74c3c" },
};

export default function ModBookings({ mod }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const has = (p) => mod?.permissions?.includes(p);

  useEffect(() => {
    ModAPI.get("/bookings").then(({ data }) => { setBookings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await ModAPI.patch(`/bookings/${id}/status`, { status });
    setBookings((prev) => prev.map((b) => b._id === id ? data : b));
  };

  const toggleOwnerBooking = async (b) => {
    const ownerId = b.owner?._id || b.flat_id?.owner_id;
    if (!ownerId) return;
    const { data } = await ModAPI.patch(`/owners/${ownerId}/toggle-booking`);
    setBookings((prev) => prev.map((bk) =>
      bk.owner?._id?.toString() === ownerId?.toString() ||
      bk.flat_id?.owner_id?.toString() === ownerId?.toString()
        ? { ...bk, owner: { ...bk.owner, bookingRestricted: data.bookingRestricted } }
        : bk
    ));
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    await ModAPI.delete(`/bookings/${id}`);
    setBookings((prev) => prev.filter((b) => b._id !== id));
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = !search ||
      b.flat_id?.location?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenant_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenant_id?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: "flat", label: "Flat", render: (b) => (
      <div>
        <p style={{ margin: 0, fontWeight: "600", fontSize: "0.88rem" }}>{b.flat_id?.location || "—"}</p>
        <p style={{ margin: 0, color: "#888", fontSize: "0.78rem" }}>{b.flat_id?.type} · ₹{b.flat_id?.price?.toLocaleString()}/mo</p>
      </div>
    )},
    { key: "owner", label: "Owner", render: (b) => (
      <div>
        <p style={{ margin: 0, fontWeight: "600", fontSize: "0.88rem" }}>{b.owner?.name || "—"}</p>
        <p style={{ margin: 0, color: "#888", fontSize: "0.78rem" }}>{b.owner?.email || ""}</p>
      </div>
    )},
    { key: "tenant", label: "Tenant", render: (b) => (
      <div>
        <p style={{ margin: 0, fontWeight: "600", fontSize: "0.88rem" }}>{b.tenant_id?.name || "—"}</p>
        <p style={{ margin: 0, color: "#888", fontSize: "0.78rem" }}>{b.tenant_id?.email}</p>
      </div>
    )},
    { key: "status", label: "Status", render: (b) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ ...cs.badge, background: b.owner?.bookingRestricted ? "#fdf0f0" : "#eafaf1", color: b.owner?.bookingRestricted ? "#e74c3c" : "#27ae60" }}>
          {b.owner?.bookingRestricted ? "🚫 Restricted" : "✅ Allowed"}
        </span>
      </div>
    )},
    { key: "createdAt", label: "Date", render: (b) => new Date(b.createdAt).toLocaleDateString() },
    { key: "actions", label: "Actions", render: (b) => (
      <div style={cs.actions}>
        {b.owner && (has("owners:update") || has("bookings:update")) && (
          <button
            style={{ ...cs.blockBtn, background: b.owner.bookingRestricted ? "#eafaf1" : "#fdf0f0", color: b.owner.bookingRestricted ? "#27ae60" : "#e74c3c", border: `1px solid ${b.owner.bookingRestricted ? "#a9dfbf" : "#f5c6cb"}` }}
            onClick={() => toggleOwnerBooking(b)}
          >
            {b.owner.bookingRestricted ? "✅ Unblock" : "🚫 Block"}
          </button>
        )}
        {has("bookings:delete") && (
          <button style={{ ...cs.btn, background: "#fdf0f0", color: "#e74c3c" }} onClick={() => remove(b._id)}>Delete</button>
        )}
        {!has("owners:update") && !has("bookings:update") && !has("bookings:delete") && <span style={{ color: "#ccc", fontSize: "0.8rem" }}>View only</span>}
      </div>
    )},
  ];

  return (
    <div>
      <div style={cs.header}>
        <div>
          <h2 style={cs.title}>📋 Bookings</h2>
          <p style={cs.sub}>{bookings.length} total bookings</p>
        </div>
        <div style={cs.filters}>
          <input style={cs.search} placeholder="Search Owner or Tenant" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={cs.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="restricted">Restricted</option>
            <option value="allowed">Allowed</option>
          </select>
        </div>
      </div>
      <AdminTable columns={columns} data={filtered} loading={loading} emptyMsg="No bookings found." />
    </div>
  );
}

const cs = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: 0, color: "#888", fontSize: "0.9rem" },
  filters: { display: "flex", gap: "10px", flexWrap: "wrap" },
  search: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem", minWidth: "220px" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem" },
  badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  blockBtn: { padding: "3px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" },
  approveBtn: { padding: "4px 10px", background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  rejectBtn: { padding: "4px 10px", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  resetBtn: { padding: "4px 10px", background: "#f0f2f5", color: "#555", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  btn: { padding: "5px 14px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
};
