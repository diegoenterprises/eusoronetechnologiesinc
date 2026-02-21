/**
 * ADVANCED LOAD BIDDING PAGE
 * Frontend for loadBidding router — multi-round bid chains, counter-offers,
 * auto-accept rules, and bid analytics.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Gavel, TrendingUp, Clock, CheckCircle, XCircle, DollarSign,
  Settings, Shield, ChevronRight, BarChart3, Zap, Trash2, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BID_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-green-500/20 text-green-400",
  auto_accepted: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  countered: "bg-orange-500/20 text-orange-400",
  withdrawn: "bg-slate-500/20 text-slate-400",
  expired: "bg-slate-500/20 text-slate-400",
};

export default function LoadBiddingAdvanced() {
  const [tab, setTab] = useState<"my" | "received" | "rules">("my");

  const statsQuery = (trpc as any).loadBidding.getStats.useQuery();
  const myBidsQuery = (trpc as any).loadBidding.getMyBids.useQuery({ limit: 50 });
  const receivedQuery = (trpc as any).loadBidding.getReceivedBids.useQuery({ limit: 50 });
  const rulesQuery = (trpc as any).loadBidding.listAutoAcceptRules.useQuery();

  const withdrawMutation = (trpc as any).loadBidding.withdraw.useMutation({
    onSuccess: () => { toast.success("Bid withdrawn"); myBidsQuery.refetch(); },
  });
  const toggleRuleMutation = (trpc as any).loadBidding.toggleAutoAcceptRule.useMutation({
    onSuccess: () => { toast.success("Rule updated"); rulesQuery.refetch(); },
  });
  const deleteRuleMutation = (trpc as any).loadBidding.deleteAutoAcceptRule.useMutation({
    onSuccess: () => { toast.success("Rule deleted"); rulesQuery.refetch(); },
  });
  const acceptMutation = (trpc as any).loadBidding.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted"); receivedQuery.refetch(); },
  });
  const rejectMutation = (trpc as any).loadBidding.reject.useMutation({
    onSuccess: () => { toast.success("Bid rejected"); receivedQuery.refetch(); },
  });

  const stats = statsQuery.data;
  const myBids = myBidsQuery.data?.bids || [];
  const received = receivedQuery.data || [];
  const rules = rulesQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Advanced Bidding</h1>
        <p className="text-slate-400 text-sm mt-1">Multi-round bids, counter-offers, and auto-accept rules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Submitted", value: stats?.submitted || 0, icon: <Gavel className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
          { label: "Pending", value: stats?.pending || 0, icon: <Clock className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
          { label: "Accepted", value: stats?.accepted || 0, icon: <CheckCircle className="w-5 h-5 text-green-400" />, color: "text-green-400" },
          { label: "Win Rate", value: `${stats?.winRate || 0}%`, icon: <TrendingUp className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
          { label: "Auto-Rules", value: rules.length, icon: <Zap className="w-5 h-5 text-cyan-400" />, color: "text-cyan-400" },
        ].map(s => (
          <Card key={s.label} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              {statsQuery.isLoading ? <Skeleton className="h-6 w-10 mx-auto" /> : <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>}
              <p className="text-[9px] text-slate-400 uppercase">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{k:"my",l:"My Bids"},{k:"received",l:"Received Bids"},{k:"rules",l:"Auto-Accept Rules"}].map(t => (
          <Button key={t.k} size="sm" variant={tab === t.k ? "default" : "outline"} onClick={() => setTab(t.k as any)}
            className={tab === t.k ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {t.l}
          </Button>
        ))}
      </div>

      {/* My Bids */}
      {tab === "my" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-0">
            {myBidsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : myBids.length === 0 ? (
              <div className="p-8 text-center"><Gavel className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No bids submitted</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {myBids.map((b: any) => (
                  <div key={b.id} className="p-3 flex items-center justify-between hover:bg-white/[0.04]">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-medium text-sm">Bid #{b.id}</span>
                        <Badge className={cn("text-[9px]", BID_STATUS_COLORS[b.status])}>{b.status}</Badge>
                        {b.isAutoAccepted && <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]"><Zap className="w-3 h-3 mr-0.5" />Auto</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">Load #{b.loadId} · R{b.bidRound} · ${Number(b.bidAmount || 0).toLocaleString()} {b.rateType}</p>
                    </div>
                    {b.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => withdrawMutation.mutate({ bidId: b.id })} className="text-red-400 hover:text-red-300 h-7">
                        <XCircle className="w-3 h-3 mr-1" />Withdraw
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Received Bids */}
      {tab === "received" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-0">
            {receivedQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : received.length === 0 ? (
              <div className="p-8 text-center"><Gavel className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No bids received on your loads</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {received.map((b: any) => (
                  <div key={b.id} className="p-3 flex items-center justify-between hover:bg-white/[0.04]">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-medium text-sm">${Number(b.bidAmount || 0).toLocaleString()}</span>
                        <Badge className={cn("text-[9px]", BID_STATUS_COLORS[b.status])}>{b.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Load #{b.loadId} · Round {b.bidRound} · {b.rateType}</p>
                    </div>
                    {b.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => acceptMutation.mutate({ bidId: b.id })} className="bg-green-600 hover:bg-green-700 h-7 px-2 text-xs">Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectMutation.mutate({ bidId: b.id })} className="text-red-400 h-7 px-2 text-xs">Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-Accept Rules */}
      {tab === "rules" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />Auto-Accept Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rulesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : rules.length === 0 ? (
              <div className="p-8 text-center"><Settings className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No auto-accept rules configured</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {rules.map((r: any) => (
                  <div key={r.id} className="p-3 flex items-center justify-between hover:bg-white/[0.04]">
                    <div>
                      <p className="text-white font-medium text-sm">{r.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {r.maxRate && <span>Max: ${r.maxRate}</span>}
                        {r.requiredHazmat && <span>Hazmat Req</span>}
                        <span>Auto-accepted: {r.totalAutoAccepted || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleRuleMutation.mutate({ id: r.id, isActive: !r.isActive })}
                        className={cn("h-7 px-2 text-xs", r.isActive ? "text-green-400" : "text-slate-400")}>
                        {r.isActive ? "Active" : "Inactive"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteRuleMutation.mutate({ id: r.id })} className="text-red-400 h-7 px-2">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
