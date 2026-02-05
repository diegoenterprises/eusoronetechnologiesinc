/**
 * DRIVER REST STOPS PAGE
 * 100% Dynamic - Find rest areas and truck stops along route
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
  Bed, Search, MapPin, Navigation, Star,
  Clock, Truck, Wifi, Coffee, ShowerHead
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverRestStops() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");

  const stopsQuery = (trpc as any).drivers.getAll.useQuery({});
  const currentLocationQuery = (trpc as any).drivers.getSummary.useQuery();

  const stops = stopsQuery.data || [];
  const currentLocation = currentLocationQuery.data as any;

  const filteredStops = stops.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi": return <Wifi className="w-3 h-3" />;
      case "showers": return <ShowerHead className="w-3 h-3" />;
      case "restaurant": return <Coffee className="w-3 h-3" />;
      case "parking": return <Truck className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Rest Stops
          </h1>
          <p className="text-slate-400 text-sm mt-1">Find rest areas along your route</p>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search rest stops..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rest_area">Rest Areas</SelectItem>
                <SelectItem value="truck_stop">Truck Stops</SelectItem>
                <SelectItem value="travel_center">Travel Centers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="parking">Parking Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stops List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stopsQuery.isLoading ? (
          Array(6).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-56 rounded-xl" />)
        ) : filteredStops.length === 0 ? (
          <Card className="col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Bed className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No rest stops found</p>
            </CardContent>
          </Card>
        ) : (
          filteredStops.map((stop: any) => (
            <Card key={stop.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Bed className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{stop.name}</p>
                      <p className="text-slate-400 text-sm">{stop.type?.replace("_", " ")}</p>
                    </div>
                  </div>
                  <Badge className="bg-slate-600/50 text-slate-300 border-0">
                    <MapPin className="w-3 h-3 mr-1" />{stop.distance} mi
                  </Badge>
                </div>

                <p className="text-slate-400 text-sm mb-4">{stop.address}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">Parking</p>
                    <p className={cn(
                      "font-bold",
                      stop.parkingAvailable > 20 ? "text-green-400" :
                      stop.parkingAvailable > 5 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {stop.parkingAvailable} spots
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">Rating</p>
                    <p className="text-yellow-400 font-bold flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" />{stop.rating}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {stop.amenities?.slice(0, 6).map((amenity: string, idx: number) => (
                    <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs flex items-center gap-1">
                      {getAmenityIcon(amenity)}
                      {amenity}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {stop.open24h && (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />24h
                      </span>
                    )}
                    {stop.secureParking && (
                      <span className="text-green-400 flex items-center gap-1">
                        <Truck className="w-3 h-3" />Secure
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
