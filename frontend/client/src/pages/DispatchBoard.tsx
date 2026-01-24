/**
 * DISPATCH BOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Clock, MapPin, AlertTriangle, User, Phone,
  CheckCircle, XCircle, Search, ChevronRight, Package,
  Fuel, Shield, Star, MessageSquare, Navigation, Send, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DispatchBoard() {
  const [activeTab, setActiveTab] = useState("loads");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const loadsQuery = trpc.loads.list.useQuery({ status: "pending", limit: 50 });
  const driversQuery = trpc.drivers.list.useQuery({ status: "available", limit: 50 });
  const assignedQuery = trpc.loads.list.useQuery({ status: "assigned", limit: 50 });
  const inTransitQuery = trpc.loads.list.useQuery({ status: "in_transit", limit: 50 });

  const assignMutation = trpc.loads.assign.useMutation({
    onSuccess: () => {
      toast.success("Driver assigned to load");
      setSelectedLoad(null);
      setSelectedDriver(null);
      loadsQuery.refetch();
      driversQuery.refetch();
      assignedQuery.refetch();
    },
    onError: (error) => toast.error("Assignment failed", { description: error.message }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "driving": return "bg-blue-500/20 text-blue-400";
      case "on_duty": return "bg-yellow-500/20 text-yellow-400";
      case "off_duty": case "sleeper": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getLoadStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "assigned": return "bg-blue-500/20 text-blue-400";
      case "in_transit": return "bg-green-500/20 text-green-400";
      case "delivered": return "bg-purple-500/20 text-purple-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const handleAssign = () => {
    if (selectedLoad && selectedDriver) {
      assignMutation.mutate({ loadId: selectedLoad, driverId: selectedDriver });
    }
  };

  const pendingLoads = loadsQuery.data?.loads || [];
  const availableDrivers = driversQuery.data?.drivers || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dispatch Board</h1>
          <p className="text-slate-400 text-sm">Manage loads and driver assignments</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <Package className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">{pendingLoads.length} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30">
            <User className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">{availableDrivers.length} Available</span>
          </div>
        </div>
      </div>

      {/* Assignment Panel */}
      {(selectedLoad || selectedDriver) && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-slate-500">Selected Load</p>
                  <p className="text-white font-medium">{selectedLoad || "None"}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Selected Driver</p>
                  <p className="text-white font-medium">{selectedDriver ? availableDrivers.find(d => d.id === selectedDriver)?.firstName + " " + availableDrivers.find(d => d.id === selectedDriver)?.lastName : "None"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-slate-600" onClick={() => { setSelectedLoad(null); setSelectedDriver(null); }}>
                  <XCircle className="w-4 h-4 mr-2" />Clear
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAssign} disabled={!selectedLoad || !selectedDriver || assignMutation.isPending}>
                  {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Assign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loads Panel */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-400" />Pending Loads
              </CardTitle>
              <div className="relative w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-9 h-8 bg-slate-700/50 border-slate-600 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {loadsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : pendingLoads.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">No pending loads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLoads.filter(l => !searchTerm || l.loadNumber.toLowerCase().includes(searchTerm.toLowerCase())).map((load) => (
                  <div
                    key={load.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedLoad === load.id ? "bg-blue-500/20 border-blue-500" : "bg-slate-700/30 border-slate-700 hover:border-slate-600"
                    )}
                    onClick={() => setSelectedLoad(load.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold">{load.loadNumber}</span>
                      <Badge className={getLoadStatusColor(load.status)}>{load.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span>{load.pickupLocation?.city}, {load.pickupLocation?.state}</span>
                      <ChevronRight className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{load.deliveryLocation?.city}, {load.deliveryLocation?.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{load.commodity}</span>
                      <span className="text-green-400 font-medium">${load.rate?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drivers Panel */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-green-400" />Available Drivers
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400">{availableDrivers.length} Ready</Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {driversQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : availableDrivers.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-slate-400">No available drivers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedDriver === driver.id ? "bg-green-500/20 border-green-500" : "bg-slate-700/30 border-slate-700 hover:border-slate-600"
                    )}
                    onClick={() => setSelectedDriver(driver.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.firstName} {driver.lastName}</p>
                          <p className="text-xs text-slate-500">{driver.truckNumber}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(driver.status)}>{driver.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{driver.hoursAvailable || 0}h avail
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{driver.currentLocation?.city || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400">{driver.rating || 0}</span>
                      </div>
                    </div>
                    {driver.endorsements && driver.endorsements.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {driver.endorsements.map((e: string) => (
                          <Badge key={e} className="bg-blue-500/20 text-blue-400 text-xs">{e}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Loads */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="loads" className="data-[state=active]:bg-blue-600">Assigned ({assignedQuery.data?.loads?.length || 0})</TabsTrigger>
          <TabsTrigger value="transit" className="data-[state=active]:bg-blue-600">In Transit ({inTransitQuery.data?.loads?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="loads" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {assignedQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : assignedQuery.data?.loads?.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No assigned loads</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {assignedQuery.data?.loads?.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Truck className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-slate-400">{load.pickupLocation?.city} to {load.deliveryLocation?.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getLoadStatusColor(load.status)}>{load.status}</Badge>
                        <Button variant="ghost" size="sm"><MessageSquare className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Navigation className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transit" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {inTransitQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : inTransitQuery.data?.loads?.length === 0 ? (
                <div className="p-8 text-center">
                  <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No loads in transit</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {inTransitQuery.data?.loads?.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Truck className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-slate-400">{load.pickupLocation?.city} to {load.deliveryLocation?.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-400 font-medium">ETA: {load.deliveryDate}</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">In Transit</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
