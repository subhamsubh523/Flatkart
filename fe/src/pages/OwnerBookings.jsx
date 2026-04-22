import { useState, useEffect } from "react";
import API from "../api";
import Spinner from "../components/Spinner";

const statusColor = { pending: "#f39c12", approved: "#27ae60", rejected: "#e74c3c", cancelled: "#7f8c8d" };
const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled by Tenant" };

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/bookings/owner").then(({ data }) => { setBookings(data); setLoading(false); });
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await API.put(`/bookings/${id}`, { status });
    setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: data.status } : b)));
  };

  return (
    <div style={styles.container}>
      <h2>Booking Requests</h2>
      {loading ? <Spinner fullPage /> : bookings.length === 0 ? (
        <p style={{ color: "#888" }}>No booking requests yet.</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} style={styles.card}>
            <h3>{b.flat_id?.location}</h3>
            <p style={styles.meta}>Tenant: <strong>{b.tenant_id?.name}</strong> ({b.tenant_id?.email})</p>
            <p style={styles.meta}>Price: ₹{b.flat_id?.price}/month</p>
            <p>Status: <strong style={{ color: statusColor[b.status] }}>{statusLabel[b.status] || b.status}</strong></p>
            {b.status === "pending" && (
              <div style={styles.actions}>
                <button style={{ ...styles.btn, background: "#27ae60" }} onClick={() => updateStatus(b._id, "approved")}>Approve</button>
                <button style={{ ...styles.btn, background: "#e74c3c" }} onClick={() => updateStatus(b._id, "rejected")}>Reject</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "700px", margin: "40px auto", padding: "0 16px" },
  card: { border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginBottom: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  meta: { color: "#555", margin: "4px 0" },
  actions: { display: "flex", gap: "10px", marginTop: "10px" },
  btn: { padding: "8px 18px", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
};
