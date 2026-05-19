export default function Analytics({ orders, agents }) {
  const total = orders.length;
  const delivered = orders.filter(o => o.status === "delivered").length;
  const pending = orders.filter(o => o.status === "pending").length;
  const assigned = orders.filter(o => o.status === "assigned").length;

  const agentStats = agents.map(agent => ({
    name: agent.name,
    delivered: orders.filter(o => o.assigned_agent_id === agent.id && o.status === "delivered").length,
    status: agent.status,
  }));

  const statBox = (label, value, color) => (
    <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "20px", textAlign: "center", minWidth: "140px" }}>
      <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>{label}</div>
      <div style={{ color, fontSize: "32px", fontWeight: "bold" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: "10px" }}>
      <h2 style={{ color: "#00ff88", marginBottom: "20px" }}>📊 Analytics</h2>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "30px" }}>
        {statBox("Total Orders", total, "#fff")}
        {statBox("Delivered", delivered, "#00ff88")}
        {statBox("Assigned", assigned, "#00aaff")}
        {statBox("Pending", pending, "#ffaa00")}
        {statBox("Success Rate", total > 0 ? `${Math.round((delivered / total) * 100)}%` : "0%", "#00ff88")}
      </div>

      <h3 style={{ color: "#00ff88", marginBottom: "12px" }}>Agent Performance</h3>
      <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px" }}>
        {agents.length === 0 ? <p style={{ color: "#888" }}>No agents data</p> :
          agentStats.map(a => (
            <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #333" }}>
              <span style={{ color: "#ccc" }}>{a.name}</span>
              <span style={{ color: "#888", fontSize: "12px" }}>{a.status}</span>
              <span style={{ color: "#00ff88" }}>{a.delivered} delivered</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}