/**
 * CARRIER LOAD SEARCH PAGE
 * 100% Dynamic - Search and filter available loads in marketplace
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Search, MapPin, DollarSign, Truck, Clock,
  Filter, ArrowRight, Star, Package, Calendar,
  TrendingUp, X, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierLoadSearch() {
  const [, navigate] = useLocation();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [radius, setRadius] = useState(100);
  const [equipment, setEquipment] = useState("");
  const [minRate, setMinRate] = useState("");
  const [hazmatOnly, setHazmatOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadsQuery = trpc.loads.searchMarketplace.useQuery({
    origin,
    destination,
    radius,
    equipment: equipment || undefined,
    minRate: minRate ? parseFloat(minRate) : undefined,
    hazmatOnly,
  });

  const loads = loadsQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Load Board
        </h1>
        <p className="text-slate-400 text-sm mt-1">Find and bid on available loads</p>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin city or state"
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <ArrowRight className="hidden md:block w-6 h-6 text-slate-500 self-center" />
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination city or state"
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "bg-slate-700/50 border-slate-600/50 rounded-lg",
                showFilters && "border-cyan-500/50 text-cyan-400"
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Equipment Type</label>
                <Select value={equipment} onValueChange={setEquipment}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tanker">Tanker</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="van">Dry Van</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Radius: {radius} mi</label>
                <Slider
                  value={[radius]}
                  onValueChange={([v]) => setRadius(v)}
                  min={25}
                  max={500}
                  step={25}
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Min Rate ($/mi)</label>
                <Input
                  type="number"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <Checkbox
                  id="hazmat"
                  checked={hazmatOnly}
                  onCheckedChange={(c) => setHazmatOnly(c === true)}
                />
                <label htmlFor="hazmat" className="text-slate-300 cursor-pointer">
                  Hazmat loads only
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          {loadsQuery.isLoading ? "Searching..." : `${loads.length} loads found`}
        </p>
        <Select defaultValue="rate_desc">
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rate_desc">Highest Rate</SelectItem>
            <SelectItem value="rate_asc">Lowest Rate</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="pickup">Pickup Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Load Cards */}
      {loadsQuery.isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : loads.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No loads match your criteria</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {loads.map((load: any) => (
            <Card
              key={load.id}
              className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer"
              onClick={() => navigate(`/carrier/profitability/${load.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">{load.origin?.city}</p>
                      <p className="text-slate-400 text-sm">{load.origin?.state}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <div className="w-16 h-0.5 bg-gradient-to-r from-green-400 to-red-400" />
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">{load.destination?.city}</p>
                      <p className="text-slate-400 text-sm">{load.destination?.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">${load.rate?.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">${load.ratePerMile?.toFixed(2)}/mi</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-slate-700/50 text-slate-300 border-0">
                      <Truck className="w-3 h-3 mr-1" />
                      {load.equipment}
                    </Badge>
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {load.miles} mi
                    </span>
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {load.pickupDate}
                    </span>
                    {load.hazmat && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-0">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Hazmat
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn("w-3 h-3", s <= (load.shipper?.rating || 4) ? "text-yellow-400 fill-yellow-400" : "text-slate-600")}
                        />
                      ))}
                    </div>
                    <span className="text-slate-500 text-sm">{load.shipper?.name}</span>
                  </div>
                </div>

                {load.bookedRate && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm">
                      Avg book rate: ${load.bookedRate?.toFixed(2)}/mi
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
