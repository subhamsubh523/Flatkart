import { useState } from "react";
import AdminLogin from "./pages/AdminLogin";
import AdminSidebar from "./components/AdminSidebar";
import AdminOverview from "./pages/AdminOverview";
import AdminOwners from "./pages/AdminOwners";
import AdminTenants from "./pages/AdminTenants";
import AdminFlats from "./pages/AdminFlats";
import AdminBookings from "./pages/AdminBookings";
import AdminModerators from "./pages/AdminModerators";
import AdminProfile from "./pages/AdminProfile";

export default function AdminApp() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adminUser")); } catch { return null; }
  });
  const [active, setActive] = useState("overview");

  const handleLogin = (adminData) => { setAdmin(adminData); setActive("overview"); };
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
  };
  const handleProfileUpdate = (updated) => setAdmin(updated);

  if (!admin) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      <AdminSidebar active={active} setActive={setActive} admin={admin} onLogout={handleLogout} />
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {active === "overview"   && <AdminOverview />}
        {active === "owners"     && <AdminOwners />}
        {active === "tenants"    && <AdminTenants />}
        {active === "flats"      && <AdminFlats />}
        {active === "bookings"   && <AdminBookings />}
        {active === "moderators" && <AdminModerators />}
        {active === "profile"    && <AdminProfile admin={admin} onUpdate={handleProfileUpdate} />}
      </main>
    </div>
  );
}
