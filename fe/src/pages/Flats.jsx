import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import ImageSlider from "../components/ImageSlider";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

function RatingBadge({ flatId }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    API.get(`/reviews/${flatId}/summary`).then(({ data }) => setSummary(data)).catch(() => {});
  }, [flatId]);
  if (!summary?.avg) return null;
  return <span style={ratingStyle}>⭐ {summary.avg} ({summary.count})</span>;
}

const ratingStyle = { background: "#fff8e1", color: "#f39c12", padding: "2px 8px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "700", border: "1px solid #f9e4a0" };

const INIT_LOC = { state: "", district: "", city: "", locality: "", pincode: "" };
const INIT_FILTER = { type: "", minPrice: "", maxPrice: "", sortBy: "" };

export default function Flats() {
  const { user } = useAuth();
  const isTenant = user?.role === "tenant";
  const [allFlats, setAllFlats] = useState([]);
  const [bookedIds, setBookedIds] = useState(new Set());
  const [loc, setLoc] = useState(INIT_LOC);
  const [filters, setFilters] = useState(INIT_FILTER);
  const [loading, setLoading] = useState(true);
  const [opts, setOpts] = useState({ states: [], districts: [], cities: [], localities: [] });
  const [lightbox, setLightbox] = useState(null);
  const [lbZoom, setLbZoom] = useState(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

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

  const useMyLocation = () => {
    if (!navigator.geolocation) { setGeoError("Geolocation is not supported by your browser"); return; }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};
          setLoc((prev) => ({
            ...prev,
            city: a.city || a.town || a.village || a.suburb || "",
            state: a.state || "",
            pincode: a.postcode || "",
            district: a.county || a.state_district || prev.district,
            locality: "",
          }));
        } catch {
          setGeoError("Could not fetch location details. Try again.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) setGeoError("Location access denied. Please allow location permission.");
        else setGeoError("Unable to retrieve your location.");
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    API.get("/bookings/my").then(({ data }) => {
      setBookedIds(new Set(data.filter((b) => b.status === "pending").map((b) => b.flat_id?._id).filter(Boolean)));
    }).catch(() => {});
    API.get("/flats/location-options?field=state").then(({ data }) => setOpts((o) => ({ ...o, states: data })));
  }, []);

  useEffect(() => {
    if (!loc.state) { setOpts((o) => ({ ...o, districts: [], cities: [], localities: [] })); return; }
    API.get(`/flats/location-options?field=district&state=${encodeURIComponent(loc.state)}`)
      .then(({ data }) => setOpts((o) => ({ ...o, districts: data, cities: [], localities: [] })));
  }, [loc.state]);

  useEffect(() => {
    if (!loc.district) { setOpts((o) => ({ ...o, cities: [], localities: [] })); return; }
    API.get(`/flats/location-options?field=city&district=${encodeURIComponent(loc.district)}`)
      .then(({ data }) => setOpts((o) => ({ ...o, cities: data, localities: [] })));
  }, [loc.district]);

  useEffect(() => {
    if (!loc.city) { setOpts((o) => ({ ...o, localities: [] })); return; }
    API.get(`/flats/location-options?field=locality&city=${encodeURIComponent(loc.city)}`)
      .then(({ data }) => setOpts((o) => ({ ...o, localities: data })));
  }, [loc.city]);

  const fetchFlats = useCallback(async () => {
    const { state, district, city, locality, pincode } = loc;
    const hasSearch = state || district || city || locality || pincode;
    if (isTenant && !hasSearch) { setAllFlats([]); setLoading(false); return; }
    setLoading((prev) => prev || allFlats.length === 0);
    try {
      const p = new URLSearchParams();
      if (state) p.set("state", state);
      if (district) p.set("district", district);
      if (city) p.set("city", city);
      if (locality) p.set("locality", locality);
      if (pincode) p.set("pincode", pincode);
      const [{ data: flatsData }, { data: bookingsData }] = await Promise.all([
        API.get(`/flats/search?${p}`),
        API.get("/bookings/my").catch(() => ({ data: [] })),
      ]);
      setAllFlats(flatsData);
      setBookedIds(new Set(bookingsData.filter((b) => b.status === "pending").map((b) => b.flat_id?._id).filter(Boolean)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loc, isTenant]);

  const hasLocation = loc.state || loc.district || loc.city || loc.locality || loc.pincode;

  useEffect(() => {
    const delay = setTimeout(() => fetchFlats(true), 300);
    return () => clearTimeout(delay);
  }, [fetchFlats]);

  const setLocField = (key) => (e) => setLoc((f) => {
    const next = { ...f, [key]: e.target.value };
    if (key === "state") { next.district = ""; next.city = ""; next.locality = ""; }
    if (key === "district") { next.city = ""; next.locality = ""; }
    if (key === "city") next.locality = "";
    return next;
  });

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const filtered = useMemo(() => {
    let result = allFlats.filter((f) => !bookedIds.has(f._id));
    if (filters.type) result = result.filter((f) => f.type === filters.type);
    if (filters.minPrice) result = result.filter((f) => f.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter((f) => f.price <= Number(filters.maxPrice));
    if (filters.sortBy === "price_asc") result = [...result].sort((a, b) => a.price - b.price);
    if (filters.sortBy === "price_desc") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [allFlats, filters, bookedIds]);

  const types = useMemo(() => [...new Set(allFlats.map((f) => f.type).filter(Boolean))].sort(), [allFlats]);

  return (
    <div style={styles.page}>
      {/* Search Hero */}
      <div style={styles.searchHero}>
        <h1 style={styles.searchTitle}>🏘️ Find Your Perfect Flat</h1>
        <p style={styles.searchSub}>Select or type your State, District and City to discover available flats</p>

        <button onClick={useMyLocation} disabled={geoLoading} style={styles.geoBtn}>
          {geoLoading ? <><span style={styles.geoBtnSpinner} />Detecting location...</> : "📍Current Location"}
        </button>
        {geoError && <p style={styles.geoError}>{geoError}</p>}

        <div style={styles.locationRow}>
          {[
            { key: "state", placeholder: "State", options: opts.states },
            { key: "district", placeholder: "District", options: opts.districts },
            { key: "city", placeholder: "City", options: opts.cities },
            { key: "locality", placeholder: "Locality", options: opts.localities },
          ].map(({ key, placeholder, options }) => (
            <div key={key} style={styles.locationField}>
              <input
                list={`${key}-list`}
                style={styles.locationInput}
                placeholder={placeholder}
                value={loc[key]}
                onChange={setLocField(key)}
              />
              <datalist id={`${key}-list`}>
                {options.map((o) => <option key={o} value={o} />)}
              </datalist>
            </div>
          ))}
        </div>

        <div style={{ ...styles.locationRow, marginTop: "10px" }}>
          <div style={styles.locationField}>
            <input style={styles.locationInput} placeholder="Pincode" value={loc.pincode} onChange={setLocField("pincode")} inputMode="numeric" />
          </div>
          {hasLocation && (
            <button style={styles.clearBtn} onClick={() => { setLoc(INIT_LOC); setFilters(INIT_FILTER); }}>✕ Clear</button>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input style={styles.filterInput} placeholder="₹ Min price" type="number" value={filters.minPrice} onChange={setFilter("minPrice")} />
          <input style={styles.filterInput} placeholder="₹ Max price" type="number" value={filters.maxPrice} onChange={setFilter("maxPrice")} />
          <select style={styles.filterInput} value={filters.type} onChange={setFilter("type")}>
            <option value="">All Types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={styles.filterInput} value={filters.sortBy} onChange={setFilter("sortBy")}>
            <option value="">Sort By</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <button style={styles.resetBtn} onClick={() => setFilters(INIT_FILTER)}>Reset</button>
        </div>

        <p style={styles.searchCount}>
          {loading ? "Searching..." : `${filtered.length} flat${filtered.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : isTenant && !hasLocation ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyIcon}>🔍</p>
          <p style={styles.emptyText}>Enter a State, District, City or Locality to search for flats.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyIcon}>🏚️</p>
          <p style={styles.emptyText}>No flats found for the selected location.</p>
          <button style={styles.resetBtn} onClick={() => setFilters(INIT_FILTER)}>Clear Filters</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((flat) => (
            <div key={flat._id} style={styles.card}>
              <ImageSlider images={flat.images} image={flat.image} height="190px" onImageClick={openLightbox} />
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <span style={styles.typeBadge}>{flat.type}</span>
                  <RatingBadge flatId={flat._id} />
                </div>
                <h3 style={styles.cardTitle}>
                  {[flat.houseNo, flat.landmark, flat.locality, flat.city, flat.district, flat.state, flat.pincode, flat.country].filter(Boolean).join(", ") || flat.location}
                </h3>
                <p style={styles.cardDesc}>{flat.description}</p>
                {(flat.roomWidth || flat.roomBreadth) && (
                  <p style={styles.cardMeta}>📐 {[flat.roomWidth && `W: ${flat.roomWidth}`, flat.roomBreadth && `B: ${flat.roomBreadth}`].filter(Boolean).join(" × ")}</p>
                )}
                <div style={styles.cardFooter}>
                  <span style={styles.price}>₹{flat.price?.toLocaleString()}<span style={styles.perMonth}>/month</span></span>
                  <Link to={`/flat/${flat._id}`} style={styles.detailBtn}>View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          id="lb-overlay"
          onClick={closeLightbox}
          style={{ ...styles.lightboxOverlay, cursor: lbZoom > 1 ? "zoom-out" : "zoom-in" }}
        >
          <button onClick={closeLightbox} style={styles.lightboxClose}><FiX size={18} /></button>
          <div style={{ position: "fixed", bottom: "22px", right: "22px", display: "flex", gap: "8px", zIndex: 10000 }}>
            <button onClick={(e) => { e.stopPropagation(); setLbZoom((z) => Math.max(1, +(z - 0.25).toFixed(2))); }} style={styles.lbZoomBtn} title="Zoom out">−</button>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "700", minWidth: "40px", textAlign: "center", lineHeight: "36px" }}>{Math.round(lbZoom * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setLbZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }} style={styles.lbZoomBtn} title="Zoom in">+</button>
            {lbZoom > 1 && <button onClick={(e) => { e.stopPropagation(); setLbZoom(1); }} style={{ ...styles.lbZoomBtn, fontSize: "0.7rem", padding: "0 10px", width: "auto" }}>Reset</button>}
          </div>
          <img
            src={lightbox.images[lightbox.idx]}
            alt="full"
            style={{ ...styles.lightboxImg, transform: `scale(${lbZoom})`, transition: "transform 0.2s ease" }}
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: (lb.idx - 1 + lb.images.length) % lb.images.length })); setLbZoom(1); }} style={{ ...styles.lbArrow, left: "16px" }}><FiChevronLeft size={22} /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: (lb.idx + 1) % lb.images.length })); setLbZoom(1); }} style={{ ...styles.lbArrow, right: "16px" }}><FiChevronRight size={22} /></button>
              <div style={styles.lbDots}>
                {lightbox.images.map((_, i) => (
                  <span key={i} onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: i })); setLbZoom(1); }}
                    style={{ ...styles.lbDot, background: i === lightbox.idx ? "#fff" : "rgba(255,255,255,0.35)" }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" },
  searchHero: { background: "linear-gradient(135deg, #1a252f, #2c3e50)", borderRadius: "16px", padding: "48px 24px", textAlign: "center", marginBottom: "28px" },
  searchTitle: { margin: "0 0 8px", fontSize: "1.9rem", color: "#fff" },
  searchSub: { margin: "0 0 16px", color: "#bdc3c7", fontSize: "0.97rem" },
  geoBtn: { display: "inline-flex", alignItems: "center", gap: "8px", margin: "0 auto 20px", padding: "10px 22px", background: "rgba(26,188,156,0.15)", border: "1.5px solid #1abc9c", color: "#1abc9c", borderRadius: "24px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600" },
  geoBtnSpinner: { display: "inline-block", width: "14px", height: "14px", border: "2px solid #1abc9c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  geoError: { color: "#e74c3c", fontSize: "0.82rem", margin: "-10px 0 12px", background: "rgba(231,76,60,0.1)", padding: "6px 14px", borderRadius: "8px", display: "inline-block" },
  locationRow: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", alignItems: "center", maxWidth: "700px", margin: "0 auto" },
  locationField: { flex: 1, minWidth: "160px" },
  locationInput: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "none", outline: "none", fontSize: "0.97rem", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none" },
  clearBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: "8px", padding: "10px 14px", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap" },
  searchCount: { margin: "16px 0 0", color: "#1abc9c", fontWeight: "600", fontSize: "0.95rem" },
  filterBar: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", maxWidth: "700px", margin: "16px auto 0" },
  filterInput: { flex: 1, minWidth: "140px", padding: "10px 12px", fontSize: "0.95rem", borderRadius: "6px", border: "none", outline: "none", background: "rgba(255,255,255,0.95)", color: "#2c3e50" },
  resetBtn: { padding: "10px 18px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" },
  card: { background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", transition: "transform 0.2s" },
  cardBody: { padding: "16px" },
  cardTop: { marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  typeBadge: { background: "#eaf4fb", color: "#2980b9", padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: "600" },
  cardTitle: { margin: "0 0 6px", fontSize: "1.05rem", color: "#2c3e50" },
  cardDesc: { margin: "0 0 8px", fontSize: "0.88rem", color: "#777", lineHeight: "1.5" },
  cardMeta: { margin: "0 0 10px", fontSize: "0.82rem", color: "#888" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: "1.1rem", fontWeight: "700", color: "#2c3e50" },
  perMonth: { fontSize: "0.78rem", fontWeight: "400", color: "#888" },
  detailBtn: { padding: "7px 16px", background: "#1abc9c", color: "#fff", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: "600" },
  emptyBox: { textAlign: "center", padding: "60px 0" },
  emptyIcon: { fontSize: "3rem", margin: "0 0 12px" },
  emptyText: { color: "#888", marginBottom: "16px" },
  lightboxOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
  lightboxImg: { maxWidth: "92vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", cursor: "default" },
  lightboxClose: { position: "fixed", top: "18px", right: "22px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.3rem", width: "38px", height: "38px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 },
  lbArrow: { position: "fixed", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.4rem", width: "46px", height: "46px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 },
  lbDots: { position: "fixed", bottom: "22px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 10000 },
  lbDot: { width: "8px", height: "8px", borderRadius: "50%", cursor: "pointer", transition: "background 0.2s" },
  lbZoomBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.2rem", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, fontWeight: "700" },
};
