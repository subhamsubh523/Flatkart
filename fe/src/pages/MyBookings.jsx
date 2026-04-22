import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Spinner from "../components/Spinner";
import ImageSlider from "../components/ImageSlider";

const statusConfig = {
  pending:   { color: "#f39c12", bg: "#fef9e7", icon: "⏳", label: "Pending" },
  approved:  { color: "#27ae60", bg: "#eafaf1", icon: "✅", label: "Approved" },
  rejected:  { color: "#e74c3c", bg: "#fdf0f0", icon: "❌", label: "Rejected" },
  cancelled: { color: "#7f8c8d", bg: "#f4f6f7", icon: "🚫", label: "Cancelled" },
};

function ReviewSection({ flatId }) {
  const [review, setReview] = useState(null);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    API.get(`/reviews/${flatId}/mine`).then(({ data }) => {
      if (data) { setReview(data); setDone(true); }
    }).catch(() => {});
  }, [flatId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await API.post("/reviews", { flat_id: flatId, ...form });
      setReview(data);
      setDone(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (done && review) return (
    <div style={styles.reviewDone}>
      <div style={styles.reviewDoneTop}>
        <span style={styles.reviewDoneLabel}>⭐ Your Review</span>
        <span style={styles.reviewStars}>{"★".repeat(review.rating)}<span style={{ color: "#ddd" }}>{"★".repeat(5 - review.rating)}</span></span>
      </div>
      <p style={styles.reviewDoneComment}>{review.comment}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={styles.reviewForm}>
      <p style={styles.reviewFormLabel}>✍️ Leave a Review</p>
      <select style={styles.input} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} — {n} Star{n > 1 ? "s" : ""}</option>)}
      </select>
      <textarea style={{ ...styles.input, height: "60px", resize: "vertical" }}
        placeholder="Share your experience..."
        value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
        required
      />
      <button style={{ ...styles.reviewBtn, opacity: submitting ? 0.7 : 1 }} type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerNames, setOwnerNames] = useState({});
  const [cancelling, setCancelling] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

  const handleCancel = async (id) => {
    setConfirmId(null);
    setCancelling(id);
    try {
      await API.patch(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const fetchBookings = () => {
    API.get("/bookings/my").then(({ data }) => {
      const valid = data.filter((b) => b.flat_id && b.flat_id.location);
      setBookings(valid);
      setLoading(false);
      // Fetch owner names for all unique owner_ids
      const uniqueOwnerIds = [...new Set(valid.map((b) => b.flat_id?.owner_id).filter(Boolean))];
      uniqueOwnerIds.forEach((ownerId) => {
        if (ownerNames[ownerId]) return;
        API.get(`/chat/user/${ownerId}`)
          .then(({ data: u }) => setOwnerNames((prev) => ({ ...prev, [ownerId]: u.name })))
          .catch(() => {});
      });
    });
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") fetchBookings(); };
    window.addEventListener("focus", fetchBookings);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchBookings);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (loading) return <Spinner fullPage />;

  const counts = {
    total: bookings.length,
    approved: bookings.filter((b) => b.status === "approved").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Bookings</h2>
        <div style={styles.statsRow}>
          <div style={styles.statPill}>📋 {counts.total} Total</div>
          <div style={{ ...styles.statPill, background: "#eafaf1", color: "#27ae60" }}>✅ {counts.approved} Approved</div>
          <div style={{ ...styles.statPill, background: "#fef9e7", color: "#f39c12" }}>⏳ {counts.pending} Pending</div>
          <div style={{ ...styles.statPill, background: "#fdf0f0", color: "#e74c3c" }}>❌ {counts.rejected} Rejected</div>
          <div style={{ ...styles.statPill, background: "#f4f6f7", color: "#7f8c8d" }}>🚫 {counts.cancelled} Cancelled</div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>🏚️</span>
          <p style={styles.emptyTitle}>No bookings yet</p>
          <p style={styles.emptyDesc}>Browse available flats and send a booking request.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {bookings.map((b) => {
            const s = statusConfig[b.status] || statusConfig.pending;
            return (
              <div key={b._id} style={styles.row}>
                {/* Image */}
                <div style={styles.imgWrap}>
                  <ImageSlider images={b.flat_id?.images} image={b.flat_id?.image} height="100%" noImgSize="2.5rem" />
                </div>

                {/* Info */}
                <div style={styles.info}>
                  <div style={styles.infoTop}>
                    <div>
                      <h3 style={styles.location}>{b.flat_id?.location}</h3>
                      <div style={styles.metaRow}>
                        <span style={styles.metaChip}>🏷️ {b.flat_id?.type}</span>
                        <span style={styles.metaChip}>💰 ₹{b.flat_id?.price?.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    <span style={{ ...styles.statusBadge, background: s.color }}>{s.icon} {s.label}</span>
                  </div>

                  <div style={{ ...styles.statusBar, background: s.bg, color: s.color, borderLeft: `3px solid ${s.color}` }}>
                    {b.status === "pending" && "Awaiting owner approval"}
                    {b.status === "approved" && "🎉 Your booking is confirmed!"}
                    {b.status === "rejected" && "Owner has declined this request."}
                    {b.status === "cancelled" && "You cancelled this booking."}
                  </div>

                  {b.status === "pending" && (
                    <button
                      style={{ ...styles.chatBtn, borderColor: "#e74c3c", color: "#e74c3c", opacity: cancelling === b._id ? 0.7 : 1 }}
                      onClick={() => setConfirmId(b._id)}
                      disabled={cancelling === b._id}>
                      {cancelling === b._id ? "Cancelling..." : "✕ Cancel Booking"}
                    </button>
                  )}

                  {b.flat_id?.owner_id && (
                    <button
                      style={styles.chatBtn}
                      onClick={() => navigate(`/chat/${b.flat_id.owner_id}`, { state: { name: ownerNames[b.flat_id.owner_id] || "Owner" } })}>
                      💬 Chat with {ownerNames[b.flat_id.owner_id] || "Owner"}
                    </button>
                  )}

                  {b.status === "approved" && <ReviewSection flatId={b.flat_id._id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmId && (
        <div style={confirmStyles.overlay}>
          <div style={confirmStyles.box}>
            <h3 style={confirmStyles.title}>🚫 Cancel Booking</h3>
            <p style={confirmStyles.text}>Are you sure you want to cancel this booking request?</p>
            <div style={confirmStyles.actions}>
              <button style={confirmStyles.noBtn} onClick={() => setConfirmId(null)}>No, Keep It</button>
              <button style={confirmStyles.yesBtn} onClick={() => handleCancel(confirmId)}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" },
  header: { marginBottom: "32px" },
  title: { margin: "0 0 16px", fontSize: "1.6rem", color: "#2c3e50", fontWeight: "700" },
  statsRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  statPill: { background: "#f0f2f5", color: "#555", padding: "6px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" },
  empty: { textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
  emptyIcon: { fontSize: "4rem" },
  emptyTitle: { margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#2c3e50" },
  emptyDesc: { margin: 0, color: "#888", fontSize: "0.9rem" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", overflow: "hidden" },
  imgWrap: { width: "140px", flexShrink: 0 },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noImg: { width: "100%", height: "100%", minHeight: "120px", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" },
  info: { flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" },
  infoTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  location: { margin: "0 0 6px", fontSize: "1rem", fontWeight: "700", color: "#2c3e50" },
  metaRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  metaChip: { background: "#f0f2f5", color: "#555", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" },
  statusBadge: { color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "700", flexShrink: 0, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
  statusBar: { padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "600" },
  chatBtn: { alignSelf: "flex-start", padding: "7px 16px", background: "#f0f2f5", color: "#2c3e50", border: "1.5px solid #2c3e50", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  reviewForm: { display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f0f0f0", paddingTop: "10px" },
  reviewFormLabel: { margin: 0, fontSize: "0.88rem", fontWeight: "700", color: "#2c3e50" },
  input: { padding: "8px 10px", fontSize: "0.9rem", borderRadius: "7px", border: "1.5px solid #e0e0e0", outline: "none", background: "#fafafa" },
  reviewBtn: { padding: "8px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "0.88rem", alignSelf: "flex-start", paddingLeft: "16px", paddingRight: "16px" },
  reviewDone: { borderTop: "1px solid #f0f0f0", paddingTop: "10px" },
  reviewDoneTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  reviewDoneLabel: { fontSize: "0.85rem", fontWeight: "700", color: "#2c3e50" },
  reviewStars: { color: "#f39c12", fontSize: "0.95rem" },
  reviewDoneComment: { margin: 0, fontSize: "0.83rem", color: "#666", lineHeight: "1.5" },
};

const confirmStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" },
  box: { background: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "380px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", textAlign: "center" },
  title: { margin: "0 0 12px", fontSize: "1.2rem", color: "#e74c3c", fontWeight: "700" },
  text: { margin: "0 0 24px", color: "#555", fontSize: "0.95rem", lineHeight: 1.6 },
  actions: { display: "flex", gap: "12px" },
  noBtn: { flex: 1, padding: "11px", background: "#f0f2f5", color: "#2c3e50", border: "1.5px solid #ddd", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600" },
  yesBtn: { flex: 1, padding: "11px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "700" },
};
