/**
 * FUEL CARD MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, Search, Plus, DollarSign, Fuel,
  CheckCircle, XCircle, AlertTriangle, Lock, Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FuelCardManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const cardsQuery = (trpc as any).fuelCards.list.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).fuelCards.getSummary.useQuery();
  const transactionsQuery = (trpc as any).fuelCards.getRecentTransactions.useQuery({ limit: 10 });

  const toggleMutation = (trpc as any).fuelCards.toggleStatus.useMutation({
    onSuccess: () => { toast.success("Card status updated"); cardsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update card", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "suspended": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCards = (cardsQuery.data as any)?.filter((card: any) =>
    !searchTerm || card.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || card.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Fuel Card Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage fleet fuel cards and transactions</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Order Cards
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalCards || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Cards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.activeCards || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${summary?.monthlySpend?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Monthly Spend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Fuel className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.gallonsThisMonth?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Gallons (Month)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search cards..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards List */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Fuel Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cardsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredCards?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No cards found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredCards?.map((card: any) => (
                  <div key={card.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium font-mono">•••• {card.lastFour}</p>
                          {getStatusBadge(card.status)}
                        </div>
                        <p className="text-sm text-slate-400">Assigned to: {card.assignedTo}</p>
                        <p className="text-xs text-slate-500">Vehicle: {card.vehicleNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">${card.monthlySpend?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">This month</p>
                        </div>
                        <Button size="sm" variant="ghost" className={cn(card.status === "active" ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10")} onClick={() => toggleMutation.mutate({ cardId: card.id, status: card.status === "active" ? "suspended" : "active" })}>
                          {card.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (transactionsQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(transactionsQuery.data as any)?.map((tx: any) => (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{tx.merchantName}</p>
                      <p className="text-emerald-400 font-bold">${tx.amount?.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>•••• {tx.cardLastFour}</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
