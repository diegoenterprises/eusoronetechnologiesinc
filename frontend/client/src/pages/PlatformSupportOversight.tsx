/**
 * PLATFORM SUPPORT TICKETS OVERSIGHT — Super Admin view of ALL support tickets
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  HelpCircle, RefreshCw, Clock, CheckCircle, XCircle,
  MessageSquare, AlertCircle, Inbox
} from "lucide-react";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "text-blue-400", bg: "bg-blue-500/20", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  pending_customer: { label: "Pending Customer", color: "text-purple-400", bg: "bg-purple-500/20", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  resolved: { label: "Resolved", color: "text-green-400", bg: "bg-green-500/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  closed: { label: "Closed", color: "text-slate-400", bg: "bg-slate-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-400 bg-red-500/20" },
  high: { label: "High", color: "text-orange-400 bg-orange-500/20" },
  normal: { label: "Normal", color: "text-blue-400 bg-blue-500/20" },
  low: { label: "Low", color: "text-slate-400 bg-slate-500/20" },
};

const FILTER_STATUSES = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending_customer", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

export default function PlatformSupportOversight() {
  const [statusFilter, setStatusFilter] = useState("");

  const ticketsQuery = (trpc as any).support.getTickets.useQuery({
    status: statusFilter || undefined,
  });
  const statsQuery = (trpc as any).support.getTicketStats.useQuery();

  const tickets = ticketsQuery.data || [];
  const stats = statsQuery.data || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgResponseTime: "0" };
  const loading = ticketsQuery.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Support Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide user support requests &amp; issue resolution</p>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-white/[0.04] rounded-lg" onClick={() => ticketsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-white", icon: <Inbox className="w-5 h-5 text-slate-400" /> },
          { label: "Open", value: stats.open, color: "text-blue-400", icon: <AlertCircle className="w-5 h-5 text-blue-400" /> },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-400", icon: <Clock className="w-5 h-5 text-amber-400" /> },
          { label: "Resolved", value: stats.resolved, color: "text-green-400", icon: <CheckCircle className="w-5 h-5 text-green-400" /> },
          { label: "Avg Response", value: stats.avgResponseTime, color: "text-purple-400", icon: <MessageSquare className="w-5 h-5 text-purple-400" /> },
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
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === f.key ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* TICKETS TABLE */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-lg">No support tickets</p>
              <p className="text-slate-500 text-sm mt-1">No tickets have been submitted yet. When users submit support requests, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              <div className="px-4 py-3 grid grid-cols-12 gap-3 text-xs text-slate-500 font-medium uppercase tracking-wider bg-slate-800/80">
                <div className="col-span-1">ID</div>
                <div className="col-span-3">Subject</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">User</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Created</div>
              </div>
              {tickets.map((t: any) => {
                const st = STATUS_CFG[t.status] || STATUS_CFG.open;
                const pr = PRIORITY_CFG[t.priority] || PRIORITY_CFG.normal;
                return (
                  <div key={t.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-white/[0.04] transition-colors">
                    <div className="col-span-1">
                      <span className="text-white font-mono text-sm">#{t.id}</span>
                    </div>
                    <div className="col-span-3">
                      <p className="text-white text-sm truncate">{t.subject || t.title || "Untitled"}</p>
                      <p className="text-[10px] text-slate-500 truncate">{t.description || ""}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-300 text-sm capitalize">{(t.category || "general").replace(/_/g, " ")}</span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white text-xs">{t.userName || t.userEmail || "Unknown"}</p>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`border-0 text-[10px] ${pr.color}`}>{pr.label}</Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`border-0 text-[10px] ${st.bg} ${st.color} gap-1`}>
                        {st.icon}{st.label}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500">{t.createdAt || ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
