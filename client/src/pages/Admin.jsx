import { useState, useEffect } from "react";
import api from "../lib/api";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/admin/users");
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 className="font-display text-gradient" style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>
        Admin Dashboard
      </h1>

      <div className="glass-panel" style={{ borderRadius: "1rem", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>User</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>Telegram</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>Status</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>Last Active</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 600 }}>{u.profile?.name || "Unknown"}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{u.email || "No email"}</div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div>{u.telegram_username ? `@${u.telegram_username}` : "No username"}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{u.telegram_id || "No ID"}</div>
                </td>
                <td style={{ padding: "1rem" }}>
                  {u.onboarding?.completed ? (
                    <span style={{ color: "var(--mood-happy)", fontWeight: 600, fontSize: "0.9rem" }}>Active</span>
                  ) : (
                    <span style={{ color: "var(--mood-anxious)", fontWeight: 600, fontSize: "0.9rem" }}>
                      Onboarding (Step {u.onboarding?.step || 0})
                    </span>
                  )}
                  {u.is_admin && <span style={{ marginLeft: "0.5rem", background: "rgba(179,140,249,0.2)", color: "var(--primary-glow)", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontSize: "0.7rem" }}>ADMIN</span>}
                </td>
                <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {new Date(u.last_active).toLocaleDateString()}
                </td>
                <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
