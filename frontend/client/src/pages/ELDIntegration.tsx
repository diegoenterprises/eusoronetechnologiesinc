/**
 * ELD INTEGRATION PAGE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Symbiotic ELD integration — connect any of 11 major ELD providers:
 * Samsara, Geotab, Powerfleet, Zonar, Motive, Lytx, Netradyne,
 * Verizon Connect, Azuga, Solera, Trimble/PeopleNet
 * 
 * Sections:
 * 1. ELD Connection Panel — Provider picker, API key entry, status
 * 2. Fleet HOS Stats — Real-time compliance dashboard
 * 3. Live Fleet GPS — Real-time driver locations from ELD
 * 4. Driver HOS Table — Per-driver hours breakdown
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Clock, User, Truck, CheckCircle, AlertTriangle,
  RefreshCw, Satellite, MapPin, Wifi, Radio, Gauge,
  Navigation, Zap, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ELDConnectionPanel from "@/components/ELDConnectionPanel";
import { useLocale } from "@/hooks/useLocale";

export default function ELDIntegration() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"connection" | "fleet" | "drivers">("connection");

  const driversQuery = (trpc as any).eld?.getDriverStatus?.useQuery?.({ filter }, { refetchInterval: 60000 });
  const statsQuery = (trpc as any).eld?.getStats?.useQuery?.({}, { refetchInterval: 60000 });
  const fleetGPSQuery = (trpc as any).eld?.getFleetGPS?.useQuery?.(undefined, { refetchInterval: 30000, staleTime: 15000 });
  const connectionQuery = (trpc as any).eld?.getConnectionStatus?.useQuery?.(undefined, { refetchInterval: 60000 });

  const stats = statsQuery?.data;
  const fleetGPS = fleetGPSQuery?.data;
  const isConnected = connectionQuery?.data?.connected;

  // Style helpers
  const card = cn("rounded-2xl border backdrop-blur-sm", isLight ? "bg-white/80 border-slate-200/60 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const heading = cn("font-semibold", isLight ? "text-slate-900" : "text-white");
  const muted = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      driving: { label: "Driving", cls: isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400" },
      onDuty: { label: "On Duty", cls: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400" },
      on_duty: { label: "On Duty", cls: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400" },
      sleeperBerth: { label: "Sleeper", cls: isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-400" },
      sleeper: { label: "Sleeper", cls: isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-400" },
      offDuty: { label: "Off Duty", cls: isLight ? "bg-slate-100 text-slate-600" : "bg-slate-500/20 text-slate-400" },
      off_duty: { label: "Off Duty", cls: isLight ? "bg-slate-100 text-slate-600" : "bg-slate-500/20 text-slate-400" },
    };
    const s = map[status] || { label: status, cls: isLight ? "bg-slate-100 text-slate-500" : "bg-slate-500/20 text-slate-400" };
    return <Badge className={cn("border-0 text-xs font-bold", s.cls)}>{s.label}</Badge>;
  };

  const TABS = [
    { id: "connection" as const, label: "ELD Connection", icon: Radio },
    { id: "fleet" as const, label: "Live Fleet GPS", icon: Satellite, count: fleetGPS?.count },
    { id: "drivers" as const, label: "Driver HOS", icon: Clock },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {t('eldIntegration.title')}
          </h1>
          <p className={muted}>Symbiotic read connection to your Electronic Logging Device</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border", isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn("text-xs font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>
                {connectionQuery?.data?.providers?.[0]?.name || "Connected"}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            className={cn("rounded-xl", isLight ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06]")}
            onClick={() => { driversQuery?.refetch?.(); fleetGPSQuery?.refetch?.(); statsQuery?.refetch?.(); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />Sync
          </Button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: User, label: "Drivers", value: stats?.totalDrivers || 0, color: "#06B6D4", loading: statsQuery?.isLoading },
          { icon: Truck, label: "Driving", value: stats?.driving || 0, color: "#22C55E", loading: statsQuery?.isLoading },
          { icon: Clock, label: "On Duty", value: stats?.onDuty || 0, color: "#3B82F6", loading: statsQuery?.isLoading },
          { icon: AlertTriangle, label: "Violations", value: stats?.violations || 0, color: "#EF4444", loading: statsQuery?.isLoading },
          { icon: CheckCircle, label: "Compliance", value: `${stats?.complianceRate || 0}%`, color: "#8B5CF6", loading: statsQuery?.isLoading },
        ].map(s => (
          <div key={s.label} className={cn(card, "p-4")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                {s.loading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>}
                <p className={cn("text-xs font-medium", muted)}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className={cn("flex gap-1 p-1 rounded-xl border", isLight ? "bg-slate-100/80 border-slate-200/60" : "bg-white/[0.02] border-white/[0.06]")}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === t.id
                ? (isLight ? "bg-white text-slate-900 shadow-sm" : "bg-white/[0.08] text-white")
                : (isLight ? "text-slate-500 hover:text-slate-700" : "text-white/40 hover:text-white/60"),
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: ELD CONNECTION ── */}
      {activeTab === "connection" && <ELDConnectionPanel onConnected={() => connectionQuery?.refetch?.()} />}

      {/* ── TAB: LIVE FLEET GPS ── */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          <div className={cn(card, "p-5")}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isLight ? "bg-blue-50" : "bg-[#1473FF]/10")}>
                  <Satellite className="w-5 h-5 text-[#1473FF]" />
                </div>
                <div>
                  <div className={cn("text-base font-bold", heading)}>Live Fleet Positions</div>
                  <div className={muted}>
                    {fleetGPS?.count || 0} vehicles tracked
                    {fleetGPS?.source && fleetGPS.source !== "none" && (
                      <span className={cn("ml-2 text-xs font-medium px-1.5 py-0.5 rounded-md", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
                        via {fleetGPS.provider} ({fleetGPS.source})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn("rounded-lg", isLight ? "border-slate-200" : "border-white/[0.08]")}
                onClick={() => fleetGPSQuery?.refetch?.()}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
              </Button>
            </div>

            {fleetGPSQuery?.isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : !fleetGPS?.locations?.length ? (
              <div className={cn("text-center py-12 rounded-xl border", isLight ? "bg-slate-50 border-slate-100" : "bg-white/[0.01] border-white/[0.04]")}>
                <Satellite className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-white/15")} />
                <p className={cn("text-sm font-semibold mb-1", heading)}>No Live GPS Data</p>
                <p className={cn("text-xs max-w-md mx-auto", muted)}>
                  Connect your ELD provider to see real-time fleet positions. Go to the "ELD Connection" tab to link your Samsara, Motive, Geotab, or other ELD device.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fleetGPS.locations.slice(0, 20).map((loc: any, i: number) => (
                  <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border", isLight ? "bg-white border-slate-100" : "bg-white/[0.02] border-white/[0.04]")}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
                      <Navigation className="w-4 h-4 text-emerald-500" style={{ transform: `rotate(${loc.heading || 0}deg)` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-semibold", heading)}>
                        {loc.driverId ? `Driver ${loc.driverId}` : `Vehicle ${loc.vehicleId || i + 1}`}
                      </div>
                      <div className={cn("text-xs flex items-center gap-2", muted)}>
                        <MapPin className="w-3 h-3" /> {loc.lat?.toFixed(4)}°, {loc.lng?.toFixed(4)}°
                        {loc.roadName && <span>• {loc.roadName}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold tabular-nums", loc.speed > 0 ? (isLight ? "text-emerald-600" : "text-emerald-400") : muted)}>
                        {Math.round(loc.speed || 0)} mph
                      </div>
                      <div className={cn("text-xs", muted)}>
                        {loc.heading ? `${Math.round(loc.heading)}°` : "—"}
                      </div>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full", loc.speed > 0 ? "bg-emerald-500 animate-pulse" : (isLight ? "bg-slate-300" : "bg-white/20"))} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: DRIVER HOS ── */}
      {activeTab === "drivers" && (
        <div className="space-y-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className={cn("w-[160px] rounded-xl", isLight ? "bg-white border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="driving">Driving</SelectItem>
              <SelectItem value="onDuty">On Duty</SelectItem>
              <SelectItem value="offDuty">Off Duty</SelectItem>
              <SelectItem value="violation">Violations</SelectItem>
            </SelectContent>
          </Select>

          <div className={cn(card, "overflow-hidden")}>
            <div className={cn("px-5 py-4 border-b flex items-center gap-2", isLight ? "border-slate-100" : "border-white/[0.04]")}>
              <Clock className="w-5 h-5 text-[#1473FF]" />
              <span className={cn("text-base font-bold", heading)}>Driver HOS Status</span>
            </div>
            <div>
              {driversQuery?.isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : !(driversQuery?.data as any)?.length ? (
                <div className="text-center py-16">
                  <User className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-white/15")} />
                  <p className={cn("text-sm font-semibold mb-1", heading)}>No Drivers Found</p>
                  <p className={cn("text-xs", muted)}>Connect your ELD provider to see driver HOS data</p>
                </div>
              ) : (
                <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-white/[0.04]")}>
                  {(driversQuery?.data as any)?.map((driver: any, idx: number) => (
                    <div key={driver.driverId || idx} className={cn("p-4", driver.hasViolation && (isLight ? "bg-red-50/50 border-l-2 border-red-500" : "bg-red-500/[0.03] border-l-2 border-red-500"))}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                            isLight ? "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600" : "bg-gradient-to-br from-slate-600 to-slate-700 text-white"
                          )}>{(driver.name || "D").charAt(0)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={cn("font-medium", heading)}>{driver.name || `Driver ${driver.driverId}`}</p>
                              {getStatusBadge(driver.currentStatus || driver.status)}
                              {driver.hasViolation && (
                                <Badge className={cn("border-0 text-xs font-bold", isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")}>
                                  <AlertTriangle className="w-3 h-3 mr-1" />Violation
                                </Badge>
                              )}
                            </div>
                            <p className={cn("text-xs", muted)}>
                              {driver.vehicle || "—"} | {driver.provider || "ELD"} | Updated {driver.lastUpdate ? new Date(driver.lastUpdate).toLocaleTimeString() : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Driving", used: Math.round((660 - (driver.driveTimeRemaining || 660)) / 60 * 10) / 10, max: 11, color: "#22C55E" },
                          { label: "On-Duty", used: Math.round((840 - (driver.onDutyTimeRemaining || 840)) / 60 * 10) / 10, max: 14, color: "#3B82F6" },
                          { label: "Cycle", used: Math.round((4200 - (driver.cycleTimeRemaining || 4200)) / 60 * 10) / 10, max: 70, color: "#8B5CF6" },
                        ].map(h => (
                          <div key={h.label} className={cn("p-3 rounded-xl", isLight ? "bg-slate-50 border border-slate-100" : "bg-white/[0.02] border border-white/[0.04]")}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={cn("text-xs font-medium", muted)}>{h.label}</span>
                              <span className={cn("text-xs font-bold tabular-nums", heading)}>{h.used}h / {h.max}h</span>
                            </div>
                            <div className={cn("h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-white/[0.06]")}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (h.used / h.max) * 100)}%`, backgroundColor: h.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
