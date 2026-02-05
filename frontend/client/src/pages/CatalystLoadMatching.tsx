/**
 * CATALYST LOAD MATCHING PAGE
 * 100% Dynamic - AI-powered load and driver matching
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
  Sparkles, Search, Truck, Package, MapPin,
  Clock, DollarSign, CheckCircle, AlertTriangle, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystLoadMatching() {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const matchesQuery = (trpc as any).catalysts.getMatchedLoads.useQuery({});
  const statsQuery = (trpc as any).catalysts.getMatchStats.useQuery();

  const assignDriverMutation = (trpc as any).catalysts.assignDriver.useMutation({
    onSuccess: () => {
      toast.success("Driver assigned successfully");
      matchesQuery.refetch();
      statsQuery.refetch();
    },
  });

  const matches = matchesQuery.data || [];
  const stats = statsQuery.data;

  const filteredMatches = matches.filter((m: any) =>
    m.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    m.origin?.toLowerCase().includes(search.toLowerCase()) ||
    m.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-cyan-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Load Matching
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered driver and load matching recommendations</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
          <Sparkles className="w-4 h-4 mr-2" />Run AI Match
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Pending Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.pendingLoads || stats?.totalMatches || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Available Drivers</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.availableDrivers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">AI Matches</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.aiMatches || stats?.matched || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Assigned Today</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.assignedToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Urgent</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.urgent || 0}</p>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search loads..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <div className="space-y-4">
        {matchesQuery.isLoading ? (
          Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredMatches.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No pending matches found</p>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((match: any) => (
            <Card key={match.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              match.priority === "urgent" && "border-l-4 border-red-500"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-cyan-400" />
                    <CardTitle className="text-white text-lg">Load #{match.loadNumber}</CardTitle>
                    <Badge className={cn(
                      "border-0",
                      match.priority === "urgent" ? "bg-red-500/20 text-red-400" :
                      match.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {match.priority}
                    </Badge>
                    {match.hazmat && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-0">HAZMAT</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Pickup: {match.pickupTime}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Route</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm">{match.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-white text-sm">{match.destination}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Details</p>
                    <p className="text-white text-sm">{match.distance} miles</p>
                    <p className="text-slate-400 text-xs">{match.equipmentType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Shipper</p>
                    <p className="text-white text-sm">{match.shipperName}</p>
                    <p className="text-slate-400 text-xs">{match.commodity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Rate</p>
                    <p className="text-green-400 font-bold text-lg">${match.rate?.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">${match.ratePerMile?.toFixed(2)}/mi</p>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AI Recommended Drivers
                  </p>
                  <div className="space-y-3">
                    {match.recommendedDrivers?.map((driver: any, idx: number) => (
                      <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/20">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                            idx === 0 ? "bg-green-500/20 text-green-400" :
                            idx === 1 ? "bg-cyan-500/20 text-cyan-400" :
                            "bg-slate-600/50 text-slate-400"
                          )}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <p className="text-white font-medium">{driver.name}</p>
                            </div>
                            <p className="text-slate-400 text-xs">
                              {driver.currentLocation} • {driver.hoursAvailable}h available
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Match Score</p>
                            <p className={cn("font-bold", getMatchScoreColor(driver.matchScore))}>
                              {driver.matchScore}%
                            </p>
                          </div>
                          <div className="w-32">
                            <Progress value={driver.matchScore} className="h-2" />
                          </div>
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Distance</p>
                            <p className="text-white">{driver.distanceToPickup} mi</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => assignDriverMutation.mutate({ loadId: match.id, driverId: driver.id })}
                            disabled={assignDriverMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
