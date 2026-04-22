import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiTool } from "react-icons/fi";
import ModAPI from "../modApi";

export default function ModLogin({ onLogin }) {
  const [form, setForm] = useState({ emailPrefix: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await ModAPI.post("/moderator-login", { email: `${form.emailPrefix}@flatkart.com`, password: form.password });
      localStorage.setItem("modToken", data.token);
      localStorage.setItem("modUser", JSON.stringify(data.moderator));
      onLogin(data.moderator);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <FiTool size={28} color="#8e44ad" />
          <div>
            <h1 style={s.logoText}>FLATKART <span style={s.logoMod}>MODERATOR</span></h1>
          </div>
        </div>

        <h2 style={s.title}>Moderator Login</h2>
        <p style={s.sub}>Use your moderator credentials to continue</p>

        {error && (
          <div style={s.error}>
            <FiAlertCircle size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.group}>
            <label style={s.label}>Moderator Address</label>
            <div style={s.inputWrap}>
              <FiMail size={15} style={s.inputIcon} />
              <input style={{ ...s.input, paddingRight: "120px" }} type="text" placeholder="Moderator ID"
                value={form.emailPrefix} onChange={(e) => setForm({ ...form, emailPrefix: e.target.value })} required />
              <span style={s.emailSuffix}>@flatkart.com</span>
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <FiLock size={15} style={s.inputIcon} />
              <input style={{ ...s.input, paddingRight: "42px" }} type={showPass ? "text" : "password"}
                placeholder="Moderator Password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Signing" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "48px 40px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  logoWrap: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", justifyContent: "center" },
  logoText: { fontSize: "1.4rem", fontWeight: "800", color: "#2c3e50", margin: 0 },
  logoMod: { color: "#8e44ad" },
  title: { margin: "0 0 6px", fontSize: "1.6rem", color: "#2c3e50", fontWeight: "700", textAlign: "center" },
  sub: { margin: "0 0 24px", color: "#888", fontSize: "0.9rem", textAlign: "center" },
  error: { display: "flex", alignItems: "center", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", color: "#aaa", pointerEvents: "none" },
  input: { width: "100%", padding: "11px 12px 11px 38px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", background: "#fafafa" },
  eyeBtn: { position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", padding: 0 },
  emailSuffix: { position: "absolute", right: "12px", fontSize: "0.88rem", color: "#2c3e50", fontWeight: "600", pointerEvents: "none", whiteSpace: "nowrap" },
  btn: { padding: "13px", background: "linear-gradient(135deg,#8e44ad,#6c3483)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", marginTop: "4px" },
  hint: { textAlign: "center", margin: "20px 0 0", fontSize: "0.82rem", color: "#aaa" },
};
