/**
 * FLEET PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Search, Plus, Eye, MapPin, CheckCircle,
  Wrench, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Fleet() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const fleetQuery = (trpc as any).fleet.list.useQuery({ limit: 50 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Maintenance</Badge>;
      case "inactive": return <Badge className="bg-red-500/20 text-red-400 border-0">Inactive</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredVehicles = (fleetQuery.data as any)?.vehicles?.filter((vehicle: any) => {
    return !searchTerm || 
      vehicle.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalVehicles = (fleetQuery.data as any)?.vehicles?.length || 0;
  const activeVehicles = (fleetQuery.data as any)?.vehicles?.filter((v: any) => v.status === "active").length || 0;
  const maintenanceVehicles = (fleetQuery.data as any)?.vehicles?.filter((v: any) => v.status === "maintenance").length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Fleet
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your vehicles and equipment</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/fleet/add")}>
          <Plus className="w-4 h-4 mr-2" />Add Vehicle
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {fleetQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{totalVehicles}</p>
                )}
                <p className="text-xs text-slate-400">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {fleetQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{activeVehicles}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Wrench className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {fleetQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{maintenanceVehicles}</p>
                )}
                <p className="text-xs text-slate-400">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {fleetQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{(fleetQuery.data as any)?.vehicles?.filter((v: any) => v.status === "inactive").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search vehicles..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Vehicles List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {fleetQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredVehicles?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No vehicles found</p>
              <p className="text-slate-500 text-sm mt-1">Add your first vehicle to get started</p>
              <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/fleet/add")}>
                <Plus className="w-4 h-4 mr-2" />Add Vehicle
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredVehicles?.map((vehicle: any) => (
                <div key={vehicle.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", vehicle.status === "active" ? "bg-green-500/20" : vehicle.status === "maintenance" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                        <Truck className={cn("w-6 h-6", vehicle.status === "active" ? "text-green-400" : vehicle.status === "maintenance" ? "text-yellow-400" : "text-red-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{vehicle.unitNumber}</p>
                          {getStatusBadge(vehicle.status)}
                        </div>
                        <p className="text-sm text-slate-400">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                        <p className="text-xs text-slate-500">VIN: {vehicle.vin}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {vehicle.currentLocation && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {vehicle.currentLocation.city}, {vehicle.currentLocation.state}
                        </span>
                      )}
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/fleet/${vehicle.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />View
                      </Button>
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
