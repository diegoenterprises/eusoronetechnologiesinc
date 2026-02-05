/**
 * DISPATCH DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Users, Package, AlertTriangle, Clock,
  MapPin, ArrowRight, Phone, CheckCircle, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function DispatchDashboard() {
  const [, setLocation] = useLocation();

  const summaryQuery = (trpc as any).dispatch.getSummary.useQuery();
  const driversQuery = (trpc as any).dispatch.getDrivers.useQuery();
  const loadsQuery = (trpc as any).dispatch.getLoads.useQuery({ status: "unassigned" });
  const alertsQuery = (trpc as any).dispatch.getAlerts.useQuery();

  const assignMutation = (trpc as any).dispatch.assignDriver.useMutation({
    onSuccess: () => { toast.success("Driver assigned"); loadsQuery.refetch(); driversQuery.refetch(); },
    onError: (error: any) => toast.error("Assignment failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Dispatch Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage drivers and load assignments</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.availableDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.unassignedLoads || 0}</p>
                )}
                <p className="text-xs text-slate-400">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.inTransit || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summary?.issues || 0}</p>
                )}
                <p className="text-xs text-slate-400">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Drivers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Available Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {driversQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (driversQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No available drivers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(driversQuery.data as any)?.filter((d: any) => d.status === "available").slice(0, 5).map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/20">
                        <Users className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <p className="text-xs text-slate-500">{driver.truckNumber} • HOS: {driver.hosRemaining}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-0">Available</Badge>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unassigned Loads */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Unassigned Loads</CardTitle>
          </CardHeader>
          <CardContent>
            {loadsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (loadsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-slate-400">All loads assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(loadsQuery.data as any)?.slice(0, 5).map((load: any) => (
                  <div key={load.id} className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber}</p>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Unassigned</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span>{load.origin?.city}</span>
                      <ArrowRight className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{load.destination?.city}</span>
                    </div>
                    <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/dispatch/assign/${load.id}`)}>
                      Assign Driver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
