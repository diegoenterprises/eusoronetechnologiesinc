/**
 * CATALYST CARRIER CAPACITY PAGE
 * 100% Dynamic - Monitor and manage carrier capacity availability
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Truck, Search, MapPin, Calendar, Phone,
  Star, TrendingUp, AlertTriangle, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalystCarrierCapacity() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");

  const capacityQuery = trpc.catalysts.getMatchedLoads.useQuery({});
  const statsQuery = trpc.catalysts.getMatchStats.useQuery();
  const regionsQuery = trpc.catalysts.getMatchedLoads.useQuery({});

  const carriers = capacityQuery.data || [];
  const stats = statsQuery.data;
  const regions = regionsQuery.data || [];

  const filteredCarriers = carriers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  const getAvailabilityColor = (available: number, total: number) => {
    const percent = (available / total) * 100;
    if (percent >= 50) return "text-green-400";
    if (percent >= 25) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Carrier Capacity
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor available carrier capacity</p>
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
                  <span className="text-slate-400 text-sm">Total Carriers</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalCarriers || stats?.totalMatches || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Available Now</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.availableNow || stats?.highScore || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Available 24h</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.available24h || stats?.mediumScore || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total Trucks</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.totalTrucks || stats?.matched || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Utilization</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{(stats as any)?.utilization || stats?.acceptRate || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search carriers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Equipment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
                <SelectItem value="flatbed">Flatbed</SelectItem>
                <SelectItem value="dry_van">Dry Van</SelectItem>
                <SelectItem value="reefer">Reefer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Carrier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capacityQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)
        ) : filteredCarriers.length === 0 ? (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No carriers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCarriers.map((carrier: any) => (
            <Card key={carrier.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      carrier.availableTrucks > 0 ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      <Truck className={cn(
                        "w-6 h-6",
                        carrier.availableTrucks > 0 ? "text-green-400" : "text-red-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{carrier.name}</p>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{carrier.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{carrier.rating}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-400">Fleet Availability</span>
                      <span className={getAvailabilityColor(carrier.availableTrucks, carrier.totalTrucks)}>
                        {carrier.availableTrucks}/{carrier.totalTrucks}
                      </span>
                    </div>
                    <Progress
                      value={(carrier.availableTrucks / carrier.totalTrucks) * 100}
                      className={cn(
                        "h-2",
                        carrier.availableTrucks === 0 && "[&>div]:bg-red-500"
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {carrier.equipmentTypes?.map((type: string, idx: number) => (
                    <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">On-Time</p>
                    <p className={cn(
                      "font-bold",
                      carrier.onTimePercent >= 95 ? "text-green-400" :
                      carrier.onTimePercent >= 90 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {carrier.onTimePercent}%
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">Avg Rate</p>
                    <p className="text-white font-bold">${carrier.avgRate}/mi</p>
                  </div>
                </div>

                {carrier.nextAvailable && carrier.availableTrucks === 0 && (
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-400">Next available: {carrier.nextAvailable}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
                  >
                    <Phone className="w-4 h-4 mr-1" />Contact
                  </Button>
                  <Button
                    size="sm"
                    disabled={carrier.availableTrucks === 0}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                  >
                    Request Capacity
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
