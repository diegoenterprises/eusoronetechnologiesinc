/**
 * DISASTER RESILIENCE PAGE (Phase 4 — Tasks 2.4.1 + 2.4.2)
 * Weather overlay, auto-reroute, multi-hazard dashboard, sheltering
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  CloudLightning, Wind, Droplets, Flame, AlertTriangle,
  MapPin, Navigation, Shield, Truck, Home, RefreshCw,
  ArrowRight, Clock, CheckCircle, XCircle, Thermometer
} from "lucide-react";

type DisasterTab = "threats" | "affected" | "shelters";

export default function DisasterResilience() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [tab, setTab] = useState<DisasterTab>("threats");

  const threatsQuery = (trpc as any).infrastructure?.disaster?.getActiveThreats?.useQuery?.() || { data: { threats: [] } };
  const affectedQuery = (trpc as any).infrastructure?.disaster?.getAffectedLoads?.useQuery?.({}) || { data: { loads: [] } };

  const threats: any[] = threatsQuery.data?.threats || [];
  const affected: any[] = affectedQuery.data?.loads || [];

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const threatIcon = (type: string) => {
    switch (type) {
      case "hurricane": return <Wind className="w-5 h-5 text-blue-500" />;
      case "wildfire": return <Flame className="w-5 h-5 text-orange-500" />;
      case "flood": return <Droplets className="w-5 h-5 text-cyan-500" />;
      case "tornado": return <CloudLightning className="w-5 h-5 text-purple-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "WARNING": return "bg-red-500/15 text-red-500 border-red-500/30";
      case "WATCH": return "bg-amber-500/15 text-amber-500 border-amber-500/30";
      case "ADVISORY": return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      default: return "bg-slate-500/15 text-slate-500";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Disaster Resilience</h1>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Weather threats, auto-reroute, hazmat sheltering & safe havens</p>
        </div>
        <div className="flex items-center gap-2">
          {threats.length > 0 && (
            <Badge className="bg-red-500/15 text-red-500 border-red-500/30 rounded-full px-3 py-1">
              <AlertTriangle className="w-3 h-3 mr-1" />{threats.length} active threat(s)
            </Badge>
          )}
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { threatsQuery.refetch?.(); toast.info("Refreshing threat data..."); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { id: "threats" as DisasterTab, label: "Active Threats", icon: <CloudLightning className="w-4 h-4" />, badge: threats.length },
          { id: "affected" as DisasterTab, label: "Affected Loads", icon: <Truck className="w-4 h-4" />, badge: affected.length },
          { id: "shelters" as DisasterTab, label: "Safe Havens", icon: <Home className="w-4 h-4" /> },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border", tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-md" : L ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600")}>
            {t.icon}{t.label}
            {t.badge ? <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Active Threats */}
      {tab === "threats" && (
        <div className="space-y-4">
          {threats.length === 0 ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <CheckCircle className={cn("w-12 h-12 mx-auto mb-3 text-green-500")} />
                <p className={cn("font-medium text-lg", L ? "text-slate-600" : "text-slate-300")}>No Active Threats</p>
                <p className={cn("text-sm mt-1", L ? "text-slate-400" : "text-slate-500")}>All routes are clear. Data sourced from National Weather Service.</p>
              </CardContent>
            </Card>
          ) : threats.map((t: any) => (
            <Card key={t.id} className={cn(cc, "overflow-hidden")}>
              <div className={cn("h-1.5", t.severity === "WARNING" ? "bg-red-500" : t.severity === "WATCH" ? "bg-amber-500" : "bg-blue-500")} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", t.type === "hurricane" ? "bg-blue-500/10" : t.type === "wildfire" ? "bg-orange-500/10" : "bg-cyan-500/10")}>
                      {threatIcon(t.type)}
                    </div>
                    <div>
                      <h3 className={cn("text-lg font-bold", L ? "text-slate-800" : "text-white")}>{t.name}</h3>
                      <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{t.type?.toUpperCase()} · Radius: {t.radius} mi · {t.affectedStates?.join(", ")}</p>
                    </div>
                  </div>
                  <Badge className={cn(severityColor(t.severity), "rounded-full px-3 py-1")}>{t.severity}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {t.eta && <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>ETA</p><p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{t.eta}</p></div>}
                  <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Affected Loads</p><p className={cn("text-sm font-bold mt-0.5", t.affectedLoads > 0 ? "text-red-500" : (L ? "text-slate-800" : "text-white"))}>{t.affectedLoads}</p></div>
                  {t.windSpeed && <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Wind Speed</p><p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{t.windSpeed}</p></div>}
                  {t.category && <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Category</p><p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{t.category}</p></div>}
                  {t.acresBurned && <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Acres Burned</p><p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{t.acresBurned?.toLocaleString()}</p></div>}
                  {t.containment !== undefined && <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Containment</p><p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{t.containment}%</p></div>}
                  {t.floodStage && <div className={sc}><p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Flood Stage</p><p className={cn("text-sm font-bold mt-0.5 text-red-500")}>{t.floodStage}</p></div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Affected Loads */}
      {tab === "affected" && (
        <div className="space-y-4">
          {affected.length === 0 ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <Truck className={cn("w-12 h-12 mx-auto mb-3", L ? "text-slate-300" : "text-slate-600")} />
                <p className={cn("font-medium text-lg", L ? "text-slate-600" : "text-slate-300")}>No Loads Affected</p>
                <p className={cn("text-sm mt-1", L ? "text-slate-400" : "text-slate-500")}>No active loads are currently in a threat zone.</p>
              </CardContent>
            </Card>
          ) : affected.map((load: any) => (
            <Card key={load.loadId} className={cc}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn("text-base font-bold", L ? "text-slate-800" : "text-white")}>{load.loadId}</p>
                      <Badge variant="outline" className="text-xs">Class {load.hazmatClass}</Badge>
                      <Badge className={cn("text-xs", load.status === "in_transit" ? "bg-green-500/15 text-green-500" : "bg-blue-500/15 text-blue-500")}>{load.status?.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>
                      {load.origin} <ArrowRight className="w-3 h-3 inline mx-1" /> {load.destination} · Driver: {load.driverName}
                    </p>
                  </div>
                  <Badge className={cn("rounded-full px-3 py-1", load.recommendedAction === "REROUTE" ? "bg-amber-500/15 text-amber-500" : "bg-blue-500/15 text-blue-500")}>
                    {load.recommendedAction}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className={sc}>
                    <p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>Threat</p>
                    <p className={cn("text-xs font-medium mt-0.5", L ? "text-slate-700" : "text-white")}>{load.threatType}</p>
                  </div>
                  <div className={sc}>
                    <p className={cn("text-xs uppercase", L ? "text-slate-400" : "text-slate-500")}>ETA Impact</p>
                    <p className={cn("text-xs font-medium mt-0.5", load.etaImpact !== "N/A" ? "text-amber-500" : (L ? "text-slate-700" : "text-white"))}>{load.etaImpact}</p>
                  </div>
                  {load.recommendedAction === "REROUTE" && (
                    <Button size="sm" className="ml-auto bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
                      <Navigation className="w-3.5 h-3.5 mr-1" />View Reroute
                    </Button>
                  )}
                  {load.recommendedAction === "HOLD" && (
                    <Button size="sm" variant="outline" className="ml-auto rounded-xl">
                      <Home className="w-3.5 h-3.5 mr-1" />Find Shelter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Safe Havens / Shelters */}
      {tab === "shelters" && (
        <div className="space-y-4">
          <div className={cn("flex items-start gap-3 p-4 rounded-xl text-sm", L ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300")}>
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Hazmat-Compatible Safe Havens</p>
              <p className="text-xs mt-0.5 opacity-80">
                Sheltering locations are pre-vetted for hazmat parking, security, and drainage requirements.
                Drivers can initiate shelter-in-place via the mobile app; dispatch and shipper are notified automatically.
              </p>
            </div>
          </div>

          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}>
                <Home className="w-5 h-5 text-[#1473FF]" />Nearby Safe Havens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Pilot Flying J #428", type: "Truck Stop", distance: "18.4 mi", hazmat: true, available: 12, total: 45, amenities: ["Fuel", "Food", "Showers"] },
                { name: "TA Travel Center #215", type: "Truck Stop", distance: "24.7 mi", hazmat: true, available: 23, total: 60, amenities: ["Fuel", "Food", "Repair"] },
                { name: "Enterprise Terminal Yard", type: "Warehouse", distance: "31.2 mi", hazmat: true, available: 8, total: 20, amenities: ["Security", "Covered Parking"] },
                { name: "Love's Travel Stop #337", type: "Truck Stop", distance: "38.1 mi", hazmat: false, available: 15, total: 35, amenities: ["Fuel", "Food"] },
              ].map((s, i) => (
                <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", s.hazmat ? "bg-green-500/10 text-green-500" : "bg-slate-200/50 text-slate-400")}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{s.type} · {s.distance}</span>
                        {s.hazmat && <Badge className="bg-green-500/15 text-green-500 text-xs">Hazmat OK</Badge>}
                        {!s.hazmat && <Badge className="bg-red-500/15 text-red-500 text-xs">No Hazmat</Badge>}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {s.amenities.map(a => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>{s.available}/{s.total}</p>
                    <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>spots avail</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
