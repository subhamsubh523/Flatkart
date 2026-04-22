import { Link } from "react-router-dom";
import { FiHome, FiRefreshCw } from "react-icons/fi";

export default function NotFound() {
  return (
    <div style={styles.container}>
      <h1 style={styles.code}>404</h1>
      <p style={styles.title}>Page not found</p>
      <p style={styles.sub}>The page you're looking for doesn't exist or has been moved.</p>
      <div style={styles.btnRow}>
        <Link to="/" style={styles.homeBtn}>
          <FiHome size={16} style={{ marginRight: 8 }} />Go Home
        </Link>
        <button style={styles.refreshBtn} onClick={() => window.location.reload()}>
          <FiRefreshCw size={16} style={{ marginRight: 8 }} />Refresh
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px", background: "#f5f6fa" },
  code: { fontSize: "6rem", fontWeight: "bold", color: "#2c3e50", margin: 0 },
  title: { fontSize: "1.2rem", color: "#555", margin: 0, fontWeight: "600" },
  sub: { fontSize: "0.95rem", color: "#888", margin: 0 },
  btnRow: { display: "flex", gap: "12px", marginTop: "8px" },
  homeBtn: { display: "flex", alignItems: "center", padding: "10px 22px", background: "#2c3e50", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "700", fontSize: "0.95rem" },
  refreshBtn: { display: "flex", alignItems: "center", padding: "10px 22px", background: "transparent", color: "#2c3e50", border: "1.5px solid #2c3e50", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem" },
};
