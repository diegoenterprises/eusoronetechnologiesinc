/**
 * KANBAN BOARD — Center column of Dispatch Command Center
 * 4 swim lanes: UNASSIGNED → ASSIGNED → IN TRANSIT → DELIVERED TODAY
 * Supports drag-and-drop driver assignment from DriverRoster
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Truck, Navigation, CheckCircle, AlertTriangle,
  Clock, MapPin, Flame, Plus, GripVertical
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
  onLoadClick?: (load: KanbanLoad) => void;
  onCreateLoad?: () => void;
}

interface LaneConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  statuses: string[];
}

const LANES: LaneConfig[] = [
  {
    key: "unassigned",
    label: "Unassigned",
    icon: <Package className="w-3.5 h-3.5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    statuses: ["posted", "bidding", "unassigned"],
  },
  {
    key: "assigned",
    label: "Assigned",
    icon: <Truck className="w-3.5 h-3.5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    statuses: ["assigned", "en_route_pickup", "at_pickup", "loading"],
  },
  {
    key: "in_transit",
    label: "In Transit",
    icon: <Navigation className="w-3.5 h-3.5" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    statuses: ["in_transit", "en_route_delivery", "at_delivery", "unloading"],
  },
  {
    key: "delivered",
    label: "Delivered Today",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    statuses: ["delivered"],
  },
];

function getLoadLane(load: KanbanLoad): string {
  if (!load.driverId && ["posted", "bidding", "unassigned"].includes(load.status)) return "unassigned";
  if (["assigned", "en_route_pickup", "at_pickup", "loading"].includes(load.status)) return "assigned";
  if (["in_transit", "en_route_delivery", "at_delivery", "unloading"].includes(load.status)) return "in_transit";
  if (load.status === "delivered") return "delivered";
  if (!load.driverId) return "unassigned";
  return "assigned";
}

function getUrgencyBorder(load: KanbanLoad): string {
  if (!load.pickupDate) return "";
  const hours = (new Date(load.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours < 0 || load.urgency === "high") return "border-l-2 border-l-red-500";
  if (hours < 12 || load.urgency === "medium") return "border-l-2 border-l-yellow-500";
  return "border-l-2 border-l-green-500/50";
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

function LoadCard({ load, onLoadClick, isDropTarget }: { load: KanbanLoad; onLoadClick?: (l: KanbanLoad) => void; isDropTarget?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "rounded-lg border p-2.5 cursor-pointer transition-colors",
        "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]",
        getUrgencyBorder(load),
        isDropTarget && "ring-2 ring-cyan-500/50 bg-cyan-500/5"
      )}
      onClick={() => onLoadClick?.(load)}
      role="article"
      aria-label={`Load ${load.loadNumber}, ${load.origin} to ${load.destination}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-white">{load.loadNumber}</span>
          {load.hazmatClass && (
            <Badge className="bg-red-500/20 text-red-400 border-0 text-[8px] px-1 py-0">
              <Flame className="w-2.5 h-2.5 mr-0.5" aria-hidden="true" />HM
            </Badge>
          )}
        </div>
        {load.rate !== undefined && load.rate > 0 && (
          <span className="text-[10px] font-semibold text-green-400">${load.rate.toLocaleString()}</span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px]">
          <MapPin className="w-2.5 h-2.5 text-green-400 shrink-0" aria-hidden="true" />
          <span className="text-slate-300 truncate">{load.origin}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <MapPin className="w-2.5 h-2.5 text-red-400 shrink-0" aria-hidden="true" />
          <span className="text-slate-300 truncate">{load.destination}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500">
        {load.commodity && <span>{load.commodity}</span>}
        {load.pickupDate && (
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" aria-hidden="true" />{formatTime(load.pickupDate)}
          </span>
        )}
      </div>

      {load.driverName && (
        <div className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">
            {load.driverName.charAt(0)}
          </div>
          <span className="text-[10px] text-blue-400">{load.driverName}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function KanbanBoard({ loads, loading, onAssignDriver, onLoadClick, onCreateLoad }: KanbanBoardProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const laneLoads = LANES.map(lane => ({
    ...lane,
    items: loads.filter(l => getLoadLane(l) === lane.key),
  }));

  const handleDragOver = (e: React.DragEvent, laneKey: string) => {
    if (laneKey !== "unassigned") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, loadId: string) => {
    e.preventDefault();
    setDropTarget(loadId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, loadId: string) => {
    e.preventDefault();
    setDropTarget(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.driverId && onAssignDriver) {
        onAssignDriver(loadId, data.driverId);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3 h-full">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <GripVertical className="w-4 h-4 text-cyan-400" />
          Dispatch Board
        </h2>
        {onCreateLoad && (
          <Button
            size="sm"
            className="h-6 px-2 text-[10px] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md"
            onClick={onCreateLoad}
          >
            <Plus className="w-3 h-3 mr-1" aria-hidden="true" />Quick Load
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        {laneLoads.map(lane => (
          <div
            key={lane.key}
            className="flex flex-col min-h-0"
            onDragOver={e => handleDragOver(e, lane.key)}
          >
            {/* Lane Header */}
            <div className={cn("rounded-t-lg px-2.5 py-1.5 flex items-center gap-1.5", lane.bgColor, lane.borderColor, "border-b")}>
              <span className={lane.color}>{lane.icon}</span>
              <span className={cn("text-[11px] font-medium", lane.color)}>{lane.label}</span>
              <Badge className={cn("border-0 text-[9px] ml-auto px-1.5 py-0", lane.bgColor, lane.color)}>
                {lane.items.length}
              </Badge>
            </div>

            {/* Lane Body */}
            <div className={cn(
              "flex-1 overflow-y-auto space-y-1.5 p-1.5 rounded-b-lg",
              "bg-white/[0.01] border border-t-0 border-white/[0.04]"
            )}>
              {lane.items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className={cn("text-[10px]", lane.color, "opacity-50")}>
                    {lane.key === "unassigned" ? "No unassigned loads" : `No ${lane.label.toLowerCase()} loads`}
                  </span>
                  {lane.key === "unassigned" && onCreateLoad && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-cyan-500 hover:text-cyan-400 mt-1"
                      onClick={onCreateLoad}
                    >
                      <Plus className="w-3 h-3 mr-1" aria-hidden="true" />Create Load
                    </Button>
                  )}
                </div>
              )}
              <AnimatePresence>
                {lane.items.map(load => (
                  <div
                    key={load.id}
                    onDragOver={e => { e.preventDefault(); handleDragEnter(e, load.id); }}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, load.id)}
                  >
                    <LoadCard
                      load={load}
                      onLoadClick={onLoadClick}
                      isDropTarget={dropTarget === load.id}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
