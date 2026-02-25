/**
 * LOAD BIDS PAGE
 * 100% Dynamic - No mock data
 * Shipper views and manages bids on their loads
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Clock, Truck, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Star,
  Building, ChevronRight, Eye, Loader2, ArrowLeft, MessageSquare,
  FlaskConical, Shield
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

  const [hazmatCheckBidId, setHazmatCheckBidId] = useState<string | null>(null);
  const [hazmatCheckDot, setHazmatCheckDot] = useState<string | null>(null);

  const acceptBidMutation = (trpc as any).bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted! Load assigned to catalyst."); bidsQuery.refetch(); loadQuery.refetch(); setHazmatCheckBidId(null); },
    onError: (error: any) => toast.error("Failed to accept bid", { description: error.message }),
  });

  const rejectBidMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { toast.success("Bid declined"); bidsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to decline bid", { description: error.message }),
  });

  const load = loadQuery.data;
  const isHazmatLoad = !!load?.hazmatClass;

  if (loadQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className={isLight ? "text-red-600" : "text-red-400"}>Error loading data</p>
        <Button className="mt-4" onClick={() => loadQuery.refetch()}>Retry</Button>
      </div>
    );
  }

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
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Review and manage catalyst bids</p>
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
              <p className="text-sm text-slate-400 mt-1">Catalysts will appear here when they bid on your load</p>
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
                      <p className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>{bid.catalystName}</p>
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
                          onClick={() => {
                            if (isHazmatLoad && bid.dotNumber) {
                              setHazmatCheckBidId(bid.id);
                              setHazmatCheckDot(bid.dotNumber);
                            } else {
                              acceptBidMutation.mutate({ bidId: bid.id });
                            }
                          }}
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
      {/* Hazmat Authorization Pre-Check Modal */}
      {hazmatCheckBidId && isHazmatLoad && (
        <HazmatAuthCheckOverlay
          dotNumber={hazmatCheckDot || ""}
          hazmatClass={load?.hazmatClass || ""}
          isLight={isLight}
          onConfirm={() => { acceptBidMutation.mutate({ bidId: hazmatCheckBidId }); }}
          onCancel={() => { setHazmatCheckBidId(null); setHazmatCheckDot(null); }}
          isPending={acceptBidMutation.isPending}
        />
      )}
    </div>
  );
}

function HazmatAuthCheckOverlay({ dotNumber, hazmatClass, isLight, onConfirm, onCancel, isPending }: {
  dotNumber: string; hazmatClass: string; isLight: boolean;
  onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  const authQuery = (trpc as any).fmcsa.verifyHazmatAuthorization.useQuery(
    { dotNumber, hazmatClass },
    { enabled: !!dotNumber && !!hazmatClass }
  );

  const data = authQuery.data;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className={cn(
        "w-full max-w-xl rounded-2xl border p-6",
        isLight ? "bg-white border-slate-200 shadow-xl" : "bg-slate-800 border-slate-700"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <FlaskConical className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Hazmat Authorization Check</h3>
            <p className="text-sm text-slate-400">Verifying carrier for Class {hazmatClass} load</p>
          </div>
        </div>

        {authQuery.isLoading ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            <span className={isLight ? "text-slate-600" : "text-slate-300"}>Checking FMCSA hazmat authorization...</span>
          </div>
        ) : authQuery.error || !data ? (
          <div className={cn("p-4 rounded-xl mb-4", isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20")}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className={cn("text-sm", isLight ? "text-amber-700" : "text-amber-300")}>Unable to verify carrier. You may proceed at your discretion.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {/* Authorization Status */}
            <div className={cn(
              "p-4 rounded-xl border",
              data.authorized
                ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")
                : (isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30")
            )}>
              <div className="flex items-center gap-2 mb-2">
                {data.authorized
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <XCircle className="w-5 h-5 text-red-500" />}
                <span className={cn("font-bold", data.authorized ? "text-green-600" : "text-red-500")}>
                  {data.authorized ? "AUTHORIZED" : "NOT AUTHORIZED"}
                </span>
                {data.needsHMSP && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] ml-auto">HMSP Required</Badge>
                )}
              </div>
              <p className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-400")}>{data.recommendation}</p>
            </div>

            {/* Passed Checks */}
            {data.passed?.length > 0 && (
              <div className="space-y-1">
                {data.passed.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                    <span className={isLight ? "text-slate-600" : "text-slate-400"}>{p.requirement}: {p.detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gaps */}
            {data.gaps?.length > 0 && (
              <div className="space-y-1">
                {data.gaps.map((g: any, i: number) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs rounded",
                    g.severity === "critical"
                      ? (isLight ? "bg-red-50" : "bg-red-500/5")
                      : (isLight ? "bg-amber-50" : "bg-amber-500/5")
                  )}>
                    {g.severity === "critical"
                      ? <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      : <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span className={g.severity === "critical" ? "text-red-400" : "text-amber-400"}>
                      {g.requirement} ({g.status}) -- {g.regulation}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className={cn("grid grid-cols-3 gap-2 text-center", isLight ? "" : "")}>
              <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/30")}>
                <p className="text-green-400 font-bold text-lg">{data.summary?.passed || 0}</p>
                <p className="text-[10px] text-slate-400">Passed</p>
              </div>
              <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/30")}>
                <p className="text-red-400 font-bold text-lg">{data.summary?.criticalGaps || 0}</p>
                <p className="text-[10px] text-slate-400">Critical</p>
              </div>
              <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/30")}>
                <p className="text-amber-400 font-bold text-lg">{data.summary?.warnings || 0}</p>
                <p className="text-[10px] text-slate-400">Warnings</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Cancel</Button>
          <Button
            className={cn(
              "flex-1 rounded-xl font-bold text-white",
              data && !data.authorized
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]"
            )}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {data && !data.authorized ? "Accept Anyway (Override)" : "Confirm Accept"}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
