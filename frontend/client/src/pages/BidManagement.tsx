/**
 * BID MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * Theme-aware | Brand gradient | Shipper design standard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Gavel, DollarSign, CheckCircle, XCircle, Clock,
  TrendingUp, Package, Sparkles, Search, Navigation, MapPin, Building2, Eye, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";

export default function BidManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState("all");
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({});

  const bidsQuery = (trpc as any).carriers.getBids.useQuery({ filter });
  const statsQuery = (trpc as any).carriers.getBidStats.useQuery();
  const availableLoadsQuery = (trpc as any).carriers.getAvailableLoads.useQuery({ limit: 5 });

  const submitBidMutation = (trpc as any).carriers.submitBid.useMutation({
    onSuccess: () => { toast.success("Bid submitted"); bidsQuery.refetch(); availableLoadsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const analyzeMutation = (trpc as any).esang.analyzeBidFairness.useMutation();

  const stats = statsQuery.data;

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const statusBadge = (status: string) => {
    const m: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      pending: { cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", icon: <Clock className="w-3 h-3 mr-1" />, label: "Pending" },
      accepted: { cls: "bg-green-500/15 text-green-500 border-green-500/30", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Accepted" },
      rejected: { cls: "bg-red-500/15 text-red-500 border-red-500/30", icon: <XCircle className="w-3 h-3 mr-1" />, label: "Rejected" },
      outbid: { cls: "bg-orange-500/15 text-orange-500 border-orange-500/30", icon: null, label: "Outbid" },
    };
    const s = m[status] || { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: null, label: status };
    return <Badge className={cn("border text-xs font-bold", s.cls)}>{s.icon}{s.label}</Badge>;
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "accepted", label: "Won" },
    { id: "rejected", label: "Lost" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">My Bids</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Track and manage all your load bids</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation("/marketplace")}>
          <Search className="w-4 h-4 mr-2" />Find Loads
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats?.pending || 0, icon: <Clock className="w-5 h-5" />, color: "text-yellow-500", bg: "bg-yellow-500/15" },
          { label: "Accepted", value: stats?.accepted || 0, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/15" },
          { label: "Win Rate", value: `${stats?.winRate || 0}%`, icon: <TrendingUp className="w-5 h-5" />, color: "text-cyan-500", bg: "bg-cyan-500/15" },
          { label: "Avg Bid", value: `$${stats?.avgBid || 0}`, icon: <DollarSign className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  {statsQuery.isLoading ? (
                    <Skeleton className={cn("h-8 w-14 rounded-lg", isLight ? "bg-slate-200" : "")} />
                  ) : (
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Bid on Available Loads ── */}
      {((availableLoadsQuery.data as any)?.length ?? 0) > 0 && (
        <Card className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-blue-200 shadow-sm" : "bg-slate-800/60 border-blue-500/30")}>
          <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 px-5 py-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>Quick Bid — Available Loads</span>
          </div>
          <CardContent className="p-4 space-y-3">
            {(availableLoadsQuery.data as any)?.map((load: any) => (
              <div key={load.id} className={cn("p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", cellCls)}>
                <div className="flex-1">
                  <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>#{load.loadNumber} — {load.origin} → {load.destination}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{load.product} · {load.distance} mi · Target: ${load.targetRate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="$"
                    value={bidAmount[load.id] || ""}
                    onChange={(e: any) => setBidAmount(prev => ({ ...prev, [load.id]: e.target.value }))}
                    className={cn("w-24 rounded-lg h-9 text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700")}
                  />
                  <Button size="sm" variant="outline" className={cn("rounded-lg h-9", isLight ? "border-purple-200 text-purple-600 hover:bg-purple-50" : "bg-purple-500/15 border-purple-500/30 text-purple-400")} onClick={() => analyzeMutation.mutate({ loadId: load.id, bidAmount: parseFloat(bidAmount[load.id] || "0") })}>
                    <Sparkles className="w-3 h-3" />
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg h-9 font-bold" onClick={() => submitBidMutation.mutate({ loadId: load.id, amount: parseFloat(bidAmount[load.id] || "0") })} disabled={!bidAmount[load.id]}>
                    Bid
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              filter === tab.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Bids List ── */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
            <Gavel className="w-5 h-5 text-blue-500" />My Bids
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bidsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: number) => <Skeleton key={i} className={cn("h-24 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
          ) : (bidsQuery.data as any)?.length === 0 ? (
            <div className={cn("text-center py-16", isLight ? "" : "")}>
              <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                <Gavel className="w-8 h-8 text-slate-400" />
              </div>
              <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No bids found</p>
              <p className="text-sm text-slate-400 mt-1">Start bidding on loads from the marketplace</p>
              <Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/marketplace")}>
                <Search className="w-4 h-4 mr-2" />Find Loads
              </Button>
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
              {(bidsQuery.data as any)?.map((bid: any) => (
                <div
                  key={bid.id}
                  className={cn(
                    "p-4 transition-colors cursor-pointer",
                    bid.status === "accepted" && (isLight ? "bg-green-50/50 border-l-3 border-l-green-500" : "bg-green-500/5 border-l-3 border-l-green-500"),
                    isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                  )}
                  onClick={() => bid.loadId && setLocation(`/load/${bid.loadId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>Load #{bid.loadNumber}</p>
                        {statusBadge(bid.status)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{bid.origin}</span>
                        <Navigation className="w-3 h-3 mx-1 rotate-90" />
                        <span>{bid.destination}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Submitted: {bid.submittedAt}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${bid.amount?.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">${bid.perMile}/mi</p>
                      </div>
                      {bid.status === "accepted" && bid.loadId && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-xs h-9"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setLocation(`/contract/sign/${bid.loadId}`); }}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />Sign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
