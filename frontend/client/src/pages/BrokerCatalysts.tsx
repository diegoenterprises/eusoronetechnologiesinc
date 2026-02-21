/**
 * BROKER CATALYSTS PAGE
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
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Users, Search, Plus, Star, Shield, Truck,
  CheckCircle, AlertTriangle, Phone, Mail, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerCatalysts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const catalystsQuery = (trpc as any).brokers.getCatalystNetwork.useQuery({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    tier: tierFilter !== "all" ? tierFilter : undefined,
  });

  const statsQuery = (trpc as any).brokers.getCatalystStats.useQuery();

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "platinum":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Platinum</Badge>;
      case "gold":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Gold</Badge>;
      case "silver":
        return <Badge className="bg-slate-400/20 text-slate-300 border-slate-400/30">Silver</Badge>;
      case "bronze":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Bronze</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{tier}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Suspended</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Catalyst Network
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your catalyst relationships and vetting</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Catalyst
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.totalCatalysts || 0}</p>
                    <p className="text-xs text-slate-400">Total Catalysts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.activeCatalysts || 0}</p>
                    <p className="text-xs text-slate-400">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Star className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.preferredCatalysts || 0}</p>
                    <p className="text-xs text-slate-400">Preferred</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.pendingVetting || 0}</p>
                    <p className="text-xs text-slate-400">Pending Vetting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Catalyst Directory
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search catalysts..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9 bg-white/[0.04] border-white/[0.06] rounded-lg w-64"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-32 bg-white/[0.04] border-white/[0.06] rounded-lg">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white/[0.04] border-white/[0.06] rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {catalystsQuery.isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : (catalystsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No catalysts found</p>
              <p className="text-slate-500 text-sm">Add catalysts to build your network</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(catalystsQuery.data as any)?.map((catalyst: any) => (
                <div
                  key={catalyst.id}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium text-lg">{catalyst.name}</span>
                        {getTierBadge(catalyst.tier)}
                        {getStatusBadge(catalyst.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500">MC Number</p>
                          <p className="text-sm text-white">{catalyst.mcNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">DOT Number</p>
                          <p className="text-sm text-white">{catalyst.dotNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Fleet Size</p>
                          <p className="text-sm text-white">{catalyst.fleetSize} trucks</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Loads Completed</p>
                          <p className="text-sm text-white">{catalyst.loadsCompleted}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-slate-300">Safety: {catalyst.safetyScore}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-slate-300">Rating: {catalyst.rating}/5</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {catalyst.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {catalyst.phone}
                          </span>
                        )}
                        {catalyst.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {catalyst.email}
                          </span>
                        )}
                        {catalyst.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {catalyst.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/[0.04] border-white/[0.06] hover:bg-slate-600/50 rounded-lg"
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="bg-cyan-600/80 hover:bg-cyan-600 rounded-lg"
                      >
                        Assign Load
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
