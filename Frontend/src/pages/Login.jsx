import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiSearch, FiCalendar, FiMessageSquare, FiStar, FiList, FiBarChart2, FiCheckSquare } from "react-icons/fi";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "tenant" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isOwner = form.role === "owner";
  const accent = isOwner ? "#f39c12" : "#1abc9c";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", form);
      login(data.token, data.user);
      toast.success("Login Successful! Welcome back 👋");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left Panel */}
      <div style={{ ...styles.left, background: isOwner ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" : "linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)" }}>
        <div style={styles.leftContent}>
          <h1 style={{ ...styles.brand, color: accent }}>🏠 FLATKART</h1>
          {isOwner ? (
            <>
              <h2 style={styles.leftTitle}>Welcome back, <span style={{ color: "#f1c40f" }}>Owner!</span></h2>
              <p style={styles.leftSub}>Log in to manage your listings, track bookings, and chat with tenants.</p>
              <div style={styles.features}>
                {[
                  { icon: <FiList size={15} />, text: "Manage your listings" },
                  { icon: <FiCalendar size={15} />, text: "Track bookings" },
                  { icon: <FiMessageSquare size={15} />, text: "Chat with tenants" },
                  { icon: <FiBarChart2 size={15} />, text: "Owner dashboard" },
                ].map((f, i) => (
                  <div key={i} style={{ ...styles.featureItem, borderLeft: "3px solid #f1c40f" }}>
                    <span style={{ color: "#f1c40f", display: "flex" }}>{f.icon}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 style={styles.leftTitle}>Welcome Back, <span style={{ color: "#1abc9c" }}>Tenant!</span></h2>
              <p style={styles.leftSub}>Log in to explore thousands of verified flats and connect with owners instantly.</p>
              <div style={styles.features}>
                {[
                  { icon: <FiSearch size={15} />, text: "Smart flat search" },
                  { icon: <FiCalendar size={15} />, text: "Instant booking" },
                  { icon: <FiMessageSquare size={15} />, text: "Live chat with owners" },
                  { icon: <FiStar size={15} />, text: "Verified reviews" },
                ].map((f, i) => (
                  <div key={i} style={styles.featureItem}>
                    <span style={{ color: "#1abc9c", display: "flex" }}>{f.icon}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Sign In</h2>
            <p style={styles.subtitle}>Enter your credentials to continue</p>
          </div>

          <div style={styles.roleToggle}>
            <button type="button"
              style={{ ...styles.roleBtn, ...(form.role === "tenant" ? styles.roleBtnActive : {}) }}
              onClick={() => setForm({ ...form, role: "tenant" })}>
              🏠 Tenant
            </button>
            <button type="button"
              style={{ ...styles.roleBtn, ...(form.role === "owner" ? styles.roleBtnOwnerActive : {}) }}
              onClick={() => setForm({ ...form, role: "owner" })}>
              🏢 Owner
            </button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <FiAlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.group}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}><FiMail size={15} /></span>
                <input style={styles.input} placeholder="Email" type="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div style={styles.group}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}><FiLock size={15} /></span>
                <input
                  style={{ ...styles.input, paddingRight: "42px" }}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button style={{ ...styles.btn, opacity: loading ? 0.75 : 1, background: isOwner ? "linear-gradient(135deg, #f1c40f, #f39c12)" : "linear-gradient(135deg, #1abc9c, #16a085)", color: isOwner ? "#1a252f" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} type="submit" disabled={loading}>
              {loading && <Spinner size={18} color={isOwner ? "#1a252f" : "#fff"} />}
              {loading ? "Signing In, Please Wait" : "Sign In"}
            </button>
          </form>

          <br></br>

          <div style={styles.dividerRow}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          <Link to="/register" style={styles.registerBtn}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "calc(100vh - 60px)" },
  left: { flex: 1, background: "linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", "@media(max-width:768px)": { display: "none" } },
  leftContent: { maxWidth: "400px" },
  brand: { color: "#1abc9c", fontSize: "1.5rem", margin: "0 0 32px", fontWeight: "800" },
  leftTitle: { color: "#fff", fontSize: "2rem", margin: "0 0 12px", lineHeight: 1.3 },
  leftSub: { color: "#bdc3c7", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 32px" },
  features: { display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: { display: "flex", alignItems: "center", gap: "10px", color: "#ecf0f1", fontSize: "0.95rem", background: "rgba(255,255,255,0.06)", padding: "10px 16px", borderRadius: "8px", borderLeft: "3px solid #1abc9c" },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", padding: "32px 24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" },
  cardHeader: { marginBottom: "24px" },
  title: { margin: "0 0 6px", fontSize: "1.7rem", color: "#2c3e50", fontWeight: "700" },
  subtitle: { margin: 0, color: "#888", fontSize: "0.92rem" },
  errorBox: { display: "flex", alignItems: "center", gap: "8px", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  group: { display: "flex", flexDirection: "column", gap: "7px" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  forgotLink: { fontSize: "0.82rem", color: "#1abc9c", textDecoration: "none" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", fontSize: "0.95rem", pointerEvents: "none" },
  input: { width: "100%", padding: "11px 12px 11px 38px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", background: "#fafafa" },
  eyeBtn: { position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  btn: { padding: "13px", background: "linear-gradient(135deg, #1abc9c, #16a085)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", letterSpacing: "0.3px", marginTop: "4px" },
  roleToggle: { display: "flex", background: "#f0f2f5", borderRadius: "10px", padding: "4px", marginBottom: "20px", gap: "4px" },
  roleBtn: { flex: 1, padding: "9px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600", background: "transparent", color: "#888" },
  roleBtnActive: { background: "#fff", color: "#1abc9c", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  roleBtnOwnerActive: { background: "#fff", color: "#f39c12", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  divider: { display: "flex", alignItems: "center", margin: "20px 0", gap: "12px" },
  dividerText: { color: "#ccc", fontSize: "0.85rem", background: "#fff", padding: "0 8px" },
  bottomText: { textAlign: "center", margin: 0, fontSize: "0.92rem", color: "#666" },
  link: { color: "#1abc9c", fontWeight: "600", textDecoration: "none" },
  dividerRow: { display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 16px" },
  dividerLine: { flex: 1, height: "1px", background: "#e0e0e0" },
  dividerText: { color: "#aaa", fontSize: "0.82rem", fontWeight: "500" },
  registerBtn: { display: "block", textAlign: "center", padding: "13px", background: "linear-gradient(135deg, #2c3e50, #1a252f)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", letterSpacing: "0.3px", textDecoration: "none" },
};
