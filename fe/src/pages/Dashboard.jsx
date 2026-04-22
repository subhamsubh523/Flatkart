import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import ImageSlider from "../components/ImageSlider";
import Cropper from "react-easy-crop";
import { FiStar, FiMapPin, FiMap, FiGlobe, FiMail, FiHome, FiTag, FiDollarSign, FiFileText, FiImage, FiCamera, FiEye, FiEyeOff, FiEdit2, FiTrash2, FiCheck, FiX, FiAlertTriangle, FiChevronLeft, FiChevronRight, FiUnlock, FiSave, FiPlusCircle, FiList, FiBookmark, FiCheckCircle, FiAlertCircle, FiCrop } from "react-icons/fi";

const TABS = ["Overview", "My Flats", "Booking Requests", "Sold Flats", "Customer Reviews"];
const statusColor = { pending: "#f39c12", approved: "#01fc6a", rejected: "#e74c3c", cancelled: "#7f8c8d" };

function FlatReviews({ flatId }) {
  const [reviews, setReviews] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    if (reviews !== null) { setOpen((o) => !o); return; }
    API.get(`/reviews/${flatId}/all`).then(({ data }) => { setReviews(data); setOpen(true); }).catch(() => setReviews([]));
  };

  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ marginTop: "10px", borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
      <button onClick={load} style={revStyles.toggleBtn}>
        <FiStar size={13} style={{ marginRight: 4, color: "#f39c12" }} />
        {avg ? `${avg}/5 · ` : ""}{reviews === null ? "View Reviews" : open ? "Hide Reviews" : `View Reviews (${reviews.length})`}
      </button>
      {open && reviews !== null && (
        reviews.length === 0 ? (
          <p style={revStyles.empty}>No reviews yet.</p>
        ) : (
          <div style={revStyles.list}>
            {reviews.map((r, i) => (
              <div key={i} style={revStyles.item}>
                <div style={revStyles.itemTop}>
                  <span style={revStyles.name}>{r.user_id?.name || "User"}</span>
                  <span style={revStyles.stars}>{"★".repeat(r.rating)}<span style={{ color: "#ddd" }}>{"★".repeat(5 - r.rating)}</span></span>
                </div>
                <p style={revStyles.comment}>{r.comment}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

const revStyles = {
  toggleBtn: { background: "none", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "0.82rem", color: "#555", fontWeight: "600" },
  empty: { margin: "8px 0 0", fontSize: "0.82rem", color: "#aaa" },
  list: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" },
  item: { background: "#f8f9fa", borderRadius: "8px", padding: "10px 12px" },
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  name: { fontSize: "0.82rem", fontWeight: "700", color: "#2c3e50" },
  stars: { color: "#f39c12", fontSize: "0.82rem" },
  comment: { margin: 0, fontSize: "0.8rem", color: "#666", lineHeight: "1.5" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [flats, setFlats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ state: "", district: "", city: "", locality: "", country: "India", pincode: "", landmark: "", houseNo: "", roomWidth: "", roomBreadth: "", price: "", type: "", customType: "", description: "", comments: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [editFlat, setEditFlat] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editMsg, setEditMsg] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [localToast, setLocalToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (text, type = "success") => {
    setLocalToast({ text, type });
    setTimeout(() => setLocalToast(null), 3000);
  };
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      Promise.all([API.get("/flats/mine"), API.get("/bookings/owner"), API.get("/reviews/owner/all")]).then(([f, b, r]) => {
        setFlats(f.data);
        setBookings(b.data);
        setReviews(r.data);
        setDataLoading(false);
      });
    };
    load();
    // Refresh when tab becomes visible so view counts update
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [cropModal, setCropModal] = useState(null); // { index, src }
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const onCropComplete = useCallback((_, area) => setCroppedArea(area), []);

  const openCropModal = (index) => {
    const src = previews[index];
    setCropModal({ index, src });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const applyCrop = async () => {
    if (!cropModal || !croppedArea) return;
    const blob = await getCroppedImg(cropModal.src, croppedArea);
    const newFile = new File([blob], `image_${cropModal.index}.jpg`, { type: "image/jpeg" });
    setImages((prev) => prev.map((f, i) => i === cropModal.index ? newFile : f));
    setPreviews((prev) => prev.map((s, i) => i === cropModal.index ? URL.createObjectURL(blob) : s));
    setCropModal(null);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    const startIndex = images.length;
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    // Open crop modal for the first new image
    setCropModal({ index: startIndex, src: newPreviews[0] });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    const startIndex = images.length;
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    // Open crop modal for the first new image
    setCropModal({ index: startIndex, src: newPreviews[0] });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) { showToast("Please upload at least one image.", "error"); return; }
    if (Number(form.price) < 1000) { showToast("Minimum price is ₹1,000.", "error"); return; }
    setLoading(true);
    const formData = new FormData();
    const { state, district, city, locality, country, pincode, landmark, houseNo, price, customType, ...rest } = form;
    const finalType = rest.type === "Others" ? customType : rest.type;
    formData.append("location", [houseNo, locality, city, district, state].filter(Boolean).join(", "));
    formData.append("state", state);
    formData.append("district", district);
    formData.append("city", city);
    if (locality) formData.append("locality", locality);
    formData.append("price", price);
    if (country) formData.append("country", country);
    if (pincode) formData.append("pincode", pincode);
    if (landmark) formData.append("landmark", landmark);
    if (houseNo) formData.append("houseNo", houseNo);
    Object.entries({ ...rest, type: finalType }).forEach(([k, v]) => formData.append(k, v));
    images.forEach((img) => formData.append("images", img));
    try {
      const { data } = await API.post("/flats", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFlats((prev) => [...prev, data]);
      showToast("Flat listed successfully!");
      setForm({ state: "", district: "", city: "", locality: "", country: "India", pincode: "", landmark: "", houseNo: "", roomWidth: "", roomBreadth: "", price: "", type: "", customType: "", description: "", comments: "" });
      setImages([]);
      setPreviews([]);
      setTab(1);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to list flat.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (flat) => {
    setEditFlat(flat);
    setEditForm({
      state: flat.state || "",
      district: flat.district || "",
      city: flat.city || "",
      locality: flat.locality || "",
      country: "India",
      pincode: flat.pincode || "",
      landmark: flat.landmark || "",
      houseNo: flat.houseNo || "",
      roomWidth: flat.roomWidth || "",
      roomBreadth: flat.roomBreadth || "",
      price: flat.price ? String(flat.price) : "",
      type: flat.type || "",
      customType: "",
      description: flat.description || "",
      comments: flat.comments || "",
    });
    // Load existing images as previews (keep as URLs, not new File objects)
    const existingImgs = (flat.images?.length ? flat.images : flat.image ? [flat.image] : []).map((img) =>
      img.startsWith("http") ? img : `http://localhost:5000/uploads/${img}`
    );
    setEditExistingImages(existingImgs);
    setEditExistingFiles([]);
    setEditNewImages([]);
    setEditNewPreviews([]);
    setEditSliderIdx(0);
    setEditMsg("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editExistingImages.length + editNewImages.length === 0) { showToast("Please keep or upload at least one image.", "error"); return; }
    if (Number(editForm.price) < 1000) { showToast("Minimum price is ₹1,000.", "error"); return; }
    setEditLoading(true);
    setEditMsg("");
    const formData = new FormData();
    const { state, district, city, locality, country, pincode, landmark, houseNo, price, customType, ...rest } = editForm;
    const finalType = rest.type === "Others" ? customType : rest.type;
    formData.append("location", [houseNo, locality, city, district, state].filter(Boolean).join(", "));
    formData.append("state", state);
    formData.append("district", district);
    formData.append("city", city);
    if (locality) formData.append("locality", locality);
    formData.append("price", price);
    if (country) formData.append("country", country);
    if (pincode) formData.append("pincode", pincode);
    if (landmark) formData.append("landmark", landmark);
    if (houseNo) formData.append("houseNo", houseNo);
    Object.entries({ ...rest, type: finalType }).forEach(([k, v]) => formData.append(k, v));
    // Send retained existing image filenames (or cropped replacements)
    editExistingImages.forEach((url, i) => {
      if (editExistingFiles[i]) {
        formData.append("images", editExistingFiles[i]);
      } else {
        const filename = url.split("/uploads/")[1];
        if (filename) formData.append("existingImages", filename);
      }
    });
    editNewImages.forEach((img) => formData.append("images", img));
    try {
      const { data } = await API.put(`/flats/${editFlat._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setFlats((prev) => prev.map((f) => (f._id === data._id ? data : f)));
      showToast("Flat updated successfully!");
      setTimeout(() => setEditFlat(null), 1000);
    } catch {
      showToast("Failed to update flat.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editExistingFiles, setEditExistingFiles] = useState([]);
  const [editNewImages, setEditNewImages] = useState([]);
  const [editNewPreviews, setEditNewPreviews] = useState([]);
  const [editSliderIdx, setEditSliderIdx] = useState(0);
  const [editDragging, setEditDragging] = useState(false);
  const [editCropModal, setEditCropModal] = useState(null);
  const [editCrop, setEditCrop] = useState({ x: 0, y: 0 });
  const [editZoom, setEditZoom] = useState(1);
  const [editCroppedArea, setEditCroppedArea] = useState(null);
  const onEditCropComplete = useCallback((_, area) => setEditCroppedArea(area), []);

  const openEditCropModal = (kind, index, src) => {
    setEditCropModal({ kind, index, src });
    setEditCrop({ x: 0, y: 0 });
    setEditZoom(1);
  };

  const applyEditCrop = async () => {
    if (!editCropModal || !editCroppedArea) return;
    const blob = await getCroppedImg(editCropModal.src, editCroppedArea);
    const newFile = new File([blob], `edit_image_${editCropModal.index}.jpg`, { type: "image/jpeg" });
    const newUrl = URL.createObjectURL(blob);
    if (editCropModal.kind === "existing") {
      setEditExistingImages((prev) => prev.map((s, i) => i === editCropModal.index ? newUrl : s));
      setEditExistingFiles((prev) => { const next = [...prev]; next[editCropModal.index] = newFile; return next; });
    } else {
      setEditNewImages((prev) => prev.map((f, i) => i === editCropModal.index ? newFile : f));
      setEditNewPreviews((prev) => prev.map((s, i) => i === editCropModal.index ? newUrl : s));
    }
    setEditCropModal(null);
  };
  const [deleteConfirmFlat, setDeleteConfirmFlat] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [lbZoom, setLbZoom] = useState(1);
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
      if (e.key === "Escape") { setLightbox(null); setLbZoom(1); }
      if (e.key === "+" || e.key === "=") setLbZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setLbZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const handleDelete = async (id) => {
    await API.delete(`/flats/${id}`);
    setFlats((prev) => prev.filter((f) => f._id !== id));
    setBookings((prev) => prev.filter((b) => (b.flat_id?._id || b.flat_id) !== id));
    setDeleteConfirmFlat(null);
  };

  const updateBooking = async (id, status) => {
    try {
      const { data } = await API.put(`/bookings/${id}`, { status });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: data.status } : b)));
      if (status === "approved" && data.flat_id) {
        setFlats((prev) => prev.map((f) => (f._id === (data.flat_id?._id || data.flat_id) ? { ...f, rented: true } : f)));
      }
      if (status === "rejected" && data.flat_id) {
        setFlats((prev) => prev.map((f) => (f._id === (data.flat_id?._id || data.flat_id) ? { ...f, rented: false } : f)));
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("You are restricted to perform this action. Please contact support.");
      }
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const titleCase = (val) => val.replace(/\b\w/g, (c) => c.toUpperCase());
  const handleBlurCapitalize = (field) => () => {
    if (form[field]) setForm((f) => ({ ...f, [field]: titleCase(f[field]) }));
  };

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.profile}>
          {user?.avatar
            ? <img src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000/uploads/${user.avatar}`} alt={user.name} style={styles.avatarImg} />
            : <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "O"}</div>}
          <div>
            <p style={styles.profileName}>{user?.name || "Owner"}</p>
            <p style={styles.profileRole}>Owner</p>
          </div>
        </div>
        <div style={styles.stats}>
          <div style={styles.statBox}>
            <span style={styles.statNum}>{flats.length}</span>
            <span style={styles.statLabel}>Listings</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statNum}>{pendingCount}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statNum}>{bookings.filter((b) => b.status === "approved").length}</span>
            <span style={styles.statLabel}>Approved</span>
          </div>
        </div>
        <nav style={styles.nav}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ ...styles.navBtn, ...(tab === i ? styles.navBtnActive : {}) }}>
              {t}
              {i === 2 && pendingCount > 0 && (
                <span style={styles.badge}>{pendingCount}</span>
              )}
              {i === 4 && reviews.length > 0 && (
                <span style={styles.badge}>{reviews.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {dataLoading ? <Spinner fullPage color="#1abc9c" /> : (<>
        {/* Overview Tab */}
        {tab === 0 && (
          <div>
            <div style={styles.mainHeader}>
              <div>
                <h2 style={styles.title}>📊 Dashboard Overview</h2>
                <p style={{ margin: "4px 0 0", color: "#888", fontSize: "0.9rem" }}>Your listing summary at a glance</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {[
                { label: "Total Listings",    value: flats.length,                                                icon: "🏠", color: "#3498db" },
                { label: "Visible Listings",  value: flats.filter((f) => f.visible !== false).length,            icon: "👁️", color: "#1abc9c" },
                { label: "Hidden Listings",   value: flats.filter((f) => f.visible === false).length,            icon: "🙈", color: "#636e72" },
                { label: "Rented / Sold",     value: flats.filter((f) => f.rented).length,                       icon: "🏷️", color: "#e67e22" },
                { label: "Available",         value: flats.filter((f) => !f.rented).length,                      icon: "✅", color: "#27ae60" },
                { label: "Total Bookings",    value: bookings.length,                                            icon: "📋", color: "#2c3e50" },
                { label: "Pending Bookings",  value: bookings.filter((b) => b.status === "pending").length,      icon: "⏳", color: "#f39c12" },
                { label: "Approved Bookings", value: bookings.filter((b) => b.status === "approved").length,     icon: "✅", color: "#27ae60" },
                { label: "Rejected Bookings", value: bookings.filter((b) => b.status === "rejected").length,     icon: "❌", color: "#e74c3c" },
                { label: "Total Reviews",     value: reviews.length,                                             icon: "⭐", color: "#f39c12" },
                { label: "Total Views",       value: flats.reduce((s, f) => s + (f.views || 0), 0),              icon: "👀", color: "#9b59b6" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "16px", borderTop: `4px solid ${c.color}` }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.5rem" }}>{c.icon}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "700", color: "#2c3e50" }}>{c.value}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#888", fontWeight: "500" }}>{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Flats Tab */}
        {tab === 1 && (
          <div>
            <div style={styles.mainHeader}>
              <h2 style={styles.title}>My Listings</h2>
            </div>
            {flats.length === 0 ? (
              <div style={styles.empty}>
                <p>No flats listed yet.</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {flats.map((flat) => (
                  <div key={flat._id} style={{ ...styles.flatCard, ...(flat.visible === false ? styles.hiddenCard : {}) }}>
                    <div style={{ position: "relative" }}>
                      <ImageSlider images={flat.images} image={flat.image} height="160px" noImgSize="2rem" onImageClick={openLightbox} />
                      {flat.rented && <div style={styles.soldBanner}>SOLD</div>}
                      {flat.visible === false ? <div style={styles.hiddenBanner}>Hidden</div> : <div style={styles.visibleBanner}>Visible</div>}
                      {flat.visible === false && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", pointerEvents: "none" }} />}
                    </div>
                    <div style={styles.flatBody}>
                      <h3 style={styles.flatLocation}>{flat.location}</h3>
                      <p style={styles.flatMeta}><span style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#aaa", marginRight: 4 }}>Type</span><span style={{ fontWeight: "600", color: "#555" }}>{flat.type}</span></p>
                      <p style={styles.flatPrice}>₹{flat.price}<span style={styles.perMonth}>/month</span></p>
                      {flat.landmark && <p style={styles.flatMeta}><span style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#aaa", marginRight: 4 }}>Landmark</span><span style={{ fontWeight: "600", color: "#555" }}>{flat.landmark}</span></p>}
                      <p style={styles.flatDesc}>{flat.description}</p>
                      {flat.comments && <p style={{ fontSize: "0.8rem", color: "#888", margin: "0 0 8px", background: "#f8f9fa", borderRadius: "6px", padding: "6px 10px", borderLeft: "3px solid #1abc9c" }}>{flat.comments}</p>}
                      <div style={styles.viewCount}><FiEye size={13} style={{ marginRight: 4 }} />{flat.views || 0} view{flat.views !== 1 ? "s" : ""}</div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "nowrap", alignItems: "center" }}>
                          <div
                            style={styles.switchWrap}
                            onClick={(e) => { e.stopPropagation(); API.patch(`/flats/${flat._id}/visibility`).then(({ data }) => { setFlats((prev) => prev.map((f) => f._id === data._id ? data : f)); }); }}
                            title={flat.visible === false ? "Click to make visible" : "Click to hide"}
                          >
                            <div style={{ ...styles.switchTrack, background: flat.visible === false ? "#e74c3c" : "#1abc9c" }}>
                              <div style={{ ...styles.switchKnob, transform: flat.visible === false ? "translateX(2px)" : "translateX(22px)" }} />
                            </div>
                          </div>
                          <span style={{ ...styles.actionIconBtn, background: flat.visible === false ? "#fdf0f0" : "#eafaf1", color: flat.visible === false ? "#e74c3c" : "#27ae60", border: `1.5px solid ${flat.visible === false ? "#e74c3c" : "#27ae60"}` }}>
                            {flat.visible === false ? <><FiEyeOff size={13} style={{ marginRight: 4 }} />Hidden</> : <><FiEye size={13} style={{ marginRight: 4 }} />Visible</>}
                          </span>
                          <button
                            style={{ ...styles.actionIconBtn, background: "#eaf4fb", color: "#2980b9", border: "1.5px solid #2980b9", ...(flat.rented ? styles.disabledBtn : {}) }}
                            onClick={() => !flat.rented && openEdit(flat)}
                            disabled={flat.rented}
                            title="Edit Listing"
                          >
                            <FiEdit2 size={14} style={{ marginRight: 5 }} />Edit
                          </button>
                          <button
                            style={{ ...styles.actionIconBtn, background: "#fdf0f0", color: "#e74c3c", border: "1.5px solid #e74c3c", ...(flat.rented ? styles.disabledBtn : {}) }}
                            onClick={() => !flat.rented && setDeleteConfirmFlat(flat)}
                            disabled={flat.rented}
                            title="Delete Listing"
                          >
                            <FiTrash2 size={14} style={{ marginRight: 5 }} />Delete
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customer Reviews Tab */}
        {tab === 4 && (
          <div>
            <div style={styles.mainHeader}>
              <div>
                <h2 style={styles.title}>Customer Reviews</h2>
                <p style={{ margin: "4px 0 0", color: "#888", fontSize: "0.88rem" }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""} across all your flats</p>
              </div>
            </div>
            {reviews.length === 0 ? (
              <div style={styles.empty}>
                <FiStar size={40} color="#ddd" />
                <p>No reviews yet for your flats.</p>
              </div>
            ) : (
              <div style={styles.reviewList}>
                {reviews.map((r, i) => (
                  <div key={i} style={styles.reviewCard}>
                    <div style={styles.reviewTop}>
                      <div style={styles.reviewAvatar}>
                        {r.user_id?.avatar
                          ? <img src={r.user_id.avatar.startsWith("http") ? r.user_id.avatar : `http://localhost:5000/uploads/${r.user_id.avatar}`} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          : <span>{r.user_id?.name?.[0]?.toUpperCase() || "T"}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={styles.reviewName}>{r.user_id?.name || "Tenant"}</p>
                        <p style={styles.reviewEmail}>{r.user_id?.email || ""}</p>
                      </div>
                      <div style={styles.reviewMeta}>
                        <div style={styles.reviewStars}>
                          {[1,2,3,4,5].map((s) => (
                            <FiStar key={s} size={14} style={{ color: s <= r.rating ? "#f39c12" : "#ddd", fill: s <= r.rating ? "#f39c12" : "none" }} />
                          ))}
                          <span style={styles.reviewRatingNum}>{r.rating}/5</span>
                        </div>
                        <p style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div style={styles.reviewFlatBadge}>
                      <FiHome size={12} style={{ marginRight: 4 }} />{r.flat_id?.location} &nbsp;&middot;&nbsp; {r.flat_id?.type}
                    </div>
                    {r.comment && <p style={styles.reviewComment}>"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* List a Flat Tab */}
        {tab === 5 && (
          <div>
            <div style={styles.mainHeader}>
              <div style={{ textAlign: "center", width: "100%" }}>
                <h2 style={styles.title}>Enter Flat Details</h2>
                <p style={styles.formSubtitle}>Fill in the details below to publish your flat listing</p>
                <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#555" }}>
                  <span style={{ color: "#e74c3c", fontWeight: "700" }}>*</span> Required &nbsp;&nbsp;
                  <span style={{ color: "#27ae60", fontWeight: "700" }}>*</span> Optional
                </p>
              </div>
            </div>
            <div style={styles.formCard}>
              <form onSubmit={handleSubmit} style={styles.form}>

                {/* Section: Location */}
                <div style={styles.sectionHeader}>
                  <FiMapPin size={16} color="#2c3e50" />
                  <span style={styles.sectionTitle}>Location Details</span>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiMap size={13} style={{ marginRight: 4 }} />State <span style={styles.req}>*</span></label>
                    <input style={styles.input} placeholder="State Name" value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })} onBlur={handleBlurCapitalize("state")} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />District <span style={styles.req}>*</span></label>
                    <input style={styles.input} placeholder="District Name" value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })} onBlur={handleBlurCapitalize("district")} required />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />City/Town <span style={styles.req}>*</span></label>
                  <input style={styles.input} placeholder="City/Town Name" value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })} onBlur={handleBlurCapitalize("city")} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiMapPin size={13} style={{ marginRight: 4 }} />Locality <span style={styles.req}>*</span></label>
                  <input style={styles.input} placeholder="Locality Name" value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })} onBlur={handleBlurCapitalize("locality")} required />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiGlobe size={13} style={{ marginRight: 4 }} />Country <span style={styles.opt}></span></label>
                    <input style={{ ...styles.input, background: "#f0f2f5", color: "#888", cursor: "not-allowed" }} value="India" readOnly />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiMail size={13} style={{ marginRight: 4 }} />Pincode <span style={styles.req}>*</span></label>
                    <input style={styles.input} placeholder="Area Code" value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />House No / Qtr No / Plot No <span style={styles.req}>*</span></label>
                    <input style={styles.input} placeholder="House No / Qtr No / Plot No" value={form.houseNo}
                      onChange={(e) => setForm({ ...form, houseNo: e.target.value })} onBlur={handleBlurCapitalize("houseNo")} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiMapPin size={13} style={{ marginRight: 4 }} />Landmark <span style={styles.opt}>*</span></label>
                    <input style={styles.input} placeholder="Nearest Place" value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })} onBlur={handleBlurCapitalize("landmark")} />
                  </div>
                </div>
                {(form.houseNo || form.locality || form.city || form.district || form.state || form.pincode) && (
                  <div style={styles.locationPreview}>
                    <FiMapPin size={13} style={{ marginRight: 4 }} />{[form.houseNo, form.locality, form.city, form.district, form.state, form.pincode, "India"].filter(Boolean).join(", ")}
                  </div>
                )}

                {/* Section: Flat Details */}
                <div style={{ ...styles.sectionHeader, marginTop: "8px" }}>
                  <FiHome size={16} color="#2c3e50" />
                  <span style={styles.sectionTitle}>Flat Details</span>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiTag size={13} style={{ marginRight: 4 }} />Flat Type <span style={styles.req}>*</span></label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "Duplex", "Penthouse", "Quater", "Others"].map((t) => (
                        <button
                          key={t} type="button"
                          style={{ ...styles.typeBtn, ...(form.type === t ? styles.typeBtnActive : {}) }}
                          onClick={() => setForm({ ...form, type: t, customType: "" })}>
                          {t}
                        </button>
                      ))}
                    </div>
                    {form.type === "Others" && (
                      <input style={{ ...styles.input, marginTop: "8px" }} placeholder="Please Specify"
                        value={form.customType || ""}
                        onChange={(e) => setForm({ ...form, customType: e.target.value })} required />
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}><FiDollarSign size={13} style={{ marginRight: 4 }} />Price / Month (₹) <span style={styles.req}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#555", fontWeight: "600", fontSize: "0.97rem", pointerEvents: "none" }}>₹</span>
                      <input
                        style={{ ...styles.input, paddingLeft: "26px" }}
                        placeholder="Selling Amount"
                        type="text"
                        inputMode="numeric"
                        value={form.price ? Number(form.price).toLocaleString("en-IN") : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (raw === "" || /^\d+$/.test(raw)) setForm({ ...form, price: raw });
                        }}
                        onBlur={() => {
                          if (form.price && Number(form.price) < 1000) setForm({ ...form, price: "1000" });
                        }}
                        required
                      />
                    </div>
                    {form.price && Number(form.price) < 1000 && (
                      <span style={{ fontSize: "0.78rem", color: "#e74c3c", fontWeight: "600" }}>Minimum price is ₹1,000</span>
                    )}
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />Room Dimension (in Feet) <span style={styles.opt}>*</span></label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input style={{ ...styles.input, flex: 1 }} placeholder="Width (ft)" value={form.roomWidth}
                      onChange={(e) => setForm({ ...form, roomWidth: e.target.value })} />
                    <span style={{ fontWeight: "700", fontSize: "1.2rem", color: "#888", flexShrink: 0 }}>×</span>
                    <input style={{ ...styles.input, flex: 1 }} placeholder="Breadth (ft)" value={form.roomBreadth}
                      onChange={(e) => setForm({ ...form, roomBreadth: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={styles.label}><FiFileText size={13} style={{ marginRight: 4 }} />Description <span style={styles.opt}>*</span></label>
                    <span style={styles.charCount}>{form.description.length}/500</span>
                  </div>
                  <textarea style={{ ...styles.input, height: "100px" }}
                    placeholder="Detail your Flat Briefly"
                    value={form.description} maxLength={500}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                {/* Section: Image */}
                <div style={{ ...styles.sectionHeader, marginTop: "8px" }}>
                  <FiImage size={16} color="#2c3e50" />
                  <span style={styles.sectionTitle}>Flat Images</span>
                </div>
                <div
                  style={{ ...styles.uploadZone, borderColor: isDragging ? "#1abc9c" : "#d0d0d0", background: isDragging ? "#eafaf1" : "#fafafa" }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <label style={{ display: "block", cursor: "pointer" }}>
                    <div style={styles.uploadPlaceholder}>
                      <FiCamera size={32} color={isDragging ? "#1abc9c" : "#aaa"} />
                      <span style={{ ...styles.uploadText, color: isDragging ? "#1abc9c" : "#555" }}>
                        {isDragging ? "Drop images here" : <>Click or drag & drop images <span style={styles.req}>*</span></>}
                      </span>
                      <span style={styles.uploadHint}>JPG, PNG up to 5MB each · max 10</span>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                </div>
                {previews.length > 0 && (
                  <div style={styles.previewGrid}>
                    {previews.map((src, i) => (
                      <div key={i} style={styles.previewThumb}>
                        <img src={src} alt={`preview-${i}`} style={styles.thumbImg} />
                        <button type="button" style={styles.removeThumb} onClick={() => removeImage(i)}><FiX size={10} /></button>
                        <button type="button" style={styles.editThumb} onClick={() => openCropModal(i)}><FiCrop size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section: Comments */}
                <div style={{ ...styles.sectionHeader, marginTop: "8px" }}>
                  <FiFileText size={16} color="#2c3e50" />
                  <span style={styles.sectionTitle}>Additional Information</span>
                </div>
                <div style={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={styles.label}><FiFileText size={13} style={{ marginRight: 4 }} />Any Comments <span style={styles.opt}>*</span></label>
                    <span style={styles.charCount}>{(form.comments || "").length}/300</span>
                  </div>
                  <textarea style={{ ...styles.input, height: "90px" }}
                    placeholder="Tenant — Rules, Preferences, Availability, Restrictions"
                    value={form.comments || ""} maxLength={300}
                    onChange={(e) => setForm({ ...form, comments: e.target.value })} />
                </div>

                <button style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                  {loading && <Spinner size={18} color="#fff" />}
                  {loading ? "Publishing" : "Publish"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sold Flats Tab */}
        {tab === 3 && (
          <div>
            <div style={styles.mainHeader}>
              <div>
                <h2 style={styles.title}>Sold Flats</h2>
                <p style={{ margin: "4px 0 0", color: "#888", fontSize: "0.88rem" }}>{flats.filter((f) => f.rented).length} flat{flats.filter((f) => f.rented).length !== 1 ? "s" : ""} sold</p>
              </div>
            </div>
            {flats.filter((f) => f.rented).length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "3rem" }}>🏷️</span>
                <p>No sold flats yet.</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {flats.filter((f) => f.rented).map((flat) => (
                  <div key={flat._id} style={styles.soldCard}>
                    <div style={styles.soldImgWrap}>
                      <ImageSlider images={flat.images} image={flat.image} height="160px" noImgSize="2rem" onImageClick={openLightbox} />
                      <div style={styles.soldCornerBadge}><FiCheckCircle size={12} style={{ marginRight: 4 }} />SOLD</div>
                    </div>
                    <div style={styles.flatBody}>
                      <h3 style={styles.flatLocation}>{flat.location}</h3>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "4px 0 6px" }}>
                        <span style={styles.soldTypeBadge}>{flat.type}</span>
                        <span style={styles.soldPriceBadge}>₹{flat.price?.toLocaleString()}/mo</span>
                      </div>
                      <p style={styles.flatDesc}>{flat.description}</p>
                      <div style={styles.soldFooter}>
                        <span style={styles.soldStatusChip}><FiCheck size={12} style={{ marginRight: 4 }} />Successfully Rented</span>
                        <button style={styles.availableBtn} onClick={async () => {
                          const { data } = await API.patch(`/flats/${flat._id}/available`);
                          setFlats((prev) => prev.map((f) => f._id === data._id ? { ...data, rented: false, sold: false } : f));
                          setTab(1);
                        }}><FiUnlock size={13} style={{ marginRight: 4 }} />Sell Again</button>
                      </div>
                      <FlatReviews flatId={flat._id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Requests Tab */}
        {tab === 2 && (
          <div>
            <div style={styles.mainHeader}>
              <div>
                <h2 style={styles.title}>Booking Requests</h2>
                <p style={{ margin: "4px 0 0", color: "#888", fontSize: "0.88rem" }}>{bookings.length} total &nbsp;·&nbsp; {pendingCount} pending</p>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "3rem" }}>📭</span>
                <p>No booking requests yet.</p>
              </div>
            ) : (
              <div style={styles.bookingList}>
                {bookings.map((b) => (
                  <div key={b._id} style={styles.bookingCard}>
                    <div style={styles.bookingImgWrap}>
                      <ImageSlider images={b.flat_id?.images} image={b.flat_id?.image} height="100%" noImgSize="2rem" onImageClick={openLightbox} />
                    </div>
                    <div style={styles.bookingInfo}>
                      <div style={styles.bookingInfoTop}>
                        <div>
                          <h3 style={styles.bookingLocation}>{b.flat_id?.location}</h3>
                          <div style={styles.bookingMeta}>
                            <span style={styles.bookingMetaChip}><FiTag size={11} style={{ marginRight: 3 }} />{b.flat_id?.type}</span>
                            <span style={styles.bookingMetaChip}><FiDollarSign size={11} style={{ marginRight: 3 }} />₹{b.flat_id?.price?.toLocaleString()}/mo</span>
                          </div>
                        </div>
                        <span style={{ ...styles.bookingStatus, background: statusColor[b.status] }}>{b.status}</span>
                      </div>
                      <div style={styles.bookingTenantRow}>
                        <div style={styles.bookingTenantAvatar}>{b.tenant_id?.name?.[0]?.toUpperCase() || "T"}</div>
                        <div>
                          <p style={styles.bookingTenantName}>{b.tenant_id?.name}</p>
                          <p style={styles.bookingTenantEmail}>{b.tenant_id?.email}</p>
                        </div>
                      </div>
                      {b.status === "pending" && (
                        <div style={styles.bookingActions}>
                          <button style={styles.approveBtn} onClick={() => updateBooking(b._id, "approved")}><FiCheck size={14} style={{ marginRight: 4 }} />Approve</button>
                          <button style={styles.rejectBtn} onClick={() => updateBooking(b._id, "rejected")}><FiX size={14} style={{ marginRight: 4 }} />Reject</button>
                        </div>
                      )}
                      {b.status !== "pending" && (
                        <div style={styles.bookingDoneChip}>
                          {b.status === "approved" && <><FiCheckCircle size={13} style={{ marginRight: 4 }} />Approved</>}
                          {b.status === "rejected" && <><FiAlertCircle size={13} style={{ marginRight: 4 }} />Rejected</>}
                          {b.status === "cancelled" && <><FiX size={13} style={{ marginRight: 4 }} />Cancelled by Tenant</>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>)}
      </main>

      {/* Edit Modal */}
      {editFlat && (
        <div style={styles.overlay} onClick={() => setEditFlat(null)}>
          <div style={{ ...styles.modal, maxWidth: "760px", padding: "32px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ textAlign: "center", width: "100%" }}>
                <h2 style={styles.title}><FiEdit2 size={18} style={{ marginRight: 8 }} />Edit Flat Details</h2>
                <p style={styles.formSubtitle}>Update the details below to modify your flat listing</p>
                <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#555" }}>
                  <span style={{ color: "#e74c3c", fontWeight: "700" }}>*</span> Required &nbsp;&nbsp;
                  <span style={{ color: "#27ae60", fontWeight: "700" }}>*</span> Optional
                </p>
              </div>
              <button style={{ ...styles.closeBtn, position: "absolute", top: "16px", right: "20px" }} onClick={() => setEditFlat(null)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={styles.form}>

              {/* Section: Location */}
              <div style={styles.sectionHeader}>
                <FiMapPin size={16} color="#2c3e50" />
                <span style={styles.sectionTitle}>Location Details</span>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiMap size={13} style={{ marginRight: 4 }} />State <span style={styles.req}>*</span></label>
                  <input style={styles.input} placeholder="State Name" value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />District <span style={styles.req}>*</span></label>
                  <input style={styles.input} placeholder="District Name" value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} required />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />City/Town <span style={styles.req}>*</span></label>
                <input style={styles.input} placeholder="City/Town Name" value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}><FiMapPin size={13} style={{ marginRight: 4 }} />Locality <span style={styles.req}>*</span></label>
                <input style={styles.input} placeholder="Locality Name" value={editForm.locality}
                  onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })} required />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiGlobe size={13} style={{ marginRight: 4 }} />Country</label>
                  <input style={{ ...styles.input, background: "#f0f2f5", color: "#888", cursor: "not-allowed" }} value="India" readOnly />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiMail size={13} style={{ marginRight: 4 }} />Pincode <span style={styles.req}>*</span></label>
                  <input style={styles.input} placeholder="Area Code" value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} required />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />House No / Qtr No / Plot No <span style={styles.req}>*</span></label>
                  <input style={styles.input} placeholder="House No / Qtr No / Plot No" value={editForm.houseNo}
                    onChange={(e) => setEditForm({ ...editForm, houseNo: e.target.value })} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiMapPin size={13} style={{ marginRight: 4 }} />Landmark <span style={styles.opt}>*</span></label>
                  <input style={styles.input} placeholder="Nearest Place" value={editForm.landmark}
                    onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })} />
                </div>
              </div>
              {(editForm.houseNo || editForm.locality || editForm.city || editForm.district || editForm.state || editForm.pincode) && (
                <div style={styles.locationPreview}>
                  <FiMapPin size={13} style={{ marginRight: 4 }} />{[editForm.houseNo, editForm.locality, editForm.city, editForm.district, editForm.state, editForm.pincode, "India"].filter(Boolean).join(", ")}
                </div>
              )}

              {/* Section: Flat Details */}
              <div style={{ ...styles.sectionHeader, marginTop: "8px" }}>
                <FiHome size={16} color="#2c3e50" />
                <span style={styles.sectionTitle}>Flat Details</span>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiTag size={13} style={{ marginRight: 4 }} />Flat Type <span style={styles.req}>*</span></label>
                  <div style={styles.typeGrid}>
                    {["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "Duplex", "Penthouse", "Quater", "Others"].map((t) => (
                      <button key={t} type="button"
                        style={{ ...styles.typeBtn, ...(editForm.type === t ? styles.typeBtnActive : {}) }}
                        onClick={() => setEditForm({ ...editForm, type: t, customType: "" })}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {editForm.type === "Others" && (
                    <input style={{ ...styles.input, marginTop: "8px" }} placeholder="Please Specify"
                      value={editForm.customType || ""}
                      onChange={(e) => setEditForm({ ...editForm, customType: e.target.value })} required />
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}><FiDollarSign size={13} style={{ marginRight: 4 }} />Price / Month (₹) <span style={styles.req}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#555", fontWeight: "600", fontSize: "0.97rem", pointerEvents: "none" }}>₹</span>
                    <input
                      style={{ ...styles.input, paddingLeft: "26px" }}
                      placeholder="Selling Amount"
                      type="text"
                      inputMode="numeric"
                      value={editForm.price ? Number(editForm.price).toLocaleString("en-IN") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw === "" || /^\d+$/.test(raw)) setEditForm({ ...editForm, price: raw });
                      }}
                      onBlur={() => {
                        if (editForm.price && Number(editForm.price) < 1000) setEditForm({ ...editForm, price: "1000" });
                      }}
                      required
                    />
                  </div>
                  {editForm.price && Number(editForm.price) < 1000 && (
                    <span style={{ fontSize: "0.78rem", color: "#e74c3c", fontWeight: "600" }}>Minimum price is ₹1,000</span>
                  )}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}><FiHome size={13} style={{ marginRight: 4 }} />Room Dimension (in Feet) <span style={styles.opt}>*</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input style={{ ...styles.input, flex: 1 }} placeholder="Width (ft)" value={editForm.roomWidth}
                    onChange={(e) => setEditForm({ ...editForm, roomWidth: e.target.value })} />
                  <span style={{ fontWeight: "700", fontSize: "1.2rem", color: "#888", flexShrink: 0 }}>×</span>
                  <input style={{ ...styles.input, flex: 1 }} placeholder="Breadth (ft)" value={editForm.roomBreadth}
                    onChange={(e) => setEditForm({ ...editForm, roomBreadth: e.target.value })} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={styles.label}><FiFileText size={13} style={{ marginRight: 4 }} />Description <span style={styles.opt}>*</span></label>
                  <span style={styles.charCount}>{editForm.description.length}/500</span>
                </div>
                <textarea style={{ ...styles.input, height: "100px" }}
                  placeholder="Detail your Flat Briefly"
                  value={editForm.description} maxLength={500}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>

              {/* Section: Images */}
              <div style={{ ...styles.sectionHeader, marginTop: "8px" }}>
                <FiImage size={16} color="#2c3e50" />
                <span style={styles.sectionTitle}>Flat Images</span>
              </div>
              {/* Unified image slider preview */}
              {(editExistingImages.length > 0 || editNewPreviews.length > 0) && (() => {
                const allSrcs = [...editExistingImages, ...editNewPreviews];
                const isExisting = editSliderIdx < editExistingImages.length;
                const relIdx = isExisting ? editSliderIdx : editSliderIdx - editExistingImages.length;
                return (
                  <div>
                    {/* Main preview — contain so full image is visible */}
                    <div style={{ position: "relative", background: "#f0f2f5", borderRadius: "10px", border: "1.5px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", height: "240px", marginBottom: "8px" }}>
                      <img src={allSrcs[editSliderIdx]} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "8px", display: "block" }} />
                      {/* Badge */}
                      <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: "8px", padding: "2px 10px", fontSize: "0.75rem", fontWeight: "700" }}>
                        {editSliderIdx + 1} / {allSrcs.length} · {isExisting ? "existing" : "new"}
                      </span>
                      {/* Crop & Remove */}
                      <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "6px" }}>
                        <button type="button" title="Crop" style={styles.imgActionBtn} onClick={() => openEditCropModal(isExisting ? "existing" : "new", relIdx, allSrcs[editSliderIdx])}><FiCrop size={13} /></button>
                        <button type="button" title="Remove" style={{ ...styles.imgActionBtn, background: "rgba(231,76,60,0.85)" }} onClick={() => {
                          if (isExisting) {
                            setEditExistingImages((prev) => prev.filter((_, i) => i !== relIdx));
                            setEditExistingFiles((prev) => prev.filter((_, i) => i !== relIdx));
                          } else {
                            setEditNewImages((prev) => prev.filter((_, i) => i !== relIdx));
                            setEditNewPreviews((prev) => prev.filter((_, i) => i !== relIdx));
                          }
                          setEditSliderIdx((prev) => Math.max(0, prev - 1));
                        }}><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                    {/* Thumbnail strip */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {allSrcs.map((src, i) => (
                        <div key={i} onClick={() => setEditSliderIdx(i)}
                          style={{ width: "60px", height: "60px", borderRadius: "6px", overflow: "hidden", border: i === editSliderIdx ? "2px solid #1abc9c" : "2px solid #e0e0e0", cursor: "pointer", flexShrink: 0, background: "#f0f2f5" }}>
                          <img src={src} alt={`thumb-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Upload new images */}
              <div
                style={{ ...styles.uploadZone, borderColor: editDragging ? "#1abc9c" : "#d0d0d0", background: editDragging ? "#eafaf1" : "#fafafa" }}
                onDragOver={(e) => { e.preventDefault(); setEditDragging(true); }}
                onDragLeave={() => setEditDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setEditDragging(false);
                  const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
                  if (!files.length) return;
                  const newPrevs = files.map((f) => URL.createObjectURL(f));
                  const firstNewIdx = editExistingImages.length + editNewPreviews.length;
                  setEditNewImages((prev) => [...prev, ...files]);
                  setEditNewPreviews((prev) => [...prev, ...newPrevs]);
                  setEditSliderIdx(firstNewIdx);
                  openEditCropModal("new", editNewPreviews.length, newPrevs[0]);
                }}
              >
                <label style={{ display: "block", cursor: "pointer" }}>
                  <div style={styles.uploadPlaceholder}>
                    <FiCamera size={32} color={editDragging ? "#1abc9c" : "#aaa"} />
                    <span style={{ ...styles.uploadText, color: editDragging ? "#1abc9c" : "#555" }}>
                      {editDragging ? "Drop images here" : "Click or drag & drop to add more images"}
                    </span>
                    <span style={styles.uploadHint}>JPG, PNG up to 5MB each · max 10</span>
                  </div>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (!files.length) return;
                    const newPrevs = files.map((f) => URL.createObjectURL(f));
                    const firstNewIdx = editExistingImages.length + editNewPreviews.length;
                    setEditNewImages((prev) => [...prev, ...files]);
                    setEditNewPreviews((prev) => [...prev, ...newPrevs]);
                    setEditSliderIdx(firstNewIdx);
                    openEditCropModal("new", editNewPreviews.length, newPrevs[0]);
                  }} />
                </label>
              </div>

              {/* Section: Comments */}
              <div style={{ ...styles.sectionHeader, marginTop: "8px" }}>
                <FiFileText size={16} color="#2c3e50" />
                <span style={styles.sectionTitle}>Additional Information</span>
              </div>
              <div style={styles.formGroup}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={styles.label}><FiFileText size={13} style={{ marginRight: 4 }} />Any Comments <span style={styles.opt}>*</span></label>
                  <span style={styles.charCount}>{(editForm.comments || "").length}/300</span>
                </div>
                <textarea style={{ ...styles.input, height: "90px" }}
                  placeholder="Tenant — Rules, Preferences, Availability, Restrictions"
                  value={editForm.comments || ""} maxLength={300}
                  onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })} />
              </div>

              <button style={{ ...styles.submitBtn, opacity: editLoading ? 0.7 : 1 }} type="submit" disabled={editLoading}>
                {editLoading && <Spinner size={18} color="#fff" />}
                {editLoading ? "Saving..." : <><FiSave size={15} style={{ marginRight: 6 }} />Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {localToast && (
        <div style={{ ...styles.toast, background: localToast.type === "success" ? "#27ae60" : "#e74c3c" }}>
          {localToast.type === "success" ? <FiCheck size={15} style={{ marginRight: 6 }} /> : <FiAlertTriangle size={15} style={{ marginRight: 6 }} />}{localToast.text}
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
          {/* Zoom controls */}
          <div style={{ position: "fixed", bottom: "22px", right: "22px", display: "flex", gap: "8px", zIndex: 10000 }}>
            <button onClick={(e) => { e.stopPropagation(); setLbZoom((z) => Math.max(1, +(z - 0.25).toFixed(2))); }} style={lbStyles.zoomBtn} title="Zoom out">−</button>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "700", minWidth: "40px", textAlign: "center", lineHeight: "36px" }}>{Math.round(lbZoom * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setLbZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }} style={lbStyles.zoomBtn} title="Zoom in">+</button>
            {lbZoom > 1 && <button onClick={(e) => { e.stopPropagation(); setLbZoom(1); }} style={{ ...lbStyles.zoomBtn, fontSize: "0.7rem", padding: "0 10px", width: "auto" }} title="Reset">Reset</button>}
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

      {/* Edit Image Crop Modal */}
      {editCropModal && (
        <div style={{ ...styles.overlay, zIndex: 1100 }} onClick={() => setEditCropModal(null)}>
          <div style={{ ...styles.modal, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><FiCrop size={16} style={{ marginRight: 6 }} />Preview & Crop Image</h3>
              <button style={styles.closeBtn} onClick={() => setEditCropModal(null)}><FiX size={14} /></button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#888" }}>Drag to reposition · Use slider to zoom · Click "Use as is" to skip cropping</p>
            <div style={{ position: "relative", width: "100%", height: "340px", background: "#111", borderRadius: "10px", overflow: "hidden" }}>
              <Cropper
                image={editCropModal.src}
                crop={editCrop}
                zoom={editZoom}
                aspect={4 / 3}
                onCropChange={setEditCrop}
                onZoomChange={setEditZoom}
                onCropComplete={onEditCropComplete}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 4px" }}>
              <span style={{ fontSize: "0.85rem", color: "#555", whiteSpace: "nowrap" }}>Zoom</span>
              <input type="range" min={1} max={3} step={0.05} value={editZoom}
                onChange={(e) => setEditZoom(Number(e.target.value))} style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button style={{ ...styles.submitBtn, background: "#f0f2f5", color: "#555", flex: 1 }} type="button" onClick={() => setEditCropModal(null)}>Use as is</button>
              <button style={{ ...styles.submitBtn, flex: 1 }} type="button" onClick={applyEditCrop}><FiCrop size={15} style={{ marginRight: 6 }} />Apply Crop</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropModal && (
        <div style={styles.overlay} onClick={() => setCropModal(null)}>
          <div style={{ ...styles.modal, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><FiCrop size={16} style={{ marginRight: 6 }} />Preview & Crop Image</h3>
              <button style={styles.closeBtn} onClick={() => setCropModal(null)}><FiX size={14} /></button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#888" }}>Drag to reposition · Use slider to zoom · Click "Use as is" to skip cropping</p>
            <div style={{ position: "relative", width: "100%", height: "340px", background: "#111", borderRadius: "10px", overflow: "hidden" }}>
              <Cropper
                image={cropModal.src}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 4px" }}>
              <span style={{ fontSize: "0.85rem", color: "#555", whiteSpace: "nowrap" }}>Zoom</span>
              <input type="range" min={1} max={3} step={0.05} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button style={{ ...styles.submitBtn, background: "#f0f2f5", color: "#555", flex: 1 }} type="button" onClick={() => setCropModal(null)}>Use as is</button>
              <button style={{ ...styles.submitBtn, flex: 1 }} type="button" onClick={applyCrop}>Apply Crop</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteConfirmFlat && (
        <div style={styles.overlay} onClick={() => setDeleteConfirmFlat(null)}>
          <div style={styles.deletePopup} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIconWrap}>
              <FiTrash2 size={32} color="#e74c3c" />
            </div>
            <h3 style={styles.deleteTitle}>Delete Listing?</h3>
            <p style={styles.deleteLocation}>{deleteConfirmFlat.location}</p>
            <p style={styles.deleteDesc}>This will permanently remove the flat from all listings. This action <strong>cannot be undone</strong>.</p>
            <div style={styles.deleteMeta}>
              <span style={styles.deleteMetaItem}><FiTag size={12} style={{ marginRight: 4 }} />{deleteConfirmFlat.type}</span>
              <span style={styles.deleteMetaItem}>₹{deleteConfirmFlat.price?.toLocaleString()}/month</span>
            </div>
            <div style={styles.deleteActions}>
              <button style={styles.deleteCancelBtn} onClick={() => setDeleteConfirmFlat(null)}>Cancel</button>
              <button style={styles.deleteConfirmBtn} onClick={() => handleDelete(deleteConfirmFlat._id)}><FiTrash2 size={14} style={{ marginRight: 6 }} />Confirm</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

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
  page: { display: "flex", minHeight: "calc(100vh - 50px)", background: "#f0f2f5" },
  sidebar: { width: "240px", background: "#2c3e50", color: "#fff", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "24px", flexShrink: 0 },
  profile: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "44px", height: "44px", borderRadius: "50%", background: "#1abc9c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold", flexShrink: 0 },
  avatarImg: { width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #1abc9c" },
  profileName: { margin: 0, fontWeight: "bold", fontSize: "0.95rem" },
  profileRole: { margin: 0, fontSize: "0.75rem", color: "#95a5a6" },
  stats: { display: "flex", justifyContent: "space-between" },
  statBox: { display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 12px" },
  statNum: { fontSize: "1.4rem", fontWeight: "bold", color: "#1abc9c" },
  statLabel: { fontSize: "0.7rem", color: "#bdc3c7", marginTop: "2px" },
  nav: { display: "flex", flexDirection: "column", gap: "6px" },
  navBtn: { background: "none", border: "none", color: "#bdc3c7", padding: "10px 14px", borderRadius: "6px", cursor: "pointer", textAlign: "left", fontSize: "0.95rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navBtnActive: { background: "rgba(255,255,255,0.12)", color: "#fff" },
  badge: { background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "0.75rem" },
  main: { flex: 1, padding: "32px" },
  mainHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { margin: 0, fontSize: "1.4rem", color: "#2c3e50" },
  addBtn: { padding: "10px 20px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.95rem" },
  empty: { textAlign: "center", padding: "60px 0", color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  flatCard: { background: "#fff", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", position: "relative" },
  flatImg: { width: "100%", height: "160px", objectFit: "cover" },
  noImg: { height: "160px", background: "#ecf0f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" },
  flatBody: { padding: "14px" },
  flatLocation: { margin: "0 0 4px", fontSize: "1rem" },
  flatMeta: { color: "#888", fontSize: "0.85rem", margin: "2px 0" },
  flatPrice: { fontSize: "1.1rem", fontWeight: "bold", color: "#2c3e50", margin: "6px 0" },
  perMonth: { fontSize: "0.8rem", fontWeight: "normal", color: "#888" },
  flatDesc: { fontSize: "0.82rem", color: "#999", margin: "4px 0 10px", fontStyle: "italic", lineHeight: "1.5" },
  viewCount: { fontSize: "0.8rem", color: "#1abc9c", fontWeight: "600", marginBottom: "10px" },
  soldCard: { background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: "1px solid #eafaf1", position: "relative" },
  soldImgWrap: { position: "relative" },
  soldCornerBadge: { position: "absolute", top: "10px", left: "10px", background: "#27ae60", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: "700", fontSize: "0.78rem", letterSpacing: "1px", boxShadow: "0 2px 8px rgba(39,174,96,0.4)" },
  soldTypeBadge: { background: "#eaf4fb", color: "#2980b9", padding: "2px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: "600" },
  soldPriceBadge: { background: "#eafaf1", color: "#27ae60", padding: "2px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: "700" },
  soldFooter: { marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  soldStatusChip: { background: "linear-gradient(135deg, #eafaf1, #d5f5e3)", color: "#1e8449", padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600", border: "1px solid #a9dfbf", display: "inline-block" },
  hiddenCard: { border: "2px dashed #bdc3c7", background: "#f0f2f5" },
  hiddenBanner: { position: "absolute", top: "12px", right: "12px", background: "#636e72", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", letterSpacing: "1px" },
  visibleBanner: { position: "absolute", top: "12px", right: "12px", background: "#1abc9c", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", letterSpacing: "1px" },
  soldBanner: { position: "absolute", top: "12px", left: "12px", background: "#e74c3c", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", letterSpacing: "1px" },
  switchWrap: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" },
  switchTrack: { width: "44px", height: "24px", borderRadius: "12px", position: "relative", transition: "background 0.3s ease", flexShrink: 0 },
  switchKnob: { position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", transition: "transform 0.3s ease" },
  switchLabel: { fontSize: "0.78rem", fontWeight: "700", transition: "color 0.3s" },
  imgActionBtn: { background: "rgba(26,188,156,0.85)", color: "#fff", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  sliderArrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, padding: 0 },
  galleryArrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, padding: 0, lineHeight: 1 },
  actionIconBtn: { display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: "20px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", transition: "opacity 0.15s, transform 0.1s", letterSpacing: "0.2px", whiteSpace: "nowrap" },
  visibleBtn: { padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", border: "none", pointerEvents: "auto" },
  availableBtn: { background: "none", border: "1px solid #1abc9c", color: "#1abc9c", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  disabledBtn: { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" },
  editBtn: { background: "none", border: "1px solid #1abc9c", color: "#1abc9c", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" },
  deleteBtn: { background: "none", border: "1px solid #e74c3c", color: "#e74c3c", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto", position: "relative" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  typeGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  modalTitle: { margin: 0, fontSize: "1.15rem", color: "#2c3e50" },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#888" },
  formCard: { background: "#fff", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxWidth: "720px", margin: "0 auto" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  formRow: { display: "flex", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  input: { padding: "10px 12px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", resize: "vertical", outline: "none", background: "#fafafa", transition: "border-color 0.2s" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f0f2f5", paddingBottom: "8px" },
  sectionIcon: { fontSize: "1rem", display: "flex" },
  req: { color: "#e74c3c", fontWeight: "700" },
  opt: { color: "#27ae60", fontWeight: "700" },
  typeBtn: { padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", background: "#fafafa", color: "#555", fontSize: "0.88rem", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" },
  typeBtnActive: { background: "#2c3e50", color: "#fff", border: "1.5px solid #2c3e50", boxShadow: "0 2px 8px rgba(44,62,80,0.25)" },
  sectionTitle: { fontSize: "0.9rem", fontWeight: "700", color: "#2c3e50", textTransform: "uppercase", letterSpacing: "0.5px" },
  locationPreview: { background: "#eafaf1", border: "1px solid #a9dfbf", borderRadius: "8px", padding: "8px 14px", fontSize: "0.88rem", color: "#27ae60", fontWeight: "600" },
  charCount: { fontSize: "0.78rem", color: "#aaa" },
  uploadZone: { display: "block", border: "2px dashed #d0d0d0", borderRadius: "10px", cursor: "pointer", overflow: "hidden", background: "#fafafa", transition: "border-color 0.2s" },
  uploadPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", padding: "32px" },
  uploadText: { fontSize: "0.95rem", fontWeight: "600", color: "#555" },
  uploadHint: { fontSize: "0.8rem", color: "#aaa" },
  preview: { width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" },
  removeImg: { background: "none", border: "1px solid #e74c3c", color: "#e74c3c", padding: "5px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", alignSelf: "flex-start" },
  previewGrid: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" },
  previewThumb: { position: "relative", width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #e0e0e0" },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  removeThumb: { position: "absolute", top: "3px", right: "3px", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  editThumb: { position: "absolute", bottom: "3px", right: "3px", background: "rgba(26,188,156,0.85)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  submitBtn: { padding: "13px", background: "linear-gradient(135deg, #2c3e50, #1a252f)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" },
  formSubtitle: { margin: "4px 0 0", color: "#888", fontSize: "0.88rem" },
  msgBox: { padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem", fontWeight: "500" },
  toast: { position: "fixed", bottom: "28px", right: "28px", color: "#fff", padding: "14px 22px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: "600", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 9999, animation: "fadeIn 0.2s ease" },
  fileInput: { fontSize: "0.9rem" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  thead: { background: "#2c3e50" },
  th: { padding: "12px 16px", color: "#fff", textAlign: "left", fontSize: "0.85rem", fontWeight: "600" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "12px 16px", fontSize: "0.9rem", color: "#444" },
  statusBadge: { padding: "3px 10px", borderRadius: "12px", color: "#fff", fontSize: "0.8rem", fontWeight: "600" },
  actionBtn: { padding: "5px 12px", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.82rem" },
  bookingList: { display: "flex", flexDirection: "column", gap: "16px" },
  reviewList: { display: "flex", flexDirection: "column", gap: "16px" },
  reviewCard: { background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "12px" },
  reviewTop: { display: "flex", alignItems: "center", gap: "12px" },
  reviewAvatar: { width: "42px", height: "42px", borderRadius: "50%", background: "#2c3e50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", flexShrink: 0, overflow: "hidden" },
  reviewName: { margin: 0, fontWeight: "700", fontSize: "0.95rem", color: "#2c3e50" },
  reviewEmail: { margin: "2px 0 0", fontSize: "0.8rem", color: "#888" },
  reviewMeta: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 },
  reviewStars: { display: "flex", alignItems: "center", gap: "3px" },
  reviewRatingNum: { fontSize: "0.82rem", fontWeight: "700", color: "#f39c12", marginLeft: "4px" },
  reviewDate: { margin: 0, fontSize: "0.75rem", color: "#bbb" },
  reviewFlatBadge: { display: "inline-flex", alignItems: "center", background: "#f0f2f5", color: "#555", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" },
  reviewComment: { margin: 0, fontSize: "0.9rem", color: "#555", lineHeight: "1.7", fontStyle: "italic", borderLeft: "3px solid #1abc9c", paddingLeft: "12px" },
  bookingCard: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", overflow: "hidden" },
  bookingImgWrap: { width: "130px", flexShrink: 0 },
  bookingImg: { width: "100%", height: "100%", objectFit: "cover" },
  bookingNoImg: { width: "100%", height: "100%", minHeight: "120px", background: "#ecf0f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" },
  bookingInfo: { flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" },
  bookingInfoTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bookingLocation: { margin: "0 0 6px", fontSize: "1rem", color: "#2c3e50", fontWeight: "700" },
  bookingMeta: { display: "flex", gap: "8px", flexWrap: "wrap" },
  bookingMetaChip: { background: "#f0f2f5", color: "#555", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" },
  bookingStatus: { color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", flexShrink: 0 },
  bookingTenantRow: { display: "flex", alignItems: "center", gap: "10px" },
  bookingTenantAvatar: { width: "34px", height: "34px", borderRadius: "50%", background: "#2c3e50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 },
  bookingTenantName: { margin: 0, fontWeight: "600", fontSize: "0.88rem", color: "#2c3e50" },
  bookingTenantEmail: { margin: 0, fontSize: "0.8rem", color: "#888" },
  bookingActions: { display: "flex", gap: "10px" },
  approveBtn: { padding: "7px 18px", background: "linear-gradient(135deg, #27ae60, #1e8449)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  rejectBtn: { padding: "7px 18px", background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  bookingDoneChip: { display: "inline-block", background: "#f0f2f5", color: "#666", padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600" },
  deletePopup: { background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", textAlign: "center" },
  deleteIconWrap: { width: "72px", height: "72px", borderRadius: "50%", background: "#fdf0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  deleteIcon: { fontSize: "2rem" },
  deleteTitle: { margin: "0 0 6px", fontSize: "1.4rem", color: "#2c3e50", fontWeight: "700" },
  deleteLocation: { margin: "0 0 10px", color: "#e74c3c", fontWeight: "600", fontSize: "0.97rem" },
  deleteDesc: { color: "#777", fontSize: "0.88rem", lineHeight: "1.6", margin: "0 0 18px" },
  deleteMeta: { display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" },
  deleteMetaItem: { background: "#f0f2f5", padding: "5px 14px", borderRadius: "20px", fontSize: "0.83rem", fontWeight: "600", color: "#2c3e50" },
  deleteActions: { display: "flex", gap: "12px" },
  deleteCancelBtn: { flex: 1, padding: "11px", background: "#f0f2f5", color: "#555", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600" },
  deleteConfirmBtn: { flex: 1, padding: "11px", background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "700" },
};

const lbStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" },
  img: { maxWidth: "92vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", cursor: "default" },
  close: { position: "fixed", top: "18px", right: "22px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.3rem", width: "38px", height: "38px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 },
  arrow: { position: "fixed", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.4rem", width: "46px", height: "46px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 },
  dots: { position: "fixed", bottom: "22px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 10000 },
  dot: { width: "8px", height: "8px", borderRadius: "50%", cursor: "pointer", transition: "background 0.2s" },
  zoomBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.2rem", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, fontWeight: "700" },
};
