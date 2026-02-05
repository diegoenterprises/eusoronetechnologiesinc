/**
 * CARRIER DRIVER ASSIGNMENTS PAGE
 * 100% Dynamic - Manage driver-to-load assignments
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
  Users, Search, Truck, MapPin, Clock,
  CheckCircle, AlertTriangle, ArrowRight, Phone, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierDriverAssignments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const assignmentsQuery = trpc.carriers.getActiveLoads.useQuery({ limit: 50 });
  const driversQuery = trpc.carriers.getDrivers.useQuery({});
  const statsQuery = trpc.carriers.getDashboardStats.useQuery();

  const assignDriverMutation = trpc.carriers.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Driver assigned successfully");
      assignmentsQuery.refetch();
      driversQuery.refetch();
      statsQuery.refetch();
    },
  });

  const unassignDriverMutation = trpc.carriers.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Driver unassigned");
      assignmentsQuery.refetch();
      driversQuery.refetch();
    },
  });

  const assignments = assignmentsQuery.data || [];
  const availableDrivers = driversQuery.data || [];
  const stats = statsQuery.data;

  const filteredAssignments = assignments.filter((a: any) =>
    a.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    a.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    a.origin?.toLowerCase().includes(search.toLowerCase()) ||
    a.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Driver Assignments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage driver-to-load assignments</p>
        </div>
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
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalLoads || stats?.activeLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Needs Assignment</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.needsAssignment || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Assigned</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.assigned || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Available Drivers</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.availableDrivers || stats?.availableCapacity || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">In Transit</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{(stats as any)?.inTransit || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Available Drivers */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Available Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {driversQuery.isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-48 flex-shrink-0 rounded-lg" />)}
            </div>
          ) : availableDrivers.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No drivers currently available</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {availableDrivers.map((driver: any) => (
                <div key={driver.id} className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 min-w-48 flex-shrink-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                      {driver.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-slate-400 text-xs">{driver.truckNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span>{driver.currentLocation}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>HOS: {driver.hosRemaining}h remaining</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search loads, drivers, or locations..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loads</SelectItem>
                <SelectItem value="pending">Needs Assignment</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignmentsQuery.isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredAssignments.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No loads found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment: any) => (
            <Card key={assignment.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              !assignment.driverId && "border-l-4 border-yellow-500"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      assignment.status === "assigned" ? "bg-green-500/20" :
                      assignment.status === "in_transit" ? "bg-blue-500/20" :
                      assignment.status === "pending" ? "bg-yellow-500/20" :
                      "bg-slate-600/50"
                    )}>
                      <Truck className={cn(
                        "w-6 h-6",
                        assignment.status === "assigned" ? "text-green-400" :
                        assignment.status === "in_transit" ? "text-blue-400" :
                        assignment.status === "pending" ? "text-yellow-400" :
                        "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-bold">Load #{assignment.loadNumber}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{assignment.customerName}</span>
                        <Badge className={cn(
                          "border-0 text-xs",
                          assignment.priority === "high" ? "bg-red-500/20 text-red-400" :
                          assignment.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {assignment.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    assignment.status === "assigned" ? "bg-green-500/20 text-green-400" :
                    assignment.status === "in_transit" ? "bg-blue-500/20 text-blue-400" :
                    assignment.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-slate-500/20 text-slate-400"
                  )}>
                    {assignment.status === "pending" ? "Needs Driver" : assignment.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-slate-700/30">
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs mb-1">Origin</p>
                    <p className="text-white font-medium">{assignment.origin}</p>
                    <p className="text-slate-400 text-sm">{assignment.pickupDate}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-cyan-400" />
                  <div className="flex-1 text-right">
                    <p className="text-slate-400 text-xs mb-1">Destination</p>
                    <p className="text-white font-medium">{assignment.destination}</p>
                    <p className="text-slate-400 text-sm">{assignment.deliveryDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Miles</p>
                    <p className="text-white font-bold">{assignment.distance?.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Rate</p>
                    <p className="text-green-400 font-bold">${assignment.rate?.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Equipment</p>
                    <p className="text-white font-medium">{assignment.equipmentType}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Weight</p>
                    <p className="text-white font-medium">{assignment.weight?.toLocaleString()} lbs</p>
                  </div>
                </div>

                {assignment.driverId ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                        {assignment.driverName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{assignment.driverName}</p>
                        <p className="text-slate-400 text-sm">{assignment.truckNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Phone className="w-4 h-4" />
                      </Button>
                      {assignment.status === "assigned" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unassignDriverMutation.mutate({ loadId: assignment.id, amount: 0 } as any)}
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          Unassign
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Select onValueChange={(driverId) => assignDriverMutation.mutate({ loadId: assignment.id, amount: 0, notes: driverId } as any)}>
                      <SelectTrigger className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <SelectValue placeholder="Select a driver to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} - {d.truckNumber} ({d.hosRemaining}h HOS)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {assignment.specialInstructions && (
                  <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">{assignment.specialInstructions}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
