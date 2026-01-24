/**
 * CAPACITY BOARD PAGE
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
  Truck, MapPin, Calendar, Search, Plus, Eye,
  Package, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function CapacityBoard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const capacityQuery = trpc.carriers.getAvailableCapacity.useQuery({ limit: 50 });
  const summaryQuery = trpc.carriers.getCapacitySummary.useQuery();

  const summary = summaryQuery.data;

  const getEquipmentBadge = (type: string) => {
    switch (type) {
      case "dry_van": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Dry Van</Badge>;
      case "flatbed": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Flatbed</Badge>;
      case "reefer": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Reefer</Badge>;
      case "tanker": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Tanker</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const filteredCapacity = capacityQuery.data?.filter((item: any) => {
    return !searchTerm || 
      item.carrierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Capacity Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Available carrier capacity for matching</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Post Capacity
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalCapacity || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Package className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.dryVan || 0}</p>
                )}
                <p className="text-xs text-slate-400">Dry Van</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Truck className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summary?.flatbed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Flatbed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Truck className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.tanker || 0}</p>
                )}
                <p className="text-xs text-slate-400">Tanker</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by carrier or location..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Capacity List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Available Capacity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {capacityQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredCapacity?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No available capacity</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCapacity?.map((item: any) => (
                <div key={item.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/20">
                        <Truck className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{item.carrierName}</p>
                          {getEquipmentBadge(item.equipmentType)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                          <MapPin className="w-3 h-3 text-green-400" />
                          <span>{item.origin?.city}, {item.origin?.state}</span>
                          <span>→</span>
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>{item.destination?.city || "Open"}, {item.destination?.state || ""}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Available: {item.availableDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Posted: {item.postedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-medium">{item.truckCount} truck{item.truckCount !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-slate-500">{item.maxWeight?.toLocaleString()} lbs max</p>
                      </div>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/carriers/${item.carrierId}`)}>
                        <Eye className="w-4 h-4 mr-1" />View
                      </Button>
                    </div>
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
