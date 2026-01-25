/**
 * INCOMING SHIPMENTS PAGE - TERMINAL MANAGER
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
  Truck, Search, Clock, CheckCircle, MapPin,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IncomingShipments() {
  const [search, setSearch] = useState("");

  const shipmentsQuery = trpc.terminal.getIncomingShipments.useQuery({ search });
  const statsQuery = trpc.terminal.getIncomingStats.useQuery();

  const checkInMutation = trpc.terminal.checkInShipment.useMutation({
    onSuccess: () => { toast.success("Shipment checked in"); shipmentsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "arrived": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Arrived</Badge>;
      case "en_route": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Truck className="w-3 h-3 mr-1" />En Route</Badge>;
      case "delayed": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Delayed</Badge>;
      case "scheduled": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Incoming Shipments</h1>
          <p className="text-slate-400 text-sm mt-1">Arriving freight at your terminal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Expected</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.arrived || 0}</p>}<p className="text-xs text-slate-400">Arrived</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.enRoute || 0}</p>}<p className="text-xs text-slate-400">En Route</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.delayed || 0}</p>}<p className="text-xs text-slate-400">Delayed</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shipments..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-cyan-400" />Incoming</CardTitle></CardHeader>
        <CardContent className="p-0">
          {shipmentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : !shipmentsQuery.data || (Array.isArray(shipmentsQuery.data) && shipmentsQuery.data.length === 0) ? (
            <div className="text-center py-16"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No incoming shipments</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(shipmentsQuery.data) ? shipmentsQuery.data : []).map((shipment: any) => (
                <div key={shipment.id} className={cn("p-4", shipment.status === "delayed" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">#{shipment.shipmentNumber}</p>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <p className="text-sm text-slate-400">{shipment.commodity} - {shipment.weight} lbs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold">ETA: {shipment.eta}</p>
                      <p className="text-xs text-slate-500">Dock: {shipment.assignedDock || "TBD"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Origin</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{shipment.origin}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Carrier</p>
                      <p className="text-white text-sm">{shipment.carrier}</p>
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
                      <span>PO: {shipment.poNumber}</span>
                    </div>
                    {shipment.status === "arrived" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => checkInMutation.mutate({ shipmentId: shipment.id })}>
                        <CheckCircle className="w-4 h-4 mr-1" />Check In
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
