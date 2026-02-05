/**
 * FIND LOADS PAGE
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
  Search, MapPin, Package, DollarSign, Truck, Filter,
  ArrowRight, Eye, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function FindLoads() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("all");

  const loadsQuery = (trpc as any).loads.list.useQuery({ status: "posted", limit: 50 });

  const filteredLoads = (loadsQuery.data as any)?.filter((load: any) => {
    const matchesSearch = !searchTerm || 
      load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEquipment = equipmentFilter === "all" || load.equipmentType === equipmentFilter;
    return matchesSearch && matchesEquipment;
  });

  const totalLoads = (loadsQuery.data as any)?.length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Find Loads
          </h1>
          <p className="text-slate-400 text-sm mt-1">Browse available loads matching your equipment</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <Package className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Available</span>
          <span className="text-blue-400 font-bold">{totalLoads}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search by origin or destination..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
          />
        </div>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            <SelectItem value="dry_van">Dry Van</SelectItem>
            <SelectItem value="flatbed">Flatbed</SelectItem>
            <SelectItem value="reefer">Reefer</SelectItem>
            <SelectItem value="tanker">Tanker</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Filter className="w-4 h-4 mr-2" />More Filters
        </Button>
      </div>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : filteredLoads?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No loads available</p>
              <p className="text-slate-500 text-sm mt-1">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads?.map((load: any) => (
                <div key={load.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Package className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-white font-bold">{load.loadNumber || `#${load.id?.slice(0, 6)}`}</p>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Posted</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-green-400" />
                            {load.origin?.city || "N/A"}, {load.origin?.state || ""}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            {load.destination?.city || "N/A"}, {load.destination?.state || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{load.equipmentType || "Flatbed"}</span>
                          <span>{load.weight?.toLocaleString() || 0} lbs</span>
                          <span>{load.distance || 0} miles</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{load.pickupDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-xl">${(load.rate || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">${((load.rate || 0) / Math.max(load.distance || 1, 1)).toFixed(2)}/mi</p>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation(`/loads/${load.id}`)}>
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
