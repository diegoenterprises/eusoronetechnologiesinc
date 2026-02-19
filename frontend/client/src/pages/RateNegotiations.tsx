/**
 * RATE NEGOTIATIONS PAGE
 * Frontend for rateNegotiations router — thread-based negotiations
 * between shippers and carriers for rates, terms, and commitments.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Handshake, TrendingUp, Clock, CheckCircle, XCircle,
  AlertTriangle, Send, ArrowLeft, MessageSquare, DollarSign,
  Filter, Plus, ChevronRight, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  awaiting_response: "bg-yellow-500/20 text-yellow-400",
  counter_offered: "bg-orange-500/20 text-orange-400",
  agreed: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-slate-500/20 text-slate-400",
};

const TYPE_LABELS: Record<string, string> = {
  load_rate: "Load Rate",
  lane_rate: "Lane Rate",
  contract_terms: "Contract Terms",
  fuel_surcharge: "Fuel Surcharge",
  accessorial_rates: "Accessorial Rates",
  volume_commitment: "Volume Commitment",
  payment_terms: "Payment Terms",
  general: "General",
};

export default function RateNegotiations() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [messageText, setMessageText] = useState("");

  const statsQuery = (trpc as any).rateNegotiations.getStats.useQuery();
  const listQuery = (trpc as any).rateNegotiations.list.useQuery({
    status: statusFilter || undefined,
    limit: 50,
  });
  const detailQuery = (trpc as any).rateNegotiations.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const counterMutation = (trpc as any).rateNegotiations.counterOffer.useMutation({
    onSuccess: () => { toast.success("Counter-offer sent"); detailQuery.refetch(); listQuery.refetch(); setCounterAmount(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const acceptMutation = (trpc as any).rateNegotiations.accept.useMutation({
    onSuccess: () => { toast.success("Offer accepted"); detailQuery.refetch(); listQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectMutation = (trpc as any).rateNegotiations.reject.useMutation({
    onSuccess: () => { toast.success("Negotiation rejected"); detailQuery.refetch(); listQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const sendMsgMutation = (trpc as any).rateNegotiations.sendMessage.useMutation({
    onSuccess: () => { toast.success("Message sent"); detailQuery.refetch(); setMessageText(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const negotiations = listQuery.data?.negotiations || [];
  const detail = detailQuery.data;

  if (selectedId && detail) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Button variant="ghost" onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Negotiations
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{detail.subject}</h1>
            <p className="text-sm text-slate-400">#{detail.negotiationNumber} · {TYPE_LABELS[detail.negotiationType] || detail.negotiationType}</p>
          </div>
          <Badge className={cn("text-xs", STATUS_COLORS[detail.status] || "bg-slate-500/20 text-slate-400")}>{detail.status?.replace(/_/g, " ")}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Initiator</p>
              <p className="text-white font-medium">{detail.initiator?.name || "Unknown"}</p>
              <p className="text-xs text-slate-500">{detail.initiator?.role}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Respondent</p>
              <p className="text-white font-medium">{detail.respondent?.name || "Unknown"}</p>
              <p className="text-xs text-slate-500">{detail.respondent?.role}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Current Offer</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                {detail.currentOffer?.amount ? `$${Number(detail.currentOffer.amount).toLocaleString()}` : "Pending"}
              </p>
              <p className="text-xs text-slate-500">Round {detail.totalRounds || 1}</p>
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1473FF]" />Negotiation Thread
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(detail.messages || []).map((msg: any, i: number) => (
              <div key={i} className={cn("p-3 rounded-xl border", msg.messageType === "accept" ? "border-green-500/30 bg-green-500/5" : msg.messageType === "reject" ? "border-red-500/30 bg-red-500/5" : "border-slate-700/30 bg-slate-900/30")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{msg.sender?.name || "System"}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] bg-slate-700/50 text-slate-300">R{msg.round}</Badge>
                    <span className="text-[10px] text-slate-500">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{msg.content}</p>
                {msg.offerAmount && <p className="text-sm font-bold text-[#1473FF] mt-1">${Number(msg.offerAmount).toLocaleString()}</p>}
              </div>
            ))}

            {detail.status !== "agreed" && detail.status !== "rejected" && detail.status !== "expired" && (
              <div className="pt-3 border-t border-slate-700/30 space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Counter amount..." type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white flex-1" />
                  <Button size="sm" onClick={() => counterMutation.mutate({ negotiationId: selectedId, amount: parseFloat(counterAmount) })} disabled={!counterAmount || counterMutation.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
                    <DollarSign className="w-4 h-4 mr-1" />Counter
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Send a message..." value={messageText} onChange={e => setMessageText(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white flex-1" />
                  <Button size="sm" variant="outline" onClick={() => sendMsgMutation.mutate({ negotiationId: selectedId, content: messageText })} disabled={!messageText || sendMsgMutation.isPending} className="border-slate-600">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptMutation.mutate({ negotiationId: selectedId })} disabled={acceptMutation.isPending} className="bg-green-600 hover:bg-green-700 flex-1">
                    <CheckCircle className="w-4 h-4 mr-1" />Accept Offer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate({ negotiationId: selectedId })} disabled={rejectMutation.isPending} className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1">
                    <XCircle className="w-4 h-4 mr-1" />Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Rate Negotiations</h1>
          <p className="text-slate-400 text-sm mt-1">Negotiate rates, terms, and commitments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Active", value: stats?.active || 0, icon: <Handshake className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
          { label: "Pending", value: stats?.pending || 0, icon: <Clock className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
          { label: "Agreed", value: stats?.agreed || 0, icon: <CheckCircle className="w-5 h-5 text-green-400" />, color: "text-green-400" },
          { label: "Rejected", value: stats?.rejected || 0, icon: <XCircle className="w-5 h-5 text-red-400" />, color: "text-red-400" },
          { label: "Win Rate", value: `${stats?.winRate || 0}%`, icon: <TrendingUp className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
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

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "active", "agreed", "rejected", "expired"].map(f => (
          <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)}
            className={statusFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {f || "All"}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : negotiations.length === 0 ? (
            <div className="p-8 text-center">
              <Handshake className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No negotiations found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {negotiations.map((neg: any) => (
                <button key={neg.id} onClick={() => setSelectedId(neg.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium truncate">{neg.subject}</p>
                      <Badge className={cn("text-[9px] shrink-0", STATUS_COLORS[neg.status])}>{neg.status?.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>#{neg.negotiationNumber}</span>
                      <Badge variant="outline" className="text-[9px] border-slate-600">{TYPE_LABELS[neg.negotiationType] || neg.negotiationType}</Badge>
                      <span>{neg.initiator?.name || "Unknown"} vs {neg.respondent?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Round {neg.totalRounds || 1}</span>
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
