import { useState, useEffect } from "react";
import ModAPI from "../modApi";
import AdminTable from "../../admin/components/AdminTable";

export default function ModFlats({ mod }) {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const has = (p) => mod?.permissions?.includes(p);

  useEffect(() => {
    ModAPI.get("/flats").then(({ data }) => { setFlats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleVisibility = async (id) => {
    const { data } = await ModAPI.patch(`/flats/${id}/toggle`);
    setFlats((prev) => prev.map((f) => f._id === id ? { ...f, visible: data.visible } : f));
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this flat and all its bookings?")) return;
    await ModAPI.delete(`/flats/${id}`);
    setFlats((prev) => prev.filter((f) => f._id !== id));
  };

  const filtered = flats.filter((f) =>
    f.location?.toLowerCase().includes(search.toLowerCase()) ||
    f.type?.toLowerCase().includes(search.toLowerCase()) ||
    f.city?.toLowerCase().includes(search.toLowerCase())
  );

  const imgSrc = (s) => s?.startsWith("http") ? s : `http://localhost:5000/uploads/${s}`;

  const columns = [
    { key: "image", label: "Image", render: (f) => {
      const src = f.images?.[0] || f.image;
      return src ? <img src={imgSrc(src)} alt="" style={cs.img} /> : <div style={cs.noImg}>🏠</div>;
    }},
    { key: "location", label: "Location" },
    { key: "type", label: "Type" },
    { key: "price", label: "Price", render: (f) => `₹${f.price?.toLocaleString()}/mo` },
    { key: "status", label: "Status", render: (f) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ ...cs.badge, background: f.visible ? "#eafaf1" : "#f0f2f5", color: f.visible ? "#27ae60" : "#888" }}>{f.visible ? "Visible" : "Hidden"}</span>
        {f.rented && <span style={{ ...cs.badge, background: "#fef9e7", color: "#f39c12" }}>Rented</span>}
      </div>
    )},
    { key: "actions", label: "Actions", render: (f) => (
      <div style={cs.actions}>
        {has("flats:update") && <button style={{ ...cs.btn, background: f.visible ? "#fdf0f0" : "#eafaf1", color: f.visible ? "#e74c3c" : "#27ae60" }} onClick={() => toggleVisibility(f._id)}>{f.visible ? "Hide" : "Show"}</button>}
        {has("flats:delete") && <button style={{ ...cs.btn, background: "#fdf0f0", color: "#e74c3c" }} onClick={() => remove(f._id)}>Delete</button>}
        {!has("flats:update") && !has("flats:delete") && <span style={{ color: "#ccc", fontSize: "0.8rem" }}>View only</span>}
      </div>
    )},
  ];

  return (
    <div>
      <div style={cs.header}>
        <div>
          <h2 style={cs.title}>🏠 Flats</h2>
          <p style={cs.sub}>{flats.length} total listings</p>
        </div>
        <input style={cs.search} placeholder="Search by location, type, city..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <AdminTable columns={columns} data={filtered} loading={loading} emptyMsg="No flats found." />
    </div>
  );
}

const cs = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: 0, color: "#888", fontSize: "0.9rem" },
  search: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem", minWidth: "260px" },
  img: { width: "60px", height: "44px", objectFit: "cover", borderRadius: "6px" },
  noImg: { width: "60px", height: "44px", background: "#f0f2f5", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" },
  badge: { padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "600", display: "inline-block" },
  actions: { display: "flex", gap: "8px" },
  btn: { padding: "5px 14px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
};
