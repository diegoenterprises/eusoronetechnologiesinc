/**
 * BID DETAILS PAGE
 * Comprehensive bid management and negotiation view
 * Based on 02_CARRIER_USER_JOURNEY.md and 03_BROKER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, Truck, MapPin, Clock, Calendar, User, Building,
  TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle,
  MessageSquare, FileText, Calculator, ChevronRight, Shield,
  Star, Phone, Mail, Navigation, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BidHistory {
  id: string;
  amount: number;
  bidder: string;
  timestamp: string;
  type: "initial" | "counter" | "accepted" | "rejected";
  notes?: string;
}

export default function BidDetails() {
  const [activeTab, setActiveTab] = useState("details");
  const [counterOffer, setCounterOffer] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  // Mock bid data
  const bid = {
    id: "BID-2025-0892",
    status: "pending",
    loadNumber: "LOAD-45850",
    amount: 2650,
    ratePerMile: 3.02,
    createdAt: "2025-01-23T10:00:00Z",
    expiresAt: "2025-01-24T18:00:00Z",
    carrier: {
      name: "ABC Transport LLC",
      mcNumber: "MC-123456",
      dotNumber: "DOT-7891011",
      saferScore: 92,
      rating: 4.7,
      contact: "Sarah Williams",
      phone: "(555) 987-6543",
      email: "sarah@abctransport.com",
    },
    load: {
      commodity: "Gasoline",
      hazmatClass: "Class 3 - Flammable",
      weight: "52,000 lbs",
      equipment: "MC-306 Tanker",
      origin: { city: "Houston", state: "TX", facility: "Shell Terminal" },
      destination: { city: "Dallas", state: "TX", facility: "Love's Travel Stop #245" },
      distance: 877,
      pickupDate: "2025-01-24",
      pickupTime: "09:00",
      deliveryDate: "2025-01-24",
      deliveryTime: "16:00",
    },
    profitability: {
      estimatedFuel: 420,
      estimatedTolls: 35,
      driverPay: 650,
      insurance: 85,
      misc: 50,
      totalCosts: 1240,
      grossProfit: 1410,
      margin: 53.2,
    },
    marketRate: {
      low: 2400,
      average: 2750,
      high: 3100,
    },
  };

  const bidHistory: BidHistory[] = [
    { id: "bh_001", amount: 2500, bidder: "ABC Transport LLC", timestamp: "2025-01-23T10:00:00Z", type: "initial", notes: "Initial bid" },
    { id: "bh_002", amount: 2800, bidder: "Shell Oil Company", timestamp: "2025-01-23T11:30:00Z", type: "counter", notes: "Market rate is higher" },
    { id: "bh_003", amount: 2650, bidder: "ABC Transport LLC", timestamp: "2025-01-23T14:00:00Z", type: "counter", notes: "Best we can do with current fuel costs" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "expired": return "bg-slate-500/20 text-slate-400";
      case "countered": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getHistoryTypeIcon = (type: string) => {
    switch (type) {
      case "initial": return <DollarSign className="w-4 h-4 text-blue-400" />;
      case "counter": return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      case "accepted": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  const acceptBid = () => {
    toast.success("Bid accepted!", {
      description: "Carrier has been notified",
    });
  };

  const rejectBid = () => {
    toast.info("Bid rejected", {
      description: "Carrier has been notified",
    });
  };

  const submitCounterOffer = () => {
    if (!counterOffer) {
      toast.error("Please enter a counter offer amount");
      return;
    }
    toast.success("Counter offer sent", {
      description: `$${counterOffer} counter offer submitted`,
    });
    setCounterOffer("");
    setCounterNotes("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const marketPosition = ((bid.amount - bid.marketRate.low) / (bid.marketRate.high - bid.marketRate.low)) * 100;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{bid.id}</h1>
            <Badge className={getStatusColor(bid.status)}>
              {bid.status}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">
            Load: {bid.loadNumber} | Submitted: {formatTime(bid.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-red-500/50 text-red-400" onClick={rejectBid}>
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={acceptBid}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept Bid
          </Button>
        </div>
      </div>

      {/* Bid Amount Card */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Current Bid</p>
              <p className="text-4xl font-bold text-green-400">${bid.amount.toLocaleString()}</p>
              <p className="text-sm text-slate-400 mt-1">${bid.ratePerMile.toFixed(2)}/mile</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Expires</p>
              <p className="text-white font-medium">{formatTime(bid.expiresAt)}</p>
              <Badge className="mt-2 bg-yellow-500/20 text-yellow-400">
                <Clock className="w-3 h-3 mr-1" />
                24h remaining
              </Badge>
            </div>
          </div>

          {/* Market Rate Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Market Rate Position</span>
              <span className="text-white">${bid.marketRate.average} avg</span>
            </div>
            <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: "100%" }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-green-500 shadow-lg"
                style={{ left: `calc(${Math.min(Math.max(marketPosition, 5), 95)}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>${bid.marketRate.low}</span>
              <span>${bid.marketRate.high}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{bid.load.distance}</p>
                <p className="text-xs text-slate-400">Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">${bid.profitability.grossProfit}</p>
                <p className="text-xs text-slate-400">Est. Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-purple-400">{bid.profitability.margin}%</p>
                <p className="text-xs text-slate-400">Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-400">{bid.carrier.rating}</p>
                <p className="text-xs text-slate-400">Carrier Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-green-600">Bid Details</TabsTrigger>
          <TabsTrigger value="carrier" className="data-[state=active]:bg-green-600">Carrier</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">Bid History</TabsTrigger>
          <TabsTrigger value="counter" className="data-[state=active]:bg-green-600">Counter Offer</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Load Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Load Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Load Number</span>
                  <span className="text-white font-medium">{bid.loadNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Commodity</span>
                  <span className="text-white">{bid.load.commodity}</span>
                </div>
                {bid.load.hazmatClass && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hazmat</span>
                    <Badge className="bg-orange-500/20 text-orange-400">
                      {bid.load.hazmatClass}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Weight</span>
                  <span className="text-white">{bid.load.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Equipment</span>
                  <span className="text-white">{bid.load.equipment}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div>
                  <p className="text-xs text-slate-500 mb-2">ORIGIN</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-white">{bid.load.origin.facility}</p>
                      <p className="text-sm text-slate-400">{bid.load.origin.city}, {bid.load.origin.state}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 ml-6">
                    {bid.load.pickupDate} @ {bid.load.pickupTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">DESTINATION</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="text-white">{bid.load.destination.facility}</p>
                      <p className="text-sm text-slate-400">{bid.load.destination.city}, {bid.load.destination.state}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 ml-6">
                    {bid.load.deliveryDate} @ {bid.load.deliveryTime}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profitability Analysis */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-400" />
                  Profitability Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bid Amount</span>
                  <span className="text-green-400 font-bold">${bid.amount.toLocaleString()}</span>
                </div>
                <Separator className="bg-slate-700" />
                <p className="text-xs text-slate-500">ESTIMATED COSTS</p>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fuel</span>
                  <span className="text-red-400">-${bid.profitability.estimatedFuel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tolls</span>
                  <span className="text-red-400">-${bid.profitability.estimatedTolls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver Pay</span>
                  <span className="text-red-400">-${bid.profitability.driverPay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Insurance</span>
                  <span className="text-red-400">-${bid.profitability.insurance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Misc</span>
                  <span className="text-red-400">-${bid.profitability.misc}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Costs</span>
                  <span className="text-red-400 font-medium">-${bid.profitability.totalCosts}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-white font-bold">Gross Profit</span>
                  <span className="text-green-400 font-bold">${bid.profitability.grossProfit}</span>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex justify-between">
                    <span className="text-green-400">Profit Margin</span>
                    <span className="text-green-400 font-bold">{bid.profitability.margin}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Carrier Tab */}
        <TabsContent value="carrier" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-400" />
                Carrier Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{bid.carrier.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className="bg-blue-500/20 text-blue-400">{bid.carrier.mcNumber}</Badge>
                      <Badge className="bg-slate-500/20 text-slate-400">{bid.carrier.dotNumber}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">{bid.carrier.saferScore}</p>
                        <p className="text-xs text-slate-500">SAFER Score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <div>
                        <p className="text-white font-medium">{bid.carrier.rating}</p>
                        <p className="text-xs text-slate-500">Rating</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div>
                    <p className="text-xs text-slate-500 mb-2">PRIMARY CONTACT</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-white">{bid.carrier.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">{bid.carrier.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">{bid.carrier.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <FileText className="w-4 h-4 mr-2" />
                    View Carrier Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Shield className="w-4 h-4 mr-2" />
                    View SAFER Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Carrier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Bid History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bidHistory.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        item.type === "accepted" ? "bg-green-500/20" :
                        item.type === "rejected" ? "bg-red-500/20" :
                        "bg-slate-700"
                      )}>
                        {getHistoryTypeIcon(item.type)}
                      </div>
                      {idx < bidHistory.length - 1 && (
                        <div className="w-0.5 h-12 bg-slate-700 mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">${item.amount.toLocaleString()}</p>
                          <p className="text-sm text-slate-400">{item.bidder}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={cn(
                            item.type === "initial" ? "bg-blue-500/20 text-blue-400" :
                            item.type === "counter" ? "bg-yellow-500/20 text-yellow-400" :
                            item.type === "accepted" ? "bg-green-500/20 text-green-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {item.type}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">{formatTime(item.timestamp)}</p>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-slate-500 mt-1">"{item.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Counter Offer Tab */}
        <TabsContent value="counter" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Submit Counter Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Current Bid: ${bid.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Market average is ${bid.marketRate.average}. Consider your counter carefully.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Counter Offer Amount</Label>
                <div className="relative mt-1">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white text-lg"
                    placeholder="0.00"
                  />
                </div>
                {counterOffer && (
                  <p className="text-sm text-slate-400 mt-1">
                    Rate per mile: ${(parseFloat(counterOffer) / bid.load.distance).toFixed(2)}/mi
                  </p>
                )}
              </div>

              <div>
                <Label className="text-slate-300">Notes (Optional)</Label>
                <Textarea
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Add any notes for the carrier..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" className="border-slate-600">
                  Cancel
                </Button>
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={submitCounterOffer}
                >
                  Submit Counter Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
