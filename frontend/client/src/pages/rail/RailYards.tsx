/**
 * RAIL YARDS — V5 Multi-Modal
 * Rail yard directory with filtering by railroad, state, type
 * Yard detail: tracks, capacity, intermodal capability
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Warehouse, Search, MapPin, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function RailYards() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const yards = trpc.railShipments.getRailYards.useQuery({ limit: 100 });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const allYards = yards.data || [];
  const states = [
    ...new Set(allYards.map((y: any) => y.state).filter(Boolean)),
  ].sort();

  const filtered = allYards.filter((y: any) => {
    if (
      search &&
      !y.name?.toLowerCase().includes(search.toLowerCase()) &&
      !y.city?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (stateFilter !== "all" && y.state !== stateFilter) return false;
    return true;
  });

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Warehouse className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Rail Yards
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Directory of intermodal yards &amp; terminals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map((s) => (
              <SelectItem key={String(s)} value={String(s)}>
                {String(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Yard Grid */}
      {yards.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((y: any) => (
            <Card key={y.id} className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrainFront className="w-4 h-4 text-blue-400" />
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        isLight ? "text-slate-900" : "text-white"
                      )}
                    >
                      {y.name}
                    </span>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                    {y.yardType?.replace(/_/g, " ") || "yard"}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs mb-3",
                    isLight ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  <MapPin className="w-3 h-3" />
                  {y.city}, {y.state}, {y.country}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Tracks: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {y.totalTracks || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Intermodal: </span>
                    <span
                      className={
                        y.hasIntermodal
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }
                    >
                      {y.hasIntermodal ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Hazmat: </span>
                    <span
                      className={
                        y.hasHazmat ? "text-amber-400" : "text-slate-500"
                      }
                    >
                      {y.hasHazmat ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Active: </span>
                    <span
                      className={
                        y.isActive ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      {y.isActive ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-3 text-center py-12 text-slate-500">
              No yards found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
