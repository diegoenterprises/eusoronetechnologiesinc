/**
 * CARRIER DISPATCH BOARD PAGE
 * 100% Dynamic - Real-time dispatch management for carrier operations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  LayoutGrid, Search, Truck, MapPin, Clock,
  User, AlertTriangle, CheckCircle, RefreshCw, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierDispatchBoard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadsQuery = (trpc as any).carriers.getActiveLoads.useQuery({ limit: 50 });
  const driversQuery = (trpc as any).carriers.getDrivers.useQuery({});
  const statsQuery = (trpc as any).carriers.getDashboardStats.useQuery();

  const assignDriverMutation = (trpc as any).catalysts.assignDriver.useMutation({
    onSuccess: () => {
      toast.success("Driver assigned successfully");
      loadsQuery.refetch();
      driversQuery.refetch();
    },
  });

  const loads = loadsQuery.data || [];
  const drivers = driversQuery.data || [];
  const stats = statsQuery.data;

  const filteredLoads = loads.filter((l: any) =>
    l.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.origin?.toLowerCase().includes(search.toLowerCase()) ||
    l.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "assigned": return "bg-cyan-500/20 text-cyan-400";
      case "in_transit": return "bg-yellow-500/20 text-yellow-400";
      case "delivered": return "bg-purple-500/20 text-purple-400";
      case "issue": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Dispatch Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage load assignments and tracking</p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadsQuery.refetch()}
          className="bg-slate-800/50 border-slate-700/50 rounded-lg"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loadsQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalLoads || stats?.activeLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Unassigned</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.unassigned || stats?.availableCapacity || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">In Transit</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.inTransit || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Drivers Ready</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{drivers.filter((d: any) => d.status === "available").length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Issues</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.issues || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Available Drivers Strip */}
      {drivers.filter((d: any) => d.status === "available").length > 0 && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-400 text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Available Drivers ({drivers.filter((d: any) => d.status === "available").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {drivers.filter((d: any) => d.status === "available").map((driver: any) => (
                <div key={driver.id} className="flex-shrink-0 p-3 rounded-lg bg-slate-800/50 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{driver.name}</p>
                      <p className="text-slate-400 text-xs">{driver.truckNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{driver.location}</span>
                    <span className="text-green-400">{driver.hosRemaining}h HOS</span>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search loads..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="issue">Has Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch Board */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-16">
              <LayoutGrid className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No loads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads.map((load: any) => (
                <div key={load.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  load.status === "issue" && "border-l-4 border-red-500",
                  load.isUrgent && "border-l-4 border-yellow-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        load.status === "available" ? "bg-green-500/20" :
                        load.status === "in_transit" ? "bg-yellow-500/20" :
                        load.status === "issue" ? "bg-red-500/20" : "bg-cyan-500/20"
                      )}>
                        <Truck className={cn(
                          "w-6 h-6",
                          load.status === "available" ? "text-green-400" :
                          load.status === "in_transit" ? "text-yellow-400" :
                          load.status === "issue" ? "text-red-400" : "text-cyan-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{load.loadNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(load.status))}>
                            {load.status?.replace("_", " ")}
                          </Badge>
                          {load.isUrgent && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              URGENT
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-green-400" />
                          <span>{load.origin}</span>
                          <span className="text-slate-600">→</span>
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>{load.destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {load.driverName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm">{load.driverName}</p>
                            <p className="text-slate-400 text-xs">{load.truckNumber}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 ml-2">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(driverId) => assignDriverMutation.mutate({ loadId: load.id, driverId })}
                        >
                          <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                            <SelectValue placeholder="Assign Driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.filter((d: any) => d.status === "available").map((driver: any) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Pickup</p>
                        <p className="text-white">{load.pickupDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Delivery</p>
                        <p className="text-white">{load.deliveryDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Rate</p>
                        <p className="text-green-400 font-bold">${load.rate?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {load.issue && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">{load.issue}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
