/**
 * PLACARD VERIFICATION PAGE
 * Driver-facing hazmat placard verification screen.
 * Displays required DOT placards for current load based on 49 CFR 172.504,
 * placard placement diagram, and a verification checklist drivers complete
 * before departing with hazardous materials.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Shield, CheckCircle, AlertTriangle, Square, Truck,
  RefreshCw, ChevronRight, Eye, FileText, Camera,
  ArrowRight, Info, XCircle, CheckSquare
} from "lucide-react";

type VerificationStep = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
};

const PLACARD_POSITIONS = [
  { id: "front", label: "Front", x: "50%", y: "8%" },
  { id: "rear", label: "Rear", x: "50%", y: "92%" },
  { id: "left", label: "Driver Side", x: "8%", y: "50%" },
  { id: "right", label: "Passenger Side", x: "92%", y: "50%" },
];

export default function PlacardVerification() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [checklist, setChecklist] = useState<VerificationStep[]>([
    { id: "front", label: "Front placard installed", description: "Visible on the front of the vehicle/trailer", checked: false },
    { id: "rear", label: "Rear placard installed", description: "Visible on the back of the vehicle/trailer", checked: false },
    { id: "left", label: "Driver-side placard installed", description: "Visible on the left side of the vehicle/trailer", checked: false },
    { id: "right", label: "Passenger-side placard installed", description: "Visible on the right side of the vehicle/trailer", checked: false },
    { id: "condition", label: "Placards in good condition", description: "No fading, damage, or obscured text/symbols", checked: false },
    { id: "un_number", label: "UN number displayed (if required)", description: "4-digit ID visible on placard or orange panel", checked: false },
    { id: "subsidiary", label: "Subsidiary placards placed", description: "All secondary hazard placards installed if applicable", checked: false },
  ]);

  const hazardClassesQuery = (trpc as any).hazmat?.getHazardClasses?.useQuery?.() || { data: [], isLoading: false };
  const shipmentsQuery = (trpc as any).hazmat?.getShipments?.useQuery?.({ limit: 1 }) || { data: [], isLoading: false };

  const currentShipment = Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length > 0 ? shipmentsQuery.data[0] : null;
  const hazardClasses = Array.isArray(hazardClassesQuery.data) ? hazardClassesQuery.data : [];

  const currentClass = currentShipment?.hazmatClass
    ? hazardClasses.find((c: any) => c.code === currentShipment.hazmatClass) || null
    : null;

  const allChecked = checklist.every((s) => s.checked);
  const checkedCount = checklist.filter((s) => s.checked).length;
  const isLoading = hazardClassesQuery.isLoading || shipmentsQuery.isLoading;

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const handleVerify = () => {
    if (!allChecked) {
      toast.error("Complete all verification steps before confirming");
      return;
    }
    toast.success("Placard verification confirmed. Safe travels.");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Placard Verification
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Verify DOT hazmat placards before departure (49 CFR 172.504)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border",
            allChecked
              ? "bg-green-500/15 text-green-500 border-green-500/30"
              : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30"
          )}>
            {allChecked ? "Verified" : `${checkedCount}/${checklist.length} Complete`}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Current Load Placard Info */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardContent className="p-6">
              {currentShipment ? (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Placard Visual */}
                  <div className={cn(
                    "flex-shrink-0 w-full md:w-48 aspect-square rounded-2xl flex flex-col items-center justify-center relative",
                    isLight ? "bg-gradient-to-br from-red-50 to-orange-50" : "bg-gradient-to-br from-red-500/10 to-orange-500/10"
                  )}>
                    {/* Diamond shape */}
                    <div className={cn(
                      "w-28 h-28 rotate-45 rounded-lg border-4 flex items-center justify-center",
                      currentClass?.color === "#FF0000" ? "border-red-500 bg-red-500/10" :
                      currentClass?.color === "#FF6600" ? "border-orange-500 bg-orange-500/10" :
                      currentClass?.color === "#FFFF00" ? "border-yellow-500 bg-yellow-500/10" :
                      currentClass?.color === "#0000FF" ? "border-blue-500 bg-blue-500/10" :
                      currentClass?.color === "#00AA00" ? "border-green-500 bg-green-500/10" :
                      "border-slate-500 bg-slate-500/10"
                    )}>
                      <div className="-rotate-45 text-center">
                        <p className={cn("text-xs font-bold leading-tight", isLight ? "text-slate-800" : "text-white")}>
                          {currentClass?.placard || "HAZMAT"}
                        </p>
                        <p className={cn("text-lg font-black mt-0.5", isLight ? "text-slate-900" : "text-white")}>
                          {currentShipment.hazmatClass}
                        </p>
                      </div>
                    </div>
                    {currentShipment.unNumber && (
                      <div className={cn(
                        "mt-3 px-3 py-1 rounded-lg text-xs font-mono font-bold",
                        isLight ? "bg-orange-100 text-orange-700" : "bg-orange-500/20 text-orange-400"
                      )}>
                        UN {currentShipment.unNumber}
                      </div>
                    )}
                  </div>

                  {/* Load Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>
                        {currentShipment.commodityName || currentShipment.cargoType || "Hazardous Material"}
                      </p>
                      <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                        Load #{currentShipment.loadNumber} &middot; Class {currentShipment.hazmatClass}
                        {currentClass?.name ? ` — ${currentClass.name}` : ""}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                        <p className={cn("text-[10px] uppercase tracking-wider mb-1", isLight ? "text-slate-400" : "text-slate-500")}>Placard Required</p>
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                          {currentClass?.placard || "Unknown"}
                        </p>
                      </div>
                      <div className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                        <p className={cn("text-[10px] uppercase tracking-wider mb-1", isLight ? "text-slate-400" : "text-slate-500")}>Quantity</p>
                        <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                          {currentShipment.weight ? `${Number(currentShipment.weight).toLocaleString()} lbs` : "See BOL"}
                        </p>
                      </div>
                    </div>

                    {/* Regulation note */}
                    <div className={cn(
                      "flex items-start gap-3 p-3 rounded-xl text-xs",
                      isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                    )}>
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Per 49 CFR 172.504, placards must be displayed on all four sides of the transport vehicle
                        when carrying hazardous materials above threshold quantities.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
                    <Shield className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No active hazmat shipment</p>
                  <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                    Placard verification is required before departing with hazardous materials
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Placard Placement Diagram */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Truck className="w-5 h-5 text-[#1473FF]" />
                Placement Diagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl border-2 border-dashed",
                isLight ? "border-slate-300 bg-slate-50" : "border-slate-600 bg-slate-800/30"
              )}>
                {/* Vehicle outline */}
                <div className={cn(
                  "absolute inset-[15%] rounded-xl border-2",
                  isLight ? "border-slate-300 bg-white" : "border-slate-600 bg-slate-700/30"
                )}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Truck className={cn("w-12 h-12", isLight ? "text-slate-300" : "text-slate-600")} />
                  </div>
                </div>

                {/* Placard positions */}
                {PLACARD_POSITIONS.map((pos) => {
                  const step = checklist.find((s) => s.id === pos.id);
                  const isChecked = step?.checked || false;
                  return (
                    <button
                      key={pos.id}
                      onClick={() => toggleCheck(pos.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 transition-all"
                      style={{ left: pos.x, top: pos.y }}
                    >
                      <div className={cn(
                        "w-12 h-12 rotate-45 rounded-md border-2 flex items-center justify-center transition-all",
                        isChecked
                          ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20"
                          : isLight
                            ? "border-slate-300 bg-white hover:border-blue-400"
                            : "border-slate-500 bg-white/[0.04] hover:border-blue-400"
                      )}>
                        <div className="-rotate-45">
                          {isChecked
                            ? <CheckCircle className="w-5 h-5 text-green-500" />
                            : <Square className="w-5 h-5 text-slate-400" />
                          }
                        </div>
                      </div>
                      <p className={cn(
                        "text-[10px] font-medium mt-1 text-center whitespace-nowrap",
                        isChecked ? "text-green-500" : isLight ? "text-slate-500" : "text-slate-400"
                      )}>
                        {pos.label}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className={cn("text-xs text-center mt-3", isLight ? "text-slate-400" : "text-slate-500")}>
                Tap each position to confirm placard is installed
              </p>
            </CardContent>
          </Card>

          {/* Verification Checklist */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <CheckSquare className="w-5 h-5 text-[#BE01FF]" />
                Verification Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((step) => (
                <button
                  key={step.id}
                  onClick={() => toggleCheck(step.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    step.checked
                      ? isLight
                        ? "bg-green-50 border-green-200"
                        : "bg-green-500/5 border-green-500/20"
                      : isLight
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors",
                    step.checked
                      ? "bg-green-500 border-green-500"
                      : isLight
                        ? "border-slate-300"
                        : "border-slate-600"
                  )}>
                    {step.checked && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      step.checked
                        ? "text-green-600 line-through opacity-70"
                        : isLight ? "text-slate-800" : "text-white"
                    )}>
                      {step.label}
                    </p>
                    <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>
                      {step.description}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Confirm button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className={cn(
                "flex-1 h-12 rounded-xl text-base font-medium transition-all",
                allChecked
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white shadow-lg shadow-purple-500/20"
                  : isLight
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white/[0.04] text-slate-500 cursor-not-allowed"
              )}
              disabled={!allChecked}
              onClick={handleVerify}
            >
              <Shield className="w-5 h-5 mr-2" />
              Confirm Placard Verification
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-12 rounded-xl",
                isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]"
              )}
            >
              <Camera className="w-5 h-5 mr-2" />
              Photo Documentation
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
