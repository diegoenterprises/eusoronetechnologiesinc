/**
 * DOCK ASSIGNMENT PAGE
 * Driver-facing dock/bay assignment screen for loading/unloading.
 * Shows assigned dock number, position instructions, wait time,
 * and facility-specific procedures.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Clock, CheckCircle, AlertTriangle, Truck,
  Navigation, ArrowRight, Shield, RefreshCw, Phone, Loader2
} from "lucide-react";

type DockStatus = "assigned" | "waiting" | "loading" | "complete";

type DockInfo = {
  dockNumber: string;
  bay: string;
  facility: string;
  status: DockStatus;
  estimatedWait: number;
  loadNumber: string;
  product: string;
  instructions: string[];
  contactName: string;
  contactPhone: string;
};

// Default instructions by cargo type
const HAZMAT_INSTRUCTIONS = [
  "Proceed to assigned bay on the loading rack",
  "Position vehicle with driver side facing the control booth",
  "Set parking brake and chock wheels before disconnecting",
  "Ground vehicle before connecting loading arms",
  "Report to rack operator at control booth before loading begins",
  "Stay within 25 feet of vehicle during entire loading operation",
  "No cell phone use in loading zone — two-way radio only",
];
const FOOD_GRADE_INSTRUCTIONS = [
  "Proceed to assigned bay — food-grade loading area",
  "Present tank washout certificate to operator",
  "Set parking brake and chock wheels",
  "Connect sanitized hose to fill port — inspect for contaminants",
  "Verify product temperature is within acceptable range",
  "Stay within 25 feet of vehicle during loading",
  "Apply tamper-evident seal after loading is complete",
];
const WATER_INSTRUCTIONS = [
  "Proceed to assigned fill station",
  "Set parking brake and chock wheels",
  "Connect fill hose to tank inlet",
  "Monitor fill level — do not overfill",
  "Seal all ports and verify no leaks after filling",
];
const GENERAL_INSTRUCTIONS = [
  "Proceed to assigned dock/bay",
  "Set parking brake and chock wheels",
  "Open trailer as directed by dock staff",
  "Remain available during loading/unloading",
  "Verify seals and sign paperwork before departure",
];

function getInstructions(cargoType: string | null): string[] {
  if (!cargoType) return GENERAL_INSTRUCTIONS;
  if (['liquid', 'petroleum', 'chemicals', 'hazmat', 'gas'].includes(cargoType)) return HAZMAT_INSTRUCTIONS;
  if (cargoType === 'food_grade') return FOOD_GRADE_INSTRUCTIONS;
  if (cargoType === 'water') return WATER_INSTRUCTIONS;
  return GENERAL_INSTRUCTIONS;
}

const STATUS_CFG: Record<DockStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  assigned: { label: "Assigned", color: "text-blue-500", bg: "bg-blue-500/15", icon: <MapPin className="w-5 h-5" /> },
  waiting: { label: "Waiting", color: "text-yellow-500", bg: "bg-yellow-500/15", icon: <Clock className="w-5 h-5" /> },
  loading: { label: "Loading", color: "text-orange-500", bg: "bg-orange-500/15", icon: <Truck className="w-5 h-5" /> },
  complete: { label: "Complete", color: "text-green-500", bg: "bg-green-500/15", icon: <CheckCircle className="w-5 h-5" /> },
};

export default function DockAssignment() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [acknowledged, setAcknowledged] = useState(false);

  // Real data from driver's current load
  const currentLoadQuery = trpc.drivers.getCurrentLoad.useQuery();
  const load = currentLoadQuery.data;

  // Build dock info from load data
  const dock: DockInfo = useMemo(() => {
    if (!load) return {
      dockNumber: '--', bay: '--', facility: 'Unknown', status: 'assigned' as DockStatus,
      estimatedWait: 0, loadNumber: '--', product: '--',
      instructions: GENERAL_INSTRUCTIONS, contactName: 'Facility Contact', contactPhone: '',
    };
    const pickup = load.origin;
    return {
      dockNumber: 'TBD',
      bay: 'Assigned at arrival',
      facility: pickup.name || `${pickup.city}, ${pickup.state}`,
      status: 'assigned' as DockStatus,
      estimatedWait: 15,
      loadNumber: load.loadNumber,
      product: `${load.commodity}${load.hazmatClass ? ` — Class ${load.hazmatClass}` : ''}`,
      instructions: getInstructions(load.cargoType || null),
      contactName: 'Facility Contact',
      contactPhone: '',
    };
  }, [load]);

  const [dockStatus, setDockStatus] = useState<DockStatus>('assigned');
  const st = STATUS_CFG[dockStatus];
  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  const advanceStatus = () => {
    const order: DockStatus[] = ["assigned", "waiting", "loading", "complete"];
    const idx = order.indexOf(dockStatus);
    if (idx < order.length - 1) {
      setDockStatus(order[idx + 1]);
      toast.success(`Status: ${STATUS_CFG[order[idx + 1]].label}`);
    }
  };

  if (currentLoadQuery.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-400">Loading dock assignment...</span>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="p-8 text-center">
        <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No active load — dock assignment not available</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Dock Assignment
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            {dock.facility}
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-bold border", st.bg, st.color, "border-current/30")}>
          {st.label}
        </Badge>
      </div>

      {/* Dock number hero */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardContent className="py-10 text-center">
          <div className={cn("w-28 h-28 rounded-3xl mx-auto mb-4 flex items-center justify-center", st.bg)}>
            <span className={cn("text-4xl font-black", st.color)}>{dock.dockNumber}</span>
          </div>
          <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{dock.bay}</p>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{dock.product}</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs border">{dock.loadNumber}</Badge>
            {dock.status === "assigned" && (
              <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-xs border">
                <Clock className="w-3 h-3 mr-1" /> ~{dock.estimatedWait} min wait
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Navigation className="w-4 h-4 text-[#1473FF]" /> Dock Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dock.instructions.map((inst, i) => (
            <div key={i} className={cn(
              "flex items-start gap-3 p-3 rounded-xl border",
              isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
            )}>
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold", "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white")}>
                {i + 1}
              </div>
              <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-700" : "text-slate-200")}>{inst}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className={cc}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/15">
                <Phone className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{dock.contactName}</p>
                <p className="text-xs font-mono text-blue-500">{dock.contactPhone}</p>
              </div>
            </div>
            <a href={`tel:${dock.contactPhone.replace(/[^0-9]/g, "")}`} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-sm font-medium">
              Call
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Status progression */}
      <div className="flex items-center gap-2">
        {(["assigned", "waiting", "loading", "complete"] as DockStatus[]).map((s, i) => {
          const cfg = STATUS_CFG[s];
          const order: DockStatus[] = ["assigned", "waiting", "loading", "complete"];
          const currentIdx = order.indexOf(dockStatus);
          const isActive = i <= currentIdx;
          return (
            <React.Fragment key={s}>
              <div className={cn(
                "flex-1 py-3 rounded-xl text-center text-xs font-medium transition-all",
                isActive ? `${cfg.bg} ${cfg.color}` : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
              )}>
                {cfg.label}
              </div>
              {i < 3 && <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Action button */}
      {dockStatus !== "complete" ? (
        <Button
          className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl text-base font-medium shadow-lg shadow-purple-500/20"
          onClick={advanceStatus}
        >
          {dockStatus === "assigned" && "Confirm Arrival at Dock"}
          {dockStatus === "waiting" && "Loading Started"}
          {dockStatus === "loading" && "Loading Complete"}
        </Button>
      ) : (
        <div className={cn("flex items-center gap-3 p-4 rounded-xl", isLight ? "bg-green-50 border border-green-200" : "bg-green-500/10 border border-green-500/20")}>
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className={cn("text-sm font-medium", isLight ? "text-green-700" : "text-green-400")}>Dock operation complete — you may depart</p>
        </div>
      )}
    </div>
  );
}
