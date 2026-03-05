/**
 * DRIVER ROSTER — Left column of Dispatch Command Center
 * Shows all company drivers with status, HOS, and drag-to-assign capability
 */

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Search, User, Clock, Truck, ChevronDown, ChevronUp,
  Phone, Shield, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RosterDriver {
  id: string;
  userId?: number;
  name: string;
  phone?: string;
  status: string;
  hazmatEndorsement?: boolean;
  tankerEndorsement?: boolean;
  twicCard?: boolean;
  equipmentTypes?: string[];
  hosRemaining?: { driving: number; onDuty: number; cycle: number } | null;
  safetyScore?: number | null;
  completedLoads?: number;
  onTimeRate?: number | null;
  currentLoad?: string | null;
  truck?: string;
}

interface DriverRosterProps {
  drivers: RosterDriver[];
  loading?: boolean;
  onDriverSelect?: (driver: RosterDriver) => void;
  selectedDriverId?: string | null;
}

type FilterType = "all" | "available" | "on_load" | "off_duty";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  available:  { color: "text-green-400",  bg: "bg-green-500/20", label: "Available" },
  active:     { color: "text-green-400",  bg: "bg-green-500/20", label: "Available" },
  on_load:    { color: "text-blue-400",   bg: "bg-blue-500/20",  label: "On Load" },
  driving:    { color: "text-blue-400",   bg: "bg-blue-500/20",  label: "On Load" },
  on_duty:    { color: "text-blue-400",   bg: "bg-blue-500/20",  label: "On Duty" },
  off_duty:   { color: "text-slate-400",  bg: "bg-slate-500/20", label: "Off Duty" },
  sleeper:    { color: "text-purple-400", bg: "bg-purple-500/20", label: "Sleeper" },
  break:      { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Break" },
  issue:      { color: "text-red-400",    bg: "bg-red-500/20",   label: "Issue" },
};

function getStatusGroup(status: string): FilterType {
  if (["available", "active"].includes(status)) return "available";
  if (["on_load", "driving", "on_duty", "assigned"].includes(status)) return "on_load";
  return "off_duty";
}

export default function DriverRoster({ drivers, loading, onDriverSelect, selectedDriverId }: DriverRosterProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = drivers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q));
    }
    if (filter !== "all") {
      list = list.filter(d => getStatusGroup(d.status) === filter);
    }
    return list;
  }, [drivers, search, filter]);

  const counts = useMemo(() => ({
    all: drivers.length,
    available: drivers.filter(d => getStatusGroup(d.status) === "available").length,
    on_load: drivers.filter(d => getStatusGroup(d.status) === "on_load").length,
    off_duty: drivers.filter(d => getStatusGroup(d.status) === "off_duty").length,
  }), [drivers]);

  const handleDragStart = (e: React.DragEvent, driver: RosterDriver) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ driverId: driver.id, driverName: driver.name }));
    e.dataTransfer.effectAllowed = "move";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-white/[0.06]">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <User className="w-4 h-4 text-cyan-400" />
            Driver Roster
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-[10px] ml-1">{drivers.length}</Badge>
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input
            placeholder="Search drivers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-white/[0.04] border-white/[0.08] rounded-md"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "available", "on_load", "off_duty"] as FilterType[]).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              className={cn(
                "h-6 px-2 text-[10px] rounded-md",
                filter === f
                  ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  : "text-slate-500 hover:text-slate-300"
              )}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "available" ? "Avail" : f === "on_load" ? "On Load" : "Off"}
              <span className="ml-1 opacity-70">{counts[f]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No drivers match filter</p>
          </div>
        )}
        {filtered.map(driver => {
          const cfg = STATUS_CONFIG[driver.status] || STATUS_CONFIG.off_duty;
          const isAvailable = getStatusGroup(driver.status) === "available";
          const isExpanded = expandedId === driver.id;
          const hosHrs = driver.hosRemaining?.driving;
          const hosLow = hosHrs !== undefined && hosHrs !== null && hosHrs < 3;

          return (
            <div
              key={driver.id}
              draggable={isAvailable}
              onDragStart={(e) => handleDragStart(e, driver)}
              onClick={() => { onDriverSelect?.(driver); setExpandedId(isExpanded ? null : driver.id); }}
              className={cn(
                "rounded-lg border p-2 transition-all cursor-pointer select-none",
                isAvailable && "cursor-grab active:cursor-grabbing",
                selectedDriverId === driver.id
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
                isAvailable && "hover:border-cyan-500/30"
              )}
              role="listitem"
              aria-label={`${driver.name}, ${cfg.label}`}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  isAvailable ? "bg-gradient-to-br from-green-600 to-emerald-700"
                    : getStatusGroup(driver.status) === "on_load" ? "bg-gradient-to-br from-blue-600 to-blue-700"
                    : "bg-gradient-to-br from-slate-600 to-slate-700"
                )}>
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white truncate">{driver.name}</span>
                    {driver.hazmatEndorsement && (
                      <Shield className="w-3 h-3 text-orange-400 shrink-0" aria-label="Hazmat Endorsed" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge className={cn("border-0 text-[9px] px-1.5 py-0", cfg.bg, cfg.color)}>
                      {cfg.label}
                    </Badge>
                    {hosHrs !== undefined && hosHrs !== null && (
                      <span className={cn("text-[9px] flex items-center gap-0.5", hosLow ? "text-red-400" : "text-slate-500")}>
                        <Clock className="w-2.5 h-2.5" />{hosHrs}h
                        {hosLow && <AlertTriangle className="w-2.5 h-2.5" />}
                      </span>
                    )}
                    {driver.currentLoad && (
                      <span className="text-[9px] text-blue-400">{driver.currentLoad}</span>
                    )}
                  </div>
                </div>
                <button
                  className="text-slate-500 hover:text-white p-0.5"
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : driver.id); }}
                  aria-label={isExpanded ? "Collapse driver details" : "Expand driver details"}
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1 text-[10px]">
                  {driver.phone && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3 h-3" />{driver.phone}
                    </div>
                  )}
                  {driver.truck && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Truck className="w-3 h-3" />{driver.truck}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {driver.hazmatEndorsement && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[9px]">HazMat</Badge>}
                    {driver.tankerEndorsement && <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[9px]">Tanker</Badge>}
                    {driver.twicCard && <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[9px]">TWIC</Badge>}
                  </div>
                  {driver.completedLoads !== undefined && (
                    <div className="flex gap-3 text-slate-500">
                      <span>{driver.completedLoads} loads</span>
                      {driver.onTimeRate !== null && driver.onTimeRate !== undefined && (
                        <span>{driver.onTimeRate}% on-time</span>
                      )}
                      {driver.safetyScore !== null && driver.safetyScore !== undefined && (
                        <span>Safety: {driver.safetyScore}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
