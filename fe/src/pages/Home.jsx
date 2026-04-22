import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";

function useScrollReveal(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
        } else {
          e.target.classList.remove("in-view");
        }
      }),
      { threshold: 0.1 }
    );
    ref.current.querySelectorAll(".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}

const tenantFeatures = [
  { icon: "🔍", title: "Smart Search", desc: "Filter flats by location, price, and type to find exactly what you need." },
  { icon: "📅", title: "Easy Booking", desc: "Book a flat in seconds. Owners get notified and can approve or reject instantly." },
  { icon: "💬", title: "Live Chat", desc: "Chat in real-time with owners using our built-in Socket.io chat." },
  { icon: "⭐", title: "Reviews", desc: "Read honest reviews from verified tenants before making a decision." },
  { icon: "🔒", title: "Secure Auth", desc: "JWT-based authentication with OTP email verification for password reset." },
  { icon: "🖼️", title: "Rich Profiles", desc: "Upload profile pictures, edit your name, and manage your account easily." },
];

const ownerFeatures = [
  { icon: "📋", title: "Easy Listing", desc: "List your flat in minutes with photos, price, type and description." },
  { icon: "✅", title: "Booking Control", desc: "Review every booking request and approve or reject with a single click." },
  { icon: "💬", title: "Direct Chat", desc: "Communicate directly with interested tenants through live chat." },
  { icon: "📊", title: "Owner Dashboard", desc: "Manage all your listings and bookings from one powerful dashboard." },
  { icon: "🔔", title: "Instant Alerts", desc: "Get notified immediately when a tenant books your flat." },
  { icon: "🌍", title: "Wide Reach", desc: "Reach thousands of verified tenants actively searching for flats." },
];

const ownerSteps = [
  { step: "01", title: "List Your Flat", desc: "Add your flat with photos, price, type and a description in just minutes." },
  { step: "02", title: "Receive Bookings", desc: "Tenants send booking requests. You review and approve or reject them." },
  { step: "03", title: "Earn Hassle-Free", desc: "Connect with verified tenants and rent out your property with confidence." },
];

const tenantSteps = [
  { step: "01", title: "Create an Account", desc: "Register as a Tenant to find flats or as an Owner to list your property." },
  { step: "02", title: "Browse Flats", desc: "Explore all available flats. Filter by location, price, and flat type." },
  { step: "03", title: "Book & Connect", desc: "Send a booking request and chat directly with the owner." },
];

export default function Home() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [stats, setStats] = useState({ flatCount: 0, rentedCount: 0, ownerCount: 0, tenantCount: 0, cityCount: 0 });

  useEffect(() => {
    API.get("/flats/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (isOwner) return <OwnerHome user={user} stats={stats} />;
  return <TenantHome user={user} stats={stats} />;
}

function OwnerHome({ user, stats }) {
  const pageRef = useRef(null);
  useScrollReveal(pageRef);
  return (
    <div ref={pageRef}>
      {/* Owner Hero */}
      <section style={ownerStyles.hero}>
        <div style={styles.heroContent}>
          <p style={ownerStyles.badge}>🏡 For Property Owners</p>
          <h1 style={ownerStyles.heroTitle}>
            Turn Your Property Into <span style={ownerStyles.accent}>Passive Income</span>
          </h1>
          <p style={ownerStyles.heroSub}>
            List your flat on FLATKART and connect with thousands of verified tenants looking for their next home.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/dashboard" style={ownerStyles.heroPrimary}>List Your Flat Now</Link>
            <Link to="/dashboard" style={ownerStyles.heroSecondary}>View Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Owner Stats */}
      <section style={ownerStyles.statsBar}>
        {[
          { label: "Active Listings", value: stats.flatCount },
          { label: "Cities Covered", value: stats.cityCount },
          { label: "Verified Tenants", value: stats.tenantCount },
          { label: "Successful Rentals", value: stats.rentedCount },
        ].map((s, i) => (
          <div key={i} style={styles.statItem} className="scroll-reveal" style2={{ transitionDelay: `${i * 0.1}s` }}>
            <span style={ownerStyles.statVal}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* Why list on FLATKART */}
      <section style={ownerStyles.featSection}>
        <div style={styles.inner}>
          <h2 style={styles.sectionTitle} className="scroll-reveal">💼 Why List on FLATKART?</h2>
          <div style={styles.featGrid}>
            {ownerFeatures.map((f, i) => (
              <div key={i} style={ownerStyles.featCard} className="scroll-reveal">
                <div style={ownerStyles.featIconWrap}>{f.icon}</div>
                <h4 style={styles.featTitle}>{f.title}</h4>
                <p style={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works for owners */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle} className="scroll-reveal">🚀 How It Works for Owners</h2>
        <div style={styles.stepsRow}>
          {ownerSteps.map((s, i) => (
            <div key={i} style={ownerStyles.stepCard} className={i % 2 === 0 ? "scroll-reveal-left" : "scroll-reveal-right"}>
              <div style={ownerStyles.stepNum}>{s.step}</div>
              <h4 style={styles.stepTitle}>{s.title}</h4>
              <p style={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner CTA */}
      <section style={ownerStyles.cta} className="scroll-reveal">
        <h2 style={styles.ctaTitle}>Ready to Start Earning?</h2>
        <p style={ownerStyles.ctaSub}>Join hundreds of owners already renting their properties on FLATKART.</p>
        <div style={styles.heroBtns}>
          <Link to="/dashboard" style={ownerStyles.heroPrimary}>🏠 List a Flat Now</Link>
        </div>
      </section>
    </div>
  );
}

function TenantHome({ user, stats }) {
  const pageRef = useRef(null);
  useScrollReveal(pageRef);
  return (
    <div ref={pageRef}>
      {/* Tenant Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Find Your Perfect Flat with <span style={styles.heroAccent}>FLATKART</span></h1>
          <p style={styles.heroSub}>Browse hundreds of verified flats. Book instantly. Chat with owners directly.</p>
          <div style={styles.heroBtns}>
            <Link to="/flats" style={styles.heroPrimary}>Browse Flats</Link>
            {!user && <Link to="/register" style={styles.heroSecondary}>Get Started Free</Link>}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={styles.statsBar}>
        {[
          { label: "Flats Listed", value: stats.flatCount },
          { label: "Cities Covered", value: stats.cityCount },
          { label: "Happy Tenants", value: stats.tenantCount },
          { label: "Verified Owners", value: stats.ownerCount },
        ].map((s, i) => (
          <div key={i} style={styles.statItem} className="scroll-reveal">
            <span style={styles.statVal}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={styles.featSection}>
        <div style={styles.inner}>
          <h2 style={styles.sectionTitle} className="scroll-reveal">✨ Why Choose FLATKART?</h2>
          <div style={styles.featGrid}>
            {tenantFeatures.map((f, i) => (
              <div key={i} style={styles.featCard} className="scroll-reveal">
                <div style={styles.featIconWrap}>{f.icon}</div>
                <h4 style={styles.featTitle}>{f.title}</h4>
                <p style={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle} className="scroll-reveal">🚀 How It Works</h2>
        <div style={styles.stepsRow}>
          {tenantSteps.map((s, i) => (
            <div key={i} style={styles.stepCard} className={i % 2 === 0 ? "scroll-reveal-left" : "scroll-reveal-right"}>
              <div style={styles.stepNum}>{s.step}</div>
              <h4 style={styles.stepTitle}>{s.title}</h4>
              <p style={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta} className="scroll-reveal">
        <h2 style={styles.ctaTitle}>Ready to find your next home?</h2>
        <p style={styles.ctaSub}>Join thousands of tenants and owners on FLATKART today.</p>
        <div style={styles.heroBtns}>
          {!user && <Link to="/register" style={styles.heroPrimary}>Register Now</Link>}
          <Link to="/flats" style={user ? styles.heroPrimary : styles.heroSecondary}>Browse Flats</Link>
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: { background: "linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)", padding: "80px 24px", textAlign: "center" },
  heroContent: { maxWidth: "700px", margin: "0 auto" },
  heroTitle: { fontSize: "2.4rem", color: "#fff", margin: "0 0 16px", lineHeight: 1.3 },
  heroAccent: { color: "#1abc9c" },
  heroSub: { color: "#bdc3c7", fontSize: "1.1rem", margin: "0 0 32px" },
  heroBtns: { display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" },
  heroPrimary: { padding: "12px 28px", background: "#1abc9c", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "1rem" },
  heroSecondary: { padding: "12px 28px", background: "transparent", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "1rem", border: "2px solid rgba(255,255,255,0.3)" },
  statsBar: { display: "flex", justifyContent: "center", flexWrap: "wrap", background: "#2c3e50" },
  statItem: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 48px", borderRight: "1px solid rgba(255,255,255,0.1)" },
  statVal: { fontSize: "1.8rem", fontWeight: "700", color: "#1abc9c" },
  statLabel: { fontSize: "0.85rem", color: "#bdc3c7", marginTop: "4px" },
  featSection: { background: "#f8f9fa", padding: "48px 24px" },
  inner: { maxWidth: "1100px", margin: "0 auto" },
  section: { maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" },
  sectionTitle: { fontSize: "1.6rem", color: "#2c3e50", margin: "0 0 28px", textAlign: "center" },
  featGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" },
  featCard: { background: "#fff", borderRadius: "14px", padding: "28px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderBottom: "3px solid #1abc9c", display: "flex", flexDirection: "column", gap: "10px" },
  featIconWrap: { width: "54px", height: "54px", borderRadius: "14px", background: "#eafaf1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" },
  featIcon: { fontSize: "1.6rem" },
  featTitle: { margin: 0, color: "#2c3e50", fontSize: "1rem", fontWeight: "700" },
  featDesc: { margin: 0, color: "#777", fontSize: "0.88rem", lineHeight: "1.7" },
  stepsRow: { display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" },
  stepCard: { background: "#fff", borderRadius: "10px", padding: "28px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: "1", minWidth: "220px", maxWidth: "300px", textAlign: "center" },
  stepNum: { width: "48px", height: "48px", borderRadius: "50%", background: "#2c3e50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", margin: "0 auto 14px" },
  stepTitle: { margin: "0 0 8px", color: "#2c3e50" },
  stepDesc: { margin: 0, color: "#777", fontSize: "0.88rem", lineHeight: "1.6" },
  cta: { background: "linear-gradient(135deg, #1abc9c, #16a085)", padding: "64px 24px", textAlign: "center" },
  ctaTitle: { fontSize: "2rem", color: "#fff", margin: "0 0 12px" },
  ctaSub: { color: "rgba(255,255,255,0.85)", fontSize: "1rem", margin: "0 0 28px" },
};

const ownerStyles = {
  hero: { background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)", padding: "80px 24px", textAlign: "center" },
  badge: { display: "inline-block", background: "rgba(241,196,15,0.15)", color: "#f1c40f", border: "1px solid rgba(241,196,15,0.3)", padding: "6px 16px", borderRadius: "20px", fontSize: "0.88rem", fontWeight: "600", marginBottom: "16px" },
  heroTitle: { fontSize: "2.4rem", color: "#fff", margin: "0 0 16px", lineHeight: 1.3 },
  accent: { color: "#f1c40f" },
  heroSub: { color: "#bdc3c7", fontSize: "1.1rem", margin: "0 0 32px" },
  heroPrimary: { padding: "12px 28px", background: "#f1c40f", color: "#1a252f", borderRadius: "8px", textDecoration: "none", fontWeight: "700", fontSize: "1rem" },
  heroSecondary: { padding: "12px 28px", background: "transparent", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "1rem", border: "2px solid rgba(255,255,255,0.3)" },
  statsBar: { display: "flex", justifyContent: "center", flexWrap: "wrap", background: "#203a43" },
  statVal: { fontSize: "1.8rem", fontWeight: "700", color: "#f1c40f" },
  featSection: { background: "#f8f9fa", padding: "48px 24px" },
  featCard: { background: "#fff", borderRadius: "14px", padding: "28px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderBottom: "3px solid #f1c40f", display: "flex", flexDirection: "column", gap: "10px" },
  featIconWrap: { width: "54px", height: "54px", borderRadius: "14px", background: "rgba(241,196,15,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" },
  stepCard: { background: "#fff", borderRadius: "10px", padding: "28px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: "1", minWidth: "220px", maxWidth: "300px", textAlign: "center", borderTop: "3px solid #f1c40f" },
  stepNum: { width: "48px", height: "48px", borderRadius: "50%", background: "#f1c40f", color: "#1a252f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", margin: "0 auto 14px" },
  trustSection: { background: "linear-gradient(135deg, #0f2027, #203a43)", padding: "48px 24px" },
  trustGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginTop: "8px" },
  trustCard: { background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "24px", border: "1px solid rgba(255,255,255,0.1)" },
  quote: { color: "#ecf0f1", fontSize: "0.95rem", lineHeight: "1.7", margin: "0 0 12px", fontStyle: "italic" },
  trustName: { color: "#f1c40f", fontWeight: "600", fontSize: "0.88rem", margin: 0 },
  cta: { background: "linear-gradient(135deg, #f1c40f, #f39c12)", padding: "64px 24px", textAlign: "center" },
  ctaSub: { color: "rgba(0,0,0,0.7)", fontSize: "1rem", margin: "0 0 28px" },
};
