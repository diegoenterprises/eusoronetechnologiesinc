/**
 * SHIPPER BID MANAGEMENT PAGE
 * 100% Dynamic - Review and manage carrier bids on loads
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
  Gavel, Search, CheckCircle, XCircle, Clock,
  DollarSign, Building, Star, TrendingUp, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShipperBidManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const bidsQuery = trpc.bids.getByLoad.useQuery({ loadId: "" });
  const statsQuery = trpc.shippers.getStats.useQuery();

  const acceptBidMutation = trpc.shippers.acceptBid.useMutation({
    onSuccess: () => {
      toast.success("Bid accepted");
      bidsQuery.refetch();
    },
  });

  const rejectBidMutation = trpc.shippers.rejectBid.useMutation({
    onSuccess: () => {
      toast.success("Bid rejected");
      bidsQuery.refetch();
    },
  });

  const bids = bidsQuery.data || [];
  const stats = statsQuery.data;

  const filteredBids = bids.filter((b: any) =>
    b.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.carrierName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "expired": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Bid Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and manage carrier bids</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gavel className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Bids</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.total || stats?.totalLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Avg Bid</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${(stats as any)?.avgBid?.toLocaleString() || stats?.avgRatePerMile?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Accept Rate</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.acceptRate || stats?.onTimeRate || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bids..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {bidsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredBids.length === 0 ? (
            <div className="text-center py-16">
              <Gavel className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No bids found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredBids.map((bid: any) => (
                <div key={bid.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Building className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{bid.carrierName}</p>
                          <Badge className={cn("border-0", getStatusColor(bid.status))}>
                            {bid.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Load #{bid.loadNumber} • MC# {bid.mcNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Star className="w-3 h-3" />Rating</p>
                        <p className="text-yellow-400 font-bold">{bid.carrierRating || "N/A"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Shield className="w-3 h-3" />Safety</p>
                        <p className={cn(
                          "font-medium",
                          bid.safetyRating === "Satisfactory" ? "text-green-400" : "text-yellow-400"
                        )}>
                          {bid.safetyRating || "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Bid Amount</p>
                        <p className="text-green-400 font-bold text-lg">${bid.amount?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">$/Mile</p>
                        <p className="text-white">${bid.ratePerMile?.toFixed(2)}</p>
                      </div>
                      {bid.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectBidMutation.mutate({ loadId: bid.loadId || "", bidId: bid.id, reason: "Rejected" })}
                            className="bg-red-500/20 border-red-500/50 text-red-400 rounded-lg"
                          >
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => acceptBidMutation.mutate({ loadId: bid.loadId || "", bidId: bid.id })}
                            className="bg-green-600 hover:bg-green-700 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {bid.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-sm">{bid.notes}</p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {bid.carrierEquipment && (
                      <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                        {bid.carrierEquipment}
                      </Badge>
                    )}
                    {bid.insuranceVerified && (
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />Insurance Verified
                      </Badge>
                    )}
                    {bid.hazmatCertified && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                        Hazmat Certified
                      </Badge>
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
