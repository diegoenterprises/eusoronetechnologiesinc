/**
 * LOAD BOARD PAGE
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
  ArrowRight, Eye, Clock, RefreshCw
} from "lucide-react";
import { useLocation } from "wouter";

export default function LoadBoard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadsQuery = (trpc as any).loads.list.useQuery({ limit: 100 });

  const filteredLoads = (loadsQuery.data as any)?.filter((load: any) => {
    const matchesSearch = !searchTerm || 
      load.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || load.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalLoads = (loadsQuery.data as any)?.length || 0;
  const postedLoads = (loadsQuery.data as any)?.filter((l: any) => l.status === "posted").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Posted</Badge>;
      case "bidding": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Bidding</Badge>;
      case "assigned": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Assigned</Badge>;
      case "in_transit": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">In Transit</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Load Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Browse and manage all available loads</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <Package className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Posted</span>
            <span className="text-yellow-400 font-bold">{postedLoads}</span>
          </div>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => loadsQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{totalLoads}</p>
                <p className="text-xs text-slate-400">Total Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{postedLoads}</p>
                <p className="text-xs text-slate-400">Posted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Truck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{(loadsQuery.data as any)?.filter((l: any) => l.status === "in_transit").length || 0}</p>
                <p className="text-xs text-slate-400">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">${((loadsQuery.data as any)?.reduce((sum: number, l: any) => sum + (l.rate || 0), 0) || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search loads..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="bidding">Bidding</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredLoads?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No loads found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredLoads?.map((load: any) => (
                <div key={load.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(`/loads/${load.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Package className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{load.loadNumber || `#${load.id?.slice(0, 6)}`}</p>
                          {getStatusBadge(load.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-3 h-3 text-green-400" />
                          <span>{load.origin?.city || "N/A"}</span>
                          <ArrowRight className="w-3 h-3" />
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>{load.destination?.city || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-lg">${(load.rate || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{load.distance || 0} miles</p>
                      </div>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg">
                        <Eye className="w-4 h-4" />
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
