import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { FiLock, FiKey, FiEye, FiEyeOff } from "react-icons/fi";

export default function ResetPassword() {
  const [form, setForm] = useState({ token: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordRules = [
    { label: "8–15 characters", test: (p) => p.length >= 8 && p.length <= 15 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const validatePassword = (p) => passwordRules.every((r) => r.test(p));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!validatePassword(form.newPassword)) {
      setError("Password must be 8–15 characters and include uppercase, lowercase, and a special character.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/reset-password", {
        token: form.token,
        newPassword: form.newPassword,
      });
      setMsg(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setError(e.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}><FiLock style={{ marginRight: 8 }} />Reset Password</h2>
        <p style={styles.subtitle}>Enter your reset token and choose a new password</p>

        {msg && <div style={styles.success}>{msg} Redirecting to login...</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Reset Token</label>
            <input style={styles.input} placeholder="Paste your reset token"
              value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} required />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>New Password</label>
            <div style={styles.passwordWrapper}>
              <input
                style={{ ...styles.input, paddingRight: "42px" }}
                placeholder="Enter new password"
                type={showPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {form.newPassword && (
              <div style={styles.pwHints}>
                {passwordRules.map((r, i) => (
                  <span key={i} style={{ ...styles.pwHint, color: r.test(form.newPassword) ? "#27ae60" : "#e74c3c" }}>
                    {r.test(form.newPassword) ? "✓" : "✗"} {r.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.passwordWrapper}>
              <input
                style={{ ...styles.input, paddingRight: "42px", borderColor: form.confirmPassword && form.newPassword !== form.confirmPassword ? "#e74c3c" : "#ddd" }}
                placeholder="Confirm new password"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <span style={styles.hint}>Passwords do not match</span>
            )}
          </div>

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p style={styles.bottomText}><Link to="/login">← Back to Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)", background: "#f0f2f5" },
  card: { background: "#fff", borderRadius: "12px", padding: "36px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" },
  title: { margin: "0 0 6px", fontSize: "1.4rem", color: "#2c3e50" },
  subtitle: { margin: "0 0 20px", color: "#888", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#555" },
  input: { padding: "10px 12px", fontSize: "1rem", borderRadius: "6px", border: "1px solid #ddd", outline: "none", width: "100%", boxSizing: "border-box" },
  passwordWrapper: { position: "relative" },
  eyeBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  hint: { fontSize: "0.78rem", color: "#e74c3c" },
  pwHints: { display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: "6px" },
  pwHint: { fontSize: "0.78rem", fontWeight: "500" },
  btn: { padding: "11px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", fontWeight: "600" },
  success: { background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.9rem" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.9rem" },
  bottomText: { textAlign: "center", marginTop: "20px", fontSize: "0.9rem" },
};
