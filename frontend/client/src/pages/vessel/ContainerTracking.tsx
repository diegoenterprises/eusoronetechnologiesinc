/**
 * CONTAINER TRACKING — V5 Multi-Modal
 * Real-time container tracking: search by container number,
 * movement history timeline, current location, cross-modal tracking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Container,
  Search,
  MapPin,
  Ship,
  TrainFront,
  Truck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// Mock movement data — will be replaced by real tRPC calls
const MOCK_MOVEMENTS = [
  {
    id: 1,
    mode: "truck",
    location: "Shipper Warehouse, Chicago IL",
    event: "Picked up",
    timestamp: "2026-03-10T08:00:00",
    status: "completed",
  },
  {
    id: 2,
    mode: "truck",
    location: "Chicago Intermodal Terminal",
    event: "Gate In",
    timestamp: "2026-03-10T11:30:00",
    status: "completed",
  },
  {
    id: 3,
    mode: "rail",
    location: "BNSF Logistics Park, Chicago",
    event: "Loaded on train",
    timestamp: "2026-03-11T06:00:00",
    status: "completed",
  },
  {
    id: 4,
    mode: "rail",
    location: "Kansas City, MO (interchange)",
    event: "Interchange scan",
    timestamp: "2026-03-12T14:00:00",
    status: "completed",
  },
  {
    id: 5,
    mode: "rail",
    location: "Los Angeles, CA — ICTF Terminal",
    event: "Arrived at port rail terminal",
    timestamp: "2026-03-14T09:00:00",
    status: "completed",
  },
  {
    id: 6,
    mode: "vessel",
    location: "Port of Los Angeles — Berth 206",
    event: "Loaded on vessel MSC FLORA",
    timestamp: "2026-03-15T16:00:00",
    status: "in_progress",
  },
  {
    id: 7,
    mode: "vessel",
    location: "Pacific Ocean",
    event: "In transit to Shanghai",
    timestamp: "",
    status: "pending",
  },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  truck: <Truck className="w-4 h-4 text-orange-400" />,
  rail: <TrainFront className="w-4 h-4 text-blue-400" />,
  vessel: <Ship className="w-4 h-4 text-cyan-400" />,
};

const MODE_COLORS: Record<string, string> = {
  truck: "bg-orange-500/20 border-orange-500/30",
  rail: "bg-blue-500/20 border-blue-500/30",
  vessel: "bg-cyan-500/20 border-cyan-500/30",
};

export default function ContainerTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const tracking = trpc.vesselShipments.getContainerTracking.useQuery(
    { containerNumber: search },
    { enabled: searched && search.length > 3 }
  );

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const handleSearch = () => {
    if (search.length > 3) setSearched(true);
  };

  // Show mock data when no search or as fallback
  const movements = MOCK_MOVEMENTS;

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Container className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Container Tracking
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

      {/* Search Bar */}
      <div className="flex gap-3 mb-6 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Enter container number (e.g. MSCU1234567)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          className="bg-cyan-600 hover:bg-cyan-700"
          onClick={handleSearch}
        >
          Track
        </Button>
      </div>

      {/* Movement Timeline */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle
            className={cn(
              "text-sm flex items-center gap-2",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            <Clock className="w-4 h-4" /> Movement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical line */}
            <div
              className={cn(
                "absolute left-[19px] top-0 bottom-0 w-0.5",
                isLight ? "bg-slate-200" : "bg-slate-700"
              )}
            />

            <div className="space-y-4">
              {movements.map((m, i) => (
                <div key={m.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      m.status === "in_progress"
                        ? "border-cyan-400 bg-cyan-500/20 animate-pulse"
                        : m.status === "completed"
                          ? MODE_COLORS[m.mode]
                          : "border-slate-600 bg-slate-700/30"
                    )}
                  >
                    {MODE_ICONS[m.mode] || (
                      <MapPin className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 p-3 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-700/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {m.event}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            m.mode === "truck"
                              ? "bg-orange-500/20 text-orange-400"
                              : m.mode === "rail"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-cyan-500/20 text-cyan-400"
                          )}
                        >
                          {m.mode}
                        </Badge>
                      </div>
                      <Badge
                        className={
                          m.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400 text-[10px]"
                            : m.status === "in_progress"
                              ? "bg-cyan-500/20 text-cyan-400 text-[10px]"
                              : "bg-slate-500/20 text-slate-400 text-[10px]"
                        }
                      >
                        {m.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        isLight ? "text-slate-500" : "text-slate-400"
                      )}
                    >
                      <MapPin className="w-3 h-3" />
                      {m.location}
                    </div>
                    {m.timestamp && (
                      <div
                        className={cn(
                          "text-[10px] mt-1",
                          isLight ? "text-slate-400" : "text-slate-500"
                        )}
                      >
                        {new Date(m.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
