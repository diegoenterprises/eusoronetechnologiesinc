/**
 * LOAD BIDS PAGE
 * View and manage bids on a specific load
 * Based on 01_SHIPPER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Clock, MapPin, Package, DollarSign, 
  Filter, SortAsc, RefreshCw, Sparkles, AlertTriangle
} from "lucide-react";
import { BidCard, BidData } from "@/components/bids/BidCard";
import { toast } from "sonner";

// Mock data for demonstration
const MOCK_LOAD = {
  id: "LOAD-45901",
  commodity: "Gasoline",
  unNumber: "UN1203",
  hazardClass: "3",
  quantity: "8,500 gallons",
  origin: "Houston, TX",
  destination: "Dallas, TX",
  distance: 250,
  pickupDate: "Jan 25, 2026 08:00",
  deliveryDate: "Jan 25, 2026 16:00",
  targetRate: 2800,
  suggestedRate: { min: 2650, max: 2900 },
  biddingEnds: "4h 23m",
  status: "bidding",
};

const MOCK_BIDS: BidData[] = [
  {
    id: "bid-1",
    carrierId: "carrier-1",
    carrierName: "ABC Transport",
    safetyRating: 5,
    onTimeRate: 98,
    totalLoads: 1247,
    bidAmount: 2500,
    eta: "On-time",
    etaStatus: "on-time",
    equipment: "MC-306",
    driverName: "John D.",
    driverHOS: "11h",
    hasHazmatAuth: true,
    insuranceCoverage: 2000000,
    submittedAt: "2h ago",
    status: "pending",
    notes: "Available for immediate pickup. Driver is familiar with this route.",
  },
  {
    id: "bid-2",
    carrierId: "carrier-2",
    carrierName: "XYZ Hazmat LLC",
    safetyRating: 4,
    onTimeRate: 95,
    totalLoads: 892,
    bidAmount: 2650,
    eta: "On-time",
    etaStatus: "on-time",
    equipment: "MC-306",
    hasHazmatAuth: true,
    insuranceCoverage: 1500000,
    submittedAt: "1h ago",
    status: "pending",
  },
  {
    id: "bid-3",
    carrierId: "carrier-3",
    carrierName: "SafeHaul Inc",
    safetyRating: 5,
    onTimeRate: 99,
    totalLoads: 2150,
    bidAmount: 2800,
    eta: "On-time",
    etaStatus: "on-time",
    equipment: "MC-306",
    driverName: "Sarah M.",
    driverHOS: "10h",
    hasHazmatAuth: true,
    insuranceCoverage: 5000000,
    submittedAt: "45m ago",
    status: "pending",
    notes: "Premium carrier with excellent safety record.",
  },
  {
    id: "bid-4",
    carrierId: "carrier-4",
    carrierName: "ProChem Carriers",
    safetyRating: 3,
    onTimeRate: 88,
    totalLoads: 456,
    bidAmount: 2400,
    eta: "-2 hours",
    etaStatus: "late",
    equipment: "MC-306",
    hasHazmatAuth: true,
    insuranceCoverage: 1000000,
    submittedAt: "3h ago",
    status: "pending",
  },
];

export default function LoadBidsPage() {
  const { loadId } = useParams<{ loadId: string }>();
  const [, setLocation] = useLocation();
  const [bids, setBids] = useState<BidData[]>(MOCK_BIDS);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "eta">("price");

  const sortedBids = [...bids].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.bidAmount - b.bidAmount;
      case "rating":
        return b.safetyRating - a.safetyRating;
      case "eta":
        return a.etaStatus === "on-time" ? -1 : 1;
      default:
        return 0;
    }
  });

  const handleAcceptBid = (bidId: string) => {
    setBids(bids.map(b => ({
      ...b,
      status: b.id === bidId ? "accepted" : b.status === "pending" ? "rejected" : b.status
    })));
    toast.success("Bid accepted! Rate confirmation sent to carrier.");
  };

  const handleRejectBid = (bidId: string) => {
    setBids(bids.map(b => ({
      ...b,
      status: b.id === bidId ? "rejected" : b.status
    })));
    toast.info("Bid rejected");
  };

  const handleCounterBid = (bidId: string, currentAmount: number) => {
    const counterAmount = prompt(`Enter counter offer (current bid: $${currentAmount}):`, String(currentAmount - 100));
    if (counterAmount) {
      setBids(bids.map(b => ({
        ...b,
        status: b.id === bidId ? "countered" : b.status,
        counterOffer: b.id === bidId ? parseInt(counterAmount) : b.counterOffer
      })));
      toast.success("Counter offer sent to carrier");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setLocation("/my-loads")} className="text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Loads
          </Button>
        </div>

        {/* Load Summary */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                {MOCK_LOAD.id}
              </CardTitle>
              <Badge className="bg-yellow-500/20 text-yellow-400">
                <Clock className="w-3 h-3 mr-1" />
                Bidding ends in {MOCK_LOAD.biddingEnds}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400">Commodity</p>
                <p className="text-white font-medium">{MOCK_LOAD.commodity}</p>
                <p className="text-xs text-slate-500">{MOCK_LOAD.unNumber} • Class {MOCK_LOAD.hazardClass}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Route</p>
                <p className="text-white font-medium">{MOCK_LOAD.origin}</p>
                <p className="text-xs text-slate-500">→ {MOCK_LOAD.destination} ({MOCK_LOAD.distance} mi)</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Your Target Rate</p>
                <p className="text-white font-medium text-lg">${MOCK_LOAD.targetRate.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  AI Suggested
                </p>
                <p className="text-white font-medium">
                  ${MOCK_LOAD.suggestedRate.min.toLocaleString()} - ${MOCK_LOAD.suggestedRate.max.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bids Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {bids.length} Bids Received
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-600">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-1.5 text-sm"
            >
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
              <option value="eta">Sort by ETA</option>
            </select>
            <Button variant="outline" size="sm" className="border-slate-600">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bid Cards */}
        <div className="space-y-4">
          {sortedBids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              targetRate={MOCK_LOAD.targetRate}
              onAccept={handleAcceptBid}
              onReject={handleRejectBid}
              onCounter={handleCounterBid}
              onMessage={(id) => toast.info("Opening message thread...")}
              isShipperView={true}
            />
          ))}
        </div>

        {bids.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No bids received yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Carriers are reviewing your load. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
