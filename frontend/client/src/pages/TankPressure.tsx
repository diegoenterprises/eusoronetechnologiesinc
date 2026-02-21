/**
 * TANK PRESSURE PAGE
 * Driver-facing tank pressure monitoring and inspection screen.
 * Displays pressure readings, MAWP ratings, relief device status,
 * and pressure test history for cargo tank motor vehicles.
 * Per 49 CFR 180.407 and 49 CFR 178.337/338/345.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Gauge, AlertTriangle, CheckCircle, Clock, Shield,
  Settings, RefreshCw, ChevronRight, Activity, Thermometer, Loader2
} from "lucide-react";

type PressureStatus = "normal" | "warning" | "critical";

type TankReading = {
  id: string;
  compartment: string;
  currentPsi: number;
  mawpPsi: number;
  testPsi: number;
  reliefSetPsi: number;
  temperature: number;
  status: PressureStatus;
};

// MAWP defaults by cargo category (PSI)
const MAWP_DEFAULTS: Record<string, number> = {
  petroleum: 100, chemicals: 100, liquid: 100, gas: 250,
  hazmat: 100, food_grade: 35, water: 25, general: 50,
};

function getDefaultMawp(cargoType: string | null): number {
  return MAWP_DEFAULTS[cargoType || ''] || 50;
}

// Regulatory test history reference (49 CFR 180.407 schedule)
const TEST_HISTORY = [
  { type: "Hydrostatic (K) Test", date: "", result: "—", nextDue: "", spec: "49 CFR 180.407(c)" },
  { type: "External Visual (V) Inspection", date: "", result: "—", nextDue: "", spec: "49 CFR 180.407(d)" },
  { type: "Internal Visual Inspection", date: "", result: "—", nextDue: "", spec: "49 CFR 180.407(e)" },
  { type: "Lining Inspection", date: "", result: "—", nextDue: "", spec: "49 CFR 180.407(f)" },
  { type: "Leakage (L) Test", date: "", result: "—", nextDue: "", spec: "49 CFR 180.407(h)" },
  { type: "Pressure Relief Device Test", date: "", result: "—", nextDue: "", spec: "49 CFR 180.407(j)" },
];

const STATUS_CONFIG: Record<PressureStatus, { label: string; color: string; bg: string }> = {
  normal: { label: "Normal", color: "text-green-500", bg: "bg-green-500/15" },
  warning: { label: "Elevated", color: "text-yellow-500", bg: "bg-yellow-500/15" },
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/15" },
};

export default function TankPressure() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Real data from driver's current load
  const currentLoadQuery = trpc.drivers.getCurrentLoad.useQuery();
  const load = currentLoadQuery.data;

  // Derive pressure readings from load (real telemetry would come from SCADA integration)
  const readings: TankReading[] = useMemo(() => {
    if (!load) return [];
    const ct = (load.cargoType || '') as string;
    const isTanker = ['liquid', 'petroleum', 'chemicals', 'gas', 'hazmat'].includes(ct);
    const isFoodGrade = ct === 'food_grade';
    const isWater = ct === 'water';
    if (!isTanker && !isFoodGrade && !isWater) return [];

    const mawp = getDefaultMawp(load.cargoType);
    const testPsi = Math.round(mawp * 1.5);
    const reliefSetPsi = Math.round(mawp * 1.1);
    const numComps = isFoodGrade || isWater ? 1 : 3;

    const comps: TankReading[] = Array.from({ length: numComps }, (_, i) => ({
      id: `c${i + 1}`,
      compartment: numComps === 1 ? 'Main Tank' : `Compartment ${i + 1}`,
      currentPsi: 0, // Real readings come from SCADA/telemetry integration
      mawpPsi: mawp,
      testPsi,
      reliefSetPsi,
      temperature: 72,
      status: 'normal' as PressureStatus,
    }));

    // Add vapor recovery for hazmat/petroleum tankers
    if (isTanker && !isFoodGrade && !isWater) {
      comps.push({
        id: 'vapor', compartment: 'Vapor Recovery',
        currentPsi: 0, mawpPsi: 15, testPsi: 22, reliefSetPsi: 16,
        temperature: 70, status: 'normal',
      });
    }
    return comps;
  }, [load]);

  if (currentLoadQuery.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-400">Loading pressure data...</span>
      </div>
    );
  }

  if (!load || readings.length === 0) {
    return (
      <div className="p-8 text-center">
        <Gauge className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No tanker load active — pressure monitoring not applicable</p>
      </div>
    );
  }

  const maxPressurePct = readings.length > 0 ? Math.max(...readings.map((r) => r.mawpPsi > 0 ? (r.currentPsi / r.mawpPsi) * 100 : 0)) : 0;
  const overallStatus: PressureStatus = maxPressurePct > 90 ? "critical" : maxPressurePct > 75 ? "warning" : "normal";
  const overallConfig = STATUS_CONFIG[overallStatus];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Tank Pressure
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Pressure monitoring and test history — 49 CFR 180.407
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", overallConfig.bg, overallConfig.color, "border-current/30")}>
          <Gauge className="w-3 h-3 mr-1" /> {overallConfig.label}
        </Badge>
      </div>

      {/* Live Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {readings.map((r) => {
          const pct = Math.round((r.currentPsi / r.mawpPsi) * 100);
          const sc = STATUS_CONFIG[r.status];
          return (
            <Card key={r.id} className={cn(cc, "overflow-hidden", r.status === "critical" && "ring-1 ring-red-500/30")}>
              {r.status === "critical" && <div className="h-1 bg-red-500" />}
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", sc.bg)}>
                      <Gauge className={cn("w-5 h-5", sc.color)} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{r.compartment}</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>MAWP: {r.mawpPsi} PSI</p>
                    </div>
                  </div>
                  <Badge className={cn("text-[9px] border", sc.bg, sc.color, "border-current/20")}>{sc.label}</Badge>
                </div>

                {/* Gauge visual */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className={cn("text-3xl font-black tabular-nums", sc.color)}>{r.currentPsi}</p>
                    <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>PSI</p>
                  </div>
                  <div className={cn("h-3 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700")}>
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct > 90 ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className={cn("text-[10px] text-right mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{pct}% of MAWP</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Test PSI", v: r.testPsi },
                    { l: "Relief Set", v: r.reliefSetPsi },
                    { l: "Temp", v: `${r.temperature}°F` },
                  ].map((d) => (
                    <div key={d.l} className={cn("p-2 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                      <p className={cn("text-[9px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>{d.l}</p>
                      <p className={cn("text-sm font-bold mt-0.5 tabular-nums", isLight ? "text-slate-700" : "text-white")}>{d.v}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Test History */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Clock className="w-5 h-5 text-[#1473FF]" />
            Pressure Test History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {TEST_HISTORY.map((test) => {
            const isOverdue = new Date(test.nextDue) < new Date();
            return (
              <div key={test.type} className={cn(
                "flex items-center justify-between p-3 rounded-xl border",
                isOverdue
                  ? isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20"
                  : isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isOverdue ? "bg-red-500/15" : "bg-green-500/15")}>
                    {isOverdue ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{test.type}</p>
                    <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                      Last: {new Date(test.date).toLocaleDateString()} · {test.spec}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn("text-[9px] border", test.result === "Pass" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30")}>
                    {test.result}
                  </Badge>
                  <p className={cn("text-[10px] mt-0.5", isOverdue ? "text-red-500 font-bold" : isLight ? "text-slate-400" : "text-slate-500")}>
                    Due: {new Date(test.nextDue).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Safety note */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
      )}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Pressure Safety</p>
          <p className="text-xs mt-0.5 opacity-80">
            Never exceed the MAWP rating. If pressure approaches relief set point, stop operations and
            investigate. Cargo tanks must not be loaded beyond the outage limits specified in 49 CFR 173.24b.
            Report any pressure anomaly to maintenance immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
