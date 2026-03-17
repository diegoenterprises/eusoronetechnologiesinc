/**
 * VESSEL DASHBOARD — V5 Multi-Modal
 * Maritime operations dashboard: active bookings, containers in transit,
 * port congestion alerts, recent bookings list
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Ship,
  Container,
  Anchor,
  DollarSign,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

function KpiCard({
  icon,
  label,
  value,
  isLight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isLight: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isLight
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-slate-800/60 border-slate-700/50"
      )}
    >
      <div className={cn("p-2 rounded-lg w-fit mb-2", isLight ? "bg-cyan-50" : "bg-cyan-500/10")}>
        {icon}
      </div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
        {value}
      </div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
        {label}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  booking_requested: "bg-yellow-500/20 text-yellow-400",
  booking_confirmed: "bg-blue-500/20 text-blue-400",
  in_transit: "bg-emerald-500/20 text-emerald-400",
  departed: "bg-cyan-500/20 text-cyan-400",
  arrived: "bg-teal-500/20 text-teal-400",
  delivered: "bg-green-500/20 text-green-400",
  settled: "bg-green-600/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-400",
  customs_hold: "bg-red-500/20 text-red-400",
};

export default function VesselDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const stats = trpc.vesselShipments.getVesselDashboard.useQuery();
  const bookings = trpc.vesselShipments.getVesselShipments.useQuery({ limit: 10 });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Ship className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            Vessel Dashboard
          </h1>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            Maritime operations overview
          </p>
        </div>
      </div>

      {/* KPIs */}
      {stats.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <KpiCard
            icon={<Ship className="w-5 h-5 text-cyan-400" />}
            label="Active Bookings"
            value={stats.data?.activeBookings || 0}
            isLight={isLight}
          />
          <KpiCard
            icon={<Container className="w-5 h-5 text-blue-400" />}
            label="Containers In Transit"
            value={stats.data?.containersInTransit || 0}
            isLight={isLight}
          />
          <KpiCard
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            label="Revenue"
            value={`$${(stats.data?.revenue || 0).toLocaleString()}`}
            isLight={isLight}
          />
        </div>
      )}

      {/* Recent Bookings */}
      <Card className={cardBg}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={cn("text-lg", isLight ? "text-slate-900" : "text-white")}>
            Recent Bookings
          </CardTitle>
          <Link href="/vessel/bookings">
            <Badge variant="outline" className="cursor-pointer hover:bg-cyan-500/10">
              View All <ArrowUpRight className="w-3 h-3 ml-1" />
            </Badge>
          </Link>
        </CardHeader>
        <CardContent>
          {bookings.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(bookings.data?.shipments || []).map((s: any) => (
                <Link key={s.id} href={`/vessel/bookings/${s.id}`}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Ship className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>
                          {s.bookingNumber}
                        </div>
                        <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          {s.cargoType?.replace(/_/g, " ") || "Container"} — {s.commodity || "General"}
                        </div>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400"}>
                      {s.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(bookings.data?.shipments || []).length === 0 && (
                <p className={cn("text-sm text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>
                  No vessel bookings yet
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
