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
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const MODE_ICON: Record<string, React.ReactNode> = {
  TRUCK: <Truck className="w-4 h-4 text-orange-400" />,
  RAIL: <TrainFront className="w-4 h-4 text-blue-400" />,
  VESSEL: <Ship className="w-4 h-4 text-cyan-400" />,
};


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
  const transfersQuery = (trpc as any).intermodal.getTransfers.useQuery({ limit: 50 });
  const allTransfers: any[] = transfersQuery.data || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const pending = allTransfers.filter((t: any) => t.status === "pending" || t.status === "scheduled").length;
  const active = allTransfers.filter((t: any) => t.status === "in_progress").length;
  const delayed = allTransfers.filter((t: any) => t.status === "delayed").length;
  const dwellItems = allTransfers.filter((t: any) => parseFloat(t.dwellHours || 0) > 0);
  const avgDwell = dwellItems.length > 0 ? dwellItems.reduce((s: number, t: any) => s + parseFloat(t.dwellHours || 0), 0) / dwellItems.length : 0;

  const filtered = allTransfers.filter((t: any) => {
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
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No intermodal transfers yet</p>
          <p className="text-sm">Data will appear as intermodal operations begin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t: any) => {
            const fromMode = (t.fromMode || "TRUCK").toUpperCase();
            const toMode = (t.toMode || "RAIL").toUpperCase();
            const dwell = parseFloat(t.dwellHours || 0);
            return (
              <Card key={t.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")}>
                          {MODE_ICON[fromMode] || <Truck className="w-4 h-4" />}
                        </div>
                        <ArrowLeftRight className={cn("w-4 h-4", t.status === "delayed" ? "text-red-400" : "text-violet-400")} />
                        <div className={cn("p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")}>
                          {MODE_ICON[toMode] || <TrainFront className="w-4 h-4" />}
                        </div>
                      </div>
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>Transfer #{t.id}</div>
                        <div className={cn("text-xs font-mono", isLight ? "text-slate-500" : "text-slate-400")}>{t.transferLocation || "—"}</div>
                      </div>
                    </div>
                    <Badge className={statusBadge(t.status || "pending")}>{(t.status || "pending").replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className={isLight ? "text-slate-600" : "text-slate-300"}>{t.transferLocation || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={isLight ? "text-slate-600" : "text-slate-300"}>{t.scheduledTime ? new Date(t.scheduledTime).toLocaleString() : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3 text-slate-400" />
                      <span className={cn(dwell > 8 ? "text-red-400" : dwell > 4 ? "text-amber-400" : isLight ? "text-slate-600" : "text-slate-300")}>
                        Dwell: {dwell > 0 ? `${dwell.toFixed(1)}h` : "—"}
                      </span>
                    </div>
                  </div>
                  {(t.status === "pending" || t.status === "scheduled") && (
                    <div className="mt-3">
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs" onClick={() => toast.success(`Transfer #${t.id} started`)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Begin Transfer
                      </Button>
                    </div>
                  )}
                  {t.status === "in_progress" && (
                    <div className="mt-3">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => toast.success(`Transfer #${t.id} completed`)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Complete Transfer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
