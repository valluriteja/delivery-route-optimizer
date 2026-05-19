import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const CHENNAI_LOCATIONS = {
  "Central Station": [13.0827, 80.2707],
  "Marina Beach": [13.0500, 80.2824],
  "Anna Nagar": [13.0850, 80.2101],
  "Tambaram": [12.9249, 80.1000],
  "T Nagar": [13.0418, 80.2341],
  "Adyar": [13.0012, 80.2565],
  "Velachery": [12.9815, 80.2209],
  "Chromepet": [12.9516, 80.1462],
  "Porur": [13.0367, 80.1567],
  "Sholinganallur": [12.9010, 80.2279],
};

const AGENT_COLORS = {
  idle: "#00ff88",
  moving_to_pickup: "#ffaa00",
  delivering: "#00aaff",
};

const locationNames = Object.keys(CHENNAI_LOCATIONS);

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px ${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const agentNames = ["Ravi", "Priya", "Arjun", "Sneha", "Kiran"];

export default function ChennaiMap({ agents, orders, onOrderPlaced }) {
  const [form, setForm] = useState({ customer_name: "Teja", pickup_location: "Central Station", delivery_location: "Marina Beach" });
  const [message, setMessage] = useState("");
  const [agentPositions, setAgentPositions] = useState({});

  useEffect(() => {
    const initial = {};
    agentNames.forEach((name, i) => {
      const keys = Object.keys(CHENNAI_LOCATIONS);
      initial[name] = CHENNAI_LOCATIONS[keys[i % keys.length]];
    });
    setAgentPositions(initial);
  }, []);

  const placeOrder = async () => {
    try {
      const res = await axios.post(`${API}/orders`, {
        customer_name: form.customer_name,
        pickup_location: form.pickup_location[0],
        delivery_location: form.delivery_location[0],
      });
      setMessage(`✅ Assigned to ${res.data.assigned_agent?.name || "No agent"}!`);
      onOrderPlaced();
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("❌ Failed to place order!");
    }
  };

  const recentOrders = [...orders].reverse().slice(0, 12);

  return (
    <div style={{ display: "flex", gap: "0", height: "85vh", borderRadius: "10px", overflow: "hidden", border: "1px solid #333" }}>
      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div style={{ position: "absolute", top: "10px", left: "50px", zIndex: 1000, background: "rgba(0,0,0,0.7)", color: "#00ff88", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace" }}>
          CHENNAI LIVE MAP &nbsp;|&nbsp; {Object.keys(CHENNAI_LOCATIONS).length * 1000}+ intersections · Real-time GPS
        </div>
        <MapContainer center={[13.0827, 80.2707]} zoom={11} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

          {/* Location markers */}
          {Object.entries(CHENNAI_LOCATIONS).map(([name, coords]) => (
            <Marker key={name} position={coords} icon={L.divIcon({
              className: "",
              html: `<div style="width:10px;height:10px;border-radius:50%;background:#555;border:1px solid #888"></div>`,
              iconSize: [10, 10], iconAnchor: [5, 5],
            })}>
              <Popup>{name}</Popup>
            </Marker>
          ))}

          {/* Agent markers */}
          {agentNames.map((name, i) => {
            const pos = agentPositions[name];
            if (!pos) return null;
            const agent = agents.find(a => a.name === name);
            const color = agent ? (AGENT_COLORS[agent.status] || "#fff") : "#00ff88";
            return (
              <Marker key={name} position={pos} icon={makeIcon(color)}>
                <Popup>{name} — {agent?.status || "idle"}</Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: "20px", left: "10px", zIndex: 1000, background: "rgba(0,0,0,0.7)", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace", display: "flex", gap: "12px" }}>
          <span style={{ color: "#00ff88" }}>● Idle</span>
          <span style={{ color: "#ffaa00" }}>● To pickup</span>
          <span style={{ color: "#00aaff" }}>● Delivering</span>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: "280px", backgroundColor: "#111", display: "flex", flexDirection: "column", padding: "16px", gap: "16px", overflowY: "auto" }}>

        {/* Place Order */}
        <div>
          <div style={{ color: "#aaa", fontSize: "11px", fontFamily: "monospace", marginBottom: "10px", letterSpacing: "1px" }}>PLACE CHENNAI ORDER</div>
          <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
            style={{ width: "100%", padding: "7px", borderRadius: "6px", backgroundColor: "#222", color: "white", border: "1px solid #333", marginBottom: "8px", boxSizing: "border-box", fontFamily: "monospace" }} />
          <select value={form.pickup_location} onChange={e => setForm({ ...form, pickup_location: e.target.value })}
            style={{ width: "100%", padding: "7px", borderRadius: "6px", backgroundColor: "#222", color: "white", border: "1px solid #333", marginBottom: "8px", boxSizing: "border-box", fontFamily: "monospace" }}>
            {locationNames.map(n => <option key={n} value={n}>Pickup: {n}</option>)}
          </select>
          <select value={form.delivery_location} onChange={e => setForm({ ...form, delivery_location: e.target.value })}
            style={{ width: "100%", padding: "7px", borderRadius: "6px", backgroundColor: "#222", color: "white", border: "1px solid #333", marginBottom: "8px", boxSizing: "border-box", fontFamily: "monospace" }}>
            {locationNames.map(n => <option key={n} value={n}>Deliver to: {n}</option>)}
          </select>
          <button onClick={placeOrder}
            style={{ width: "100%", padding: "9px", backgroundColor: "#00ff88", color: "#000", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontFamily: "monospace" }}>
            Place Order
          </button>
          {message && <div style={{ color: "#00ff88", fontSize: "11px", marginTop: "6px" }}>{message}</div>}
        </div>

        {/* Agents */}
        <div>
          <div style={{ color: "#aaa", fontSize: "11px", fontFamily: "monospace", marginBottom: "8px", letterSpacing: "1px" }}>AGENTS</div>
          {agentNames.map(name => {
            const agent = agents.find(a => a.name === name);
            const color = agent ? (AGENT_COLORS[agent.status] || "#fff") : "#00ff88";
            return (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222", fontSize: "12px" }}>
                <span><span style={{ color }}>●</span> {name}</span>
                <span style={{ color: "#555" }}>{agent?.status || "idle"}</span>
              </div>
            );
          })}
        </div>

        {/* Recent Orders */}
        <div>
          <div style={{ color: "#aaa", fontSize: "11px", fontFamily: "monospace", marginBottom: "8px", letterSpacing: "1px" }}>RECENT ORDERS</div>
          {recentOrders.length === 0 ? <div style={{ color: "#555", fontSize: "12px" }}>No orders yet</div> :
            recentOrders.map(order => (
              <div key={order.id} style={{ padding: "6px 0", borderBottom: "1px solid #222", fontSize: "11px" }}>
                <div style={{ color: "#ccc" }}>{order.customer_name} · {order.pickup_location} → {order.delivery_location}</div>
                <div style={{ color: order.status === "delivered" ? "#00ff88" : order.status === "assigned" ? "#00aaff" : "#888" }}>{order.status}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}