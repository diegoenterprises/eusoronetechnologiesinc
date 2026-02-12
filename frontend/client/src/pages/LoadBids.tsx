/**
 * LOAD BIDS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Clock, Truck, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Star,
  Building, ChevronRight, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useParams } from "wouter";

export default function LoadBids() {
  const params = useParams();
  const loadId = params.id;
  const [bidAmount, setBidAmount] = useState("");

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId! }, { enabled: !!loadId });
  const bidsQuery = (trpc as any).bids.getByLoad.useQuery({ loadId: loadId! }, { enabled: !!loadId });

  const submitBidMutation = (trpc as any).bids.submit.useMutation({
    onSuccess: () => { toast.success("Bid submitted"); setBidAmount(""); bidsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const acceptBidMutation = (trpc as any).bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted"); bidsQuery.refetch(); loadQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const rejectBidMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { toast.success("Bid rejected"); bidsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (loadQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading data</p>
        <Button className="mt-4" onClick={() => loadQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const load = loadQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "countered": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const handleSubmitBid = () => {
    if (!bidAmount || isNaN(parseFloat(bidAmount))) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    submitBidMutation.mutate({ loadId: loadId!, amount: parseFloat(bidAmount) });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Bids</h1>
          <p className="text-slate-400 text-sm">Manage bids for this load</p>
        </div>
      </div>

      {/* Load Details */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          {loadQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-64" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-500">Load Number</p>
                <p className="text-white font-bold text-lg">{load?.loadNumber}</p>
                {load?.biddingEnds && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />Bidding ends in {String(load.biddingEnds)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Commodity</p>
                <p className="text-white font-medium">{load?.commodity}</p>
                {load?.hazmatClass && <p className="text-xs text-red-400">Hazmat Class {load.hazmatClass}</p>}
              </div>
              <div>
                <p className="text-xs text-slate-500">Route</p>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-3 h-3 text-green-400" />
                  <span className="text-white">{load?.pickupLocation?.city}, {load?.pickupLocation?.state}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span className="text-white">{load?.deliveryLocation?.city}, {load?.deliveryLocation?.state}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{load?.distance} miles</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Target Rate</p>
                <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-xl">${load?.rate?.toLocaleString()}</p>
                {load?.suggestedRateMin && load?.suggestedRateMax && (
                  <p className="text-xs text-slate-500">Suggested: ${load.suggestedRateMin.toLocaleString()} - ${load.suggestedRateMax.toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Bid */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />Submit Bid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Your Bid Amount</p>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e: any) => setBidAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-9 bg-slate-700/50 border-slate-600 text-lg"
                  />
                </div>
              </div>
              {bidAmount && load?.distance && (
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Rate per mile</span>
                    <span className="text-white">${(parseFloat(bidAmount) / (Number(load.distance) || 1)).toFixed(2)}/mi</span>
                  </div>
                </div>
              )}
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSubmitBid} disabled={submitBidMutation.isPending}>
                {submitBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                Submit Bid
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bids List */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">All Bids ({(bidsQuery.data as any)?.length || 0})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bidsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : (bidsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No bids yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(bidsQuery.data as any)?.map((bid: any) => (
                  <div key={bid.id} className={cn("flex items-center justify-between p-4 rounded-lg border", bid.status === "accepted" ? "bg-green-500/10 border-green-500/30" : "bg-slate-700/30 border-slate-700")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Building className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{bid.carrierName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Star className="w-3 h-3 text-yellow-400" />{bid.carrierRating}
                          <span>MC# {bid.carrierMC}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-lg">${bid.amount?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">${bid.ratePerMile?.toFixed(2)}/mi</p>
                      </div>
                      <Badge className={getStatusColor(bid.status)}>{bid.status}</Badge>
                      {bid.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => rejectBidMutation.mutate({ bidId: bid.id })} disabled={rejectBidMutation.isPending}>
                            {rejectBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => acceptBidMutation.mutate({ bidId: bid.id })} disabled={acceptBidMutation.isPending}>
                            {acceptBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
