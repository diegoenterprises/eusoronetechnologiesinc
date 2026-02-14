/**
 * LOAD BIDS PAGE
 * 100% Dynamic - No mock data
 * Shipper views and manages bids on their loads
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Clock, Truck, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Star,
  Building, ChevronRight, Eye, Loader2, ArrowLeft, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoadBids() {
  const params = useParams();
  const loadId = params.loadId || params.id;
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId! }, { enabled: !!loadId });
  const bidsQuery = (trpc as any).bids.getByLoad.useQuery({ loadId: loadId! }, { enabled: !!loadId });

  const acceptBidMutation = (trpc as any).bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted! Load assigned to carrier."); bidsQuery.refetch(); loadQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to accept bid", { description: error.message }),
  });

  const rejectBidMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { toast.success("Bid declined"); bidsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to decline bid", { description: error.message }),
  });

  if (loadQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className={isLight ? "text-red-600" : "text-red-400"}>Error loading data</p>
        <Button className="mt-4" onClick={() => loadQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const load = loadQuery.data;

  const getStatusBadge = (status: string) => {
    const m: Record<string, { cls: string; label: string }> = {
      accepted: { cls: "bg-green-500/15 text-green-500 border-green-500/30", label: "Accepted" },
      pending: { cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", label: "Pending" },
      rejected: { cls: "bg-red-500/15 text-red-500 border-red-500/30", label: "Rejected" },
      withdrawn: { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", label: "Withdrawn" },
      countered: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Countered" },
    };
    const s = m[status] || { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", label: status };
    return <Badge className={cn("border text-xs font-bold", s.cls)}>{s.label}</Badge>;
  };

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/loads")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Bids on Load</h1>
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Review and manage carrier bids</p>
          </div>
        </div>
      </div>

      {/* Load Details */}
      <Card className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30")}>
        <CardContent className="p-6">
          {loadQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className={cn("h-8 w-48 rounded-lg", isLight ? "bg-slate-200" : "")} />
              <Skeleton className={cn("h-6 w-full rounded-lg", isLight ? "bg-slate-200" : "")} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-500")}>Load Number</p>
                <p className={cn("font-bold text-lg", isLight ? "text-slate-800" : "text-white")}>{load?.loadNumber}</p>
              </div>
              <div>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-500")}>Commodity</p>
                <p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{load?.commodity}</p>
                {load?.hazmatClass && <p className="text-xs text-red-500">Hazmat Class {load.hazmatClass}</p>}
              </div>
              <div>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-500")}>Route</p>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-3 h-3 text-green-500" />
                  <span className={isLight ? "text-slate-800" : "text-white"}>{load?.pickupLocation?.city}, {load?.pickupLocation?.state}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span className={isLight ? "text-slate-800" : "text-white"}>{load?.deliveryLocation?.city}, {load?.deliveryLocation?.state}</span>
                </div>
              </div>
              <div>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-500")}>Target Rate</p>
                <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-xl">${load?.rate?.toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids List */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <DollarSign className="w-5 h-5 text-blue-500" />
              All Bids ({(bidsQuery.data as any)?.length || 0})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {bidsQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className={cn("h-20 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
          ) : (bidsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                <DollarSign className="w-8 h-8 text-slate-400" />
              </div>
              <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No bids received yet</p>
              <p className="text-sm text-slate-400 mt-1">Carriers will appear here when they bid on your load</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(bidsQuery.data as any)?.map((bid: any) => (
                <div key={bid.id} className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-3",
                  bid.status === "accepted"
                    ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")
                    : (isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-700")
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isLight ? "bg-slate-200" : "bg-slate-700")}>
                      <Building className={cn("w-5 h-5", isLight ? "text-slate-500" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>{bid.carrierName}</p>
                      {bid.companyName && <p className="text-xs text-slate-400">{bid.companyName}</p>}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {bid.submittedAt && <span>Submitted {new Date(bid.submittedAt).toLocaleDateString()}</span>}
                      </div>
                      {bid.notes && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <MessageSquare className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{bid.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-lg">${bid.amount?.toLocaleString()}</p>
                      {bid.ratePerMile > 0 && <p className="text-xs text-slate-400">${bid.ratePerMile?.toFixed(2)}/mi</p>}
                    </div>
                    {getStatusBadge(bid.status)}
                    {bid.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline"
                          className={cn("rounded-xl h-9", isLight ? "border-red-200 text-red-600 hover:bg-red-50" : "border-red-500/30 text-red-400 hover:bg-red-500/10")}
                          onClick={() => rejectBidMutation.mutate({ bidId: bid.id })}
                          disabled={rejectBidMutation.isPending}>
                          {rejectBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" />Decline</>}
                        </Button>
                        <Button size="sm"
                          className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl h-9 font-bold"
                          onClick={() => acceptBidMutation.mutate({ bidId: bid.id })}
                          disabled={acceptBidMutation.isPending}>
                          {acceptBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" />Accept</>}
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
  );
}
