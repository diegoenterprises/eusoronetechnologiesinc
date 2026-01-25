/**
 * EQUIPMENT TRACKING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  Truck, Search, MapPin, CheckCircle, Wrench,
  AlertTriangle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EquipmentTracking() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const equipmentQuery = trpc.fleet.getEquipment.useQuery({ search, type });
  const statsQuery = trpc.fleet.getEquipmentStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case "in_use": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">In Use</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
      case "out_of_service": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Out of Service</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Equipment Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Track trailers and equipment</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Equipment
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.available || 0}</p>}<p className="text-xs text-slate-400">Available</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Truck className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.inUse || 0}</p>}<p className="text-xs text-slate-400">In Use</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Wrench className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.maintenance || 0}</p>}<p className="text-xs text-slate-400">Maintenance</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="trailer">Trailer</SelectItem>
            <SelectItem value="tanker">Tanker</SelectItem>
            <SelectItem value="flatbed">Flatbed</SelectItem>
            <SelectItem value="reefer">Reefer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-cyan-400" />Equipment</CardTitle></CardHeader>
        <CardContent className="p-0">
          {equipmentQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : equipmentQuery.data?.length === 0 ? (
            <div className="text-center py-16"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No equipment found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {equipmentQuery.data?.map((eq: any) => (
                <div key={eq.id} className={cn("p-4 flex items-center justify-between", eq.status === "out_of_service" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", eq.status === "available" ? "bg-green-500/20" : eq.status === "in_use" ? "bg-cyan-500/20" : eq.status === "maintenance" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <Truck className={cn("w-5 h-5", eq.status === "available" ? "text-green-400" : eq.status === "in_use" ? "text-cyan-400" : eq.status === "maintenance" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{eq.unitNumber}</p>
                        {getStatusBadge(eq.status)}
                        <Badge className="bg-slate-500/20 text-slate-400 border-0">{eq.type}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{eq.year} {eq.make} {eq.model}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>VIN: {eq.vin}</span>
                        {eq.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{eq.location}</span>}
                        {eq.assignedTo && <span>Assigned: {eq.assignedTo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Last Inspection</p>
                    <p className="text-white font-medium">{eq.lastInspection || "N/A"}</p>
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
