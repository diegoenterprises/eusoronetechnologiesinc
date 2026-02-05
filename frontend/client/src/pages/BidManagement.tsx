/**
 * BID MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  TrendingUp, Package, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BidManagement() {
  const [filter, setFilter] = useState("pending");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "outbid": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Outbid</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Bid Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your load bids</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.accepted || 0}</p>}<p className="text-xs text-slate-400">Accepted</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><TrendingUp className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.winRate}%</p>}<p className="text-xs text-slate-400">Win Rate</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.avgBid || 0}</p>}<p className="text-xs text-slate-400">Avg Bid</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {((availableLoadsQuery.data as any)?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" />Available Loads</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(availableLoadsQuery.data as any)?.map((load: any) => (
              <div key={load.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">#{load.loadNumber} - {load.origin} → {load.destination}</p>
                  <p className="text-xs text-slate-500">{load.product} | {load.distance} mi | Target: ${load.targetRate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Your bid" value={bidAmount[load.id] || ""} onChange={(e: any) => setBidAmount(prev => ({ ...prev, [load.id]: e.target.value }))} className="w-24 bg-slate-700/50 border-slate-600/50 rounded-lg h-8 text-sm" />
                  <Button size="sm" variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-400 rounded-lg h-8" onClick={() => analyzeMutation.mutate({ loadId: load.id, bidAmount: parseFloat(bidAmount[load.id] || "0") })}>
                    <Sparkles className="w-3 h-3" />
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg h-8" onClick={() => submitBidMutation.mutate({ loadId: load.id, amount: parseFloat(bidAmount[load.id] || "0") })} disabled={!bidAmount[load.id]}>
                    Bid
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Gavel className="w-5 h-5 text-cyan-400" />My Bids</CardTitle></CardHeader>
        <CardContent className="p-0">
          {bidsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (bidsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Gavel className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No bids found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(bidsQuery.data as any)?.map((bid: any) => (
                <div key={bid.id} className={cn("p-4", bid.status === "accepted" && "bg-green-500/5 border-l-2 border-green-500")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">Load #{bid.loadNumber}</p>
                        {getStatusBadge(bid.status)}
                      </div>
                      <p className="text-sm text-slate-400">{bid.origin} → {bid.destination}</p>
                      <p className="text-xs text-slate-500">Submitted: {bid.submittedAt}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${bid.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">${bid.perMile}/mi</p>
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
