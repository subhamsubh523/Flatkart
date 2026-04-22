import { useState, useEffect } from "react";
import ModAPI from "../modApi";
import AdminTable from "../../admin/components/AdminTable";

export default function ModOwners({ mod }) {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const has = (p) => mod?.permissions?.includes(p);

  useEffect(() => {
    ModAPI.get("/owners").then(({ data }) => { setOwners(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    const { data } = await ModAPI.patch(`/owners/${id}/toggle`);
    setOwners((prev) => prev.map((o) => o._id === id ? { ...o, blocked: data.blocked } : o));
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this owner and all their flats?")) return;
    await ModAPI.delete(`/owners/${id}`);
    setOwners((prev) => prev.filter((o) => o._id !== id));
  };

  const filtered = owners.filter((o) =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "avatar", label: "Avatar", render: (o) => o.avatar
      ? <img src={o.avatar} alt="" style={cs.avatar} />
      : <div style={cs.avatarFallback}>{o.name?.[0]?.toUpperCase()}</div> },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Joined", render: (o) => new Date(o.createdAt).toLocaleDateString() },
    { key: "status", label: "Status", render: (o) => {
      const blocked = o.blocked;
      return <span style={{ ...cs.badge, background: blocked ? "#fdf0f0" : "#eafaf1", color: blocked ? "#e74c3c" : "#27ae60", border: `1px solid ${blocked ? "#f5c6cb" : "#a9dfbf"}` }}>{blocked ? "Blocked" : "Active"}</span>;
    }},
    { key: "actions", label: "Actions", render: (o) => (
      <div style={cs.actions}>
        {has("owners:update") && <button style={{ ...cs.btn, background: o.blocked ? "#eafaf1" : "#fdf0f0", color: o.blocked ? "#27ae60" : "#e74c3c" }} onClick={() => toggle(o._id)}>{o.blocked ? "Unblock" : "Block"}</button>}
        {has("owners:delete") && <button style={{ ...cs.btn, background: "#fdf0f0", color: "#e74c3c" }} onClick={() => remove(o._id)}>Delete</button>}
        {!has("owners:update") && !has("owners:delete") && <span style={{ color: "#ccc", fontSize: "0.8rem" }}>View only</span>}
      </div>
    )},
  ];

  return (
    <div>
      <div style={cs.header}>
        <div>
          <h2 style={cs.title}>🏢 Owners</h2>
          <p style={cs.sub}>{owners.length} registered owners</p>
        </div>
        <input style={cs.search} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <AdminTable columns={columns} data={filtered} loading={loading} emptyMsg="No owners found." />
    </div>
  );
}

const cs = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: 0, color: "#888", fontSize: "0.9rem" },
  search: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem", minWidth: "260px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover" },
  avatarFallback: { width: "34px", height: "34px", borderRadius: "50%", background: "#2c3e50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.9rem" },
  badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" },
  actions: { display: "flex", gap: "8px" },
  btn: { padding: "5px 14px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
};
