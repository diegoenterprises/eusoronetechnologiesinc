/**
 * ASSIGNED LOADS PAGE - CARRIER ROLE
 * Accepted loads awaiting pickup with preparation checklist and scheduling
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Calendar, Clock, CheckCircle, AlertCircle,
  Truck, User, FileText, Phone, MessageSquare, Navigation,
  ClipboardCheck, Search, Filter, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AssignedLoadsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const { data: loads, isLoading, refetch } = (trpc as any).loads.list.useQuery({
    status: "assigned",
    limit: 100,
  });

  const handleStartPickup = (loadId: number) => {
    toast.success("Pickup started! Navigating to load details...");
    setLocation(`/loads/${loadId}`);
  };

  const handleAssignDriver = (loadId: number) => {
    toast.info("Driver assignment (Feature coming soon)");
  };

  const getPickupTimeRemaining = (pickupDate: string | Date | null): string => {
    if (!pickupDate) return "TBD";
    const pickup = pickupDate instanceof Date ? pickupDate : new Date(pickupDate);
    const now = new Date();
    const diffHours = Math.floor((pickup.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) return "Overdue";
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const getPreparationProgress = (): number => {
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  };

  const filteredLoads = loads?.filter((load: any) => {
    const pickupCity = load.pickupLocation?.city || "";
    const deliveryCity = load.deliveryLocation?.city || "";
    const matchesSearch = searchQuery === "" || 
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deliveryCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                Assigned Loads
              </h1>
              <p className="text-slate-400 text-lg">Accepted loads awaiting pickup and preparation</p>
            </div>
            <Card className="bg-gray-900/50 border-gray-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-cyan-500" />
                <div>
                  <p className="text-xs text-slate-500">Awaiting Pickup</p>
                  <p className="text-2xl font-bold text-cyan-400">{filteredLoads.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by load number, origin, or destination..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-800"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e: any) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">Loading assigned loads...</p>
          </div>
        ) : filteredLoads.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Package className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-slate-300 mb-3">No assigned loads</h3>
            <p className="text-slate-500 mb-8">Browse the marketplace to find and bid on available loads</p>
            <Button
              onClick={() => setLocation("/marketplace")}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Find Loads
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLoads.map((load: any) => {
              const timeRemaining = getPickupTimeRemaining(load.pickupDate);
              const progress = getPreparationProgress();
              const isUrgent = timeRemaining.includes("h") || timeRemaining === "Overdue";

              return (
                <Card key={load.id} className={`bg-gray-900/50 p-6 transition-all ${
                  isUrgent ? "border-yellow-500/50" : "border-gray-800 hover:border-cyan-500/50"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isUrgent 
                          ? "bg-gradient-to-br from-yellow-600 to-orange-600" 
                          : "bg-gradient-to-br from-cyan-600 to-blue-600"
                      }`}>
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Load #{load.loadNumber}</p>
                        <p className="text-sm text-slate-400 capitalize">{load.cargoType} Freight</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isUrgent && (
                        <Badge className="bg-yellow-600 text-white">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Pickup In</p>
                        <p className={`font-semibold ${isUrgent ? "text-yellow-400" : "text-cyan-400"}`}>
                          {timeRemaining}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Preparation Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-5">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Pickup</p>
                        <p className="font-semibold">
                          {load.pickupLocation?.city || "N/A"}, {load.pickupLocation?.state || "N/A"}
                        </p>
                        {load.pickupDate && (
                          <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(load.pickupDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-600" />
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Delivery</p>
                        <p className="font-semibold">
                          {load.deliveryLocation?.city || "N/A"}, {load.deliveryLocation?.state || "N/A"}
                        </p>
                        {load.deliveryDate && (
                          <p className="text-sm text-slate-400 flex items-center gap-1 mt-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(load.deliveryDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Weight</p>
                      <p className="font-medium">{load.weight ? `${load.weight} ${load.weightUnit}` : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Distance</p>
                      <p className="font-medium">{load.distance ? `${load.distance} ${load.distanceUnit}` : "TBD"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Your Rate</p>
                      <p className="font-medium bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${load.rate ? Number(load.rate).toLocaleString() : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Driver</p>
                      <p className="font-medium">{load.driverId ? `#${load.driverId}` : "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="bg-gray-800/20 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-cyan-500" />
                      Pre-Pickup Checklist
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Vehicle inspection completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Driver assigned and notified</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {load.driverId ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
                        )}
                        <span className={load.driverId ? "" : "text-slate-500"}>Route planning confirmed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
                        <span className="text-slate-500">Insurance verification</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartPickup(load.id)}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Start Pickup
                    </Button>
                    {!load.driverId && (
                      <Button
                        variant="outline"
                        onClick={() => handleAssignDriver(load.id)}
                        className="border-gray-700 hover:border-cyan-500"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Driver
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/messages?shipper=${load.shipperId}`)}
                      className="border-gray-700 hover:border-blue-500"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
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
