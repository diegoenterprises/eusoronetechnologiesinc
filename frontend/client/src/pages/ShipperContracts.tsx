/**
 * SHIPPER CONTRACTS & RATE HUB (Task 4.2.1)
 * ══════════════════════════════════════════════════
 * Absorbs: ShipperContracts + RateManagement + RateNegotiations
 *
 * Tabs:
 *   Contracts — shipper agreements list + stats
 *   Rates     — lane / spot / contract rates CRUD
 *   Negotiations — thread-based rate negotiation threads
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, Plus, Download, DollarSign,
  CheckCircle, Clock, Eye, AlertTriangle, Calendar,
  Edit, Trash2, TrendingUp, MapPin, Handshake,
  XCircle, Send, ArrowLeft, MessageSquare, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ConfirmationDialog";

type MainTab = "contracts" | "rates" | "negotiations";

const STATUS_NEG_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  awaiting_response: "bg-yellow-500/20 text-yellow-400",
  counter_offered: "bg-orange-500/20 text-orange-400",
  agreed: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-slate-500/20 text-slate-400",
};

const NEG_TYPE_LABELS: Record<string, string> = {
  load_rate: "Load Rate",
  lane_rate: "Lane Rate",
  contract_terms: "Contract Terms",
  fuel_surcharge: "Fuel Surcharge",
  accessorial_rates: "Accessorial Rates",
  volume_commitment: "Volume Commitment",
  payment_terms: "Payment Terms",
  general: "General",
};

export default function ShipperContracts() {
  const [, setLocation] = useLocation();
  const [mainTab, setMainTab] = useState<MainTab>("contracts");

  // ── Contracts state ──
  const [contractSearch, setContractSearch] = useState("");
  const [contractStatus, setContractStatus] = useState("all");

  // ── Rates state ──
  const [rateSearch, setRateSearch] = useState("");
  const [rateType, setRateType] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Negotiations state ──
  const [negStatusFilter, setNegStatusFilter] = useState("");
  const [selectedNegId, setSelectedNegId] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [messageText, setMessageText] = useState("");

  // ═══ DATA QUERIES ═══

  // Contracts
  const contractsQuery = (trpc as any).shipperContracts?.list?.useQuery?.({ status: contractStatus === "all" ? undefined : contractStatus, limit: 50 });
  const contractSummaryQuery = (trpc as any).shipperContracts?.getSummary?.useQuery?.();

  // Rates
  const ratesQuery = (trpc as any).rates?.getAll?.useQuery?.({ search: rateSearch, type: rateType });
  const rateStatsQuery = (trpc as any).rates?.getStats?.useQuery?.();

  // Negotiations
  const negStatsQuery = (trpc as any).rateNegotiations?.getStats?.useQuery?.();
  const negListQuery = (trpc as any).rateNegotiations?.list?.useQuery?.({ status: negStatusFilter || undefined, limit: 50 });
  const negDetailQuery = (trpc as any).rateNegotiations?.getById?.useQuery?.(
    { id: selectedNegId! },
    { enabled: !!selectedNegId }
  );

  // ═══ MUTATIONS ═══

  const rateDeleteMutation = (trpc as any).rates?.delete?.useMutation?.({
    onSuccess: () => { toast.success("Rate deleted"); ratesQuery?.refetch?.(); },
    onError: (e: any) => toast.error("Failed", { description: e.message }),
  });

  const negCounterMutation = (trpc as any).rateNegotiations?.counterOffer?.useMutation?.({
    onSuccess: () => { toast.success("Counter-offer sent"); negDetailQuery?.refetch?.(); negListQuery?.refetch?.(); setCounterAmount(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const negAcceptMutation = (trpc as any).rateNegotiations?.accept?.useMutation?.({
    onSuccess: () => { toast.success("Offer accepted"); negDetailQuery?.refetch?.(); negListQuery?.refetch?.(); },
    onError: (e: any) => toast.error(e.message),
  });
  const negRejectMutation = (trpc as any).rateNegotiations?.reject?.useMutation?.({
    onSuccess: () => { toast.success("Negotiation rejected"); negDetailQuery?.refetch?.(); negListQuery?.refetch?.(); },
    onError: (e: any) => toast.error(e.message),
  });
  const negSendMsgMutation = (trpc as any).rateNegotiations?.sendMessage?.useMutation?.({
    onSuccess: () => { toast.success("Message sent"); negDetailQuery?.refetch?.(); setMessageText(""); },
    onError: (e: any) => toast.error(e.message),
  });

  // ═══ DERIVED DATA ═══

  const contractSummary = contractSummaryQuery?.data;
  const rateStats = rateStatsQuery?.data;
  const negStats = negStatsQuery?.data;
  const negotiations = negListQuery?.data?.negotiations || [];
  const negDetail = negDetailQuery?.data;

  const filteredContracts = useMemo(() =>
    (contractsQuery?.data as any[])?.filter((c: any) =>
      !contractSearch || c.shipperName?.toLowerCase().includes(contractSearch.toLowerCase()) || c.contractNumber?.toLowerCase().includes(contractSearch.toLowerCase())
    ) || [],
  [contractsQuery?.data, contractSearch]);

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "expiring": return <Badge className="bg-orange-500/20 text-orange-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  // ── Tab counts for badges ──
  const tabCounts = {
    contracts: contractSummary?.total || 0,
    rates: rateStats?.totalRates || 0,
    negotiations: negStats?.active || 0,
  };

  // ═══════════════════════════════════════════════════════════
  // ═══ NEGOTIATION DETAIL VIEW ═══
  // ═══════════════════════════════════════════════════════════

  if (mainTab === "negotiations" && selectedNegId && negDetail) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Button variant="ghost" onClick={() => setSelectedNegId(null)} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Negotiations
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{negDetail.subject}</h1>
            <p className="text-sm text-slate-400">#{negDetail.negotiationNumber} -- {NEG_TYPE_LABELS[negDetail.negotiationType] || negDetail.negotiationType}</p>
          </div>
          <Badge className={cn("text-xs", STATUS_NEG_COLORS[negDetail.status] || "bg-slate-500/20 text-slate-400")}>{negDetail.status?.replace(/_/g, " ")}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 uppercase mb-1">Initiator</p>
              <p className="text-white font-medium">{negDetail.initiator?.name || "Unknown"}</p>
              <p className="text-xs text-slate-500">{negDetail.initiator?.role}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 uppercase mb-1">Respondent</p>
              <p className="text-white font-medium">{negDetail.respondent?.name || "Unknown"}</p>
              <p className="text-xs text-slate-500">{negDetail.respondent?.role}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 uppercase mb-1">Current Offer</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                {negDetail.currentOffer?.amount ? `$${Number(negDetail.currentOffer.amount).toLocaleString()}` : "Pending"}
              </p>
              <p className="text-xs text-slate-500">Round {negDetail.totalRounds || 1}</p>
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
            {(negDetail.messages || []).map((msg: any, i: number) => (
              <div key={i} className={cn("p-3 rounded-xl border", msg.messageType === "accept" ? "border-green-500/30 bg-green-500/5" : msg.messageType === "reject" ? "border-red-500/30 bg-red-500/5" : "border-slate-700/30 bg-slate-900/30")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{msg.sender?.name || "System"}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-slate-700/50 text-slate-300">R{msg.round}</Badge>
                    <span className="text-xs text-slate-500">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{msg.content}</p>
                {msg.offerAmount && <p className="text-sm font-bold text-[#1473FF] mt-1">${Number(msg.offerAmount).toLocaleString()}</p>}
              </div>
            ))}

            {negDetail.status !== "agreed" && negDetail.status !== "rejected" && negDetail.status !== "expired" && (
              <div className="pt-3 border-t border-slate-700/30 space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Counter amount..." type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white flex-1" />
                  <Button size="sm" onClick={() => negCounterMutation?.mutate?.({ negotiationId: selectedNegId, amount: parseFloat(counterAmount) })} disabled={!counterAmount || negCounterMutation?.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
                    <DollarSign className="w-4 h-4 mr-1" />Counter
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Send a message..." value={messageText} onChange={e => setMessageText(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white flex-1" />
                  <Button size="sm" variant="outline" onClick={() => negSendMsgMutation?.mutate?.({ negotiationId: selectedNegId, content: messageText })} disabled={!messageText || negSendMsgMutation?.isPending} className="border-slate-600">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => negAcceptMutation?.mutate?.({ negotiationId: selectedNegId })} disabled={negAcceptMutation?.isPending} className="bg-green-600 hover:bg-green-700 flex-1">
                    <CheckCircle className="w-4 h-4 mr-1" />Accept Offer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => negRejectMutation?.mutate?.({ negotiationId: selectedNegId })} disabled={negRejectMutation?.isPending} className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1">
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

  // ═══════════════════════════════════════════════════════════
  // ═══ MAIN VIEW ═══
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Contracts & Rates
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage contracts, lane rates, and negotiations</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />{mainTab === "contracts" ? "New Contract" : mainTab === "rates" ? "Add Rate" : "Start Negotiation"}
        </Button>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div className="flex items-center gap-1 border-b border-slate-700/50 pb-px">
        {([
          { key: "contracts" as MainTab, label: "Contracts", icon: FileText, count: tabCounts.contracts },
          { key: "rates" as MainTab, label: "Rates", icon: DollarSign, count: tabCounts.rates },
          { key: "negotiations" as MainTab, label: "Negotiations", icon: Handshake, count: tabCounts.negotiations },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
              mainTab === tab.key
                ? "text-white border-[#1473FF] bg-white/[0.04]"
                : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.02]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <Badge className={cn("text-xs px-1.5 border-0 ml-1", mainTab === tab.key ? "bg-[#1473FF]/20 text-[#1473FF]" : "bg-slate-700/50 text-slate-400")}>
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* ═══ CONTRACTS TAB ═══ */}
      {/* ════════════════════════════════════════════ */}
      {mainTab === "contracts" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: contractSummary?.total || 0, icon: FileText, iconColor: "text-blue-400", bgColor: "bg-blue-500/20", valueColor: "text-blue-400" },
              { label: "Active", value: contractSummary?.active || 0, icon: CheckCircle, iconColor: "text-green-400", bgColor: "bg-green-500/20", valueColor: "text-green-400" },
              { label: "Expiring Soon", value: contractSummary?.expiringSoon || 0, icon: AlertTriangle, iconColor: "text-orange-400", bgColor: "bg-orange-500/20", valueColor: "text-orange-400" },
              { label: "Total Value", value: `$${(contractSummary?.totalValue || 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-emerald-400", bgColor: "bg-emerald-500/20", valueColor: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
            ].map(s => (
              <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-full", s.bgColor)}><s.icon className={cn("w-6 h-6", s.iconColor)} /></div>
                    <div>
                      {contractSummaryQuery?.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", s.valueColor)}>{s.value}</p>}
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={contractSearch} onChange={(e: any) => setContractSearch(e.target.value)} placeholder="Search contracts..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
            </div>
            <Select value={contractStatus} onValueChange={setContractStatus}>
              <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contract list */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {contractsQuery?.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredContracts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center"><FileText className="w-10 h-10 text-slate-500" /></div>
                  <p className="text-slate-400 text-lg">No contracts found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredContracts.map((contract: any) => (
                    <div key={contract.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", contract.status === "expiring" && "bg-orange-500/5 border-l-2 border-orange-500")} onClick={() => setLocation(`/shipper-contracts/${contract.id}`)}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{contract.shipperName}</p>
                            {getContractStatusBadge(contract.status)}
                          </div>
                          <p className="text-sm text-slate-400">Contract: {contract.contractNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${contract.annualValue?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Annual Value</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Start: {contract.startDate}</span>
                          <span>End: {contract.endDate}</span>
                          <span>{contract.lanes} lanes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white"><Download className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* ═══ RATES TAB (absorbed from RateManagement) ═══ */}
      {/* ════════════════════════════════════════════ */}
      {mainTab === "rates" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Rates", value: rateStats?.totalRates || 0, icon: DollarSign, iconColor: "text-cyan-400", bgColor: "bg-cyan-500/20", valueColor: "text-cyan-400" },
              { label: "Avg Rate/Mi", value: `$${rateStats?.avgRate || 0}`, icon: TrendingUp, iconColor: "text-green-400", bgColor: "bg-green-500/20", valueColor: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
              { label: "Lanes", value: rateStats?.lanes || 0, icon: MapPin, iconColor: "text-purple-400", bgColor: "bg-purple-500/20", valueColor: "text-purple-400" },
              { label: "Highest", value: `$${rateStats?.highestRate || 0}`, icon: DollarSign, iconColor: "text-yellow-400", bgColor: "bg-yellow-500/20", valueColor: "text-yellow-400" },
            ].map(s => (
              <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-full", s.bgColor)}><s.icon className={cn("w-6 h-6", s.iconColor)} /></div>
                    <div>
                      {rateStatsQuery?.isLoading ? <Skeleton className="h-8 w-16" /> : <p className={cn("text-2xl font-bold", s.valueColor)}>{s.value}</p>}
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={rateSearch} onChange={(e: any) => setRateSearch(e.target.value)} placeholder="Search rates..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
            </div>
            <Select value={rateType} onValueChange={setRateType}>
              <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rates list */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-cyan-400" />Rates</CardTitle></CardHeader>
            <CardContent className="p-0">
              {ratesQuery?.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : (ratesQuery?.data as any)?.length === 0 ? (
                <div className="text-center py-16"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No rates found</p></div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(ratesQuery?.data as any)?.map((rate: any) => (
                    <div key={rate.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", rate.type === "contract" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                          <DollarSign className={cn("w-5 h-5", rate.type === "contract" ? "text-green-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-bold">{rate.origin} → {rate.destination}</p>
                            <Badge className={cn("border-0", rate.type === "contract" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>{rate.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>{rate.distance} mi</span>
                            <span>{rate.equipment}</span>
                            {rate.customer && <span>Customer: {rate.customer}</span>}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                            <span>Valid: {rate.validFrom} - {rate.validTo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${rate.ratePerMile}/mi</p>
                          <p className="text-sm text-slate-500">Total: ${rate.totalRate?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg" onClick={() => setDeleteId(rate.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DeleteConfirmationDialog
            open={!!deleteId}
            onOpenChange={(open) => !open && setDeleteId(null)}
            itemName="this rate"
            onConfirm={() => { if (deleteId) rateDeleteMutation?.mutate?.({ id: deleteId }); setDeleteId(null); }}
            isLoading={rateDeleteMutation?.isPending}
          />
        </>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* ═══ NEGOTIATIONS TAB (absorbed from RateNegotiations) ═══ */}
      {/* ════════════════════════════════════════════ */}
      {mainTab === "negotiations" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Active", value: negStats?.active || 0, icon: Handshake, iconColor: "text-blue-400", color: "text-blue-400" },
              { label: "Pending", value: negStats?.pending || 0, icon: Clock, iconColor: "text-yellow-400", color: "text-yellow-400" },
              { label: "Agreed", value: negStats?.agreed || 0, icon: CheckCircle, iconColor: "text-green-400", color: "text-green-400" },
              { label: "Rejected", value: negStats?.rejected || 0, icon: XCircle, iconColor: "text-red-400", color: "text-red-400" },
              { label: "Win Rate", value: `${negStats?.winRate || 0}%`, icon: TrendingUp, iconColor: "text-purple-400", color: "text-purple-400" },
            ].map(s => (
              <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-slate-700/30"><s.icon className={cn("w-5 h-5", s.iconColor)} /></div>
                    <div>
                      {negStatsQuery?.isLoading ? <Skeleton className="h-7 w-10" /> : <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>}
                      <p className="text-xs text-slate-400 uppercase">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {["", "active", "agreed", "rejected", "expired"].map(f => (
              <Button key={f} size="sm" variant={negStatusFilter === f ? "default" : "outline"} onClick={() => setNegStatusFilter(f)}
                className={negStatusFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
                {f || "All"}
              </Button>
            ))}
          </div>

          {/* Negotiations list */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {negListQuery?.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : negotiations.length === 0 ? (
                <div className="p-8 text-center"><Handshake className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No negotiations found</p></div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {negotiations.map((neg: any) => (
                    <button key={neg.id} onClick={() => setSelectedNegId(neg.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium truncate">{neg.subject}</p>
                          <Badge className={cn("text-xs shrink-0", STATUS_NEG_COLORS[neg.status])}>{neg.status?.replace(/_/g, " ")}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>#{neg.negotiationNumber}</span>
                          <Badge variant="outline" className="text-xs border-slate-600">{NEG_TYPE_LABELS[neg.negotiationType] || neg.negotiationType}</Badge>
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
        </>
      )}
    </div>
  );
}
