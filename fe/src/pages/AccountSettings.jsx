import { useState, useCallback, useEffect } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { FiUser, FiLock, FiKey, FiEye, FiEyeOff, FiImage, FiEdit2, FiUpload, FiSearch, FiAlertCircle, FiArrowLeft, FiCheck, FiX, FiPhone } from "react-icons/fi";

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("avatar");

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000/uploads/${user.avatar}`
    : null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.avatarWrap}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" style={styles.avatarImg} />
              : <div style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase()}</div>}
          </div>
          <div>
            <h2 style={styles.userName}>{user?.name}</h2>
            <p style={styles.userEmail}>{user?.email}</p>
            <span style={styles.userRole}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
          </div>
        </div>

        <div style={styles.tabs}>
          {[
            { key: "avatar",   label: "Profile Picture",  icon: <FiImage size={14} /> },
            { key: "name",     label: "Edit Name",         icon: <FiEdit2 size={14} /> },
            { key: "phone",    label: "Phone Number",      icon: <FiPhone size={14} /> },
            { key: "password", label: "Change Password",   icon: <FiLock size={14} /> },
          ].map((t) => (
            <button key={t.key} style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(t.key)}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>{t.icon} {t.label}</span>
            </button>
          ))}
        </div>

        <div style={styles.body}>
          {activeTab === "avatar"   && <AvatarSection user={user} updateUser={updateUser} />}
          {activeTab === "name"     && <NameSection user={user} updateUser={updateUser} />}
          {activeTab === "phone"    && <PhoneSection user={user} updateUser={updateUser} />}
          {activeTab === "password" && <PasswordSection />}
        </div>
      </div>
    </div>
  );
}

/* ── Avatar Section ── */
function AvatarSection({ user, updateUser }) {
  const [rawSrc, setRawSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [croppedPreview, setCroppedPreview] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [croppingDone, setCroppingDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_, area) => setCroppedArea(area), []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRawSrc(URL.createObjectURL(file));
    setCroppingDone(false); setCroppedPreview(null); setCroppedBlob(null);
    setCrop({ x: 0, y: 0 }); setZoom(1);
  };

  const applyCrop = async () => {
    if (!rawSrc || !croppedArea) return;
    const blob = await getCroppedImg(rawSrc, croppedArea);
    setCroppedBlob(blob);
    setCroppedPreview(URL.createObjectURL(blob));
    setCroppingDone(true);
  };

  const handleSave = async () => {
    if (!croppedBlob) { setError("Please crop the image first"); return; }
    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg");
      const { data } = await API.put("/auth/update-profile", formData, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser({ avatar: data.avatar });
      toast.success("Profile picture updated!");
      setRawSrc(null); setCroppingDone(false); setCroppedPreview(null); setCroppedBlob(null);
    } catch { setError("Failed to upload picture"); }
    finally { setLoading(false); }
  };

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000/uploads/${user.avatar}`
    : null;

  return (
    <div style={styles.section}>
      {error && <div style={styles.errorBox}>{error}</div>}
      {!rawSrc ? (
        <>
          <div style={styles.previewCircle}>
            {avatarSrc
              ? <img src={avatarSrc} alt="current" style={styles.previewImg} />
              : <div style={styles.previewInitial}>{user?.name?.[0]?.toUpperCase()}</div>}
          </div>
          <label style={styles.uploadLabel}>
            <FiUpload size={14} style={{ marginRight: 6 }} /> Choose Image
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </label>
        </>
      ) : !croppingDone ? (
        <>
          <div style={styles.cropContainer}>
            <Cropper image={rawSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round"
              showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={styles.zoomRow}>
            <span style={styles.zoomLabel}>🔍 Zoom</span>
            <input type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
          </div>
          <div style={styles.btnRow}>
            <button style={styles.secondaryBtn} onClick={() => setRawSrc(null)}><FiArrowLeft size={14} style={{ marginRight: 4 }} /> Back</button>
            <button style={styles.primaryBtn} onClick={applyCrop}>Crop & Preview</button>
          </div>
        </>
      ) : (
        <>
          <img src={croppedPreview} alt="cropped" style={styles.croppedPreview} />
          <div style={styles.btnRow}>
            <button style={styles.secondaryBtn} onClick={() => setCroppingDone(false)}><FiArrowLeft size={14} style={{ marginRight: 4 }} /> Re-crop</button>
            <button style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSave} disabled={loading}>
              {loading ? "Uploading..." : <><FiCheck size={14} style={{ marginRight: 4 }} /> Save Picture</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Name Section ── */
function NameSection({ user, updateUser }) {
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      const { data } = await API.put("/auth/update-profile", formData);
      updateUser({ name: data.name });
      toast.success("Name updated successfully!");
    } catch { setError("Failed to update name"); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.section}>
      {error && <div style={styles.errorBox}>{error}</div>}
      <div style={styles.group}>
        <label style={styles.label}>Full Name</label>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}><FiUser size={15} /></span>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter new name" />
        </div>
      </div>
      <button style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Name"}
      </button>
    </div>
  );
}

/* ── Phone Section ── */
function PhoneSection({ user, updateUser }) {
  const [currentPhone, setCurrentPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/auth/me").then(({ data }) => setCurrentPhone(data.phone || "")).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!newPhone.trim()) { setError("New phone number cannot be empty"); return; }
    if (!/^[0-9]{10}$/.test(newPhone.trim())) { setError("Enter a valid 10-digit phone number"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await API.put("/auth/update-phone", { phone: "+91" + newPhone.trim() });
      updateUser({ phone: "+91" + newPhone.trim() });
      setCurrentPhone("+91" + newPhone.trim());
      toast.success("Phone number updated!");
      setNewPhone("");
    } catch { setError("Failed to update phone number"); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.section}>
      {error && <div style={styles.errorBox}>{error}</div>}
      <div style={styles.group}>
        <label style={styles.label}>Current Phone Number</label>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}><FiPhone size={15} /></span>
          <input style={{ ...styles.input, background: "#f0f2f5", color: "#888", cursor: "not-allowed" }} value={currentPhone ? (currentPhone.startsWith("+91") ? "+91 " + currentPhone.slice(3) : "+91 " + currentPhone) : ""} readOnly placeholder="No phone number set" />
        </div>
      </div>
      <div style={styles.group}>
        <label style={styles.label}>New Phone Number</label>
        <div style={styles.inputWrapper}>
          <input style={{ ...styles.input, paddingLeft: "12px" }} value={newPhone ? "+91 " + newPhone : ""} onChange={(e) => setNewPhone(e.target.value.replace(/^\+91\s?/, "").replace(/\D/g, ""))} placeholder="Enter 10-digit number" maxLength={14} />
        </div>
      </div>
      <button style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Phone Number"}
      </button>
    </div>
  );
}

/* ── Password Section ── */
function PasswordSection() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRules = [
    { label: "8–15 characters", test: (p) => p.length >= 8 && p.length <= 15 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const validatePassword = (p) => passwordRules.every((r) => r.test(p));

  const isSameAsCurrent = form.newPassword.length > 0 && form.currentPassword.length > 0 && form.newPassword === form.currentPassword;
  const isConfirmMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSave = async () => {
    setError("");
    if (isSameAsCurrent) { setError("New password cannot be the same as your current password."); return; }
    if (form.newPassword !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!validatePassword(form.newPassword)) { setError("Password must be 8–15 characters and include uppercase, lowercase, and a special character."); return; }
    setLoading(true);
    try {
      await API.put("/auth/change-password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success("Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) { setError(e.response?.data?.message || "Failed to change password"); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.section}>
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.group}>
        <label style={styles.label}>Current Password</label>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}><FiLock size={15} /></span>
          <input style={{ ...styles.input, paddingRight: "42px" }} type={show.current ? "text" : "password"}
            placeholder="Existing Password" value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          <button type="button" style={styles.eyeBtn} onClick={() => setShow({ ...show, current: !show.current })}>
            {show.current ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>New Password</label>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}><FiKey size={15} /></span>
          <input style={{ ...styles.input, paddingRight: "42px", borderColor: isSameAsCurrent ? "#e74c3c" : "#e0e0e0" }} type={show.new ? "text" : "password"}
            placeholder="New Password" value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <button type="button" style={styles.eyeBtn} onClick={() => setShow({ ...show, new: !show.new })}>
            {show.new ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        {isSameAsCurrent && (
          <span style={{ fontSize: "0.78rem", color: "#e74c3c", fontWeight: "600", display: "flex", alignItems: "center", gap: 4 }}><FiAlertCircle size={13} /> New password cannot be the same as your current password.</span>
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

      <div style={styles.group}>
        <label style={styles.label}>Confirm New Password</label>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}><FiKey size={15} /></span>
          <input
            style={{ ...styles.input, paddingRight: "42px", borderColor: isConfirmMismatch ? "#e74c3c" : "#e0e0e0" }}
            type={show.confirm ? "text" : "password"} placeholder="Confirm Password" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <button type="button" style={styles.eyeBtn} onClick={() => setShow({ ...show, confirm: !show.confirm })}>
            {show.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        {isConfirmMismatch && (
          <span style={{ fontSize: "0.78rem", color: "#e74c3c" }}>Passwords do not match</span>
        )}
      </div>

      <button style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSave} disabled={loading}>
        {loading ? "Updating" : "Update Password"}
      </button>
    </div>
  );
}

/* ── Crop helper ── */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  canvas.getContext("2d").drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

const styles = {
  page: { minHeight: "calc(100vh - 60px)", background: "#f0f2f5", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px" },
  container: { background: "#fff", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", width: "100%", maxWidth: "520px", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", gap: "16px", padding: "28px 32px", background: "linear-gradient(135deg, #1a252f, #2c3e50)" },
  avatarWrap: { flexShrink: 0 },
  avatarImg: { width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "3px solid #1abc9c" },
  avatarInitial: { width: "64px", height: "64px", borderRadius: "50%", background: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "1.6rem" },
  userName: { margin: "0 0 2px", color: "#fff", fontSize: "1.1rem", fontWeight: "700" },
  userEmail: { margin: "0 0 6px", color: "#bdc3c7", fontSize: "0.85rem" },
  userRole: { background: "rgba(26,188,156,0.2)", color: "#1abc9c", padding: "2px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "600" },
  tabs: { display: "flex", borderBottom: "1px solid #f0f0f0" },
  tab: { flex: 1, padding: "14px 8px", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", color: "#888", borderBottom: "2px solid transparent" },
  tabActive: { color: "#2c3e50", borderBottom: "2px solid #1abc9c" },
  body: { padding: "28px 32px" },
  section: { display: "flex", flexDirection: "column", gap: "16px", alignItems: "stretch" },
  group: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", fontSize: "0.95rem", pointerEvents: "none" },
  input: { width: "100%", padding: "11px 12px 11px 38px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", background: "#fafafa" },
  eyeBtn: { position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  pwHints: { display: "flex", flexWrap: "wrap", gap: "6px 12px" },
  pwHint: { fontSize: "0.78rem", fontWeight: "500" },
  primaryBtn: { padding: "12px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", width: "100%" },
  secondaryBtn: { padding: "12px", background: "#f0f2f5", color: "#555", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600", flex: 1 },
  btnRow: { display: "flex", gap: "10px", width: "100%" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", fontSize: "0.9rem" },
  previewCircle: { width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", border: "3px solid #1abc9c", alignSelf: "center" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  previewInitial: { width: "100%", height: "100%", background: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "2rem" },
  uploadLabel: { padding: "9px 20px", background: "#f0f2f5", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", alignSelf: "center" },
  cropContainer: { position: "relative", width: "100%", height: "260px", background: "#111", borderRadius: "10px", overflow: "hidden" },
  zoomRow: { display: "flex", alignItems: "center", gap: "10px", width: "100%" },
  zoomLabel: { fontSize: "0.85rem", color: "#555", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 },
  croppedPreview: { width: "110px", height: "110px", borderRadius: "50%", objectFit: "cover", border: "3px solid #1abc9c", alignSelf: "center" },
};
