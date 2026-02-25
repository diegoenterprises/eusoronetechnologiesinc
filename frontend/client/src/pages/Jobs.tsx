/**
 * JOBS/LOADS PAGE - COMPREHENSIVE BIDDING & NEGOTIATION SYSTEM
 * Full load board with smart bidding, negotiation, and real-time updates
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoadTitle, getEquipmentLabel } from "@/lib/loadUtils";
import {
  MapPin, DollarSign, Clock, Briefcase, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Filter, Search, Star,
  Package, Truck, Calendar, Shield, MessageSquare, Eye,
  ThumbsUp, ThumbsDown, X, Send, RefreshCw, Bell, Zap,
  Award, Target, Activity, ArrowRight, Info, AlertTriangle,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Load {
  id: string;
  title: string;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  pay: number;
  distance: number;
  type: "HAZMAT" | "REEFER" | "DRY_VAN" | "FLATBED" | "TANKER";
  status: "AVAILABLE" | "BIDDING" | "ASSIGNED" | "IN_TRANSIT" | "COMPLETED";
  hazmatClass?: string;
  unNumber?: string;
  requiredCerts: string[];
  weight: number;
  commodity: string;
  catalystRating?: number;
  bidsCount: number;
  myBid?: {
    amount: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";
    counterOffer?: number;
    submittedAt: string;
  };
  fairnessScore?: "LOW" | "FAIR" | "GOOD";
  urgency: "LOW" | "MEDIUM" | "HIGH";
  detentionPolicy: string;
  shipper: {
    name: string;
    rating: number;
    totalLoads: number;
  };
}

export default function JobsPage() {
  const { user } = useAuth();
  const userRole = (user?.role || "user") as string;

  const [activeTab, setActiveTab] = useState<"available" | "my-bids" | "assigned" | "completed">("available");
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [counterOfferAmount, setCounterOfferAmount] = useState<number>(0);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "ALL",
    minPay: 0,
    maxDistance: 5000,
    hazmatOnly: false,
  });

  // Fetch real loads from database
  const { data: loadsData, isLoading: loadsLoading } = (trpc as any).loads.list.useQuery({
    status: activeTab === "available" ? "posted" : activeTab === "assigned" ? "assigned" : activeTab === "completed" ? "delivered" : undefined,
    limit: 50,
  });

  const { data: myBidsData } = (trpc as any).bids.getMyBids.useQuery();

  const submitBidMutation = (trpc as any).bids.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully!");
      setShowBidModal(false);
      setSelectedLoad(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to submit bid: ${error.message}`);
    },
  });

  if (loadsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </div>
    );
  }

  // Transform loads data from tRPC
  const loads: Load[] = (loadsData || []).map((load: any) => ({
    id: load.id.toString(),
    title: getLoadTitle({ cargoType: load.cargoType, hazmatClass: load.hazmatClass, commodityName: load.commodityName, commodity: load.commodity }),
    origin: typeof load.pickupLocation === 'object' ? `${(load.pickupLocation as any)?.city || ''}, ${(load.pickupLocation as any)?.state || ''}` : 'Unknown',
    destination: typeof load.deliveryLocation === 'object' ? `${(load.deliveryLocation as any)?.city || ''}, ${(load.deliveryLocation as any)?.state || ''}` : 'Unknown',
    pickupDate: load.pickupDate ? new Date(load.pickupDate).toISOString().split('T')[0] : "",
    deliveryDate: load.deliveryDate ? new Date(load.deliveryDate).toISOString().split('T')[0] : "",
    pay: load.rate ? parseFloat(String(load.rate)) : 0,
    distance: load.distance ? parseFloat(String(load.distance)) : 0,
    type: (load.cargoType === 'hazmat' ? "HAZMAT" : load.cargoType === 'refrigerated' ? "REEFER" : ['liquid', 'petroleum', 'gas', 'chemicals'].includes(load.cargoType) ? "TANKER" : load.cargoType === 'oversized' ? "FLATBED" : "DRY_VAN") as Load['type'],
    status: (load.status === 'posted' ? "AVAILABLE" : load.status === 'bidding' ? "BIDDING" : load.status === 'assigned' ? "ASSIGNED" : load.status === 'in_transit' ? "IN_TRANSIT" : "AVAILABLE") as Load['status'],
    hazmatClass: load.hazmatClass || undefined,
    unNumber: load.unNumber || undefined,
    requiredCerts: load.cargoType === 'hazmat' ? ["CDL-A", "HazMat", "Tanker"] : ["CDL-A"],
    weight: load.weight ? parseFloat(String(load.weight)) : 0,
    commodity: load.commodityName || load.commodity || "",
    bidsCount: 0,
    myBid: undefined,
    fairnessScore: "FAIR" as const,
    urgency: "MEDIUM" as const,
    detentionPolicy: "$50/hr after 2 hours",
    shipper: {
      name: "Verified Shipper",
      rating: 4.5,
      totalLoads: 100,
    },
  }));

  const getLoadTypeColor = (type: string) => {
    switch (type) {
      case "HAZMAT":
        return "bg-red-900/30 text-red-400 border-red-700";
      case "REEFER":
        return "bg-blue-900/30 text-blue-400 border-blue-700";
      case "TANKER":
        return "bg-orange-900/30 text-orange-400 border-orange-700";
      case "FLATBED":
        return "bg-purple-900/30 text-purple-400 border-purple-700";
      default:
        return "bg-gray-900/30 text-slate-400 border-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-900/30 text-green-400 border-green-700";
      case "BIDDING":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      case "ASSIGNED":
        return "bg-blue-900/30 text-blue-400 border-blue-700";
      case "IN_TRANSIT":
        return "bg-purple-900/30 text-purple-400 border-purple-700";
      case "COMPLETED":
        return "bg-gray-900/30 text-slate-400 border-gray-700";
      default:
        return "bg-gray-900/30 text-slate-400 border-gray-700";
    }
  };

  const getFairnessColor = (score?: string) => {
    switch (score) {
      case "GOOD":
        return "text-green-400";
      case "FAIR":
        return "text-yellow-400";
      case "LOW":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getFairnessIcon = (score?: string) => {
    switch (score) {
      case "GOOD":
        return <TrendingUp size={16} />;
      case "FAIR":
        return <Minus size={16} />;
      case "LOW":
        return <TrendingDown size={16} />;
      default:
        return <Minus size={16} />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return "text-red-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "LOW":
        return "text-green-400";
      default:
        return "text-slate-400";
    }
  };

  const handlePlaceBid = (load: Load) => {
    setSelectedLoad(load);
    setBidAmount(load.pay * 0.95); // Start at 95% of asking price
    setShowBidModal(true);
  };

  const handleSubmitBid = () => {
    if (!selectedLoad || !bidAmount) return;
    submitBidMutation.mutate({
      loadId: typeof selectedLoad.id === "string" ? parseInt(selectedLoad.id, 10) : selectedLoad.id,
      amount: bidAmount,
      notes: "",
    });
  };

  const handleCounterOffer = (load: Load) => {
    setSelectedLoad(load);
    setCounterOfferAmount(load.myBid?.counterOffer || load.pay);
    setShowNegotiationModal(true);
  };

  const handleAcceptCounterOffer = () => {
    if (!selectedLoad) return;
    
    // TODO: Call tRPC mutation to accept counter offer
    toast.success(`Counter offer of $${counterOfferAmount.toLocaleString()} accepted`);
    setShowNegotiationModal(false);
    setSelectedLoad(null);
  };

  const handleRejectCounterOffer = () => {
    if (!selectedLoad) return;
    
    // TODO: Call tRPC mutation to reject counter offer
    toast.info("Counter offer rejected");
    setShowNegotiationModal(false);
    setSelectedLoad(null);
  };

  const handleSendCounterOffer = () => {
    if (!selectedLoad) return;
    
    // TODO: Call tRPC mutation to send counter offer
    toast.success(`Counter offer of $${counterOfferAmount.toLocaleString()} sent with message`);
    setShowNegotiationModal(false);
    setSelectedLoad(null);
    setNegotiationMessage("");
  };

  const filteredLoads = loads.filter((load: any) => {
    // Filter by tab
    if (activeTab === "available" && load.status !== "AVAILABLE") return false;
    if (activeTab === "my-bids" && !load.myBid) return false;
    if (activeTab === "assigned" && load.status !== "ASSIGNED") return false;
    if (activeTab === "completed" && load.status !== "COMPLETED") return false;

    // Filter by search term
    if (searchTerm && !load.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !load.origin.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !load.destination.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by type
    if (filters.type !== "ALL" && load.type !== filters.type) return false;

    // Filter by pay
    if (load.pay < filters.minPay) return false;

    // Filter by distance
    if (load.distance > filters.maxDistance) return false;

    // Filter by hazmat
    if (filters.hazmatOnly && load.type !== "HAZMAT" && load.type !== "TANKER") return false;

    return true;
  });

  const tabs = [
    { id: "available" as const, label: "Available Loads", count: loads.filter((l: any) => l.status === "AVAILABLE").length },
    { id: "my-bids" as const, label: "My Bids", count: loads.filter((l: any) => l.myBid).length },
    { id: "assigned" as const, label: "Assigned", count: loads.filter((l: any) => l.status === "ASSIGNED").length },
    { id: "completed" as const, label: "Completed", count: loads.filter((l: any) => l.status === "COMPLETED").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-2">Load Board</h1>
          <p className="text-slate-400">Browse available loads and manage your bids</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-600 text-slate-400 hover:bg-gray-800"
          >
            <Bell size={18} className="mr-2" />
            Alerts
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700 p-4">
          <div className="flex items-center gap-3">
            <Package size={32} className="text-blue-400" />
            <div>
              <p className="text-slate-300 text-sm">Available Loads</p>
              <p className="text-white text-2xl font-bold">{loads.filter((l: any) => l.status === "AVAILABLE").length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-700 p-4">
          <div className="flex items-center gap-3">
            <Activity size={32} className="text-yellow-400" />
            <div>
              <p className="text-slate-300 text-sm">Active Bids</p>
              <p className="text-white text-2xl font-bold">{loads.filter((l: any) => l.myBid?.status === "PENDING").length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} className="text-green-400" />
            <div>
              <p className="text-slate-300 text-sm">Assigned</p>
              <p className="text-white text-2xl font-bold">{loads.filter((l: any) => l.status === "ASSIGNED").length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700 p-4">
          <div className="flex items-center gap-3">
            <DollarSign size={32} className="text-purple-400" />
            <div>
              <p className="text-slate-300 text-sm">Potential Earnings</p>
              <p className="text-white text-2xl font-bold">
                ${loads.filter((l: any) => l.status === "AVAILABLE").reduce((sum: any, l: any) => sum + l.pay, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by origin, destination, or commodity..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filters.type}
              onChange={(e: any) => setFilters({ ...filters, type: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white px-3 py-2 rounded-md"
            >
              <option value="ALL">All Types</option>
              <option value="HAZMAT">HazMat</option>
              <option value="REEFER">Reefer</option>
              <option value="DRY_VAN">Dry Van</option>
              <option value="FLATBED">Flatbed</option>
              <option value="TANKER">Tanker</option>
            </select>

            <Button
              variant="outline"
              className="border-gray-600 text-slate-400 hover:bg-gray-800"
            >
              <Filter size={18} className="mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {tab.label}
            <span className="bg-slate-800/20 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Loads List */}
      <div className="space-y-4">
        {filteredLoads.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <Package size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No loads found</h3>
            <p className="text-slate-500">Try adjusting your filters or check back later</p>
          </Card>
        ) : (
          filteredLoads.map((load: any) => (
            <Card key={load.id} className="bg-slate-800 border-slate-700 p-6 hover:border-blue-600 transition-all">
              {/* Load Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{load.title}</h3>
                    {load.hazmatClass && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 border border-red-700 rounded text-xs font-semibold">
                        <AlertTriangle size={12} />
                        {load.hazmatClass}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {load.origin}
                    </span>
                    <ArrowRight size={14} />
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {load.destination}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span>{load.distance} miles</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-lg border text-xs font-semibold ${getStatusColor(load.status)}`}>
                    {load.status}
                  </span>
                  <span className={`px-3 py-1 rounded-lg border text-xs font-semibold ${getLoadTypeColor(load.type)}`}>
                    {load.type.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Load Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 pb-4 border-b border-slate-700">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Pay</p>
                  <p className="text-white text-xl font-bold flex items-center gap-1">
                    <DollarSign size={18} className="text-green-400" />
                    {load.pay.toLocaleString()}
                  </p>
                  {load.fairnessScore && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${getFairnessColor(load.fairnessScore)}`}>
                      {getFairnessIcon(load.fairnessScore)}
                      {load.fairnessScore} Rate
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Pickup</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <Calendar size={14} className="text-blue-400" />
                    {new Date(load.pickupDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Delivery</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <Calendar size={14} className="text-purple-400" />
                    {new Date(load.deliveryDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Weight</p>
                  <p className="text-white font-semibold">{load.weight.toLocaleString()} lbs</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Urgency</p>
                  <p className={`font-semibold flex items-center gap-1 ${getUrgencyColor(load.urgency)}`}>
                    <Zap size={14} />
                    {load.urgency}
                  </p>
                </div>
              </div>

              {/* Shipper Info */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{load.shipper.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span>{load.shipper.rating}</span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <span>{load.shipper.totalLoads.toLocaleString()} loads</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Activity size={14} />
                  <span>{load.bidsCount} bids</span>
                </div>
              </div>

              {/* Required Certifications */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Required Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {load.requiredCerts.map((cert: any) => (
                    <span
                      key={cert}
                      className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-700 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Shield size={12} />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* My Bid Status (if exists) */}
              {load.myBid && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300 mb-1">Your Bid</p>
                      <p className="text-white text-lg font-bold">${load.myBid.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">
                        Submitted {new Date(load.myBid.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        load.myBid.status === "ACCEPTED" ? "bg-green-900/30 text-green-400" :
                        load.myBid.status === "REJECTED" ? "bg-red-900/30 text-red-400" :
                        load.myBid.status === "COUNTERED" ? "bg-orange-900/30 text-orange-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>
                        {load.myBid.status}
                      </span>
                      {load.myBid.status === "COUNTERED" && load.myBid.counterOffer && (
                        <p className="text-white font-semibold mt-2">
                          Counter: ${load.myBid.counterOffer.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                  onClick={() => toast.info("Load details modal would open")}
                >
                  <Eye size={16} className="mr-2" />
                  View Details
                </Button>

                {load.status === "AVAILABLE" && !load.myBid && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    onClick={() => handlePlaceBid(load)}
                  >
                    <Target size={16} className="mr-2" />
                    Place Bid
                  </Button>
                )}

                {load.myBid?.status === "PENDING" && (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    onClick={() => toast.info("Bid withdrawn")}
                  >
                    <X size={16} className="mr-2" />
                    Withdraw Bid
                  </Button>
                )}

                {load.myBid?.status === "COUNTERED" && (
                  <>
                    <Button
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      onClick={() => handleCounterOffer(load)}
                    >
                      <ThumbsUp size={16} className="mr-2" />
                      Review Offer
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      onClick={() => toast.info("Counter offer rejected")}
                    >
                      <ThumbsDown size={16} className="mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  className="border-gray-600 text-slate-400 hover:bg-gray-800"
                  onClick={() => toast.info("Chat opened")}
                >
                  <MessageSquare size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedLoad && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto z-50" onClick={() => setShowBidModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 p-6 max-w-lg w-full" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Place Bid</h2>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">{selectedLoad.title}</p>
              <p className="text-white font-semibold">{selectedLoad.origin} → {selectedLoad.destination}</p>
            </div>

            <div className="mb-4">
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Asking Price</label>
              <p className="text-white text-2xl font-bold">${selectedLoad.pay.toLocaleString()}</p>
            </div>

            <div className="mb-4">
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Your Bid Amount</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e: any) => setBidAmount(parseFloat(e.target.value))}
                  className="pl-10 bg-slate-700 border-slate-600 text-white text-xl font-bold"
                />
              </div>
              <input
                type="range"
                min={selectedLoad.pay * 0.7}
                max={selectedLoad.pay * 1.1}
                step={50}
                value={bidAmount}
                onChange={(e: any) => setBidAmount(parseFloat(e.target.value))}
                className="w-full mt-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>${(selectedLoad.pay * 0.7).toLocaleString()}</span>
                <span>${(selectedLoad.pay * 1.1).toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-400 text-sm">Fairness Meter</span>
                <div className="flex items-center gap-2">
                  {bidAmount >= selectedLoad.pay * 0.95 ? (
                    <>
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-green-400 font-semibold">Good Offer</span>
                    </>
                  ) : bidAmount >= selectedLoad.pay * 0.85 ? (
                    <>
                      <Minus size={16} className="text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">Fair Offer</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} className="text-red-400" />
                      <span className="text-red-400 font-semibold">Low Offer</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-slate-400 hover:bg-gray-800"
                onClick={() => setShowBidModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                onClick={handleSubmitBid}
              >
                <Send size={16} className="mr-2" />
                Submit Bid
              </Button>
            </div>
          </Card>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {showNegotiationModal && selectedLoad && selectedLoad.myBid?.counterOffer && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto z-50" onClick={() => setShowNegotiationModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 p-6 max-w-lg w-full" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Counter Offer Received</h2>
              <button
                onClick={() => setShowNegotiationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">{selectedLoad.title}</p>
              <p className="text-white font-semibold">{selectedLoad.origin} → {selectedLoad.destination}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Your Bid</p>
                <p className="text-white text-xl font-bold">${selectedLoad.myBid.amount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Their Counter</p>
                <p className="text-white text-xl font-bold">${selectedLoad.myBid.counterOffer.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Your Counter Offer (Optional)</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  value={counterOfferAmount}
                  onChange={(e: any) => setCounterOfferAmount(parseFloat(e.target.value))}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Message (Optional)</label>
              <textarea
                value={negotiationMessage}
                onChange={(e: any) => setNegotiationMessage(e.target.value)}
                placeholder="Add a message to your counter offer..."
                rows={3}
                className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                onClick={handleAcceptCounterOffer}
              >
                <ThumbsUp size={16} className="mr-2" />
                Accept
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                onClick={handleSendCounterOffer}
              >
                <Send size={16} className="mr-2" />
                Counter
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                onClick={handleRejectCounterOffer}
              >
                <ThumbsDown size={16} className="mr-2" />
                Reject
              </Button>
            </div>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}

