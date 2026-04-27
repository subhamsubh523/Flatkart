import { useState, useEffect } from "react";
import AdminAPI from "../adminApi";
import { FiBriefcase, FiCheckCircle, FiSlash, FiUsers, FiHome, FiTag, FiList, FiUnlock, FiAlertOctagon, FiBarChart2, FiEye, FiEyeOff } from "react-icons/fi";

const SECTION_ICONS = {
  owners:   <FiBriefcase size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />,
  tenants:  <FiUsers size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />,
  flats:    <FiHome size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />,
  bookings: <FiList size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />,
};

const SECTION_LABELS = { owners: "Owners", tenants: "Tenants", flats: "Flats", bookings: "Bookings" };

const SECTION_CARDS = {
  owners: [
    { label: "Total Owners",        key: "owners",           icon: <FiBriefcase size={22} />,    color: "#3498db" },
    { label: "Active Owners",       key: "unblockedOwners",  icon: <FiCheckCircle size={22} />,  color: "#27ae60" },
    { label: "Blocked Owners",      key: "blockedOwners",    icon: <FiSlash size={22} />,        color: "#e74c3c" },
    { label: "Allowed Bookings",    key: "allowedOwners",    icon: <FiUnlock size={22} />,       color: "#1abc9c" },
    { label: "Restricted Bookings", key: "restrictedOwners", icon: <FiAlertOctagon size={22} />, color: "#e67e22" },
  ],
  tenants: [
    { label: "Total Tenants",       key: "tenants",          icon: <FiUsers size={22} />,        color: "#1abc9c" },
    { label: "Active Tenants",      key: "unblockedTenants", icon: <FiCheckCircle size={22} />,  color: "#27ae60" },
    { label: "Blocked Tenants",     key: "blockedTenants",   icon: <FiSlash size={22} />,        color: "#e74c3c" },
  ],
  flats: [
    { label: "Total Flats",         key: "flats",       icon: <FiHome size={22} />,         color: "#9b59b6" },
    { label: "Active Flats",        key: "activeFlats", icon: <FiEye size={22} />,          color: "#27ae60" },
    { label: "Hidden Flats",        key: "hiddenFlats", icon: <FiEyeOff size={22} />,       color: "#636e72" },
    { label: "Rented Flats",        key: "rentedFlats", icon: <FiTag size={22} />,          color: "#e67e22" },
  ],
  bookings: [
    { label: "Total Bookings",      key: "bookings",         icon: <FiList size={22} />,         color: "#2c3e50" },
    { label: "Allowed Bookings",    key: "allowedOwners",    icon: <FiUnlock size={22} />,       color: "#1abc9c" },
    { label: "Restricted Bookings", key: "restrictedOwners", icon: <FiAlertOctagon size={22} />, color: "#e74c3c" },
  ],
};

const SECTIONS = ["owners", "tenants", "flats", "bookings"];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    AdminAPI.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return <div style={s.loading}>Loading stats...</div>;

  return (
    <div>
      <h2 style={{ ...s.title, display: "flex", alignItems: "center", gap: "8px" }}>
        <FiBarChart2 size={22} color="#2c3e50" />Overview
      </h2>
      <p style={s.sub}>Real-time platform statistics</p>

      {/* Section summary tags */}
      <div style={s.permRow}>
        {SECTIONS.map((sec) => (
          <span key={sec} style={s.permTag}>
            {SECTION_ICONS[sec]}{SECTION_LABELS[sec]}
          </span>
        ))}
      </div>

      {/* Categorized stat cards */}
      {SECTIONS.map((sec) => (
        <div key={sec} style={s.section}>
          <p style={s.sectionTitle}>
            {SECTION_ICONS[sec]}{SECTION_LABELS[sec]}
          </p>
          <div style={s.grid}>
            {SECTION_CARDS[sec].map((c, i) => (
              <div key={i} className="overview-card" style={{ ...s.card, borderTop: `4px solid ${c.color}` }}>
                <div style={{ ...s.iconWrap, background: `${c.color}18`, color: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <p style={s.cardVal}>{stats[c.key] ?? 0}</p>
                  <p style={s.cardLabel}>{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  loading: { padding: "40px", color: "#888", textAlign: "center" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: "0 0 20px", color: "#888", fontSize: "0.9rem" },
  permRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" },
  permTag: { background: "rgba(231,76,60,0.08)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.25)", borderRadius: "20px", padding: "4px 14px", fontSize: "0.82rem", fontWeight: "600" },
  section: { marginBottom: "28px" },
  sectionTitle: { margin: "0 0 12px", fontSize: "0.85rem", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" },
  iconWrap: { width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardVal: { margin: 0, fontSize: "1.8rem", fontWeight: "700", color: "#2c3e50" },
  cardLabel: { margin: 0, fontSize: "0.8rem", color: "#888", fontWeight: "500" },
};
