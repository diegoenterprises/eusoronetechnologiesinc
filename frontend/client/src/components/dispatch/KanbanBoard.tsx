/**
 * KANBAN BOARD — Dispatch Command Center
 * 4 swim lanes: UNASSIGNED → ASSIGNED → IN TRANSIT → DELIVERED TODAY
 * Drag load cards between lanes (status transition) or drop drivers onto cards (assignment).
 * Design: frosted glass, depth layering, precision typography, purposeful color.
 */

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Package, Truck, Navigation, CheckCircle,
  Clock, Flame, Plus, GripVertical,
  ArrowRight, User, MoveRight, Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface KanbanLoad {
  id: string;
  loadNumber: string;
  status: string;
  origin: string;
  destination: string;
  pickupDate?: string;
  deliveryDate?: string;
  driverId?: string | null;
  driverName?: string | null;
  rate?: number;
  commodity?: string;
  cargoType?: string;
  hazmatClass?: string | null;
  weight?: number;
  equipmentType?: string | null;
  urgency?: "high" | "medium" | "normal";
}

interface KanbanBoardProps {
  loads: KanbanLoad[];
  loading?: boolean;
  onAssignDriver?: (loadId: string, driverId: string) => void;
  onMoveLoad?: (loadId: string, targetLane: string) => void;
  onLoadClick?: (load: KanbanLoad) => void;
  onCreateLoad?: () => void;
}

interface LaneConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  grad: string;
  emptyIcon: React.ReactNode;
  emptyText: string;
  statuses: string[];
}

const LANES: LaneConfig[] = [
  {
    key: "unassigned", label: "Unassigned",
    icon: <Package className="w-3.5 h-3.5" />,
    accent: "#f87171", grad: "from-red-500/20 via-red-500/5 to-transparent",
    emptyIcon: <Package className="w-7 h-7 text-red-500/20" />,
    emptyText: "No unassigned loads",
    statuses: ["posted", "bidding", "unassigned"],
  },
  {
    key: "assigned", label: "Assigned",
    icon: <Truck className="w-3.5 h-3.5" />,
    accent: "#60a5fa", grad: "from-blue-500/20 via-blue-500/5 to-transparent",
    emptyIcon: <Truck className="w-7 h-7 text-blue-500/20" />,
    emptyText: "No assigned loads",
    statuses: ["assigned", "en_route_pickup", "at_pickup", "loading"],
  },
  {
    key: "in_transit", label: "In Transit",
    icon: <Navigation className="w-3.5 h-3.5" />,
    accent: "#22d3ee", grad: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    emptyIcon: <Navigation className="w-7 h-7 text-cyan-500/20" />,
    emptyText: "No loads in transit",
    statuses: ["in_transit", "en_route_delivery", "at_delivery", "unloading"],
  },
  {
    key: "delivered", label: "Delivered Today",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    accent: "#4ade80", grad: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    emptyIcon: <CheckCircle className="w-7 h-7 text-emerald-500/20" />,
    emptyText: "No deliveries today",
    statuses: ["delivered"],
  },
];

/* ── helpers ── */

function getLoadLane(load: KanbanLoad): string {
  if (!load.driverId && ["posted", "bidding", "unassigned"].includes(load.status)) return "unassigned";
  if (["assigned", "en_route_pickup", "at_pickup", "loading"].includes(load.status)) return "assigned";
  if (["in_transit", "en_route_delivery", "at_delivery", "unloading"].includes(load.status)) return "in_transit";
  if (load.status === "delivered") return "delivered";
  if (!load.driverId) return "unassigned";
  return "assigned";
}

const SUB: Record<string, string> = {
  en_route_pickup: "En Route", at_pickup: "At Pickup", loading: "Loading",
  en_route_delivery: "En Route", at_delivery: "At Drop", unloading: "Unloading", bidding: "Bidding",
};

function urgency(l: KanbanLoad): "overdue" | "urgent" | "soon" | "normal" {
  if (!l.pickupDate) return "normal";
  const h = (new Date(l.pickupDate).getTime() - Date.now()) / 3600000;
  if (h < 0 || l.urgency === "high") return "overdue";
  if (h < 6 || l.urgency === "medium") return "urgent";
  if (h < 24) return "soon";
  return "normal";
}

function fmtTime(d?: string): string {
  if (!d) return "";
  try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; }
}

/* ── shimmer skeleton ── */

function ShimmerCard() {
  return (
    <div className="animate-pulse bg-white/[0.03] p-3 space-y-2.5 rounded-xl border border-white/[0.06]">
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-white/[0.08] rounded-full" />
        <div className="h-3 w-12 bg-emerald-500/10 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-white/[0.06] rounded-full" />
        <div className="h-2.5 w-3/4 bg-white/[0.06] rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-2 w-14 bg-white/[0.04] rounded-full" />
        <div className="h-2 w-20 bg-white/[0.04] rounded-full" />
      </div>
    </div>
  );
}

function ShimmerLane() {
  return (
    <div className="flex flex-col min-h-0">
      <div className="animate-pulse h-9 bg-white/[0.04] rounded-t-xl mb-px" />
      <div className="flex-1 space-y-2 p-2 bg-white/[0.01] rounded-b-xl border border-t-0 border-white/[0.04]">
        <ShimmerCard /><ShimmerCard />
        <div className="opacity-40"><ShimmerCard /></div>
      </div>
    </div>
  );
}

/* ── pipeline progress bar ── */

function PipelineBar({ counts }: { counts: number[] }) {
  const t = counts.reduce((a, b) => a + b, 0) || 1;
  const colors = ["#f87171", "#60a5fa", "#22d3ee", "#4ade80"];
  return (
    <div className="flex items-center gap-[2px] h-[3px] mx-1 mb-2.5 rounded-full overflow-hidden bg-white/[0.04]">
      {counts.map((c, i) => (
        <motion.div
          key={i} className="h-full rounded-full"
          style={{ backgroundColor: colors[i] }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max((c / t) * 100, c > 0 ? 4 : 0)}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.06 }}
        />
      ))}
    </div>
  );
}

/* ── load card ── */

const URGENCY_BORDER: Record<string, string> = {
  overdue: "border-l-[3px] border-l-red-500",
  urgent: "border-l-[3px] border-l-amber-400",
  soon: "border-l-[3px] border-l-yellow-400/60",
  normal: "border-l-[3px] border-l-transparent",
};

function LoadCard({
  load, accent, onLoadClick, isDropTarget, isDragging, onDragStart,
}: {
  load: KanbanLoad; accent: string;
  onLoadClick?: (l: KanbanLoad) => void;
  isDropTarget?: boolean; isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, l: KanbanLoad) => void;
}) {
  const urg = urgency(load);
  const sub = SUB[load.status];

  return (
    <motion.div
      layout="position"
      layoutId={`load-${load.id}`}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: isDropTarget ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
      draggable
      onDragStart={(e) => onDragStart?.(e as any, load)}
      className={cn(
        "group relative rounded-xl p-3 cursor-grab active:cursor-grabbing select-none",
        "bg-gradient-to-br from-white/[0.05] to-white/[0.02]",
        "border border-white/[0.08]",
        "backdrop-blur-sm",
        "hover:from-white/[0.08] hover:to-white/[0.04]",
        "hover:border-white/[0.14]",
        "hover:shadow-lg hover:shadow-black/20",
        "active:shadow-xl active:shadow-black/30",
        "transition-all duration-200 ease-out",
        URGENCY_BORDER[urg],
        isDropTarget && "ring-2 ring-cyan-400/60 border-cyan-400/30 shadow-lg shadow-cyan-500/10",
      )}
      onClick={() => onLoadClick?.(load)}
      role="article"
      aria-label={`Load ${load.loadNumber}, ${load.origin} to ${load.destination}`}
    >
      {/* Row 1: load number + badges + rate */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span className="text-[11px] font-mono font-bold tracking-tight text-white/90 truncate">{load.loadNumber}</span>
          {load.hazmatClass && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-md bg-red-500/15 border border-red-500/20 shrink-0">
              <Flame className="w-2.5 h-2.5 text-red-400" />
              <span className="text-[7px] font-extrabold text-red-400 uppercase tracking-widest">HM</span>
            </span>
          )}
          {sub && (
            <span className="text-[8px] font-medium px-1.5 py-px rounded-md bg-white/[0.06] text-slate-400 border border-white/[0.06] shrink-0 truncate max-w-[60px]">
              {sub}
            </span>
          )}
        </div>
        {load.rate !== undefined && load.rate > 0 && (
          <span className="text-[11px] font-semibold text-emerald-400 tabular-nums shrink-0">${load.rate.toLocaleString()}</span>
        )}
      </div>

      {/* Row 2: route visualization */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex flex-col items-center mt-[3px] shrink-0">
          <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 ring-[2.5px] ring-emerald-400/15" />
          <div className="w-px h-3.5 bg-gradient-to-b from-emerald-400/40 to-red-400/40" />
          <div className="w-[7px] h-[7px] rounded-full bg-red-400/80 ring-[2.5px] ring-red-400/15" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[10px] font-medium text-slate-200 truncate leading-snug">{load.origin}</p>
          <p className="text-[10px] text-slate-400/80 truncate leading-snug">{load.destination}</p>
        </div>
      </div>

      {/* Row 3: meta pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {load.commodity && (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
            <Droplets className="w-2.5 h-2.5 opacity-60" />{load.commodity}
          </span>
        )}
        {load.pickupDate && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md",
            urg === "overdue" ? "text-red-400 bg-red-500/10" :
            urg === "urgent" ? "text-amber-400 bg-amber-500/10" :
            "text-slate-500 bg-white/[0.04]",
          )}>
            <Clock className="w-2.5 h-2.5" />{fmtTime(load.pickupDate)}
          </span>
        )}
        {load.weight && load.weight > 0 && (
          <span className="text-[9px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded-md tabular-nums">
            {(load.weight / 2000).toFixed(1)}T
          </span>
        )}
      </div>

      {/* Row 4: driver */}
      {load.driverName ? (
        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center gap-2">
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm shadow-blue-500/30">
              {load.driverName.charAt(0)}
            </div>
            <div className="absolute -bottom-px -right-px w-[7px] h-[7px] rounded-full bg-emerald-400 border-[1.5px] border-[#0d1424]" />
          </div>
          <span className="text-[10px] font-medium text-blue-300/90">{load.driverName}</span>
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-dashed border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-600 italic">
            <User className="w-3 h-3 opacity-50" />
            <span>Drop driver to assign</span>
          </div>
        </div>
      )}

      {/* Subtle radial glow on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(140px circle at 50% 30%, ${accent}0a, transparent 70%)` }}
      />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function KanbanBoard({ loads, loading, onAssignDriver, onMoveLoad, onLoadClick, onCreateLoad }: KanbanBoardProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropLane, setDropLane] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const enterCount = useRef<Record<string, number>>({});

  const laneLoads = LANES.map(lane => ({
    ...lane,
    items: loads.filter(l => getLoadLane(l) === lane.key),
  }));

  /* ── drag handlers ── */

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);

  const onLaneEnter = useCallback((e: React.DragEvent, k: string) => {
    e.preventDefault();
    enterCount.current[k] = (enterCount.current[k] || 0) + 1;
    setDropLane(k);
  }, []);

  const onLaneLeave = useCallback((_e: React.DragEvent, k: string) => {
    enterCount.current[k] = (enterCount.current[k] || 0) - 1;
    if (enterCount.current[k] <= 0) { enterCount.current[k] = 0; setDropLane(prev => prev === k ? null : prev); }
  }, []);

  const onCardEnter = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); setDropTarget(id);
  }, []);

  const reset = useCallback(() => {
    setDropTarget(null); setDropLane(null); setDraggingId(null); enterCount.current = {};
  }, []);

  const handleDropOnLoad = useCallback((e: React.DragEvent, loadId: string) => {
    e.preventDefault();
    try {
      const d = JSON.parse(e.dataTransfer.getData("application/json"));
      if (d.driverId && onAssignDriver) {
        e.stopPropagation(); reset();
        onAssignDriver(loadId, d.driverId);
      }
      // Load-to-lane moves: don't stopPropagation — let it bubble to the lane handler
    } catch {}
  }, [onAssignDriver, reset]);

  const handleDropOnLane = useCallback((e: React.DragEvent, laneKey: string) => {
    e.preventDefault(); reset();
    try {
      const d = JSON.parse(e.dataTransfer.getData("application/json"));
      if (d.loadId && onMoveLoad) onMoveLoad(d.loadId, laneKey);
    } catch {}
  }, [onMoveLoad, reset]);

  const handleLoadDragStart = useCallback((e: React.DragEvent, load: KanbanLoad) => {
    setDraggingId(load.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ loadId: load.id, loadNumber: load.loadNumber, type: "load" }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="h-5 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-7 w-24 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <div className="h-[3px] mx-1 mb-2.5 bg-white/[0.04] rounded-full animate-pulse" />
        <div className="grid grid-cols-4 gap-2.5 flex-1 min-h-0">
          {[0,1,2,3].map(i => <ShimmerLane key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" onDragEnd={reset}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <div className="p-1 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/[0.06]">
            <GripVertical className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          Dispatch Board
          <span className="text-[10px] font-normal text-slate-500 ml-0.5 tabular-nums">{loads.length} loads</span>
        </h2>
        {onCreateLoad && (
          <Button
            size="sm"
            className={cn(
              "h-7 px-3 text-[10px] font-medium rounded-lg",
              "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500",
              "shadow-md shadow-cyan-500/20 border border-cyan-400/20",
              "transition-all duration-200",
            )}
            onClick={onCreateLoad}
          >
            <Plus className="w-3 h-3 mr-1" />Quick Load
          </Button>
        )}
      </div>

      {/* Pipeline bar */}
      <PipelineBar counts={laneLoads.map(l => l.items.length)} />

      {/* Lanes */}
      <div className="grid grid-cols-4 gap-2.5 flex-1 min-h-0">
        {laneLoads.map((lane, idx) => {
          const dropping = dropLane === lane.key;
          const active = draggingId !== null;

          return (
            <div
              key={lane.key}
              className={cn(
                "flex flex-col min-h-0 rounded-xl transition-all duration-300",
                dropping && "ring-2 ring-offset-1 ring-offset-[#0B1120]",
              )}
              style={dropping ? { ["--tw-ring-color" as any]: `${lane.accent}60` } : undefined}
              onDragOver={onDragOver}
              onDragEnter={e => onLaneEnter(e, lane.key)}
              onDragLeave={e => onLaneLeave(e, lane.key)}
              onDrop={e => handleDropOnLane(e, lane.key)}
            >
              {/* Lane header — frosted glass */}
              <div className={cn(
                "relative rounded-t-xl px-3 py-2 flex items-center gap-2 overflow-hidden",
                "border border-b-0 border-white/[0.06] backdrop-blur-xl",
              )}>
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-80", lane.grad)} />
                <div className="relative flex items-center gap-2 w-full">
                  <span style={{ color: lane.accent }}>{lane.icon}</span>
                  <span className="text-[11px] font-semibold tracking-tight" style={{ color: lane.accent }}>{lane.label}</span>
                  <div
                    className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums"
                    style={{ backgroundColor: `${lane.accent}18`, color: lane.accent, border: `1px solid ${lane.accent}25` }}
                  >
                    {lane.items.length}
                  </div>
                </div>
                {idx < 3 && (
                  <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 z-10">
                    <MoveRight className="w-2.5 h-2.5 text-slate-600/60" />
                  </div>
                )}
              </div>

              {/* Lane body */}
              <div className={cn(
                "flex-1 overflow-y-auto p-2 rounded-b-xl space-y-2",
                "border border-t-0 border-white/[0.04]",
                "bg-gradient-to-b from-white/[0.015] to-transparent",
                dropping && "from-white/[0.04] to-white/[0.01]",
                "transition-colors duration-300",
              )}>
                {/* Drop-here indicator when dragging into empty lane */}
                {active && dropping && lane.items.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed"
                    style={{ borderColor: `${lane.accent}40`, backgroundColor: `${lane.accent}08` }}
                  >
                    <ArrowRight className="w-5 h-5 mb-1.5" style={{ color: `${lane.accent}80` }} />
                    <span className="text-[10px] font-medium" style={{ color: `${lane.accent}99` }}>Drop here</span>
                  </motion.div>
                )}

                {/* Beautiful empty state */}
                {lane.items.length === 0 && !active && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-2 opacity-60">{lane.emptyIcon}</div>
                    <span className="text-[10px] text-slate-600">{lane.emptyText}</span>
                    {lane.key === "unassigned" && onCreateLoad && (
                      <Button
                        size="sm" variant="ghost"
                        className="h-6 px-2.5 text-[10px] text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg mt-2"
                        onClick={onCreateLoad}
                      >
                        <Plus className="w-3 h-3 mr-1" />Create Load
                      </Button>
                    )}
                  </div>
                )}

                {/* Cards */}
                <AnimatePresence mode="popLayout">
                  {lane.items.map(load => (
                    <div
                      key={load.id}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); onCardEnter(e, load.id); }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={e => handleDropOnLoad(e, load.id)}
                    >
                      <LoadCard
                        load={load}
                        accent={lane.accent}
                        onLoadClick={onLoadClick}
                        isDropTarget={dropTarget === load.id}
                        isDragging={draggingId === load.id}
                        onDragStart={handleLoadDragStart}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
