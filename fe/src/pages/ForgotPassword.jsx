import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiRefreshCw, FiArrowLeft, FiCheckCircle } from "react-icons/fi";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  // Step 1 — send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setStep(2);
      toast.success("OTP sent to your email! 📧");
      startResendTimer();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setError("");
    setOtp(["", "", "", "", "", ""]);
    try {
      await API.post("/auth/forgot-password", { email });
      startResendTimer();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to resend OTP");
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length < 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email, otp: otpValue });
      toast.success("OTP Verified! ✅");
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await API.post("/auth/reset-password", { email, otp: otp.join(""), newPassword: form.newPassword });
      toast.success("Password Reset Successful! 🎉");
      setTimeout(() => navigate("/login"), 1500);
      setStep(4);
    } catch (e) {
      setError(e.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Progress Steps */}
        <div style={styles.steps}>
          {["Email", "OTP", "Password"].map((label, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{ ...styles.stepCircle, background: step > i + 1 ? "#27ae60" : step === i + 1 ? "#2c3e50" : "#ddd", color: step >= i + 1 ? "#fff" : "#aaa" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: step === i + 1 ? "#2c3e50" : "#aaa" }}>{label}</span>
              {i < 2 && <div style={{ ...styles.stepLine, background: step > i + 1 ? "#27ae60" : "#ddd" }} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Email */}
        {step === 1 && (
          <>
            <h2 style={styles.title}>Forgot Password</h2>
            <p style={styles.subtitle}>Enter your registered email to receive an OTP</p>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleSendOTP} style={styles.form}>
              <div style={styles.group}>
                <label style={styles.label}>Email Address</label>
                <input style={styles.input} type="email" placeholder="Enter your email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <>
            <h2 style={styles.title}>Enter OTP</h2>
            <p style={styles.subtitle}>A 6-digit OTP was sent to <strong>{email}</strong></p>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleVerifyOTP} style={styles.form}>
              <div style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    style={{ ...styles.otpBox, borderColor: error ? "#e74c3c" : digit ? "#2c3e50" : "#ddd" }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
            <div style={styles.resendRow}>
              {resendTimer > 0 ? (
                <span style={styles.timerText}>Resend OTP in {resendTimer}s</span>
              ) : (
                <button style={styles.resendBtn} onClick={handleResend}><FiRefreshCw size={13} style={{ marginRight: 4 }} />Resend OTP</button>
              )}
            </div>
          </>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <>
            <h2 style={styles.title}>Set New Password</h2>
            <p style={styles.subtitle}>Choose a strong new password</p>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleResetPassword} style={styles.form}>
              <div style={styles.group}>
                <label style={styles.label}>New Password</label>
                <div style={styles.passwordWrapper}>
                  <input style={{ ...styles.input, paddingRight: "42px" }} placeholder="Enter new password"
                    type={showPassword ? "text" : "password"} value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <div style={styles.group}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    style={{ ...styles.input, paddingRight: "42px", borderColor: form.confirmPassword && form.newPassword !== form.confirmPassword ? "#e74c3c" : "#ddd" }}
                    placeholder="Confirm new password"
                    type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <span style={styles.hint}>Passwords do not match</span>
                )}
              </div>
              <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}><FiCheckCircle size={48} color="#27ae60" /></div>
            <h3 style={{ color: "#27ae60", margin: "12px 0 6px" }}>Password Reset!</h3>
            <p style={{ color: "#888", margin: 0 }}>Redirecting to login...</p>
          </div>
        )}

        {step < 4 && (
          <p style={styles.bottomText}><Link to="/login">← Back to Login</Link></p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)", background: "#f0f2f5" },
  card: { background: "#fff", borderRadius: "12px", padding: "36px", width: "100%", maxWidth: "440px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" },
  steps: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "28px", gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 0 },
  stepCircle: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0 },
  stepLabel: { fontSize: "0.75rem", marginLeft: "6px", marginRight: "4px", fontWeight: "600" },
  stepLine: { width: "32px", height: "2px", margin: "0 4px" },
  title: { margin: "0 0 6px", fontSize: "1.4rem", color: "#2c3e50" },
  subtitle: { margin: "0 0 20px", color: "#888", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#555" },
  input: { padding: "10px 12px", fontSize: "1rem", borderRadius: "6px", border: "1px solid #ddd", outline: "none", width: "100%", boxSizing: "border-box" },
  otpRow: { display: "flex", gap: "10px", justifyContent: "center" },
  otpBox: { width: "46px", height: "54px", textAlign: "center", fontSize: "1.4rem", fontWeight: "bold", borderRadius: "8px", border: "2px solid #ddd", outline: "none", color: "#2c3e50" },
  passwordWrapper: { position: "relative" },
  eyeBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 },
  hint: { fontSize: "0.78rem", color: "#e74c3c" },
  btn: { padding: "11px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", fontWeight: "600" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.9rem" },
  resendRow: { textAlign: "center", marginTop: "12px" },
  timerText: { color: "#888", fontSize: "0.88rem" },
  resendBtn: { background: "transparent", border: "1.5px solid #2c3e50", borderRadius: "6px", color: "#2c3e50", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", padding: "5px 14px" },
  successBox: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: "3rem" },
  bottomText: { textAlign: "center", marginTop: "20px", fontSize: "0.9rem" },
};
