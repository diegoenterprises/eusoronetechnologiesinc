/**
 * FLEET MANAGEMENT PAGE
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
  Truck, Users, MapPin, Wrench, Fuel, AlertTriangle,
  CheckCircle, Search, Plus, Eye, Edit, Clock, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FleetManagement() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const summaryQuery = trpc.fleet.getSummary.useQuery();
  const vehiclesQuery = trpc.fleet.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchTerm || undefined,
  });
  const driversQuery = trpc.drivers.list.useQuery({ limit: 50 });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading fleet data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400";
      case "out_of_service": return "bg-red-500/20 text-red-400";
      case "idle": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "driving": return "bg-blue-500/20 text-blue-400";
      case "on_duty": return "bg-yellow-500/20 text-yellow-400";
      case "off_duty": case "sleeper": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Management</h1>
          <p className="text-slate-400 text-sm">Manage vehicles and drivers</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalVehicles || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.active || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Wrench className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.maintenance || 0}</p>
            )}
            <p className="text-xs text-slate-400">Maintenance</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.totalDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{summary?.avgMpg?.toFixed(1) || 0}</p>
            )}
            <p className="text-xs text-slate-400">Avg MPG</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-blue-600">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search vehicles..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {vehiclesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : vehiclesQuery.data?.vehicles?.length === 0 ? (
                <div className="p-12 text-center">
                  <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No vehicles found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {vehiclesQuery.data?.vehicles?.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", vehicle.status === "active" ? "bg-green-500/20" : vehicle.status === "maintenance" ? "bg-yellow-500/20" : "bg-slate-500/20")}>
                          <Truck className={cn("w-5 h-5", vehicle.status === "active" ? "text-green-400" : vehicle.status === "maintenance" ? "text-yellow-400" : "text-slate-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{vehicle.unitNumber}</p>
                          <p className="text-sm text-slate-400">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                          <p className="text-xs text-slate-500">{vehicle.vin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white">{vehicle.mileage?.toLocaleString()} mi</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{vehicle.currentLocation?.city || "Unknown"}</p>
                        </div>
                        <Badge className={getStatusColor(vehicle.status)}>{vehicle.status?.replace("_", " ")}</Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : driversQuery.data?.drivers?.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No drivers found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {driversQuery.data?.drivers?.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.firstName} {driver.lastName}</p>
                          <p className="text-sm text-slate-400">{driver.truckNumber || "Unassigned"}</p>
                          <p className="text-xs text-slate-500">{driver.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white flex items-center gap-1"><Clock className="w-3 h-3" />{driver.hoursAvailable || 0}h available</p>
                          <p className="text-xs text-slate-500">{driver.currentLocation?.city || "Unknown"}</p>
                        </div>
                        <Badge className={getDriverStatusColor(driver.status)}>{driver.status?.replace("_", " ")}</Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        </div>
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
