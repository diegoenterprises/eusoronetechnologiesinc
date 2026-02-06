/**
 * NEGOTIATION CENTER — Thread-based rate & terms negotiation
 * 100% Dynamic - No mock data
 * Tabs: Active | History
 * Features: Initiate, counter-offer, accept, reject, message thread
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, TrendingUp, Clock, CheckCircle, XCircle, ArrowRight,
  DollarSign, Plus, AlertTriangle, Loader2, Send, ChevronRight,
  Handshake, ArrowUpDown, BarChart3, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

function getNegStatusBadge(status: string) {
  const config: Record<string, { className: string; label: string }> = {
    open: { className: "bg-blue-500/20 text-blue-400", label: "Open" },
    awaiting_response: { className: "bg-yellow-500/20 text-yellow-400", label: "Awaiting Response" },
    counter_offered: { className: "bg-purple-500/20 text-purple-400", label: "Counter Offered" },
    agreed: { className: "bg-green-500/20 text-green-400", label: "Agreed" },
    rejected: { className: "bg-red-500/20 text-red-400", label: "Rejected" },
    expired: { className: "bg-orange-500/20 text-orange-400", label: "Expired" },
    cancelled: { className: "bg-slate-500/20 text-slate-400", label: "Cancelled" },
  };
  const c = config[status] || { className: "bg-slate-500/20 text-slate-400", label: status };
  return <Badge className={cn(c.className, "border-0 text-xs")}>{c.label}</Badge>;
}

function getMsgIcon(type: string) {
  switch (type) {
    case "initial_offer": return <DollarSign className="w-4 h-4 text-blue-400" />;
    case "counter_offer": return <ArrowUpDown className="w-4 h-4 text-purple-400" />;
    case "accept": return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "reject": return <XCircle className="w-4 h-4 text-red-400" />;
    case "message": return <MessageSquare className="w-4 h-4 text-slate-400" />;
    default: return <MessageSquare className="w-4 h-4 text-slate-400" />;
  }
}

function StatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType; label: string; value: number | string; color: string; loading: boolean;
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-full", color)}><Icon className="w-5 h-5" /></div>
          <div>
            {loading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold">{value}</p>}
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NegotiationCenter() {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedNegId, setSelectedNegId] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState<number>(0);
  const [messageText, setMessageText] = useState("");
  const [showCounterDialog, setShowCounterDialog] = useState(false);

  const statsQuery = (trpc as any).rateNegotiations.getStats.useQuery();
  const listQuery = (trpc as any).rateNegotiations.list.useQuery({
    status: activeTab === "active" ? "active" : undefined,
    limit: 50,
  });
  const detailQuery = (trpc as any).rateNegotiations.getById.useQuery(
    { id: selectedNegId! },
    { enabled: !!selectedNegId }
  );

  const counterMutation = (trpc as any).rateNegotiations.counterOffer.useMutation({
    onSuccess: () => { detailQuery.refetch(); listQuery.refetch(); statsQuery.refetch(); setShowCounterDialog(false); setCounterAmount(0); },
  });
  const acceptMutation = (trpc as any).rateNegotiations.accept.useMutation({
    onSuccess: () => { detailQuery.refetch(); listQuery.refetch(); statsQuery.refetch(); },
  });
  const rejectMutation = (trpc as any).rateNegotiations.reject.useMutation({
    onSuccess: () => { detailQuery.refetch(); listQuery.refetch(); statsQuery.refetch(); },
  });
  const sendMsgMutation = (trpc as any).rateNegotiations.sendMessage.useMutation({
    onSuccess: () => { detailQuery.refetch(); setMessageText(""); },
  });

  const stats = statsQuery.data;
  const negList = listQuery.data?.negotiations || [];
  const detail = detailQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Negotiation Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Rate and terms negotiations between platform users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Handshake} label="Active" value={stats?.active || 0} color="bg-blue-500/20 text-blue-400" loading={statsQuery.isLoading} />
        <StatCard icon={Clock} label="Pending" value={stats?.pending || 0} color="bg-yellow-500/20 text-yellow-400" loading={statsQuery.isLoading} />
        <StatCard icon={CheckCircle} label="Agreed" value={stats?.agreed || 0} color="bg-green-500/20 text-green-400" loading={statsQuery.isLoading} />
        <StatCard icon={XCircle} label="Rejected" value={stats?.rejected || 0} color="bg-red-500/20 text-red-400" loading={statsQuery.isLoading} />
        <StatCard icon={TrendingUp} label="Win Rate" value={`${stats?.winRate || 0}%`} color="bg-purple-500/20 text-purple-400" loading={statsQuery.isLoading} />
        <StatCard icon={AlertTriangle} label="Expired" value={stats?.expired || 0} color="bg-orange-500/20 text-orange-400" loading={statsQuery.isLoading} />
      </div>

      {/* Main layout: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Negotiation List */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedNegId(null); }}>
            <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-lg w-full">
              <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md text-xs">
                Active
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md text-xs">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="h-[600px]">
            {listQuery.isLoading ? (
              <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : negList.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-8 text-center">
                  <Handshake className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400">No negotiations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {negList.map((neg: any) => (
                  <button
                    key={neg.id}
                    onClick={() => setSelectedNegId(neg.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-colors",
                      selectedNegId === neg.id
                        ? "bg-[#1473FF]/10 border-[#1473FF]/30"
                        : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{neg.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getNegStatusBadge(neg.status)}
                          <span className="text-xs text-slate-500">
                            {neg.negotiationType?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          {neg.currentOffer?.amount && (
                            <span className="text-green-400">${neg.currentOffer.amount.toLocaleString()}</span>
                          )}
                          <span>R{neg.totalRounds || 0}</span>
                          {neg.initiator && <span>with {neg.initiator.name || neg.respondent?.name || "User"}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Negotiation Detail */}
        <div className="lg:col-span-2">
          {!selectedNegId ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[660px] flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Select a negotiation to view details</p>
              </div>
            </Card>
          ) : detailQuery.isLoading ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[660px]">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="space-y-3 mt-6">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              </CardContent>
            </Card>
          ) : detail ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[660px] flex flex-col">
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{detail.subject}</h2>
                      {getNegStatusBadge(detail.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {detail.negotiationNumber} | {detail.negotiationType?.replace(/_/g, " ")} | Round {detail.totalRounds || 0}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>{detail.initiator?.name || "Initiator"}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{detail.respondent?.name || "Respondent"}</span>
                    </div>
                  </div>
                  {detail.currentOffer?.amount && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Current Offer</p>
                      <p className="text-xl font-bold text-green-400">${detail.currentOffer.amount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {(detail.messages || []).map((msg: any) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="mt-1 shrink-0">{getMsgIcon(msg.messageType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{msg.sender?.name || "User"}</span>
                          <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                          <Badge className="bg-slate-700/50 text-slate-400 border-0 text-[10px]">R{msg.round}</Badge>
                        </div>
                        {msg.offerAmount && (
                          <div className="mt-1 p-2 rounded-lg bg-slate-900/50 border border-slate-700/30 inline-block">
                            <span className="text-green-400 font-semibold">${parseFloat(msg.offerAmount).toLocaleString()}</span>
                            {msg.offerRateType && <span className="text-xs text-slate-400 ml-1">{msg.offerRateType}</span>}
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm text-slate-300 mt-1">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Actions */}
              {(detail.status === "open" || detail.status === "awaiting_response" || detail.status === "counter_offered") && (
                <div className="p-4 border-t border-slate-700/50 space-y-3">
                  {/* Message input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Send a message..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      className="bg-slate-900/50 border-slate-700/50 rounded-lg flex-1"
                      onKeyDown={e => {
                        if (e.key === "Enter" && messageText.trim()) {
                          sendMsgMutation.mutate({ negotiationId: detail.id, content: messageText });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 rounded-lg"
                      onClick={() => messageText.trim() && sendMsgMutation.mutate({ negotiationId: detail.id, content: messageText })}
                      disabled={!messageText.trim() || sendMsgMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Dialog open={showCounterDialog} onOpenChange={setShowCounterDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-lg flex-1">
                          <ArrowUpDown className="w-4 h-4 mr-2" />Counter Offer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle>Submit Counter Offer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label className="text-sm text-slate-300">Counter Amount ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={counterAmount || ""}
                              onChange={e => setCounterAmount(parseFloat(e.target.value) || 0)}
                              className="mt-1.5 bg-slate-800/50 border-slate-700/50 rounded-lg"
                            />
                          </div>
                          <Button
                            className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
                            onClick={() => counterMutation.mutate({
                              negotiationId: detail.id,
                              amount: counterAmount,
                              message: `Counter offer: $${counterAmount.toLocaleString()}`,
                            })}
                            disabled={!counterAmount || counterMutation.isPending}
                          >
                            {counterMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpDown className="w-4 h-4 mr-2" />}
                            Submit Counter
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      className="bg-green-600 hover:bg-green-700 rounded-lg flex-1"
                      onClick={() => acceptMutation.mutate({ negotiationId: detail.id, message: "Accepted." })}
                      disabled={acceptMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg flex-1"
                      onClick={() => rejectMutation.mutate({ negotiationId: detail.id, reason: "Not acceptable." })}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolved state */}
              {(detail.status === "agreed" || detail.status === "rejected" || detail.status === "expired") && (
                <div className={cn(
                  "p-4 border-t",
                  detail.status === "agreed" ? "border-green-500/30 bg-green-500/5" : "border-slate-700/50"
                )}>
                  <div className="flex items-center gap-2">
                    {detail.status === "agreed" ? (
                      <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-sm text-green-400 font-medium">Negotiation resolved - Terms agreed</span></>
                    ) : detail.status === "rejected" ? (
                      <><XCircle className="w-5 h-5 text-red-400" /><span className="text-sm text-red-400 font-medium">Negotiation rejected</span></>
                    ) : (
                      <><AlertTriangle className="w-5 h-5 text-orange-400" /><span className="text-sm text-orange-400 font-medium">Negotiation expired</span></>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
