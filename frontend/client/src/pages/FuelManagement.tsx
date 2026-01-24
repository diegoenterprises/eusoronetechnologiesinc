/**
 * FUEL MANAGEMENT PAGE
 * Fleet fuel tracking, consumption analytics, and card management
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Fuel, DollarSign, TrendingUp, TrendingDown, Truck, MapPin,
  Calendar, Search, Download, Plus, BarChart3, Target,
  CreditCard, AlertTriangle, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FuelTransaction {
  id: string;
  date: string;
  vehicleId: string;
  unitNumber: string;
  driverName: string;
  location: string;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  odometer: number;
  fuelType: "diesel" | "def" | "gasoline";
  cardNumber: string;
}

interface FuelCard {
  id: string;
  cardNumber: string;
  lastFour: string;
  assignedTo: string;
  assignedType: "driver" | "vehicle";
  status: "active" | "suspended" | "cancelled";
  monthlyLimit: number;
  currentSpend: number;
  restrictions: string[];
}

const MOCK_TRANSACTIONS: FuelTransaction[] = [
  { id: "f1", date: "2025-01-23", vehicleId: "v1", unitNumber: "TRK-101", driverName: "Mike Johnson", location: "Pilot Travel Center, Houston TX", gallons: 125, pricePerGallon: 3.50, totalCost: 437.50, odometer: 125430, fuelType: "diesel", cardNumber: "****4521" },
  { id: "f2", date: "2025-01-22", vehicleId: "v2", unitNumber: "TRK-102", driverName: "Sarah Williams", location: "Love's, Dallas TX", gallons: 110, pricePerGallon: 3.45, totalCost: 379.50, odometer: 187650, fuelType: "diesel", cardNumber: "****4522" },
  { id: "f3", date: "2025-01-22", vehicleId: "v1", unitNumber: "TRK-101", driverName: "Mike Johnson", location: "TA, Austin TX", gallons: 15, pricePerGallon: 4.25, totalCost: 63.75, odometer: 125300, fuelType: "def", cardNumber: "****4521" },
  { id: "f4", date: "2025-01-21", vehicleId: "v3", unitNumber: "TRK-103", driverName: "Tom Brown", location: "Flying J, San Antonio TX", gallons: 130, pricePerGallon: 3.55, totalCost: 461.50, odometer: 45100, fuelType: "diesel", cardNumber: "****4523" },
  { id: "f5", date: "2025-01-20", vehicleId: "v2", unitNumber: "TRK-102", driverName: "Sarah Williams", location: "Pilot Travel Center, El Paso TX", gallons: 140, pricePerGallon: 3.48, totalCost: 487.20, odometer: 187320, fuelType: "diesel", cardNumber: "****4522" },
];

const MOCK_CARDS: FuelCard[] = [
  { id: "c1", cardNumber: "5421-xxxx-xxxx-4521", lastFour: "4521", assignedTo: "Mike Johnson", assignedType: "driver", status: "active", monthlyLimit: 3000, currentSpend: 1245.50, restrictions: ["Fuel only", "No cash advances"] },
  { id: "c2", cardNumber: "5421-xxxx-xxxx-4522", lastFour: "4522", assignedTo: "Sarah Williams", assignedType: "driver", status: "active", monthlyLimit: 3000, currentSpend: 2156.20, restrictions: ["Fuel only", "No cash advances"] },
  { id: "c3", cardNumber: "5421-xxxx-xxxx-4523", lastFour: "4523", assignedTo: "Tom Brown", assignedType: "driver", status: "active", monthlyLimit: 3000, currentSpend: 892.75, restrictions: ["Fuel only", "No cash advances"] },
  { id: "c4", cardNumber: "5421-xxxx-xxxx-4524", lastFour: "4524", assignedTo: "TRK-104", assignedType: "vehicle", status: "suspended", monthlyLimit: 2500, currentSpend: 0, restrictions: ["Fuel only"] },
];

export default function FuelManagement() {
  const { user } = useAuth();
  const [transactions] = useState<FuelTransaction[]>(MOCK_TRANSACTIONS);
  const [cards] = useState<FuelCard[]>(MOCK_CARDS);
  const [activeTab, setActiveTab] = useState<"transactions" | "cards" | "analytics">("transactions");
  const [searchQuery, setSearchQuery] = useState("");

  const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0);
  const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0);
  const avgPrice = totalCost / totalGallons;

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.unitNumber.toLowerCase().includes(q) ||
           t.driverName.toLowerCase().includes(q) ||
           t.location.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fuel Management</h1>
          <p className="text-slate-400 text-sm">Track fuel consumption and manage fuel cards</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-300/70">This Month</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400">{totalGallons.toLocaleString()} gallons</p>
              </div>
              <Fuel className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Avg Price/Gal</p>
                <p className="text-2xl font-bold text-white">
                  ${avgPrice.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <TrendingDown className="w-3 h-3" />
                  <span>2.1% vs last month</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-slate-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Fleet MPG</p>
                <p className="text-2xl font-bold text-white">6.8</p>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>0.3 improvement</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Cards</p>
                <p className="text-2xl font-bold text-white">
                  {cards.filter(c => c.status === "active").length}
                </p>
                <p className="text-xs text-slate-500">of {cards.length} total</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { id: "transactions", label: "Transactions", icon: Fuel },
          { id: "cards", label: "Fuel Cards", icon: CreditCard },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id ? "bg-blue-600" : ""}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "transactions" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 w-64 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Date</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Vehicle</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Driver</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Location</th>
                  <th className="text-right text-slate-400 text-xs font-medium p-4">Gallons</th>
                  <th className="text-right text-slate-400 text-xs font-medium p-4">Price/Gal</th>
                  <th className="text-right text-slate-400 text-xs font-medium p-4">Total</th>
                  <th className="text-center text-slate-400 text-xs font-medium p-4">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 text-slate-300 text-sm">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">{txn.unitNumber}</span>
                    </td>
                    <td className="p-4 text-slate-300">{txn.driverName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin className="w-3 h-3" />
                        {txn.location}
                      </div>
                    </td>
                    <td className="p-4 text-right text-white">
                      {txn.gallons.toFixed(1)}
                    </td>
                    <td className="p-4 text-right text-slate-300">
                      ${txn.pricePerGallon.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-green-400 font-medium">
                      ${txn.totalCost.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={cn(
                        txn.fuelType === "diesel" ? "bg-blue-500/20 text-blue-400" :
                        txn.fuelType === "def" ? "bg-purple-500/20 text-purple-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {txn.fuelType.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => (
            <Card key={card.id} className={cn(
              "border-slate-700",
              card.status === "active" ? "bg-slate-800/50" : "bg-slate-800/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      card.status === "active" ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      <CreditCard className={cn(
                        "w-5 h-5",
                        card.status === "active" ? "text-green-400" : "text-red-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{card.cardNumber}</p>
                      <p className="text-xs text-slate-500">
                        {card.assignedType === "driver" ? "Driver" : "Vehicle"}: {card.assignedTo}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    card.status === "active" ? "bg-green-500/20 text-green-400" :
                    card.status === "suspended" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Monthly Spend</span>
                      <span className="text-white">
                        ${card.currentSpend.toFixed(2)} / ${card.monthlyLimit.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          (card.currentSpend / card.monthlyLimit) > 0.8 ? "bg-red-500" :
                          (card.currentSpend / card.monthlyLimit) > 0.6 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${Math.min((card.currentSpend / card.monthlyLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {card.restrictions.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-slate-600 text-slate-400">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 border-slate-600">
                    View History
                  </Button>
                  {card.status === "active" ? (
                    <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400">
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Activate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "analytics" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Fuel analytics and consumption charts coming soon</p>
            <p className="text-xs text-slate-500 mt-2">
              Track spending trends, compare vehicle efficiency, and identify savings opportunities
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
