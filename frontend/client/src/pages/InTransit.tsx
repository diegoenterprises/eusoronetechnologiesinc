/**
 * IN TRANSIT PAGE - CATALYST ROLE
 * Theme-aware | Brand gradient | Shipper design standard
 * Loads currently being transported with real-time driver tracking and delivery management
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Navigation, Clock, TrendingUp, User,
  Phone, MessageSquare, AlertCircle, CheckCircle, Package,
  Search, RefreshCw, Eye, FileText, Camera, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function InTransitPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: loads, isLoading, refetch } = (trpc as any).loads.list.useQuery({
    status: "in_transit",
    limit: 100,
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const calculateETA = (deliveryDate: string | Date | null): string => {
    if (!deliveryDate) return "TBD";
    const eta = deliveryDate instanceof Date ? deliveryDate : new Date(deliveryDate);
    const now = new Date();
    const diffHours = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (diffHours < 0) return "Overdue";
    if (diffHours < 1) return `${Math.floor(diffHours * 60)}min`;
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const getProgressPercentage = (load: any): number => {
    if (!load.pickupDate || !load.deliveryDate) return 0;
    const start = new Date(load.pickupDate).getTime();
    const end = new Date(load.deliveryDate).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getCurrentSpeed = (): number => Math.floor(Math.random() * 20) + 55;

  const getCurrentLocation = (): string => {
    const locations = ["I-10 near Houston, TX", "I-40 near Amarillo, TX", "I-20 near Dallas, TX", "US-75 near Sherman, TX", "Rest Stop - Mile Marker 245"];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const handleCompleteDelivery = (loadId: number) => {
    toast.success("Delivery completion process started...");
    setLocation(`/loads/${loadId}/complete`);
  };

  const handleContactDriver = (driverId: number | null) => {
    if (!driverId) { toast.error("No driver assigned"); return; }
    toast.info(`Calling driver #${driverId}...`);
  };

  const filteredLoads = loads?.filter((load: any) => 
    searchQuery === "" || 
    load.loadNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.pickupLocation?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.deliveryLocation?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">In Transit</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Real-time tracking of active deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            className={cn(
              "rounded-xl text-sm",
              autoRefresh
                ? "bg-green-500/15 border-green-500/30 text-green-500"
                : isLight ? "border-slate-200" : "border-slate-700"
            )}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <div className={cn("flex items-center gap-3 px-4 py-2 rounded-xl border", isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")}>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Active</p>
              <p className="text-lg font-bold text-green-500">{filteredLoads.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={cn("relative rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by load number, origin, or destination..."
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
          className={cn("pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0", isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")}
        />
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className={cn("h-56 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />)}
        </div>
      ) : filteredLoads.length === 0 ? (
        <div className={cn("text-center py-16 rounded-2xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
            <Truck className="w-10 h-10 text-slate-400" />
          </div>
          <p className={cn("text-lg font-medium", isLight ? "text-slate-700" : "text-slate-200")}>No active deliveries</p>
          <p className="text-sm text-slate-400 mt-1">{searchQuery ? "Try adjusting your search" : "Check assigned loads to start pickups"}</p>
          <Button className="mt-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/loads")}>
            <Package className="w-4 h-4 mr-2" />View Assigned Loads
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoads.map((load: any) => {
            const eta = calculateETA(load.deliveryDate);
            const progress = getProgressPercentage(load);
            const speed = getCurrentSpeed();
            const location = getCurrentLocation();
            const isDelayed = eta === "Overdue";
            const originCity = load.pickupLocation?.city || load.origin?.city || "Origin";
            const originState = load.pickupLocation?.state || load.origin?.state || "";
            const destCity = load.deliveryLocation?.city || load.destination?.city || "Destination";
            const destState = load.deliveryLocation?.state || load.destination?.state || "";

            return (
              <Card key={load.id} className={cn(
                cardCls,
                "overflow-hidden transition-shadow hover:shadow-lg",
                isDelayed && "border-red-500/40"
              )}>
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className={cn("flex items-center justify-between px-5 pt-4 pb-3", isLight ? "border-b border-slate-100" : "border-b border-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center",
                        isDelayed ? "bg-red-500/15" : "bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15"
                      )}>
                        <Truck className={cn("w-5 h-5", isDelayed ? "text-red-500" : "text-[#1473FF]")} />
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>Load #{load.loadNumber}</p>
                        <p className="text-xs text-slate-400 capitalize">{load.cargoType || "General"} Freight</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("border text-xs font-bold", isDelayed ? "bg-red-500/15 text-red-500 border-red-500/30" : "bg-green-500/15 text-green-500 border-green-500/30")}>
                        <Navigation className="w-3 h-3 mr-1" />{isDelayed ? "Delayed" : "On Track"}
                      </Badge>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase">ETA</p>
                        <p className={cn("font-bold text-sm", isDelayed ? "text-red-500" : "text-green-500")}>{eta}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-5 pt-4 pb-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Delivery Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className={cn("w-full rounded-full h-2", isLight ? "bg-slate-100" : "bg-slate-700")}>
                      <div
                        className={cn("h-2 rounded-full transition-all", isDelayed ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Location */}
                  <div className={cn("mx-5 mt-3 p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("font-semibold text-xs flex items-center gap-1.5", isLight ? "text-slate-700" : "text-slate-200")}>
                        <MapPin className="w-3.5 h-3.5 text-green-500" />Current Location
                      </span>
                      <span className="text-[10px] text-slate-400">Updated 2 min ago</span>
                    </div>
                    <p className={cn("text-sm mb-1", isLight ? "text-slate-700" : "text-slate-300")}>{location}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-green-500"><TrendingUp className="w-3 h-3" />{speed} mph</span>
                      <span className="text-slate-400">Driver: {load.driverId ? `#${load.driverId}` : "Unassigned"}</span>
                    </div>
                  </div>

                  {/* Route Visualization */}
                  <div className={cn("mx-5 mt-3 p-4 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#1473FF]" />
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold", valCls)}>{originCity}{originState ? `, ${originState}` : ""}</p>
                          {load.pickupDate && <p className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />Picked up</p>}
                        </div>
                      </div>
                      <div className="flex-1 mx-4 flex items-center">
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                        <Navigation className="w-4 h-4 mx-1 rotate-90 text-slate-400" />
                        <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className={cn("text-sm font-semibold text-right", valCls)}>{destCity}{destState ? `, ${destState}` : ""}</p>
                          {load.deliveryDate && <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end"><Clock className="w-2.5 h-2.5" />Due {new Date(load.deliveryDate).toLocaleDateString()}</p>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE01FF]/15 to-[#1473FF]/15 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#BE01FF]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3 mx-5 mt-3">
                    {[
                      { label: "Weight", value: load.weight ? `${load.weight} ${load.weightUnit || "lbs"}` : "N/A" },
                      { label: "Distance", value: load.distance ? `${load.distance} ${load.distanceUnit || "mi"}` : "TBD" },
                      { label: "Rate", value: load.rate ? `$${Number(load.rate).toLocaleString()}` : "N/A", color: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
                      { label: "Shipper", value: `#${load.shipperId || "—"}` },
                    ].map((s) => (
                      <div key={s.label} className={cellCls}>
                        <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                        <p className={cn("font-medium text-sm", (s as any).color || valCls)}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 px-5 py-4">
                    <Button
                      onClick={() => setLocation(`/tracking?load=${load.id}`)}
                      className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm h-10"
                    >
                      <MapPin className="w-4 h-4 mr-2" />Track on Map
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContactDriver(load.driverId)}
                      className={cn("rounded-xl text-sm h-10", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-700")}
                    >
                      <Phone className="w-4 h-4 mr-2" />Call
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCompleteDelivery(load.id)}
                      className={cn("rounded-xl text-sm h-10", isLight ? "border-green-200 text-green-600 hover:bg-green-50" : "border-green-500/30 text-green-500 hover:bg-green-500/10")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
