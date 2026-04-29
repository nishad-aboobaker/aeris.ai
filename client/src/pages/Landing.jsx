import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";

const features = [
  {
    icon: "💬",
    title: "Talk like texting a friend",
    desc: "Aeris reaches out every evening. You just reply naturally — no forms, no prompts, just conversation.",
  },
  {
    icon: "🧠",
    title: "Remembers your world",
    desc: "Tell Aeris about your friends once. Next time you mention them, Aeris already knows who they are.",
  },
  {
    icon: "📔",
    title: "Turns chats into diary",
    desc: "Your conversation gets transformed into a beautiful diary entry — written in your voice, saved forever.",
  },
  {
    icon: "🌙",
    title: "Daily check-in at your time",
    desc: "Every evening at your chosen time, Aeris slides into your Telegram. No app to open.",
  },
];

const moods = ["happy", "excited", "neutral", "sad", "anxious", "mixed"];

export default function Landing() {
  const { user } = useAuthStore();
  
  return (
    <div>
      {/* Nav */}
      <nav style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
        <span className="font-display text-gradient" style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          aeris
        </span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {user ? (
            <Link to={user.is_admin ? "/admin" : "/dashboard"} className="btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
              {user.is_admin ? "Admin Panel" : "Go to Dashboard"}
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "var(--accent)"} onMouseOut={(e) => e.target.style.color = "var(--text)"}>
                Sign In
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="container" style={{ padding: "6rem 0 4rem", textAlign: "center", position: "relative" }}>
        
        {/* Background glow effect */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(179,140,249,0.15) 0%, rgba(0,0,0,0) 70%)", zIndex: -1, pointerEvents: "none" }}></div>

        <div className="animate-fade-up" style={{ opacity: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "2rem", padding: "0.4rem 1.2rem", fontSize: "0.85rem", color: "var(--accent)", marginBottom: "2rem", letterSpacing: "0.05em", fontWeight: 500, backdropFilter: "blur(10px)" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", boxShadow: "var(--accent-glow)", animation: "pulse-glow 2s infinite" }}></span>
            YOUR AI BESTIE DIARY
          </div>
          
          <h1 className="font-display" style={{ fontSize: "clamp(3rem, 7vw, 5rem)", lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.02em", color: "#fff" }}>
            A friend who listens,<br />
            <span className="text-gradient">every single day.</span>
          </h1>
          
          <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 3rem", fontWeight: 400 }}>
            Aeris texts you on Telegram every evening, listens to your day like a
            best friend, and quietly turns it into a diary entry. No apps to open.
            No forms to fill.
          </p>
          
          <Link to="/register" className="btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.1rem" }}>
            Meet Aeris
          </Link>
        </div>
      </section>

      {/* Chat preview */}
      <section className="container" style={{ padding: "2rem 0", display: "flex", justifyContent: "center" }}>
        <div className="glass-panel animate-fade-up delay-100 animate-float" style={{ opacity: 0, padding: "1.5rem", width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)", marginBottom: "0.5rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg-dark)", fontSize: "1.2rem" }}>✨</div>
            <div>
              <p className="font-display" style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", lineHeight: 1 }}>aeris</p>
              <p style={{ fontSize: "0.75rem", color: "var(--accent)" }}>online</p>
            </div>
          </div>

          {[
            { from: "aeris", text: "hey! 🌙 so how was today? tell me everything" },
            { from: "user", text: "omg it was so much fun, met shamna after ages" },
            { from: "aeris", text: "wait shamna from college?? omg how is she doing 👀" },
            { from: "user", text: "yes!! she looks so good, we went to that cafe near her place" },
            { from: "aeris", text: "ahhh i love this!! okay what else happened? 🥹" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", opacity: 0, animation: `fadeInUp 0.5s ease forwards ${0.8 + i * 0.2}s` }}>
              <div style={{
                background: m.from === "user" ? "var(--accent-gradient)" : "rgba(255,255,255,0.05)",
                color: m.from === "user" ? "var(--bg-dark)" : "var(--text)",
                padding: "0.75rem 1.25rem",
                borderRadius: m.from === "user" ? "1.2rem 1.2rem 0.3rem 1.2rem" : "1.2rem 1.2rem 1.2rem 0.3rem",
                fontSize: "0.95rem",
                maxWidth: "85%",
                lineHeight: 1.5,
                fontWeight: m.from === "user" ? 500 : 400,
                border: m.from === "aeris" ? "1px solid var(--border)" : "none",
                boxShadow: m.from === "user" ? "0 4px 15px rgba(179,140,249,0.2)" : "none"
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container" style={{ padding: "6rem 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {features.map((f, i) => (
            <div key={i} className="glass-panel animate-fade-up" style={{ opacity: 0, animationDelay: `${0.2 + i * 0.1}s`, padding: "2rem" }}>
              <div style={{ width: 50, height: 50, borderRadius: "12px", background: "var(--surface-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1.5rem" }}>
                {f.icon}
              </div>
              <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem", color: "#fff" }}>
                {f.title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mood section */}
      <section className="container animate-fade-up" style={{ padding: "4rem 0 8rem", textAlign: "center", opacity: 0, animationDelay: "0.6s" }}>
        <h2 className="font-display" style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#fff" }}>
          Track how you <span className="text-gradient">feel</span> over time
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginBottom: "3rem", maxWidth: 500, margin: "0 auto 3rem" }}>
          Every diary entry carries your mood. Aeris shows you patterns you
          never noticed.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {moods.map((m) => (
            <span key={m} style={{
              background: `rgba(var(--mood-${m}-rgb, 255,255,255), 0.05)`,
              border: `1px solid var(--mood-${m})`,
              color: `var(--mood-${m})`,
              padding: "0.5rem 1.25rem",
              borderRadius: "2rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              boxShadow: `0 0 15px rgba(0,0,0,0.2)`
            }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "2.5rem 2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <span className="font-display text-gradient" style={{ fontSize: "1.2rem", fontWeight: 600, marginRight: "0.5rem" }}>
          aeris
        </span>
        — your personal AI bestie
      </footer>
    </div>
  );
}
