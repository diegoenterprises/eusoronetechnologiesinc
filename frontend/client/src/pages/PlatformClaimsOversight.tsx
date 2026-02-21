/**
 * PLATFORM CLAIMS & DISPUTES OVERSIGHT — Super Admin view of ALL claims/disputes
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, RefreshCw, Eye, Clock, CheckCircle, XCircle,
  ShieldAlert, FileWarning, Package
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "text-slate-400", bg: "bg-slate-500/20", icon: <FileWarning className="w-3.5 h-3.5" /> },
  submitted: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-500/20", icon: <Package className="w-3.5 h-3.5" /> },
  reported: { label: "Reported", color: "text-blue-400", bg: "bg-blue-500/20", icon: <Package className="w-3.5 h-3.5" /> },
  under_review: { label: "Under Review", color: "text-amber-400", bg: "bg-amber-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  investigating: { label: "Investigating", color: "text-purple-400", bg: "bg-purple-500/20", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "text-green-400", bg: "bg-green-500/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  denied: { label: "Denied", color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  settled: { label: "Settled", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  closed: { label: "Closed", color: "text-slate-400", bg: "bg-slate-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const FILTER_STATUSES = [
  { key: "", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "investigating", label: "Investigating" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
  { key: "settled", label: "Settled" },
  { key: "closed", label: "Closed" },
];

const TYPE_COLORS: Record<string, string> = {
  damage: "text-red-400 bg-red-500/20",
  shortage: "text-amber-400 bg-amber-500/20",
  loss: "text-red-400 bg-red-500/20",
  delay: "text-blue-400 bg-blue-500/20",
  contamination: "text-orange-400 bg-orange-500/20",
  other: "text-slate-400 bg-slate-500/20",
};

export default function PlatformClaimsOversight() {
  const [, nav] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const query = (trpc as any).claims.list.useQuery({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const data = query.data || { claims: [], total: 0 };
  const claims = data.claims || [];
  const total = data.total || 0;
  const loading = query.isLoading;

  const summaryQuery = (trpc as any).claims.getSummary.useQuery();
  const summary = summaryQuery.data || { total: 0, open: 0, resolved: 0, pending: 0 };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Claims & Disputes</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide cargo claims, disputes & resolution tracking</p>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-white/[0.04] rounded-lg" onClick={() => query.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Claims", value: summary.total, color: "text-white", icon: <AlertTriangle className="w-5 h-5 text-slate-400" /> },
          { label: "Open", value: summary.open, color: "text-amber-400", icon: <Clock className="w-5 h-5 text-amber-400" /> },
          { label: "Resolved", value: summary.resolved, color: "text-green-400", icon: <CheckCircle className="w-5 h-5 text-green-400" /> },
          { label: "Pending", value: summary.pending, color: "text-purple-400", icon: <ShieldAlert className="w-5 h-5 text-purple-400" /> },
        ].map((s, i) => (
          <Card key={i} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* CLAIMS TABLE */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : claims.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-lg">No claims found</p>
              <p className="text-slate-500 text-sm mt-1">{statusFilter ? "Try a different status filter" : "No claims or disputes on the platform yet"}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              <div className="px-4 py-3 grid grid-cols-12 gap-3 text-xs text-slate-500 font-medium uppercase tracking-wider bg-slate-800/80">
                <div className="col-span-2">Claim #</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Load</div>
                <div className="col-span-2">Parties</div>
                <div className="col-span-1">Amount</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Filed</div>
                <div className="col-span-1"></div>
              </div>
              {claims.map((c: any) => {
                const st = STATUS_CFG[c.status] || STATUS_CFG.submitted;
                const tc = TYPE_COLORS[c.type] || TYPE_COLORS.other;
                return (
                  <div key={c.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-white/[0.04] transition-colors">
                    <div className="col-span-2">
                      <span className="text-white font-mono text-sm">{c.claimNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge className={`border-0 text-[10px] ${tc} capitalize`}>{c.type}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-300 text-sm">{c.loadNumber || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white text-xs">{c.shipper || "—"}</p>
                      <p className="text-[10px] text-slate-500">{c.catalyst || "—"}</p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-emerald-400 font-medium text-sm">{c.amount ? `$${c.amount.toLocaleString()}` : "—"}</span>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`border-0 text-[10px] ${st.bg} ${st.color} gap-1`}>
                        {st.icon}{st.label}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-slate-500">{c.filedDate || ""}</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
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
      {claims.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + claims.length} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 rounded-lg" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 rounded-lg" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
