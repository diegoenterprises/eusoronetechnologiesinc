/**
 * BROKER MARKETPLACE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Store, Search, Filter, MapPin, DollarSign, Truck,
  Clock, ArrowRight, TrendingUp, Package, Users, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerMarketplace() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadsQuery = trpc.brokers.getMarketplaceLoads.useQuery({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const statsQuery = trpc.brokers.getMarketplaceStats.useQuery();

  const matchMutation = trpc.brokers.matchLoadToCarrier.useMutation({
    onSuccess: () => {
      toast.success("Load matched successfully");
      loadsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to match", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Marketplace
          </h1>
          <p className="text-slate-400 text-sm mt-1">Match loads with carriers for maximum margin</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg">
          <Zap className="w-4 h-4 mr-2" />
          Auto-Match
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.availableLoads || 0}</p>
                    <p className="text-xs text-slate-400">Available Loads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.availableCarriers || 0}</p>
                    <p className="text-xs text-slate-400">Available Carriers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">${statsQuery.data?.avgMargin || 0}</p>
                    <p className="text-xs text-slate-400">Avg Margin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.matchRate || 0}%</p>
                    <p className="text-xs text-slate-400">Match Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-400" />
              Load Marketplace
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search loads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dry_van">Dry Van</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="tanker">Tanker</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadsQuery.isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          ) : loadsQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No loads in marketplace</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loadsQuery.data?.map((load: any) => (
                <div
                  key={load.id}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">#{load.id}</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {load.equipmentType}
                        </Badge>
                        {load.hazmat && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">HazMat</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <div className="flex items-center gap-1 text-green-400">
                          <MapPin className="w-4 h-4" />
                          <span>{load.origin}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        <div className="flex items-center gap-1 text-red-400">
                          <MapPin className="w-4 h-4" />
                          <span>{load.destination}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {load.miles} mi
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pickup: {new Date(load.pickupDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Shipper Rate: ${load.shipperRate?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">${load.potentialMargin}</p>
                      <p className="text-xs text-slate-500 mb-2">Potential Margin</p>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg"
                        onClick={() => matchMutation.mutate({ loadId: load.id })}
                        disabled={matchMutation.isPending}
                      >
                        Find Carrier
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
