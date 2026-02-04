/**
 * HAZMAT SHIPMENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  AlertTriangle, Package, Truck, Search, Plus, Eye,
  Flame, Skull, Droplets, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function HazmatShipments() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");

  const shipmentsQuery = trpc.hazmat.getShipments.useQuery({ limit: 50 });
  const summaryQuery = trpc.hazmat.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_transit": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Transit</Badge>;
      case "loading": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Loading</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>;
      case "pending": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getHazardIcon = (hazardClass: string) => {
    switch (hazardClass) {
      case "flammable": return <Flame className="w-5 h-5 text-orange-400" />;
      case "toxic": return <Skull className="w-5 h-5 text-purple-400" />;
      case "corrosive": return <Droplets className="w-5 h-5 text-yellow-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  const filteredShipments = shipmentsQuery.data?.filter((shipment: any) => {
    const matchesSearch = !searchTerm || 
      shipment.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || shipment.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Hazmat Shipments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage hazardous material shipments</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Hazmat Load
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.inTransit || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Package className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.loading || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loading</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Package className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.delivered || 0}</p>
                )}
                <p className="text-xs text-slate-400">Delivered</p>
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
          placeholder="Search by load number or product..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="in_transit" className="data-[state=active]:bg-slate-700 rounded-md">In Transit</TabsTrigger>
          <TabsTrigger value="loading" className="data-[state=active]:bg-slate-700 rounded-md">Loading</TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-slate-700 rounded-md">Delivered</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {shipmentsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredShipments?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No hazmat shipments found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredShipments?.map((shipment: any) => (
                    <div key={shipment.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl", shipment.hazardClass === "flammable" ? "bg-orange-500/20" : shipment.hazardClass === "toxic" ? "bg-purple-500/20" : "bg-red-500/20")}>
                            {getHazardIcon(shipment.hazardClass)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{shipment.loadNumber}</p>
                              {getStatusBadge(shipment.status)}
                            </div>
                            <p className="text-sm text-slate-400">{shipment.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                                UN{shipment.unNumber}
                              </Badge>
                              <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">
                                Class {shipment.hazardClass}
                              </Badge>
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                                PG {shipment.packingGroup}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <MapPin className="w-3 h-3 text-green-400" />
                              <span>{shipment.origin?.city}</span>
                              <span>→</span>
                              <MapPin className="w-3 h-3 text-red-400" />
                              <span>{shipment.destination?.city}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <p className="text-white font-medium">{shipment.weight?.toLocaleString()} gal</p>
                            <p className="text-xs text-slate-500">{shipment.driver}</p>
                          </div>
                          <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/hazmat/${shipment.id}`)}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
