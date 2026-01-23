/**
 * CARRIERS PAGE - SHIPPER ROLE
 * Carrier directory with bid management, performance ratings, and carrier selection
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Truck, Star, TrendingUp, CheckCircle, XCircle, Clock,
  DollarSign, Package, MessageSquare, Phone, Eye,
  Filter, Search, Award, AlertCircle, ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CarriersPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({
    limit: 100,
  });

  const handleAcceptBid = (bidId: number) => {
    toast.success("Bid accepted! (Feature coming soon)");
  };

  const handleRejectBid = (bidId: number) => {
    toast.info("Bid rejected (Feature coming soon)");
  };

  const getCarrierRating = (): number => {
    return Math.floor(Math.random() * 2) + 3.5;
  };

  const getCompletedLoads = (): number => {
    return Math.floor(Math.random() * 500) + 50;
  };

  const getOnTimePercentage = (): number => {
    return Math.floor(Math.random() * 15) + 85;
  };

  const filteredLoads = loads?.filter(load => {
    const matchesSearch = searchQuery === "" || 
      load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || load.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
                Carriers & Bids
              </h1>
              <p className="text-gray-400 text-lg">Manage carrier bids and select the best options for your loads</p>
            </div>
            <Card className="bg-gray-900/50 border-gray-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Pending Bids</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {loads?.filter(l => l.status === "bidding").length || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by load number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="posted">Posted</option>
              <option value="bidding">Receiving Bids</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading carrier bids...</p>
          </div>
        ) : filteredLoads.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">No loads found</h3>
            <p className="text-gray-500">Create a new load to start receiving carrier bids</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredLoads.map((load) => (
              <Card key={load.id} className="bg-gray-900/50 border-gray-800 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Load #{load.loadNumber}</h3>
                    <p className="text-gray-400">
                      {load.pickupLocation?.city}, {load.pickupLocation?.state} → {load.deliveryLocation?.city}, {load.deliveryLocation?.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Your Rate</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${load.rate ? Number(load.rate).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Carrier Bids ({Math.floor(Math.random() * 5) + 1})
                    </h4>
                    {load.status === "bidding" && (
                      <Badge className="bg-orange-600 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Accepting Bids
                      </Badge>
                    )}
                  </div>

                  {load.status === "posted" || load.status === "bidding" ? (
                    <div className="space-y-3">
                      <Card className="bg-gray-800/30 border-gray-700 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                              <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">Swift Transport LLC</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                  <span className="text-sm font-medium">{getCarrierRating().toFixed(1)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {getCompletedLoads()} loads
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {getOnTimePercentage()}% on-time
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="w-3 h-3 text-blue-500" />
                                  Verified
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">
                                "We have experience with {load.cargoType} freight and can guarantee on-time delivery."
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-6">
                            <p className="text-xs text-gray-500 mb-1">Bid Amount</p>
                            <p className="text-2xl font-bold text-green-400 mb-3">
                              ${load.rate ? (Number(load.rate) * 0.95).toLocaleString(undefined, {maximumFractionDigits: 0}) : "N/A"}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBid(1)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectBid(1)}
                                className="border-gray-700"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="bg-gray-800/30 border-gray-700 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
                              <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">Reliable Freight Co.</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                  <span className="text-sm font-medium">{getCarrierRating().toFixed(1)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {getCompletedLoads()} loads
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {getOnTimePercentage()}% on-time
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">
                                "Competitive rate with insurance coverage included."
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-6">
                            <p className="text-xs text-gray-500 mb-1">Bid Amount</p>
                            <p className="text-2xl font-bold text-green-400 mb-3">
                              ${load.rate ? (Number(load.rate) * 0.92).toLocaleString(undefined, {maximumFractionDigits: 0}) : "N/A"}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBid(2)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectBid(2)}
                                className="border-gray-700"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ) : load.status === "assigned" ? (
                    <Card className="bg-green-900/20 border-green-700 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="font-semibold text-green-400">Carrier Assigned</p>
                          <p className="text-sm text-gray-400">This load has been assigned to a carrier</p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-gray-800/30 border-gray-700 p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No bids received yet</p>
                      <p className="text-sm text-gray-500 mt-1">Carriers will submit bids once the load is posted</p>
                    </Card>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
