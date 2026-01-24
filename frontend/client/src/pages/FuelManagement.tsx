/**
 * FUEL MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Fuel, DollarSign, TrendingUp, TrendingDown, Truck, MapPin,
  Calendar, Search, Download, Plus, Target, CreditCard,
  AlertTriangle, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FuelManagement() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [searchTerm, setSearchTerm] = useState("");

  const summaryQuery = trpc.fuel.getSummary.useQuery();
  const transactionsQuery = trpc.fuel.getTransactions.useQuery({ search: searchTerm || undefined, limit: 50 });
  const cardsQuery = trpc.fuel.getCards.useQuery();
  const alertsQuery = trpc.fuel.getAlerts.useQuery();

  const suspendCardMutation = trpc.fuel.suspendCard.useMutation({
    onSuccess: () => { toast.success("Card suspended"); cardsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const activateCardMutation = trpc.fuel.activateCard.useMutation({
    onSuccess: () => { toast.success("Card activated"); cardsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading fuel data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "suspended": return "bg-red-500/20 text-red-400";
      case "cancelled": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fuel Management</h1>
          <p className="text-slate-400 text-sm">Track fuel consumption and manage fuel cards</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Card</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{(summary?.totalGallons || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Gallons MTD</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${(summary?.totalSpend || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Spend MTD</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.avgMpg?.toFixed(1) || 0}</p>
            )}
            <p className="text-xs text-slate-400">Avg MPG</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">${summary?.avgPricePerGallon?.toFixed(2) || 0}</p>
            )}
            <p className="text-xs text-slate-400">Avg Price/Gal</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.activeCards || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600">Transactions</TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-blue-600">Fuel Cards</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search transactions..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {transactionsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : transactionsQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <Fuel className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No transactions found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {transactionsQuery.data?.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", tx.fuelType === "diesel" ? "bg-blue-500/20" : tx.fuelType === "def" ? "bg-purple-500/20" : "bg-green-500/20")}>
                          <Fuel className={cn("w-5 h-5", tx.fuelType === "diesel" ? "text-blue-400" : tx.fuelType === "def" ? "text-purple-400" : "text-green-400")} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{tx.unitNumber}</p>
                            <Badge className="bg-slate-500/20 text-slate-400 text-xs">{tx.fuelType}</Badge>
                          </div>
                          <p className="text-sm text-slate-400">{tx.driverName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{tx.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white font-medium">{tx.gallons} gal</p>
                          <p className="text-xs text-slate-500">${tx.pricePerGallon?.toFixed(2)}/gal</p>
                        </div>
                        <div className="text-right w-24">
                          <p className="text-green-400 font-bold">${tx.totalCost?.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{tx.date}</p>
                        </div>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" />Fuel Cards</CardTitle></CardHeader>
            <CardContent>
              {cardsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : cardsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No fuel cards</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cardsQuery.data?.map((card) => (
                    <Card key={card.id} className={cn("border", card.status === "active" ? "bg-slate-700/30 border-slate-700" : "bg-red-500/10 border-red-500/30")}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-slate-400" />
                            <span className="text-white font-mono">****{card.lastFour}</span>
                          </div>
                          <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
                        </div>
                        <div className="mb-3">
                          <p className="text-white">{card.assignedTo}</p>
                          <p className="text-xs text-slate-500">{card.assignedType === "driver" ? "Driver" : "Vehicle"}</p>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-slate-400 text-sm">Spend</span>
                          <span className="text-white">${card.currentSpend?.toLocaleString()} / ${card.monthlyLimit?.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                          <div className="h-full bg-blue-500" style={{ width: `${(card.currentSpend / card.monthlyLimit) * 100}%` }} />
                        </div>
                        <div className="flex gap-2">
                          {card.status === "active" ? (
                            <Button size="sm" variant="outline" className="flex-1 border-red-500/50 text-red-400" onClick={() => suspendCardMutation.mutate({ cardId: card.id })} disabled={suspendCardMutation.isPending}>
                              {suspendCardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suspend"}
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => activateCardMutation.mutate({ cardId: card.id })} disabled={activateCardMutation.isPending}>
                              {activateCardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate"}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="border-slate-600">Edit</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Fuel Consumption Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48 bg-slate-700/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-slate-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Cost per Mile</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48 bg-slate-700/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-12 h-12 text-slate-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
