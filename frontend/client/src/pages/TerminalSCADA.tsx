/**
 * TERMINAL SCADA DASHBOARD
 * Real-time terminal operations and SCADA monitoring
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Gauge, Fuel, Thermometer, Droplets, AlertTriangle, CheckCircle,
  Play, Square, Clock, Truck, RefreshCw, Activity, BarChart3,
  Bell, Settings, Eye, ArrowUp, ArrowDown, Zap, Calendar,
  Beaker, Target, FileText, FlaskConical
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";

interface Rack {
  id: string;
  number: string;
  status: "available" | "loading" | "maintenance" | "offline" | "reserved";
  product: string | null;
  currentLoad?: {
    loadNumber: string;
    carrier: string;
    driver?: string;
    gallonsLoaded: number;
    targetGallons: number;
    progress: number;
    startTime?: string;
    estimatedCompletion?: string;
  } | null;
  flowRate?: number;
  temperature?: number;
  pressure?: number;
  reservation?: {
    loadNumber: string;
    carrier: string;
    scheduledTime: string;
  };
  maintenanceNote?: string;
}

interface Tank {
  id: string;
  name: string;
  product: string;
  capacity: number;
  level: number;
  percent: number;
  temperature?: number;
  status: string;
  lowLevelAlert?: boolean;
}

interface Alarm {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  source: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export default function TerminalSCADA() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTerminal] = useState("term_001");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // tRPC queries
  const { data: overviewData, refetch: refetchOverview } = (trpc as any).scada.getTerminalOverview.useQuery(
    { terminalId: selectedTerminal },
    { refetchInterval: autoRefresh ? 10000 : false }
  );
  const { data: racksData, refetch: refetchRacks } = (trpc as any).scada.getRackStatus.useQuery(
    { terminalId: selectedTerminal },
    { refetchInterval: autoRefresh ? 5000 : false }
  );
  const { data: tanksData } = (trpc as any).scada.getTankLevels.useQuery(
    { terminalId: selectedTerminal },
    { refetchInterval: autoRefresh ? 30000 : false }
  );
  const { data: alarmsData, refetch: refetchAlarms } = (trpc as any).scada.getAlarms.useQuery(
    { terminalId: selectedTerminal, active: true }
  );
  const { data: throughputData } = (trpc as any).scada.getDailyThroughput.useQuery({ terminalId: selectedTerminal });
  const { data: spectraMatchHistory } = (trpc as any).spectraMatch.getHistory.useQuery({ terminalId: selectedTerminal, limit: 10 });

  const acknowledgeMutation = (trpc as any).scada.acknowledgeAlarm.useMutation({
    onSuccess: () => {
      toast.success("Alarm acknowledged");
      refetchAlarms();
    },
  });

  const overview = overviewData || {
    terminalName: "Houston Distribution Terminal",
    status: "operational",
    racks: { total: 12, available: 6, loading: 4, maintenance: 1, offline: 1 },
    throughput: { today: 450000, target: 500000, percentOfTarget: 90 },
    inventory: {
      unleaded: { level: 805000, capacity: 1000000, percent: 80.5 },
      premium: { level: 175000, capacity: 250000, percent: 70 },
      diesel: { level: 620000, capacity: 750000, percent: 82.7 },
    },
  };

  const racks = (racksData?.racks || []) as Rack[];
  const tanks = ((tanksData?.tanks || []) as any[]).map((t: any) => ({
    ...t,
    level: t.currentLevel || t.level || 0,
  })) as Tank[];
  const alarms = (alarmsData?.alarms || []) as Alarm[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "loading": return "bg-blue-500";
      case "maintenance": return "bg-yellow-500";
      case "offline": return "bg-red-500";
      case "reserved": return "bg-purple-500";
      default: return "bg-slate-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "loading": return "bg-blue-500/20 text-blue-400";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400";
      case "offline": return "bg-red-500/20 text-red-400";
      case "reserved": return "bg-purple-500/20 text-purple-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "info": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getProductColor = (product: string) => {
    switch (product?.toLowerCase()) {
      case "unleaded": return "text-green-400";
      case "premium": return "text-blue-400";
      case "diesel": return "text-yellow-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{overview.terminalName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge className={cn(
              overview.status === "operational" 
                ? "bg-green-500/20 text-green-400" 
                : "bg-yellow-500/20 text-yellow-400"
            )}>
              <Activity className="w-3 h-3 mr-1" />
              {overview.status}
            </Badge>
            <span className="text-slate-500 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className={cn("border-slate-600", autoRefresh && "bg-green-500/20")}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
          </Button>
          <Button variant="outline" className="border-slate-600">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alarms.filter(a => !a.acknowledged).length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300">
                {alarms.filter(a => !a.acknowledged).length} active alarm(s) require attention
              </span>
            </div>
            <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400">
              View Alarms
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Throughput */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Today's Throughput</p>
              <Gauge className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {(overview.throughput.today / 1000).toFixed(0)}K gal
            </p>
            <Progress value={overview.throughput.percentOfTarget} className="mt-2 h-2 bg-slate-700" />
            <p className="text-xs text-slate-500 mt-1">
              {overview.throughput.percentOfTarget}% of {(overview.throughput.target / 1000).toFixed(0)}K target
            </p>
          </CardContent>
        </Card>

        {/* Rack Status */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Rack Status</p>
              <Fuel className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-green-400">{overview.racks.available}</p>
              <p className="text-slate-400 mb-1">/ {overview.racks.total} available</p>
            </div>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: overview.racks.total }).map((_: any, i: number) => {
                let status = "available";
                if (i < overview.racks.loading) status = "loading";
                else if (i < overview.racks.loading + overview.racks.maintenance) status = "maintenance";
                else if (i < overview.racks.loading + overview.racks.maintenance + overview.racks.offline) status = "offline";
                else if (i >= overview.racks.total - overview.racks.available) status = "available";
                
                return (
                  <div
                    key={i}
                    className={cn("h-3 flex-1 rounded", getStatusColor(status))}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Loads */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Active Loads</p>
              <Truck className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{overview.racks.loading}</p>
            <p className="text-xs text-slate-500 mt-1">Currently loading at racks</p>
          </CardContent>
        </Card>

        {/* Alarms */}
        <Card className={cn(
          "border",
          alarms.filter(a => !a.acknowledged).length > 0
            ? "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30"
            : "bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/30"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Active Alarms</p>
              <AlertTriangle className={cn(
                "w-5 h-5",
                alarms.filter(a => !a.acknowledged).length > 0 ? "text-yellow-400" : "text-slate-400"
              )} />
            </div>
            <p className={cn(
              "text-2xl font-bold",
              alarms.filter(a => !a.acknowledged).length > 0 ? "text-yellow-400" : "text-green-400"
            )}>
              {alarms.filter(a => !a.acknowledged).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {alarms.filter(a => !a.acknowledged).length > 0 ? "Require attention" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Rack Status</TabsTrigger>
          <TabsTrigger value="tanks" className="data-[state=active]:bg-blue-600">Tank Levels</TabsTrigger>
          <TabsTrigger value="alarms" className="data-[state=active]:bg-blue-600">Alarms</TabsTrigger>
          <TabsTrigger value="throughput" className="data-[state=active]:bg-blue-600">Throughput</TabsTrigger>
          <TabsTrigger value="spectra" className="data-[state=active]:bg-purple-600">
            <Beaker className="w-4 h-4 mr-1" />
            Oil ID
          </TabsTrigger>
        </TabsList>

        {/* Rack Status Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {racks.map((rack: any) => (
              <Card key={rack.id} className={cn(
                "bg-slate-800/50 border-slate-700 transition-all",
                rack.status === "loading" && "border-blue-500/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", getStatusColor(rack.status))} />
                      <span className="text-white font-bold">{rack.number}</span>
                    </div>
                    <Badge className={getStatusBadge(rack.status)}>
                      {rack.status}
                    </Badge>
                  </div>

                  {rack.product && (
                    <p className={cn("text-sm font-medium mb-2", getProductColor(rack.product))}>
                      {rack.product}
                    </p>
                  )}

                  {rack.status === "loading" && rack.currentLoad && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400">
                        <p className="text-white font-medium">{rack.currentLoad.loadNumber}</p>
                        <p>{rack.currentLoad.carrier}</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{rack.currentLoad.progress}%</span>
                        </div>
                        <Progress value={rack.currentLoad.progress} className="h-2 bg-slate-700" />
                        <p className="text-xs text-slate-500 mt-1">
                          {rack.currentLoad.gallonsLoaded.toLocaleString()} / {rack.currentLoad.targetGallons.toLocaleString()} gal
                        </p>
                      </div>
                      {rack.flowRate && (
                        <div className="flex items-center gap-2 text-xs">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-slate-400">{rack.flowRate} gal/min</span>
                        </div>
                      )}
                    </div>
                  )}

                  {rack.status === "reserved" && rack.reservation && (
                    <div className="text-xs text-slate-400">
                      <p className="text-white font-medium">{rack.reservation.loadNumber}</p>
                      <p>{rack.reservation.carrier}</p>
                      <p className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rack.reservation.scheduledTime).toLocaleTimeString()}
                      </p>
                    </div>
                  )}

                  {rack.status === "maintenance" && rack.maintenanceNote && (
                    <p className="text-xs text-yellow-400">{rack.maintenanceNote}</p>
                  )}

                  {rack.status === "available" && (
                    <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700">
                      <Play className="w-3 h-3 mr-1" />
                      Start Load
                    </Button>
                  )}

                  {rack.status === "loading" && (
                    <div className="space-y-2 mt-2">
                      <Button 
                        size="sm" 
                        className="w-full bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
                        onClick={() => {
                          setActiveTab("spectra");
                          toast.info(`Verify ${rack.product || "product"} on Rack ${rack.number}`);
                        }}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Verify Product
                      </Button>
                      <Button size="sm" variant="outline" className="w-full border-red-500/50 text-red-400">
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tank Levels Tab */}
        <TabsContent value="tanks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tanks.map((tank: any) => (
              <Card key={tank.id} className={cn(
                "bg-slate-800/50 border-slate-700",
                tank.lowLevelAlert && "border-yellow-500/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold">{tank.name}</span>
                    {tank.lowLevelAlert && (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>

                  <p className={cn("text-sm font-medium mb-3", getProductColor(tank.product))}>
                    {tank.product}
                  </p>

                  {/* Tank Visualization */}
                  <div className="relative h-32 bg-slate-700 rounded-lg overflow-hidden mb-3">
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 right-0 transition-all",
                        tank.percent > 75 ? "bg-green-500/50" :
                        tank.percent > 50 ? "bg-blue-500/50" :
                        tank.percent > 25 ? "bg-yellow-500/50" :
                        "bg-red-500/50"
                      )}
                      style={{ height: `${tank.percent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{tank.percent.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Level</span>
                      <span className="text-white">{(tank.level / 1000).toFixed(0)}K gal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capacity</span>
                      <span className="text-white">{(tank.capacity / 1000).toFixed(0)}K gal</span>
                    </div>
                    {tank.temperature && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          Temp
                        </span>
                        <span className="text-white">{tank.temperature}°F</span>
                      </div>
                    )}
                  </div>
                  {/* SPECTRA-MATCH Product ID */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mt-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => {
                      setActiveTab("spectra");
                      toast.info(`Identify ${tank.product} in ${tank.name}`);
                    }}
                  >
                    <Beaker className="w-3 h-3 mr-1" />
                    Verify Product ID
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Inventory Summary */}
          <Card className="mt-6 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                Total Inventory by Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(overview.inventory).map(([product, data]: [string, any]) => (
                  <div key={product} className="p-4 rounded-lg bg-slate-700/30">
                    <p className={cn("font-medium capitalize mb-2", getProductColor(product))}>
                      {product}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {(data.level / 1000).toFixed(0)}K gal
                    </p>
                    <Progress value={data.percent} className="mt-2 h-2 bg-slate-700" />
                    <p className="text-xs text-slate-500 mt-1">
                      {data.percent.toFixed(1)}% of {(data.capacity / 1000).toFixed(0)}K capacity
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alarms Tab */}
        <TabsContent value="alarms" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Active Alarms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alarms.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No active alarms</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alarms.map((alarm: any) => (
                    <div key={alarm.id} className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      getSeverityColor(alarm.severity)
                    )}>
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={cn(
                          "w-5 h-5",
                          alarm.severity === "critical" ? "text-red-400" :
                          alarm.severity === "warning" ? "text-yellow-400" :
                          "text-blue-400"
                        )} />
                        <div>
                          <p className="text-white font-medium">{alarm.message}</p>
                          <p className="text-xs text-slate-400">
                            {alarm.source} • {new Date(alarm.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alarm.acknowledged && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => acknowledgeMutation.mutate({ alarmId: alarm.id })}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Throughput Tab */}
        <TabsContent value="throughput" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Daily Throughput
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    {throughputData ? (throughputData.totalGallons / 1000).toFixed(0) : 450}K
                  </p>
                  <p className="text-sm text-slate-400">Total Gallons</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {throughputData?.transactions || 52}
                  </p>
                  <p className="text-sm text-slate-400">Transactions</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {throughputData?.avgLoadTime || 28} min
                  </p>
                  <p className="text-sm text-slate-400">Avg Load Time</p>
                </div>
              </div>

              {throughputData?.byProduct && (
                <div className="space-y-4">
                  <h4 className="text-white font-medium">By Product</h4>
                  {throughputData.byProduct.map((p: any) => (
                    <div key={p.product} className="flex items-center gap-4">
                      <span className={cn("w-24 capitalize", getProductColor(p.product))}>
                        {p.product}
                      </span>
                      <div className="flex-1">
                        <Progress value={p.percent} className="h-4 bg-slate-700" />
                      </div>
                      <span className="text-white w-24 text-right">
                        {(p.gallons / 1000).toFixed(0)}K gal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SpectraMatch / Oil ID Tab */}
        <TabsContent value="spectra" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inline SPECTRA-MATCH Widget - PRIMARY TERMINAL INTERFACE */}
            <Card className="bg-gradient-to-br from-purple-500/5 to-cyan-500/5 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-400" />
                  Product Verification
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Use run ticket values to verify product at loading rack
                </p>
              </CardHeader>
              <CardContent>
                <SpectraMatchWidget
                  compact={false}
                  showSaveButton={true}
                  onIdentify={(result) => {
                    toast.success(`[TERMINAL] Product verified: ${result.primaryMatch.name} (${result.primaryMatch.confidence}% confidence)`);
                  }}
                />
              </CardContent>
            </Card>

            {/* Active Rack Product Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-cyan-400" />
                  Active Rack Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {racks.filter((r: any) => r.status === "loading" && r.product).map((rack: any) => (
                    <div key={rack.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Fuel className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Rack {rack.number}</p>
                          <p className="text-xs text-slate-400">{rack.product} • {rack.currentLoad?.loadNumber}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
                        onClick={() => {
                          setActiveTab("spectra");
                          toast.info(`Ready to verify ${rack.product} on Rack ${rack.number}`);
                        }}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Verify
                      </Button>
                    </div>
                  ))}
                  {racks.filter((r: any) => r.status === "loading" && r.product).length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No active loading operations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <EsangIcon className="w-5 h-5 text-purple-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-purple-500/30 text-purple-400 justify-start"
                  onClick={() => window.location.href = '/spectra-match'}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Full Analysis Mode
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-cyan-500/30 text-cyan-400 justify-start"
                  onClick={() => window.location.href = '/euso-ticket'}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Run Tickets & BOL
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-green-500/30 text-green-400 justify-start"
                  onClick={() => window.location.href = '/terminal/tank-inventory'}
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  Tank Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Recent Identifications */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-cyan-400" />
                  Recent Oil Identifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {spectraMatchHistory?.identifications && spectraMatchHistory.identifications.length > 0 ? (
                  <div className="space-y-3">
                    {spectraMatchHistory.identifications.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <Beaker className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.crudeType}</p>
                            <p className="text-xs text-slate-400">
                              API: {item.apiGravity}° | BS&W: {item.bsw}% | Load: {item.loadId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500/20 text-green-400">
                            {item.confidence}% match
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Beaker className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No recent identifications</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Use SPECTRA-MATCH™ to identify crude oil origins
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Oil Identification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">
                  {spectraMatchHistory?.total || 0}
                </p>
                <p className="text-sm text-slate-400">Total IDs Today</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-400">94%</p>
                <p className="text-sm text-slate-400">Avg Confidence</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-cyan-400">WTI</p>
                <p className="text-sm text-slate-400">Most Common</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">40.2°</p>
                <p className="text-sm text-slate-400">Avg API Gravity</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
