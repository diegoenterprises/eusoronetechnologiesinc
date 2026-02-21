/**
 * PLATFORM LOADS OVERSIGHT — Super Admin view of ALL loads on the platform
 * Not a shipper's "My Loads" — this is the overseer's view of every load lifecycle
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, RefreshCw, Filter, Eye, TrendingUp,
  MapPin, Truck, Clock, CheckCircle, AlertTriangle, XCircle
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  posted: { label: "Posted", color: "text-blue-400", bg: "bg-blue-500/20", icon: <Package className="w-3.5 h-3.5" /> },
  bidding: { label: "Bidding", color: "text-purple-400", bg: "bg-purple-500/20", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  assigned: { label: "Assigned", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: <Truck className="w-3.5 h-3.5" /> },
  en_route_pickup: { label: "En Route Pickup", color: "text-amber-400", bg: "bg-amber-500/20", icon: <MapPin className="w-3.5 h-3.5" /> },
  at_pickup: { label: "At Pickup", color: "text-amber-400", bg: "bg-amber-500/20", icon: <MapPin className="w-3.5 h-3.5" /> },
  loading: { label: "Loading", color: "text-orange-400", bg: "bg-orange-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  in_transit: { label: "In Transit", color: "text-green-400", bg: "bg-green-500/20", icon: <Truck className="w-3.5 h-3.5" /> },
  at_delivery: { label: "At Delivery", color: "text-teal-400", bg: "bg-teal-500/20", icon: <MapPin className="w-3.5 h-3.5" /> },
  unloading: { label: "Unloading", color: "text-teal-400", bg: "bg-teal-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-500/20", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const FILTER_STATUSES = [
  { key: "", label: "All" },
  { key: "posted", label: "Posted" },
  { key: "bidding", label: "Bidding" },
  { key: "assigned", label: "Assigned" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function timeAgo(iso: string) {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

export default function PlatformLoadsOversight() {
  const [, nav] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const loadsQuery = (trpc as any).loads.list.useQuery({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const loads = loadsQuery.data || [];
  const loading = loadsQuery.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Platform Loads</h1>
          <p className="text-slate-400 text-sm mt-1">All loads across the platform — every status, every party</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-white/[0.04] rounded-lg" onClick={() => loadsQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* STATUS FILTERS */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_STATUSES.map(f => (
          <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === f.key ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* LOADS TABLE */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : loads.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-lg">No loads found</p>
              <p className="text-slate-500 text-sm mt-1">{statusFilter ? "Try a different status filter" : "No loads on the platform yet"}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {/* Header row */}
              <div className="px-4 py-3 grid grid-cols-12 gap-3 text-xs text-slate-500 font-medium uppercase tracking-wider bg-slate-800/80">
                <div className="col-span-1">ID</div>
                <div className="col-span-3">Route</div>
                <div className="col-span-2">Shipper</div>
                <div className="col-span-2">Catalyst</div>
                <div className="col-span-1">Rate</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Created</div>
                <div className="col-span-1"></div>
              </div>
              {loads.map((l: any) => {
                const st = STATUS_CFG[l.status] || STATUS_CFG.posted;
                const originCity = l.origin?.city || (l.pickupLocation as any)?.city || "";
                const originState = l.origin?.state || (l.pickupLocation as any)?.state || "";
                const destCity = l.destination?.city || (l.deliveryLocation as any)?.city || "";
                const destState = l.destination?.state || (l.deliveryLocation as any)?.state || "";
                return (
                  <div key={l.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-white/[0.04] transition-colors">
                    <div className="col-span-1">
                      <span className="text-white font-mono text-sm">#{l.loadNumber || l.id}</span>
                    </div>
                    <div className="col-span-3">
                      <p className="text-white text-sm font-medium truncate">
                        {originCity || originState || "Origin"} <span className="text-slate-500 mx-1">-&gt;</span> {destCity || destState || "Dest"}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{l.commodity || l.cargoType || "General"} {l.weight ? `| ${l.weight} lbs` : ""}</p>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {(l.shipperProfilePicture || l.companyLogo) && <img src={l.shipperProfilePicture || l.companyLogo} className="w-6 h-6 rounded-full object-cover" alt="" />}
                        <div>
                          <p className="text-white text-xs truncate">{l.shipperName || "—"}</p>
                          <p className="text-[10px] text-slate-500 truncate">{l.companyName || ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-white text-xs truncate">{l.catalystName || "Unassigned"}</p>
                          <p className="text-[10px] text-slate-500 truncate">{l.catalystCompanyName || ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span className="text-emerald-400 font-medium text-sm">${(l.rate || 0).toLocaleString()}</span>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`border-0 text-[10px] ${st.bg} ${st.color} gap-1`}>
                        {st.icon}{st.label}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-slate-500">{l.createdAt || ""}</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={() => nav(`/loads/${l.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {loads.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + loads.length} {statusFilter && `(${statusFilter})`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 rounded-lg" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 rounded-lg" disabled={loads.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
