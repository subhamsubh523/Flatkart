import { useState, useEffect } from "react";
import { FiGrid, FiUsers, FiUser, FiHome, FiBookmark, FiShield, FiSettings, FiLogOut, FiPlus, FiEye, FiEyeOff, FiX, FiTrash2, FiToggleLeft, FiToggleRight, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiSlash } from "react-icons/fi";
import AdminAPI from "../adminApi";

const TABS = [
  { key: "overview",   label: "Overview",   icon: <FiGrid size={16} /> },
  { key: "owners",     label: "Owners",     icon: <FiUsers size={16} /> },
  { key: "tenants",    label: "Tenants",    icon: <FiUser size={16} /> },
  { key: "flats",      label: "Flats",      icon: <FiHome size={16} /> },
  { key: "bookings",   label: "Bookings",   icon: <FiBookmark size={16} /> },
  { key: "moderators", label: "Moderators", icon: <FiShield size={16} /> },
  { key: "profile",    label: "My Profile", icon: <FiSettings size={16} /> },
];

const EMPTY = { name: "", email: "", password: "" };

export default function AdminSidebar({ active, setActive, admin, onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (showManage && admin?.isSuperAdmin) {
      AdminAPI.get("/admins").then(({ data }) => setAdmins(data)).catch(() => {});
    }
  }, [showManage, admin]);

  useEffect(() => {
    if (!showManage) return;
    const handler = (e) => {
      if (!e.target.closest("[data-manage-panel]")) setShowManage(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showManage]);

  const openModal = () => { setForm(EMPTY); setError(""); setSuccess(""); setShowPass(false); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); setSuccess(""); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const { data } = await AdminAPI.post("/admins", form);
      setAdmins((prev) => [data, ...prev]);
      setSuccess("Admin added successfully!");
      setTimeout(closeModal, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add admin");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await AdminAPI.patch(`/admins/${id}/toggle`);
      setAdmins((prev) => prev.map((a) => a._id === id ? { ...a, blocked: data.blocked } : a));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle admin");
    }
  };

  const handleDelete = async (id) => {
    try {
      await AdminAPI.delete(`/admins/${id}`);
      setAdmins((prev) => prev.filter((a) => a._id !== id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete admin");
    }
  };

  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <FiShield size={28} color="#e74c3c" />
        <div>
          <p style={s.brandName}>FLATKART</p>
          <p style={s.brandSub}>Administrator Panel</p>
        </div>
      </div>

      <div style={s.adminInfo}>
        <div style={{ ...s.adminAvatar, background: admin?.isSuperAdmin ? "#f39c12" : "#e74c3c" }}>
          {admin?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={s.adminName}>{admin?.name}</p>
          <p style={{ ...s.adminRole, color: admin?.isSuperAdmin ? "#f39c12" : "#e74c3c" }}>
            {admin?.isSuperAdmin ? "Super Admin" : "Admin"}
          </p>
        </div>
        {admin?.isSuperAdmin && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button style={s.addBtn} onClick={openModal} title="Add New Admin">
              <FiPlus size={13} />
            </button>
            <button style={{ ...s.addBtn, background: "rgba(243,156,18,0.15)", borderColor: "rgba(243,156,18,0.4)", color: "#f39c12" }}
              onClick={() => setShowManage((v) => !v)} title="Manage Admins" data-manage-panel>
              <FiUsers size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Manage Admins Panel — super admin only */}
      {admin?.isSuperAdmin && showManage && (
        <div style={s.managePanel} data-manage-panel>
          <p style={s.managePanelTitle}>Manage Admins</p>
          {admins.filter((a) => a._id !== admin.id).length === 0 ? (
            <p style={s.manageEmpty}>No other admins yet.</p>
          ) : (
            admins.filter((a) => a._id !== admin.id).map((a) => (
              <div key={a._id} style={s.adminRow}>
                <div style={{ ...s.adminRowAvatar, background: a.blocked ? "#636e72" : "#e74c3c" }}>
                  {a.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <p style={s.adminRowName}>{a.name}</p>
                    <span style={{ ...s.adminRowStatus, color: a.blocked ? "#e74c3c" : "#2ecc71", background: a.blocked ? "rgba(231,76,60,0.12)" : "rgba(46,204,113,0.12)", padding: "1px 7px", borderRadius: "10px", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      {a.blocked ? <FiSlash size={9} /> : <FiCheckCircle size={9} />}{a.blocked ? "Disabled" : "Active"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <button style={{ ...s.iconBtn, flex: 1, color: a.blocked ? "#2ecc71" : "#f39c12", background: a.blocked ? "rgba(46,204,113,0.1)" : "rgba(243,156,18,0.1)", border: `1px solid ${a.blocked ? "rgba(46,204,113,0.3)" : "rgba(243,156,18,0.3)"}`, borderRadius: "6px", padding: "4px 6px", justifyContent: "center" }}
                      onClick={() => handleToggle(a._id)}>
                      {a.blocked ? <><FiToggleLeft size={13} /><span style={{ fontSize: "0.68rem", fontWeight: "700", marginLeft: 3 }}>Enable</span></> : <><FiToggleRight size={13} /><span style={{ fontSize: "0.68rem", fontWeight: "700", marginLeft: 3 }}>Disable</span></>}
                    </button>
                    <button style={{ ...s.iconBtn, flex: 1, color: "#e74c3c", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "6px", padding: "4px 6px", justifyContent: "center" }}
                      onClick={() => setDeleteTarget(a)}>
                      <FiTrash2 size={13} /><span style={{ fontSize: "0.68rem", fontWeight: "700", marginLeft: 3 }}>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirm Popup */}
      {deleteTarget && (
        <div style={s.delOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={s.popup} onClick={(e) => e.stopPropagation()}>
            <button style={s.popupClose} onClick={() => setDeleteTarget(null)}><FiX size={16} /></button>
            <div style={s.iconWrap}><FiAlertTriangle size={28} color="#e74c3c" /></div>
            <h3 style={s.popupTitle}>Confirm Delete</h3>
            <p style={s.popupMsg}>Delete admin <strong>{deleteTarget.name}</strong> permanently? This cannot be undone.</p>
            <div style={s.popupActions}>
              <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={s.confirmBtn} onClick={() => handleDelete(deleteTarget._id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showModal && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <p style={s.modalTitle}><FiPlus size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />Add New Admin</p>
              <button style={s.closeBtn} onClick={closeModal}><FiX size={16} /></button>
            </div>
            {error && <div style={s.errorBox}>{error}</div>}
            {success && <div style={s.successBox}>{success}</div>}
            <form onSubmit={handleAdd} style={s.form}>
              <div style={s.group}>
                <label style={s.label}>Full Name</label>
                <input style={s.input} placeholder="Name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={s.group}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" placeholder="Admin ID" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={s.group}>
                <label style={s.label}>Password</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...s.input, paddingRight: "40px" }} type={showPass ? "text" : "password"}
                    placeholder="Password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }} type="submit" disabled={saving}>
                {saving ? "Adding..." : <><FiUserPlus size={15} />Add Admin</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <nav style={s.nav}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)}
            style={{ ...s.navBtn, ...(active === t.key ? s.navBtnActive : {}) }}>
            <span style={s.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <button style={s.logoutBtn} onClick={onLogout}><FiLogOut size={15} style={{ marginRight: 6 }} /> Logout</button>
    </aside>
  );
}

const s = {
  addBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.4)", color: "#e74c3c", borderRadius: "6px", cursor: "pointer", flexShrink: 0 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { margin: 0, fontSize: "1rem", fontWeight: "700", color: "#2c3e50" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "9px 13px", marginBottom: "14px", fontSize: "0.88rem" },
  successBox: { background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "8px", padding: "9px 13px", marginBottom: "14px", fontSize: "0.88rem" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  group: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "0.83rem", fontWeight: "600", color: "#444" },
  input: { padding: "10px 13px", fontSize: "0.95rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", background: "#fafafa", width: "100%", boxSizing: "border-box" },
  saveBtn: { padding: "11px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem", marginTop: "4px" },
  sidebar: { width: "240px", background: "#1a252f", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 16px", gap: "20px", flexShrink: 0, minHeight: "100vh", overflowY: "auto" },
  brand: { display: "flex", alignItems: "center", gap: "10px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  brandName: { margin: 0, fontWeight: "800", fontSize: "1rem", color: "#fff", letterSpacing: "2px" },
  brandSub: { margin: 0, fontSize: "0.72rem", color: "#e74c3c", fontWeight: "600", letterSpacing: "1px" },
  adminInfo: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" },
  adminAvatar: { width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", flexShrink: 0 },
  adminName: { margin: 0, fontWeight: "600", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adminRole: { margin: 0, fontSize: "0.72rem", fontWeight: "600" },
  // Manage panel
  managePanel: { background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)" },
  managePanelTitle: { margin: "0 0 10px", fontSize: "0.75rem", fontWeight: "700", color: "#f39c12", textTransform: "uppercase", letterSpacing: "0.5px" },
  manageEmpty: { margin: 0, fontSize: "0.8rem", color: "#636e72", textAlign: "center", padding: "8px 0" },
  adminRow: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  adminRowAvatar: { width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem", flexShrink: 0 },
  adminRowName: { margin: 0, fontSize: "0.82rem", fontWeight: "600", color: "#ecf0f1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adminRowStatus: { margin: 0, fontSize: "0.7rem", fontWeight: "600" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "4px", flexShrink: 0 },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", background: "none", border: "none", color: "#bdc3c7", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "500", textAlign: "left", width: "100%" },
  navBtnActive: { background: "rgba(231,76,60,0.15)", color: "#fff", borderLeft: "3px solid #e74c3c" },
  navIcon: { fontSize: "1rem", width: "20px" },
  logoutBtn: { padding: "11px 14px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" },
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
