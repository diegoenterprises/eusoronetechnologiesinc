/**
 * EQUIPMENT MANAGEMENT PAGE
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
  Truck, Search, Plus, Wrench, Calendar, MapPin,
  CheckCircle, AlertTriangle, Clock, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function EquipmentManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const equipmentQuery = trpc.vehicles.list.useQuery({ status: activeTab === "all" ? undefined : activeTab, limit: 50 });
  const summaryQuery = trpc.vehicles.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Maintenance</Badge>;
      case "out_of_service": return <Badge className="bg-red-500/20 text-red-400 border-0">Out of Service</Badge>;
      case "available": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Available</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredEquipment = equipmentQuery.data?.filter((eq: any) =>
    !searchTerm || eq.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || eq.make?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Equipment Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your fleet vehicles and trailers</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Equipment
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
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Fleet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Wrench className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.maintenance || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.outOfService || 0}</p>
                )}
                <p className="text-xs text-slate-400">Out of Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search equipment..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-slate-700 rounded-md">Active</TabsTrigger>
          <TabsTrigger value="available" className="data-[state=active]:bg-slate-700 rounded-md">Available</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-slate-700 rounded-md">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {equipmentQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : filteredEquipment?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Truck className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No equipment found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredEquipment?.map((eq: any) => (
                    <div key={eq.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(`/equipment/${eq.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", eq.status === "active" ? "bg-green-500/20" : eq.status === "maintenance" ? "bg-yellow-500/20" : eq.status === "out_of_service" ? "bg-red-500/20" : "bg-blue-500/20")}>
                            <Truck className={cn("w-5 h-5", eq.status === "active" ? "text-green-400" : eq.status === "maintenance" ? "text-yellow-400" : eq.status === "out_of_service" ? "text-red-400" : "text-blue-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{eq.unitNumber}</p>
                              {getStatusBadge(eq.status)}
                            </div>
                            <p className="text-sm text-slate-400">{eq.year} {eq.make} {eq.model}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <span>VIN: {eq.vin?.slice(-8)}</span>
                              <span>{eq.type}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{eq.currentLocation}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-white font-medium">{eq.odometer?.toLocaleString()} mi</p>
                            <p className="text-xs text-slate-500">Next service: {eq.nextServiceDate}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
