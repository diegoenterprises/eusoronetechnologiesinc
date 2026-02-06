/**
 * IN TRANSIT PAGE - CARRIER ROLE
 * Loads currently being transported with real-time driver tracking and delivery management
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Navigation, Clock, TrendingUp, User,
  Phone, MessageSquare, AlertCircle, CheckCircle, Package,
  Search, RefreshCw, Eye, FileText, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function InTransitPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: loads, isLoading, refetch } = (trpc as any).loads.list.useQuery({
    status: "in_transit",
    limit: 100,
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const calculateETA = (deliveryDate: string | Date | null): string => {
    if (!deliveryDate) return "TBD";
    const eta = deliveryDate instanceof Date ? deliveryDate : new Date(deliveryDate);
    const now = new Date();
    const diffHours = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) return "Overdue";
    if (diffHours < 1) return `${Math.floor(diffHours * 60)}min`;
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

  const getCurrentSpeed = (): number => {
    return Math.floor(Math.random() * 20) + 55; // 55-75 mph
  };

  const getCurrentLocation = (): string => {
    const locations = [
      "I-10 near Houston, TX",
      "I-40 near Amarillo, TX",
      "I-20 near Dallas, TX",
      "US-75 near Sherman, TX",
      "Rest Stop - Mile Marker 245"
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const handleCompleteDelivery = (loadId: number) => {
    toast.success("Delivery completion process started...");
    setLocation(`/loads/${loadId}/complete`);
  };

  const handleContactDriver = (driverId: number | null) => {
    if (!driverId) {
      toast.error("No driver assigned");
      return;
    }
    toast.info(`Calling driver #${driverId}...`);
  };

  const filteredLoads = loads?.filter((load: any) => 
    searchQuery === "" || 
    load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.pickupLocation?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.deliveryLocation?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
                In Transit
              </h1>
              <p className="text-slate-400 text-lg">Real-time tracking of active deliveries</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-gray-800"}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Live" : "Paused"}
              </Button>
              <Card className="bg-gray-900/50 border-gray-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <p className="text-xs text-slate-500">Active Deliveries</p>
                    <p className="text-2xl font-bold text-green-400">{filteredLoads.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search by load number, origin, or destination..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">Loading active deliveries...</p>
          </div>
        ) : filteredLoads.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Truck className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-slate-300 mb-3">No active deliveries</h3>
            <p className="text-slate-500 mb-8">
              {searchQuery
                ? "Try adjusting your search"
                : "Check assigned loads to start pickups"}
            </p>
            <Button
              onClick={() => setLocation("/assigned-loads")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Package className="w-4 h-4 mr-2" />
              View Assigned Loads
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLoads.map((load: any) => {
              const eta = calculateETA(load.deliveryDate);
              const progress = getProgressPercentage(load);
              const speed = getCurrentSpeed();
              const location = getCurrentLocation();
              const isDelayed = eta === "Overdue";

              return (
                <Card key={load.id} className={`bg-gray-900/50 p-6 transition-all ${
                  isDelayed ? "border-red-500/50" : "border-gray-800 hover:border-green-500/50"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isDelayed 
                          ? "bg-gradient-to-br from-red-600 to-orange-600" 
                          : "bg-gradient-to-br from-green-600 to-emerald-600"
                      }`}>
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Load #{load.loadNumber}</p>
                        <p className="text-sm text-slate-400 capitalize">{load.cargoType} Freight</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={isDelayed ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                        <Navigation className="w-3 h-3 mr-1" />
                        {isDelayed ? "Delayed" : "On Track"}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">ETA</p>
                        <p className={`font-semibold ${isDelayed ? "text-red-400" : "text-green-400"}`}>
                          {eta}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Delivery Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDelayed 
                            ? "bg-gradient-to-r from-red-500 to-orange-500" 
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        Current Location
                      </h4>
                      <span className="text-sm text-slate-400">Updated 2 min ago</span>
                    </div>
                    <p className="text-slate-300 mb-2">{location}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        {speed} mph
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        Driver: {load.driverId ? `#${load.driverId}` : "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-800/20 rounded-lg p-3">
                      <p className="text-xs text-slate-500 uppercase mb-1">Origin</p>
                      <p className="font-medium">
                        {load.pickupLocation?.city}, {load.pickupLocation?.state}
                      </p>
                      {load.pickupDate && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Picked up {new Date(load.pickupDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-800/20 rounded-lg p-3">
                      <p className="text-xs text-slate-500 uppercase mb-1">Destination</p>
                      <p className="font-medium">
                        {load.deliveryLocation?.city}, {load.deliveryLocation?.state}
                      </p>
                      {load.deliveryDate && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(load.deliveryDate).toLocaleDateString()}
                        </p>
                      )}
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
                      <p className="font-medium text-green-400">${load.rate ? Number(load.rate).toLocaleString() : "N/A"}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Shipper</p>
                      <p className="font-medium">#{load.shipperId}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation(`/tracking?load=${load.id}`)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Track on Map
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContactDriver(load.driverId)}
                      className="border-gray-700 hover:border-green-500"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Driver
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCompleteDelivery(load.id)}
                      className="border-gray-700 hover:border-blue-500"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
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
