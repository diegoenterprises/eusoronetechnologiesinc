/**
 * BROKER CARRIER NETWORK PAGE
 * 100% Dynamic - Manage carrier relationships and capacity
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
  Users, Search, Plus, Star, Truck, Shield,
  MapPin, Phone, Mail, TrendingUp, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerCarrierNetwork() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const carriersQuery = trpc.brokers.getCarrierNetwork.useQuery({ tier: tierFilter, status: statusFilter });
  const statsQuery = trpc.brokers.getNetworkStats.useQuery();

  const carriers = carriersQuery.data || [];
  const stats = statsQuery.data;

  const filteredCarriers = carriers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mcNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "preferred": return "bg-purple-500/20 text-purple-400";
      case "gold": return "bg-yellow-500/20 text-yellow-400";
      case "silver": return "bg-slate-400/20 text-slate-300";
      case "standard": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Carrier Network
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage carrier relationships</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Carrier
        </Button>
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
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Preferred</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.preferred || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Total Trucks</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.totalTrucks || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Loads YTD</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.loadsYTD?.toLocaleString() || 0}</p>
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
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Carriers Grid */}
      {carriersQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filteredCarriers.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="text-center py-16">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No carriers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCarriers.map((carrier: any) => (
            <Card key={carrier.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <div className={cn(
                "h-1",
                carrier.tier === "preferred" ? "bg-purple-500" :
                carrier.tier === "gold" ? "bg-yellow-500" :
                carrier.tier === "silver" ? "bg-slate-400" : "bg-slate-600"
              )} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">{carrier.name}</p>
                    <p className="text-slate-400 text-sm">MC# {carrier.mcNumber}</p>
                  </div>
                  <Badge className={cn("border-0", getTierColor(carrier.tier))}>
                    {carrier.tier}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{carrier.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{carrier.truckCount} trucks • {carrier.equipment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className={cn(
                      carrier.safetyRating === "Satisfactory" ? "text-green-400" : "text-yellow-400"
                    )}>
                      {carrier.safetyRating}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">Loads</p>
                    <p className="text-white font-bold">{carrier.loadsCompleted}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">On-Time</p>
                    <p className={cn(
                      "font-bold",
                      carrier.onTimeRate >= 95 ? "text-green-400" :
                      carrier.onTimeRate >= 90 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {carrier.onTimeRate}%
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Performance Score</span>
                    <span className="text-white">{carrier.performanceScore}%</span>
                  </div>
                  <Progress value={carrier.performanceScore} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-400 p-1">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 p-1">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
