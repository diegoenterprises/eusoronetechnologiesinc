/**
 * BROKER CARRIER CAPACITY PAGE
 * 100% Dynamic - View available carrier capacity
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
  Truck, Search, MapPin, Star, Clock, CheckCircle,
  Phone, Calendar, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerCarrierCapacity() {
  const [search, setSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  const capacityQuery = (trpc as any).brokers.getCarrierCapacity.useQuery({ 
    equipment: equipmentFilter !== "all" ? equipmentFilter : undefined
  });
  const statsQuery = (trpc as any).brokers.getCapacityStats.useQuery();

  const carriers = capacityQuery.data || [];
  const stats = statsQuery.data;

  const filteredCarriers = carriers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mcNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Carrier Capacity
        </h1>
        <p className="text-slate-400 text-sm mt-1">Available trucks and equipment</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Available Now</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.available || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Next 24h</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.booked || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Preferred</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.verified || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Hazmat Cert</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.totalCapacity || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search carriers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={locationFilter}
                onChange={(e: any) => setLocationFilter(e.target.value)}
                placeholder="City, State"
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
                <SelectItem value="flatbed">Flatbed</SelectItem>
                <SelectItem value="van">Dry Van</SelectItem>
                <SelectItem value="reefer">Reefer</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Carrier List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {capacityQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredCarriers.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No capacity available</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCarriers.map((carrier: any) => (
                <div key={carrier.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{carrier.name}</p>
                          {carrier.preferred && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Preferred</Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">MC# {carrier.mcNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-bold">{carrier.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Available</p>
                        <p className="text-green-400 font-bold">{carrier.availableTrucks}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Equipment</p>
                        <p className="text-white">{carrier.equipment}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Location</p>
                        <p className="text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{carrier.location}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 rounded-lg">
                        <Phone className="w-4 h-4 mr-1" />Contact
                      </Button>
                    </div>
                  </div>

                  {carrier.lanes && carrier.lanes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-2">Preferred Lanes:</p>
                      <div className="flex flex-wrap gap-2">
                        {carrier.lanes.slice(0, 4).map((lane: any, idx: number) => (
                          <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {lane.origin} → {lane.destination}
                          </Badge>
                        ))}
                      </div>
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
