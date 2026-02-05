/**
 * CARRIER FLEET MANAGEMENT PAGE
 * 100% Dynamic - Manage trucks, trailers, and equipment
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
  Truck, Plus, Search, CheckCircle, AlertTriangle,
  Wrench, Calendar, Gauge, MapPin, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierFleetManagement() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fleetQuery = trpc.carriers.getAvailableCapacity.useQuery({});
  const statsQuery = trpc.carriers.getDashboardStats.useQuery();

  const fleet = fleetQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredFleet = fleet.filter((v: any) =>
    v.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.vin?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400";
      case "out_of_service": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Fleet Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage trucks and trailers</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Maintenance</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.maintenance || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">OOS</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.outOfService || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Utilization</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.utilization || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by unit # or VIN..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tractor">Tractors</SelectItem>
                <SelectItem value="tanker">Tankers</SelectItem>
                <SelectItem value="flatbed">Flatbeds</SelectItem>
                <SelectItem value="van">Dry Vans</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fleet List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {fleetQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : filteredFleet.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No vehicles found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredFleet.map((vehicle: any) => (
                <div key={vehicle.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">Unit #{vehicle.unitNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(vehicle.status))}>
                            {vehicle.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Type</p>
                        <p className="text-white">{vehicle.type}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Odometer</p>
                        <p className="text-white">{vehicle.odometer?.toLocaleString()} mi</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Next Service</p>
                        <p className={cn(
                          "font-medium",
                          vehicle.serviceDue ? "text-yellow-400" : "text-slate-300"
                        )}>
                          {vehicle.nextServiceDate || "N/A"}
                        </p>
                      </div>
                      {vehicle.currentLocation && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Location</p>
                          <p className="text-white flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{vehicle.currentLocation}
                          </p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        Details
                      </Button>
                    </div>
                  </div>

                  {vehicle.assignedDriver && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm text-slate-400">
                      <span>Assigned to: {vehicle.assignedDriver}</span>
                      {vehicle.currentLoad && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
                          Load #{vehicle.currentLoad}
                        </Badge>
                      )}
                    </div>
                  )}

                  {vehicle.alerts && vehicle.alerts.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      {vehicle.alerts.map((alert: string, idx: number) => (
                        <Badge key={idx} className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />{alert}
                        </Badge>
                      ))}
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
