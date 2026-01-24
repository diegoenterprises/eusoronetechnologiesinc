/**
 * BID MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Clock, TrendingUp, TrendingDown, CheckCircle,
  XCircle, AlertTriangle, Search, Eye, ChevronRight, MapPin,
  Package, Building, Star, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function BidManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const summaryQuery = trpc.bids.getSummary.useQuery();
  const pendingQuery = trpc.bids.list.useQuery({ status: "pending" });
  const acceptedQuery = trpc.bids.list.useQuery({ status: "accepted" });
  const rejectedQuery = trpc.bids.list.useQuery({ status: "rejected" });

  const acceptMutation = trpc.bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted"); pendingQuery.refetch(); acceptedQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = trpc.bids.reject.useMutation({
    onSuccess: () => { toast.success("Bid rejected"); pendingQuery.refetch(); rejectedQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading bids</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "countered": return "bg-blue-500/20 text-blue-400";
      case "expired": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const renderBidList = (bids: any[], isLoading: boolean, showActions: boolean = false) => {
    if (isLoading) {
      return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
    }

    if (!bids || bids.length === 0) {
      return (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No bids found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {bids.filter(b => !searchTerm || b.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || b.carrier?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((bid) => (
          <Card key={bid.id} className="bg-slate-700/30 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-bold">{bid.loadNumber}</span>
                    <Badge className={getStatusColor(bid.status)}>{bid.status}</Badge>
                    {bid.expiresIn && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{bid.expiresIn}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <MapPin className="w-3 h-3 text-green-400" />
                    <span>{bid.origin?.city}, {bid.origin?.state}</span>
                    <ChevronRight className="w-3 h-3" />
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{bid.destination?.city}, {bid.destination?.state}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400 flex items-center gap-1"><Building className="w-3 h-3" />{bid.carrier?.name}</span>
                    <span className="text-slate-400 flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{bid.carrier?.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">${bid.amount?.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">${bid.ratePerMile?.toFixed(2)}/mi</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => setLocation(`/bids/${bid.id}`)}><Eye className="w-4 h-4" /></Button>
                    {showActions && (
                      <>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => rejectMutation.mutate({ bidId: bid.id })} disabled={rejectMutation.isPending}>
                          {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => acceptMutation.mutate({ bidId: bid.id })} disabled={acceptMutation.isPending}>
                          {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bid Management</h1>
          <p className="text-slate-400 text-sm">Review and manage carrier bids</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalBids || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Bids</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
            )}
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.accepted || 0}</p>
            )}
            <p className="text-xs text-slate-400">Accepted</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
            )}
            <p className="text-xs text-slate-400">Rejected</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.acceptanceRate || 0}%</p>
            )}
            <p className="text-xs text-slate-400">Accept Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search bids..." className="pl-9 bg-slate-700/50 border-slate-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600">Pending ({pendingQuery.data?.bids?.length || 0})</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-green-600">Accepted ({acceptedQuery.data?.bids?.length || 0})</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600">Rejected ({rejectedQuery.data?.bids?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {renderBidList(pendingQuery.data?.bids || [], pendingQuery.isLoading, true)}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {renderBidList(acceptedQuery.data?.bids || [], acceptedQuery.isLoading)}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {renderBidList(rejectedQuery.data?.bids || [], rejectedQuery.isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
