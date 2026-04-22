import { useState } from "react";
import { FiSettings, FiUser, FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiSave } from "react-icons/fi";
import AdminAPI from "../adminApi";

export default function AdminProfile({ admin, onUpdate }) {
  const [form, setForm] = useState({ name: admin?.name || "", email: admin?.email || "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match"); return;
    }
    if (form.newPassword && form.newPassword.length < 6) {
      setError("New password must be at least 6 characters"); return;
    }
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.newPassword) { payload.currentPassword = form.currentPassword; payload.newPassword = form.newPassword; }
      const { data } = await AdminAPI.put("/profile", payload);
      const updated = { ...admin, name: data.name, email: data.email };
      localStorage.setItem("adminUser", JSON.stringify(updated));
      onUpdate(updated);
      setSuccess("Profile updated successfully!");
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={s.title}><FiSettings style={{ marginRight: "8px", verticalAlign: "middle" }} />My Profile</h2>
      <p style={s.sub}>Update your admin account details</p>

      <div style={s.card}>
        {success && <div style={s.successBox}><FiCheckCircle style={{ marginRight: "6px", verticalAlign: "middle" }} />{success}</div>}
        {error && <div style={s.errorBox}><FiAlertCircle style={{ marginRight: "6px", verticalAlign: "middle" }} />{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Basic Info */}
          <div style={s.section}>
            <p style={s.sectionTitle}><FiUser style={{ marginRight: "6px", verticalAlign: "middle" }} />Basic Information</p>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>Full Name</label>
                <input style={s.input} placeholder="Enter name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={s.group}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" placeholder="admin@flatkart.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div style={s.section}>
            <p style={s.sectionTitle}><FiLock style={{ marginRight: "6px", verticalAlign: "middle" }} />Change Password <span style={s.optional}></span></p>
            <div style={s.group}>
              <label style={s.label}>Current Password</label>
              <div style={s.pwdWrap}>
                <input style={s.input} type={showCur ? "text" : "password"} placeholder="Enter current password"
                  value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
                <button type="button" style={s.eye} onClick={() => setShowCur(!showCur)}>{showCur ? <FiEyeOff /> : <FiEye />}</button>
              </div>
            </div>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>New Password</label>
                <div style={s.pwdWrap}>
                  <input style={s.input} type={showNew ? "text" : "password"} placeholder="Enter new password"
                    value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                  <button type="button" style={s.eye} onClick={() => setShowNew(!showNew)}>{showNew ? <FiEyeOff /> : <FiEye />}</button>
                </div>
              </div>
              <div style={s.group}>
                <label style={s.label}>Confirm New Password</label>
                <div style={s.pwdWrap}>
                  <input
                    style={{ ...s.input, borderColor: form.confirmPassword && form.newPassword !== form.confirmPassword ? "#e74c3c" : "#e0e0e0" }}
                    type={showCon ? "text" : "password"} placeholder="Confirm new password"
                    value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                  <button type="button" style={s.eye} onClick={() => setShowCon(!showCon)}>{showCon ? <FiEyeOff /> : <FiEye />}</button>
                </div>
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <span style={{ fontSize: "0.78rem", color: "#e74c3c" }}>Passwords do not match</span>
                )}
              </div>
            </div>
          </div>

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Saving..." : <><FiSave style={{ marginRight: "6px", verticalAlign: "middle" }} />Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: "0 0 28px", color: "#888", fontSize: "0.9rem" },
  card: { background: "#fff", borderRadius: "14px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", maxWidth: "700px" },
  successBox: { background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "8px", padding: "10px 14px", marginBottom: "20px", fontSize: "0.9rem" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", marginBottom: "20px", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  section: { display: "flex", flexDirection: "column", gap: "14px" },
  sectionTitle: { margin: 0, fontWeight: "700", fontSize: "0.9rem", color: "#2c3e50", borderBottom: "2px solid #f0f2f5", paddingBottom: "8px" },
  optional: { fontWeight: "400", color: "#aaa", fontSize: "0.82rem" },
  row: { display: "flex", gap: "16px", flexWrap: "wrap" },
  group: { display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "200px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  input: { padding: "10px 14px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", background: "#fafafa", width: "100%", boxSizing: "border-box" },
  pwdWrap: { position: "relative" },
  eye: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  btn: { padding: "12px 28px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.97rem", alignSelf: "flex-start" },
};
