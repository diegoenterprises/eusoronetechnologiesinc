/**
 * OUTGOING SHIPMENTS PAGE - TERMINAL MANAGER
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
  Package, Search, Clock, CheckCircle, MapPin,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OutgoingShipments() {
  const [search, setSearch] = useState("");

  const shipmentsQuery = (trpc as any).terminals.getOutgoingShipments.useQuery({ search });
  const statsQuery = (trpc as any).terminals.getOutgoingStats.useQuery();

  const dispatchMutation = (trpc as any).terminals.dispatchShipment.useMutation({
    onSuccess: () => { toast.success("Shipment dispatched"); shipmentsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "dispatched": return <Badge className="bg-green-500/20 text-green-400 border-0"><Truck className="w-3 h-3 mr-1" />Dispatched</Badge>;
      case "loading": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Package className="w-3 h-3 mr-1" />Loading</Badge>;
      case "ready": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Outgoing Shipments</h1>
          <p className="text-slate-400 text-sm mt-1">Departing freight from your terminal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Package className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Scheduled</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><CheckCircle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.ready || 0}</p>}<p className="text-xs text-slate-400">Ready</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Package className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.loading || 0}</p>}<p className="text-xs text-slate-400">Loading</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Truck className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.dispatched || 0}</p>}<p className="text-xs text-slate-400">Dispatched</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search shipments..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" />Outgoing</CardTitle></CardHeader>
        <CardContent className="p-0">
          {shipmentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : !shipmentsQuery.data || (Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length === 0) ? (
            <div className="text-center py-16"><Package className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No outgoing shipments</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(Array.isArray(shipmentsQuery.data) ? shipmentsQuery.data : []).map((shipment: any) => (
                <div key={shipment.id} className={cn("p-4", shipment.status === "ready" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">#{shipment.shipmentNumber}</p>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <p className="text-sm text-slate-400">{shipment.commodity} - {shipment.weight} lbs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold">Depart: {shipment.departureTime}</p>
                      <p className="text-xs text-slate-500">Dock: {shipment.dock}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Destination</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{shipment.destination}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Catalyst</p>
                      <p className="text-white text-sm">{shipment.catalyst}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Driver</p>
                      <p className="text-white text-sm">{shipment.driver}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Trailer</p>
                      <p className="text-white text-sm">{shipment.trailerNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span>BOL: {shipment.bolNumber}</span>
                    </div>
                    {shipment.status === "ready" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => dispatchMutation.mutate({ shipmentId: shipment.id })}>
                        <Truck className="w-4 h-4 mr-1" />Dispatch
                      </Button>
                    )}
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
