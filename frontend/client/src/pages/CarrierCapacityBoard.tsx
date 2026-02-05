/**
 * CARRIER CAPACITY BOARD PAGE
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
  Truck, MapPin, Search, Star, Shield,
  CheckCircle, Clock, Package
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierCapacityBoard() {
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState("all");

  const carriersQuery = (trpc as any).brokers.getCarrierCapacity.useQuery({ search, equipment });
  const statsQuery = (trpc as any).brokers.getCapacityStats.useQuery();

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Carrier Capacity Board</h1>
          <p className="text-slate-400 text-sm mt-1">Available carrier capacity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Truck className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.available || 0}</p>}<p className="text-xs text-slate-400">Available</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Package className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.totalCapacity || 0}</p>}<p className="text-xs text-slate-400">Total Trucks</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Shield className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.verified || 0}</p>}<p className="text-xs text-slate-400">Verified</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Star className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.avgRating || 0}</p>}<p className="text-xs text-slate-400">Avg Rating</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search carriers or locations..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={equipment} onValueChange={setEquipment}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            <SelectItem value="tanker">Tanker</SelectItem>
            <SelectItem value="flatbed">Flatbed</SelectItem>
            <SelectItem value="dry_van">Dry Van</SelectItem>
            <SelectItem value="reefer">Reefer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-cyan-400" />Available Carriers</CardTitle></CardHeader>
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : (carriersQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No carriers found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(carriersQuery.data as any)?.map((carrier: any) => (
                <div key={carrier.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{carrier.name}</p>
                        {carrier.verified && <Badge className="bg-green-500/20 text-green-400 border-0"><Shield className="w-3 h-3 mr-1" />Verified</Badge>}
                        <div className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-current" /><span className="text-sm">{carrier.rating}</span></div>
                      </div>
                      <p className="text-sm text-slate-400">MC# {carrier.mcNumber} | DOT# {carrier.dotNumber}</p>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">Contact</Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-4 h-4" /><span>{carrier.location}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Truck className="w-4 h-4" /><span>{carrier.equipment}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Package className="w-4 h-4" /><span>{carrier.availableTrucks} trucks available</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" /><span>Available: {carrier.availableDate}</span></div>
                  </div>
                  {carrier.lanes && carrier.lanes.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Preferred lanes:</span>
                      {carrier.lanes.map((lane: string, i: number) => (
                        <Badge key={i} className="bg-slate-700/50 text-slate-300 border-0 text-xs">{lane}</Badge>
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
