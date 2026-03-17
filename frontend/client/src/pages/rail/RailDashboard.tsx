/**
 * RAIL DASHBOARD
 * V5 Multi-Modal — Rail operations overview with KPIs, recent shipments, and analytics
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrainFront, Package, MapPin, DollarSign, TrendingUp,
  ArrowUpRight, Clock, CheckCircle, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

function KpiCard({ icon, label, value, isLight }: {
  icon: React.ReactNode; label: string; value: string | number; isLight: boolean;
}) {
  return (
    <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", isLight ? "bg-blue-50" : "bg-blue-500/10")}>{icon}</div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-500/20 text-yellow-400",
  car_ordered: "bg-blue-500/20 text-blue-400",
  in_transit: "bg-emerald-500/20 text-emerald-400",
  departed: "bg-cyan-500/20 text-cyan-400",
  settled: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function RailDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const stats = trpc.railShipments.getRailDashboardStats.useQuery();
  const shipments = trpc.railShipments.getRailShipments.useQuery({ limit: 10 });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10"><TrainFront className="w-6 h-6 text-blue-400" /></div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Rail Dashboard</h1>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Rail freight operations overview</p>
        </div>
      </div>

      {stats.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={<Package className="w-5 h-5 text-blue-400" />} label="Active Shipments" value={stats.data?.activeShipments || 0} isLight={isLight} />
          <KpiCard icon={<TrainFront className="w-5 h-5 text-cyan-400" />} label="Cars In Transit" value={stats.data?.carsInTransit || 0} isLight={isLight} />
          <KpiCard icon={<Clock className="w-5 h-5 text-amber-400" />} label="Avg Transit Days" value={stats.data?.avgTransitDays || 0} isLight={isLight} />
          <KpiCard icon={<DollarSign className="w-5 h-5 text-emerald-400" />} label="Revenue" value={`$${(stats.data?.revenue || 0).toLocaleString()}`} isLight={isLight} />
        </div>
      )}

      <Card className={cn("border", cardBg)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={cn("text-lg", isLight ? "text-slate-900" : "text-white")}>Recent Shipments</CardTitle>
          <Link href="/rail/shipments">
            <Badge variant="outline" className="cursor-pointer hover:bg-blue-500/10">View All <ArrowUpRight className="w-3 h-3 ml-1" /></Badge>
          </Link>
        </CardHeader>
        <CardContent>
          {shipments.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="space-y-2">
              {(shipments.data?.shipments || []).map((s: any) => (
                <Link key={s.id} href={`/rail/shipments/${s.id}`}>
                  <div className={cn("flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      <TrainFront className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{s.shipmentNumber}</div>
                        <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{s.commodity || "General Freight"}</div>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400"}>{s.status?.replace(/_/g, " ")}</Badge>
                  </div>
                </Link>
              ))}
              {(shipments.data?.shipments || []).length === 0 && (
                <p className={cn("text-sm text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No rail shipments yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
