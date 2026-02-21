/**
 * FLEET OVERVIEW PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Fuel, Wrench, AlertTriangle, CheckCircle,
  Clock, Calendar, User, Search, Plus, Eye, Navigation, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FleetOverview() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const summaryQuery = (trpc as any).fleet.getSummary.useQuery();
  const vehiclesQuery = (trpc as any).fleet.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    search: searchTerm || undefined,
  });
  const maintenanceQuery = (trpc as any).fleet.getMaintenanceSchedule.useQuery({});
  const fuelQuery = (trpc as any).fleet.getFuelData.useQuery({});

  const isLoading = summaryQuery.isLoading || vehiclesQuery.isLoading;

  if (summaryQuery.error || vehiclesQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading fleet data</p>
        <p className="text-sm text-slate-500 mt-2">
          {summaryQuery.error?.message || vehiclesQuery.error?.message}
        </p>
        <Button className="mt-4" onClick={() => { summaryQuery.refetch(); vehiclesQuery.refetch(); }}>
          Retry
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "idle": return "bg-blue-500/20 text-blue-400";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400";
      case "out_of_service": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Fleet Overview</h1>
          <p className="text-slate-400 text-sm">Manage vehicles, maintenance, and compliance</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-white">{(summaryQuery.data as any)?.totalVehicles ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-green-400">{(summaryQuery.data as any)?.active ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-yellow-400">{(summaryQuery.data as any)?.inMaintenance ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">In Maintenance</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-red-400">{(summaryQuery.data as any)?.outOfService ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Out of Service</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-purple-400">{(summaryQuery.data as any)?.utilization ?? 0}%</p>
            )}
            <p className="text-xs text-slate-400">Utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Summary */}
      <Card className="bg-white/[0.02] border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Fuel className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-medium">Fuel Cost MTD</p>
                <p className="text-xs text-slate-500">Month to date</p>
              </div>
            </div>
            {fuelQuery.isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-orange-400">
                ${(fuelQuery.data as any)?.totalCost?.toLocaleString() ?? 0}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-blue-600">Vehicles</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-600">Maintenance</TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-blue-600">Fleet Map</TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Search vehicles..."
                className="pl-9 bg-white/[0.04] border-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-white/[0.04] border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 bg-white/[0.04] border-slate-600">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="truck">Trucks</SelectItem>
                <SelectItem value="tanker">Tankers</SelectItem>
                <SelectItem value="trailer">Trailers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vehiclesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i: any) => (
                <Card key={i} className="bg-white/[0.02] border-slate-700">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (vehiclesQuery.data as any)?.vehicles?.length === 0 ? (
            <Card className="bg-white/[0.02] border-slate-700">
              <CardContent className="p-12 text-center">
                <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No vehicles found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(vehiclesQuery.data as any)?.vehicles?.map((vehicle: any) => (
                <Card key={vehicle.id} className="bg-white/[0.02] border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          vehicle.status === "active" ? "bg-green-500/20" :
                          vehicle.status === "maintenance" ? "bg-yellow-500/20" :
                          "bg-red-500/20"
                        )}>
                          <Truck className={cn(
                            "w-6 h-6",
                            vehicle.status === "active" ? "text-green-400" :
                            vehicle.status === "maintenance" ? "text-yellow-400" :
                            "text-red-400"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold">{vehicle.unitNumber}</p>
                            <Badge className={getStatusColor(vehicle.status)}>
                              {vehicle.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          {vehicle.currentLocation && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {vehicle.currentLocation.city}, {vehicle.currentLocation.state}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {vehicle.fuelLevel !== undefined && (
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <Fuel className="w-4 h-4 text-orange-400" />
                              <span className={cn(
                                "font-medium",
                                vehicle.fuelLevel < 25 ? "text-red-400" :
                                vehicle.fuelLevel < 50 ? "text-yellow-400" :
                                "text-green-400"
                              )}>
                                {vehicle.fuelLevel}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Fuel</p>
                          </div>
                        )}

                        {vehicle.odometer && (
                          <div className="text-center">
                            <p className="text-white font-medium">{(vehicle.odometer / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-slate-500">Miles</p>
                          </div>
                        )}

                        {vehicle.currentDriver && (
                          <div className="text-center">
                            <p className="text-white font-medium">{vehicle.currentDriver.name}</p>
                            <p className="text-xs text-slate-500">Driver</p>
                          </div>
                        )}

                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-yellow-400" />
                Scheduled Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i: any) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (maintenanceQuery.data as any)?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No scheduled maintenance</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(maintenanceQuery.data as any)?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          item.status === "overdue" ? "bg-red-500/20" :
                          item.status === "in_progress" ? "bg-blue-500/20" :
                          "bg-yellow-500/20"
                        )}>
                          <Wrench className={cn(
                            "w-4 h-4",
                            item.status === "overdue" ? "text-red-400" :
                            item.status === "in_progress" ? "text-blue-400" :
                            "text-yellow-400"
                          )} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.unitNumber}</p>
                          <p className="text-sm text-slate-400">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{item.scheduledDate}</p>
                        <Badge className={cn(
                          item.status === "overdue" ? "bg-red-500/20 text-red-400" :
                          item.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                Fleet Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-slate-700/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Interactive fleet map</p>
                  <p className="text-sm text-slate-500">Real-time vehicle locations</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-400">Active ({(summaryQuery.data as any)?.active ?? 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-slate-400">Maintenance ({(summaryQuery.data as any)?.inMaintenance ?? 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-400">Out of Service ({(summaryQuery.data as any)?.outOfService ?? 0})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
