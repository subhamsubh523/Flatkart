import { useState } from "react";
import API from "../api";

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { label: "8–15 characters", test: (p) => p.length >= 8 && p.length <= 15 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const validatePassword = (p) => passwordRules.every((r) => r.test(p));

  const isSameAsCurrent = form.newPassword.length > 0 && form.currentPassword.length > 0 && form.newPassword === form.currentPassword;
  const isConfirmMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    if (isSameAsCurrent) { setError("New password cannot be the same as your current password."); return; }
    if (form.newPassword !== form.confirmPassword) { setError("New passwords do not match"); return; }
    if (!validatePassword(form.newPassword)) { setError("Password must be 8–15 characters and include uppercase, lowercase, and a special character."); return; }
    setLoading(true);
    try {
      const { data } = await API.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMsg(data.message);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔒 Change Password</h2>
        <p style={styles.subtitle}>Enter your current password and choose a new one</p>

        {msg && <div style={styles.success}>{msg}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Current Password */}
          <div style={styles.group}>
            <label style={styles.label}>Current Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                style={{ ...styles.input, paddingRight: "42px" }}
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={styles.group}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔑</span>
              <input
                style={{ ...styles.input, paddingRight: "42px", borderColor: isSameAsCurrent ? "#e74c3c" : "#e0e0e0" }}
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowNew(!showNew)}>
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>
            {isSameAsCurrent && (
              <span style={styles.hint}>⚠️ New password cannot be the same as your current password.</span>
            )}
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

          {/* Confirm New Password */}
          <div style={styles.group}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔑</span>
              <input
                style={{ ...styles.input, paddingRight: "42px", borderColor: isConfirmMismatch ? "#e74c3c" : "#e0e0e0" }}
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
            {isConfirmMismatch && (
              <span style={styles.hint}>Passwords do not match</span>
            )}
          </div>

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)", background: "#f0f2f5" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" },
  title: { margin: "0 0 6px", fontSize: "1.4rem", color: "#2c3e50", fontWeight: "700" },
  subtitle: { margin: "0 0 24px", color: "#888", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", fontSize: "0.95rem", pointerEvents: "none" },
  input: { width: "100%", padding: "11px 12px 11px 38px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", background: "#fafafa" },
  eyeBtn: { position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  hint: { fontSize: "0.78rem", color: "#e74c3c", fontWeight: "600" },
  pwHints: { display: "flex", flexWrap: "wrap", gap: "6px 12px" },
  pwHint: { fontSize: "0.78rem", fontWeight: "500" },
  btn: { padding: "13px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", marginTop: "4px" },
  success: { background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.9rem" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.9rem" },
};
