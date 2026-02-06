/**
 * BIDDING DASHBOARD — Enhanced load bidding system
 * 100% Dynamic - No mock data
 * Tabs: My Bids | Received Bids | Auto-Accept Rules
 * Features: Submit, counter, accept, reject, bid chains, auto-accept
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Gavel, TrendingUp, Clock, CheckCircle, XCircle, ArrowRight,
  DollarSign, Plus, Trash2, AlertTriangle, Loader2, BarChart3,
  Shield, Settings, ChevronRight, ArrowUpDown, Send, RefreshCw, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

function getStatusBadge(status: string) {
  const config: Record<string, { className: string; label: string }> = {
    pending: { className: "bg-yellow-500/20 text-yellow-400", label: "Pending" },
    accepted: { className: "bg-green-500/20 text-green-400", label: "Accepted" },
    rejected: { className: "bg-red-500/20 text-red-400", label: "Rejected" },
    countered: { className: "bg-purple-500/20 text-purple-400", label: "Countered" },
    withdrawn: { className: "bg-slate-500/20 text-slate-400", label: "Withdrawn" },
    expired: { className: "bg-orange-500/20 text-orange-400", label: "Expired" },
    auto_accepted: { className: "bg-cyan-500/20 text-cyan-400", label: "Auto-Accepted" },
  };
  const c = config[status] || { className: "bg-slate-500/20 text-slate-400", label: status };
  return <Badge className={cn(c.className, "border-0 text-xs")}>{c.label}</Badge>;
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

export default function BiddingDashboard() {
  const [activeTab, setActiveTab] = useState("my-bids");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);

  // Auto-accept rule form
  const [ruleName, setRuleName] = useState("");
  const [ruleMaxRate, setRuleMaxRate] = useState<number>(0);
  const [ruleMaxRPM, setRuleMaxRPM] = useState<number>(0);
  const [ruleMaxTransit, setRuleMaxTransit] = useState<number>(0);

  const statsQuery = (trpc as any).loadBidding.getStats.useQuery();
  const myBidsQuery = (trpc as any).loadBidding.getMyBids.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const receivedQuery = (trpc as any).loadBidding.getReceivedBids.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const rulesQuery = (trpc as any).loadBidding.listAutoAcceptRules.useQuery();

  const acceptMutation = (trpc as any).loadBidding.accept.useMutation({
    onSuccess: () => { receivedQuery.refetch(); statsQuery.refetch(); },
  });
  const rejectMutation = (trpc as any).loadBidding.reject.useMutation({
    onSuccess: () => { receivedQuery.refetch(); statsQuery.refetch(); },
  });
  const withdrawMutation = (trpc as any).loadBidding.withdraw.useMutation({
    onSuccess: () => { myBidsQuery.refetch(); statsQuery.refetch(); },
  });
  const createRuleMutation = (trpc as any).loadBidding.createAutoAcceptRule.useMutation({
    onSuccess: () => { rulesQuery.refetch(); setShowNewRuleDialog(false); setRuleName(""); },
  });
  const toggleRuleMutation = (trpc as any).loadBidding.toggleAutoAcceptRule.useMutation({
    onSuccess: () => rulesQuery.refetch(),
  });
  const deleteRuleMutation = (trpc as any).loadBidding.deleteAutoAcceptRule.useMutation({
    onSuccess: () => rulesQuery.refetch(),
  });

  const stats = statsQuery.data;
  const myBids = myBidsQuery.data?.bids || [];
  const receivedBids = receivedQuery.data || [];
  const rules = rulesQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Bidding Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Submit bids, manage counter-offers, and configure auto-accept rules
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Send} label="Submitted" value={stats?.submitted || 0} color="bg-blue-500/20 text-blue-400" loading={statsQuery.isLoading} />
        <StatCard icon={Clock} label="Pending" value={stats?.pending || 0} color="bg-yellow-500/20 text-yellow-400" loading={statsQuery.isLoading} />
        <StatCard icon={CheckCircle} label="Accepted" value={stats?.accepted || 0} color="bg-green-500/20 text-green-400" loading={statsQuery.isLoading} />
        <StatCard icon={TrendingUp} label="Win Rate" value={`${stats?.winRate || 0}%`} color="bg-purple-500/20 text-purple-400" loading={statsQuery.isLoading} />
        <StatCard icon={ArrowUpDown} label="Received" value={stats?.received || 0} color="bg-cyan-500/20 text-cyan-400" loading={statsQuery.isLoading} />
        <StatCard icon={DollarSign} label="Avg Bid" value={`$${stats?.avgBid || 0}`} color="bg-emerald-500/20 text-emerald-400" loading={statsQuery.isLoading} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-lg">
          <TabsTrigger value="my-bids" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <Send className="w-4 h-4 mr-2" />My Bids
          </TabsTrigger>
          <TabsTrigger value="received" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <ArrowUpDown className="w-4 h-4 mr-2" />Received Bids
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <Zap className="w-4 h-4 mr-2" />Auto-Accept Rules
          </TabsTrigger>
        </TabsList>

        {/* Filter bar */}
        <div className="flex gap-3 mt-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="countered">Countered</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* MY BIDS TAB */}
        <TabsContent value="my-bids" className="space-y-3 mt-4">
          {myBidsQuery.isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : myBids.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <Send className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No bids submitted</h3>
                <p className="text-sm text-slate-500 mt-1">Browse the load board to find loads to bid on</p>
              </CardContent>
            </Card>
          ) : (
            myBids.map((bid: any) => (
              <Card key={bid.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="p-2.5 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 shrink-0">
                        <Gavel className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">Load #{bid.loadId}</span>
                          {getStatusBadge(bid.status)}
                          {bid.bidRound > 1 && <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">Round {bid.bidRound}</Badge>}
                          {bid.isAutoAccepted && <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs"><Zap className="w-3 h-3 mr-0.5" />Auto</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="text-green-400 font-medium">${parseFloat(bid.bidAmount).toLocaleString()} {bid.rateType}</span>
                          {bid.equipmentType && <><span className="text-slate-600">|</span><span>{bid.equipmentType}</span></>}
                          {bid.transitTimeDays && <><span className="text-slate-600">|</span><span>{bid.transitTimeDays}d transit</span></>}
                          <span className="text-slate-600">|</span>
                          <span>{new Date(bid.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bid.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-7"
                          onClick={() => withdrawMutation.mutate({ bidId: bid.id })}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* RECEIVED BIDS TAB */}
        <TabsContent value="received" className="space-y-3 mt-4">
          {receivedQuery.isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : receivedBids.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <ArrowUpDown className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No bids received</h3>
                <p className="text-sm text-slate-500 mt-1">Post loads to start receiving bids from carriers</p>
              </CardContent>
            </Card>
          ) : (
            receivedBids.map((bid: any) => (
              <Card key={bid.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 shrink-0">
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">Load #{bid.loadId}</span>
                          {getStatusBadge(bid.status)}
                          <span className="text-xs text-slate-400">from User #{bid.bidderUserId}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="text-green-400 font-medium text-sm">${parseFloat(bid.bidAmount).toLocaleString()}</span>
                          <span>{bid.rateType}</span>
                          {bid.conditions && <><span className="text-slate-600">|</span><span className="truncate max-w-[200px]">{bid.conditions}</span></>}
                        </div>
                      </div>
                    </div>
                    {bid.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 rounded-lg text-xs h-7"
                          onClick={() => acceptMutation.mutate({ bidId: bid.id })}
                          disabled={acceptMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-7"
                          onClick={() => rejectMutation.mutate({ bidId: bid.id })}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* AUTO-ACCEPT RULES TAB */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Set criteria to automatically accept bids that meet your requirements
              </p>
            </div>
            <Dialog open={showNewRuleDialog} onOpenChange={setShowNewRuleDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />New Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle>Create Auto-Accept Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm text-slate-300">Rule Name</Label>
                    <Input value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Houston Lanes Under $3/mi" className="mt-1.5 bg-slate-800/50 border-slate-700/50 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-300">Max Total Rate ($)</Label>
                      <Input type="number" value={ruleMaxRate || ""} onChange={e => setRuleMaxRate(parseFloat(e.target.value) || 0)} className="mt-1.5 bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-300">Max Rate/Mile ($)</Label>
                      <Input type="number" step="0.01" value={ruleMaxRPM || ""} onChange={e => setRuleMaxRPM(parseFloat(e.target.value) || 0)} className="mt-1.5 bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300">Max Transit Days</Label>
                    <Input type="number" value={ruleMaxTransit || ""} onChange={e => setRuleMaxTransit(parseInt(e.target.value) || 0)} className="mt-1.5 bg-slate-800/50 border-slate-700/50 rounded-lg" />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
                    onClick={() => createRuleMutation.mutate({
                      name: ruleName,
                      maxRate: ruleMaxRate || undefined,
                      maxRatePerMile: ruleMaxRPM || undefined,
                      maxTransitDays: ruleMaxTransit || undefined,
                    })}
                    disabled={!ruleName || createRuleMutation.isPending}
                  >
                    {createRuleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {rulesQuery.isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : rules.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <Zap className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No auto-accept rules</h3>
                <p className="text-sm text-slate-500 mt-1">Create rules to automatically accept qualifying bids</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule: any) => (
                <Card key={rule.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={cn("p-2.5 rounded-full", rule.isActive ? "bg-green-500/20" : "bg-slate-700/50")}>
                          <Zap className={cn("w-5 h-5", rule.isActive ? "text-green-400" : "text-slate-500")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{rule.name}</span>
                            <Badge className={cn("border-0 text-xs", rule.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-500")}>
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                            {rule.maxRate && <span>Max: ${parseFloat(rule.maxRate).toLocaleString()}</span>}
                            {rule.maxRatePerMile && <span>Max RPM: ${parseFloat(rule.maxRatePerMile)}</span>}
                            {rule.maxTransitDays && <span>Max Transit: {rule.maxTransitDays}d</span>}
                            <span className="text-cyan-400">{rule.totalAutoAccepted || 0} auto-accepted</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked: boolean) => toggleRuleMutation.mutate({ id: rule.id, isActive: checked })}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                          onClick={() => deleteRuleMutation.mutate({ id: rule.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
