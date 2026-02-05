/**
 * DISPATCH BOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Clock, User, AlertTriangle,
  CheckCircle, Navigation, RefreshCw, Package,
  Beaker, Droplets, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DispatchBoard() {
  const [filter, setFilter] = useState("all");

  const boardQuery = (trpc as any).dispatch.getBoard.useQuery({ status: filter === 'all' ? undefined : filter as any }, { refetchInterval: 30000 });
  const driversQuery = (trpc as any).dispatch.getAvailableDrivers.useQuery({});

  const assignMutation = (trpc as any).dispatch.assignDriver.useMutation({
    onSuccess: () => { toast.success("Driver assigned"); boardQuery.refetch(); driversQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = (boardQuery.data as any)?.summary;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unassigned": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Unassigned</Badge>;
      case "assigned": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><User className="w-3 h-3 mr-1" />Assigned</Badge>;
      case "en_route": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Navigation className="w-3 h-3 mr-1" />En Route</Badge>;
      case "loading": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><Package className="w-3 h-3 mr-1" />Loading</Badge>;
      case "in_transit": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Truck className="w-3 h-3 mr-1" />In Transit</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Dispatch Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage load assignments and tracking</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => boardQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>
                {boardQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.unassigned || 0}</p>}
                <p className="text-xs text-slate-400">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Navigation className="w-6 h-6 text-yellow-400" /></div>
              <div>
                {boardQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.inTransit || 0}</p>}
                <p className="text-xs text-slate-400">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Package className="w-6 h-6 text-purple-400" /></div>
              <div>
                {boardQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.assigned || 0}</p>}
                <p className="text-xs text-slate-400">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-6 h-6 text-cyan-400" /></div>
              <div>
                {boardQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.delivered || 0}</p>}
                <p className="text-xs text-slate-400">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><User className="w-6 h-6 text-green-400" /></div>
              <div>
                {boardQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.total || 0}</p>}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Loads</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          <SelectItem value="en_route">En Route</SelectItem>
          <SelectItem value="in_transit">In Transit</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-cyan-400" />Active Loads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {boardQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : (boardQuery.data as any)?.loads?.length === 0 ? (
            <div className="text-center py-16"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No active loads</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(boardQuery.data as any)?.loads?.map((load: any) => (
                <div key={load.id} className={cn("p-4", load.status === "unassigned" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 text-sm">#{load.loadNumber}</span>
                        <p className="text-white font-bold">{load.shipper}</p>
                        {getStatusBadge(load.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-400">{load.commodity} - {load.weight} lbs</p>
                        {load.hazmatClass && (
                          <Badge className="bg-red-500/20 text-red-400 border-0">
                            <Flame className="w-3 h-3 mr-1" />HazMat {load.hazmatClass}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {load.status === "unassigned" && ((driversQuery.data as any)?.length ?? 0) > 0 && (
                      <Select onValueChange={(driverId) => assignMutation.mutate({ loadId: load.id, driverId })}>
                        <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600/50 rounded-lg"><User className="w-4 h-4 mr-2" /><SelectValue placeholder="Assign Driver" /></SelectTrigger>
                        <SelectContent>{(driversQuery.data as any)?.map((driver: any) => (<SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>))}</SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-4 h-4 text-green-400" /><span>{load.origin}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-4 h-4 text-red-400" /><span>{load.destination}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" /><span>Pickup: {load.pickupTime}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" /><span>Delivery: {load.deliveryTime}</span></div>
                  </div>
                  {load.driver && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-sm">{load.driver.name?.charAt(0)}</div>
                      <div><p className="text-white text-sm font-medium">{load.driver.name}</p><p className="text-xs text-slate-500">{load.driver.truck} | {load.driver.phone}</p></div>
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
