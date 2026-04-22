import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { FiUser, FiMail, FiLock, FiPhone, FiKey, FiEye, FiEyeOff, FiAlertCircle, FiSearch, FiCalendar, FiMessageSquare, FiStar, FiList, FiCheckSquare, FiBarChart2, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "tenant" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = otp
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const isOwner = form.role === "owner";
  const accent = isOwner ? "#f1c40f" : "#1abc9c";

  const passwordRules = [
    { label: "8–15 characters", test: (p) => p.length >= 8 && p.length <= 15 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const validatePassword = (p) => passwordRules.every((r) => r.test(p));

  const startTimer = () => {
    setResendTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (form.phone.length !== 10) { setError("Please enter a valid 10-digit phone number."); return; }
    if (!validatePassword(form.password)) {
      setError("Password must be 8–15 characters and include uppercase, lowercase, and a special character.");
      return;
    }
    setLoading(true);
    try {
      await API.post("/auth/send-register-otp", { email: form.email, role: form.role, phone: form.phone });
      toast.success(`OTP sent to ${form.email}`);
      setStep(2);
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to Register. Please try after some time");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const otpStr = otp.join("");
    if (otpStr.length < 6) { setError("Please enter the 6-digit Email OTP"); return; }
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", { ...form, otp: otpStr });
      toast.success("Registration Successful! Please login 🎉");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;
    setError("");
    try {
      await API.post("/auth/send-register-otp", { email: form.email, role: form.role, phone: form.phone });
      toast.success("Email OTP resent!");
      setOtp(["", "", "", "", "", ""]);
      startTimer();
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div style={styles.page}>
      {/* Left Panel */}
      <div style={{ ...styles.left, background: isOwner ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" : "linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)" }}>
        <div style={styles.leftContent}>
          <h1 style={{ ...styles.brand, color: accent }}>🏠 FLATKART</h1>
          {isOwner ? (
            <>
              <h2 style={styles.leftTitle}>List & Earn with <span style={{ color: "#f1c40f" }}>FLATKART</span></h2>
              <p style={styles.leftSub}>Join hundreds of property owners earning passive income by listing their flats on FLATKART.</p>
              <div style={styles.features}>
                {["📋 List flats in minutes", "✅ Full booking control", "💬 Chat with tenants", "📊 Powerful dashboard"].map((f, i) => (
                  <div key={i} style={{ ...styles.featureItem, borderLeft: "3px solid #f1c40f" }}><span>{f}</span></div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 style={styles.leftTitle}>Find Your Perfect <span style={{ color: "#1abc9c" }}>Home</span></h2>
              <p style={styles.leftSub}>Join thousands of tenants who found their ideal flat on FLATKART — fast, easy, and verified.</p>
              <div style={styles.features}>
                {["🔍 Smart flat search", "📅 Instant booking", "💬 Live chat with owners", "⭐ Verified reviews"].map((f, i) => (
                  <div key={i} style={styles.featureItem}><span>{f}</span></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.right}>
        <div style={styles.card}>

          {step === 1 ? (
            <>
              <div style={styles.cardHeader}>
                <h2 style={styles.title}>Create Account</h2>
                <p style={styles.subtitle}>Fill in the details to get started</p>
              </div>

              {error && <div style={styles.errorBox}><span>⚠️</span> {error}</div>}

              {/* Role Toggle */}
              <div style={styles.roleToggle}>
                <button type="button"
                  style={{ ...styles.roleBtn, ...(form.role === "tenant" ? styles.roleBtnActive : {}) }}
                  onClick={() => setForm({ ...form, role: "tenant" })}>
                  🏠 Tenant
                </button>
                <button type="button"
                  style={{ ...styles.roleBtn, ...(form.role === "owner" ? styles.roleBtnOwnerActive : {}) }}
                  onClick={() => setForm({ ...form, role: "owner" })}>
                  🏢 Owner
                </button>
              </div>

              <form onSubmit={handleSendOTP} style={styles.form}>
                <div style={styles.group}>
                  <label style={styles.label}>Name</label>
                  <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}><FiUser size={15} /></span>
                    <input style={styles.input} placeholder="Full Name"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()) })} required />
                  </div>
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Email Address</label>
                  <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}><FiMail size={15} /></span>
                    <input style={styles.input} placeholder="Email" type="email"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Phone Number</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}><FiPhone size={15} /></span>
                    <input style={styles.input} placeholder="10-digit mobile number"
                      type="tel"
                      value={form.phone === "" ? "" : "+91 " + form.phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^\+91\s?/, "").replace(/\D/g, "").slice(0, 10);
                        setForm({ ...form, phone: raw });
                      }}
                      required />
                  </div>
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}><FiLock size={15} /></span>
                    <input
                      style={{ ...styles.input, paddingRight: "42px" }}
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div style={styles.pwHints}>
                      {passwordRules.map((r, i) => (
                        <span key={i} style={{ ...styles.pwHint, color: r.test(form.password) ? "#27ae60" : "#e74c3c" }}>
                          {r.test(form.password) ? "✓" : "✗"} {r.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  style={{ ...styles.btn, opacity: loading ? 0.75 : 1, background: isOwner ? "linear-gradient(135deg, #f1c40f, #f39c12)" : "linear-gradient(135deg, #1abc9c, #16a085)", color: isOwner ? "#1a252f" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  type="submit" disabled={loading}>
                  {loading && <Spinner size={18} color={isOwner ? "#1a252f" : "#fff"} />}
                  {loading ? "Verifying Email" : "Register"}
                </button>
              </form>

    

              <div style={styles.dividerRow}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>or</span>
                <span style={styles.dividerLine} />
              </div>

              <Link to="/login" style={styles.signInBtn}>Sign In</Link>
            </>
          ) : (
            <>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.otpIconWrap, background: isOwner ? "rgba(241,196,15,0.12)" : "#eafaf1" }}>
                  <span style={{ fontSize: "2rem" }}>🔐</span>
                </div>
                <h2 style={styles.title}>Verify Your Email</h2>
              </div>

              {error && <div style={styles.errorBox}><span>⚠️</span> {error}</div>}

              <form onSubmit={handleVerifyAndRegister} style={styles.form}>
                {/* Email OTP */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: "700", color: "#444", display: "flex", alignItems: "center", gap: "6px" }}>
                    📧 Email OTP <span style={{ fontWeight: "400", color: "#888", fontSize: "0.8rem" }}>({form.email})</span>
                  </p>
                  <div style={styles.otpRow} onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input key={i} ref={(el) => (otpRefs.current[i] = el)}
                        style={{ ...styles.otpBox, borderColor: digit ? accent : "#e0e0e0", boxShadow: digit ? `0 0 0 3px ${accent}22` : "none" }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0} />
                    ))}
                  </div>
                  <div style={{ textAlign: "right", marginTop: "6px" }}>
                    <button type="button" onClick={handleResendEmail} disabled={resendTimer > 0}
                      style={{ background: "none", border: `1.5px solid ${resendTimer > 0 ? "#aaa" : accent}`, borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", padding: "4px 12px", cursor: resendTimer > 0 ? "default" : "pointer", color: resendTimer > 0 ? "#aaa" : accent }}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : <><FiRefreshCw size={11} style={{ marginRight: 3 }} />Resend</>}
                    </button>
                  </div>
                </div>

                <button
                  style={{ ...styles.btn, opacity: loading ? 0.75 : 1, background: isOwner ? "linear-gradient(135deg, #f1c40f, #f39c12)" : "linear-gradient(135deg, #1abc9c, #16a085)", color: isOwner ? "#1a252f" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  type="submit" disabled={loading}>
                  {loading && <Spinner size={18} color={isOwner ? "#1a252f" : "#fff"} />}
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>
              </form>

<button style={styles.backBtn} onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }} type="button">
                <FiArrowLeft size={14} style={{ marginRight: 4 }} /> Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "calc(100vh - 60px)" },
  left: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" },
  leftContent: { maxWidth: "400px" },
  brand: { fontSize: "1.5rem", margin: "0 0 32px", fontWeight: "800" },
  leftTitle: { color: "#fff", fontSize: "2rem", margin: "0 0 12px", lineHeight: 1.3 },
  leftSub: { color: "#bdc3c7", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 32px" },
  features: { display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: { display: "flex", alignItems: "center", gap: "10px", color: "#ecf0f1", fontSize: "0.95rem", background: "rgba(255,255,255,0.06)", padding: "10px 16px", borderRadius: "8px", borderLeft: "3px solid #1abc9c" },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", padding: "32px 24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" },
  cardHeader: { marginBottom: "20px", textAlign: "center" },
  otpIconWrap: { width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" },
  title: { margin: "0 0 6px", fontSize: "1.7rem", color: "#2c3e50", fontWeight: "700" },
  subtitle: { margin: 0, color: "#888", fontSize: "0.92rem" },
  errorBox: { display: "flex", alignItems: "center", gap: "8px", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.9rem" },
  roleToggle: { display: "flex", background: "#f0f2f5", borderRadius: "10px", padding: "4px", marginBottom: "20px", gap: "4px" },
  roleBtn: { flex: 1, padding: "9px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600", background: "transparent", color: "#888" },
  roleBtnActive: { background: "#fff", color: "#1abc9c", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  roleBtnOwnerActive: { background: "#fff", color: "#f39c12", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", fontSize: "0.95rem", pointerEvents: "none" },
  input: { width: "100%", padding: "11px 12px 11px 38px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", background: "#fafafa" },
  eyeBtn: { position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  btn: { padding: "13px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", letterSpacing: "0.3px", marginTop: "4px" },
  otpRow: { display: "flex", gap: "10px", justifyContent: "center" },
  otpBox: { width: "48px", height: "56px", textAlign: "center", fontSize: "1.5rem", fontWeight: "700", borderRadius: "10px", border: "2px solid #e0e0e0", outline: "none", background: "#fafafa", transition: "border-color 0.2s, box-shadow 0.2s", color: "#2c3e50" },
  resendRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "16px" },
  resendText: { fontSize: "0.88rem", color: "#888" },
  resendBtn: { background: "none", border: "1.5px solid currentColor", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700", padding: "5px 14px", cursor: "pointer", transition: "opacity 0.2s" },
  backBtn: { display: "block", width: "100%", marginTop: "12px", padding: "10px", background: "transparent", color: "#2c3e50", border: "1.5px solid #2c3e50", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "700", textAlign: "center", letterSpacing: "0.2px" },
  pwHints: { display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: "8px" },
  pwHint: { fontSize: "0.78rem", fontWeight: "500" },
  bottomText: { textAlign: "center", margin: "20px 0 0", fontSize: "0.92rem", color: "#666" },
  link: { color: "#1abc9c", fontWeight: "600", textDecoration: "none" },
  dividerRow: { display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" },
  dividerLine: { flex: 1, height: "1px", background: "#e0e0e0" },
  dividerText: { color: "#aaa", fontSize: "0.82rem", fontWeight: "500" },
  signInBtn: { display: "block", textAlign: "center", padding: "13px", background: "linear-gradient(135deg, #2c3e50, #1a252f)", color: "#fff", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700", letterSpacing: "0.3px", textDecoration: "none" },
};
