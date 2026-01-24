/**
 * CARRIER LOAD BOARD PAGE
 * Available loads marketplace for carriers
 * Based on 02_CARRIER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, MapPin, Clock, DollarSign, Truck, Filter,
  Search, ChevronRight, Star, AlertTriangle, Sparkles,
  RefreshCw, ArrowUpDown, Calculator, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvailableLoad {
  id: string;
  loadNumber: string;
  shipper: string;
  shipperRating: number;
  origin: {
    city: string;
    state: string;
    address: string;
  };
  destination: {
    city: string;
    state: string;
    address: string;
  };
  distance: number;
  commodity: string;
  hazmatClass?: string;
  unNumber?: string;
  weight: number;
  quantity: string;
  equipmentRequired: string;
  pickupDate: string;
  pickupWindow: string;
  deliveryDate: string;
  rate: number;
  ratePerMile: number;
  suggestedRate: { min: number; max: number };
  postedAt: string;
  bidsCount: number;
  specialRequirements: string[];
  isUrgent: boolean;
  matchScore?: number;
}

const MOCK_LOADS: AvailableLoad[] = [
  {
    id: "l1",
    loadNumber: "LOAD-45910",
    shipper: "Shell Oil Company",
    shipperRating: 4.8,
    origin: { city: "Houston", state: "TX", address: "1234 Industrial Blvd" },
    destination: { city: "Dallas", state: "TX", address: "5678 Commerce St" },
    distance: 250,
    commodity: "Gasoline",
    hazmatClass: "3",
    unNumber: "UN1203",
    weight: 42000,
    quantity: "8,500 gallons",
    equipmentRequired: "MC-306",
    pickupDate: "Jan 24, 2026",
    pickupWindow: "08:00 - 12:00",
    deliveryDate: "Jan 24, 2026",
    rate: 2800,
    ratePerMile: 11.20,
    suggestedRate: { min: 2650, max: 2900 },
    postedAt: "2 hours ago",
    bidsCount: 3,
    specialRequirements: ["TWIC Required", "Hazmat Endorsement"],
    isUrgent: false,
    matchScore: 95,
  },
  {
    id: "l2",
    loadNumber: "LOAD-45911",
    shipper: "Exxon Mobil",
    shipperRating: 4.9,
    origin: { city: "Beaumont", state: "TX", address: "Port of Beaumont" },
    destination: { city: "San Antonio", state: "TX", address: "SA Terminal" },
    distance: 280,
    commodity: "Diesel Fuel",
    hazmatClass: "3",
    unNumber: "UN1202",
    weight: 44000,
    quantity: "9,000 gallons",
    equipmentRequired: "MC-306",
    pickupDate: "Jan 24, 2026",
    pickupWindow: "14:00 - 18:00",
    deliveryDate: "Jan 25, 2026",
    rate: 3200,
    ratePerMile: 11.43,
    suggestedRate: { min: 3000, max: 3400 },
    postedAt: "45 minutes ago",
    bidsCount: 1,
    specialRequirements: ["TWIC Required"],
    isUrgent: true,
    matchScore: 88,
  },
  {
    id: "l3",
    loadNumber: "LOAD-45912",
    shipper: "Chevron",
    shipperRating: 4.7,
    origin: { city: "Port Arthur", state: "TX", address: "Chevron Refinery" },
    destination: { city: "Austin", state: "TX", address: "Austin Terminal" },
    distance: 220,
    commodity: "Jet Fuel",
    hazmatClass: "3",
    unNumber: "UN1863",
    weight: 40000,
    quantity: "8,000 gallons",
    equipmentRequired: "MC-306",
    pickupDate: "Jan 25, 2026",
    pickupWindow: "06:00 - 10:00",
    deliveryDate: "Jan 25, 2026",
    rate: 2500,
    ratePerMile: 11.36,
    suggestedRate: { min: 2400, max: 2700 },
    postedAt: "5 hours ago",
    bidsCount: 5,
    specialRequirements: ["TWIC Required", "Airport Security Clearance"],
    isUrgent: false,
    matchScore: 72,
  },
  {
    id: "l4",
    loadNumber: "LOAD-45913",
    shipper: "Valero Energy",
    shipperRating: 4.6,
    origin: { city: "Corpus Christi", state: "TX", address: "Valero Refinery" },
    destination: { city: "Houston", state: "TX", address: "Houston Terminal" },
    distance: 210,
    commodity: "Crude Oil",
    hazmatClass: "3",
    unNumber: "UN1267",
    weight: 46000,
    quantity: "180 barrels",
    equipmentRequired: "MC-406",
    pickupDate: "Jan 24, 2026",
    pickupWindow: "Any Time",
    deliveryDate: "Jan 24, 2026",
    rate: 4200,
    ratePerMile: 20.00,
    suggestedRate: { min: 4000, max: 4500 },
    postedAt: "1 hour ago",
    bidsCount: 2,
    specialRequirements: ["TWIC Required", "Crude Experience"],
    isUrgent: true,
    matchScore: 82,
  },
];

export default function LoadBoard() {
  const [loads] = useState<AvailableLoad[]>(MOCK_LOADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rate" | "distance" | "match" | "posted">("match");
  const [filterEquipment, setFilterEquipment] = useState<string>("all");

  const filteredLoads = loads
    .filter(load => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          load.origin.city.toLowerCase().includes(search) ||
          load.destination.city.toLowerCase().includes(search) ||
          load.commodity.toLowerCase().includes(search) ||
          load.loadNumber.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter(load => filterEquipment === "all" || load.equipmentRequired === filterEquipment)
    .sort((a, b) => {
      switch (sortBy) {
        case "rate": return b.rate - a.rate;
        case "distance": return a.distance - b.distance;
        case "match": return (b.matchScore || 0) - (a.matchScore || 0);
        case "posted": return 0; // Would sort by timestamp
        default: return 0;
      }
    });

  const handleBid = (load: AvailableLoad) => {
    toast.success(`Bid submitted for ${load.loadNumber}`, {
      description: "The shipper will be notified of your bid.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Board</h1>
          <p className="text-slate-400">Find and bid on available hazmat loads</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by city, commodity, or load #..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <Select value={filterEquipment} onValueChange={setFilterEquipment}>
              <SelectTrigger className="w-[160px] bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="MC-306">MC-306</SelectItem>
                <SelectItem value="MC-307">MC-307</SelectItem>
                <SelectItem value="MC-312">MC-312</SelectItem>
                <SelectItem value="MC-331">MC-331</SelectItem>
                <SelectItem value="MC-406">MC-406</SelectItem>
                <SelectItem value="MC-407">MC-407</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[160px] bg-slate-700/50 border-slate-600 text-white">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="rate">Highest Rate</SelectItem>
                <SelectItem value="distance">Shortest Distance</SelectItem>
                <SelectItem value="posted">Recently Posted</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-slate-600">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          Showing <span className="text-white font-medium">{filteredLoads.length}</span> loads matching your criteria
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Match scores based on your equipment, location, and preferences
        </div>
      </div>

      {/* Load Cards */}
      <div className="space-y-4">
        {filteredLoads.map((load) => (
          <Card key={load.id} className={cn(
            "bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all",
            load.isUrgent && "border-yellow-500/50"
          )}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Load Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-lg text-white">{load.loadNumber}</span>
                    {load.matchScore && (
                      <Badge className="bg-purple-500/20 text-purple-400">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {load.matchScore}% Match
                      </Badge>
                    )}
                    {load.isUrgent && (
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-slate-400">
                      {load.bidsCount} bid{load.bidsCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Origin</p>
                      <p className="text-white font-medium">{load.origin.city}, {load.origin.state}</p>
                      <p className="text-xs text-slate-500">{load.origin.address}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="h-px w-12 bg-slate-600" />
                      <span className="text-xs">{load.distance} mi</span>
                      <div className="h-px w-12 bg-slate-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-slate-400">Destination</p>
                      <p className="text-white font-medium">{load.destination.city}, {load.destination.state}</p>
                      <p className="text-xs text-slate-500">{load.destination.address}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Commodity</p>
                      <p className="text-white">{load.commodity}</p>
                      {load.hazmatClass && (
                        <p className="text-xs text-orange-400">Class {load.hazmatClass} • {load.unNumber}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Quantity</p>
                      <p className="text-white">{load.quantity}</p>
                      <p className="text-xs text-slate-500">{load.weight.toLocaleString()} lbs</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Pickup</p>
                      <p className="text-white">{load.pickupDate}</p>
                      <p className="text-xs text-slate-500">{load.pickupWindow}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Equipment</p>
                      <p className="text-white">{load.equipmentRequired}</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  {load.specialRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {load.specialRequirements.map((req, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs text-slate-300 border-slate-600">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Shipper */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                    <span className="text-sm text-slate-400">Shipper:</span>
                    <span className="text-sm text-white">{load.shipper}</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs">{load.shipperRating}</span>
                    </div>
                    <span className="text-xs text-slate-500">• Posted {load.postedAt}</span>
                  </div>
                </div>

                {/* Rate & Actions */}
                <div className="lg:w-64 flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Rate</p>
                    <p className="text-3xl font-bold text-green-400">${load.rate.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">${load.ratePerMile.toFixed(2)}/mile</p>
                  </div>

                  <div className="text-right text-xs">
                    <p className="text-slate-400 flex items-center gap-1 justify-end">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      AI Suggested
                    </p>
                    <p className="text-slate-300">
                      ${load.suggestedRate.min.toLocaleString()} - ${load.suggestedRate.max.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Button 
                      onClick={() => handleBid(load)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Place Bid
                    </Button>
                    <Button variant="outline" className="w-full border-slate-600">
                      <Calculator className="w-4 h-4 mr-1" />
                      Calculate Profit
                    </Button>
                    <Button variant="ghost" className="w-full text-slate-400">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLoads.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No loads match your criteria</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
