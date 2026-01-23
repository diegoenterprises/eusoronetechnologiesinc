/**
 * FIND LOADS PAGE - CARRIER ROLE
 * Advanced load marketplace with filtering, matching, and bidding system
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Calendar, DollarSign, TrendingUp,
  Filter, Search, Star, Clock, Truck, AlertCircle,
  CheckCircle, ArrowRight, Info, Flame, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";

type CargoType = "general" | "hazmat" | "refrigerated" | "oversized" | "liquid" | "gas" | "chemicals" | "petroleum";

export default function FindLoadsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState<CargoType | "ALL">("ALL");
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidNotes, setBidNotes] = useState("");

  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({
    status: "posted",
    limit: 100,
  });

  const submitBidMutation = trpc.bids.create.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully!");
      setSelectedLoadId(null);
      setBidAmount("");
      setBidNotes("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to submit bid: ${error.message}`);
    },
  });

  const handleSubmitBid = (loadId: number) => {
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    submitBidMutation.mutate({
      loadId,
      amount: Number(bidAmount),
      notes: bidNotes || undefined,
    });
  };

  const calculateMatchScore = (load: any): number => {
    let score = 50;
    const rate = Number(load.rate) || 0;
    if (rate > 5000) score += 20;
    else if (rate > 3000) score += 10;
    if (!load.pickupDate) score += 10;
    if (load.cargoType === "general") score += 10;
    if (load.specialInstructions) score += 5;
    return Math.min(score, 100);
  };

  const getMatchBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent Match", color: "from-green-600 to-emerald-600", icon: <Flame className="w-4 h-4" /> };
    if (score >= 60) return { label: "Good Match", color: "from-blue-600 to-cyan-600", icon: <Star className="w-4 h-4" /> };
    return { label: "Fair Match", color: "from-gray-600 to-gray-500", icon: <Target className="w-4 h-4" /> };
  };

  const filteredLoads = loads?.filter(load => {
    const pickupCity = load.pickupLocation?.city || "";
    const deliveryCity = load.deliveryLocation?.city || "";
    const matchesSearch = searchQuery === "" || 
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deliveryCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCargoType = cargoTypeFilter === "ALL" || load.cargoType === cargoTypeFilter;
    return matchesSearch && matchesCargoType;
  }) || [];

  const sortedLoads = [...filteredLoads].sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Find Loads
          </h1>
          <p className="text-gray-400 text-lg">Discover available loads and submit competitive bids</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by origin, destination, or load number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800"
            />
          </div>
          <select
            value={cargoTypeFilter}
            onChange={(e) => setCargoTypeFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
          >
            <option value="ALL">All Cargo Types</option>
            <option value="general">General Freight</option>
            <option value="hazmat">HazMat</option>
            <option value="refrigerated">Refrigerated</option>
            <option value="oversized">Oversized</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Finding loads...</p>
          </div>
        ) : sortedLoads.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">No loads available</h3>
            <p className="text-gray-500">Check back soon for new opportunities</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedLoads.map((load) => {
              const matchScore = calculateMatchScore(load);
              const matchBadge = getMatchBadge(matchScore);
              const isSelected = selectedLoadId === load.id;

              return (
                <Card key={load.id} className={`bg-gray-900/50 border-gray-800 p-6 hover:border-blue-500/50 transition-all ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-3">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${matchBadge.color} flex items-center gap-2`}>
                        {matchBadge.icon}
                        <span className="text-sm font-semibold">{matchScore}% Match</span>
                      </div>
                      <span className="text-gray-400 text-sm font-mono">#{load.loadNumber}</span>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-lg px-4 py-2 border border-green-700/30">
                      <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {load.rate ? Number(load.rate).toLocaleString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase">Origin</p>
                      <p className="font-semibold text-lg">
                        {load.pickupLocation?.city || "N/A"}, {load.pickupLocation?.state || "N/A"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Truck className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-500 uppercase">Destination</p>
                      <p className="font-semibold text-lg">
                        {load.deliveryLocation?.city || "N/A"}, {load.deliveryLocation?.state || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Weight</p>
                      <p className="font-medium">{load.weight ? `${load.weight} ${load.weightUnit}` : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Distance</p>
                      <p className="font-medium">{load.distance ? `${load.distance} ${load.distanceUnit}` : "TBD"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Cargo Type</p>
                      <p className="font-medium capitalize">{load.cargoType}</p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/50">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Submit Your Bid
                      </h4>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Your Bid Amount ($)</label>
                          <Input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder="Enter your bid"
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Notes (Optional)</label>
                          <Input
                            value={bidNotes}
                            onChange={(e) => setBidNotes(e.target.value)}
                            placeholder="Add notes"
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSubmitBid(load.id)}
                          disabled={submitBidMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1"
                        >
                          {submitBidMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Bid
                              <CheckCircle className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedLoadId(null);
                            setBidAmount("");
                            setBidNotes("");
                          }}
                          className="border-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedLoadId(load.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Place Bid
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
