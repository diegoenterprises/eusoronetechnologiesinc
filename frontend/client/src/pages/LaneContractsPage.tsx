/**
 * LANE CONTRACTS PAGE
 * Frontend for laneContracts router — contracted rates on specific
 * origin-destination lanes with volume commitments and performance tracking.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Route, DollarSign, Clock, CheckCircle, AlertTriangle,
  MapPin, Package, TrendingUp, Calendar, ChevronRight, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  expired: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  suspended: "bg-orange-500/20 text-orange-400",
};

export default function LaneContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const statsQuery = (trpc as any).laneContracts.getStats.useQuery();
  const listQuery = (trpc as any).laneContracts.list.useQuery({
    status: statusFilter || undefined,
    limit: 50,
  });
  const expiringQuery = (trpc as any).laneContracts.getExpiring.useQuery({ daysAhead: 30 });
  const detailQuery = (trpc as any).laneContracts.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const stats = statsQuery.data;
  const lanes = listQuery.data?.lanes || [];
  const expiring = expiringQuery.data || [];
  const detail = detailQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Lane Contracts</h1>
          <p className="text-slate-400 text-sm mt-1">Contracted rates, volume commitments, and lane performance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Lanes", value: stats?.total || 0, icon: <Route className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
          { label: "Active", value: stats?.active || 0, icon: <CheckCircle className="w-5 h-5 text-green-400" />, color: "text-green-400" },
          { label: "Expired", value: stats?.expired || 0, icon: <Clock className="w-5 h-5 text-red-400" />, color: "text-red-400" },
          { label: "Expiring Soon", value: expiring.length, icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-slate-700/30">{s.icon}</div>
                <div>
                  {statsQuery.isLoading ? <Skeleton className="h-7 w-10" /> : <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>}
                  <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Alert */}
      {expiring.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />Expiring Within 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-yellow-500/10">
              {expiring.slice(0, 5).map((l: any) => (
                <div key={l.id} className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-white">{l.originCity}, {l.originState} → {l.destinationCity}, {l.destinationState}</span>
                  <span className="text-xs text-yellow-400">{l.expirationDate ? new Date(l.expirationDate).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["", "active", "expired", "pending"].map(f => (
          <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)}
            className={statusFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {f || "All"}
          </Button>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedId && detail && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Route className="w-5 h-5 text-[#1473FF]" />
              {detail.originCity}, {detail.originState} → {detail.destinationCity}, {detail.destinationState}
              <Badge className={cn("text-[9px] ml-2", STATUS_COLORS[detail.status])}>{detail.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)} className="ml-auto text-slate-400">Close</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-400 uppercase">Contracted Rate</p>
                <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(detail.contractedRate || 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">{detail.rateType}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-400 uppercase">Volume</p>
                <p className="text-lg font-bold text-white">{detail.volumeFulfilled || 0}/{detail.volumeCommitment || 0}</p>
                <p className="text-[10px] text-slate-500">{detail.volumePeriod || "N/A"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-400 uppercase">Total Loads</p>
                <p className="text-lg font-bold text-cyan-400">{detail.totalLoadsBooked || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-400 uppercase">Revenue</p>
                <p className="text-lg font-bold text-green-400">${Number(detail.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-3 text-xs text-slate-400">
              {detail.equipmentType && <span>Equipment: {detail.equipmentType}</span>}
              {detail.hazmatRequired && <Badge className="bg-orange-500/20 text-orange-400 text-[9px]"><Flame className="w-3 h-3 mr-0.5" />Hazmat Required</Badge>}
              {detail.effectiveDate && <span>Effective: {new Date(detail.effectiveDate).toLocaleDateString()}</span>}
              {detail.expirationDate && <span>Expires: {new Date(detail.expirationDate).toLocaleDateString()}</span>}
            </div>
            {(detail.shipper || detail.catalyst) && (
              <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-4 text-xs text-slate-400">
                {detail.shipper && <span>Shipper: {detail.shipper.name}</span>}
                {detail.catalyst && <span>Carrier: {detail.catalyst.name}</span>}
                {detail.broker && <span>Broker: {detail.broker.name}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lane List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-cyan-400" />All Lane Contracts
            <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{listQuery.data?.total || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : lanes.length === 0 ? (
            <div className="p-8 text-center"><Route className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No lane contracts found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {lanes.map((l: any) => (
                <button key={l.id} onClick={() => setSelectedId(l.id)} className="w-full p-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors text-left">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-[#1473FF] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{l.originCity}, {l.originState} → {l.destinationCity}, {l.destinationState}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>${Number(l.contractedRate || 0).toLocaleString()} {l.rateType}</span>
                        {l.hazmatRequired && <Flame className="w-3 h-3 text-orange-400" />}
                        {l.estimatedMiles && <span>{l.estimatedMiles} mi</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-[9px]", STATUS_COLORS[l.status])}>{l.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
