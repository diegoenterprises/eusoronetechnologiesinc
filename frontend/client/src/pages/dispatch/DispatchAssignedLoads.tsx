import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Package, Search, RefreshCw, MapPin, Calendar, Truck,
  Clock, CheckCircle, AlertTriangle, ChevronRight, Filter,
  ArrowUpDown, Eye,
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Pending" },
  assigned: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Assigned" },
  posted: { bg: "bg-violet-500/15", text: "text-violet-400", label: "Posted" },
  bidding: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Bidding" },
  en_route_pickup: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "En Route Pickup" },
  at_pickup: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "At Pickup" },
  loading: { bg: "bg-teal-500/15", text: "text-teal-400", label: "Loading" },
  in_transit: { bg: "bg-green-500/15", text: "text-green-400", label: "In Transit" },
  at_delivery: { bg: "bg-orange-500/15", text: "text-orange-400", label: "At Delivery" },
  unloading: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Unloading" },
  delivered: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Delivered" },
  cancelled: { bg: "bg-red-500/15", text: "text-red-400", label: "Cancelled" },
  completed: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Completed" },
};

export default function DispatchAssignedLoads() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortBy, setSortBy] = useState<"newest" | "pickup" | "status">("newest");

  const loadsQuery = (trpc as any).loads.list.useQuery(
    { limit: 100, offset: 0 },
    { refetchInterval: 30000 }
  );

  const allLoads: any[] = Array.isArray(loadsQuery?.data) ? loadsQuery.data : (loadsQuery?.data?.loads || loadsQuery?.data?.rows || []);

  // Filter
  const filtered = allLoads.filter((l: any) => {
    if (search) {
      const q = search.toLowerCase();
      const match = [l.loadNumber, l.pickupLocation, l.deliveryLocation, l.cargoType, l.status]
        .filter(Boolean).join(" ").toLowerCase();
      if (!match.includes(q)) return false;
    }
    if (statusFilter === "active") {
      return !["delivered", "cancelled", "completed"].includes(l.status);
    }
    if (statusFilter === "delivered") return l.status === "delivered";
    if (statusFilter === "in_transit") return ["in_transit", "en_route_pickup", "at_pickup", "loading", "at_delivery", "unloading"].includes(l.status);
    if (statusFilter === "pending") return ["pending", "posted", "bidding"].includes(l.status);
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === "pickup") return new Date(a.pickupDate || 0).getTime() - new Date(b.pickupDate || 0).getTime();
    return (a.status || "").localeCompare(b.status || "");
  });

  // Stats
  const activeCount = allLoads.filter((l: any) => !["delivered", "cancelled", "completed"].includes(l.status)).length;
  const inTransitCount = allLoads.filter((l: any) => ["in_transit", "en_route_pickup", "at_pickup", "loading", "at_delivery", "unloading"].includes(l.status)).length;
  const deliveredCount = allLoads.filter((l: any) => l.status === "delivered").length;
  const pendingCount = allLoads.filter((l: any) => ["pending", "posted", "bidding", "assigned"].includes(l.status)).length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-bold">Assigned Loads</h1>
          <Badge className="bg-violet-500/20 text-violet-400 border-0 text-xs">{allLoads.length} total</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search loads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 w-48 pl-8 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
            />
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => loadsQuery?.refetch?.()}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", loadsQuery?.isFetching && "animate-spin")} />Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
        {[
          { label: "Active", value: activeCount, icon: Package, color: "text-blue-400", filter: "active" },
          { label: "In Transit", value: inTransitCount, icon: Truck, color: "text-green-400", filter: "in_transit" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-400", filter: "pending" },
          { label: "Delivered", value: deliveredCount, icon: CheckCircle, color: "text-emerald-400", filter: "delivered" },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left",
              statusFilter === s.filter
                ? "bg-white/[0.04] border-white/[0.10]"
                : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]"
            )}
          >
            <s.icon className={cn("w-5 h-5", s.color)} />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">{s.label}</div>
              <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-slate-900/20">
        <Filter className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] text-slate-500 uppercase">Sort:</span>
        {(["newest", "pickup", "status"] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "text-[10px] px-2 py-1 rounded",
              sortBy === s ? "bg-violet-500/20 text-violet-400 font-semibold" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {s === "newest" ? "Newest" : s === "pickup" ? "Pickup Date" : "Status"}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-500">{sorted.length} load{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Loads List */}
      <div className="flex-1 overflow-y-auto">
        {loadsQuery?.isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading loads...</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
            <Package className="w-10 h-10 mb-3 opacity-30" />
            No loads found
            <p className="text-xs mt-1 text-slate-600">
              {search ? "Try a different search term" : "No loads match this filter"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {sorted.map((load: any) => {
              const st = STATUS_STYLES[load.status] || STATUS_STYLES.pending;
              return (
                <button
                  key={load.id}
                  onClick={() => navigate(`/loads/${load.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  {/* Status indicator */}
                  <div className={cn("w-2 h-2 rounded-full shrink-0", st.bg.replace("/15", ""))} />

                  {/* Load info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{load.loadNumber || `#${load.id}`}</span>
                      <Badge className={cn("border-0 text-[9px] font-bold", st.bg, st.text)}>{st.label}</Badge>
                      {load.cargoType && (
                        <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[9px]">{load.cargoType}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-green-400 shrink-0" />
                        {load.pickupLocation || "—"}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        {load.deliveryLocation || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-right shrink-0">
                    {load.pickupDate && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(load.pickupDate).toLocaleDateString()}
                      </div>
                    )}
                    {load.rate && (
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">
                        ${Number(load.rate).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <Eye className="w-4 h-4 text-slate-600 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs text-slate-500 shrink-0">
        <span>{sorted.length} of {allLoads.length} loads shown</span>
        <span>Auto-refreshes every 30s</span>
      </div>
    </div>
  );
}
