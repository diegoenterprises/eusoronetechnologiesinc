/**
 * SHIPPING PAPERS PAGE
 * Driver-facing hazmat shipping papers screen (49 CFR 172.200–204).
 * Displays the digital shipping document for the current hazmat load,
 * including proper shipping name, hazard class, UN number, packing group,
 * emergency contact, and 24-hr response number.
 * Papers must be within driver's reach or on driver's seat when away.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  FileText, AlertTriangle, Phone, Download, Printer,
  Shield, CheckCircle, Clock, MapPin, Truck,
  Package, RefreshCw, Info, Eye, ChevronRight
} from "lucide-react";

type PaperSection = "shipping" | "emergency" | "handling";

export default function ShippingPapers() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeSection, setActiveSection] = useState<PaperSection>("shipping");

  const shipmentsQuery = (trpc as any).hazmat?.getShipments?.useQuery?.({ limit: 5 }) || { data: [], isLoading: false, refetch: () => {} };
  const hazardClassesQuery = (trpc as any).hazmat?.getHazardClasses?.useQuery?.() || { data: [], isLoading: false };

  const shipments: any[] = Array.isArray(shipmentsQuery.data) ? shipmentsQuery.data : [];
  const hazardClasses: any[] = Array.isArray(hazardClassesQuery.data) ? hazardClassesQuery.data : [];
  const currentLoad = shipments.length > 0 ? shipments[0] : null;

  const currentClass = currentLoad?.hazmatClass
    ? hazardClasses.find((c: any) => c.code === currentLoad.hazmatClass)
    : null;

  const isLoading = shipmentsQuery.isLoading;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const sc = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30");
  const lbl = cn("text-[10px] uppercase tracking-wider font-medium", isLight ? "text-slate-400" : "text-slate-500");
  const val = cn("text-sm font-semibold mt-0.5", isLight ? "text-slate-800" : "text-white");

  const sections: { id: PaperSection; label: string }[] = [
    { id: "shipping", label: "Shipping Description" },
    { id: "emergency", label: "Emergency Info" },
    { id: "handling", label: "Handling Notes" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Shipping Papers
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hazmat shipping documents — 49 CFR 172.200
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")}
            onClick={() => shipmentsQuery.refetch?.()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")}
            onClick={() => toast.info("Preparing print-ready shipping papers...")}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl"
            onClick={() => toast.info("Downloading shipping papers PDF...")}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Accessibility reminder */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
      )}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Driver Accessibility Requirement</p>
          <p className="text-xs mt-0.5 opacity-80">
            Shipping papers must be within the driver's immediate reach while at the vehicle's controls,
            or on the driver's seat when away from the vehicle (49 CFR 177.817).
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : !currentLoad ? (
        /* Empty state */
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className={cn("font-medium text-lg", isLight ? "text-slate-600" : "text-slate-300")}>No Active Hazmat Shipment</p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
              Shipping papers will appear here when you have an active hazmat load
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Document Header Card */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className={cn("text-xs font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>
                    Hazardous Materials Shipping Paper
                  </p>
                  <p className={cn("text-xl font-bold mt-1", isLight ? "text-slate-800" : "text-white")}>
                    Load #{currentLoad.loadNumber}
                  </p>
                </div>
                <Badge className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border",
                  currentLoad.status === "in_transit"
                    ? "bg-green-500/15 text-green-500 border-green-500/30"
                    : "bg-blue-500/15 text-blue-500 border-blue-500/30"
                )}>
                  {currentLoad.status?.replace(/_/g, " ").toUpperCase() || "ACTIVE"}
                </Badge>
              </div>

              {/* Section tabs */}
              <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      activeSection === s.id
                        ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                        : isLight
                          ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          : "bg-slate-800 text-slate-400 hover:bg-white/[0.06]"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Shipping Description Section */}
              {activeSection === "shipping" && (
                <div className="space-y-4">
                  {/* Primary shipping description line per 49 CFR 172.202 */}
                  <div className={cn(
                    "p-4 rounded-xl border-2 border-dashed",
                    isLight ? "bg-red-50/50 border-red-200" : "bg-red-500/5 border-red-500/20"
                  )}>
                    <p className={cn("text-[10px] uppercase tracking-wider font-medium mb-2", isLight ? "text-red-400" : "text-red-400")}>
                      Proper Shipping Description (49 CFR 172.202)
                    </p>
                    <p className={cn("text-base font-bold font-mono leading-relaxed", isLight ? "text-slate-900" : "text-white")}>
                      {currentLoad.commodityName || "Petroleum crude oil"},{" "}
                      {currentLoad.hazmatClass || "3"},{" "}
                      UN{currentLoad.unNumber || "1267"},{" "}
                      PG {currentClass?.packingGroups?.[0] || "II"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className={sc}>
                      <p className={lbl}>Proper Shipping Name</p>
                      <p className={val}>{currentLoad.commodityName || "Petroleum crude oil"}</p>
                    </div>
                    <div className={sc}>
                      <p className={lbl}>Hazard Class</p>
                      <p className={val}>
                        Class {currentLoad.hazmatClass || "3"}
                        {currentClass?.name ? ` — ${currentClass.name}` : ""}
                      </p>
                    </div>
                    <div className={sc}>
                      <p className={lbl}>UN/NA Number</p>
                      <p className={val}>UN{currentLoad.unNumber || "1267"}</p>
                    </div>
                    <div className={sc}>
                      <p className={lbl}>Packing Group</p>
                      <p className={val}>{currentClass?.packingGroups?.[0] || "II"}</p>
                    </div>
                    <div className={sc}>
                      <p className={lbl}>Quantity</p>
                      <p className={val}>
                        {currentLoad.weight ? `${Number(currentLoad.weight).toLocaleString()} lbs` : "See BOL"}
                      </p>
                    </div>
                    <div className={sc}>
                      <p className={lbl}>Placard Required</p>
                      <p className={val}>{currentClass?.placard || "FLAMMABLE"}</p>
                    </div>
                  </div>

                  {/* Origin / Destination */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={cn("flex items-start gap-3 p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                      <div className={cn("p-2 rounded-lg", "bg-blue-500/15")}>
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className={lbl}>Origin</p>
                        <p className={cn("text-sm font-medium mt-0.5", isLight ? "text-slate-800" : "text-white")}>
                          {currentLoad.pickupLocation || "Loading facility"}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {currentLoad.pickupDate ? new Date(currentLoad.pickupDate).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex items-start gap-3 p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                      <div className={cn("p-2 rounded-lg", "bg-green-500/15")}>
                        <MapPin className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className={lbl}>Destination</p>
                        <p className={cn("text-sm font-medium mt-0.5", isLight ? "text-slate-800" : "text-white")}>
                          {currentLoad.deliveryLocation || "Delivery facility"}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {currentLoad.deliveryDate ? new Date(currentLoad.deliveryDate).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Info Section */}
              {activeSection === "emergency" && (
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-xl border-2",
                    isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <Phone className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-medium uppercase tracking-wider", isLight ? "text-red-500" : "text-red-400")}>
                          24-Hour Emergency Response
                        </p>
                        <p className={cn("text-xl font-bold", isLight ? "text-red-700" : "text-red-300")}>
                          CHEMTREC: 1-800-424-9300
                        </p>
                      </div>
                    </div>
                    <p className={cn("text-xs", isLight ? "text-red-600" : "text-red-400/80")}>
                      Required per 49 CFR 172.604 — Must be on shipping paper. Available 24/7 for emergency response guidance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={cn("p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>National Response Center</p>
                      </div>
                      <p className={cn("text-lg font-bold", isLight ? "text-blue-600" : "text-blue-400")}>1-800-424-8802</p>
                      <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                        Mandatory for reportable spills (49 CFR 171.15)
                      </p>
                    </div>
                    <div className={cn("p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>Emergency Services</p>
                      </div>
                      <p className={cn("text-lg font-bold", isLight ? "text-orange-600" : "text-orange-400")}>911</p>
                      <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                        Fire, medical, or law enforcement
                      </p>
                    </div>
                  </div>

                  {/* ERG reference */}
                  <div className={cn("flex items-start gap-3 p-4 rounded-xl", sc)}>
                    <div className="p-2 rounded-lg bg-purple-500/15">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>
                        Emergency Response Guidebook
                      </p>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>
                        Refer to ERG Guide #{currentLoad.unNumber ? "128" : "111"} for Class {currentLoad.hazmatClass || "3"} materials.
                        Initial isolation: 100ft in all directions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Handling Notes Section */}
              {activeSection === "handling" && (
                <div className="space-y-4">
                  {[
                    { icon: <Package className="w-4 h-4" />, title: "Loading/Unloading", note: "Ensure all valves are closed and caps secured. Ground equipment before transfer. No smoking within 25 feet." },
                    { icon: <Truck className="w-4 h-4" />, title: "Transport", note: "Maintain safe following distance. Avoid tunnels where restricted. Park in designated hazmat areas only." },
                    { icon: <AlertTriangle className="w-4 h-4" />, title: "Spill Response", note: "Isolate area immediately. Do not attempt to clean major spills. Contact CHEMTREC and 911. Stay upwind and uphill." },
                    { icon: <Shield className="w-4 h-4" />, title: "PPE Required", note: "Chemical-resistant gloves, safety glasses, steel-toe boots. Full-face respirator if vapor exposure risk." },
                  ].map((item, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border",
                      isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                    )}>
                      <div className={cn("p-2.5 rounded-lg flex-shrink-0", "bg-[#1473FF]/10 text-[#1473FF]")}>
                        {item.icon}
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.title}</p>
                        <p className={cn("text-xs mt-1 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other active hazmat loads */}
          {shipments.length > 1 && (
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Truck className="w-5 h-5 text-[#1473FF]" />
                  Other Active Hazmat Loads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shipments.slice(1).map((s: any) => (
                  <div key={s.id} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer",
                    isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", "bg-red-500/15 text-red-400")}>
                        {s.hazmatClass || "?"}
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>
                          #{s.loadNumber}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {s.commodityName || s.cargoType}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
