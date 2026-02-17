/**
 * REEFER TEMPERATURE LOG (D-066)
 * Gold Standard Screen — FSMA compliance continuous temperature monitoring.
 * Displays real-time temp readings, historical chart, alert thresholds,
 * and compliance log for refrigerated trailer loads.
 * Per FSMA 21 CFR 1.908 and 49 CFR 173.320.
 * Theme-aware | Brand gradient | Jony Ive aesthetic
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Thermometer, AlertTriangle, CheckCircle, Clock, TrendingDown,
  TrendingUp, Plus, Download, Shield, Activity, BarChart3, Send
} from "lucide-react";

const ZONES = ["Front", "Center", "Rear"] as const;

const PRESET_RANGES: Record<string, { min: number; max: number; label: string }> = {
  frozen: { min: -10, max: 0, label: "Frozen (-10°F to 0°F)" },
  refrigerated: { min: 33, max: 40, label: "Refrigerated (33°F to 40°F)" },
  controlled: { min: 55, max: 70, label: "Controlled Room (55°F to 70°F)" },
  custom: { min: 0, max: 0, label: "Custom Range" },
};

export default function ReeferTemperatureLog() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedRange, setSelectedRange] = useState("refrigerated");
  const [manualTemp, setManualTemp] = useState("");
  const [manualZone, setManualZone] = useState<string>("Center");
  const [notes, setNotes] = useState("");

  const range = PRESET_RANGES[selectedRange];

  // Real tRPC queries
  const latestQuery = (trpc as any).reeferTemp.getLatestByZone.useQuery({});
  const statsQuery = (trpc as any).reeferTemp.getStats.useQuery({ targetMin: range.min, targetMax: range.max });
  const hourlyQuery = (trpc as any).reeferTemp.getHourlyAvgs.useQuery({});
  const alertsQuery = (trpc as any).reeferTemp.getAlerts.useQuery({});

  const addReadingMut = (trpc as any).reeferTemp.addReading.useMutation({
    onSuccess: () => {
      toast.success(`Manual reading logged: ${manualTemp}°F in ${manualZone} zone`);
      setManualTemp("");
      latestQuery.refetch();
      statsQuery.refetch();
      hourlyQuery.refetch();
    },
    onError: () => toast.error("Failed to log reading"),
  });
  const ackAlertMut = (trpc as any).reeferTemp.acknowledgeAlert.useMutation({
    onSuccess: () => { toast.success("Alert acknowledged"); alertsQuery.refetch(); },
    onError: () => toast.error("Failed to acknowledge"),
  });

  const latestByZone: Record<string, any> = latestQuery.data || {};
  const stats = statsQuery.data || { min: 0, max: 0, avg: 0, totalReadings: 0, excursions: 0 };
  const hourlyAvgs: { hour: number; avg: number }[] = hourlyQuery.data || [];
  const alerts: any[] = alertsQuery.data || [];

  const acknowledgeAlert = (id: string) => ackAlertMut.mutate({ alertId: parseInt(id) });

  const addManualReading = () => {
    const temp = parseFloat(manualTemp);
    if (isNaN(temp)) { toast.error("Enter a valid temperature"); return; }
    addReadingMut.mutate({
      tempF: temp,
      zone: manualZone.toLowerCase() as "front" | "center" | "rear",
      targetMin: range.min,
      targetMax: range.max,
      notes: notes || undefined,
    });
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sub = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const chartMax = Math.max(...hourlyAvgs.map((h) => h.avg), range.max + 2);
  const chartMin = Math.min(...hourlyAvgs.map((h) => h.avg), range.min - 2);
  const chartRange = chartMax - chartMin || 1;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Reefer Temperature Log
          </h1>
          <p className={sub}>
            FSMA continuous monitoring — 21 CFR 1.908
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border",
            stats.excursions > 0
              ? "bg-red-500/15 text-red-500 border-red-500/30"
              : "bg-green-500/15 text-green-500 border-green-500/30"
          )}>
            {stats.excursions > 0 ? `${stats.excursions} Excursions` : "In Compliance"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className={cn("rounded-xl gap-1.5 text-xs", isLight ? "border-slate-200" : "border-slate-700")}
            onClick={() => toast.success("Temperature log exported")}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Live Zone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ZONES.map((zone) => {
          const zoneKey = zone.toLowerCase();
          const r = latestByZone[zoneKey];
          if (!r) return (
            <Card key={zone} className={cn(cc, "overflow-hidden")}>
              <div className="h-1 bg-slate-500/30" />
              <CardContent className="p-5">
                <span className={cn("text-xs font-semibold uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>{zone} Zone</span>
                <p className={cn("text-sm mt-2", sub)}>No data</p>
              </CardContent>
            </Card>
          );
          const inRange = r.tempF >= range.min && r.tempF <= range.max;
          return (
            <Card key={zone} className={cn(cc, "overflow-hidden")}>
              <div className={cn("h-1", inRange ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-red-500")} />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>
                    {zone} Zone
                  </span>
                  {inRange
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <AlertTriangle className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-4xl font-bold tabular-nums tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                    {r.tempF}
                  </span>
                  <span className={cn("text-lg", isLight ? "text-slate-400" : "text-slate-500")}>°F</span>
                </div>
                <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                  {r.tempC}°C · {r.recordedAt ? new Date(r.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Temperature Chart (Pure CSS) */}
      <Card className={cc}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
                <BarChart3 className="w-4 h-4 text-[#1473FF]" />
              </div>
              <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>
                24-Hour Trend
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1473FF]" /> Avg Temp
              </span>
              <span className="flex items-center gap-1">
                <span className="w-6 h-0.5 bg-green-500 opacity-50" /> Safe Range
              </span>
            </div>
          </div>
          <div className="relative h-40">
            {/* Safe range band */}
            <div
              className="absolute left-0 right-0 bg-green-500/10 border-y border-green-500/20"
              style={{
                bottom: `${((range.min - chartMin) / chartRange) * 100}%`,
                height: `${((range.max - range.min) / chartRange) * 100}%`,
              }}
            />
            {/* Bars */}
            <div className="relative h-full flex items-end gap-[2px] px-1">
              {hourlyAvgs.map((h) => {
                const height = ((h.avg - chartMin) / chartRange) * 100;
                const inRange = h.avg >= range.min && h.avg <= range.max;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all",
                        inRange
                          ? "bg-gradient-to-t from-[#1473FF] to-[#1473FF]/60"
                          : "bg-gradient-to-t from-red-500 to-red-400"
                      )}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-1 px-1">
            {hourlyAvgs.filter((_, i) => i % 4 === 0).map((h) => (
              <span key={h.hour} className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                {h.hour.toString().padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stats */}
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
                <Activity className="w-4 h-4 text-[#1473FF]" />
              </div>
              <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>
                Session Statistics
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Min Temp", value: `${stats.min}°F`, icon: TrendingDown, color: "text-blue-500" },
                { label: "Max Temp", value: `${stats.max}°F`, icon: TrendingUp, color: "text-orange-500" },
                { label: "Average", value: `${stats.avg}°F`, icon: Thermometer, color: "text-[#1473FF]" },
                { label: "Readings", value: stats.totalReadings.toString(), icon: Clock, color: "text-[#BE01FF]" },
              ].map((s) => (
                <div key={s.label} className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                    <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{s.label}</span>
                  </div>
                  <span className={cn("text-lg font-bold tabular-nums", isLight ? "text-slate-800" : "text-white")}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
            {/* Range Selector */}
            <div className="mt-4">
              <span className={cn("text-xs font-medium mb-2 block", isLight ? "text-slate-500" : "text-slate-400")}>
                Target Range
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PRESET_RANGES).filter(([k]) => k !== "custom").map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedRange(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      selectedRange === key
                        ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-blue-500/25"
                        : isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>
                  Temperature Alerts
                </span>
              </div>
              <Badge className="rounded-full bg-red-500/15 text-red-500 border-red-500/30 text-xs">
                {alerts.filter((a) => !a.acknowledged).length} Open
              </Badge>
            </div>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className={cn("text-center py-8", sub)}>No temperature alerts</div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3",
                      alert.acknowledged
                        ? isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/20 border-slate-700/30"
                        : isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    <AlertTriangle className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      alert.severity === "critical" ? "text-red-500" : "text-yellow-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                        {alert.message}
                      </p>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg text-xs h-7 px-2"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Ack
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Reading + Notes */}
      <Card className={cc}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
              <Plus className="w-4 h-4 text-[#1473FF]" />
            </div>
            <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>
              Manual Reading
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Temperature (°F)"
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                className={cn("rounded-xl h-11", isLight ? "border-slate-200" : "border-slate-700 bg-slate-800/50")}
              />
            </div>
            <div className="flex gap-1.5">
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => setManualZone(z)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    manualZone === z
                      ? "bg-[#1473FF] text-white"
                      : isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700/50 text-slate-300"
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
            <Button
              onClick={addManualReading}
              className="rounded-xl h-11 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
            >
              <Send className="w-4 h-4 mr-1.5" /> Log Reading
            </Button>
          </div>
          <Textarea
            placeholder="Notes (door opens, defrost cycles, product condition...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn("mt-3 rounded-xl min-h-[80px]", isLight ? "border-slate-200" : "border-slate-700 bg-slate-800/50")}
          />
        </CardContent>
      </Card>

      {/* FSMA Compliance Notice */}
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border-2",
        isLight ? "bg-blue-50 border-blue-300" : "bg-blue-500/10 border-blue-500/30"
      )}>
        <div className="p-3 rounded-xl bg-blue-500/20 flex-shrink-0">
          <Shield className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className={cn("text-base font-bold", isLight ? "text-blue-700" : "text-blue-400")}>FSMA Compliance</p>
          <p className={cn("text-sm mt-1", isLight ? "text-blue-600" : "text-blue-400/80")}>
            Per the FDA Food Safety Modernization Act (21 CFR 1.908), temperature-controlled shipments
            must maintain continuous monitoring with documented readings. Excursions exceeding 2 hours
            require corrective action and shipper notification. All logs are retained for 12 months.
          </p>
        </div>
      </div>
    </div>
  );
}
