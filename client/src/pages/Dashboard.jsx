import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../lib/api";

const moodColors = {
  happy: "var(--mood-happy)",
  excited: "var(--mood-excited)",
  neutral: "var(--mood-neutral)",
  sad: "var(--mood-sad)",
  anxious: "var(--mood-anxious)",
  mixed: "var(--mood-mixed)",
};

const moodEmoji = {
  happy: "😊",
  excited: "🎉",
  neutral: "😐",
  sad: "😔",
  anxious: "😰",
  mixed: "🌀",
};

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Tabs for the Top Nav
  const [tab, setTab] = useState("calendar"); // calendar | memory | settings

  const [promptTime, setPromptTime] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [toast, setToast] = useState(null);

  // Calendar state
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user?.preferences?.daily_prompt_time) {
      setPromptTime(user.preferences.daily_prompt_time);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/entries?limit=100");
        setEntries(data.entries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadEntry = async (date) => {
    try {
      const { data } = await api.get(`/entries/${date}`);
      setSelectedEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDay }).map((_, i) => null);
  const days = Array.from({ length: daysInMonth }).map((_, i) => i + 1);

  const entryMap = entries.reduce((acc, e) => {
    acc[e.date] = e;
    return acc;
  }, {});

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", background: "var(--bg-dark)" }}>
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "var(--text-dark)", padding: "0.75rem 1.5rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: 600, boxShadow: "0 4px 15px rgba(94,122,104,0.3)", zIndex: 100, animation: "fadeInUp 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* Top Nav */}
      <nav className="glass-panel" style={{ margin: "1rem", borderRadius: "1rem", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: "1rem", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <span className="font-display text-gradient" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
            aeris
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["calendar", "memory", "settings"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "0.5rem 1rem",
                  background: tab === t ? "var(--surface-hover)" : "transparent",
                  color: tab === t ? "var(--text)" : "var(--text-muted)",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  transition: "all 0.2s"
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {!user?.telegram_linked && (
            <Link to="/connect" style={{ color: "var(--text-dark)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", background: "var(--accent-gradient)", padding: "0.4rem 1rem", borderRadius: "2rem", display: "flex", alignItems: "center", gap: "0.4rem", boxShadow: "0 2px 10px rgba(94,122,104,0.3)", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <span>⚡</span> Connect Telegram
            </Link>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: "0.9rem", fontWeight: 600 }}>
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <span style={{ color: "var(--text)", fontSize: "0.9rem", fontWeight: 500 }}>
              {user?.name}
            </span>
          </div>
          {user?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              style={{ padding: "0.5rem 1.5rem", borderRadius: "1rem", background: "var(--accent-soft)", border: "1px solid rgba(94,122,104,0.3)", color: "var(--accent)", fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" }}
            >
              Admin
            </button>
          )}
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "1rem", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >  Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: 1000, margin: "0 auto", width: "100%", padding: "2rem" }} className="animate-fade-up">
        {tab === "calendar" && (
          <div className="glass-panel" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
            
            {/* Calendar Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 600, marginBottom: "2rem" }}>
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ←
              </button>
              <h2 className="font-display" style={{ fontSize: "2rem", color: "var(--text)", fontWeight: 600 }}>
                {monthNames[month]} {year}
              </h2>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div style={{ width: "100%", maxWidth: 700 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1rem", marginBottom: "1rem", textAlign: "center", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1rem" }}>
                {blanks.map((_, i) => (
                  <div key={`blank-${i}`} style={{ aspectRatio: "1", borderRadius: "1rem" }}></div>
                ))}
                
                {days.map((d) => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const entry = entryMap[dateStr];
                  const hasEntry = !!entry;
                  const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                  return (
                    <div 
                      key={d} 
                      onClick={() => { if(hasEntry) loadEntry(dateStr); }}
                      style={{ 
                        aspectRatio: "1", 
                        background: hasEntry ? "var(--surface-hover)" : "var(--surface)", 
                        border: isToday ? "2px solid var(--accent)" : `1px solid ${hasEntry ? "rgba(0,0,0,0.15)" : "var(--border)"}`, 
                        borderRadius: "1rem", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        justifyContent: "center",
                        cursor: hasEntry ? "pointer" : "default",
                        boxShadow: hasEntry ? "0 4px 10px rgba(0,0,0,0.02)" : "none",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => { if(hasEntry) e.currentTarget.style.transform = "scale(1.05)" }}
                      onMouseOut={(e) => { if(hasEntry) e.currentTarget.style.transform = "scale(1)" }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: hasEntry ? "var(--text)" : "var(--text-muted)", marginBottom: "0.2rem" }}>
                        {d}
                      </span>
                      {hasEntry && (
                        <span style={{ fontSize: "1.5rem" }}>
                          {moodEmoji[entry.diary_entry?.mood] || "🌀"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "memory" && (
          <div className="glass-panel" style={{ padding: "2rem 3rem" }}>
            <h2 className="font-display" style={{ fontSize: "1.8rem", marginBottom: "2rem" }}>Memory Core</h2>
            <div style={{ display: "flex", gap: "3rem" }}>
              <div style={{ flex: 1 }}>
                <MemorySection title="PEOPLE IN YOUR LIFE" items={user?.people}
                  renderItem={(p) => (
                    <div key={p._id} style={{ background: "var(--surface-solid)", padding: "1rem", borderRadius: "1rem", border: "1px solid var(--border)", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span style={{ color: "var(--text)", fontSize: "1.1rem", fontWeight: 600 }}>{p.name}</span>
                        <span style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", background: "var(--accent-soft)", padding: "0.2rem 0.6rem", borderRadius: "1rem" }}>{p.relation}</span>
                      </div>
                      {p.details && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>{p.details}</p>}
                    </div>
                  )}
                />
              </div>
              <div style={{ flex: 1 }}>
                <MemorySection title="ONGOING IN LIFE" items={user?.ongoing_events?.filter((e) => e.status === "active")}
                  renderItem={(e) => (
                    <div key={e._id} style={{ background: "var(--surface-solid)", padding: "1rem", borderRadius: "1rem", borderLeft: "3px solid var(--accent)", marginBottom: "1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                      <span style={{ color: "var(--text)", fontSize: "1.05rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>{e.title}</span>
                      {e.details && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>{e.details}</p>}
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="glass-panel" style={{ padding: "2rem 3rem", maxWidth: 600, margin: "0 auto" }}>
            <h2 className="font-display" style={{ fontSize: "1.8rem", marginBottom: "2rem" }}>Settings</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>
              DAILY CHECK-IN TIME
            </p>
            <div style={{ background: "var(--surface-solid)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--text)", fontSize: "0.95rem", marginBottom: "1rem", lineHeight: 1.5 }}>
                Choose when Aeris should text you every day on Telegram.
              </p>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <input 
                  type="time" 
                  value={promptTime}
                  onChange={(e) => setPromptTime(e.target.value)}
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-primary" 
                  style={{ padding: "0.8rem 1.5rem", flexShrink: 0 }}
                  disabled={savingPrefs || promptTime === user?.preferences?.daily_prompt_time}
                  onClick={async () => {
                    setSavingPrefs(true);
                    try {
                      await useAuthStore.getState().updatePreferences({ daily_prompt_time: promptTime });
                      showToast("Time saved successfully!");
                    } catch (err) {
                      showToast("Failed to save time.");
                    } finally {
                      setSavingPrefs(false);
                    }
                  }}
                >
                  {savingPrefs ? "..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Entry Modal Popup */}
      {selectedEntry && (
        <div 
          onClick={() => setSelectedEntry(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-up"
            style={{ background: "var(--surface-solid)", width: "100%", maxWidth: 650, maxHeight: "90vh", overflowY: "auto", borderRadius: "1.5rem", padding: "3rem", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
          >
            <button 
              onClick={() => setSelectedEntry(null)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "var(--surface)", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
            >
              ✕
            </button>

            <EntryView entry={selectedEntry} />
          </div>
        </div>
      )}

    </div>
  );
}

function EntryView({ entry }) {
  const moodColor = moodColors[entry.diary_entry?.mood] || "var(--text-muted)";
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
        <div>
          <p style={{ color: "var(--accent)", fontSize: "0.85rem", marginBottom: "0.5rem", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>
            {entry.date}
          </p>
          <h2 className="font-display" style={{ fontSize: "2.2rem", lineHeight: 1.2, color: "var(--text)", fontWeight: 700 }}>
            {entry.diary_entry?.title || "Untitled"}
          </h2>
        </div>
        <div style={{ textAlign: "center", background: "var(--surface-hover)", padding: "1rem", borderRadius: "1rem", minWidth: 90, border: `1px solid rgba(0,0,0,0.05)` }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.25rem" }}>
            {moodEmoji[entry.diary_entry?.mood] || "🌀"}
          </span>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {entry.diary_entry?.mood}
          </p>
        </div>
      </div>

      {entry.diary_entry?.highlights?.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {entry.diary_entry.highlights.map((h, i) => (
            <span key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "2rem", padding: "0.4rem 1rem", fontSize: "0.85rem", color: "var(--text)", fontWeight: 500 }}>
              {h}
            </span>
          ))}
        </div>
      )}

      <div style={{ lineHeight: 1.8, fontSize: "1.1rem", color: "var(--text)", whiteSpace: "pre-wrap", fontWeight: 400 }}>
        {entry.diary_entry?.content}
      </div>

      {entry.diary_entry?.people_mentioned?.length > 0 && (
        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "1rem", fontWeight: 600 }}>
            PEOPLE MENTIONED
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {entry.diary_entry.people_mentioned.map((p, i) => (
              <span key={i} style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(94, 122, 104, 0.2)", borderRadius: "2rem", padding: "0.3rem 1rem", fontSize: "0.85rem", fontWeight: 600 }}>
                @{p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemorySection({ title, items, renderItem }) {
  if (!items?.length) return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.5rem", fontWeight: 600 }}>{title}</p>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>None yet</p>
    </div>
  );
  
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "1rem", fontWeight: 600 }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map(renderItem)}
      </div>
    </div>
  );
}
