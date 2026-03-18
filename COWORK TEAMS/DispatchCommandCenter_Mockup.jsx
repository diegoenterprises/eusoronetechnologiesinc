import { useState, useEffect } from "react";

// === MOCK DATA (what real tRPC queries would return) ===
const DRIVERS = [
  { id: 1, name: "Marcus Johnson", status: "available", hosRemaining: 9.5, endorsements: ["H","N","X"], equipment: "MC-306", safetyScore: 94, totalLoads: 287, onTimeRate: 96, currentLoad: null, distance: 12 },
  { id: 2, name: "David Chen", status: "on_load", hosRemaining: 5.2, endorsements: ["H","N","X"], equipment: "DOT-407", safetyScore: 91, totalLoads: 204, onTimeRate: 93, currentLoad: "LD-00158", distance: null },
  { id: 3, name: "Carlos Rivera", status: "available", hosRemaining: 11.0, endorsements: ["H","N","X","T"], equipment: "MC-331", safetyScore: 97, totalLoads: 412, onTimeRate: 98, currentLoad: null, distance: 28 },
  { id: 4, name: "James Wright", status: "break", hosRemaining: 0, endorsements: ["H","N"], equipment: "MC-306", safetyScore: 88, totalLoads: 156, onTimeRate: 89, currentLoad: null, distance: 45 },
  { id: 5, name: "Tony Martinez", status: "on_load", hosRemaining: 3.1, endorsements: ["H","N","X"], equipment: "DOT-407", safetyScore: 92, totalLoads: 331, onTimeRate: 95, currentLoad: "LD-00161", distance: null },
  { id: 6, name: "Bobby Lee", status: "off_duty", hosRemaining: 11.0, endorsements: ["N"], equipment: "food_grade_tank", safetyScore: 90, totalLoads: 89, onTimeRate: 91, currentLoad: null, distance: null },
  { id: 7, name: "Terrence Hall", status: "available", hosRemaining: 7.8, endorsements: ["H","N","X"], equipment: "MC-312", safetyScore: 95, totalLoads: 265, onTimeRate: 97, currentLoad: null, distance: 8 },
];

const LOADS = [
  { id: 1, number: "LD-00162", status: "unassigned", origin: "Cushing, OK", dest: "Houston, TX", cargo: "WTI Crude", hazmat: "Class 3", rate: 2850, trailer: "MC-306", pickup: "Today 2:00 PM", priority: "urgent" },
  { id: 2, number: "LD-00163", status: "unassigned", origin: "Midland, TX", dest: "Corpus Christi, TX", cargo: "Permian Basin", hazmat: "Class 3", rate: 1920, trailer: "DOT-407", pickup: "Today 4:00 PM", priority: "normal" },
  { id: 3, number: "LD-00164", status: "unassigned", origin: "El Dorado, KS", dest: "Ponca City, OK", cargo: "NGL", hazmat: "Class 2.1", rate: 1450, trailer: "MC-331", pickup: "Tomorrow 6:00 AM", priority: "normal" },
  { id: 4, number: "LD-00158", status: "assigned", origin: "Tulsa, OK", dest: "Memphis, TN", cargo: "WTI Crude", hazmat: "Class 3", rate: 3200, trailer: "MC-306", pickup: "Today 8:00 AM", driver: "David Chen", priority: "normal" },
  { id: 5, number: "LD-00159", status: "in_transit", origin: "Oklahoma City, OK", dest: "Dallas, TX", cargo: "Condensate", hazmat: "Class 3", rate: 1680, trailer: "DOT-407", pickup: "Yesterday", driver: "Tony Martinez", eta: "2:45 PM", priority: "normal" },
  { id: 6, number: "LD-00160", status: "in_transit", origin: "Bartlesville, OK", dest: "Wichita, KS", cargo: "Propane", hazmat: "Class 2.1", rate: 1100, trailer: "MC-331", pickup: "Yesterday", driver: "Tony Martinez", eta: "11:30 AM", priority: "normal" },
  { id: 7, number: "LD-00155", status: "delivered", origin: "Cushing, OK", dest: "El Dorado, KS", cargo: "WTI Crude", hazmat: "Class 3", rate: 1950, trailer: "MC-306", driver: "Marcus Johnson", deliveredAt: "8:22 AM", priority: "normal" },
  { id: 8, number: "LD-00154", status: "delivered", origin: "Ponca City, OK", dest: "Tulsa, OK", cargo: "Diesel", hazmat: "Class 3", rate: 890, trailer: "DOT-407", driver: "Carlos Rivera", deliveredAt: "7:45 AM", priority: "normal" },
];

const ACTIVITY = [
  { time: "9:15 AM", type: "delivery", text: "Marcus Johnson delivered LD-00155 at El Dorado terminal" },
  { time: "9:02 AM", type: "status", text: "Tony Martinez — IN TRANSIT on LD-00159, ETA 2:45 PM Dallas" },
  { time: "8:45 AM", type: "alert", text: "James Wright entering mandatory 10h break — available at 6:45 PM" },
  { time: "8:22 AM", type: "delivery", text: "Carlos Rivera delivered LD-00154 at Tulsa terminal" },
  { time: "8:00 AM", type: "system", text: "3 new loads posted — 2 crude, 1 NGL. Awaiting assignment." },
  { time: "7:30 AM", type: "hos", text: "Tony Martinez HOS warning: 3.1h driving remaining" },
  { time: "7:15 AM", type: "checkcall", text: "Check call completed — David Chen, LD-00158, all clear" },
];

const statusColor = (s) => {
  if (s === "available") return { bg: "#E8F5E9", text: "#2E7D32", label: "Available" };
  if (s === "on_load") return { bg: "#E3F2FD", text: "#1565C0", label: "On Load" };
  if (s === "break") return { bg: "#FFF3E0", text: "#E65100", label: "Break" };
  if (s === "off_duty") return { bg: "#F5F5F5", text: "#757575", label: "Off Duty" };
  return { bg: "#F5F5F5", text: "#333", label: s };
};

const activityIcon = (type) => {
  if (type === "delivery") return "📦";
  if (type === "status") return "🚛";
  if (type === "alert") return "⚠️";
  if (type === "hos") return "⏱️";
  if (type === "checkcall") return "📞";
  return "📋";
};

const priorityBorder = (p) => {
  if (p === "urgent") return "3px solid #D32F2F";
  return "1px solid #E0E0E0";
};

export default function DispatchCommandCenter() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverFilter, setDriverFilter] = useState("all");
  const [dragDriver, setDragDriver] = useState(null);
  const [loads, setLoads] = useState(LOADS);
  const [showQuickLoad, setShowQuickLoad] = useState(false);
  const [assignmentToast, setAssignmentToast] = useState(null);

  const filteredDrivers = DRIVERS.filter(d => {
    if (driverFilter === "all") return true;
    return d.status === driverFilter;
  });

  const unassigned = loads.filter(l => l.status === "unassigned");
  const assigned = loads.filter(l => l.status === "assigned");
  const inTransit = loads.filter(l => l.status === "in_transit");
  const delivered = loads.filter(l => l.status === "delivered");

  const handleDrop = (loadId) => {
    if (!dragDriver) return;
    const driver = DRIVERS.find(d => d.id === dragDriver);
    setLoads(prev => prev.map(l =>
      l.id === loadId ? { ...l, status: "assigned", driver: driver.name } : l
    ));
    setAssignmentToast(`${driver.name} assigned to ${loads.find(l => l.id === loadId)?.number} — Compliance gates: PASSED`);
    setDragDriver(null);
    setTimeout(() => setAssignmentToast(null), 4000);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#1a1a2e" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2C3E6B 100%)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>DISPATCH COMMAND CENTER</div>
          <div style={{ color: "#94A3B8", fontSize: 13 }}>Jimmy's Fleet — 7 drivers, {unassigned.length} unassigned loads</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowQuickLoad(true)} style={{ background: "#10B981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            + Quick Load
          </button>
          <button style={{ background: "transparent", color: "#94A3B8", border: "1px solid #475569", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Broadcast
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ display: "flex", gap: 16, padding: "12px 24px", background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        {[
          { label: "Unassigned", value: unassigned.length, color: "#EF4444" },
          { label: "Assigned", value: assigned.length, color: "#F59E0B" },
          { label: "In Transit", value: inTransit.length, color: "#3B82F6" },
          { label: "Delivered Today", value: delivered.length, color: "#10B981" },
          { label: "Drivers Available", value: DRIVERS.filter(d => d.status === "available").length, color: "#8B5CF6" },
          { label: "Fleet Utilization", value: Math.round((DRIVERS.filter(d => d.status === "on_load").length / DRIVERS.length) * 100) + "%", color: "#0EA5E9" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ASSIGNMENT TOAST */}
      {assignmentToast && (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#fff", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 14, zIndex: 100, boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
          {assignmentToast}
        </div>
      )}

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={{ display: "flex", height: "calc(100vh - 140px)", overflow: "hidden" }}>

        {/* LEFT: DRIVER ROSTER */}
        <div style={{ width: 280, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2A4A", marginBottom: 8 }}>DRIVER ROSTER</div>
            <div style={{ display: "flex", gap: 4 }}>
              {["all", "available", "on_load", "off_duty"].map(f => (
                <button key={f} onClick={() => setDriverFilter(f)}
                  style={{ padding: "4px 10px", fontSize: 11, borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 600,
                    background: driverFilter === f ? "#1B2A4A" : "#F1F5F9",
                    color: driverFilter === f ? "#fff" : "#64748B" }}>
                  {f === "all" ? "All" : f === "on_load" ? "Active" : f === "available" ? "Free" : "Off"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filteredDrivers.map(d => {
              const sc = statusColor(d.status);
              return (
                <div key={d.id}
                  draggable={d.status === "available"}
                  onDragStart={() => setDragDriver(d.id)}
                  onDragEnd={() => setDragDriver(null)}
                  onClick={() => setSelectedDriver(selectedDriver === d.id ? null : d.id)}
                  style={{
                    padding: "10px 12px", marginBottom: 6, borderRadius: 8, cursor: d.status === "available" ? "grab" : "pointer",
                    border: selectedDriver === d.id ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                    background: dragDriver === d.id ? "#EFF6FF" : "#fff",
                    transition: "all 0.15s"
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A" }}>{d.name}</div>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{sc.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#64748B" }}>
                    <span>HOS: {d.hosRemaining}h</span>
                    <span>{d.endorsements.join(", ")}</span>
                  </div>
                  {d.currentLoad && <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 2, fontWeight: 600 }}>On: {d.currentLoad}</div>}
                  {d.distance && d.status === "available" && <div style={{ fontSize: 11, color: "#10B981", marginTop: 2 }}>{d.distance}mi from nearest pickup</div>}

                  {/* Expanded details */}
                  {selectedDriver === d.id && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #E2E8F0", fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#64748B" }}>Safety Score</span>
                        <span style={{ fontWeight: 700, color: d.safetyScore >= 90 ? "#10B981" : "#F59E0B" }}>{d.safetyScore}/100</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#64748B" }}>Total Loads</span>
                        <span style={{ fontWeight: 700 }}>{d.totalLoads}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#64748B" }}>On-Time Rate</span>
                        <span style={{ fontWeight: 700, color: "#10B981" }}>{d.onTimeRate}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Equipment</span>
                        <span style={{ fontWeight: 700 }}>{d.equipment}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: "#94A3B8" }}>
              Drag available drivers onto unassigned loads to assign
            </div>
          </div>
        </div>

        {/* CENTER: KANBAN BOARD */}
        <div style={{ flex: 1, overflowX: "auto", padding: "12px", display: "flex", gap: 12 }}>
          {[
            { title: "UNASSIGNED", items: unassigned, color: "#EF4444", droppable: true },
            { title: "ASSIGNED", items: assigned, color: "#F59E0B", droppable: false },
            { title: "IN TRANSIT", items: inTransit, color: "#3B82F6", droppable: false },
            { title: "DELIVERED TODAY", items: delivered, color: "#10B981", droppable: false },
          ].map((lane, li) => (
            <div key={li} style={{ flex: 1, minWidth: 240, background: "#F8FAFC", borderRadius: 12, display: "flex", flexDirection: "column" }}
              onDragOver={lane.droppable ? (e) => e.preventDefault() : undefined}>
              <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: lane.color }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#1B2A4A", letterSpacing: 0.5 }}>{lane.title}</span>
                </div>
                <span style={{ background: lane.color + "20", color: lane.color, fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 10 }}>{lane.items.length}</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
                {lane.items.map(load => (
                  <div key={load.id}
                    onDrop={lane.droppable ? () => handleDrop(load.id) : undefined}
                    onDragOver={lane.droppable ? (e) => e.preventDefault() : undefined}
                    style={{
                      background: "#fff", borderRadius: 10, padding: "12px", marginBottom: 8,
                      border: priorityBorder(load.priority),
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.15s"
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#1B2A4A" }}>{load.number}</span>
                      {load.hazmat && <span style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 10, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{load.hazmat}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4, fontWeight: 600 }}>
                      {load.origin} → {load.dest}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#94A3B8" }}>
                      <span>{load.cargo}</span>
                      <span style={{ fontWeight: 700, color: "#1B2A4A" }}>${load.rate.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                      <span style={{ color: "#94A3B8" }}>{load.trailer}</span>
                      {load.pickup && <span style={{ color: load.priority === "urgent" ? "#DC2626" : "#64748B", fontWeight: load.priority === "urgent" ? 700 : 400 }}>{load.pickup}</span>}
                    </div>
                    {load.driver && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>
                        {load.driver} {load.eta && <span style={{ color: "#64748B", fontWeight: 400 }}>• ETA {load.eta}</span>}
                        {load.deliveredAt && <span style={{ color: "#10B981", fontWeight: 400 }}>• {load.deliveredAt}</span>}
                      </div>
                    )}
                    {load.status === "unassigned" && dragDriver && (
                      <div style={{ marginTop: 8, padding: "8px", background: "#EFF6FF", borderRadius: 6, textAlign: "center", fontSize: 12, color: "#3B82F6", fontWeight: 700, border: "2px dashed #93C5FD" }}>
                        Drop driver here to assign
                      </div>
                    )}
                  </div>
                ))}
                {lane.items.length === 0 && (
                  <div style={{ textAlign: "center", padding: 24, fontSize: 12, color: "#CBD5E1" }}>
                    No loads
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: ACTIVITY FEED */}
        <div style={{ width: 300, borderLeft: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2A4A" }}>LIVE ACTIVITY</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #F8FAFC",
                background: a.type === "alert" || a.type === "hos" ? "#FFFBEB" : "transparent" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>{activityIcon(a.type)}</span>
                  <div>
                    <div style={{ fontSize: 12, color: "#1B2A4A", lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* QUICK ACTIONS */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1B2A4A", marginBottom: 8 }}>QUICK ACTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { label: "Quick Load", icon: "➕", color: "#10B981" },
                { label: "Check Calls", icon: "📞", color: "#3B82F6", badge: "2" },
                { label: "Settlements", icon: "💰", color: "#F59E0B" },
                { label: "Fleet Map", icon: "🗺️", color: "#8B5CF6" },
              ].map((qa, i) => (
                <button key={i} style={{
                  background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#1B2A4A",
                  position: "relative"
                }}>
                  <span>{qa.icon}</span> {qa.label}
                  {qa.badge && <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{qa.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK LOAD MODAL */}
      {showQuickLoad && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px", width: 440, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1B2A4A", marginBottom: 4 }}>Quick Load</div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>Create a load in seconds. Compliance auto-fills.</div>

            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4, display: "block" }}>ROUTE</label>
            <input placeholder="Cushing, OK → Houston, TX" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4, display: "block" }}>CARGO</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, marginBottom: 14, boxSizing: "border-box", background: "#fff" }}>
              <option>WTI Crude Oil (Class 3)</option>
              <option>Permian Basin Crude (Class 3)</option>
              <option>NGL (Class 2.1)</option>
              <option>Propane (Class 2.1)</option>
              <option>Condensate (Class 3)</option>
              <option>Produced Water</option>
              <option>Frac Sand</option>
            </select>

            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4, display: "block" }}>RATE</label>
            <input placeholder="$2,850" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, marginBottom: 20, boxSizing: "border-box" }} />

            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8 }}>
              Auto-filled: MC-306 trailer, Hazmat Class 3, placard FLAMMABLE 1203, X endorsement required, 160 bbl minimum
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowQuickLoad(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", fontSize: 14, cursor: "pointer", color: "#475569" }}>Cancel</button>
              <button onClick={() => setShowQuickLoad(false)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Post Load</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
