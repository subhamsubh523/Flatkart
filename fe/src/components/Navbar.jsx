import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import toast from "react-hot-toast";
import logo from "../assets/logo3.jpg";
import Cropper from "react-easy-crop";
import { FiHome, FiGrid, FiBookmark, FiMessageSquare, FiSettings, FiLogOut, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";

export default function Navbar() {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetch = () => API.get("/chat/unread-count").then(({ data }) => setUnreadCount(data.count)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path) => location.pathname === path;
  const linkStyle = (path) => ({ ...styles.link, ...(isActive(path) ? styles.activeLink : {}) });

  const avatarSrc = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000/uploads/${user.avatar}`) : null;

  const handleLogout = () => { logout(); setDropOpen(false); toast.success("Logged out successfully"); navigate("/login"); };

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/" style={styles.brand}>
          <img src={logo} alt="Flatkart" style={styles.logo} />
          <span style={styles.brandText}>FLAT<span style={{ color: user?.role === "owner" ? "#f1c40f" : "#1abc9c" }}>KART</span></span>
        </Link>

        <div style={styles.links}>
          <Link to="/" style={linkStyle("/")}>Home</Link>
          {user?.role !== "owner" && <Link to="/flats" style={linkStyle("/flats")}>Flats</Link>}
          {user?.role === "owner" && <Link to="/dashboard" style={linkStyle("/dashboard")}>Dashboard</Link>}
          {user?.role === "tenant" && <Link to="/my-bookings" style={linkStyle("/my-bookings")}>My Bookings</Link>}
          {user && (
            <Link to="/chat" style={{ ...linkStyle("/chat"), position: "relative" }}>
              Chat
              {unreadCount > 0 && (
                <span style={styles.chatBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </Link>
          )}        </div>

        <div style={styles.right}>
          {user ? (
            <div style={styles.profileArea} ref={dropRef}>
              {user && <span style={styles.greeting}>Hi, {user.name?.toUpperCase()}</span>}
              <button style={styles.avatarBtn} onClick={() => setDropOpen(!dropOpen)}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarInitial}>{user.name?.[0]?.toUpperCase() || "U"}</div>
                )}
                <span style={styles.chevron}>{dropOpen ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}</span>
              </button>

              {dropOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropHeader}>
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="avatar" style={styles.dropAvatar} />
                    ) : (
                      <div style={{ ...styles.dropAvatar, background: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={styles.dropName}>{user.name}</p>
                      <p style={styles.dropEmail}>{user.email}</p>
                      <span style={styles.dropRole}>{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</span>
                    </div>
                  </div>
                  <hr style={styles.divider} />
                  <button style={styles.dropItem} onClick={() => { setDropOpen(false); navigate("/account-settings"); }}><FiSettings size={14} style={{ marginRight: 8 }} />Account Settings</button>
                  <hr style={styles.divider} />
                  <button style={{ ...styles.dropItem, color: "#e74c3c" }} onClick={handleLogout}><FiLogOut size={14} style={{ marginRight: 8 }} />Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.loginBtn}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </div>
          )}
  
        </div>


      </nav>

      {modal && (
        <ProfileModal modal={modal} onClose={() => setModal(null)} user={user} updateUser={updateUser} />
      )}
    </>
  );
}

function ProfileModal({ modal, onClose, user, updateUser }) {
  const [name, setName] = useState(user?.name || "");
  // Avatar crop states
  const [rawSrc, setRawSrc] = useState(null);       // original selected image URL
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [croppedPreview, setCroppedPreview] = useState(null); // final cropped blob URL
  const [croppingDone, setCroppingDone] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_, areaPixels) => setCroppedArea(areaPixels), []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRawSrc(url);
    setCroppingDone(false);
    setCroppedPreview(null);
    setCroppedBlob(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const applyCrop = async () => {
    if (!rawSrc || !croppedArea) return;
    const blob = await getCroppedImg(rawSrc, croppedArea);
    setCroppedBlob(blob);
    setCroppedPreview(URL.createObjectURL(blob));
    setCroppingDone(true);
  };

  const handleSaveAvatar = async () => {
    if (!croppedBlob) { setError("Please crop the image first"); return; }
    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg");
      const { data } = await API.put("/auth/update-profile", formData, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser({ avatar: data.avatar });
      toast.success("Profile picture updated!");
      setTimeout(onClose, 1000);
    } catch { setError("Failed to upload picture"); }
    finally { setLoading(false); }
  };

  const handleSaveName = async () => {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      const { data } = await API.put("/auth/update-profile", formData);
      updateUser({ name: data.name });
      toast.success("Name updated successfully!");
      setTimeout(onClose, 1000);
    } catch { setError("Failed to update name"); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) { setError("Passwords do not match"); return; }
    if (passwords.newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      await API.put("/auth/change-password", { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(onClose, 1000);
    } catch (e) { setError(e.response?.data?.message || "Failed to change password"); }
    finally { setLoading(false); }
  };

  const titles = { avatar: "🖼️ Change Profile Picture", name: "✏️ Edit Name", password: "🔒 Change Password" };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: modal === "avatar" ? "480px" : "400px" }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{titles[modal]}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {modal === "avatar" && (
          <div style={styles.avatarSection}>
            {!rawSrc ? (
              <>
                <div style={styles.previewCircle}>
                  {user?.avatar
                    ? <img src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000/uploads/${user.avatar}`} alt="current" style={styles.previewImg} />
                    : <div style={styles.previewInitial}>{user?.name?.[0]?.toUpperCase()}</div>}
                </div>
                <label style={styles.uploadLabel}>
                  📁 Choose Image
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                </label>
              </>
            ) : !croppingDone ? (
              <>
                <div style={styles.cropContainer}>
                  <Cropper
                    image={rawSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div style={styles.zoomRow}>
                  <span style={styles.zoomLabel}>🔍 Zoom</span>
                  <input type="range" min={1} max={3} step={0.05} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <button style={{ ...styles.saveBtn, background: "#f0f2f5", color: "#555" }}
                    onClick={() => setRawSrc(null)}>← Back</button>
                  <button style={styles.saveBtn} onClick={applyCrop}>✂️ Crop & Preview</button>
                </div>
              </>
            ) : (
              <>
                <img src={croppedPreview} alt="cropped" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid #1abc9c" }} />
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <button style={{ ...styles.saveBtn, background: "#f0f2f5", color: "#555" }}
                    onClick={() => setCroppingDone(false)}>← Re-crop</button>
                  <button style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSaveAvatar} disabled={loading}>
                    {loading ? "Uploading..." : "✅ Save Picture"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {modal === "name" && (
          <div style={styles.fieldSection}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter new name" />
            <button style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSaveName} disabled={loading}>
              {loading ? "Saving..." : "Save Name"}
            </button>
          </div>
        )}

        {modal === "password" && (
          <div style={styles.fieldSection}>
            {[
              { key: "currentPassword", label: "Current Password", show: "current" },
              { key: "newPassword", label: "New Password", show: "new" },
              { key: "confirmPassword", label: "Confirm Password", show: "confirm" },
            ].map(({ key, label, show }) => (
              <div key={key} style={styles.group}>
                <label style={styles.label}>{label}</label>
                <div style={styles.pwdWrapper}>
                  <input
                    style={{ ...styles.input, paddingRight: "40px", borderColor: key === "confirmPassword" && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword ? "#e74c3c" : "#ddd" }}
                    type={showPwd[show] ? "text" : "password"}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    value={passwords[key]}
                    onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPwd({ ...showPwd, [show]: !showPwd[show] })}>
                    {showPwd[show] ? "🙈" : "👁️"}
                  </button>
                </div>
                {key === "confirmPassword" && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                  <span style={{ fontSize: "0.78rem", color: "#e74c3c" }}>Passwords do not match</span>
                )}
              </div>
            ))}
            <button style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }} onClick={handleChangePassword} disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: crop image using canvas and return a Blob
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
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

const styles = {
  nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "#1a252f", boxShadow: "0 2px 10px rgba(0,0,0,0.3)", height: "60px", flexWrap: "wrap" },
  brand: { display: "flex", alignItems: "center", gap: "30px", textDecoration: "none" },
  logo: { height: "42px", width: "100px", objectFit: "cover", borderRadius: "12px", border: "2px solid #1abc9c", flexShrink: 0, transform: "scale(1.3)", objectPosition:"10% center"},
  brandText: { fontSize: "1.35rem", fontWeight: "800", color: "#fff", letterSpacing: "4px", fontFamily: "'Segoe UI', sans-serif" },
  brandAccent: { color: "#1abc9c" },
  links: { display: "flex", gap: "4px", alignItems: "center" },
  link: { color: "#bdc3c7", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.95rem" },
  activeLink: { color: "#1abc9c", background: "rgba(26,188,156,0.1)", borderBottom: "2px solid #1abc9c", borderRadius: "6px 6px 0 0" },
  chatBadge: { position: "absolute", top: "-4px", right: "-4px", background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "1px 5px", fontSize: "0.65rem", fontWeight: "700", lineHeight: "1.4", minWidth: "16px", textAlign: "center" },
  right: { display: "flex", alignItems: "center", gap: "12px" },
  profileArea: { position: "relative", display: "flex", alignItems: "center", gap: "10px" },
  greeting: { color: "#1abc9c", fontWeight: "700", fontSize: "0.9rem", letterSpacing: "0.5px" },
  avatarBtn: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "8px" },
  avatarImg: { width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1abc9c" },
  avatarInitial: { width: "34px", height: "34px", borderRadius: "50%", background: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.95rem", color: "#fff" },
  userName: { color: "#ecf0f1", fontSize: "0.9rem" },
  chevron: { color: "#bdc3c7", fontSize: "0.7rem" },
  dropdown: { position: "absolute", right: 0, top: "48px", background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: "240px", zIndex: 200, overflow: "hidden" },
  dropHeader: { display: "flex", alignItems: "center", gap: "12px", padding: "16px" },
  dropAvatar: { width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  dropName: { margin: 0, fontWeight: "700", color: "#2c3e50", fontSize: "0.95rem" },
  dropEmail: { margin: "2px 0 4px", color: "#888", fontSize: "0.8rem" },
  dropRole: { background: "#eaf4fb", color: "#2980b9", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "600" },
  divider: { margin: 0, border: "none", borderTop: "1px solid #f0f0f0" },
  dropItem: { display: "block", width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.9rem", color: "#333" },
  authLinks: { display: "flex", gap: "8px", alignItems: "center" },
  loginBtn: { color: "#ecf0f1", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.2)" },
  registerBtn: { color: "#fff", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.9rem", background: "#1abc9c" },
  hamburger: { display: "none" },
  mobileMenu: { display: "none" },
  mobileLink: { display: "none" },
  mobileLink2: { display: "none" },
  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { margin: 0, fontSize: "1.15rem", color: "#2c3e50" },
  closeBtn: { background: "transparent", border: "1.5px solid #ccc", borderRadius: "6px", fontSize: "0.9rem", cursor: "pointer", color: "#666", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", padding: 0 },
  avatarSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" },
  cropContainer: { position: "relative", width: "100%", height: "280px", background: "#111", borderRadius: "10px", overflow: "hidden" },
  zoomRow: { display: "flex", alignItems: "center", gap: "10px", width: "100%" },
  zoomLabel: { fontSize: "0.85rem", color: "#555", whiteSpace: "nowrap" },
  previewCircle: { width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden", border: "3px solid #1abc9c" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  previewInitial: { width: "100%", height: "100%", background: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "2rem" },
  uploadLabel: { padding: "9px 20px", background: "#f0f2f5", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" },
  fileName: { fontSize: "0.82rem", color: "#888", margin: 0 },
  fieldSection: { display: "flex", flexDirection: "column", gap: "14px" },
  group: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#555" },
  input: { padding: "10px 12px", fontSize: "1rem", borderRadius: "6px", border: "1px solid #ddd", outline: "none", width: "100%", boxSizing: "border-box" },
  pwdWrapper: { position: "relative" },
  eyeBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  saveBtn: { padding: "11px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", fontWeight: "600", width: "100%" },
  success: { background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "6px", padding: "10px 14px", marginBottom: "12px", fontSize: "0.9rem" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "6px", padding: "10px 14px", marginBottom: "12px", fontSize: "0.9rem" },
};
