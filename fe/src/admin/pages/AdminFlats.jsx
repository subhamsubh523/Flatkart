import { useState, useEffect } from "react";
import AdminAPI from "../adminApi";
import AdminTable from "../components/AdminTable";
import { FiEye, FiEyeOff, FiTrash2, FiTag, FiX, FiMapPin, FiHome, FiInfo, FiMaximize2, FiAlertTriangle } from "react-icons/fi";

export default function AdminFlats() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    AdminAPI.get("/flats").then(({ data }) => { setFlats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleVisibility = async (id) => {
    const { data } = await AdminAPI.patch(`/flats/${id}/toggle`);
    setFlats((prev) => prev.map((f) => f._id === id ? { ...f, visible: data.visible } : f));
  };

  const remove = async (id) => {
    await AdminAPI.delete(`/flats/${id}`);
    setFlats((prev) => prev.filter((f) => f._id !== id));
    if (selected?._id === id) setSelected(null);
    setDeleteTarget(null);
  };

  const filtered = flats.filter((f) =>
    f.location?.toLowerCase().includes(search.toLowerCase()) ||
    f.type?.toLowerCase().includes(search.toLowerCase()) ||
    f.city?.toLowerCase().includes(search.toLowerCase()) ||
    f.state?.toLowerCase().includes(search.toLowerCase()) ||
    f.pincode?.toLowerCase().includes(search.toLowerCase())
  );

  const imgSrc = (s) => s?.startsWith("http") ? s : `http://localhost:5000/uploads/${s}`;

  const fullAddress = (f) => [f.houseNo, f.locality, f.city, f.district, f.state, f.pincode, f.country]
    .filter(Boolean).join(", ");

  const columns = [
    { key: "image", label: "Image", render: (f) => {
      const src = f.images?.[0] || f.image;
      return src ? <img src={imgSrc(src)} alt="" style={cs.img} /> : <div style={cs.noImg}><FiHome size={18} color="#aaa" /></div>;
    }},
    { key: "details", label: "Flat Details", render: (f) => (
      <div>
        <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "0.9rem", color: "#2c3e50" }}>{f.type} · ₹{f.price?.toLocaleString()}/mo</p>
        {f.roomWidth && f.roomBreadth && <p style={{ margin: "0 0 2px", fontSize: "0.8rem", color: "#555" }}>{f.roomWidth} × {f.roomBreadth} ft</p>}
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>{[f.city, f.state].filter(Boolean).join(", ") || "—"}</p>
      </div>
    )},
    { key: "address", label: "Address", render: (f) => (
      <div style={{ maxWidth: "220px" }}>
        <p style={{ margin: "0 0 3px", fontSize: "0.82rem", fontWeight: "600", color: "#2c3e50", display: "flex", alignItems: "flex-start", gap: 3 }}>
          <FiMapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />{f.location || "—"}{f.pincode ? ` - ${f.pincode}` : ""}
        </p>
        {f.landmark && <p style={{ margin: 0, fontSize: "0.76rem", color: "#888" }}>Near: {f.landmark}</p>}
      </div>
    )},

    { key: "status", label: "Status", render: (f) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ ...cs.badge, background: f.visible ? "#eafaf1" : "#f0f2f5", color: f.visible ? "#27ae60" : "#888", border: `1px solid ${f.visible ? "#a9dfbf" : "#ddd"}` }}>
          {f.visible ? <><FiEye size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Visible</> : <><FiEyeOff size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Hidden</>}
        </span>
        {f.rented && <span style={{ ...cs.badge, background: "#fef9e7", color: "#f39c12", border: "1px solid #f9e4a0" }}><FiTag size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Rented</span>}
      </div>
    )},
    { key: "actions", label: "Actions", render: (f) => (
      <div style={cs.actions}>
        <button style={{ ...cs.btn, background: "#eaf4fb", color: "#2980b9" }} onClick={() => setSelected(f)}>
          <FiInfo size={12} style={{ marginRight: 4 }} />Details
        </button>
        <button style={{ ...cs.btn, background: f.visible ? "#fdf0f0" : "#eafaf1", color: f.visible ? "#e74c3c" : "#27ae60" }} onClick={() => toggleVisibility(f._id)}>
          {f.visible ? <><FiEyeOff size={12} style={{ marginRight: 4 }} />Hide</> : <><FiEye size={12} style={{ marginRight: 4 }} />Show</>}
        </button>
        <button style={{ ...cs.btn, background: "#fdf0f0", color: "#e74c3c" }} onClick={() => setDeleteTarget(f)}><FiTrash2 size={12} style={{ marginRight: 4 }} />Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <div style={cs.header}>
        <div>
          <h2 style={cs.title}><FiHome size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />Flats</h2>
          <p style={cs.sub}>{flats.length} total listings</p>
        </div>
        <input style={cs.search} placeholder="Search by location, type, city..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <AdminTable columns={columns} data={filtered} loading={loading} emptyMsg="No flats found." />

      {/* Detail Modal */}
      {selected && (
        <div style={cs.overlay} onClick={() => setSelected(null)}>
          <div style={cs.modal} onClick={(e) => e.stopPropagation()}>
            <div style={cs.modalHeader}>
              <p style={cs.modalTitle}><FiHome size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />Flat Details</p>
              <button style={cs.closeBtn} onClick={() => setSelected(null)}><FiX size={18} /></button>
            </div>

            {/* Images */}
            {(selected.images?.length > 0 || selected.image) && (
              <div style={cs.imgRow}>
                {(selected.images?.length > 0 ? selected.images : [selected.image]).map((src, i) => (
                  <img key={i} src={imgSrc(src)} alt="" style={cs.modalImg} />
                ))}
              </div>
            )}

            <div style={cs.sections}>
              {/* Basic Info */}
              <div style={cs.section}>
                <p style={cs.sectionTitle}><FiInfo size={13} style={{ marginRight: 6 }} />Basic Info</p>
                <div style={cs.grid}>
                  <Detail label="Type" value={selected.type} />
                  <Detail label="Price" value={`₹${selected.price?.toLocaleString()}/mo`} />
                  <Detail label="Room Size" value={selected.roomWidth && selected.roomBreadth ? `${selected.roomWidth} × ${selected.roomBreadth} ft` : null} />
                  <Detail label="Visible" value={selected.visible ? "Yes" : "No"} />
                  <Detail label="Rented" value={selected.rented ? "Yes" : "No"} />
                  <Detail label="Views" value={selected.views ?? 0} />
                </div>
              </div>

              {/* Address */}
              <div style={cs.section}>
                <p style={cs.sectionTitle}><FiMapPin size={13} style={{ marginRight: 6 }} />Address</p>
                <div style={cs.grid}>
                  <Detail label="House No." value={selected.houseNo} />
                  <Detail label="Locality" value={selected.locality} />
                  <Detail label="Landmark" value={selected.landmark} />
                  <Detail label="City" value={selected.city} />
                  <Detail label="District" value={selected.district} />
                  <Detail label="State" value={selected.state} />
                  <Detail label="Pincode" value={selected.pincode} />
                  <Detail label="Country" value={selected.country} />
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div style={cs.section}>
                  <p style={cs.sectionTitle}><FiMaximize2 size={13} style={{ marginRight: 6 }} />Description</p>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#555", lineHeight: 1.6 }}>{selected.description}</p>
                </div>
              )}

              {/* Comments */}
              {selected.comments && (
                <div style={cs.section}>
                  <p style={cs.sectionTitle}>Comments</p>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#555", lineHeight: 1.6 }}>{selected.comments}</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button style={{ ...cs.btn, background: selected.visible ? "#fdf0f0" : "#eafaf1", color: selected.visible ? "#e74c3c" : "#27ae60", padding: "9px 18px" }}
                onClick={() => { toggleVisibility(selected._id); setSelected((s) => ({ ...s, visible: !s.visible })); }}>
                {selected.visible ? <><FiEyeOff size={13} style={{ marginRight: 5 }} />Hide</> : <><FiEye size={13} style={{ marginRight: 5 }} />Show</>}
              </button>
              <button style={{ ...cs.btn, background: "#fdf0f0", color: "#e74c3c", padding: "9px 18px" }} onClick={() => setDeleteTarget(selected)}>
                <FiTrash2 size={13} style={{ marginRight: 5 }} />Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div style={cs.delOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={cs.popup} onClick={(e) => e.stopPropagation()}>
            <button style={cs.popupClose} onClick={() => setDeleteTarget(null)}><FiX size={16} /></button>
            <div style={cs.iconWrap}><FiAlertTriangle size={28} color="#e74c3c" /></div>
            <h3 style={cs.popupTitle}>Confirm Delete</h3>
            <p style={cs.popupMsg}>Delete this flat and all its bookings? This cannot be undone.</p>
            <div style={cs.popupActions}>
              <button style={cs.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={cs.confirmBtn} onClick={() => remove(deleteTarget._id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : undefined }}>
      <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "0.88rem", color: value ? "#2c3e50" : "#ccc" }}>{value || "—"}</p>
    </div>
  );
}

const cs = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: 0, color: "#888", fontSize: "0.9rem" },
  search: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem", minWidth: "260px" },
  img: { width: "60px", height: "44px", objectFit: "cover", borderRadius: "6px" },
  noImg: { width: "60px", height: "44px", background: "#f0f2f5", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" },
  badge: { padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "600", display: "inline-flex", alignItems: "center" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  btn: { display: "inline-flex", alignItems: "center", padding: "5px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#2c3e50" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" },
  imgRow: { display: "flex", gap: "10px", overflowX: "auto", marginBottom: "20px", paddingBottom: "4px" },
  modalImg: { width: "160px", height: "110px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 },
  sections: { display: "flex", flexDirection: "column", gap: "20px" },
  section: { background: "#f8f9fa", borderRadius: "10px", padding: "16px" },
  sectionTitle: { margin: "0 0 12px", fontSize: "0.8rem", fontWeight: "700", color: "#2c3e50", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" },
  delOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  popup: { background: "#fff", borderRadius: "14px", padding: "32px 28px 24px", width: "100%", maxWidth: "380px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", textAlign: "center", position: "relative" },
  popupClose: { position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" },
  iconWrap: { width: "56px", height: "56px", borderRadius: "50%", background: "#fdf0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  popupTitle: { margin: "0 0 8px", fontSize: "1.1rem", fontWeight: "700", color: "#2c3e50" },
  popupMsg: { margin: "0 0 24px", fontSize: "0.9rem", color: "#666", lineHeight: 1.5 },
  popupActions: { display: "flex", gap: "10px", justifyContent: "center" },
  cancelBtn: { padding: "10px 24px", background: "#f0f2f5", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600", color: "#555" },
  confirmBtn: { padding: "10px 24px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "700", color: "#fff" },
};
