/**
 * BROKER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, DollarSign, TrendingUp, Users, Truck,
  Clock, CheckCircle, AlertTriangle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerDashboard() {
  const statsQuery = (trpc as any).brokers.getDashboardStats.useQuery();
  const shipperLoadsQuery = (trpc as any).brokers.getShipperLoads.useQuery({ limit: 5 });
  const inProgressQuery = (trpc as any).brokers.getLoadsInProgress.useQuery({ limit: 5 });
  const capacityQuery = (trpc as any).brokers.getCarrierCapacity.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Broker Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Match shippers with carriers</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Match
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Package className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.activeLoads || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pendingMatches || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><TrendingUp className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.weeklyVolume || 0}</p>}<p className="text-xs text-slate-400">Weekly</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.commissionEarned?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Commission</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-emerald-400">{stats?.marginAverage}%</p>}<p className="text-xs text-slate-400">Avg Margin</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" />Shipper Loads</CardTitle></CardHeader>
          <CardContent className="p-0">
            {shipperLoadsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : (shipperLoadsQuery.data as any)?.length === 0 ? (
              <div className="p-6 text-center"><Package className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No loads available</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(shipperLoadsQuery.data as any)?.map((load: any) => (
                  <div key={load.id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm">#{load.loadNumber}</p>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">${load.rate}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{load.origin} → {load.destination}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-green-400" />Carrier Capacity</CardTitle></CardHeader>
          <CardContent className="p-0">
            {capacityQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : (capacityQuery.data as any)?.length === 0 ? (
              <div className="p-6 text-center"><Truck className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No capacity available</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(capacityQuery.data as any)?.map((carrier: any) => (
                  <div key={carrier.id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm">{carrier.name}</p>
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">{carrier.availableTrucks} trucks</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{carrier.location} | {carrier.equipment}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />In Progress</CardTitle></CardHeader>
          <CardContent className="p-0">
            {inProgressQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : (inProgressQuery.data as any)?.length === 0 ? (
              <div className="p-6 text-center"><CheckCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No loads in progress</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(inProgressQuery.data as any)?.map((load: any) => (
                  <div key={load.id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm">#{load.loadNumber}</p>
                      <Badge className={cn("border-0 text-xs", load.status === "in_transit" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400")}>{load.status?.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{load.shipper} → {load.carrier}</p>
                    <p className="text-xs text-green-400">Commission: ${load.commission}</p>
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
