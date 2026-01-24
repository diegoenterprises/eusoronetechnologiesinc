/**
 * SHIPPER LOAD MANAGEMENT PAGE
 * For Shippers to manage their posted loads
 * Based on 01_SHIPPER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Plus, Search, Filter, Eye, Edit2, Trash2,
  Clock, MapPin, DollarSign, Truck, Users, CheckCircle,
  AlertTriangle, ChevronRight, MessageSquare, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ShipperLoad {
  id: string;
  loadNumber: string;
  status: "draft" | "posted" | "bidding" | "booked" | "in_transit" | "delivered" | "cancelled";
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  commodity: string;
  hazmatClass?: string;
  quantity: string;
  weight: number;
  equipmentType: string;
  pickupDate: string;
  deliveryDate: string;
  rate: number;
  bidsCount: number;
  assignedCarrier?: string;
  createdAt: string;
}

const MOCK_LOADS: ShipperLoad[] = [
  {
    id: "l1", loadNumber: "LOAD-45901", status: "in_transit",
    origin: { city: "Houston", state: "TX" }, destination: { city: "Dallas", state: "TX" },
    commodity: "Gasoline", hazmatClass: "3", quantity: "8,500 gallons", weight: 42000,
    equipmentType: "MC-306", pickupDate: "Jan 23, 2026", deliveryDate: "Jan 23, 2026",
    rate: 2800, bidsCount: 5, assignedCarrier: "ABC Transport", createdAt: "Jan 20, 2026"
  },
  {
    id: "l2", loadNumber: "LOAD-45902", status: "bidding",
    origin: { city: "Beaumont", state: "TX" }, destination: { city: "San Antonio", state: "TX" },
    commodity: "Diesel Fuel", hazmatClass: "3", quantity: "9,000 gallons", weight: 44000,
    equipmentType: "MC-306", pickupDate: "Jan 24, 2026", deliveryDate: "Jan 24, 2026",
    rate: 3200, bidsCount: 3, createdAt: "Jan 21, 2026"
  },
  {
    id: "l3", loadNumber: "LOAD-45903", status: "posted",
    origin: { city: "Port Arthur", state: "TX" }, destination: { city: "Austin", state: "TX" },
    commodity: "Jet Fuel", hazmatClass: "3", quantity: "8,000 gallons", weight: 40000,
    equipmentType: "MC-306", pickupDate: "Jan 25, 2026", deliveryDate: "Jan 25, 2026",
    rate: 2600, bidsCount: 0, createdAt: "Jan 22, 2026"
  },
  {
    id: "l4", loadNumber: "LOAD-45898", status: "delivered",
    origin: { city: "Corpus Christi", state: "TX" }, destination: { city: "Houston", state: "TX" },
    commodity: "Crude Oil", hazmatClass: "3", quantity: "180 barrels", weight: 46000,
    equipmentType: "MC-406", pickupDate: "Jan 21, 2026", deliveryDate: "Jan 21, 2026",
    rate: 4200, bidsCount: 7, assignedCarrier: "XYZ Hazmat", createdAt: "Jan 18, 2026"
  },
  {
    id: "l5", loadNumber: "LOAD-45904", status: "draft",
    origin: { city: "Houston", state: "TX" }, destination: { city: "El Paso", state: "TX" },
    commodity: "Ethanol", hazmatClass: "3", quantity: "7,500 gallons", weight: 38000,
    equipmentType: "MC-306", pickupDate: "Jan 26, 2026", deliveryDate: "Jan 27, 2026",
    rate: 5500, bidsCount: 0, createdAt: "Jan 23, 2026"
  },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-400",
  posted: "bg-blue-500/20 text-blue-400",
  bidding: "bg-purple-500/20 text-purple-400",
  booked: "bg-cyan-500/20 text-cyan-400",
  in_transit: "bg-green-500/20 text-green-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const STATS = {
  total: 45,
  active: 12,
  inTransit: 8,
  delivered: 127,
  pending: 5,
  avgRate: 3250,
};

export default function ShipperLoads() {
  const [loads] = useState<ShipperLoad[]>(MOCK_LOADS);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const filteredLoads = loads.filter(load => {
    const matchesSearch = !searchTerm || 
      load.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.origin.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && ["posted", "bidding", "booked", "in_transit"].includes(load.status);
    if (activeTab === "draft") return matchesSearch && load.status === "draft";
    if (activeTab === "completed") return matchesSearch && load.status === "delivered";
    return matchesSearch;
  });

  const handleViewBids = (loadId: string) => {
    navigate(`/loads/${loadId}/bids`);
  };

  const handleCreateLoad = () => {
    navigate("/loads/create");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Loads</h1>
          <p className="text-slate-400">Manage your posted loads and track shipments</p>
        </div>
        <Button onClick={handleCreateLoad} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Load
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Loads</p>
                <p className="text-2xl font-bold text-white">{STATS.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active</p>
                <p className="text-2xl font-bold text-blue-400">{STATS.active}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">In Transit</p>
                <p className="text-2xl font-bold text-green-400">{STATS.inTransit}</p>
              </div>
              <Truck className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Delivered</p>
                <p className="text-2xl font-bold text-emerald-400">{STATS.delivered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending Bids</p>
                <p className="text-2xl font-bold text-purple-400">{STATS.pending}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Avg Rate</p>
                <p className="text-2xl font-bold text-green-400">${STATS.avgRate.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search loads..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <Button variant="outline" className="border-slate-600">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" className="border-slate-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="all">All Loads</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredLoads.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No loads found</p>
                  <Button onClick={handleCreateLoad} className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Create Your First Load
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredLoads.map((load) => (
                <Card key={load.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Load Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg text-white">{load.loadNumber}</span>
                          <Badge className={STATUS_COLORS[load.status]}>
                            {load.status.replace("_", " ")}
                          </Badge>
                          {load.hazmatClass && (
                            <Badge className="bg-orange-500/20 text-orange-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Class {load.hazmatClass}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm mb-3">
                          <span className="text-slate-300">{load.origin.city}, {load.origin.state}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300">{load.destination.city}, {load.destination.state}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span>{load.commodity}</span>
                          <span>{load.quantity}</span>
                          <span>{load.equipmentType}</span>
                          <span>Pickup: {load.pickupDate}</span>
                        </div>

                        {load.assignedCarrier && (
                          <div className="mt-3 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">{load.assignedCarrier}</span>
                          </div>
                        )}
                      </div>

                      {/* Rate & Actions */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">${load.rate.toLocaleString()}</p>
                          {load.bidsCount > 0 && (
                            <p className="text-xs text-purple-400">{load.bidsCount} bid{load.bidsCount !== 1 ? "s" : ""}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {load.status === "draft" && (
                            <>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Post Load
                              </Button>
                            </>
                          )}

                          {(load.status === "posted" || load.status === "bidding") && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-slate-600"
                                onClick={() => handleViewBids(load.id)}
                              >
                                <Users className="w-3 h-3 mr-1" />
                                View Bids ({load.bidsCount})
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </>
                          )}

                          {load.status === "in_transit" && (
                            <>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                Track
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Message
                              </Button>
                            </>
                          )}

                          {load.status === "delivered" && (
                            <Button size="sm" variant="outline" className="border-slate-600">
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
