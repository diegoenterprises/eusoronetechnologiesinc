/**
 * PORT DIRECTORY — V5 Multi-Modal
 * Port & terminal directory: map view of all ports,
 * filter by country/type/rail access, port detail with terminals,
 * gate hours, cutoff times, berth schedule
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
import {
  Anchor,
  Search,
  MapPin,
  Ship,
  TrainFront,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function PortDirectory() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");

  const ports = trpc.vesselShipments.getPorts.useQuery({ limit: 100 });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const allPorts = ports.data || [];
  const countries = [
    ...new Set(allPorts.map((p: any) => p.country).filter(Boolean)),
  ].sort();

  const filtered = allPorts.filter((p: any) => {
    if (
      search &&
      !p.name?.toLowerCase().includes(search.toLowerCase()) &&
      !p.code?.toLowerCase().includes(search.toLowerCase()) &&
      !p.city?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (countryFilter !== "all" && p.country !== countryFilter) return false;
    return true;
  });

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Anchor className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Port Directory
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Global ports &amp; terminal information
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={String(c)} value={String(c)}>
                {String(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ports Grid */}
      {ports.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id} className={cardBg}>
              <CardContent className="p-4">
                {/* Port Name & Code */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-cyan-400" />
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        isLight ? "text-slate-900" : "text-white"
                      )}
                    >
                      {p.name}
                    </span>
                  </div>
                  {p.code && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 text-xs font-mono">
                      {p.code}
                    </Badge>
                  )}
                </div>

                {/* Location */}
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs mb-3",
                    isLight ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  <MapPin className="w-3 h-3" />
                  {p.city}, {p.state ? `${p.state}, ` : ""}
                  {p.country}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Type: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {p.portType?.replace(/_/g, " ") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">TEU Cap: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {p.teuCapacity
                        ? Number(p.teuCapacity).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Cranes: </span>
                    <span
                      className={
                        p.hasCranes
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }
                    >
                      {p.hasCranes ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Rail: </span>
                    {p.hasRailAccess ? (
                      <span className="flex items-center gap-0.5 text-blue-400">
                        <TrainFront className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">Customs: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {p.customsOffice ? "On-site" : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Active: </span>
                    <span
                      className={
                        p.isActive
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {p.isActive ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-3 text-center py-12 text-slate-500">
              No ports found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
