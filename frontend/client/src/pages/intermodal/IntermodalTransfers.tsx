/**
 * INTERMODAL TRANSFERS — V5 Multi-Modal
 * Mode transfer management: pending transfers, transfer scheduling,
 * interchange tracking, dwell time monitoring at transfer points
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  Truck,
  TrainFront,
  Ship,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const MODE_ICON: Record<string, React.ReactNode> = {
  TRUCK: <Truck className="w-4 h-4 text-orange-400" />,
  RAIL: <TrainFront className="w-4 h-4 text-blue-400" />,
  VESSEL: <Ship className="w-4 h-4 text-cyan-400" />,
};

// Mock transfers
const MOCK_TRANSFERS = [
  {
    id: 1,
    shipmentNumber: "IM-2026-0001",
    containerNumber: "MSCU1234567",
    fromMode: "TRUCK",
    toMode: "RAIL",
    location: "Chicago Intermodal Terminal",
    scheduledTime: "2026-03-17T14:00:00",
    status: "pending",
    dwellHours: 0,
  },
  {
    id: 2,
    shipmentNumber: "IM-2026-0002",
    containerNumber: "TCLU9876543",
    fromMode: "VESSEL",
    toMode: "RAIL",
    location: "Long Beach Intermodal",
    scheduledTime: "2026-03-22T08:00:00",
    status: "scheduled",
    dwellHours: 0,
  },
  {
    id: 3,
    shipmentNumber: "IM-2026-0004",
    containerNumber: "CMAU5566778",
    fromMode: "RAIL",
    toMode: "TRUCK",
    location: "Dallas Rail Yard",
    scheduledTime: "2026-03-16T06:00:00",
    status: "in_progress",
    dwellHours: 4.5,
  },
  {
    id: 4,
    shipmentNumber: "IM-2026-0003",
    containerNumber: "HLBU4455667",
    fromMode: "RAIL",
    toMode: "TRUCK",
    location: "Memphis Rail Yard",
    scheduledTime: "2026-03-14T08:00:00",
    status: "completed",
    dwellHours: 2.1,
  },
  {
    id: 5,
    shipmentNumber: "IM-2026-0005",
    containerNumber: "OOLU3344556",
    fromMode: "TRUCK",
    toMode: "VESSEL",
    location: "Port of Savannah Gate 4",
    scheduledTime: "2026-03-16T10:00:00",
    status: "delayed",
    dwellHours: 12.3,
  },
];

function statusBadge(status: string) {
  if (status === "completed") return "bg-emerald-500/20 text-emerald-400";
  if (status === "in_progress") return "bg-blue-500/20 text-blue-400";
  if (status === "scheduled") return "bg-indigo-500/20 text-indigo-400";
  if (status === "delayed") return "bg-red-500/20 text-red-400";
  return "bg-amber-500/20 text-amber-400";
}

export default function IntermodalTransfers() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("all");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const pending = MOCK_TRANSFERS.filter((t) => t.status === "pending" || t.status === "scheduled").length;
  const active = MOCK_TRANSFERS.filter((t) => t.status === "in_progress").length;
  const delayed = MOCK_TRANSFERS.filter((t) => t.status === "delayed").length;
  const avgDwell = MOCK_TRANSFERS.filter((t) => t.dwellHours > 0).reduce((s, t) => s + t.dwellHours, 0) / Math.max(MOCK_TRANSFERS.filter((t) => t.dwellHours > 0).length, 1);

  const filtered = MOCK_TRANSFERS.filter((t) => {
    if (tab === "pending") return t.status === "pending" || t.status === "scheduled";
    if (tab === "active") return t.status === "in_progress";
    if (tab === "delayed") return t.status === "delayed";
    if (tab === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <ArrowLeftRight className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            Intermodal Transfers
          </h1>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            Mode transfer scheduling &amp; dwell monitoring
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Clock className="w-5 h-5 text-amber-400" />, label: "Pending", value: pending, color: "bg-amber-500" },
          { icon: <ArrowLeftRight className="w-5 h-5 text-blue-400" />, label: "In Progress", value: active, color: "bg-blue-500" },
          { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, label: "Delayed", value: delayed, color: "bg-red-500" },
          { icon: <Timer className="w-5 h-5 text-violet-400" />, label: "Avg Dwell Time", value: `${avgDwell.toFixed(1)}h`, color: "bg-violet-500" },
        ].map((kpi, i) => (
          <div key={i} className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
            <div className={cn("p-2 rounded-lg w-fit mb-2", `${kpi.color}/10`)}>{kpi.icon}</div>
            <div className={cn("text-2xl font-bold", kpi.label === "Delayed" && delayed > 0 ? "text-red-400" : isLight ? "text-slate-900" : "text-white")}>{kpi.value}</div>
            <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">In Progress</TabsTrigger>
          <TabsTrigger value="delayed">Delayed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transfer Cards */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id} className={cardBg}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Mode Transfer Visual */}
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")}>
                      {MODE_ICON[t.fromMode]}
                    </div>
                    <ArrowLeftRight className={cn("w-4 h-4", t.status === "delayed" ? "text-red-400" : "text-violet-400")} />
                    <div className={cn("p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")}>
                      {MODE_ICON[t.toMode]}
                    </div>
                  </div>
                  <div>
                    <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>
                      {t.shipmentNumber}
                    </div>
                    <div className={cn("text-xs font-mono", isLight ? "text-slate-500" : "text-slate-400")}>
                      {t.containerNumber}
                    </div>
                  </div>
                </div>
                <Badge className={statusBadge(t.status)}>
                  {t.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className={isLight ? "text-slate-600" : "text-slate-300"}>{t.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className={isLight ? "text-slate-600" : "text-slate-300"}>
                    {new Date(t.scheduledTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-slate-400" />
                  <span className={cn(t.dwellHours > 8 ? "text-red-400" : t.dwellHours > 4 ? "text-amber-400" : isLight ? "text-slate-600" : "text-slate-300")}>
                    Dwell: {t.dwellHours > 0 ? `${t.dwellHours.toFixed(1)}h` : "—"}
                  </span>
                </div>
              </div>

              {(t.status === "pending" || t.status === "scheduled") && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-xs"
                    onClick={() => toast.success(`Transfer ${t.shipmentNumber} started`)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Begin Transfer
                  </Button>
                </div>
              )}
              {t.status === "in_progress" && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                    onClick={() => toast.success(`Transfer ${t.shipmentNumber} completed`)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Complete Transfer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-12 text-slate-500 text-sm">No transfers found</p>
        )}
      </div>
    </div>
  );
}
