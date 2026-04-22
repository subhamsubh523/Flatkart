import { useState } from "react";
import ModLogin from "./pages/ModLogin";
import ModSidebar from "./components/ModSidebar";
import ModOverview from "./pages/ModOverview";
import ModOwners from "./pages/ModOwners";
import ModTenants from "./pages/ModTenants";
import ModFlats from "./pages/ModFlats";
import ModBookings from "./pages/ModBookings";

const TAB_PERM = {
  overview: "overview:read",
  owners:   "owners:read",
  tenants:  "tenants:read",
  flats:    "flats:read",
  bookings: "bookings:read",
};

export default function ModeratorApp() {
  const [mod, setMod] = useState(() => {
    try { return JSON.parse(localStorage.getItem("modUser")); } catch { return null; }
  });

  const defaultTab = () => "overview";

  const [active, setActive] = useState("overview");

  const handleLogin = (modData) => { setMod(modData); setActive("overview"); };

  const handleLogout = () => {
    localStorage.removeItem("modToken");
    localStorage.removeItem("modUser");
    setMod(null);
  };

  if (!mod) return <ModLogin onLogin={handleLogin} />;

  const has = (p) => mod.permissions?.includes(p);

  const pages = {
    overview: <ModOverview mod={mod} />,
    owners:   <ModOwners mod={mod} />,
    tenants:  <ModTenants mod={mod} />,
    flats:    <ModFlats mod={mod} />,
    bookings: <ModBookings mod={mod} />,
  };

  const canView = active === "overview" || has(TAB_PERM[active]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      <ModSidebar active={active} setActive={setActive} mod={mod} onLogout={handleLogout} />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {canView ? pages[active] : (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "3rem" }}>🚫</p>
            <p style={{ color: "#888", fontSize: "1rem" }}>You don't have permission to access this section.</p>
            <p style={{ color: "#bbb", fontSize: "0.88rem" }}>Contact your admin to request access.</p>
          </div>
        )}
      </main>
    </div>
  );
}
