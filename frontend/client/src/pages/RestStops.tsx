/**
 * REST STOPS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bed, Coffee, Fuel, Utensils, MapPin, Search,
  Star, Wifi, ShowerHead, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RestStops() {
  const [searchTerm, setSearchTerm] = useState("");

  const stopsQuery = (trpc as any).restStops.list.useQuery({ limit: 30 });
  const nearbyQuery = (trpc as any).restStops.getNearby.useQuery({ limit: 10 });

  const filteredStops = (stopsQuery.data as any)?.filter((stop: any) =>
    !searchTerm || stop.name?.toLowerCase().includes(searchTerm.toLowerCase()) || stop.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "fuel": return <Fuel className="w-4 h-4" />;
      case "food": return <Utensils className="w-4 h-4" />;
      case "coffee": return <Coffee className="w-4 h-4" />;
      case "wifi": return <Wifi className="w-4 h-4" />;
      case "shower": return <ShowerHead className="w-4 h-4" />;
      case "parking": return <Truck className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Rest Stops
        </h1>
        <p className="text-slate-400 text-sm mt-1">Find truck stops and rest areas</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {stopsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(stopsQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Stops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Fuel className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {stopsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{(stopsQuery.data as any)?.filter((s: any) => s.amenities?.includes("fuel")).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">With Fuel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <ShowerHead className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {stopsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{(stopsQuery.data as any)?.filter((s: any) => s.amenities?.includes("shower")).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">With Showers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                {stopsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-amber-400">{(stopsQuery.data as any)?.filter((s: any) => s.rating >= 4).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Top Rated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search rest stops..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Stops */}
        <Card className="lg:col-span-1 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Nearby Stops
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {nearbyQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (nearbyQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No nearby stops</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {(nearbyQuery.data as any)?.map((stop: any) => (
                  <div key={stop.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{stop.name}</p>
                      <span className="text-cyan-400 text-sm">{stop.distance} mi</span>
                    </div>
                    <p className="text-sm text-slate-400">{stop.city}, {stop.state}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Stops */}
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">All Rest Stops</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stopsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : filteredStops?.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-white/[0.04] w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Truck className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">No rest stops found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
                {filteredStops?.map((stop: any) => (
                  <div key={stop.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{stop.name}</p>
                          {stop.rating >= 4.5 && <Badge className="bg-amber-500/20 text-amber-400 border-0">Top Rated</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{stop.address}, {stop.city}, {stop.state}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-white font-medium">{stop.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {stop.amenities?.map((amenity: string) => (
                        <div key={amenity} className="p-2 rounded-lg bg-slate-700/30 text-slate-400" title={amenity}>
                          {getAmenityIcon(amenity)}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                      <span>{stop.parkingSpaces} parking spaces</span>
                      <span>Open {stop.hours}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
