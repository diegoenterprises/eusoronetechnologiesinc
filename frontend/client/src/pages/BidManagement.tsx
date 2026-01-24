/**
 * BID MANAGEMENT
 * Interface for shippers to review and manage carrier bids on their loads
 * Based on 01_SHIPPER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DollarSign, Truck, Clock, MapPin, Star, Shield, CheckCircle,
  XCircle, MessageSquare, ChevronRight, Filter, Search, Award,
  AlertTriangle, Phone, FileText, TrendingUp, TrendingDown, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Bid {
  id: string;
  carrierId: string;
  carrierName: string;
  mcNumber: string;
  dotNumber: string;
  safetyRating: "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";
  insuranceCoverage: number;
  amount: number;
  transitTime: number;
  estimatedPickup: string;
  estimatedDelivery: string;
  driverName?: string;
  equipmentType: string;
  hasHazmatEndorsement: boolean;
  hasTankEndorsement: boolean;
  hasTwic: boolean;
  onTimePercentage: number;
  totalLoads: number;
  rating: number;
  message?: string;
  submittedAt: string;
  status: "pending" | "accepted" | "rejected" | "countered";
}

interface Load {
  id: string;
  loadNumber: string;
  commodity: string;
  hazmatClass?: string;
  weight: number;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  pickupDate: string;
  deliveryDate: string;
  postedRate?: number;
  rateType: "flat" | "per_mile" | "auction";
  miles: number;
  bids: Bid[];
}

const MOCK_LOADS: Load[] = [
  {
    id: "load_001",
    loadNumber: "LD-2025-0847",
    commodity: "Gasoline, Unleaded",
    hazmatClass: "3",
    weight: 42000,
    origin: { city: "Texas City", state: "TX" },
    destination: { city: "Austin", state: "TX" },
    pickupDate: "2025-01-24",
    deliveryDate: "2025-01-24",
    postedRate: 1800,
    rateType: "auction",
    miles: 195,
    bids: [
      {
        id: "bid_001",
        carrierId: "carrier_001",
        carrierName: "SafeHaul Transport LLC",
        mcNumber: "MC-123456",
        dotNumber: "DOT-789012",
        safetyRating: "Satisfactory",
        insuranceCoverage: 5000000,
        amount: 1750,
        transitTime: 4,
        estimatedPickup: "2025-01-24T06:00:00",
        estimatedDelivery: "2025-01-24T10:00:00",
        driverName: "Mike Johnson",
        equipmentType: "MC-306 Tank Trailer",
        hasHazmatEndorsement: true,
        hasTankEndorsement: true,
        hasTwic: true,
        onTimePercentage: 98,
        totalLoads: 1247,
        rating: 4.8,
        message: "Experienced hazmat driver available. Can pick up early if needed.",
        submittedAt: "2025-01-23T14:30:00",
        status: "pending",
      },
      {
        id: "bid_002",
        carrierId: "carrier_002",
        carrierName: "Texas Fuel Haulers",
        mcNumber: "MC-234567",
        dotNumber: "DOT-890123",
        safetyRating: "Satisfactory",
        insuranceCoverage: 2000000,
        amount: 1650,
        transitTime: 5,
        estimatedPickup: "2025-01-24T07:00:00",
        estimatedDelivery: "2025-01-24T12:00:00",
        equipmentType: "DOT-406 Tank Trailer",
        hasHazmatEndorsement: true,
        hasTankEndorsement: true,
        hasTwic: false,
        onTimePercentage: 94,
        totalLoads: 856,
        rating: 4.5,
        submittedAt: "2025-01-23T15:00:00",
        status: "pending",
      },
      {
        id: "bid_003",
        carrierId: "carrier_003",
        carrierName: "Gulf Coast Carriers",
        mcNumber: "MC-345678",
        dotNumber: "DOT-901234",
        safetyRating: "Conditional",
        insuranceCoverage: 1000000,
        amount: 1500,
        transitTime: 6,
        estimatedPickup: "2025-01-24T08:00:00",
        estimatedDelivery: "2025-01-24T14:00:00",
        equipmentType: "MC-306 Tank Trailer",
        hasHazmatEndorsement: true,
        hasTankEndorsement: true,
        hasTwic: true,
        onTimePercentage: 89,
        totalLoads: 432,
        rating: 4.1,
        message: "Competitive rate, reliable service",
        submittedAt: "2025-01-23T16:00:00",
        status: "pending",
      },
    ],
  },
  {
    id: "load_002",
    loadNumber: "LD-2025-0848",
    commodity: "Diesel #2",
    hazmatClass: "3",
    weight: 40000,
    origin: { city: "Houston", state: "TX" },
    destination: { city: "San Antonio", state: "TX" },
    pickupDate: "2025-01-25",
    deliveryDate: "2025-01-25",
    postedRate: 1600,
    rateType: "auction",
    miles: 200,
    bids: [
      {
        id: "bid_004",
        carrierId: "carrier_001",
        carrierName: "SafeHaul Transport LLC",
        mcNumber: "MC-123456",
        dotNumber: "DOT-789012",
        safetyRating: "Satisfactory",
        insuranceCoverage: 5000000,
        amount: 1580,
        transitTime: 4,
        estimatedPickup: "2025-01-25T05:00:00",
        estimatedDelivery: "2025-01-25T09:00:00",
        equipmentType: "MC-306 Tank Trailer",
        hasHazmatEndorsement: true,
        hasTankEndorsement: true,
        hasTwic: true,
        onTimePercentage: 98,
        totalLoads: 1247,
        rating: 4.8,
        submittedAt: "2025-01-23T17:00:00",
        status: "pending",
      },
    ],
  },
];

export default function BidManagement() {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>(MOCK_LOADS);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAcceptBid = (loadId: string, bidId: string) => {
    setLoads(prev => prev.map(load => {
      if (load.id === loadId) {
        return {
          ...load,
          bids: load.bids.map(bid => ({
            ...bid,
            status: bid.id === bidId ? "accepted" : "rejected"
          }))
        };
      }
      return load;
    }));
    toast.success("Bid accepted! Carrier has been notified.");
    setSelectedBid(null);
  };

  const handleRejectBid = (loadId: string, bidId: string) => {
    setLoads(prev => prev.map(load => {
      if (load.id === loadId) {
        return {
          ...load,
          bids: load.bids.map(bid => 
            bid.id === bidId ? { ...bid, status: "rejected" } : bid
          )
        };
      }
      return load;
    }));
    toast.info("Bid rejected");
  };

  const getTotalPendingBids = () => {
    return loads.reduce((sum, load) => 
      sum + load.bids.filter(b => b.status === "pending").length, 0
    );
  };

  const getLowestBid = (bids: Bid[]) => {
    const pending = bids.filter(b => b.status === "pending");
    if (pending.length === 0) return null;
    return pending.reduce((min, b) => b.amount < min.amount ? b : min);
  };

  const filteredLoads = loads.filter(load => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!load.loadNumber.toLowerCase().includes(q) && 
          !load.commodity.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterStatus === "with_bids") {
      return load.bids.filter(b => b.status === "pending").length > 0;
    }
    if (filterStatus === "awarded") {
      return load.bids.some(b => b.status === "accepted");
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bid Management</h1>
          <p className="text-slate-400 text-sm">Review and manage carrier bids on your loads</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 text-lg px-4 py-2">
          {getTotalPendingBids()} Pending Bids
        </Badge>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search loads..."
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "with_bids", "awarded"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? "bg-blue-600" : "border-slate-600"}
                  size="sm"
                >
                  {status === "all" ? "All Loads" : status === "with_bids" ? "With Bids" : "Awarded"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loads List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredLoads.map((load) => {
          const pendingBids = load.bids.filter(b => b.status === "pending");
          const acceptedBid = load.bids.find(b => b.status === "accepted");
          const lowestBid = getLowestBid(load.bids);
          
          return (
            <Card 
              key={load.id} 
              className={cn(
                "bg-slate-800/50 border-slate-700 cursor-pointer transition-colors",
                selectedLoad?.id === load.id && "border-blue-500"
              )}
              onClick={() => setSelectedLoad(load)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{load.loadNumber}</span>
                      {load.hazmatClass && (
                        <Badge className="bg-red-500/20 text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Class {load.hazmatClass}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{load.commodity}</p>
                  </div>
                  {acceptedBid ? (
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Awarded
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {pendingBids.length} Bids
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{load.origin.city}, {load.origin.state}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{load.destination.city}, {load.destination.state}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-slate-500">Posted: </span>
                    <span className="text-white">${load.postedRate?.toLocaleString()}</span>
                  </div>
                  {lowestBid && !acceptedBid && (
                    <div className="text-sm">
                      <span className="text-slate-500">Lowest Bid: </span>
                      <span className={cn(
                        "font-bold",
                        lowestBid.amount < (load.postedRate || 0) ? "text-green-400" : "text-yellow-400"
                      )}>
                        ${lowestBid.amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {acceptedBid && (
                    <div className="text-sm">
                      <span className="text-slate-500">Awarded: </span>
                      <span className="text-green-400 font-bold">
                        ${acceptedBid.amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bid Detail Modal */}
      {selectedLoad && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {selectedLoad.loadNumber}
                    {selectedLoad.hazmatClass && (
                      <Badge className="bg-red-500/20 text-red-400">
                        Hazmat Class {selectedLoad.hazmatClass}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-slate-400 text-sm mt-1">
                    {selectedLoad.origin.city}, {selectedLoad.origin.state} → {selectedLoad.destination.city}, {selectedLoad.destination.state}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedLoad(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-4">
                {selectedLoad.bids.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No bids received yet</p>
                  </div>
                ) : (
                  selectedLoad.bids.map((bid) => (
                    <Card 
                      key={bid.id} 
                      className={cn(
                        "border transition-colors",
                        bid.status === "accepted" ? "bg-green-500/10 border-green-500/50" :
                        bid.status === "rejected" ? "bg-slate-700/30 border-slate-600 opacity-50" :
                        "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                              <Truck className="w-6 h-6 text-slate-300" />
                            </div>
                            <div>
                              <h4 className="text-white font-bold">{bid.carrierName}</h4>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>{bid.mcNumber}</span>
                                <span>|</span>
                                <span>{bid.dotNumber}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">
                              ${bid.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-400">
                              ${(bid.amount / selectedLoad.miles).toFixed(2)}/mi
                            </p>
                          </div>
                        </div>

                        {/* Carrier Stats */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                            <Shield className={cn(
                              "w-5 h-5 mx-auto mb-1",
                              bid.safetyRating === "Satisfactory" ? "text-green-400" :
                              bid.safetyRating === "Conditional" ? "text-yellow-400" : "text-red-400"
                            )} />
                            <p className="text-xs text-slate-400">Safety</p>
                            <p className="text-sm text-white font-medium">{bid.safetyRating}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                            <Star className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                            <p className="text-xs text-slate-400">Rating</p>
                            <p className="text-sm text-white font-medium">{bid.rating}/5.0</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                            <Clock className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                            <p className="text-xs text-slate-400">On-Time</p>
                            <p className="text-sm text-white font-medium">{bid.onTimePercentage}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                            <Award className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                            <p className="text-xs text-slate-400">Loads</p>
                            <p className="text-sm text-white font-medium">{bid.totalLoads.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Endorsements */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {bid.hasHazmatEndorsement && (
                            <Badge className="bg-red-500/20 text-red-400">Hazmat (H)</Badge>
                          )}
                          {bid.hasTankEndorsement && (
                            <Badge className="bg-blue-500/20 text-blue-400">Tank (N)</Badge>
                          )}
                          {bid.hasTwic && (
                            <Badge className="bg-purple-500/20 text-purple-400">TWIC</Badge>
                          )}
                          <Badge className="bg-slate-500/20 text-slate-400">
                            ${(bid.insuranceCoverage / 1000000).toFixed(1)}M Insurance
                          </Badge>
                        </div>

                        {/* Message */}
                        {bid.message && (
                          <div className="p-3 rounded-lg bg-slate-800/50 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>Carrier Message</span>
                            </div>
                            <p className="text-white text-sm">{bid.message}</p>
                          </div>
                        )}

                        {/* Transit Info */}
                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="text-slate-400">
                            <span>Equipment: </span>
                            <span className="text-white">{bid.equipmentType}</span>
                          </div>
                          <div className="text-slate-400">
                            <span>Transit: </span>
                            <span className="text-white">{bid.transitTime} hours</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {bid.status === "pending" && (
                          <div className="flex gap-3">
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptBid(selectedLoad.id, bid.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept Bid
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-slate-600"
                              onClick={() => handleRejectBid(selectedLoad.id, bid.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button variant="outline" className="border-slate-600">
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </Button>
                          </div>
                        )}
                        {bid.status === "accepted" && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-medium">Bid Accepted</span>
                          </div>
                        )}
                        {bid.status === "rejected" && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-700/30">
                            <XCircle className="w-5 h-5 text-slate-400" />
                            <span className="text-slate-400">Bid Rejected</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
