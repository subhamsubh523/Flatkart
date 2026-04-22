import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import FlatDetail from "./pages/FlatDetail";
import Flats from "./pages/Flats";
import MyBookings from "./pages/MyBookings";
import OwnerBookings from "./pages/OwnerBookings";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import AccountSettings from "./pages/AccountSettings";
import AdminApp from "./admin/AdminApp";
import ModeratorApp from "./moderator/ModeratorApp";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function OwnerRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== "owner") return <Navigate to="/" />;
  return children;
}

function TenantRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== "tenant") return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Toaster position="top-right" toastOptions={{ duration: 1500, style: { borderRadius: "10px", fontWeight: "600" } }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/flat/:id" element={<FlatDetail />} />
        <Route path="/flats" element={<Flats />} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<Navigate to="/account-settings" replace />} />
        <Route path="/account-settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />

        {/* Owner only */}
        <Route path="/dashboard" element={<OwnerRoute><Dashboard /></OwnerRoute>} />
        <Route path="/owner-bookings" element={<OwnerRoute><OwnerBookings /></OwnerRoute>} />

        {/* Tenant only */}
        <Route path="/my-bookings" element={<TenantRoute><MyBookings /></TenantRoute>} />

        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin panel — no Navbar/Footer */}
          <Route path="/admin/*" element={<AdminApp />} />
          {/* Moderator panel — no Navbar/Footer */}
          <Route path="/moderator/*" element={<ModeratorApp />} />
          {/* 404 — no Navbar/Footer */}
          <Route path="/404" element={<NotFound />} />
          {/* Main app */}
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
