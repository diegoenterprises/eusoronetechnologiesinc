/**
 * LOAD BOARD PAGE
 * 100% Dynamic - No mock data
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
  Package, MapPin, DollarSign, Clock, Truck, Search,
  AlertTriangle, Eye, ChevronRight, Calendar, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function LoadBoard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [originState, setOriginState] = useState("all");

  const loadsQuery = trpc.loads.getAvailable.useQuery({
    search: searchTerm || undefined,
    equipment: equipmentFilter !== "all" ? equipmentFilter : undefined,
    originState: originState !== "all" ? originState : undefined,
  });

  if (loadsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading available loads</p>
        <Button className="mt-4" onClick={() => loadsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const getEquipmentColor = (type: string) => {
    switch (type) {
      case "dry_van": return "bg-blue-500/20 text-blue-400";
      case "reefer": return "bg-cyan-500/20 text-cyan-400";
      case "flatbed": return "bg-orange-500/20 text-orange-400";
      case "tanker": return "bg-purple-500/20 text-purple-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Board</h1>
          <p className="text-slate-400 text-sm">Find available loads to bid on</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search loads..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Equipment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="dry_van">Dry Van</SelectItem>
                <SelectItem value="reefer">Reefer</SelectItem>
                <SelectItem value="flatbed">Flatbed</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
              </SelectContent>
            </Select>
            <Select value={originState} onValueChange={setOriginState}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Origin State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
                <SelectItem value="IL">Illinois</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          {loadsQuery.isLoading ? "Loading..." : `${loadsQuery.data?.length || 0} loads available`}
        </p>
      </div>

      {/* Loads List */}
      <div className="space-y-4">
        {loadsQuery.isLoading ? (
          [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : loadsQuery.data?.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No loads match your criteria</p>
            </CardContent>
          </Card>
        ) : (
          loadsQuery.data?.map((load) => (
            <Card key={load.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white font-bold">{load.loadNumber}</p>
                      <Badge className={getEquipmentColor(load.equipmentType)}>{load.equipmentType?.replace("_", " ")}</Badge>
                      {load.hazmat && <Badge className="bg-red-500/20 text-red-400">Hazmat</Badge>}
                    </div>
                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-white">{load.pickupLocation?.city}, {load.pickupLocation?.state}</p>
                          <p className="text-xs text-slate-500">{load.pickupDate}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-white">{load.deliveryLocation?.city}, {load.deliveryLocation?.state}</p>
                          <p className="text-xs text-slate-500">{load.deliveryDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1"><Truck className="w-4 h-4" />{load.distance} mi</span>
                      <span>{load.weight}</span>
                      <span>{load.commodity}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-400">${load.rate?.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">${load.ratePerMile?.toFixed(2)}/mi</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setLocation(`/loads/${load.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />Details
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setLocation(`/loads/${load.id}/bid`)}>
                        <DollarSign className="w-4 h-4 mr-1" />Bid
                      </Button>
                    </div>
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
