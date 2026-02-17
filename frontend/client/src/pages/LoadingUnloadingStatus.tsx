/**
 * LOADING/UNLOADING STATUS PAGE
 * Driver-facing real-time loading and unloading progress screen.
 * Tracks compartment fill levels, flow rates, temperature,
 * and provides step-by-step loading/unloading procedures.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Droplets, CheckCircle, AlertTriangle, Clock, Gauge,
  Thermometer, ArrowRight, Shield, Send, Activity
} from "lucide-react";

type OperationType = "loading" | "unloading";
type CompartmentStatus = "empty" | "filling" | "full" | "draining" | "complete";

type Compartment = {
  id: string;
  name: string;
  capacity: number;
  currentLevel: number;
  status: CompartmentStatus;
  product: string;
  temperature: number;
  flowRate: number;
};

const SAMPLE_COMPARTMENTS: Compartment[] = [
  { id: "c1", name: "Compartment 1", capacity: 3200, currentLevel: 3200, status: "full", product: "Crude Oil", temperature: 78, flowRate: 0 },
  { id: "c2", name: "Compartment 2", capacity: 3000, currentLevel: 2100, status: "filling", product: "Crude Oil", temperature: 76, flowRate: 450 },
  { id: "c3", name: "Compartment 3", capacity: 3000, currentLevel: 0, status: "empty", product: "Crude Oil", temperature: 72, flowRate: 0 },
];

const STATUS_CFG: Record<CompartmentStatus, { label: string; color: string; bg: string }> = {
  empty: { label: "Empty", color: "text-slate-400", bg: "bg-slate-500/15" },
  filling: { label: "Filling", color: "text-blue-500", bg: "bg-blue-500/15" },
  full: { label: "Full", color: "text-green-500", bg: "bg-green-500/15" },
  draining: { label: "Draining", color: "text-orange-500", bg: "bg-orange-500/15" },
  complete: { label: "Complete", color: "text-green-500", bg: "bg-green-500/15" },
};

const LOADING_STEPS = [
  { step: 1, label: "Ground vehicle and verify connection", done: true },
  { step: 2, label: "Connect loading arms to fill connections", done: true },
  { step: 3, label: "Open internal valves for active compartment", done: true },
  { step: 4, label: "Begin product transfer — monitor flow rate", done: true },
  { step: 5, label: "Monitor fill level — do not exceed outage", done: false },
  { step: 6, label: "Close valves and disconnect loading arms", done: false },
  { step: 7, label: "Verify seal integrity and close all hatches", done: false },
  { step: 8, label: "Remove ground connection last", done: false },
  { step: 9, label: "Verify placards and shipping papers", done: false },
];

export default function LoadingUnloadingStatus() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [opType] = useState<OperationType>("loading");
  const [compartments] = useState(SAMPLE_COMPARTMENTS);

  const totalCapacity = compartments.reduce((s, c) => s + c.capacity, 0);
  const totalLoaded = compartments.reduce((s, c) => s + c.currentLevel, 0);
  const overallPct = Math.round((totalLoaded / totalCapacity) * 100);
  const activeCompartment = compartments.find((c) => c.status === "filling" || c.status === "draining");
  const completedSteps = LOADING_STEPS.filter((s) => s.done).length;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {opType === "loading" ? "Loading" : "Unloading"} Status
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Real-time {opType} progress and compartment monitoring
          </p>
        </div>
        <Badge className={cn(
          "rounded-full px-3 py-1 text-xs font-bold border",
          activeCompartment ? "bg-blue-500/15 text-blue-500 border-blue-500/30 animate-pulse" : "bg-green-500/15 text-green-500 border-green-500/30"
        )}>
          {activeCompartment ? "In Progress" : "Complete"}
        </Badge>
      </div>

      {/* Overall progress */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Overall Progress</p>
            <p className={cn("text-lg font-black tabular-nums", "text-[#1473FF]")}>{overallPct}%</p>
          </div>
          <div className={cn("h-4 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700")}>
            <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{totalLoaded.toLocaleString()} / {totalCapacity.toLocaleString()} gal</p>
            {activeCompartment && (
              <p className={cn("text-xs flex items-center gap-1", isLight ? "text-blue-500" : "text-blue-400")}>
                <Activity className="w-3 h-3" /> {activeCompartment.flowRate} gal/min
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compartments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {compartments.map((comp) => {
          const pct = Math.round((comp.currentLevel / comp.capacity) * 100);
          const st = STATUS_CFG[comp.status];
          const isActive = comp.status === "filling" || comp.status === "draining";
          return (
            <Card key={comp.id} className={cn(cc, "overflow-hidden", isActive && "ring-2 ring-blue-500/30")}>
              {isActive && <div className="h-1 bg-blue-500 animate-pulse" />}
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{comp.name}</p>
                  <Badge className={cn("text-[9px] border", st.bg, st.color, "border-current/20")}>{st.label}</Badge>
                </div>

                {/* Tank visualization */}
                <div className={cn("relative h-32 rounded-xl overflow-hidden mb-3", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 transition-all duration-1000 rounded-b-xl",
                      isActive ? "bg-blue-500/30" : comp.status === "full" ? "bg-green-500/20" : "bg-slate-500/10"
                    )}
                    style={{ height: `${pct}%` }}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 animate-pulse" />
                    )}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className={cn("text-2xl font-black tabular-nums", st.color)}>{pct}%</p>
                    <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                      {comp.currentLevel.toLocaleString()} / {comp.capacity.toLocaleString()} gal
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn("p-2 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                    <Thermometer className="w-3 h-3 mx-auto text-orange-400" />
                    <p className={cn("text-xs font-bold mt-0.5", isLight ? "text-slate-700" : "text-white")}>{comp.temperature}°F</p>
                  </div>
                  <div className={cn("p-2 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                    <Gauge className="w-3 h-3 mx-auto text-blue-400" />
                    <p className={cn("text-xs font-bold mt-0.5", isLight ? "text-slate-700" : "text-white")}>{comp.flowRate} g/m</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loading Steps */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Shield className="w-4 h-4 text-[#1473FF]" />
            {opType === "loading" ? "Loading" : "Unloading"} Procedure ({completedSteps}/{LOADING_STEPS.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {LOADING_STEPS.map((step) => (
            <div key={step.step} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-colors",
              step.done
                ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                : isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
            )}>
              <div className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold",
                step.done ? "bg-green-500 text-white" : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
              )}>
                {step.done ? <CheckCircle className="w-4 h-4" /> : step.step}
              </div>
              <p className={cn("text-sm", step.done ? "text-green-600 line-through opacity-60" : isLight ? "text-slate-700" : "text-slate-200")}>{step.label}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Safety reminder */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
      )}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Safety Reminder</p>
          <p className="text-xs mt-0.5 opacity-80">
            Remain within 25 feet of the vehicle during the entire {opType} operation.
            Monitor for unusual odors, leaks, or pressure changes. Do not leave the facility
            until all compartments are verified and paperwork is signed.
          </p>
        </div>
      </div>
    </div>
  );
}
