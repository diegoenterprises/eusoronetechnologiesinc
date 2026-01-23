/**
 * ACTIVE LOADS PAGE - SHIPPER ROLE
 * Real-time tracking of in-transit shipments with live status updates
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Calendar, Clock, TrendingUp, Truck,
  AlertCircle, CheckCircle, XCircle, Navigation, Phone,
  MessageSquare, Eye, RefreshCw, Filter, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ActiveLoadsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({
    status: "in_transit",
    limit: 100,
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      picked_up: { label: "Picked Up", color: "bg-blue-500" },
      in_transit: { label: "In Transit", color: "bg-green-500" },
      delayed: { label: "Delayed", color: "bg-yellow-500" },
      at_facility: { label: "At Facility", color: "bg-purple-500" },
    };
    return badges[status] || { label: status, color: "bg-gray-500" };
  };

  const calculateETA = (deliveryDate: string | Date | null): string => {
    if (!deliveryDate) return "TBD";
    const eta = deliveryDate instanceof Date ? deliveryDate : new Date(deliveryDate);
    const now = new Date();
    const diffHours = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) return "Overdue";
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const getProgressPercentage = (load: any): number => {
    if (!load.pickupDate || !load.deliveryDate) return 0;
    const start = new Date(load.pickupDate).getTime();
    const end = new Date(load.deliveryDate).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const filteredLoads = loads?.filter(load => {
    const pickupCity = load.pickupLocation?.city || "";
    const deliveryCity = load.deliveryLocation?.city || "";
    const matchesSearch = searchQuery === "" || 
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deliveryCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                Active Loads
              </h1>
              <p className="text-gray-400 text-lg">Real-time tracking of in-transit shipments</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-gray-800 hover:border-green-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Card className="bg-gray-900/50 border-gray-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <p className="text-xs text-gray-500">Active Shipments</p>
                    <p className="text-2xl font-bold text-green-400">{filteredLoads.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by load number, origin, or destination..."
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
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="at_facility">At Facility</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading active shipments...</p>
          </div>
        ) : filteredLoads.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">No active loads</h3>
            <p className="text-gray-500 mb-8">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "All your shipments have been delivered"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLoads.map((load) => {
              const statusBadge = getStatusBadge(load.status);
              const eta = calculateETA(load.deliveryDate);
              const progress = getProgressPercentage(load);

              return (
                <Card key={load.id} className="bg-gray-900/50 border-gray-800 p-6 hover:border-green-500/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Load #{load.loadNumber}</p>
                        <p className="text-sm text-gray-400 capitalize">{load.cargoType} Freight</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusBadge.color} text-white`}>
                        {statusBadge.label}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">ETA</p>
                        <p className="font-semibold text-green-400">{eta}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-5">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Origin</p>
                        <p className="font-semibold">
                          {load.pickupLocation?.city || "N/A"}, {load.pickupLocation?.state || "N/A"}
                        </p>
                        {load.pickupDate && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            Picked up {new Date(load.pickupDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-green-500 via-gray-700 to-blue-500 relative">
                      <Navigation className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-green-400 bg-gray-900 px-1" />
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Destination</p>
                        <p className="font-semibold">
                          {load.deliveryLocation?.city || "N/A"}, {load.deliveryLocation?.state || "N/A"}
                        </p>
                        {load.deliveryDate && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1 justify-end">
                            <Clock className="w-3 h-3" />
                            Due {new Date(load.deliveryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Weight</p>
                      <p className="font-medium">{load.weight ? `${load.weight} ${load.weightUnit}` : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Distance</p>
                      <p className="font-medium">{load.distance ? `${load.distance} ${load.distanceUnit}` : "TBD"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Rate</p>
                      <p className="font-medium text-green-400">${load.rate ? Number(load.rate).toLocaleString() : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Carrier</p>
                      <p className="font-medium">Carrier #{load.carrierId || "TBD"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation(`/tracking?load=${load.id}`)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Track on Map
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/messages?carrier=${load.carrierId}`)}
                      className="border-gray-700 hover:border-blue-500"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/loads/${load.id}`)}
                      className="border-gray-700 hover:border-green-500"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
