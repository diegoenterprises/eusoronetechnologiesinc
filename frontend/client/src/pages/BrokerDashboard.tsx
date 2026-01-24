/**
 * BROKER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Package, Truck, Users, TrendingUp, MapPin,
  Clock, CheckCircle, AlertTriangle, Eye, ChevronRight,
  Building, Star, Phone, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function BrokerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("loads");

  const summaryQuery = trpc.broker.getSummary.useQuery();
  const shipperLoadsQuery = trpc.broker.getShipperLoads.useQuery();
  const carrierCapacityQuery = trpc.broker.getCarrierCapacity.useQuery();
  const activeLoadsQuery = trpc.broker.getActiveLoads.useQuery();

  const matchMutation = trpc.broker.matchLoad.useMutation({
    onSuccess: () => { toast.success("Load matched"); shipperLoadsQuery.refetch(); carrierCapacityQuery.refetch(); activeLoadsQuery.refetch(); },
    onError: (error) => toast.error("Match failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading dashboard</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500/20 text-green-400";
      case "in_transit": return "bg-blue-500/20 text-blue-400";
      case "assigned": return "bg-purple-500/20 text-purple-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Broker Dashboard</h1>
          <p className="text-slate-400 text-sm">Match shippers with carriers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.activeLoads || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Loads</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.pendingMatches || 0}</p>
            )}
            <p className="text-xs text-slate-400">Pending Matches</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.weeklyVolume || 0}</p>
            )}
            <p className="text-xs text-slate-400">Weekly Volume</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${(summary?.commissionEarned || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Commission</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{summary?.marginAverage || 0}%</p>
            )}
            <p className="text-xs text-slate-400">Avg Margin</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="loads" className="data-[state=active]:bg-blue-600">Shipper Loads</TabsTrigger>
          <TabsTrigger value="capacity" className="data-[state=active]:bg-blue-600">Carrier Capacity</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">In Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="loads" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5 text-blue-400" />Available Shipper Loads</CardTitle></CardHeader>
            <CardContent>
              {shipperLoadsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : shipperLoadsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No available loads</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shipperLoadsQuery.data?.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Package className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{load.loadNumber}</p>
                            <Badge className="bg-slate-500/20 text-slate-400">{load.shipperName}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span>{load.origin?.city}, {load.origin?.state}</span>
                            <ChevronRight className="w-3 h-3" />
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{load.destination?.city}, {load.destination?.state}</span>
                          </div>
                          <p className="text-xs text-slate-500">{load.commodity} | {load.weight} lbs | {load.distance} mi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-400 font-bold">${load.rate?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">${load.ratePerMile?.toFixed(2)}/mi</p>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation(`/loads/${load.id}`)}>
                          <Eye className="w-4 h-4 mr-1" />Match
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Truck className="w-5 h-5 text-green-400" />Available Carrier Capacity</CardTitle></CardHeader>
            <CardContent>
              {carrierCapacityQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : carrierCapacityQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No available capacity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrierCapacityQuery.data?.map((carrier) => (
                    <div key={carrier.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Truck className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{carrier.name}</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-yellow-400 text-sm">{carrier.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400">MC# {carrier.mcNumber}</p>
                          <p className="text-xs text-slate-500">{carrier.equipmentType} | {carrier.availableTrucks} trucks available</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white flex items-center gap-1"><MapPin className="w-3 h-3" />{carrier.location?.city}, {carrier.location?.state}</p>
                          <p className="text-xs text-slate-500">Available: {carrier.availableDate}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Phone className="w-4 h-4 mr-1" />Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Loads In Progress</CardTitle></CardHeader>
            <CardContent>
              {activeLoadsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : activeLoadsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No loads in progress</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoadsQuery.data?.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", load.status === "in_transit" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                          <Truck className={cn("w-5 h-5", load.status === "in_transit" ? "text-blue-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-slate-400">{load.shipperName} → {load.carrierName}</p>
                          <p className="text-xs text-slate-500">{load.origin?.city} to {load.destination?.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-400 font-bold">${load.commission?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Commission</p>
                        </div>
                        <Badge className={getStatusColor(load.status)}>{load.status?.replace("_", " ")}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/loads/${load.id}`)}><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
