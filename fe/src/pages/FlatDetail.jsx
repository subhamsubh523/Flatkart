import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function FlatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flat, setFlat] = useState(null);
  const [rating, setRating] = useState(null);
  const [msg, setMsg] = useState("");
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [hasBooked, setHasBooked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [lbZoom, setLbZoom] = useState(1);
  const [heroIdx, setHeroIdx] = useState(0);

  const openLightbox = (images, idx) => { setLightbox({ images, idx }); setLbZoom(1); };
  const closeLightbox = () => { setLightbox(null); setLbZoom(1); };

  useEffect(() => {
    if (!lightbox) return;
    const el = document.getElementById("lb-overlay");
    if (!el) return;
    const handler = (e) => { e.preventDefault(); setLbZoom((z) => Math.min(4, Math.max(1, +(z - e.deltaY * 0.04).toFixed(2)))); };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") { setLightbox((lb) => ({ ...lb, idx: (lb.idx - 1 + lb.images.length) % lb.images.length })); setLbZoom(1); }
      if (e.key === "ArrowRight") { setLightbox((lb) => ({ ...lb, idx: (lb.idx + 1) % lb.images.length })); setLbZoom(1); }
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") setLbZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setLbZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  useEffect(() => {
    API.get(`/flats/${id}`).then(({ data }) => setFlat(data));
    API.get(`/reviews/${id}/summary`).then(({ data }) => setRating(data));
    if (user?.role !== "owner") {
      const sessionKey = `viewed_${id}`;
      const isNew = !sessionStorage.getItem(sessionKey);
      if (isNew) sessionStorage.setItem(sessionKey, "1");
      let viewerId = user?.id;
      if (!viewerId) {
        viewerId = sessionStorage.getItem("guestId");
        if (!viewerId) {
          viewerId = "guest_" + Math.random().toString(36).slice(2);
          sessionStorage.setItem("guestId", viewerId);
        }
      }
      // Always patch so tenantViews in response reflects current tenant included
      API.patch(`/flats/${id}/view`, { viewerId })
        .then(({ data }) => setFlat((prev) => prev ? { ...prev, views: data.views, tenantViews: data.tenantViews } : prev))
        .catch(() => {});
    }
    if (user?.role === "tenant") {
      API.get("/bookings/my").then(({ data }) => {
        const match = data.find((b) => (b.flat_id?._id === id || b.flat_id === id) && b.status === "pending");
        setHasBooked(!!match);
        if (match) setBookingId(match._id);
      }).catch(() => {});
    }
  }, [id, user]);

  const handleBook = async () => {
    setShowConfirm(false);
    setBooking(true);
    try {
      const { data } = await API.post("/bookings", { flat_id: id });
      setMsg("success");
      setHasBooked(true);
      setBookingId(data._id);
      toast.success("Booking request sent! The owner will review it shortly.");
    } catch (e) {
      const errMsg = e.response?.data?.message || "Booking failed";
      setMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelling(true);
    try {
      await API.patch(`/bookings/${bookingId}/cancel`);
      setMsg("");
      setHasBooked(false);
      setBookingId(null);
      toast.success("Booking cancelled.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const getDirectionsUrl = () => {
    const query = encodeURIComponent(
      [flat.locality, flat.city, flat.district, flat.state, flat.pincode].filter(Boolean).join(", ")
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  if (!flat) return <Spinner fullPage />;

  const tenantViews = flat.tenantViews || 0;
  const viewLabel = user?.role === "tenant"
    ? `${tenantViews} Tenant${tenantViews !== 1 ? "s" : ""}`
    : flat.views;

  const allImages = flat.images?.length ? flat.images : flat.image ? [flat.image] : [];
  const imgSrc = (s) => s?.startsWith("http") ? s : `http://localhost:5000/uploads/${s}`;
  const allImageUrls = allImages.map(imgSrc);
  const fullAddress = [flat.houseNo, flat.landmark, flat.locality, flat.city, flat.district, flat.state, flat.pincode, flat.country].filter(Boolean).join(", ");

  return (
    <div style={styles.page}>

      {/* ── Hero Gallery ── */}
      <div style={styles.heroWrap}>
        <div style={styles.hero}>
          {allImageUrls.length > 0 ? (
            <img
              src={allImageUrls[heroIdx]}
              alt="flat"
              style={styles.heroImg}
              onClick={() => openLightbox(allImageUrls, heroIdx)}
            />
          ) : (
            <div style={styles.heroNoImg}>🏠</div>
          )}
          <div style={styles.heroOverlay}>
            <div style={styles.heroBadgeRow}>
              <span style={styles.heroBadge}>{flat.type}</span>
              {rating?.avg && <span style={styles.heroRating}>⭐ {rating.avg} ({rating.count})</span>}
            </div>
            <h1 style={styles.heroTitle}>{fullAddress || flat.location}</h1>
            <p style={styles.heroPrice}>₹{flat.price?.toLocaleString()}<span style={styles.heroPerMonth}>/month</span></p>
          </div>
          {allImageUrls.length > 1 && (
            <>
              <button style={{ ...styles.galleryArrow, left: "16px" }} onClick={(e) => { e.stopPropagation(); setHeroIdx((i) => (i - 1 + allImageUrls.length) % allImageUrls.length); }}><FiChevronLeft size={20} /></button>
              <button style={{ ...styles.galleryArrow, right: "16px" }} onClick={(e) => { e.stopPropagation(); setHeroIdx((i) => (i + 1) % allImageUrls.length); }}><FiChevronRight size={20} /></button>
              <div style={styles.heroDots}>
                {allImageUrls.map((_, i) => (
                  <span key={i} onClick={(e) => { e.stopPropagation(); setHeroIdx(i); }}
                    style={{ ...styles.heroDot, background: i === heroIdx ? "#fff" : "rgba(255,255,255,0.45)" }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {allImageUrls.length > 1 && (
          <div style={styles.thumbStrip}>
            {allImageUrls.map((url, i) => (
              <img key={i} src={url} alt={`thumb-${i}`}
                onClick={() => setHeroIdx(i)}
                onDoubleClick={() => openLightbox(allImageUrls, i)}
                title="Click to preview · Double-click to zoom"
                style={{ ...styles.thumb, outline: i === heroIdx ? "3px solid #1abc9c" : "3px solid transparent" }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={styles.body}>

          {/* Description */}
          <div style={styles.card}>
            <div style={styles.cardTitleRow}>
              <span style={styles.cardTitleIcon}>📋</span>
              <h3 style={styles.cardTitle}>About this Flat</h3>
            </div>
            <p style={styles.desc}>{flat.description || "No description provided."}</p>
          </div>

          {/* Key Details */}
          <div style={styles.card}>
            <div style={styles.cardTitleRow}>
              <span style={styles.cardTitleIcon}>🔑</span>
              <h3 style={styles.cardTitle}>Key Details</h3>
            </div>
            <div style={styles.detailGrid}>
              <DetailItem icon="🏷️" label="Type" value={flat.type} />
              <DetailItem icon="💰" label="Rent" value={`₹${flat.price?.toLocaleString()}/month`} />
              {flat.roomWidth && flat.roomBreadth && <DetailItem icon="📐" label="Room Size" value={`${flat.roomWidth} × ${flat.roomBreadth} ft`} />}
              {flat.ownerName && <DetailItem icon="👤" label="Owner" value={flat.ownerName} />}
              {rating?.avg && <DetailItem icon="⭐" label="Rating" value={`${rating.avg}/5 (${rating.count} review${rating.count !== 1 ? "s" : ""})`} />}
              {flat.views > 0 && <DetailItem icon="👁️" label={user?.role === "tenant" ? "Viewing" : "Views"} value={viewLabel} />}
            </div>
          </div>

          {/* Address */}
          <div style={styles.card}>
            <div style={styles.cardTitleRow}>
              <span style={styles.cardTitleIcon}>📍</span>
              <h3 style={styles.cardTitle}>Location & Address</h3>
            </div>
            <div style={styles.addressGrid}>
              {flat.houseNo && <AddressItem label="House No" value={flat.houseNo} />}
              {flat.locality && <AddressItem label="Locality" value={flat.locality} />}
              {flat.landmark && <AddressItem label="Near Landmark" value={flat.landmark} highlight />}
              {flat.city && <AddressItem label="City" value={flat.city} />}
              {flat.district && <AddressItem label="District" value={flat.district} />}
              {flat.state && <AddressItem label="State" value={flat.state} />}
              {flat.pincode && <AddressItem label="Pincode" value={flat.pincode} />}
            </div>
            <a href={getDirectionsUrl()} target="_blank" rel="noreferrer" style={styles.mapLink}>
              🗺️ Open in Google Maps
            </a>
          </div>

          {/* Owner Comments */}
          {flat.comments && (
            <div style={styles.card}>
              <div style={styles.cardTitleRow}>
                <span style={styles.cardTitleIcon}>💬</span>
                <h3 style={styles.cardTitle}>Owner's Note</h3>
              </div>
              <p style={styles.commentsText}>"{flat.comments}"</p>
            </div>
          )}

          {/* ── Booking Card ── */}
          <div style={styles.bookingCard}>
            <div style={styles.bookingTop}>
              <div>
                <div style={styles.bookingHeader}>
                  <p style={styles.bookingPrice}>₹{flat.price?.toLocaleString()}</p>
                  <span style={styles.bookingPerMonth}>/month</span>
                </div>
                {rating?.avg && (
                  <div style={styles.ratingRow}>
                    <span style={styles.ratingStars}>{"★".repeat(Math.round(rating.avg))}{"☆".repeat(5 - Math.round(rating.avg))}</span>
                    <span style={styles.ratingText}>{rating.avg}/5 · {rating.count} review{rating.count !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
              <div style={styles.bookingMetaInline}>
                <BookingRow label="🏷️ Type" value={flat.type} />
                {flat.houseNo && <BookingRow label="🚪 House No" value={flat.houseNo} />}
                {flat.location && <BookingRow label="📍 Location" value={flat.location} />}
                {flat.locality && <BookingRow label="🏘️ Locality" value={flat.locality} />}
                {flat.landmark && <BookingRow label="🗿 Landmark" value={flat.landmark} />}
                {flat.city && <BookingRow label="🏙️ City" value={flat.city} />}
                {flat.district && <BookingRow label="🗺️ District" value={flat.district} />}
                {flat.state && <BookingRow label="📌 State" value={flat.state} />}
                {flat.pincode && <BookingRow label="🔢 Pincode" value={flat.pincode} />}
                {flat.roomWidth && flat.roomBreadth && <BookingRow label="📐 Room Size" value={`${flat.roomWidth} × ${flat.roomBreadth} ft`} />}
                {flat.ownerName && <BookingRow label="👤 Owner" value={flat.ownerName} />}
                {rating?.avg && <BookingRow label="⭐ Rating" value={`${rating.avg}/5 (${rating.count} reviews)`} />}
                {flat.views > 0 && <BookingRow label="👁️ Viewing" value={viewLabel} />}
              </div>
            </div>

            <div style={styles.bookingDivider} />

            {msg === "success" ? (
              <div style={styles.successMsg}>✅ Booking request sent! The owner will review it shortly.</div>
            ) : msg ? (
              <div style={styles.errorMsg}>⚠️ {msg}</div>
            ) : null}

            <div style={styles.bookingActions}>
              {user?.role === "tenant" && !hasBooked && msg !== "success" && (
                <button style={{ ...styles.bookBtn, opacity: booking ? 0.7 : 1 }} onClick={() => setShowConfirm(true)} disabled={booking}>
                  {booking ? "Sending..." : "🏠 Book This Flat"}
                </button>
              )}
              {user?.role === "tenant" && (hasBooked || msg === "success") && (
                <button style={{ ...styles.cancelBtn, opacity: cancelling ? 0.7 : 1 }} onClick={() => setShowCancelConfirm(true)} disabled={cancelling}>
                  {cancelling ? "Cancelling..." : "✕ Cancel Booking"}
                </button>
              )}
              <a href={getDirectionsUrl()} target="_blank" rel="noreferrer" style={styles.dirBtn}>
                📍 Get Directions
              </a>
              {user?.role === "tenant" && hasBooked && flat.owner_id && (
                <button style={styles.chatBtn} onClick={() => navigate(`/chat/${flat.owner_id}`, { state: { name: flat.ownerName } })}>
                  💬 Chat with Owner
                </button>
              )}
            </div>

            {!user && (
              <p style={styles.loginHint}>Please <a href="/login" style={styles.loginLink}>login</a> to book this flat.</p>
            )}
          </div>
      </div>
      {showCancelConfirm && (
        <div style={confirmStyles.overlay}>
          <div style={confirmStyles.box}>
            <h3 style={{ ...confirmStyles.title, color: "#e74c3c" }}>🚫 Cancel Booking</h3>
            <p style={confirmStyles.text}>Are you sure you want to cancel your booking request for this flat?</p>
            <div style={confirmStyles.actions}>
              <button style={confirmStyles.cancelBtn} onClick={() => setShowCancelConfirm(false)}>No, Keep It</button>
              <button style={{ ...confirmStyles.confirmBtn, background: "linear-gradient(135deg,#e74c3c,#c0392b)" }} onClick={() => { setShowCancelConfirm(false); handleCancel(); }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showConfirm && (
        <div style={confirmStyles.overlay}>
          <div style={confirmStyles.box}>
            <h3 style={confirmStyles.title}>🏠 Confirm Booking</h3>
            <p style={confirmStyles.text}>Are you sure you want to send a booking request for this flat?</p>
            <p style={confirmStyles.price}>₹{flat.price?.toLocaleString()}<span style={confirmStyles.perMonth}>/month</span></p>
            <div style={confirmStyles.actions}>
              <button style={confirmStyles.cancelBtn} onClick={() => setShowConfirm(false)}>No, Go Back</button>
              <button style={confirmStyles.confirmBtn} onClick={handleBook}>Yes, Book Now</button>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox */}
      {lightbox && (
        <div
          id="lb-overlay"
          onClick={closeLightbox}
          style={{ ...lbStyles.overlay, cursor: lbZoom > 1 ? "zoom-out" : "zoom-in" }}
        >
          <button onClick={closeLightbox} style={lbStyles.close}><FiX size={18} /></button>
          <div style={{ position: "fixed", bottom: "22px", right: "22px", display: "flex", gap: "8px", zIndex: 10000 }}>
            <button onClick={(e) => { e.stopPropagation(); setLbZoom((z) => Math.max(1, +(z - 0.25).toFixed(2))); }} style={lbStyles.zoomBtn} title="Zoom out">−</button>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "700", minWidth: "40px", textAlign: "center", lineHeight: "36px" }}>{Math.round(lbZoom * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setLbZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }} style={lbStyles.zoomBtn} title="Zoom in">+</button>
            {lbZoom > 1 && <button onClick={(e) => { e.stopPropagation(); setLbZoom(1); }} style={{ ...lbStyles.zoomBtn, fontSize: "0.7rem", padding: "0 10px", width: "auto" }}>Reset</button>}
          </div>
          <img
            src={lightbox.images[lightbox.idx]}
            alt="flat"
            style={{ ...lbStyles.img, transform: `scale(${lbZoom})`, transition: "transform 0.2s ease", cursor: "default" }}
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: (lb.idx - 1 + lb.images.length) % lb.images.length })); setLbZoom(1); }} style={{ ...lbStyles.arrow, left: "16px" }}><FiChevronLeft size={22} /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: (lb.idx + 1) % lb.images.length })); setLbZoom(1); }} style={{ ...lbStyles.arrow, right: "16px" }}><FiChevronRight size={22} /></button>
              <div style={lbStyles.dots}>
                {lightbox.images.map((_, i) => (
                  <span key={i} onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: i })); setLbZoom(1); }}
                    style={{ ...lbStyles.dot, background: i === lightbox.idx ? "#fff" : "rgba(255,255,255,0.35)" }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailIcon}>{icon}</span>
      <div>
        <p style={styles.detailLabel}>{label}</p>
        <p style={styles.detailValue}>{value}</p>
      </div>
    </div>
  );
}

function AddressItem({ label, value, highlight }) {
  return (
    <div style={{ ...styles.addressItem, ...(highlight ? styles.addressHighlight : {}) }}>
      <span style={styles.addressLabel}>{label}</span>
      <span style={styles.addressValue}>{value}</span>
    </div>
  );
}

function BookingRow({ label, value }) {
  return (
    <div style={styles.bookingMetaRow}>
      <span style={styles.bookingMetaLabel}>{label}</span>
      <span style={styles.bookingMetaValue}>{value}</span>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1140px", margin: "0 auto", padding: "24px 0 60px", background: "#f5f6fa" },

  // Hero
  heroWrap: { marginBottom: "32px" },
  hero: { position: "relative", height: "460px", overflow: "hidden", borderRadius: "16px", margin: "0 24px", background: "#1a252f" },
  heroImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in", transition: "opacity 0.2s" },
  heroNoImg: { width: "100%", height: "100%", background: "linear-gradient(135deg,#ecf0f1,#bdc3c7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px 40px", pointerEvents: "none" },
  galleryArrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", color: "#fff", border: "none", borderRadius: "50%", width: "44px", height: "44px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, transition: "background 0.2s" },
  heroDots: { position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", zIndex: 3 },
  heroDot: { width: "8px", height: "8px", borderRadius: "50%", cursor: "pointer", transition: "background 0.2s" },
  heroBadgeRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  heroBadge: { background: "linear-gradient(135deg,#1abc9c,#16a085)", color: "#fff", padding: "5px 16px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700", letterSpacing: "0.5px" },
  heroRating: { background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", color: "#fff", padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700", border: "1px solid rgba(255,255,255,0.25)" },
  heroTitle: { margin: "0 0 10px", fontSize: "2.1rem", color: "#fff", fontWeight: "800", textShadow: "0 2px 12px rgba(0,0,0,0.5)", lineHeight: 1.3 },
  heroPrice: { margin: 0, fontSize: "1.8rem", fontWeight: "800", color: "#1abc9c", display: "flex", alignItems: "baseline", gap: "4px" },
  heroPerMonth: { fontSize: "1rem", fontWeight: "400", color: "rgba(255,255,255,0.75)" },
  thumbStrip: { display: "flex", gap: "8px", padding: "12px 24px", overflowX: "auto", background: "#fff", borderRadius: "0 0 16px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", margin: "0 24px" },
  thumb: { width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", transition: "outline 0.15s", flexShrink: 0 },

  // Body
  body: { display: "flex", flexDirection: "column", gap: "20px", padding: "0 24px" },
  left: {},
  right: {},

  // Cards
  card: { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0" },
  cardTitleRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "14px", borderBottom: "2px solid #f0f2f5" },
  cardTitleIcon: { fontSize: "1.3rem" },
  cardTitle: { margin: 0, fontSize: "1.1rem", color: "#2c3e50", fontWeight: "700" },
  desc: { color: "#555", lineHeight: "1.9", fontSize: "0.97rem", margin: 0 },

  // Key Details Grid
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" },
  detailItem: { display: "flex", alignItems: "flex-start", gap: "12px", background: "linear-gradient(135deg,#f8f9ff,#f0f2f5)", padding: "14px 16px", borderRadius: "12px", border: "1px solid #e8eaf0" },
  detailIcon: { fontSize: "1.4rem", marginTop: "2px" },
  detailLabel: { margin: "0 0 3px", fontSize: "0.75rem", color: "#999", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  detailValue: { margin: 0, fontSize: "0.95rem", color: "#2c3e50", fontWeight: "700" },

  // Address
  addressGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" },
  addressItem: { background: "#f8f9fa", borderRadius: "10px", padding: "12px 16px", border: "1px solid #eee" },
  addressHighlight: { background: "linear-gradient(135deg,#eafaf1,#d5f5e3)", border: "1px solid #a9dfbf" },
  addressLabel: { display: "block", fontSize: "0.72rem", color: "#999", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  addressValue: { display: "block", fontSize: "0.93rem", color: "#2c3e50", fontWeight: "600" },
  mapLink: { display: "inline-flex", alignItems: "center", gap: "6px", color: "#2980b9", fontWeight: "600", fontSize: "0.9rem", textDecoration: "none", padding: "8px 16px", background: "#eaf4fb", borderRadius: "8px", border: "1px solid #aed6f1" },

  // Comments
  commentsText: { margin: 0, color: "#555", lineHeight: "1.9", fontSize: "0.97rem", fontStyle: "italic", borderLeft: "4px solid #1abc9c", paddingLeft: "16px" },

  // Booking Card (full-width at bottom)
  bookingCard: { background: "linear-gradient(135deg,#1a252f,#2c3e50)", borderRadius: "20px", padding: "32px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.07)" },
  bookingTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "32px", flexWrap: "wrap", marginBottom: "0" },
  bookingHeader: { display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" },
  bookingPrice: { margin: 0, fontSize: "2.6rem", fontWeight: "800", color: "#1abc9c" },
  bookingPerMonth: { fontSize: "1.1rem", fontWeight: "400", color: "rgba(255,255,255,0.5)" },
  ratingRow: { display: "flex", alignItems: "center", gap: "8px" },
  ratingStars: { color: "#f39c12", fontSize: "1.1rem", letterSpacing: "2px" },
  ratingText: { fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" },
  bookingMetaInline: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px 32px", flex: 1, minWidth: "220px" },
  bookingDivider: { height: "1px", background: "rgba(255,255,255,0.1)", margin: "24px 0" },
  bookingMeta: { display: "flex", flexDirection: "column", gap: "10px" },
  bookingMetaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem", gap: "12px" },
  bookingMetaLabel: { flexShrink: 0, color: "rgba(255,255,255,0.5)" },
  bookingMetaValue: { fontWeight: "700", color: "#fff", textAlign: "right", wordBreak: "break-word" },
  bookingActions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  bookBtn: { flex: 1, minWidth: "180px", padding: "15px 24px", background: "linear-gradient(135deg,#1abc9c,#16a085)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", letterSpacing: "0.3px", boxShadow: "0 4px 18px rgba(26,188,156,0.4)" },
  successMsg: { background: "rgba(26,188,156,0.15)", border: "1px solid rgba(26,188,156,0.4)", color: "#1abc9c", padding: "12px 14px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "12px", lineHeight: "1.6" },
  errorMsg: { background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.4)", color: "#e74c3c", padding: "12px 14px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "12px" },
  dirBtn: { flex: 1, minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "15px 24px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", textAlign: "center", textDecoration: "none", boxSizing: "border-box" },
  chatBtn: { flex: 1, minWidth: "160px", padding: "15px 24px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", boxSizing: "border-box", letterSpacing: "0.3px" },
  cancelBtn: { flex: 1, minWidth: "160px", padding: "15px 24px", background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1.5px solid #e74c3c", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", boxSizing: "border-box" },
  loginHint: { textAlign: "center", color: "#888", fontSize: "0.88rem", marginTop: "12px" },
  loginLink: { color: "#1abc9c", fontWeight: "600" },
};

const confirmStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" },
  box: { background: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "400px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", textAlign: "center" },
  title: { margin: "0 0 12px", fontSize: "1.3rem", color: "#2c3e50", fontWeight: "700" },
  text: { margin: "0 0 16px", color: "#555", fontSize: "0.95rem", lineHeight: 1.6 },
  price: { margin: "0 0 24px", fontSize: "1.8rem", fontWeight: "800", color: "#1abc9c" },
  perMonth: { fontSize: "1rem", fontWeight: "400", color: "#888" },
  actions: { display: "flex", gap: "12px" },
  cancelBtn: { flex: 1, padding: "12px", background: "#f0f2f5", color: "#2c3e50", border: "1.5px solid #ddd", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600" },
  confirmBtn: { flex: 1, padding: "12px", background: "linear-gradient(135deg,#1abc9c,#16a085)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "700" },
};

const lbStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
  img: { maxWidth: "92vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", cursor: "default" },
  close: { position: "fixed", top: "18px", right: "22px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.3rem", width: "38px", height: "38px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 },
  arrow: { position: "fixed", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.4rem", width: "46px", height: "46px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 },
  dots: { position: "fixed", bottom: "22px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 10000 },
  dot: { width: "8px", height: "8px", borderRadius: "50%", cursor: "pointer", transition: "background 0.2s" },
  zoomBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.2rem", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, fontWeight: "700" },
};
