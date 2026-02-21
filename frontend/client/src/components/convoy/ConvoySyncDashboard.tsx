/**
 * ConvoySyncDashboard — Escort/Convoy Formation Status
 *
 * Displays:
 * - Convoy formation status with primary + escort vehicle indicators
 * - 5 sync point progression (Both Confirmed → All Complete)
 * - Real-time separation distance between convoy vehicles
 * - Alert states for separation breaches
 * - Escort-specific state badge
 */

import { useState, useEffect } from "react";
import {
  Truck, Shield, AlertTriangle, CheckCircle2, Clock,
  Navigation, Radio, Eye, XCircle, ChevronDown, ChevronUp,
  Wifi, WifiOff, ArrowRight, Gauge, Milestone,
} from "lucide-react";

// ── Sync point definitions (mirrors server SYNC_POINTS) ──
const SYNC_POINTS = [
  { id: "SYNC_CONFIRMED", name: "Both Confirmed", description: "Primary and escort confirmed and ready" },
  { id: "SYNC_READY_TO_ROLL", name: "Ready to Roll", description: "Primary loaded, escort awaiting departure" },
  { id: "SYNC_CONVOY_FORMED", name: "Convoy Formed", description: "All vehicles in formation, separation monitoring active" },
  { id: "SYNC_AT_DELIVERY", name: "Convoy Arrived", description: "Convoy arrived at delivery, escort on standby" },
  { id: "SYNC_COMPLETE", name: "All Complete", description: "Delivery confirmed, escort mission complete" },
];

// ── Escort state display metadata ──
const ESCORT_STATE_META: Record<string, { label: string; color: string; icon: string }> = {
  en_route_staging: { label: "En Route to Staging", color: "text-blue-400", icon: "navigation" },
  at_staging: { label: "At Staging Area", color: "text-cyan-400", icon: "map-pin" },
  equipment_check: { label: "Equipment Check", color: "text-amber-400", icon: "shield" },
  staging_complete: { label: "Staging Complete", color: "text-emerald-400", icon: "check" },
  awaiting_primary: { label: "Awaiting Primary", color: "text-amber-400", icon: "clock" },
  convoy_forming: { label: "Convoy Forming", color: "text-blue-400", icon: "radio" },
  escorting: { label: "Escorting", color: "text-emerald-400", icon: "truck" },
  escort_hold: { label: "Escort Hold", color: "text-red-400", icon: "alert" },
  clearing_hazard: { label: "Clearing Hazard", color: "text-amber-400", icon: "alert" },
  traffic_control: { label: "Traffic Control", color: "text-amber-400", icon: "eye" },
  separation_alert: { label: "Separation Alert", color: "text-red-400", icon: "alert" },
  delivery_standby: { label: "Delivery Standby", color: "text-cyan-400", icon: "clock" },
  escort_complete: { label: "Escort Complete", color: "text-emerald-400", icon: "check" },
  primary_breakdown: { label: "Primary Breakdown", color: "text-red-400", icon: "alert" },
  escort_breakdown: { label: "Escort Breakdown", color: "text-red-400", icon: "alert" },
  route_blocked: { label: "Route Blocked", color: "text-red-400", icon: "x" },
  police_stop: { label: "Police Stop", color: "text-red-400", icon: "shield" },
};

// ── Separation config (mirrors server) ──
const MAX_LEAD_METERS = 1200;
const MAX_REAR_METERS = 800;

interface ConvoyData {
  id: number;
  loadId: number;
  loadNumber?: string;
  status: string;
  escortStatus?: string;
  primaryDriverName?: string;
  escortDriverName?: string;
  leadDistance?: number | null;
  rearDistance?: number | null;
  lastSyncPoint?: string;
  formationTime?: string;
  completedSyncPoints?: string[];
}

interface ConvoySyncDashboardProps {
  convoy: ConvoyData;
  className?: string;
}

function metersToFeet(m: number): string {
  return `${Math.round(m * 3.281)} ft`;
}

function metersToMiles(m: number): string {
  return `${(m / 1609.34).toFixed(2)} mi`;
}

function SeparationBar({ label, distance, maxDistance, position }: {
  label: string;
  distance: number | null;
  maxDistance: number;
  position: "lead" | "rear";
}) {
  if (distance === null) {
    return (
      <div className="flex items-center gap-3 py-2">
        <WifiOff className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">{label}: No signal</span>
      </div>
    );
  }

  const pct = Math.min(distance / maxDistance, 1.5);
  const isAlert = distance > maxDistance;
  const isWarning = distance > maxDistance * 0.8;

  const barColor = isAlert
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-emerald-500";

  const textColor = isAlert
    ? "text-red-400"
    : isWarning
    ? "text-amber-400"
    : "text-emerald-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {position === "lead" ? (
            <Navigation className={`w-3.5 h-3.5 ${textColor}`} />
          ) : (
            <Eye className={`w-3.5 h-3.5 ${textColor}`} />
          )}
          <span className="text-xs text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${textColor}`}>
            {distance < 500 ? metersToFeet(distance) : metersToMiles(distance)}
          </span>
          {isAlert && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${isAlert ? "animate-pulse" : ""}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-600">
        <span>0</span>
        <span className="text-slate-500">Max: {metersToFeet(maxDistance)}</span>
      </div>
    </div>
  );
}

export default function ConvoySyncDashboard({ convoy, className = "" }: ConvoySyncDashboardProps) {
  const [expanded, setExpanded] = useState(true);
  const escortMeta = ESCORT_STATE_META[convoy.escortStatus || convoy.status] || {
    label: (convoy.escortStatus || convoy.status || "unknown").replace(/_/g, " "),
    color: "text-slate-400",
    icon: "truck",
  };

  const completedSyncIds = convoy.completedSyncPoints || [];
  const currentSyncIdx = SYNC_POINTS.findIndex(sp => sp.id === convoy.lastSyncPoint);
  const isActive = !["escort_complete", "disbanded", "completed"].includes(convoy.status?.toLowerCase() || "");

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/15">
              <Radio className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Convoy Formation</p>
              <p className="text-[10px] text-slate-400">
                {convoy.loadNumber ? `Load ${convoy.loadNumber}` : `Convoy #${convoy.id}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Wifi className="w-3 h-3" />
                ACTIVE
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-current/20 ${escortMeta.color}`}>
              {escortMeta.label}
            </span>
            <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* ── Vehicle Pair ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-700/30 bg-slate-900/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Truck className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Primary</span>
              </div>
              <p className="text-xs text-white font-medium">{convoy.primaryDriverName || "Unassigned"}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-700/30 bg-slate-900/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Escort</span>
              </div>
              <p className="text-xs text-white font-medium">{convoy.escortDriverName || "Unassigned"}</p>
            </div>
          </div>

          {/* ── Sync Point Timeline ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Milestone className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-300">Sync Points</p>
            </div>
            <div className="flex items-center gap-1">
              {SYNC_POINTS.map((sp, i) => {
                const isCompleted = completedSyncIds.includes(sp.id) || i < currentSyncIdx;
                const isCurrent = i === currentSyncIdx;
                const isPending = !isCompleted && !isCurrent;
                return (
                  <div key={sp.id} className="flex-1 flex flex-col items-center relative group">
                    {/* Connector line */}
                    {i > 0 && (
                      <div className={`absolute top-3 -left-1/2 w-full h-0.5 ${
                        isCompleted ? "bg-emerald-500/50" : "bg-white/[0.04]"
                      }`} />
                    )}
                    {/* Node */}
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : isCurrent
                        ? "bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse"
                        : "bg-slate-800 border-slate-600 text-slate-500"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <span className="text-[8px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    {/* Label */}
                    <p className={`text-[8px] mt-1.5 text-center leading-tight ${
                      isCompleted ? "text-emerald-400/70" : isCurrent ? "text-blue-400" : "text-slate-600"
                    }`}>
                      {sp.name}
                    </p>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 w-40">
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-center shadow-xl">
                        <p className="text-[10px] font-semibold text-white">{sp.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{sp.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Separation Monitoring ── */}
          {isActive && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-300">Separation Distance</p>
              </div>
              <div className="space-y-3">
                <SeparationBar
                  label="Lead Vehicle"
                  distance={convoy.leadDistance ?? null}
                  maxDistance={MAX_LEAD_METERS}
                  position="lead"
                />
                <SeparationBar
                  label="Rear Vehicle"
                  distance={convoy.rearDistance ?? null}
                  maxDistance={MAX_REAR_METERS}
                  position="rear"
                />
              </div>
              {(convoy.leadDistance && convoy.leadDistance > MAX_LEAD_METERS) ||
               (convoy.rearDistance && convoy.rearDistance > MAX_REAR_METERS) ? (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  <p className="text-[10px] text-red-400 font-medium">
                    Convoy separation exceeded maximum distance. Reduce speed and close formation.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* ── Formation Time ── */}
          {convoy.formationTime && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Formation since {new Date(convoy.formationTime).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
