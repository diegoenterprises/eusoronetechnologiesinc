/**
 * ACTIVE LOADS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Clock, Truck, RefreshCw, Search, Eye, Phone, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export default function ActiveLoadsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({
    status: "in_transit",
    limit: 100,
  });

  const activeCount = loads?.filter((l: any) => l.status === "in_transit").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_transit": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Transit</Badge>;
      case "picked_up": return <Badge className="bg-green-500/20 text-green-400 border-0">Picked Up</Badge>;
      case "delayed": return <Badge className="bg-red-500/20 text-red-400 border-0">Delayed</Badge>;
      case "at_facility": return <Badge className="bg-purple-500/20 text-purple-400 border-0">At Facility</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredLoads = loads?.filter((load: any) => {
    const matchesSearch = !searchQuery || 
      load.loadNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.origin?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.destination?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || load.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Active Loads
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time tracking of in-transit shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Active Shipments</span>
            <span className="text-green-400 font-bold">{activeCount}</span>
          </div>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by load number, origin, or destination..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="at_facility">At Facility</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : filteredLoads?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No active loads</p>
              <p className="text-slate-500 text-sm mt-1">All your shipments have been delivered</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads?.map((load: any) => (
                <div key={load.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Truck className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-white font-bold">{load.loadNumber || `#LOAD-${load.id?.slice(0, 6)}`}</p>
                          {getStatusBadge(load.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-green-400" />
                            {load.origin?.city || "N/A"}, {load.origin?.state || ""}
                          </span>
                          <span className="text-slate-600">→</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            {load.destination?.city || "N/A"}, {load.destination?.state || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{load.equipmentType || "Flatbed"}</span>
                          <span>{load.weight?.toLocaleString() || 0} lbs</span>
                          <span>{load.distance || 0} miles</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Navigation className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/loads/${load.id}`)}>
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
