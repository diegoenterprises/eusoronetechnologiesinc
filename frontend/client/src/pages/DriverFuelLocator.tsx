/**
 * DRIVER FUEL LOCATOR PAGE
 * 100% Dynamic - Find fuel stations along route
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
  Fuel, Search, MapPin, Navigation, Star,
  Clock, DollarSign, Truck, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverFuelLocator() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");

  const stationsQuery = trpc.drivers.getFuelStations.useQuery({ brand: brandFilter, sortBy });
  const currentLocationQuery = trpc.drivers.getCurrentLocation.useQuery();

  const stations = stationsQuery.data || [];
  const currentLocation = currentLocationQuery.data;

  const filteredStations = stations.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Fuel Locator
          </h1>
          <p className="text-slate-400 text-sm mt-1">Find fuel stations nearby</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <Navigation className="w-4 h-4 mr-2" />Use My Location
        </Button>
      </div>

      {/* Current Location */}
      {currentLocation && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-white font-medium">Current Location</p>
              <p className="text-slate-400 text-sm">{currentLocation.address}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stations..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="loves">Love's</SelectItem>
                <SelectItem value="pilot">Pilot</SelectItem>
                <SelectItem value="ta">TA</SelectItem>
                <SelectItem value="petro">Petro</SelectItem>
                <SelectItem value="flying_j">Flying J</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stationsQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredStations.length === 0 ? (
          <Card className="col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Fuel className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No fuel stations found</p>
            </CardContent>
          </Card>
        ) : (
          filteredStations.map((station: any) => (
            <Card key={station.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Fuel className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{station.name}</p>
                      <p className="text-slate-400 text-sm">{station.brand}</p>
                    </div>
                  </div>
                  <Badge className="bg-slate-600/50 text-slate-300 border-0">
                    <MapPin className="w-3 h-3 mr-1" />{station.distance} mi
                  </Badge>
                </div>

                <p className="text-slate-400 text-sm mb-4">{station.address}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs">Diesel</p>
                    <p className="text-green-400 font-bold">${station.dieselPrice?.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs">DEF</p>
                    <p className="text-white font-bold">${station.defPrice?.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs">Rating</p>
                    <p className="text-yellow-400 font-bold flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" />{station.rating}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {station.amenities?.slice(0, 4).map((amenity: string, idx: number) => (
                    <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {station.amenities?.length > 4 && (
                    <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                      +{station.amenities.length - 4} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {station.truckParking && (
                      <span className="text-green-400 flex items-center gap-1">
                        <Truck className="w-3 h-3" />Parking
                      </span>
                    )}
                    {station.open24h && (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />24h
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                    <Navigation className="w-4 h-4 mr-1" />Navigate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
