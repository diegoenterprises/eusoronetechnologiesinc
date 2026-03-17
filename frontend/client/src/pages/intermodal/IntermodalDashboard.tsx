/**
 * INTERMODAL DASHBOARD — V5 Multi-Modal
 * Multi-modal overview: active intermodal shipments, mode distribution,
 * top corridors, container journey tracker
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Layers,
  Truck,
  TrainFront,
  Ship,
  ArrowUpRight,
  Package,
  MapPin,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

function KpiCard({
  icon,
  label,
  value,
  color,
  isLight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
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
      <div className={cn("p-2 rounded-lg w-fit mb-2", `${color}/10`)}>
        {icon}
      </div>
      <div
        className={cn(
          "text-2xl font-bold",
          isLight ? "text-slate-900" : "text-white"
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-xs mt-1",
          isLight ? "text-slate-500" : "text-slate-400"
        )}
      >
        {label}
      </div>
    </div>
  );
}

// Mock mode distribution — will be replaced with real data
const MODE_DISTRIBUTION = [
  { mode: "Truck", pct: 45, color: "bg-orange-500", icon: <Truck className="w-3.5 h-3.5 text-orange-400" /> },
  { mode: "Rail", pct: 35, color: "bg-blue-500", icon: <TrainFront className="w-3.5 h-3.5 text-blue-400" /> },
  { mode: "Vessel", pct: 20, color: "bg-cyan-500", icon: <Ship className="w-3.5 h-3.5 text-cyan-400" /> },
];

const TOP_CORRIDORS = [
  { origin: "Los Angeles, CA", destination: "Chicago, IL", modes: ["truck", "rail"], volume: 142 },
  { origin: "Shanghai, CN", destination: "Long Beach, CA", modes: ["vessel", "truck"], volume: 98 },
  { origin: "Houston, TX", destination: "Atlanta, GA", modes: ["rail", "truck"], volume: 87 },
  { origin: "Newark, NJ", destination: "Columbus, OH", modes: ["truck", "rail"], volume: 76 },
  { origin: "Savannah, GA", destination: "Memphis, TN", modes: ["vessel", "rail", "truck"], volume: 64 },
];

const MODE_ICON_MAP: Record<string, React.ReactNode> = {
  truck: <Truck className="w-3 h-3 text-orange-400" />,
  rail: <TrainFront className="w-3 h-3 text-blue-400" />,
  vessel: <Ship className="w-3 h-3 text-cyan-400" />,
};

export default function IntermodalDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dashboard = trpc.intermodal.getIntermodalDashboard.useQuery();

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Layers className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Intermodal Dashboard
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Multi-modal shipment overview
          </p>
        </div>
      </div>

      {/* KPIs */}
      {dashboard.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<Layers className="w-5 h-5 text-violet-400" />}
            label="Active Intermodal"
            value={dashboard.data?.activeShipments || 0}
            color="bg-violet-500"
            isLight={isLight}
          />
          <KpiCard
            icon={<Package className="w-5 h-5 text-emerald-400" />}
            label="Containers In Transit"
            value={dashboard.data?.containersInTransit || 0}
            color="bg-emerald-500"
            isLight={isLight}
          />
          <KpiCard
            icon={<Activity className="w-5 h-5 text-amber-400" />}
            label="Pending Transfers"
            value={dashboard.data?.pendingTransfers || 0}
            color="bg-amber-500"
            isLight={isLight}
          />
          <KpiCard
            icon={<MapPin className="w-5 h-5 text-blue-400" />}
            label="Active Corridors"
            value={TOP_CORRIDORS.length}
            color="bg-blue-500"
            isLight={isLight}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Distribution */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle
              className={cn(
                "text-sm",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              Mode Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MODE_DISTRIBUTION.map((m) => (
              <div key={m.mode}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {m.icon}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isLight ? "text-slate-700" : "text-slate-300"
                      )}
                    >
                      {m.mode}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    {m.pct}%
                  </span>
                </div>
                <Progress
                  value={m.pct}
                  className={cn("h-2", `[&>div]:${m.color}`)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Corridors */}
        <Card className={cardBg}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle
              className={cn(
                "text-sm",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              Top Corridors
            </CardTitle>
            <Link href="/intermodal/tracking">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-violet-500/10"
              >
                View All{" "}
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Badge>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {TOP_CORRIDORS.map((c, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  isLight ? "bg-slate-50" : "bg-slate-700/20"
                )}
              >
                <div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    {c.origin} → {c.destination}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {c.modes.map((m, j) => (
                      <React.Fragment key={m}>
                        {j > 0 && (
                          <span className="text-slate-500 text-[10px]">→</span>
                        )}
                        {MODE_ICON_MAP[m]}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-sm font-bold",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    {c.volume}
                  </div>
                  <div
                    className={cn(
                      "text-[10px]",
                      isLight ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    shipments
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
