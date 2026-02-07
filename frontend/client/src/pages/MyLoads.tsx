/**
 * MY LOADS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, Plus, Search, MapPin, ArrowRight, Eye, Edit,
  Clock, CheckCircle, Truck, DollarSign, Filter
} from "lucide-react";
import { useLocation } from "wouter";

export default function MyLoads() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const loadsQuery = (trpc as any).loads.list.useQuery({ limit: 100 });

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

  const totalLoads = (loadsQuery.data as any)?.length || 0;
  const activeLoads = (loadsQuery.data as any)?.filter((l: any) => l.status === "in_transit").length || 0;
  const deliveredLoads = (loadsQuery.data as any)?.filter((l: any) => l.status === "delivered").length || 0;
  const totalRevenue = (loadsQuery.data as any)?.reduce((sum: number, l: any) => sum + (l.rate || 0), 0) || 0;

  const filteredLoads = (loadsQuery.data as any)?.filter((load: any) => {
    const matchesSearch = !searchTerm || 
      load.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || load.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            My Loads
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your shipment loads with real-time tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Filter className="w-4 h-4 mr-2" />Export
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/loads/create")}>
            <Plus className="w-4 h-4 mr-2" />Create New Load
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
                {loadsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{totalLoads}</p>
                )}
                <p className="text-xs text-slate-400">Total Loads</p>
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
                {loadsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{activeLoads}</p>
                )}
                <p className="text-xs text-slate-400">Active Loads</p>
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
                {loadsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{deliveredLoads}</p>
                )}
                <p className="text-xs text-slate-400">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {loadsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Revenue</p>
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
            placeholder="Search by load number, origin, destination, or cargo type..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
          />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Filter className="w-4 h-4 mr-2" />Advanced Filters
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        {[
          { value: "all", label: `ALL (${totalLoads})` },
          { value: "draft", label: "DRAFT" },
          { value: "posted", label: "POSTED" },
          { value: "bidding", label: "BIDDING" },
          { value: "assigned", label: "ASSIGNED" },
          { value: "in_transit", label: "IN TRANSIT" },
          { value: "delivered", label: "DELIVERED" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === tab.value
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Load List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : filteredLoads?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No loads found</p>
              <p className="text-slate-500 text-sm mt-1">Create your first load to get started</p>
              <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/loads/create")}>
                <Plus className="w-4 h-4 mr-2" />Create New Load
              </Button>
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
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(load.status)}
                          <span className="text-white font-bold">{load.loadNumber || `#LOAD-${load.id?.slice(0, 6)}`}</span>
                          <span className="text-slate-500 text-sm">{load.createdAt}</span>
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
                          <span>{load.equipmentType || "General"}</span>
                          <span>{load.weight?.toLocaleString() || 0} lbs</span>
                          <span>{load.distance || 0} miles</span>
                          <span>{load.pickupDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-xl">${(load.rate || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation(`/loads/${load.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
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
