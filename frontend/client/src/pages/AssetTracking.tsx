/**
 * ASSET TRACKING & IoT SENSOR MANAGEMENT DASHBOARD
 * Real-time fleet tracking, sensor data, temperature monitoring,
 * cargo integrity, trailer/container tracking, utilization analytics,
 * geofence management, dwell time analysis, alert center.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Truck, Thermometer, AlertTriangle, Activity,
  Gauge, Shield, Search, RefreshCw, Signal, Package,
  Container, Clock, Bell, Settings, ChevronRight,
  Radio, Eye, Zap, BarChart3, CheckCircle2, XCircle,
  Wifi, WifiOff, Battery, Timer, Lock, Unlock, TrendingUp,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ── Accent color helpers (cyan/teal IoT theme) ──────────────────────────────

const CYAN = "text-cyan-400";
const TEAL = "text-teal-400";
const ACCENT_BG = "bg-cyan-500/10 border-cyan-500/20";
const ACCENT_RING = "ring-cyan-500/30";

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub, isLight = false }: {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
  sub?: string;
  isLight?: boolean;
}) {
  return (
    <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"} mb-1`}>{label}</p>
            <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-zinc-100"}`}>{value}</p>
            {sub && <p className={`text-xs ${isLight ? "text-slate-400" : "text-zinc-500"} mt-0.5`}>{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${ACCENT_BG}`}>
            <Icon className={`h-5 w-5 ${color || CYAN}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Utilization Gauge ────────────────────────────────────────────────────────

function UtilizationGauge({ label, value, color, isLight = false }: { label: string; value: number; color: string; isLight?: boolean }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${clampedValue}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-100">
          {clampedValue}%
        </span>
      </div>
      <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{label}</span>
    </div>
  );
}

// ── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant="outline" className={`text-xs px-1.5 py-0 ${styles[severity] || styles.low}`}>
      {severity}
    </Badge>
  );
}

// ── Sensor Status Dot ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-400",
    normal: "bg-emerald-400",
    active: "bg-emerald-400",
    compliant: "bg-emerald-400",
    warning: "bg-yellow-400",
    offline: "bg-red-400",
    error: "bg-red-400",
    violation: "bg-red-400",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status] || "bg-zinc-500"}`} />;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AssetTracking() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // ── Data queries ───────────────────────────────────────────────────────────

  const dashboard = trpc.assetTracking.getAssetTrackingDashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const locations = trpc.assetTracking.getAssetLocations.useQuery(
    { search: searchQuery || undefined },
    { refetchInterval: 15000 }
  );

  const sensors = trpc.assetTracking.getIotSensors.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: activeTab === "sensors",
  });

  const sensorAlerts = trpc.assetTracking.getSensorAlerts.useQuery(undefined, {
    refetchInterval: 20000,
    enabled: activeTab === "alerts" || activeTab === "overview",
  });

  const tempMonitoring = trpc.assetTracking.getTemperatureMonitoring.useQuery(undefined, {
    refetchInterval: 20000,
    enabled: activeTab === "temperature",
  });

  const trailerTracking = trpc.assetTracking.getTrailerTracking.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: activeTab === "trailers",
  });

  const containerTracking = trpc.assetTracking.getContainerTracking.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: activeTab === "containers",
  });

  const utilization = trpc.assetTracking.getAssetUtilization.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: activeTab === "utilization",
  });

  const dwellTime = trpc.assetTracking.getAssetDwellTime.useQuery(undefined, {
    enabled: activeTab === "dwell",
  });

  const geofenceEvents = trpc.assetTracking.getGeofenceEvents.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: activeTab === "geofences",
  });

  const fleetMap = trpc.assetTracking.getFleetMap.useQuery(undefined, {
    refetchInterval: 15000,
    enabled: activeTab === "map",
  });

  const maintenanceDue = trpc.assetTracking.getAssetMaintenanceDue.useQuery(undefined, {
    enabled: activeTab === "overview",
  });

  const lifecycle = trpc.assetTracking.getAssetLifecycleStatus.useQuery(undefined, {
    enabled: activeTab === "overview",
  });

  // ── Detail queries (when asset selected) ──────────────────────────────────

  const assetDetails = trpc.assetTracking.getAssetDetails.useQuery(
    { assetId: selectedAssetId! },
    { enabled: !!selectedAssetId, refetchInterval: 10000 }
  );

  const assetReportCard = trpc.assetTracking.getAssetReportCard.useQuery(
    { assetId: selectedAssetId! },
    { enabled: !!selectedAssetId && activeTab === "overview" }
  );

  // ── Derived data ──────────────────────────────────────────────────────────

  const data = dashboard.data;
  const alertCount = sensorAlerts.data?.length || 0;
  const criticalAlerts = sensorAlerts.data?.filter(a => a.severity === "critical").length || 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-1">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-zinc-100"}`}>
            <Radio className={`h-6 w-6 ${CYAN}`} />
            Asset Tracking & IoT
          </h1>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-zinc-500"} mt-0.5`}>
            Real-time fleet tracking, sensor monitoring, and asset intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalAlerts > 0 && (
            <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 text-xs animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {criticalAlerts} Critical
            </Badge>
          )}
          <Badge variant="outline" className={`text-xs ${ACCENT_BG} ${CYAN}`}>
            <Signal className="h-3 w-3 mr-1" />
            {data?.activeSensors || 0} Sensors
          </Badge>
          <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
            <Truck className="h-3 w-3 mr-1" />
            {data?.totalAssets || 0} Assets
          </Badge>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search assets, sensors, locations..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          onClick={() => {
            dashboard.refetch();
            locations.refetch();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedAssetId(null); }}>
        <TabsList className={`${isLight ? "bg-slate-100 border border-slate-200" : "bg-zinc-900 border border-zinc-800"} flex flex-wrap h-auto gap-0.5 p-1`}>
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Overview
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <MapPin className="h-3.5 w-3.5 mr-1" /> Fleet Map
          </TabsTrigger>
          <TabsTrigger value="sensors" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Wifi className="h-3.5 w-3.5 mr-1" /> Sensors
          </TabsTrigger>
          <TabsTrigger value="temperature" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Thermometer className="h-3.5 w-3.5 mr-1" /> Cold Chain
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Bell className="h-3.5 w-3.5 mr-1" /> Alerts
            {alertCount > 0 && <span className="ml-1 bg-red-500/20 text-red-400 text-xs px-1 rounded">{alertCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="utilization" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Gauge className="h-3.5 w-3.5 mr-1" /> Utilization
          </TabsTrigger>
          <TabsTrigger value="trailers" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Package className="h-3.5 w-3.5 mr-1" /> Trailers
          </TabsTrigger>
          <TabsTrigger value="containers" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Container className="h-3.5 w-3.5 mr-1" /> Containers
          </TabsTrigger>
          <TabsTrigger value="geofences" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Shield className="h-3.5 w-3.5 mr-1" /> Geofences
          </TabsTrigger>
          <TabsTrigger value="dwell" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Timer className="h-3.5 w-3.5 mr-1" /> Dwell Time
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {dashboard.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 bg-zinc-800" />)}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Assets" value={data?.totalAssets || 0} icon={Truck} />
                <StatCard label="Active" value={data?.activeAssets || 0} icon={Activity} color="text-emerald-400" />
                <StatCard label="Idle" value={data?.idleAssets || 0} icon={Clock} color="text-yellow-400" />
                <StatCard label="Maintenance" value={data?.maintenanceAssets || 0} icon={Settings} color="text-orange-400" />
                <StatCard label="Active Sensors" value={data?.activeSensors || 0} icon={Wifi} />
                <StatCard label="Sensor Alerts" value={data?.sensorAlerts || 0} icon={AlertTriangle} color="text-red-400" />
                <StatCard label="Avg Utilization" value={`${data?.avgUtilization || 0}%`} icon={Gauge} color={TEAL} />
                <StatCard label="Temp Compliance" value={`${data?.temperatureCompliance || 0}%`} icon={Thermometer} color="text-blue-400" />
              </div>

              {/* Asset Type Breakdown + Lifecycle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${CYAN}`} />
                      Asset Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: "Trucks", count: data?.trucks || 0, color: "bg-cyan-500" },
                        { label: "Trailers", count: data?.trailers || 0, color: "bg-teal-500" },
                        { label: "Containers", count: data?.containers || 0, color: "bg-blue-500" },
                        { label: "Equipment", count: data?.equipment || 0, color: "bg-purple-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"} w-20`}>{item.label}</span>
                          <div className="flex-1 bg-zinc-800 rounded-full h-2">
                            <div
                              className={`${item.color} h-2 rounded-full transition-all`}
                              style={{ width: `${data?.totalAssets ? (item.count / data.totalAssets) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-zinc-200 w-8 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                      <Activity className={`h-4 w-4 ${TEAL}`} />
                      Lifecycle Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lifecycle.isLoading ? (
                      <Skeleton className="h-32 bg-zinc-800" />
                    ) : (
                      <div className="space-y-3">
                        {(lifecycle.data?.stages || []).map((stage) => (
                          <div key={stage.stage} className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                            <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"} flex-1`}>{stage.label}</span>
                            <span className="text-sm font-medium text-zinc-200">{stage.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Maintenance Due + Recent Alerts side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-orange-400" />
                      Maintenance Due
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-64 overflow-y-auto">
                    {maintenanceDue.isLoading ? (
                      <Skeleton className="h-32 bg-zinc-800" />
                    ) : (maintenanceDue.data || []).length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-6">No upcoming maintenance</p>
                    ) : (
                      <div className="space-y-2">
                        {(maintenanceDue.data || []).slice(0, 6).map((m) => (
                          <div key={m.assetId} className={`flex items-center justify-between py-1.5 ${isLight ? "border-b border-slate-200" : "border-b border-zinc-800"} last:border-0`}>
                            <div>
                              <p className="text-xs font-medium text-zinc-200">{m.assetName}</p>
                              <p className="text-xs text-zinc-500">{m.serviceType}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                m.priority === "overdue"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : m.priority === "urgent"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                              }`}
                            >
                              {m.priority === "overdue" ? "Overdue" : `${m.daysUntilDue}d`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Recent Sensor Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-64 overflow-y-auto">
                    {sensorAlerts.isLoading ? (
                      <Skeleton className="h-32 bg-zinc-800" />
                    ) : (sensorAlerts.data || []).length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-6">No active alerts</p>
                    ) : (
                      <div className="space-y-2">
                        {(sensorAlerts.data || []).slice(0, 6).map((alert) => (
                          <div key={alert.alertId} className={`flex items-center justify-between py-1.5 ${isLight ? "border-b border-slate-200" : "border-b border-zinc-800"} last:border-0`}>
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={alert.severity} />
                              <div>
                                <p className="text-xs font-medium text-zinc-200">{alert.assetName}</p>
                                <p className="text-xs text-zinc-500">{alert.message}</p>
                              </div>
                            </div>
                            {alert.acknowledged ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FLEET MAP TAB                                                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="map" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${CYAN}`} />
                Real-Time Fleet Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fleetMap.isLoading ? (
                <Skeleton className="h-96 bg-zinc-800 rounded-lg" />
              ) : (
                <div className="space-y-3">
                  {/* Map placeholder with asset pins */}
                  <div className="relative bg-zinc-800 rounded-lg h-96 flex items-center justify-center border border-zinc-700">
                    <div className="text-center space-y-2">
                      <MapPin className={`h-12 w-12 mx-auto ${CYAN} opacity-50`} />
                      <p className="text-sm text-zinc-400">
                        {fleetMap.data?.assets.length || 0} assets tracked
                      </p>
                      <p className="text-xs text-zinc-600">
                        {fleetMap.data?.geofences.length || 0} geofence zones active
                      </p>
                    </div>
                    {/* Asset position indicators */}
                    {(fleetMap.data?.assets || []).slice(0, 20).map((asset, i) => (
                      <div
                        key={asset.assetId}
                        className="absolute"
                        style={{
                          left: `${10 + (i % 5) * 18}%`,
                          top: `${15 + Math.floor(i / 5) * 20}%`,
                        }}
                      >
                        <button
                          className={`group relative p-1 rounded-full ${
                            asset.status === "active" ? "bg-cyan-500/30" : "bg-zinc-700/50"
                          } hover:scale-125 transition-transform`}
                          onClick={() => setSelectedAssetId(asset.assetId)}
                          title={asset.assetName}
                        >
                          <Truck className={`h-3.5 w-3.5 ${asset.status === "active" ? CYAN : "text-zinc-500"}`} />
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {asset.assetName.slice(0, 15)}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Asset list below map */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {(fleetMap.data?.assets || []).map((asset) => (
                      <button
                        key={asset.assetId}
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30 transition-colors text-left"
                        onClick={() => setSelectedAssetId(asset.assetId)}
                      >
                        <StatusDot status={asset.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-200 truncate">{asset.assetName}</p>
                          <p className="text-xs text-zinc-500 truncate">{asset.address}</p>
                        </div>
                        <span className="text-xs text-zinc-600">{asset.speed} mph</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Asset Detail */}
          {selectedAssetId && assetDetails.data && (
            <Card className={`bg-zinc-900/80 border-cyan-500/30`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                  <Eye className={`h-4 w-4 ${CYAN}`} />
                  {assetDetails.data.assetName}
                  <Button variant="ghost" size="sm" className="ml-auto text-xs text-zinc-500" onClick={() => setSelectedAssetId(null)}>
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500">Speed</p>
                    <p className="text-lg font-bold text-zinc-200">{assetDetails.data.speed} <span className="text-xs">mph</span></p>
                  </div>
                  <div className="text-center p-2 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500">Heading</p>
                    <p className="text-lg font-bold text-zinc-200">{assetDetails.data.heading}&deg;</p>
                  </div>
                  <div className="text-center p-2 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500">Fuel</p>
                    <p className="text-lg font-bold text-zinc-200">{assetDetails.data.fuelLevel}%</p>
                  </div>
                  <div className="text-center p-2 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500">Engine Hours</p>
                    <p className="text-lg font-bold text-zinc-200">{assetDetails.data.engineHours?.toLocaleString()}</p>
                  </div>
                </div>
                {/* Sensors */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(assetDetails.data.sensors || []).map((s) => (
                    <div key={s.sensorId} className="p-2 bg-zinc-800 rounded-lg text-center">
                      <StatusDot status={s.status} />
                      <p className="text-xs text-zinc-500 mt-1 capitalize">{s.type.replace("_", " ")}</p>
                      <p className="text-sm font-semibold text-zinc-200">{s.value} {s.unit}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        <Battery className="h-2.5 w-2.5 inline mr-0.5" />{s.batteryLevel}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SENSORS TAB                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="sensors" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${CYAN}`} />
                IoT Sensor Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sensors.isLoading ? (
                <Skeleton className="h-64 bg-zinc-800" />
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {(() => {
                      const all = sensors.data || [];
                      const online = all.filter(s => s.status === "online").length;
                      const warning = all.filter(s => s.status === "warning").length;
                      const offline = all.filter(s => s.status === "offline").length;
                      const avgBattery = all.length > 0 ? Math.round(all.reduce((sum, s) => sum + s.batteryLevel, 0) / all.length) : 0;
                      return (
                        <>
                          <StatCard label="Total Sensors" value={all.length} icon={Wifi} />
                          <StatCard label="Online" value={online} icon={Signal} color="text-emerald-400" />
                          <StatCard label="Warning" value={warning} icon={AlertTriangle} color="text-yellow-400" />
                          <StatCard label="Avg Battery" value={`${avgBattery}%`} icon={Battery} color={offline > 0 ? "text-orange-400" : TEAL} />
                        </>
                      );
                    })()}
                  </div>

                  {/* Sensor Table */}
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`text-zinc-500 ${isLight ? "border-b border-slate-200" : "border-b border-zinc-800"}`}>
                          <th className="text-left py-2 px-2">Sensor ID</th>
                          <th className="text-left py-2 px-2">Asset</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-center py-2 px-2">Status</th>
                          <th className="text-center py-2 px-2">Battery</th>
                          <th className="text-center py-2 px-2">Signal</th>
                          <th className="text-left py-2 px-2">Firmware</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sensors.data || []).slice(0, 50).map((s) => (
                          <tr key={s.sensorId} className={`${isLight ? "border-b border-slate-200 hover:bg-slate-50" : "border-b border-zinc-800/50 hover:bg-zinc-800/30"}`}>
                            <td className="py-1.5 px-2 text-zinc-300 font-mono">{s.sensorId}</td>
                            <td className="py-1.5 px-2 text-zinc-400">{s.assetName}</td>
                            <td className="py-1.5 px-2">
                              <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 capitalize">{s.type}</Badge>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <StatusDot status={s.status} />
                              <span className="ml-1 text-zinc-400 capitalize">{s.status}</span>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={s.batteryLevel < 30 ? "text-red-400" : s.batteryLevel < 60 ? "text-yellow-400" : "text-emerald-400"}>
                                {s.batteryLevel}%
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-center text-zinc-400">{s.signalStrength}%</td>
                            <td className="py-1.5 px-2 text-zinc-500 font-mono">{s.firmwareVersion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TEMPERATURE / COLD CHAIN TAB                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="temperature" className="mt-4 space-y-4">
          {tempMonitoring.isLoading ? (
            <Skeleton className="h-64 bg-zinc-800" />
          ) : (
            <>
              {/* Cold Chain KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Monitored Assets" value={tempMonitoring.data?.assets.length || 0} icon={Thermometer} color="text-blue-400" />
                <StatCard label="Compliance Rate" value={`${tempMonitoring.data?.complianceRate || 100}%`} icon={Shield} color="text-emerald-400" />
                <StatCard label="Active Excursions" value={tempMonitoring.data?.activeExcursions || 0} icon={AlertTriangle} color="text-red-400" />
                <StatCard label="Avg Temperature" value={`${tempMonitoring.data?.assets.length ? Math.round(tempMonitoring.data.assets.reduce((s, a) => s + a.currentTemp, 0) / tempMonitoring.data.assets.length) : 0}°F`} icon={Thermometer} />
              </div>

              {/* Temperature Chart Placeholder */}
              <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${CYAN}`} />
                    Temperature Trend (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-zinc-800 rounded-lg flex items-end gap-0.5 p-4">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const height = 30 + Math.sin(i * 0.5) * 20 + Math.sin(i * 1.7 + 3) * 7.5 + 7.5;
                      const isExcursion = height > 55;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t transition-all ${
                            isExcursion ? "bg-red-500/70" : "bg-cyan-500/50"
                          }`}
                          style={{ height: `${height}%` }}
                          title={`${i}:00 - ${Math.round(height * 0.6)}°F`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 mt-1 px-4">
                    <span>24h ago</span>
                    <span>12h ago</span>
                    <span>Now</span>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Temperature Grid */}
              <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-300">Cold Chain Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {(tempMonitoring.data?.assets || []).map((asset) => (
                      <div
                        key={asset.assetId}
                        className={`p-3 rounded-lg border ${
                          asset.excursionActive
                            ? "bg-red-500/5 border-red-500/30"
                            : "bg-zinc-800/50 border-zinc-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-zinc-200">{asset.assetName}</span>
                          <StatusDot status={asset.compliance} />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <Thermometer className={`h-5 w-5 mx-auto ${asset.excursionActive ? "text-red-400" : "text-blue-400"}`} />
                            <p className={`text-lg font-bold ${asset.excursionActive ? "text-red-400" : "text-zinc-200"}`}>
                              {asset.currentTemp}°F
                            </p>
                          </div>
                          <div className="flex-1 text-xs text-zinc-500 space-y-0.5">
                            <p>Set: {asset.setPoint}°F</p>
                            <p>Range: {asset.minTemp}°F - {asset.maxTemp}°F</p>
                            <p>Zone: <span className="capitalize">{asset.zone}</span></p>
                            {asset.excursionActive && (
                              <p className="text-red-400">Excursion: {asset.excursionDurationMinutes}min</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ALERTS TAB                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-400" />
                Alert Management Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sensorAlerts.isLoading ? (
                <Skeleton className="h-64 bg-zinc-800" />
              ) : (sensorAlerts.data || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-500/50" />
                  <p className="text-sm">All clear - no active sensor alerts</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(sensorAlerts.data || []).map((alert) => (
                    <div
                      key={alert.alertId}
                      className={`p-3 rounded-lg border ${
                        alert.severity === "critical"
                          ? "bg-red-500/5 border-red-500/20"
                          : alert.severity === "high"
                            ? "bg-orange-500/5 border-orange-500/20"
                            : "bg-zinc-800/50 border-zinc-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <SeverityBadge severity={alert.severity} />
                          <div>
                            <p className="text-xs font-medium text-zinc-200">{alert.assetName}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{alert.message}</p>
                            <p className="text-xs text-zinc-600 mt-1">
                              Value: {alert.value} | Threshold: {alert.threshold} | {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {alert.acknowledged ? (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />ACK
                            </Badge>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-xs text-zinc-400 h-6 px-2">
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* UTILIZATION TAB                                                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="utilization" className="mt-4 space-y-4">
          {utilization.isLoading ? (
            <Skeleton className="h-64 bg-zinc-800" />
          ) : (
            <>
              {/* Gauges */}
              <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                    <Gauge className={`h-4 w-4 ${CYAN}`} />
                    Fleet Utilization Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around py-4">
                    <UtilizationGauge
                      label="Moving"
                      value={utilization.data?.summary.movingPct || 0}
                      color="#06b6d4"
                    />
                    <UtilizationGauge
                      label="Revenue"
                      value={utilization.data?.summary.revenuePct || 0}
                      color="#14b8a6"
                    />
                    <UtilizationGauge
                      label="Idle"
                      value={utilization.data?.summary.idlePct || 0}
                      color="#f59e0b"
                    />
                    <UtilizationGauge
                      label="Maintenance"
                      value={utilization.data?.summary.maintenancePct || 0}
                      color="#ef4444"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Per-asset utilization table */}
              <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-300">Asset Utilization Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`text-zinc-500 ${isLight ? "border-b border-slate-200" : "border-b border-zinc-800"}`}>
                          <th className="text-left py-2 px-2">Asset</th>
                          <th className="text-center py-2 px-2">Moving %</th>
                          <th className="text-center py-2 px-2">Revenue %</th>
                          <th className="text-center py-2 px-2">Idle %</th>
                          <th className="text-right py-2 px-2">Miles</th>
                          <th className="text-right py-2 px-2">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(utilization.data?.assets || []).map((a) => (
                          <tr key={a.assetId} className={`${isLight ? "border-b border-slate-200 hover:bg-slate-50" : "border-b border-zinc-800/50 hover:bg-zinc-800/30"}`}>
                            <td className="py-1.5 px-2 text-zinc-300">{a.assetName}</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={a.movingPct > 60 ? "text-emerald-400" : a.movingPct > 30 ? "text-yellow-400" : "text-red-400"}>
                                {a.movingPct}%
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-center text-teal-400">{a.revenuePct}%</td>
                            <td className="py-1.5 px-2 text-center text-zinc-400">{a.idlePct}%</td>
                            <td className="py-1.5 px-2 text-right text-zinc-300">{a.milesThisPeriod.toLocaleString()}</td>
                            <td className="py-1.5 px-2 text-right text-zinc-400">{a.hoursUsed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TRAILERS TAB                                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="trailers" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Package className={`h-4 w-4 ${TEAL}`} />
                Trailer Tracking Grid
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trailerTracking.isLoading ? (
                <Skeleton className="h-64 bg-zinc-800" />
              ) : (
                <>
                  {/* Summary Row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {(() => {
                      const all = trailerTracking.data || [];
                      return (
                        <>
                          <StatCard label="Total Trailers" value={all.length} icon={Package} />
                          <StatCard label="Loaded" value={all.filter(t => t.loadStatus === "loaded").length} icon={Truck} color="text-emerald-400" />
                          <StatCard label="Empty" value={all.filter(t => t.loadStatus === "empty").length} icon={Package} color="text-yellow-400" />
                          <StatCard label="Temp Controlled" value={all.filter(t => t.tempControlled).length} icon={Thermometer} color="text-blue-400" />
                        </>
                      );
                    })()}
                  </div>

                  {/* Trailer Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {(trailerTracking.data || []).map((trailer) => (
                      <div
                        key={trailer.trailerId}
                        className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-teal-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-zinc-200">{trailer.trailerNumber}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              trailer.loadStatus === "loaded"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : trailer.loadStatus === "empty"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {trailer.loadStatus}
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-500 space-y-0.5">
                          <p>Type: <span className="capitalize">{trailer.trailerType.replace("_", " ")}</span></p>
                          <p>Location: {trailer.currentLocation.address}</p>
                          {trailer.assignedDriver && <p>Driver: {trailer.assignedDriver}</p>}
                          {trailer.assignedLoad && <p>Load: {trailer.assignedLoad}</p>}
                          {trailer.dwellTimeHours > 0 && (
                            <p className="text-yellow-400">Dwell: {trailer.dwellTimeHours}h</p>
                          )}
                          {trailer.tempControlled && (
                            <p className="text-blue-400 flex items-center gap-1">
                              <Thermometer className="h-2.5 w-2.5" /> Temperature controlled
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CONTAINERS TAB                                                 */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="containers" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Container className={`h-4 w-4 ${CYAN}`} />
                Intermodal Container Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {containerTracking.isLoading ? (
                <Skeleton className="h-64 bg-zinc-800" />
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`text-zinc-500 ${isLight ? "border-b border-slate-200" : "border-b border-zinc-800"}`}>
                        <th className="text-left py-2 px-2">Container</th>
                        <th className="text-left py-2 px-2">Size</th>
                        <th className="text-left py-2 px-2">Mode</th>
                        <th className="text-left py-2 px-2">Origin</th>
                        <th className="text-left py-2 px-2">Destination</th>
                        <th className="text-left py-2 px-2">Location</th>
                        <th className="text-center py-2 px-2">Status</th>
                        <th className="text-right py-2 px-2">Weight</th>
                        <th className="text-left py-2 px-2">ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(containerTracking.data || []).map((c) => (
                        <tr key={c.containerId} className={`${isLight ? "border-b border-slate-200 hover:bg-slate-50" : "border-b border-zinc-800/50 hover:bg-zinc-800/30"}`}>
                          <td className="py-1.5 px-2 text-zinc-300 font-mono">{c.containerNumber}</td>
                          <td className="py-1.5 px-2 text-zinc-400">{c.size}</td>
                          <td className="py-1.5 px-2">
                            <Badge variant="outline" className="text-xs capitalize bg-zinc-800 border-zinc-700">{c.currentMode}</Badge>
                          </td>
                          <td className="py-1.5 px-2 text-zinc-400">{c.origin}</td>
                          <td className="py-1.5 px-2 text-zinc-400">{c.destination}</td>
                          <td className="py-1.5 px-2 text-zinc-300">{c.currentLocation.address}</td>
                          <td className="py-1.5 px-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                c.status === "delivered"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : c.status === "customs_hold"
                                    ? "bg-orange-500/10 text-orange-400"
                                    : "bg-cyan-500/10 text-cyan-400"
                              }`}
                            >
                              {c.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-1.5 px-2 text-right text-zinc-400">{c.weight.toLocaleString()} lbs</td>
                          <td className="py-1.5 px-2 text-zinc-500">{new Date(c.eta).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* GEOFENCES TAB                                                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="geofences" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Shield className={`h-4 w-4 ${TEAL}`} />
                Geofence Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {geofenceEvents.isLoading ? (
                <Skeleton className="h-64 bg-zinc-800" />
              ) : (geofenceEvents.data || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Shield className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No recent geofence events</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(geofenceEvents.data || []).map((event) => (
                    <div
                      key={event.eventId}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                    >
                      <div className={`p-1.5 rounded-full ${
                        event.eventType === "enter"
                          ? "bg-emerald-500/20"
                          : event.eventType === "exit"
                            ? "bg-red-500/20"
                            : "bg-yellow-500/20"
                      }`}>
                        {event.eventType === "enter" ? (
                          <Lock className="h-3.5 w-3.5 text-emerald-400" />
                        ) : event.eventType === "exit" ? (
                          <Unlock className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Timer className="h-3.5 w-3.5 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-200">
                          {event.assetName}
                          <span className="text-zinc-500 ml-1.5 capitalize">{event.eventType}</span>
                          <span className={`ml-1.5 ${CYAN}`}>{event.geofenceName}</span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(event.timestamp).toLocaleString()}
                          {event.speed > 0 && ` | ${event.speed} mph`}
                          {event.dwellSeconds && ` | Dwell: ${Math.round(event.dwellSeconds / 60)}min`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DWELL TIME TAB                                                 */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="dwell" className="mt-4 space-y-4">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Timer className={`h-4 w-4 ${CYAN}`} />
                Dwell Time Analysis by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dwellTime.isLoading ? (
                <Skeleton className="h-64 bg-zinc-800" />
              ) : (
                <div className="space-y-3">
                  {(dwellTime.data || []).map((loc) => (
                    <div
                      key={loc.locationName}
                      className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                            {loc.locationName}
                          </p>
                          <p className="text-xs text-zinc-500 capitalize ml-5">{loc.locationType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-zinc-200">{loc.assetsPresent} <span className="text-xs text-zinc-500 font-normal">assets</span></p>
                          <p className="text-xs text-zinc-500">Cost impact: ${loc.costImpact.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Dwell bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-zinc-500 w-8">Min</span>
                        <div className="flex-1 bg-zinc-900 rounded-full h-2 relative">
                          <div
                            className="bg-cyan-500/50 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (loc.avgDwellHours / loc.maxDwellHours) * 100)}%` }}
                          />
                          <div
                            className="absolute top-0 h-2 w-0.5 bg-red-500"
                            style={{ left: `${Math.min(100, 80)}%` }}
                            title="Target dwell threshold"
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-12 text-right">{loc.maxDwellHours}h max</span>
                      </div>
                      <p className="text-xs text-zinc-400 ml-11">
                        Avg: {loc.avgDwellHours}h | Min: {loc.minDwellHours}h | Max: {loc.maxDwellHours}h
                      </p>

                      {/* Top Dwellers */}
                      {loc.topDwellers.length > 0 && (
                        <div className="mt-2 ml-5">
                          <p className="text-xs text-zinc-600 mb-1">Longest dwellers:</p>
                          <div className="flex flex-wrap gap-2">
                            {loc.topDwellers.map((d) => (
                              <Badge key={d.assetId} variant="outline" className="text-xs bg-zinc-900 border-zinc-700">
                                {d.assetName} - {d.dwellHours}h
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
