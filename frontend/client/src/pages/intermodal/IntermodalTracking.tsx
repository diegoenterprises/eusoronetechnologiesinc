/**
 * INTERMODAL TRACKING — V5 Multi-Modal
 * Cross-modal container tracking: single view showing container journey
 * across truck → rail → vessel, timeline with mode icons, current position, ETA
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Layers,
  Search,
  Truck,
  TrainFront,
  Ship,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MODE_ICON: Record<string, React.ReactNode> = {
  TRUCK: <Truck className="w-4 h-4 text-orange-400" />,
  RAIL: <TrainFront className="w-4 h-4 text-blue-400" />,
  VESSEL: <Ship className="w-4 h-4 text-cyan-400" />,
};

const MODE_BG: Record<string, string> = {
  TRUCK: "bg-orange-500/20 border-orange-500/30",
  RAIL: "bg-blue-500/20 border-blue-500/30",
  VESSEL: "bg-cyan-500/20 border-cyan-500/30",
};

const MODE_BADGE: Record<string, string> = {
  TRUCK: "bg-orange-500/20 text-orange-400",
  RAIL: "bg-blue-500/20 text-blue-400",
  VESSEL: "bg-cyan-500/20 text-cyan-400",
};

// Mock intermodal shipments for display
const MOCK_SHIPMENTS = [
  {
    id: 1,
    shipmentNumber: "IM-2026-0001",
    containerNumber: "MSCU1234567",
    commodity: "Electronics",
    status: "in_transit",
    currentMode: "RAIL",
    currentLocation: "Kansas City, MO (BNSF Yard)",
    eta: "2026-03-20",
    segments: [
      { mode: "TRUCK", origin: "Shipper Warehouse, Chicago", destination: "Chicago Intermodal Terminal", status: "completed", arrivalTime: "2026-03-10T11:30:00" },
      { mode: "RAIL", origin: "Chicago Intermodal Terminal", destination: "Los Angeles ICTF", status: "in_progress", arrivalTime: "" },
      { mode: "TRUCK", origin: "Los Angeles ICTF", destination: "Port of LA Terminal", status: "pending", arrivalTime: "" },
      { mode: "VESSEL", origin: "Port of Los Angeles", destination: "Shanghai, China", status: "pending", arrivalTime: "" },
    ],
  },
  {
    id: 2,
    shipmentNumber: "IM-2026-0002",
    containerNumber: "TCLU9876543",
    commodity: "Auto Parts",
    status: "in_transit",
    currentMode: "VESSEL",
    currentLocation: "Pacific Ocean — MSC FLORA",
    eta: "2026-03-25",
    segments: [
      { mode: "TRUCK", origin: "Factory, Shenzhen", destination: "Yantian Port", status: "completed", arrivalTime: "2026-03-05T09:00:00" },
      { mode: "VESSEL", origin: "Yantian, China", destination: "Long Beach, CA", status: "in_progress", arrivalTime: "" },
      { mode: "RAIL", origin: "Long Beach Intermodal", destination: "Dallas, TX", status: "pending", arrivalTime: "" },
      { mode: "TRUCK", origin: "Dallas Rail Yard", destination: "Customer DC, Dallas", status: "pending", arrivalTime: "" },
    ],
  },
  {
    id: 3,
    shipmentNumber: "IM-2026-0003",
    containerNumber: "HLBU4455667",
    commodity: "Textiles",
    status: "completed",
    currentMode: "TRUCK",
    currentLocation: "Delivered — Memphis, TN",
    eta: "2026-03-14",
    segments: [
      { mode: "VESSEL", origin: "Rotterdam, NL", destination: "Savannah, GA", status: "completed", arrivalTime: "2026-03-08T14:00:00" },
      { mode: "RAIL", origin: "Savannah Intermodal", destination: "Memphis Rail Yard", status: "completed", arrivalTime: "2026-03-12T22:00:00" },
      { mode: "TRUCK", origin: "Memphis Rail Yard", destination: "Customer DC, Memphis", status: "completed", arrivalTime: "2026-03-14T10:00:00" },
    ],
  },
];

export default function IntermodalTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof MOCK_SHIPMENTS)[0] | null>(
    MOCK_SHIPMENTS[0]
  );

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const filtered = MOCK_SHIPMENTS.filter(
    (s) =>
      !search ||
      s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.containerNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Activity className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Intermodal Tracking
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Cross-modal container journey tracking
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by shipment # or container #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment List */}
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card
              key={s.id}
              className={cn(
                cardBg,
                "cursor-pointer transition-colors",
                selected?.id === s.id &&
                  (isLight
                    ? "ring-2 ring-violet-400"
                    : "ring-2 ring-violet-500/50")
              )}
              onClick={() => setSelected(s)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "font-semibold text-sm",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    {s.shipmentNumber}
                  </span>
                  <Badge
                    className={
                      s.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-violet-500/20 text-violet-400"
                    }
                  >
                    {s.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "text-xs font-mono mb-1",
                    isLight ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  {s.containerNumber}
                </div>
                <div className="flex items-center gap-1.5">
                  {s.segments.map((seg, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      )}
                      <div
                        className={cn(
                          "p-1 rounded",
                          seg.status === "completed"
                            ? "opacity-50"
                            : seg.status === "in_progress"
                              ? "ring-1 ring-violet-400"
                              : ""
                        )}
                      >
                        {MODE_ICON[seg.mode]}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-slate-500 text-sm">
              No shipments found
            </p>
          )}
        </div>

        {/* Journey Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card className={cardBg}>
              <CardHeader>
                <CardTitle
                  className={cn(
                    "text-sm flex items-center gap-2",
                    isLight ? "text-slate-900" : "text-white"
                  )}
                >
                  <Layers className="w-4 h-4 text-violet-400" />
                  {selected.shipmentNumber} — Journey Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Current Status */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg mb-6",
                    isLight ? "bg-violet-50" : "bg-violet-500/10"
                  )}
                >
                  {MODE_ICON[selected.currentMode]}
                  <div>
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isLight ? "text-slate-900" : "text-white"
                      )}
                    >
                      Current: {selected.currentLocation}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        isLight ? "text-slate-500" : "text-slate-400"
                      )}
                    >
                      Container: {selected.containerNumber} — Commodity:{" "}
                      {selected.commodity} — ETA: {selected.eta}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute left-[19px] top-0 bottom-0 w-0.5",
                      isLight ? "bg-slate-200" : "bg-slate-700"
                    )}
                  />
                  <div className="space-y-6">
                    {selected.segments.map((seg, i) => (
                      <div
                        key={i}
                        className="relative flex items-start gap-4"
                      >
                        <div
                          className={cn(
                            "relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            seg.status === "in_progress"
                              ? "border-violet-400 bg-violet-500/20 animate-pulse"
                              : seg.status === "completed"
                                ? MODE_BG[seg.mode]
                                : "border-slate-600 bg-slate-700/30"
                          )}
                        >
                          {MODE_ICON[seg.mode]}
                        </div>
                        <div
                          className={cn(
                            "flex-1 p-4 rounded-lg",
                            isLight
                              ? "bg-slate-50"
                              : "bg-slate-700/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium text-sm",
                                  isLight
                                    ? "text-slate-900"
                                    : "text-white"
                                )}
                              >
                                Leg {i + 1}: {seg.mode}
                              </span>
                              <Badge
                                className={cn(
                                  MODE_BADGE[seg.mode],
                                  "text-[10px] px-1.5 py-0"
                                )}
                              >
                                {seg.mode}
                              </Badge>
                            </div>
                            <Badge
                              className={
                                seg.status === "completed"
                                  ? "bg-emerald-500/20 text-emerald-400 text-[10px]"
                                  : seg.status === "in_progress"
                                    ? "bg-violet-500/20 text-violet-400 text-[10px]"
                                    : "bg-slate-500/20 text-slate-400 text-[10px]"
                              }
                            >
                              {seg.status === "in_progress"
                                ? "● Active"
                                : seg.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-2 text-xs",
                              isLight
                                ? "text-slate-500"
                                : "text-slate-400"
                            )}
                          >
                            <MapPin className="w-3 h-3" />
                            {seg.origin}
                            <ArrowRight className="w-3 h-3" />
                            {seg.destination}
                          </div>
                          {seg.arrivalTime && (
                            <div
                              className={cn(
                                "flex items-center gap-1 text-[10px] mt-1",
                                isLight
                                  ? "text-slate-400"
                                  : "text-slate-500"
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(seg.arrivalTime).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={cardBg}>
              <CardContent className="p-12 text-center">
                <Layers
                  className={cn(
                    "w-12 h-12 mx-auto mb-3",
                    isLight ? "text-slate-300" : "text-slate-600"
                  )}
                />
                <p
                  className={cn(
                    "text-sm",
                    isLight ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  Select a shipment to view its journey
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
