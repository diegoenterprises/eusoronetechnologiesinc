import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Activity, Clock, Truck, User, AlertTriangle, CheckCircle,
  RefreshCw, Radio, Wifi, WifiOff, Search, Filter,
  ChevronDown, ChevronUp, MapPin, Phone, MessageSquare, Eye,
  Shield, Zap, Timer, Moon, Coffee,
} from "lucide-react";

const HOS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  driving: { label: "Driving", color: "text-green-400", icon: Truck, bg: "bg-green-500/15" },
  onDuty: { label: "On Duty", color: "text-blue-400", icon: Clock, bg: "bg-blue-500/15" },
  on_duty: { label: "On Duty", color: "text-blue-400", icon: Clock, bg: "bg-blue-500/15" },
  sleeperBerth: { label: "Sleeper", color: "text-purple-400", icon: Moon, bg: "bg-purple-500/15" },
  sleeper: { label: "Sleeper", color: "text-purple-400", icon: Moon, bg: "bg-purple-500/15" },
  offDuty: { label: "Off Duty", color: "text-slate-400", icon: Coffee, bg: "bg-slate-500/15" },
  off_duty: { label: "Off Duty", color: "text-slate-400", icon: Coffee, bg: "bg-slate-500/15" },
};

const ELD_PROVIDERS = [
  "Samsara", "Motive", "Geotab", "Zonar", "Lytx", "Netradyne",
  "Verizon Connect", "Azuga", "Trimble", "Powerfleet", "Solera",
];

export default function DispatchELDIntelligence() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const driversQuery = (trpc as any).eld?.getDriverStatus?.useQuery?.({ filter: statusFilter === "all" ? undefined : statusFilter }, { refetchInterval: 60000 });
  const statsQuery = (trpc as any).eld?.getStats?.useQuery?.({}, { refetchInterval: 60000 });
  const connectionQuery = (trpc as any).eld?.getConnectionStatus?.useQuery?.(undefined, { refetchInterval: 60000 });

  const stats = statsQuery?.data;
  const drivers: any[] = (driversQuery?.data as any) || [];
  const isConnected = connectionQuery?.data?.connected;
  const providerName = connectionQuery?.data?.providers?.[0]?.name || "Not Connected";

  // Filter drivers
  const filteredDrivers = drivers.filter((d: any) => {
    if (search) {
      const q = search.toLowerCase();
      const match = [d.name, d.driverId, d.vehicle, d.provider].filter(Boolean).join(" ").toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  // Sort: violations first, then driving, then on-duty, then rest
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (a.hasViolation && !b.hasViolation) return -1;
    if (!a.hasViolation && b.hasViolation) return 1;
    const statusOrder: Record<string, number> = { driving: 0, onDuty: 1, on_duty: 1, sleeperBerth: 2, sleeper: 2, offDuty: 3, off_duty: 3 };
    return (statusOrder[a.currentStatus || a.status] ?? 9) - (statusOrder[b.currentStatus || b.status] ?? 9);
  });

  // Compute fleet stats
  const drivingCount = drivers.filter(d => d.currentStatus === "driving" || d.status === "driving").length;
  const onDutyCount = drivers.filter(d => ["onDuty", "on_duty"].includes(d.currentStatus || d.status)).length;
  const restCount = drivers.filter(d => ["offDuty", "off_duty", "sleeperBerth", "sleeper"].includes(d.currentStatus || d.status)).length;
  const violationCount = drivers.filter(d => d.hasViolation).length;

  const getHOSBar = (used: number, max: number, color: string) => {
    const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
    const isWarning = pct >= 85;
    return (
      <div className="space-y-0.5">
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", isWarning ? "bg-red-500" : color === "green" ? "bg-green-500" : color === "blue" ? "bg-blue-500" : "bg-purple-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold">ELD Intelligence</h1>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">Dispatch View</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* ELD Connection Status */}
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold",
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {providerName}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => { driversQuery?.refetch?.(); statsQuery?.refetch?.(); connectionQuery?.refetch?.(); }}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", (driversQuery?.isFetching || statsQuery?.isFetching) && "animate-spin")} />Sync
          </Button>
        </div>
      </div>

      {/* Fleet HOS Summary */}
      <div className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
        {[
          { label: "Total Drivers", value: stats?.totalDrivers || drivers.length, icon: User, color: "text-cyan-400", bgc: "bg-cyan-500/10" },
          { label: "Driving", value: stats?.driving || drivingCount, icon: Truck, color: "text-green-400", bgc: "bg-green-500/10" },
          { label: "On Duty", value: stats?.onDuty || onDutyCount, icon: Clock, color: "text-blue-400", bgc: "bg-blue-500/10" },
          { label: "Resting", value: restCount, icon: Moon, color: "text-purple-400", bgc: "bg-purple-500/10" },
          { label: "Violations", value: stats?.violations || violationCount, icon: AlertTriangle, color: violationCount > 0 ? "text-red-400" : "text-emerald-400", bgc: violationCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", s.bgc)}>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">{s.label}</div>
              <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.06] bg-slate-900/20">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-slate-500 uppercase">Fleet Compliance</span>
          <span className={cn("text-sm font-bold", (stats?.complianceRate || 0) >= 95 ? "text-emerald-400" : (stats?.complianceRate || 0) >= 80 ? "text-amber-400" : "text-red-400")}>
            {stats?.complianceRate || 0}%
          </span>
        </div>
        <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden max-w-xs">
          <div
            className={cn("h-full rounded-full transition-all", (stats?.complianceRate || 0) >= 95 ? "bg-emerald-500" : (stats?.complianceRate || 0) >= 80 ? "bg-amber-500" : "bg-red-500")}
            style={{ width: `${stats?.complianceRate || 0}%` }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search drivers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 w-44 pl-8 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-1">
            {[
              { label: "All", value: "all" },
              { label: "Driving", value: "driving" },
              { label: "On Duty", value: "onDuty" },
              { label: "Violations", value: "violation" },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn("text-xs px-2 py-1 rounded transition-colors",
                  statusFilter === f.value ? "bg-cyan-500/20 text-cyan-400 font-semibold" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto">
        {driversQuery?.isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading driver HOS data...</div>
        ) : sortedDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            {!isConnected ? (
              <>
                <WifiOff className="w-12 h-12 mb-4 text-slate-600" />
                <p className="text-sm font-semibold mb-1">No ELD Connected</p>
                <p className="text-xs text-slate-600 max-w-md text-center">
                  Connect your fleet's ELD provider (Samsara, Motive, Geotab, etc.) to see real-time HOS data for all your drivers.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {ELD_PROVIDERS.slice(0, 6).map(p => (
                    <Badge key={p} className="bg-white/[0.04] text-slate-500 border-white/[0.06] text-xs">{p}</Badge>
                  ))}
                </div>
              </>
            ) : (
              <>
                <User className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-semibold">No drivers found</p>
                <p className="text-xs text-slate-600 mt-1">{search ? "Try a different search" : "No drivers match this filter"}</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {sortedDrivers.map((driver: any, idx: number) => {
              const status = driver.currentStatus || driver.status || "offDuty";
              const sc = HOS_STATUS_CONFIG[status] || HOS_STATUS_CONFIG.offDuty;
              const StatusIcon = sc.icon;
              const isExpanded = expandedDriver === (driver.driverId || String(idx));

              // HOS calculations
              const driveUsed = Math.round((660 - (driver.driveTimeRemaining || 660)) / 60 * 10) / 10;
              const shiftUsed = Math.round((840 - (driver.onDutyTimeRemaining || 840)) / 60 * 10) / 10;
              const cycleUsed = Math.round((4200 - (driver.cycleTimeRemaining || 4200)) / 60 * 10) / 10;
              const driveRemaining = Math.max(0, 11 - driveUsed);
              const shiftRemaining = Math.max(0, 14 - shiftUsed);

              return (
                <div key={driver.driverId || idx}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left",
                      driver.hasViolation && "bg-red-500/[0.03] border-l-2 border-red-500",
                    )}
                    onClick={() => setExpandedDriver(isExpanded ? null : (driver.driverId || String(idx)))}
                  >
                    {/* Avatar */}
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      status === "driving" ? "bg-green-500/20 text-green-400" :
                      ["onDuty", "on_duty"].includes(status) ? "bg-blue-500/20 text-blue-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {(driver.name || "D").charAt(0).toUpperCase()}
                    </div>

                    {/* Driver Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{driver.name || `Driver ${driver.driverId}`}</span>
                        <Badge className={cn("border-0 text-xs font-bold gap-0.5", sc.bg, sc.color)}>
                          <StatusIcon className="w-2.5 h-2.5" />{sc.label}
                        </Badge>
                        {driver.hasViolation && (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-xs font-bold gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />Violation
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {driver.vehicle && <span>{driver.vehicle}</span>}
                        {driver.provider && <span className="text-slate-600">via {driver.provider}</span>}
                        {driver.lastUpdate && <span>Updated {new Date(driver.lastUpdate).toLocaleTimeString()}</span>}
                      </div>
                    </div>

                    {/* HOS Mini Bars */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-20">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-slate-500">Drive</span>
                          <span className={cn("font-bold tabular-nums", driveRemaining <= 1 ? "text-red-400" : "text-green-400")}>{driveRemaining.toFixed(1)}h</span>
                        </div>
                        {getHOSBar(driveUsed, 11, "green")}
                      </div>
                      <div className="w-20">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-slate-500">Shift</span>
                          <span className={cn("font-bold tabular-nums", shiftRemaining <= 1 ? "text-red-400" : "text-blue-400")}>{shiftRemaining.toFixed(1)}h</span>
                        </div>
                        {getHOSBar(shiftUsed, 14, "blue")}
                      </div>
                      <div className="w-20">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-slate-500">Cycle</span>
                          <span className="text-purple-400 font-bold tabular-nums text-xs">{(70 - cycleUsed).toFixed(1)}h</span>
                        </div>
                        {getHOSBar(cycleUsed, 70, "purple")}
                      </div>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 bg-white/[0.01] border-b border-white/[0.04]">
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        {[
                          { label: "Drive Time", used: driveUsed, max: 11, remaining: driveRemaining, color: "green", unit: "h" },
                          { label: "On-Duty (Shift)", used: shiftUsed, max: 14, remaining: shiftRemaining, color: "blue", unit: "h" },
                          { label: "70hr Cycle", used: cycleUsed, max: 70, remaining: 70 - cycleUsed, color: "purple", unit: "h" },
                          { label: "Break", used: driver.breakTimeUsed ? Math.round(driver.breakTimeUsed / 60) : 0, max: 8, remaining: 8, color: "amber", unit: "h until req" },
                        ].map(h => (
                          <div key={h.label} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                            <div className="text-xs text-slate-500 mb-1">{h.label}</div>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className={cn("text-lg font-bold tabular-nums",
                                h.color === "green" ? "text-green-400" : h.color === "blue" ? "text-blue-400" : h.color === "purple" ? "text-purple-400" : "text-amber-400"
                              )}>{h.used.toFixed(1)}</span>
                              <span className="text-xs text-slate-500">/ {h.max}{h.unit === "h" ? "h" : ""}</span>
                            </div>
                            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all",
                                  h.used / h.max >= 0.85 ? "bg-red-500" :
                                  h.color === "green" ? "bg-green-500" : h.color === "blue" ? "bg-blue-500" : h.color === "purple" ? "bg-purple-500" : "bg-amber-500"
                                )}
                                style={{ width: `${Math.min(100, (h.used / h.max) * 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {h.remaining.toFixed(1)}h remaining
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Violations */}
                      {driver.hasViolation && (
                        <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-3 mb-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" />HOS Violation Detected
                          </div>
                          <p className="text-xs text-red-400/70">
                            Driver has exceeded HOS limits. Contact immediately to ensure compliance.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-cyan-400 hover:text-cyan-300">
                          <Phone className="w-3 h-3 mr-1" />Call Driver
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-violet-400 hover:text-violet-300">
                          <MessageSquare className="w-3 h-3 mr-1" />Message
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-slate-400 hover:text-slate-300">
                          <Eye className="w-3 h-3 mr-1" />View Full Log
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs text-slate-500 shrink-0">
        <div className="flex gap-4">
          <span><span className="text-green-400 font-medium">{drivingCount}</span> driving</span>
          <span><span className="text-blue-400 font-medium">{onDutyCount}</span> on duty</span>
          <span><span className="text-purple-400 font-medium">{restCount}</span> resting</span>
          {violationCount > 0 && <span><span className="text-red-400 font-medium">{violationCount}</span> violations</span>}
        </div>
        <span>Auto-syncs every 60s · FMCSA 49 CFR 395</span>
      </div>
    </div>
  );
}
