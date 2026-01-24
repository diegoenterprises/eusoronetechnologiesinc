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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Clock, CheckCircle, XCircle, Search,
  MapPin, ArrowRight, Eye, Star, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function BidManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const bidsQuery = trpc.bids.list.useQuery({ limit: 50 });
  const summaryQuery = trpc.bids.getSummary.useQuery();

  const acceptMutation = trpc.bids.accept.useMutation({
    onSuccess: () => { toast.success("Bid accepted"); bidsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = trpc.bids.reject.useMutation({
    onSuccess: () => { toast.success("Bid rejected"); bidsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted": return <Badge className="bg-green-500/20 text-green-400 border-0">Accepted</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredBids = bidsQuery.data?.filter((bid: any) => {
    const matchesSearch = !searchTerm || 
      bid.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.carrierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || bid.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Bid Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and manage carrier bids for your loads</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.accepted || 0}</p>
                )}
                <p className="text-xs text-slate-400">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
                )}
                <p className="text-xs text-slate-400">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by load number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">Pending</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-slate-700 rounded-md">Accepted</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-slate-700 rounded-md">Rejected</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {bidsQuery.isLoading ? (
                <div className="p-4 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
              ) : filteredBids?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No bids found</p>
                  <p className="text-slate-500 text-sm mt-1">Bids will appear here when carriers respond to your loads</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredBids?.map((bid: any) => (
                    <div key={bid.id} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-bold">{bid.loadNumber}</p>
                            {getStatusBadge(bid.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span>{bid.origin?.city}</span>
                            <ArrowRight className="w-3 h-3" />
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{bid.destination?.city}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Your Rate</p>
                          <p className="text-emerald-400 font-bold text-xl">${bid.yourRate?.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Carrier Bids */}
                      <div className="space-y-3">
                        <p className="text-slate-400 text-sm">Carrier Bids ({bid.bids?.length || 0})</p>
                        {bid.bids?.map((carrierBid: any) => (
                          <div key={carrierBid.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-500/20">
                                  <Truck className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">{carrierBid.carrierName}</p>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span className="text-yellow-400 text-sm">{carrierBid.rating}</span>
                                    </div>
                                    {carrierBid.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                                  </div>
                                  <p className="text-xs text-slate-500">{carrierBid.loadsCompleted} loads • {carrierBid.onTimeRate}% on-time</p>
                                  {carrierBid.note && <p className="text-sm text-slate-400 mt-1">"{carrierBid.note}"</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-slate-400 text-xs">Bid Amount</p>
                                  <p className="text-cyan-400 font-bold text-lg">${carrierBid.amount?.toLocaleString()}</p>
                                </div>
                                {bid.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => rejectMutation.mutate({ bidId: carrierBid.id })}>
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => acceptMutation.mutate({ bidId: carrierBid.id })}>
                                      <CheckCircle className="w-4 h-4 mr-1" />Accept
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
