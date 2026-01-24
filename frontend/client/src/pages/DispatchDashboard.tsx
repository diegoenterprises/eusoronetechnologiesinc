/**
 * DISPATCH DASHBOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Package, Users, Clock, MapPin, AlertTriangle,
  CheckCircle, Eye, Phone, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function DispatchDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const summaryQuery = trpc.dispatch.getSummary.useQuery();
  const driversQuery = trpc.dispatch.getDrivers.useQuery();
  const loadsQuery = trpc.dispatch.getLoads.useQuery();
  const alertsQuery = trpc.dispatch.getAlerts.useQuery();

  const assignMutation = trpc.dispatch.assignDriver.useMutation({
    onSuccess: () => { toast.success("Driver assigned"); driversQuery.refetch(); loadsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading dispatch data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "driving": return "bg-blue-500/20 text-blue-400";
      case "on_duty": return "bg-yellow-500/20 text-yellow-400";
      case "off_duty": case "sleeper": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getLoadStatusColor = (status: string) => {
    switch (status) {
      case "in_transit": return "bg-blue-500/20 text-blue-400";
      case "assigned": return "bg-purple-500/20 text-purple-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "delivered": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dispatch Dashboard</h1>
          <p className="text-slate-400 text-sm">Manage drivers and loads</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.activeLoads || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.unassigned || 0}</p>
            )}
            <p className="text-xs text-slate-400">Unassigned</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.enRoute || 0}</p>
            )}
            <p className="text-xs text-slate-400">En Route</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.loading || 0}</p>
            )}
            <p className="text-xs text-slate-400">Loading</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.inTransit || 0}</p>
            )}
            <p className="text-xs text-slate-400">In Transit</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.issues || 0}</p>
            )}
            <p className="text-xs text-slate-400">Issues</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Drivers</TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-blue-600">Loads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Drivers */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Users className="w-5 h-5 text-green-400" />Available Drivers</CardTitle></CardHeader>
              <CardContent>
                {driversQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {driversQuery.data?.filter(d => d.status === "available").slice(0, 5).map((driver) => (
                      <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.truckNumber} | {driver.hoursAvailable}h available</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost"><Phone className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unassigned Loads */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5 text-yellow-400" />Unassigned Loads</CardTitle></CardHeader>
              <CardContent>
                {loadsQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {loadsQuery.data?.filter(l => l.status === "pending").slice(0, 5).map((load) => (
                      <div key={load.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-xs text-slate-400">{load.origin?.city} → {load.destination?.city}</p>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation(`/loads/${load.id}`)}>Assign</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">All Drivers</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  {driversQuery.data?.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", driver.status === "available" ? "bg-green-500/20" : driver.status === "driving" ? "bg-blue-500/20" : "bg-slate-500/20")}>
                          <Users className={cn("w-5 h-5", driver.status === "available" ? "text-green-400" : driver.status === "driving" ? "text-blue-400" : "text-slate-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-sm text-slate-400">{driver.truckNumber}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{driver.location?.city || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{driver.hoursAvailable}h</p>
                          <p className="text-xs text-slate-500">Available</p>
                        </div>
                        <Badge className={getStatusColor(driver.status)}>{driver.status?.replace("_", " ")}</Badge>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loads" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">All Loads</CardTitle></CardHeader>
            <CardContent>
              {loadsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  {loadsQuery.data?.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", load.status === "in_transit" ? "bg-blue-500/20" : load.status === "pending" ? "bg-yellow-500/20" : "bg-slate-500/20")}>
                          <Package className={cn("w-5 h-5", load.status === "in_transit" ? "text-blue-400" : load.status === "pending" ? "text-yellow-400" : "text-slate-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <MapPin className="w-3 h-3 text-green-400" />{load.origin?.city}
                            <ChevronRight className="w-3 h-3" />
                            <MapPin className="w-3 h-3 text-red-400" />{load.destination?.city}
                          </div>
                          {load.driverName && <p className="text-xs text-slate-500">Driver: {load.driverName}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getLoadStatusColor(load.status)}>{load.status?.replace("_", " ")}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/loads/${load.id}`)}><Eye className="w-4 h-4" /></Button>
                      </div>
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
