/**
 * BROKER DASHBOARD PAGE
 * Dashboard for Freight Brokers
 * Based on 03_BROKER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Package, DollarSign, TrendingUp, Search, Filter,
  Truck, CheckCircle, Clock, AlertTriangle, ChevronRight,
  Star, Shield, Phone, MessageSquare, ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShipperLoad {
  id: string;
  loadNumber: string;
  shipper: string;
  origin: string;
  destination: string;
  commodity: string;
  pickupDate: string;
  rate: number;
  status: "new" | "quoted" | "booked";
  priority: "normal" | "urgent";
}

interface CarrierCapacity {
  id: string;
  carrierName: string;
  usdot: string;
  equipment: string;
  location: string;
  availableDate: string;
  safetyRating: number;
  insurance: boolean;
  hazmatAuth: boolean;
  rate: number;
}

interface ActiveLoad {
  id: string;
  loadNumber: string;
  shipper: string;
  carrier: string;
  status: "booked" | "dispatched" | "in_transit" | "delivered";
  shipperRate: number;
  carrierRate: number;
  margin: number;
  pickupDate: string;
}

const STATS = {
  activeLoads: 24,
  pendingMatches: 8,
  weeklyVolume: 156,
  commissionEarned: 12450,
  marginAverage: 15.2,
  onTimeRate: 96,
};

const MOCK_SHIPPER_LOADS: ShipperLoad[] = [
  { id: "sl1", loadNumber: "LOAD-45920", shipper: "Shell Oil", origin: "Houston, TX", destination: "Dallas, TX", commodity: "Gasoline", pickupDate: "Jan 24", rate: 2800, status: "new", priority: "urgent" },
  { id: "sl2", loadNumber: "LOAD-45921", shipper: "Exxon", origin: "Beaumont, TX", destination: "Austin, TX", commodity: "Diesel", pickupDate: "Jan 25", rate: 3100, status: "new", priority: "normal" },
  { id: "sl3", loadNumber: "LOAD-45918", shipper: "Chevron", origin: "Port Arthur, TX", destination: "San Antonio, TX", commodity: "Jet Fuel", pickupDate: "Jan 24", rate: 2600, status: "quoted", priority: "normal" },
];

const MOCK_CARRIERS: CarrierCapacity[] = [
  { id: "cc1", carrierName: "ABC Transport", usdot: "1234567", equipment: "MC-306", location: "Houston, TX", availableDate: "Jan 24", safetyRating: 95, insurance: true, hazmatAuth: true, rate: 2400 },
  { id: "cc2", carrierName: "XYZ Hazmat", usdot: "2345678", equipment: "MC-306", location: "Dallas, TX", availableDate: "Jan 24", safetyRating: 92, insurance: true, hazmatAuth: true, rate: 2500 },
  { id: "cc3", carrierName: "SafeHaul Inc", usdot: "3456789", equipment: "MC-407", location: "Austin, TX", availableDate: "Jan 25", safetyRating: 88, insurance: true, hazmatAuth: true, rate: 2350 },
];

const MOCK_ACTIVE: ActiveLoad[] = [
  { id: "al1", loadNumber: "LOAD-45910", shipper: "Shell Oil", carrier: "ABC Transport", status: "in_transit", shipperRate: 2800, carrierRate: 2400, margin: 14.3, pickupDate: "Jan 23" },
  { id: "al2", loadNumber: "LOAD-45908", shipper: "Valero", carrier: "XYZ Hazmat", status: "dispatched", shipperRate: 3200, carrierRate: 2750, margin: 14.1, pickupDate: "Jan 23" },
  { id: "al3", loadNumber: "LOAD-45905", shipper: "Marathon", carrier: "SafeHaul Inc", status: "delivered", shipperRate: 2600, carrierRate: 2200, margin: 15.4, pickupDate: "Jan 22" },
];

const STATUS_COLORS = {
  booked: "bg-blue-500/20 text-blue-400",
  dispatched: "bg-yellow-500/20 text-yellow-400",
  in_transit: "bg-green-500/20 text-green-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
};

export default function BrokerDashboard() {
  const [shipperLoads] = useState<ShipperLoad[]>(MOCK_SHIPPER_LOADS);
  const [carriers] = useState<CarrierCapacity[]>(MOCK_CARRIERS);
  const [activeLoads] = useState<ActiveLoad[]>(MOCK_ACTIVE);
  const [activeTab, setActiveTab] = useState("matching");

  const handleMatch = (loadId: string, carrierId: string) => {
    toast.success("Match created!", {
      description: "Carrier has been notified of the load opportunity.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Broker Dashboard</h1>
          <p className="text-slate-400">Match shippers with carriers and manage loads</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Package className="w-4 h-4 mr-2" />
          New Quote
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Loads</p>
                <p className="text-2xl font-bold text-white">{STATS.activeLoads}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending Matches</p>
                <p className="text-2xl font-bold text-yellow-400">{STATS.pendingMatches}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Weekly Volume</p>
                <p className="text-2xl font-bold text-white">{STATS.weeklyVolume}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Commission</p>
                <p className="text-2xl font-bold text-green-400">${STATS.commissionEarned.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Avg Margin</p>
                <p className="text-2xl font-bold text-white">{STATS.marginAverage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">On-Time Rate</p>
                <p className="text-2xl font-bold text-white">{STATS.onTimeRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="matching">Load Matching</TabsTrigger>
          <TabsTrigger value="active">Active Loads</TabsTrigger>
          <TabsTrigger value="carriers">Carrier Pool</TabsTrigger>
        </TabsList>

        <TabsContent value="matching" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipper Loads */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Shipper Loads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shipperLoads.map((load) => (
                    <div key={load.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{load.loadNumber}</span>
                            {load.priority === "urgent" && (
                              <Badge className="bg-red-500/20 text-red-400">Urgent</Badge>
                            )}
                            <Badge className={cn(
                              "text-xs",
                              load.status === "new" && "bg-green-500/20 text-green-400",
                              load.status === "quoted" && "bg-yellow-500/20 text-yellow-400"
                            )}>
                              {load.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{load.shipper}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {load.origin} → {load.destination}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-slate-400">{load.commodity}</span>
                            <span className="text-slate-400">{load.pickupDate}</span>
                            <span className="text-green-400 font-medium">${load.rate.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Find Carrier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Carrier Capacity */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-400" />
                  Available Carriers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {carriers.map((carrier) => (
                    <div key={carrier.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{carrier.carrierName}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-slate-400">{carrier.safetyRating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">USDOT: {carrier.usdot}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs text-slate-400">{carrier.equipment}</Badge>
                            <Badge variant="outline" className="text-xs text-slate-400">{carrier.location}</Badge>
                            {carrier.hazmatAuth && (
                              <Badge className="text-xs bg-orange-500/20 text-orange-400">Hazmat</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-slate-400">Available: {carrier.availableDate}</span>
                            <span className="text-blue-400 font-medium">${carrier.rate.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" className="border-slate-600">
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Loads In Progress
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-slate-600">
                    <Filter className="w-4 h-4 mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                      <th className="pb-3 pr-4">Load #</th>
                      <th className="pb-3 pr-4">Shipper</th>
                      <th className="pb-3 pr-4">Carrier</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Shipper Rate</th>
                      <th className="pb-3 pr-4">Carrier Rate</th>
                      <th className="pb-3 pr-4">Margin</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoads.map((load) => (
                      <tr key={load.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="py-3 pr-4">
                          <span className="text-white font-medium">{load.loadNumber}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{load.shipper}</td>
                        <td className="py-3 pr-4 text-slate-300">{load.carrier}</td>
                        <td className="py-3 pr-4">
                          <Badge className={STATUS_COLORS[load.status]}>
                            {load.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-green-400">${load.shipperRate.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-blue-400">${load.carrierRate.toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            "font-medium",
                            load.margin >= 15 ? "text-green-400" : "text-yellow-400"
                          )}>
                            {load.margin}%
                          </span>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Margin Summary */}
              <div className="mt-6 p-4 rounded-lg bg-slate-700/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Total Shipper Revenue</p>
                    <p className="text-xl font-bold text-green-400">
                      ${activeLoads.reduce((sum, l) => sum + l.shipperRate, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Carrier Cost</p>
                    <p className="text-xl font-bold text-blue-400">
                      ${activeLoads.reduce((sum, l) => sum + l.carrierRate, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Gross Margin</p>
                    <p className="text-xl font-bold text-purple-400">
                      ${activeLoads.reduce((sum, l) => sum + (l.shipperRate - l.carrierRate), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-400" />
                  Carrier Pool
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Search carriers..." className="pl-9 w-64 bg-slate-700/50 border-slate-600 text-white" />
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Add Carrier
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carriers.map((carrier) => (
                  <Card key={carrier.id} className="bg-slate-700/30 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{carrier.carrierName}</p>
                          <p className="text-xs text-slate-500">USDOT: {carrier.usdot}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className={cn(
                            "w-4 h-4",
                            carrier.safetyRating >= 90 ? "text-green-400" : "text-yellow-400"
                          )} />
                          <span className="text-sm font-medium text-white">{carrier.safetyRating}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs text-slate-400">{carrier.equipment}</Badge>
                        {carrier.insurance && (
                          <Badge className="text-xs bg-green-500/20 text-green-400">Insured</Badge>
                        )}
                        {carrier.hazmatAuth && (
                          <Badge className="text-xs bg-orange-500/20 text-orange-400">Hazmat</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-slate-400">{carrier.location}</span>
                        <span className="text-blue-400 font-medium">${carrier.rate}/load avg</span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 border-slate-600">
                          Profile
                        </Button>
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          Assign Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
