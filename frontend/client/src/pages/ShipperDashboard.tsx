/**
 * SHIPPER DASHBOARD PAGE
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
  Package, Truck, DollarSign, Clock, Plus,
  MapPin, CheckCircle, AlertTriangle, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperDashboard() {
  const statsQuery = trpc.shippers.getDashboardStats.useQuery();
  const activeLoadsQuery = trpc.shippers.getActiveLoads.useQuery({ limit: 5 });
  const attentionQuery = trpc.shippers.getLoadsRequiringAttention.useQuery();
  const recentQuery = trpc.shippers.getRecentLoads.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_transit": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Truck className="w-3 h-3 mr-1" />In Transit</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "issue": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Issue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Shipper Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your shipments</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Create Load
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
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pendingBids || 0}</p>}<p className="text-xs text-slate-400">Pending Bids</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.deliveredThisWeek || 0}</p>}<p className="text-xs text-slate-400">Delivered</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.ratePerMile}</p>}<p className="text-xs text-slate-400">Rate/Mile</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-emerald-400">{stats?.onTimeRate}%</p>}<p className="text-xs text-slate-400">On-Time</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {attentionQuery.data?.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Loads Requiring Attention</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {attentionQuery.data?.map((load: any) => (
              <div key={load.id} className="p-3 rounded-lg bg-red-500/10 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">#{load.loadNumber} - {load.issue}</p>
                  <p className="text-xs text-slate-500">{load.origin} → {load.destination}</p>
                </div>
                <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg">View</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-cyan-400" />Active Loads</CardTitle></CardHeader>
          <CardContent className="p-0">
            {activeLoadsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : activeLoadsQuery.data?.length === 0 ? (
              <div className="p-8 text-center"><Package className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No active loads</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {activeLoadsQuery.data?.map((load: any) => (
                  <div key={load.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">#{load.loadNumber}</p>
                        {getStatusBadge(load.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" /><span>{load.origin} → {load.destination}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">ETA: {load.eta}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />Recent Deliveries</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : recentQuery.data?.length === 0 ? (
              <div className="p-8 text-center"><Package className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No recent deliveries</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {recentQuery.data?.map((load: any) => (
                  <div key={load.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">#{load.loadNumber}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{load.origin} → {load.destination}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-medium">${load.rate?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{load.deliveredAt}</p>
                    </div>
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
