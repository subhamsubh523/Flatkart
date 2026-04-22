import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiPhone, FiMapPin, FiHome, FiGrid, FiLogIn, FiUserPlus, FiMessageSquare, FiBookmark, FiSettings, FiKey, FiHelpCircle } from "react-icons/fi";

export default function Footer() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isTenant = user?.role === "tenant";

  return (
    <footer style={styles.footer}>
      {/* Top accent bar */}
      <div style={styles.accentBar} />

      <div style={styles.container}>

        {/* Brand */}
        <div style={styles.brandCol}>
          <div style={styles.brandLogo}>🏠</div>
          <span style={styles.brandName}>FLAT<span style={styles.brandAccent}>KART</span></span>
          <p style={styles.tagline}>Your trusted platform to find, list, and book flats across India — fast, easy, and verified.</p>
          <div style={styles.socialRow}>
            <a href="mailto:flatkart.support@gmail.com" style={styles.socialBtn} title="Email us"><FiMail size={16} /></a>
            <a href="tel:+917381472718" style={styles.socialBtn} title="Call us"><FiPhone size={16} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}><span style={styles.colTitleDot} />Quick Links</h4>
          <FooterLink to="/" icon={<FiHome size={13} />} label="Home" />
          <FooterLink to="/flats" icon={<FiGrid size={13} />} label="Browse Flats" />
          {!user && <FooterLink to="/login" icon={<FiLogIn size={13} />} label="Login" />}
          {!user && <FooterLink to="/register" icon={<FiUserPlus size={13} />} label="Register" />}
          {user && <FooterLink to="/chat" icon={<FiMessageSquare size={13} />} label="Chat" />}
        </div>

        {/* Account */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}><span style={styles.colTitleDot} />Account</h4>
          {isTenant && <FooterLink to="/my-bookings" icon={<FiBookmark size={13} />} label="My Bookings" />}
          {isOwner && <FooterLink to="/dashboard" icon={<FiGrid size={13} />} label="Owner Dashboard" />}
          {user && <FooterLink to="/account-settings" icon={<FiSettings size={13} />} label="Account Settings" />}
          {user && <FooterLink to="/change-password" icon={<FiKey size={13} />} label="Change Password" />}
          <FooterLink to="/forgot-password" icon={<FiHelpCircle size={13} />} label="Forgot Password" />
        </div>

        {/* Contact */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}><span style={styles.colTitleDot} />Contact Us</h4>
          <a href="mailto:flatkart.support@gmail.com" style={styles.contactCard}>
            <div style={styles.contactIconWrap}><FiMail size={15} /></div>
            <div>
              <p style={styles.contactLabel}>Email</p>
              <p style={styles.contactValue}>flatkart.support@gmail.com</p>
            </div>
          </a>
          <a href="tel:+917381472718" style={styles.contactCard}>
            <div style={styles.contactIconWrap}><FiPhone size={15} /></div>
            <div>
              <p style={styles.contactLabel}>Phone</p>
              <p style={styles.contactValue}>+91 7381472718</p>
            </div>
          </a>
          <div style={styles.contactCard}>
            <div style={styles.contactIconWrap}><FiMapPin size={15} /></div>
            <div>
              <p style={styles.contactLabel}>Location</p>
              <p style={styles.contactValue}>Bhubaneswar, Odisha</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={styles.bottom}>
        <div style={styles.bottomInner}>
          <p style={styles.copy}>© {new Date().getFullYear()} <span style={{ color: "#1abc9c", fontWeight: "700" }}>FLATKART</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, icon, label }) {
  return (
    <Link to={to} style={styles.link}>
      <span style={styles.linkIcon}>{icon}</span>
      {label}
    </Link>
  );
}

const styles = {
  footer: { background: "linear-gradient(180deg, #1a252f 0%, #141e27 100%)", color: "#bdc3c7", marginTop: "auto" },
  accentBar: { height: "3px", background: "linear-gradient(90deg, #1abc9c, #16a085, #2c3e50, #1abc9c)", backgroundSize: "200% 100%" },

  container: { display: "flex", flexWrap: "wrap", gap: "40px", justifyContent: "space-between", padding: "48px 48px 32px" },

  // Brand
  brandCol: { display: "flex", flexDirection: "column", gap: "10px", maxWidth: "260px" },
  brandLogo: { fontSize: "2rem", lineHeight: 1 },
  brandName: { color: "#fff", fontWeight: "800", fontSize: "1.4rem", letterSpacing: "3px" },
  brandAccent: { color: "#1abc9c" },
  tagline: { margin: 0, fontSize: "0.85rem", color: "#7f8c8d", lineHeight: "1.7" },
  socialRow: { display: "flex", gap: "10px", marginTop: "4px" },
  socialBtn: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(26,188,156,0.12)", border: "1px solid rgba(26,188,156,0.3)", color: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "background 0.2s" },

  // Columns
  col: { display: "flex", flexDirection: "column", gap: "10px", minWidth: "140px" },
  colTitle: { margin: "0 0 6px", color: "#fff", fontSize: "0.92rem", fontWeight: "700", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" },
  colTitleDot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#1abc9c", flexShrink: 0 },

  // Links
  link: { color: "#7f8c8d", textDecoration: "none", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", transition: "color 0.2s" },
  linkIcon: { color: "#1abc9c", display: "flex", flexShrink: 0 },

  // Contact cards
  contactCard: { display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.2s" },
  contactIconWrap: { width: "34px", height: "34px", borderRadius: "8px", background: "rgba(26,188,156,0.15)", border: "1px solid rgba(26,188,156,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1abc9c", flexShrink: 0 },
  contactLabel: { margin: 0, fontSize: "0.72rem", color: "#636e72", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  contactValue: { margin: "2px 0 0", fontSize: "0.85rem", color: "#bdc3c7", fontWeight: "500" },

  // Bottom
  bottom: { borderTop: "1px solid rgba(255,255,255,0.07)", padding: "18px 48px" },
  bottomInner: { display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  copy: { margin: 0, fontSize: "0.82rem", color: "#636e72" },
  madeWith: { margin: 0, fontSize: "0.82rem", color: "#636e72" },
};
