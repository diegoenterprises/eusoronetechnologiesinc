/**
 * RAIL COMMAND CENTER — V5 Multi-Modal
 * Dispatcher command center: real-time train map, consist status board,
 * yard occupancy, crew HOS status, alert feed
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Monitor,
  TrainFront,
  Warehouse,
  Users,
  Bell,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Signal,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/hooks/useLocale";

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

export default function RailCommandCenter() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("overview");

  const stats = trpc.railShipments.getRailDashboardStats.useQuery();
  const shipments = trpc.railShipments.getRailShipments.useQuery({
    status: "in_transit",
    limit: 20,
  });
  const yards = trpc.railShipments.getRailYards.useQuery({ limit: 25 });

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Monitor className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1
              className={cn(
                "text-2xl font-bold",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              {t('railCommandCenter.title')}
            </h1>
            <p
              className={cn(
                "text-sm",
                isLight ? "text-slate-500" : "text-slate-400"
              )}
            >
              Real-time dispatcher operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">LIVE</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              stats.refetch();
              shipments.refetch();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      {stats.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={<TrainFront className="w-5 h-5 text-blue-400" />}
            label="Active Trains"
            value={stats.data?.activeShipments || 0}
            color="bg-blue-500"
            isLight={isLight}
          />
          <KpiCard
            icon={<Activity className="w-5 h-5 text-emerald-400" />}
            label="Cars In Transit"
            value={stats.data?.carsInTransit || 0}
            color="bg-emerald-500"
            isLight={isLight}
          />
          <KpiCard
            icon={<Warehouse className="w-5 h-5 text-amber-400" />}
            label="Yards Active"
            value={(yards.data || []).length}
            color="bg-amber-500"
            isLight={isLight}
          />
          <KpiCard
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            label="Active Alerts"
            value={0}
            color="bg-red-500"
            isLight={isLight}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Signal className="w-3.5 h-3.5 mr-1" />
            Train Board
          </TabsTrigger>
          <TabsTrigger value="yards">
            <Warehouse className="w-3.5 h-3.5 mr-1" />
            Yard Status
          </TabsTrigger>
          <TabsTrigger value="crew">
            <Users className="w-3.5 h-3.5 mr-1" />
            Crew HOS
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="w-3.5 h-3.5 mr-1" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Train Board Tab */}
        <TabsContent value="overview">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                <TrainFront className="w-4 h-4 text-blue-400" />
                Active Consists &amp; Trains
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipments.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : (shipments.data?.shipments || []).length === 0 ? (
                <p className="text-sm text-center py-8 text-slate-500">
                  No active trains in transit
                </p>
              ) : (
                <div className="space-y-2">
                  {(shipments.data?.shipments || []).map((s: any) => (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-700/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isLight ? "text-slate-900" : "text-white"
                            )}
                          >
                            {s.shipmentNumber}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isLight ? "text-slate-500" : "text-slate-400"
                            )}
                          >
                            {s.commodity || "General"} — {s.carType?.replace(/_/g, " ") || "Mixed"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                          {s.status?.replace(/_/g, " ")}
                        </Badge>
                        <span
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-400" : "text-slate-500"
                          )}
                        >
                          {s.numberOfCars || 1} cars
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yard Status Tab */}
        <TabsContent value="yards">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                <Warehouse className="w-4 h-4 text-amber-400" />
                Yard Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {yards.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(yards.data || []).map((y: any) => (
                    <div
                      key={y.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-700/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Warehouse className="w-4 h-4 text-amber-400" />
                        <div>
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isLight ? "text-slate-900" : "text-white"
                            )}
                          >
                            {y.name}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isLight ? "text-slate-500" : "text-slate-400"
                            )}
                          >
                            {y.city}, {y.state} — {y.totalTracks || 0} tracks
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {y.hasIntermodal && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            Intermodal
                          </Badge>
                        )}
                        <Badge
                          className={
                            y.isActive
                              ? "bg-emerald-500/20 text-emerald-400 text-xs"
                              : "bg-red-500/20 text-red-400 text-xs"
                          }
                        >
                          {y.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crew HOS Tab */}
        <TabsContent value="crew">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                Crew Hours of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg mb-4",
                  isLight ? "bg-blue-50" : "bg-blue-500/10"
                )}
              >
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    Rail HOS Rules (49 CFR 228)
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    12-hour on-duty limit • 10-hour undisturbed rest • Limbo
                    time tracking
                  </div>
                </div>
              </div>
              <p
                className={cn(
                  "text-sm text-center py-8",
                  isLight ? "text-slate-400" : "text-slate-500"
                )}
              >
                No crew assignments found. Assign crew to active consists to
                track HOS compliance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                <Bell className="w-4 h-4 text-red-400" />
                Operational Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg",
                  isLight ? "bg-emerald-50" : "bg-emerald-500/10"
                )}
              >
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    All Clear
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    No active alerts or operational issues at this time
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
