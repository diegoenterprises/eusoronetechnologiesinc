/**
 * PLATFORM AGREEMENTS OVERSIGHT — Super Admin view of ALL agreements on the platform
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  PenTool, RefreshCw, Eye, Clock, CheckCircle, XCircle,
  AlertTriangle, FileText, Users, DollarSign
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "text-slate-400", bg: "bg-slate-500/20", icon: <FileText className="w-3.5 h-3.5" /> },
  pending_review: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  pending_signature: { label: "Pending Signature", color: "text-purple-400", bg: "bg-purple-500/20", icon: <PenTool className="w-3.5 h-3.5" /> },
  active: { label: "Active", color: "text-green-400", bg: "bg-green-500/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  expired: { label: "Expired", color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  terminated: { label: "Terminated", color: "text-red-400", bg: "bg-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  disputed: { label: "Disputed", color: "text-orange-400", bg: "bg-orange-500/20", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  amended: { label: "Amended", color: "text-blue-400", bg: "bg-blue-500/20", icon: <FileText className="w-3.5 h-3.5" /> },
};

const FILTER_STATUSES = [
  { key: "", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "terminated", label: "Terminated" },
  { key: "disputed", label: "Disputed" },
];

export default function PlatformAgreementsOversight() {
  const [, nav] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const query = (trpc as any).agreements.list.useQuery({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const data = query.data || { agreements: [], total: 0 };
  const agreements = data.agreements || [];
  const total = data.total || 0;
  const loading = query.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Platform Agreements</h1>
          <p className="text-slate-400 text-sm mt-1">All contracts &amp; agreements across every party on the platform</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-500">{total} total</span>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-700/50 rounded-lg" onClick={() => query.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* STATUS FILTERS */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_STATUSES.map(f => (
          <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === f.key ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* AGREEMENTS TABLE */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : agreements.length === 0 ? (
            <div className="p-12 text-center">
              <PenTool className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-lg">No agreements found</p>
              <p className="text-slate-500 text-sm mt-1">{statusFilter ? "Try a different status filter" : "No agreements on the platform yet"}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {/* Header row */}
              <div className="px-4 py-3 grid grid-cols-12 gap-3 text-xs text-slate-500 font-medium uppercase tracking-wider bg-slate-800/80">
                <div className="col-span-2">Agreement #</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Party A</div>
                <div className="col-span-2">Party B</div>
                <div className="col-span-1">Rate</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Effective</div>
                <div className="col-span-1"></div>
              </div>
              {agreements.map((a: any) => {
                const st = STATUS_CFG[a.status] || STATUS_CFG.draft;
                return (
                  <div key={a.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-700/20 transition-colors">
                    <div className="col-span-2">
                      <span className="text-white font-mono text-sm">{a.agreementNumber || `AGR-${a.id}`}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-300 text-sm capitalize">{(a.agreementType || "general").replace(/_/g, " ")}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <div>
                          <p className="text-white text-xs">User #{a.partyAUserId || "—"}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{a.partyARole || ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <div>
                          <p className="text-white text-xs">User #{a.partyBUserId || "—"}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{a.partyBRole || ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium text-sm">{a.baseRate ? Number(a.baseRate).toLocaleString() : "—"}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{a.rateType || ""}</p>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`border-0 text-[10px] ${st.bg} ${st.color} gap-1`}>
                        {st.icon}{st.label}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-slate-500">{a.effectiveDate ? new Date(a.effectiveDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={() => nav(`/agreements/${a.id}`)}>
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
      {agreements.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + agreements.length} of {total}
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
