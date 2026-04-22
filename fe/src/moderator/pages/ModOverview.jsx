import { useState, useEffect } from "react";
import ModAPI from "../modApi";

const SECTION_CARDS = {
  owners: [
    { label: "Total Owners",        key: "owners",           icon: "🏢", color: "#3498db" },
    { label: "Active Owners",       key: "unblockedOwners",  icon: "✅", color: "#27ae60" },
    { label: "Blocked Owners",      key: "blockedOwners",    icon: "🚫", color: "#e74c3c" },
    { label: "Allowed Bookings",    key: "allowedOwners",    icon: "🟢", color: "#1abc9c" },
    { label: "Restricted Owners",   key: "restrictedOwners", icon: "⛔", color: "#e67e22" },
  ],
  tenants: [
    { label: "Total Tenants",       key: "tenants",          icon: "👤", color: "#1abc9c" },
    { label: "Active Tenants",      key: "unblockedTenants", icon: "✅", color: "#27ae60" },
    { label: "Blocked Tenants",     key: "blockedTenants",   icon: "🚫", color: "#e74c3c" },
  ],
  flats: [
    { label: "Total Flats",         key: "flats",            icon: "🏠", color: "#9b59b6" },
    { label: "Rented Flats",        key: "rentedFlats",      icon: "🏷️", color: "#e67e22" },
  ],
  bookings: [
    { label: "Total Bookings",      key: "bookings",         icon: "📋", color: "#2c3e50" },
    { label: "Approved Bookings",   key: "approvedBookings", icon: "✅", color: "#27ae60" },
  ],
};

export default function ModOverview({ mod }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    ModAPI.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const hasPerm = (section) => mod?.permissions?.includes(`${section}:read`);

  const allowedSections = ["owners", "tenants", "flats", "bookings"].filter(hasPerm);

  const cards = allowedSections.flatMap((sec) => SECTION_CARDS[sec]);

  if (!stats) return <div style={s.loading}>Loading Stats...</div>;

  return (
    <div>
      <h2 style={s.title}>📊 Overview</h2>
      {/* <p style={s.sub}>Stats based on your assigned permissions</p> */}

      {allowedSections.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: "3rem" }}>🔒</span>
          <p style={{ color: "#888", marginTop: "12px" }}>No Permissions assigned. Contact Admin.</p>
        </div>
      ) : (
        <>
          {/* Permission summary */}
          <div style={s.permRow}>
            {allowedSections.map((sec) => (
              <span key={sec} style={s.permTag}>
                {{ owners: "🏢 Owners", tenants: "👤 Tenants", flats: "🏠 Flats", bookings: "📋 Bookings" }[sec]}
              </span>
            ))}
          </div>

          {/* Stat cards grouped by section */}
          {allowedSections.map((sec) => (
            <div key={sec} style={s.section}>
              <p style={s.sectionTitle}>
                {{ owners: "🏢 Owners", tenants: "👤 Tenants", flats: "🏠 Flats", bookings: "📋 Bookings" }[sec]}
              </p>
              <div style={s.grid}>
                {SECTION_CARDS[sec].map((c, i) => (
                  <div key={i} style={{ ...s.card, borderTop: `4px solid ${c.color}` }}>
                    <div style={{ ...s.iconWrap, background: `${c.color}18` }}>
                      <span style={s.icon}>{c.icon}</span>
                    </div>
                    <div>
                      <p style={s.val}>{stats[c.key] ?? 0}</p>
                      <p style={s.lbl}>{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const s = {
  loading: { padding: "40px", color: "#888", textAlign: "center" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: "0 0 20px", color: "#888", fontSize: "0.9rem" },
  empty: { textAlign: "center", padding: "60px 0" },
  permRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" },
  permTag: { background: "rgba(142,68,173,0.1)", color: "#8e44ad", border: "1px solid rgba(142,68,173,0.25)", borderRadius: "20px", padding: "4px 14px", fontSize: "0.82rem", fontWeight: "600" },
  section: { marginBottom: "28px" },
  sectionTitle: { margin: "0 0 12px", fontSize: "0.85rem", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "16px" },
  iconWrap: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { fontSize: "1.4rem" },
  val: { margin: 0, fontSize: "1.8rem", fontWeight: "700", color: "#2c3e50" },
  lbl: { margin: 0, fontSize: "0.78rem", color: "#888", fontWeight: "500" },
};
