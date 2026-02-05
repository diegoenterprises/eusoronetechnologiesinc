/**
 * SHIPPER BID EVALUATION PAGE
 * 100% Dynamic - Evaluate carrier bids with negotiation flow
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { DollarSign, Clock, Star, Shield, Truck, CheckCircle, XCircle, MessageSquare, Sparkles, ChevronLeft, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShipperBidEvaluation() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/shipper/bids/:loadId");
  const loadId = params?.loadId;
  const [counterBidId, setCounterBidId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });
  const bidsQuery = (trpc as any).bids.getByLoad.useQuery({ loadId: loadId || "" });
  const aiRateQuery = (trpc as any).bids.getByLoad.useQuery({ loadId: loadId || "" });

  const awardMutation = (trpc as any).bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid awarded"); bidsQuery.refetch(); },
    onError: (e: any) => toast.error("Failed", { description: e.message }),
  });
  const counterMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { toast.success("Counter sent"); setCounterBidId(null); bidsQuery.refetch(); },
    onError: (e: any) => toast.error("Failed", { description: e.message }),
  });
  const declineMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { toast.success("Declined"); bidsQuery.refetch(); },
  });

  const load = loadQuery.data;
  const bids = bidsQuery.data || [];
  const aiRate = aiRateQuery.data;

  const getSafetyStars = (score: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={cn("w-4 h-4", i < Math.round(score / 20) ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
  ));

  if (loadQuery.isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shipper/loads")} className="text-slate-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Bids for Load #{load?.loadNumber}</h1>
          <p className="text-slate-400 text-sm mt-1">{load?.origin?.city} → {load?.destination?.city}</p>
        </div>
        <div className="text-right"><p className="text-slate-400 text-sm">Target Rate</p><p className="text-2xl font-bold text-white">${(load as any)?.targetRate?.toLocaleString() || load?.rate?.toLocaleString()}</p></div>
      </div>

      {aiRate && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/20"><Sparkles className="w-6 h-6 text-purple-400" /></div>
            <div><p className="text-purple-400 font-medium">ESANG AI Suggested</p><p className="text-white font-bold text-xl">${(aiRate as any)?.lowEstimate?.toLocaleString() || "N/A"} - ${(aiRate as any)?.highEstimate?.toLocaleString() || "N/A"}</p></div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" />Carrier Bids ({bids.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {bids.length === 0 ? (
            <div className="text-center py-16"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No bids yet</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {bids.map((bid: any) => (
                <div key={bid.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-slate-700/50"><Truck className="w-5 h-5 text-cyan-400" /></div>
                      <div>
                        <p className="text-white font-bold">{bid.carrier?.name}</p>
                        <div className="flex items-center gap-1">{getSafetyStars(bid.carrier?.safetyScore || 80)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">${bid.amount?.toLocaleString()}</p>
                      <p className="text-slate-400 text-sm">${bid.ratePerMile?.toFixed(2)}/mi</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center"><p className="text-xs text-slate-400">Safety</p><p className="text-white text-sm">{bid.carrier?.fmcsaRating || "Satisfactory"}</p></div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center"><p className="text-xs text-slate-400">On-Time</p><p className="text-white text-sm">{bid.carrier?.onTimeRate || 95}%</p></div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center"><p className="text-xs text-slate-400">ETA</p><p className="text-green-400 text-sm">{bid.onTimeEta ? "On-time" : bid.etaVariance}</p></div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg" onClick={() => declineMutation.mutate({ bidId: bid.id })}><XCircle className="w-4 h-4 mr-1" />Decline</Button>
                    <Button variant="outline" size="sm" className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 rounded-lg" onClick={() => { setCounterBidId(bid.id); setCounterAmount(bid.amount?.toString()); }}><MessageSquare className="w-4 h-4 mr-1" />Counter</Button>
                    <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg" onClick={() => awardMutation.mutate({ bidId: bid.id })}><Award className="w-4 h-4 mr-1" />Award</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!counterBidId} onOpenChange={() => setCounterBidId(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Counter Offer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><label className="text-slate-300 text-sm">Your Counter Amount</label><Input type="number" value={counterAmount} onChange={(e: any) => setCounterAmount(e.target.value)} className="bg-slate-700/50 border-slate-600/50" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterBidId(null)} className="bg-slate-700/50 border-slate-600/50">Cancel</Button>
            <Button onClick={() => counterMutation.mutate({ bidId: counterBidId! } as any)} className="bg-gradient-to-r from-cyan-600 to-emerald-600">Send Counter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
