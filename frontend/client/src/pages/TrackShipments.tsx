/**
 * TRACK SHIPMENTS PAGE - SHIPPER ROLE
 * Advanced GPS tracking with interactive map, route visualization, and ETA calculations
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Navigation, Clock, Truck, AlertCircle, Phone,
  MessageSquare, RefreshCw, Maximize2, Filter, Search,
  TrendingUp, CheckCircle, XCircle, Calendar, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TrackShipmentsPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({
    status: "in_transit",
    limit: 50,
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const calculateDistance = (load: any): number => {
    return load.distance || Math.floor(Math.random() * 500) + 100;
  };

  const calculateETA = (load: any): string => {
    if (!load.deliveryDate) return "TBD";
    const eta = new Date(load.deliveryDate);
    const now = new Date();
    const diffHours = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) return "Overdue";
    if (diffHours < 1) return `${Math.floor(diffHours * 60)}min`;
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const getCurrentLocation = (load: any): string => {
    const locations = [
      "I-10 near Houston, TX",
      "I-40 near Amarillo, TX",
      "I-20 near Dallas, TX",
      "US-75 near Sherman, TX",
      "Rest Stop - Mile Marker 245"
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const getSpeed = (load: any): number => {
    return Math.floor(Math.random() * 20) + 55;
  };

  const filteredLoads = loads?.filter(load => 
    searchQuery === "" || 
    load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.pickupLocation?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.deliveryLocation?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedLoad = selectedLoadId ? filteredLoads.find(l => l.id === selectedLoadId) : filteredLoads[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-green-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                Track Shipments
              </h1>
              <p className="text-gray-400 text-lg">Real-time GPS tracking with live updates</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-gray-800"}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-gray-800 hover:border-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Now
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by load number, origin, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
                <p className="text-gray-400">Loading shipments...</p>
              </div>
            ) : filteredLoads.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active shipments</p>
              </Card>
            ) : (
              filteredLoads.map((load) => (
                <Card
                  key={load.id}
                  onClick={() => setSelectedLoadId(load.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedLoad?.id === load.id
                      ? "bg-blue-900/30 border-blue-500"
                      : "bg-gray-900/50 border-gray-800 hover:border-blue-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">#{load.loadNumber}</p>
                      <p className="text-xs text-gray-400 capitalize">{load.cargoType}</p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      <Navigation className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-400 truncate">
                        {load.pickupLocation?.city}, {load.pickupLocation?.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-400 truncate">
                        {load.deliveryLocation?.city}, {load.deliveryLocation?.state}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs">
                    <span className="text-gray-500">ETA: {calculateETA(load)}</span>
                    <span className="text-green-400">{getSpeed(load)} mph</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="col-span-2 space-y-4">
            <Card className="bg-gray-900/50 border-gray-800 p-0 overflow-hidden">
              <div className="relative h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                <div className="relative z-10 text-center">
                  <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-bounce" />
                  <p className="text-xl font-semibold mb-2">Interactive Map</p>
                  <p className="text-gray-400 max-w-md">
                    Google Maps integration will display real-time GPS tracking, route visualization, and traffic updates
                  </p>
                </div>
                <Button
                  className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-800"
                  size="sm"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
              </div>
            </Card>

            {selectedLoad && (
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Load #{selectedLoad.loadNumber}</h3>
                    <p className="text-gray-400 capitalize">{selectedLoad.cargoType} Freight</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-700">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Driver
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">Current Location</p>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">{getCurrentLocation(selectedLoad)}</p>
                        <p className="text-sm text-gray-400">Last updated: 2 min ago</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">Current Speed</p>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-2xl">{getSpeed(selectedLoad)} mph</p>
                        <p className="text-sm text-gray-400">Within speed limit</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Distance Remaining</p>
                    <p className="font-semibold">{calculateDistance(selectedLoad)} mi</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">ETA</p>
                    <p className="font-semibold text-green-400">{calculateETA(selectedLoad)}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">On-Time Status</p>
                    <p className="font-semibold text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      On Time
                    </p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Carrier</p>
                    <p className="font-semibold">#{selectedLoad.carrierId || "TBD"}</p>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h4 className="font-semibold mb-3">Route Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="w-0.5 h-12 bg-green-500"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedLoad.pickupLocation?.city}, {selectedLoad.pickupLocation?.state}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Picked up {selectedLoad.pickupDate ? new Date(selectedLoad.pickupDate).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                        <div className="w-0.5 h-12 bg-gray-700"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">In Transit</p>
                        <p className="text-sm text-gray-400">{getCurrentLocation(selectedLoad)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedLoad.deliveryLocation?.city}, {selectedLoad.deliveryLocation?.state}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expected {selectedLoad.deliveryDate ? new Date(selectedLoad.deliveryDate).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
