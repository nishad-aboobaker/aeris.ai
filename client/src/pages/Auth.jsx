import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user?.is_admin) navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Your diary's been waiting">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
        <Input label="Password" type="password" value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} />
        {error && <p style={{ color: "var(--mood-excited)", fontSize: "0.85rem", fontWeight: 500 }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "1rem" }}>
          New here?{" "}
          <Link to="/register" className="text-gradient" style={{ textDecoration: "none", fontWeight: 500 }}>
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/connect");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Join Aeris" subtitle="Let's set up your diary ">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <Input label="Your Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
        <Input label="Password" type="password" value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} />
        {error && <p style={{ color: "var(--mood-excited)", fontSize: "0.85rem", fontWeight: 500 }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
          {loading ? "Creating..." : "Create account"}
        </button>
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "1rem" }}>
          Already have one?{" "}
          <Link to="/login" className="text-gradient" style={{ textDecoration: "none", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// Connect Telegram page
export function Connect() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!user?.link_token) return;
    navigator.clipboard.writeText(user.link_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tgLink = `https://t.me/aerissai_bot?start=${user?.link_token || ""}`;

  return (
    <AuthLayout title="One last step" subtitle="Connect your Telegram">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
          Aeris lives on Telegram. Open the app to automatically link your account, or manually copy your code.
        </p>

        <div onClick={copyCode} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--accent)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
          <p style={{ color: copied ? "var(--mood-happy)" : "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.25rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: copied ? 600 : 400 }}>
            {copied ? "COPIED TO CLIPBOARD!" : "YOUR LINK CODE (TAP TO COPY)"}
          </p>
          <p className="font-display text-gradient" style={{ fontSize: "2rem", letterSpacing: "0.15em", fontWeight: 700 }}>
            {user?.link_token || "----"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a href={tgLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ flex: 1, padding: "0.8rem", fontSize: "0.95rem" }}>
            Open Telegram
          </a>
          <Link to="/dashboard" className="btn-secondary" style={{ flex: 1, padding: "0.8rem", fontSize: "0.95rem" }}>
            Dashboard →
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", position: "relative" }}>

      {/* Background glow effect */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(94,122,104,0.15) 0%, rgba(0,0,0,0) 70%)", zIndex: -1, pointerEvents: "none" }}></div>

      <Link to="/" style={{ textDecoration: "none", marginBottom: "1.5rem" }}>
        <span className="font-display text-gradient" style={{ fontSize: "2rem", fontWeight: 700, display: "block", textAlign: "center" }}>
          aeris
        </span>
      </Link>

      <div className="glass-panel animate-fade-up" style={{ width: "100%", maxWidth: 420, padding: "2rem" }}>
        <h1 className="font-display" style={{ fontSize: "1.8rem", marginBottom: "0.25rem", color: "var(--text)", fontWeight: 700 }}>
          {title}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {subtitle}
        </p>
        {children}
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="input-label">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        required
      />
    </div>
  );
}
