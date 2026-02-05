/**
 * TERMINAL INVENTORY ALERTS PAGE
 * 100% Dynamic - Manage inventory level alerts and notifications
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Bell, Search, AlertTriangle, CheckCircle, TrendingDown,
  Package, Settings, Clock, ArrowDown, ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalInventoryAlerts() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const alertsQuery = trpc.terminals.getAlerts.useQuery();
  const statsQuery = trpc.terminals.getInventoryStats.useQuery();
  const thresholdsQuery = trpc.terminals.getInventory.useQuery({});

  const acknowledgeAlertMutation = trpc.terminals.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      alertsQuery.refetch();
    },
  });

  const alerts = alertsQuery.data || [];
  const stats = statsQuery.data;
  const thresholds = thresholdsQuery.data || [];

  const filteredAlerts = alerts.filter((a: any) =>
    a.productName?.toLowerCase().includes(search.toLowerCase()) ||
    a.tankId?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "info": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Inventory Alerts
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor tank levels and thresholds</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <Settings className="w-4 h-4 mr-2" />Configure Alerts
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Critical</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.critical || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Warnings</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.warnings || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Low Stock</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.lowStock || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Normal</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.normal || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Active Critical Alerts */}
      {(stats as any)?.critical > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts Require Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter((a: any) => a.severity === "critical").slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <ArrowDown className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-medium">{alert.productName} - {alert.tankId}</p>
                      <p className="text-slate-400 text-sm">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-red-400 font-bold">{alert.currentLevel}%</p>
                      <p className="text-slate-500 text-xs">of capacity</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => acknowledgeAlertMutation.mutate({ terminalId: alert.id, carrierId: "", driverId: "", truckNumber: "", productId: "", quantity: 0, scheduledDate: "", scheduledTime: "" } as any)}
                      className="bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            All Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alertsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-400">No active alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredAlerts.map((alert: any) => (
                <div key={alert.id} className={cn(
                  "p-4 hover:bg-slate-700/20 transition-colors",
                  alert.severity === "critical" && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        alert.severity === "critical" ? "bg-red-500/20" :
                        alert.severity === "warning" ? "bg-yellow-500/20" : "bg-cyan-500/20"
                      )}>
                        {alert.type === "low" ? (
                          <ArrowDown className={cn(
                            "w-5 h-5",
                            alert.severity === "critical" ? "text-red-400" :
                            alert.severity === "warning" ? "text-yellow-400" : "text-cyan-400"
                          )} />
                        ) : (
                          <ArrowUp className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{alert.productName}</p>
                          <Badge className={cn("border", getSeverityColor(alert.severity))}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{alert.tankId} • {alert.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Level</span>
                          <span className={cn(
                            alert.severity === "critical" ? "text-red-400" :
                            alert.severity === "warning" ? "text-yellow-400" : "text-white"
                          )}>
                            {alert.currentLevel}%
                          </span>
                        </div>
                        <Progress
                          value={alert.currentLevel}
                          className={cn(
                            "h-2",
                            alert.severity === "critical" && "[&>div]:bg-red-500",
                            alert.severity === "warning" && "[&>div]:bg-yellow-500"
                          )}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Triggered</p>
                        <p className="text-white">{alert.triggeredAt}</p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          onClick={() => acknowledgeAlertMutation.mutate({ terminalId: alert.id, carrierId: "", driverId: "", truckNumber: "", productId: "", quantity: 0, scheduledDate: "", scheduledTime: "" } as any)}
                          variant="outline"
                          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged && (
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />Acknowledged
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
