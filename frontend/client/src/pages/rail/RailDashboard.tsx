/**
 * RAIL DASHBOARD — V6 Command Center
 * V5 Multi-Modal — Rail operations overview with 6 KPIs, recent shipments,
 * quick actions, alert feed, and analytics
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrainFront, Package, MapPin, DollarSign, TrendingUp,
  ArrowUpRight, Clock, CheckCircle, AlertTriangle, Plus,
  Eye, Users, Gauge, Bell, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

function KpiCard({ icon, label, value, subtitle, isLight, accent = "blue" }: {
  icon: React.ReactNode; label: string; value: string | number; subtitle?: string; isLight: boolean; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/30"
    )}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[accent])}>{icon}</div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {subtitle && <div className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{subtitle}</div>}
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
  arrived: "bg-teal-500/20 text-teal-400",
  delivered: "bg-green-600/20 text-green-300",
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-blue-100 to-cyan-100" : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20")}>
            <TrainFront className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Rail Command Center</h1>
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
              Rail freight operations overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/rail/shipments/create">
          <Button size="sm" className={cn("gap-1.5", isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600/90 hover:bg-blue-600 text-white")}>
            <Plus className="w-3.5 h-3.5" /> Create Shipment
          </Button>
        </Link>
        <Link href="/rail/consists">
          <Button size="sm" variant="outline" className="gap-1.5"><TrainFront className="w-3.5 h-3.5" /> View Consists</Button>
        </Link>
        <Link href="/rail/yards">
          <Button size="sm" variant="outline" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> Check Yards</Button>
        </Link>
        <Link href="/rail/crew/hos">
          <Button size="sm" variant="outline" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Crew HOS</Button>
        </Link>
      </div>

      {/* 6 KPI Cards */}
      {stats.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KpiCard icon={<Package className="w-5 h-5" />} label="Active Shipments" value={stats.data?.activeShipments || 0} isLight={isLight} accent="blue" />
          <KpiCard icon={<TrainFront className="w-5 h-5" />} label="Cars In Transit" value={stats.data?.carsInTransit || 0} isLight={isLight} accent="cyan" />
          <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Revenue MTD" value={`$${(stats.data?.revenue || 0).toLocaleString()}`} isLight={isLight} accent="emerald" />
          <KpiCard icon={<Clock className="w-5 h-5" />} label="Avg Transit Days" value={stats.data?.avgTransitDays || 0} isLight={isLight} accent="amber" />
          <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Demurrage Costs" value={`$${(stats.data?.demurrageCosts || 0).toLocaleString()}`} isLight={isLight} accent="red" />
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="On-Time Rate" value={`${stats.data?.onTimeRate || 0}%`} isLight={isLight} accent="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Shipments — 2 columns */}
        <div className="lg:col-span-2">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className={cn("text-lg", isLight ? "text-slate-900" : "text-white")}>Recent Shipments</CardTitle>
              <Link href="/rail/shipments">
                <Badge variant="outline" className="cursor-pointer hover:bg-blue-500/10">View All <ArrowUpRight className="w-3 h-3 ml-1" /></Badge>
              </Link>
            </CardHeader>
            <CardContent>
              {shipments.isLoading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <div className="space-y-1.5">
                  {(shipments.data?.shipments || []).map((s: any) => (
                    <Link key={s.id} href={`/rail/shipments/${s.id}`}>
                      <div className={cn("flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30")}>
                        <div className="flex items-center gap-3">
                          <TrainFront className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{s.shipmentNumber}</div>
                            <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{s.commodity || "General Freight"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400"}>{s.status?.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {(shipments.data?.shipments || []).length === 0 && (
                    <div className="text-center py-12">
                      <TrainFront className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                      <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>No rail shipments yet</p>
                      <Link href="/rail/shipments/create">
                        <Button size="sm" className="mt-3 gap-1"><Plus className="w-3.5 h-3.5" /> Create First Shipment</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Feed — 1 column */}
        <div>
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                <Bell className="w-4 h-4 text-amber-400" /> Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={cn("p-3 rounded-lg border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20")}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className={cn("text-xs font-semibold", isLight ? "text-amber-800" : "text-amber-400")}>Demurrage Warning</span>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-amber-700" : "text-amber-300/70")}>Monitor cars approaching demurrage thresholds</p>
                </div>
                <div className={cn("p-3 rounded-lg border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className={cn("text-xs font-semibold", isLight ? "text-blue-800" : "text-blue-400")}>Crew HOS</span>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-blue-700" : "text-blue-300/70")}>Track crew hours for FRA compliance</p>
                </div>
                <div className={cn("p-3 rounded-lg border", isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")}>
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                    <span className={cn("text-xs font-semibold", isLight ? "text-emerald-800" : "text-emerald-400")}>System Status</span>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-emerald-700" : "text-emerald-300/70")}>All rail systems operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
