/**
 * VESSEL BOOKINGS LIST — V5 Multi-Modal
 * List of vessel bookings with status tabs, search, date range
 * Table: Booking#, Origin Port, Dest Port, Container Type, Status, ETA
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Ship, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/hooks/useLocale";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  booking_requested: "bg-yellow-500/20 text-yellow-400",
  booking_confirmed: "bg-blue-500/20 text-blue-400",
  documentation: "bg-indigo-500/20 text-indigo-400",
  container_released: "bg-purple-500/20 text-purple-400",
  gate_in: "bg-violet-500/20 text-violet-400",
  loaded_on_vessel: "bg-sky-500/20 text-sky-400",
  departed: "bg-cyan-500/20 text-cyan-400",
  in_transit: "bg-emerald-500/20 text-emerald-400",
  transshipment: "bg-teal-500/20 text-teal-400",
  arrived: "bg-teal-600/20 text-teal-300",
  customs_hold: "bg-red-500/20 text-red-400",
  discharged: "bg-lime-500/20 text-lime-400",
  gate_out: "bg-green-500/20 text-green-400",
  delivered: "bg-green-600/20 text-green-300",
  invoiced: "bg-amber-500/20 text-amber-400",
  settled: "bg-emerald-600/20 text-emerald-300",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function VesselBookings() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const status =
    tab === "all"
      ? undefined
      : tab === "active"
        ? "in_transit"
        : tab === "completed"
          ? "delivered"
          : undefined;

  const bookings = trpc.vesselShipments.getVesselShipments.useQuery({
    status,
    limit: 50,
  });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
  );

  const filtered = (bookings.data?.shipments || []).filter(
    (s: any) =>
      !search ||
      s.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.commodity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Ship className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {t('vessel.bookings')}
          </h1>
        </div>
        <Link href="/vessel/bookings/create">
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-1" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">In Transit</TabsTrigger>
          <TabsTrigger value="completed">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by booking # or commodity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className={cardBg}>
        <CardContent className="p-0">
          {bookings.isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              <div
                className={cn(
                  "grid grid-cols-7 gap-4 px-4 py-3 text-xs font-medium",
                  isLight
                    ? "text-slate-500 bg-slate-50"
                    : "text-slate-400 bg-slate-800/40"
                )}
              >
                <span>Booking #</span>
                <span>Origin Port</span>
                <span>Dest Port</span>
                <span>Cargo Type</span>
                <span>Commodity</span>
                <span>Status</span>
                <span>ETA</span>
              </div>
              {filtered.map((s: any) => (
                <Link key={s.id} href={`/vessel/bookings/${s.id}`}>
                  <div
                    className={cn(
                      "grid grid-cols-7 gap-4 px-4 py-3 text-sm cursor-pointer transition-colors",
                      isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                    )}
                  >
                    <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>
                      {s.bookingNumber}
                    </span>
                    <span className={isLight ? "text-slate-600" : "text-slate-300"}>
                      {s.originPortId || "—"}
                    </span>
                    <span className={isLight ? "text-slate-600" : "text-slate-300"}>
                      {s.destinationPortId || "—"}
                    </span>
                    <span className={isLight ? "text-slate-600" : "text-slate-300"}>
                      {s.cargoType?.replace(/_/g, " ") || "—"}
                    </span>
                    <span className={isLight ? "text-slate-600" : "text-slate-300"}>
                      {s.commodity || "—"}
                    </span>
                    <Badge className={STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400"}>
                      {s.status?.replace(/_/g, " ")}
                    </Badge>
                    <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                      {s.eta ? new Date(s.eta).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className={cn("text-sm text-center py-12", isLight ? "text-slate-400" : "text-slate-500")}>
                  No bookings found
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
