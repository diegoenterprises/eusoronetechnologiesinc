/**
 * MY LOADS PAGE - SHIPPER ROLE
 * Comprehensive load management for shippers
 * Shows all loads created by the shipper with advanced filtering and status tracking
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Calendar, DollarSign, TrendingUp,
  Filter, Search, Plus, Eye, Edit, Trash2, Download,
  CheckCircle, XCircle, AlertCircle, Truck, Clock,
  BarChart3, FileText, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";

type LoadStatus = "draft" | "posted" | "bidding" | "assigned" | "in_transit" | "delivered" | "cancelled" | "disputed";

export default function MyLoadsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoadStatus | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");

  // Fetch shipper's loads from database
  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    limit: 100,
  });

  const deleteLoadMutation = trpc.loads.deleteLoad.useMutation({
    onSuccess: () => {
      toast.success("Load deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete load: ${error.message}`);
    },
  });

  const getStatusColor = (status: LoadStatus) => {
    switch (status) {
      case "draft": return "text-gray-400 bg-gray-900/30 border-gray-700";
      case "posted": return "text-blue-400 bg-blue-900/30 border-blue-700";
      case "bidding": return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
      case "assigned": return "text-green-400 bg-green-900/30 border-green-700";
      case "in_transit": return "text-purple-400 bg-purple-900/30 border-purple-700";
      case "delivered": return "text-emerald-400 bg-emerald-900/30 border-emerald-700";
      case "cancelled": return "text-red-400 bg-red-900/30 border-red-700";
      case "disputed": return "text-orange-400 bg-orange-900/30 border-orange-700";
      default: return "text-gray-400 bg-gray-900/30 border-gray-700";
    }
  };

  const getStatusIcon = (status: LoadStatus) => {
    switch (status) {
      case "draft": return <Edit className="w-4 h-4" />;
      case "posted": return <Package className="w-4 h-4" />;
      case "bidding": return <TrendingUp className="w-4 h-4" />;
      case "assigned": return <CheckCircle className="w-4 h-4" />;
      case "in_transit": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "disputed": return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleViewLoad = (loadId: number) => {
    setLocation(`/loads/${loadId}`);
  };

  const handleEditLoad = (loadId: number) => {
    setLocation(`/loads/${loadId}/edit`);
  };

  const handleDeleteLoad = (loadId: number) => {
    if (confirm("Are you sure you want to delete this load? This action cannot be undone.")) {
      deleteLoadMutation.mutate({ loadId });
    }
  };

  const handleExportLoads = () => {
    toast.info("Exporting loads to CSV...");
    // TODO: Implement CSV export
  };

  const filteredLoads = loads?.filter(load => {
    const pickupCity = load.pickupLocation?.city || "";
    const deliveryCity = load.deliveryLocation?.city || "";
    const cargoType = load.cargoType || "";
    
    const matchesSearch = searchQuery === "" || 
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deliveryCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cargoType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const statusCounts = {
    ALL: loads?.length || 0,
    draft: loads?.filter(l => l.status === "draft").length || 0,
    posted: loads?.filter(l => l.status === "posted").length || 0,
    bidding: loads?.filter(l => l.status === "bidding").length || 0,
    assigned: loads?.filter(l => l.status === "assigned").length || 0,
    in_transit: loads?.filter(l => l.status === "in_transit").length || 0,
    delivered: loads?.filter(l => l.status === "delivered").length || 0,
    cancelled: loads?.filter(l => l.status === "cancelled").length || 0,
    disputed: loads?.filter(l => l.status === "disputed").length || 0,
  };

  // Calculate summary stats
  const totalRevenue = filteredLoads
    .filter(l => l.status === "delivered")
    .reduce((sum, l) => sum + (Number(l.rate) || 0), 0);
  
  const activeLoads = filteredLoads.filter(l => 
    l.status === "in_transit" || l.status === "assigned"
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              My Loads
            </h1>
            <p className="text-gray-400">Manage all your shipment loads with real-time tracking</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportLoads}
              className="border-gray-700 hover:border-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setLocation("/loads/create")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Load
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Loads</p>
                <p className="text-3xl font-bold text-blue-400">{statusCounts.ALL}</p>
              </div>
              <Package className="w-12 h-12 text-blue-400/30" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Loads</p>
                <p className="text-3xl font-bold text-purple-400">{activeLoads}</p>
              </div>
              <Truck className="w-12 h-12 text-purple-400/30" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Delivered</p>
                <p className="text-3xl font-bold text-green-400">{statusCounts.delivered}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400/30" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-700/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-400/30" />
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by load number, origin, destination, or cargo type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Button variant="outline" className="border-gray-800 hover:border-blue-500">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["ALL", "draft", "posted", "bidding", "assigned", "in_transit", "delivered", "cancelled", "disputed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium ${
                statusFilter === status
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {status === "ALL" ? "ALL" : status.replace("_", " ").toUpperCase()} 
              <span className="ml-2 text-xs opacity-75">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loads List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your loads...</p>
        </div>
      ) : filteredLoads.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
          <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-300 mb-3">No loads found</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search criteria or filters to find what you're looking for"
              : "Get started by creating your first load and connecting with carriers"}
          </p>
          <Button
            onClick={() => setLocation("/loads/create")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Load
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLoads.map((load) => (
            <Card key={load.id} className="bg-gray-900/50 border-gray-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Load Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border ${getStatusColor(load.status)}`}>
                      {getStatusIcon(load.status)}
                      {load.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm font-mono">#{load.loadNumber}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(load.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-6 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Origin</p>
                        <p className="font-semibold text-lg">
                          {load.pickupLocation?.city || "N/A"}, {load.pickupLocation?.state || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-green-500 via-gray-700 to-red-500"></div>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide text-right">Destination</p>
                        <p className="font-semibold text-lg text-right">
                          {load.deliveryLocation?.city || "N/A"}, {load.deliveryLocation?.state || "N/A"}
                        </p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                  </div>

                  {/* Load Details */}
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Cargo Type</p>
                      <p className="font-medium capitalize">{load.cargoType}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Weight</p>
                      <p className="font-medium">{load.weight ? `${load.weight} ${load.weightUnit}` : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Distance</p>
                      <p className="font-medium">{load.distance ? `${load.distance} ${load.distanceUnit}` : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Pickup Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : "TBD"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-lg p-3 border border-green-700/30">
                      <p className="text-gray-500 text-xs mb-1">Rate</p>
                      <p className="font-bold flex items-center gap-1 text-green-400 text-lg">
                        <DollarSign className="w-4 h-4" />
                        {load.rate ? Number(load.rate).toLocaleString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewLoad(load.id)}
                    className="border-gray-700 hover:border-blue-500 hover:text-blue-400"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {(load.status === "draft" || load.status === "posted") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLoad(load.id)}
                      className="border-gray-700 hover:border-yellow-500 hover:text-yellow-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {load.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLoad(load.id)}
                      className="border-gray-700 hover:border-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  {load.status === "bidding" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/loads/${load.id}/bids`)}
                      className="border-gray-700 hover:border-purple-500 hover:text-purple-400"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Bids
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
