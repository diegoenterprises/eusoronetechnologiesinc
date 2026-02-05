/**
 * BID DETAILS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Truck, ArrowLeft, Clock, User,
  CheckCircle, XCircle, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function BidDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const bidId = params.id as string;

  const bidQuery = (trpc as any).bids.getById.useQuery({ id: bidId });
  const bid = bidQuery.data;

  const acceptMutation = (trpc as any).bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted"); bidQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to accept bid", { description: error.message }),
  });

  const rejectMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { toast.success("Bid rejected"); bidQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to reject bid", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "accepted": return <Badge className="bg-green-500/20 text-green-400 border-0">Accepted</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  if (bidQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!bid) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <DollarSign className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg">Bid not found</p>
          <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation("/bids")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Bids
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation("/bids")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Bid #{bid.id?.slice(0, 8)}
              </h1>
              {getStatusBadge(bid.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">Submitted {bid.submittedAt}</p>
          </div>
        </div>
        {bid.status === "pending" && (
          <div className="flex gap-2">
            <Button variant="outline" className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-lg" onClick={() => rejectMutation.mutate({ bidId: bid.id })} disabled={rejectMutation.isPending}>
              <XCircle className="w-4 h-4 mr-2" />Reject
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={() => acceptMutation.mutate({ bidId: bid.id })} disabled={acceptMutation.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />Accept
            </Button>
          </div>
        )}
      </div>

      {/* Bid Amount Card */}
      <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Bid Amount</p>
              <p className="text-4xl font-bold text-white">${(bid.amount || 0).toLocaleString()}</p>
              {bid.ratePerMile && (
                <p className="text-emerald-400 text-sm mt-1">${bid.ratePerMile.toFixed(2)}/mile</p>
              )}
            </div>
            <div className="p-4 rounded-full bg-emerald-500/20">
              <DollarSign className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Info */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              Load Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">Load Number</p>
              <p className="text-white font-medium">{bid.loadNumber}</p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-green-400" />
                <div className="w-0.5 h-12 bg-slate-600" />
                <div className="w-4 h-4 rounded-full bg-red-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-white font-medium">{bid.origin?.city}, {bid.origin?.state}</p>
                  <p className="text-xs text-slate-500">Pickup: {bid.pickupDate}</p>
                </div>
                <div>
                  <p className="text-white font-medium">{bid.destination?.city}, {bid.destination?.state}</p>
                  <p className="text-xs text-slate-500">Delivery: {bid.deliveryDate}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Distance</p>
                <p className="text-white font-medium">{bid.distance || 0} miles</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Equipment</p>
                <p className="text-white font-medium">{bid.equipmentType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Info */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Carrier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Truck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">{bid.carrierName}</p>
                <p className="text-sm text-slate-400">MC# {bid.mcNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Rating</p>
                <p className="text-yellow-400 font-medium">{bid.carrierRating?.toFixed(1) || "N/A"} / 5.0</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Loads Completed</p>
                <p className="text-white font-medium">{bid.carrierLoads || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">On-Time Rate</p>
                <p className="text-green-400 font-medium">{bid.onTimeRate || 0}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Safety Score</p>
                <p className="text-cyan-400 font-medium">{bid.safetyScore || "N/A"}</p>
              </div>
            </div>

            {bid.notes && (
              <div className="p-4 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500 mb-1">Carrier Notes</p>
                <p className="text-white">{bid.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bid History */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Bid History</CardTitle>
          </CardHeader>
          <CardContent>
            {bid.history?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No history available</p>
            ) : (
              <div className="space-y-3">
                {bid.history?.map((event: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/30">
                    <div className={cn("w-2 h-2 rounded-full mt-2", event.type === "accepted" ? "bg-green-400" : event.type === "rejected" ? "bg-red-400" : "bg-blue-400")} />
                    <div>
                      <p className="text-white font-medium">{event.action}</p>
                      <p className="text-xs text-slate-500">{event.timestamp} • {event.user}</p>
                    </div>
                  </div>
                )) || (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-400" />
                    <div>
                      <p className="text-white font-medium">Bid submitted</p>
                      <p className="text-xs text-slate-500">{bid.submittedAt}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
