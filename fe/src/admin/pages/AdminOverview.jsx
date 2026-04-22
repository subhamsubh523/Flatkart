import { useState, useEffect } from "react";
import AdminAPI from "../adminApi";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    AdminAPI.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return <div style={s.loading}>Loading stats...</div>;

  const cards = [
    { label: "Total Owners",         value: stats.owners            ?? 0, icon: "🏢", color: "#3498db" },
    { label: "Active Owners",        value: stats.unblockedOwners   ?? 0, icon: "✅", color: "#27ae60" },
    { label: "Blocked Owners",       value: stats.blockedOwners     ?? 0, icon: "🚫", color: "#e74c3c" },
    { label: "Total Tenants",        value: stats.tenants           ?? 0, icon: "👤", color: "#1abc9c" },
    { label: "Active Tenants",       value: stats.unblockedTenants  ?? 0, icon: "✅", color: "#27ae60" },
    { label: "Blocked Tenants",      value: stats.blockedTenants    ?? 0, icon: "🚫", color: "#e74c3c" },
    { label: "Total Flats",          value: stats.flats             ?? 0, icon: "🏠", color: "#9b59b6" },
    { label: "Rented Flats",         value: stats.rentedFlats       ?? 0, icon: "🏷️", color: "#e67e22" },
    { label: "Total Bookings",       value: stats.bookings          ?? 0, icon: "📋", color: "#2c3e50" },
    { label: "Allowed Bookings",     value: stats.allowedOwners     ?? 0, icon: "🟢", color: "#1abc9c" },
    { label: "Restricted Bookings",  value: stats.restrictedOwners  ?? 0, icon: "🚫", color: "#e74c3c" },
  ];

  return (
    <div>
      <h2 style={s.title}>📊 Dashboard Overview</h2>
      <p style={s.sub}>Real-time platform statistics</p>
      <div style={s.grid}>
        {cards.map((c, i) => (
          <div key={i} style={{ ...s.card, borderTop: `4px solid ${c.color}` }}>
            <div style={{ ...s.iconWrap, background: `${c.color}18` }}>
              <span style={s.icon}>{c.icon}</span>
            </div>
            <div>
              <p style={s.cardVal}>{c.value ?? 0}</p>
              <p style={s.cardLabel}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  loading: { padding: "40px", color: "#888", textAlign: "center" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: "0 0 28px", color: "#888", fontSize: "0.9rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" },
  card: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "16px" },
  iconWrap: { width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { fontSize: "1.5rem" },
  cardVal: { margin: 0, fontSize: "1.8rem", fontWeight: "700", color: "#2c3e50" },
  cardLabel: { margin: 0, fontSize: "0.8rem", color: "#888", fontWeight: "500" },
};
