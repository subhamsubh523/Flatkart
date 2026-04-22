import { FiGrid, FiUsers, FiUser, FiHome, FiBookmark, FiTool, FiLogOut } from "react-icons/fi";

const ALL_TABS = [
  { key: "overview",   label: "Overview",   icon: <FiGrid size={16} />,     permission: "overview:read" },
  { key: "owners",     label: "Owners",     icon: <FiUsers size={16} />,    permission: "owners:read" },
  { key: "tenants",    label: "Tenants",    icon: <FiUser size={16} />,     permission: "tenants:read" },
  { key: "flats",      label: "Flats",      icon: <FiHome size={16} />,     permission: "flats:read" },
  { key: "bookings",   label: "Bookings",   icon: <FiBookmark size={16} />, permission: "bookings:read" },
];

export default function ModSidebar({ active, setActive, mod, onLogout }) {
  const tabs = ALL_TABS.filter((t) => t.key === "overview" || mod?.permissions?.includes(t.permission));

  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <FiTool size={24} color="#9b59b6" />
        <div>
          <p style={s.brandName}>FLATKART</p>
          <p style={s.brandSub}>Moderator Panel</p>
        </div>
      </div>

      <div style={s.modInfo}>
        <div style={s.modAvatar}>{mod?.name?.[0]?.toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <p style={s.modName}>{mod?.name}</p>
          <p style={s.modRole}>Moderator</p>
        </div>
      </div>

      {tabs.length === 0 ? (
        <p style={s.noAccess}>No sections assigned yet. Contact the admin.</p>
      ) : (
        <nav style={s.nav}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActive(t.key)}
              style={{ ...s.navBtn, ...(active === t.key ? s.navBtnActive : {}) }}>
              <span style={s.navIcon}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <button style={s.logoutBtn} onClick={onLogout}><FiLogOut size={15} style={{ marginRight: 6 }} /> Logout</button>
    </aside>
  );
}

const s = {
  sidebar: { width: "240px", background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 16px", gap: "24px", flexShrink: 0, minHeight: "100vh" },
  brand: { display: "flex", alignItems: "center", gap: "10px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  brandIcon: { fontSize: "1.8rem", display: "flex" },
  brandName: { margin: 0, fontWeight: "800", fontSize: "1rem", color: "#fff", letterSpacing: "2px" },
  brandSub: { margin: 0, fontSize: "0.72rem", color: "#9b59b6", fontWeight: "600", letterSpacing: "1px" },
  modInfo: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" },
  modAvatar: { width: "38px", height: "38px", borderRadius: "50%", background: "#8e44ad", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", flexShrink: 0 },
  modName: { margin: 0, fontWeight: "600", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  modRole: { margin: 0, fontSize: "0.72rem", color: "#9b59b6", fontWeight: "600" },
  noAccess: { color: "#888", fontSize: "0.82rem", textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "8px" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", background: "none", border: "none", color: "#bdc3c7", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "500", textAlign: "left", width: "100%" },
  navBtnActive: { background: "rgba(142,68,173,0.2)", color: "#fff", borderLeft: "3px solid #9b59b6" },
  navIcon: { fontSize: "1rem", width: "20px" },
  logoutBtn: { padding: "11px 14px", background: "rgba(142,68,173,0.1)", border: "1px solid rgba(142,68,173,0.3)", color: "#9b59b6", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" },
};
