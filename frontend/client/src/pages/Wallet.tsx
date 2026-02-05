/**
 * WALLET PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus,
  CreditCard, DollarSign, TrendingUp, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Wallet() {
  const [activeTab, setActiveTab] = useState("all");

  const balanceQuery = (trpc as any).wallet.getBalance.useQuery();
  const transactionsQuery = (trpc as any).wallet.getTransactions.useQuery({ limit: 50 });

  const balance = balanceQuery.data;

  const getTransactionIcon = (type: string) => {
    return type === "credit" ? (
      <div className="p-2 rounded-full bg-green-500/20">
        <ArrowDownLeft className="w-4 h-4 text-green-400" />
      </div>
    ) : (
      <div className="p-2 rounded-full bg-red-500/20">
        <ArrowUpRight className="w-4 h-4 text-red-400" />
      </div>
    );
  };

  const filteredTransactions = (transactionsQuery.data as any)?.filter((t: any) => {
    if (activeTab === "all") return true;
    return t.type === activeTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Wallet
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your funds and transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <ArrowUpRight className="w-4 h-4 mr-2" />Withdraw
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Add Funds
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Available Balance</p>
              {balanceQuery.isLoading ? <Skeleton className="h-12 w-48" /> : (
                <p className="text-4xl font-bold text-white">${(balance?.available || 0).toLocaleString()}</p>
              )}
            </div>
            <div className="p-4 rounded-full bg-cyan-500/20">
              <WalletIcon className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <ArrowDownLeft className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {balanceQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-green-400">${(balance?.totalReceived || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Received</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <ArrowUpRight className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {balanceQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-red-400">${(balance?.totalSpent || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {balanceQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-yellow-400">${(balance?.pending || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {balanceQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{balance?.paymentMethods || 0}</p>
                )}
                <p className="text-xs text-slate-400">Payment Methods</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
          <TabsTrigger value="credit" className="data-[state=active]:bg-slate-700 rounded-md">Received</TabsTrigger>
          <TabsTrigger value="debit" className="data-[state=active]:bg-slate-700 rounded-md">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : filteredTransactions?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No transactions yet</p>
                  <p className="text-slate-500 text-sm mt-1">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredTransactions?.map((transaction: any) => (
                    <div key={transaction.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="text-white font-medium">{transaction.description}</p>
                            <p className="text-sm text-slate-400">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-bold text-lg", transaction.type === "credit" ? "text-green-400" : "text-red-400")}>
                            {transaction.type === "credit" ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <Badge className={transaction.status === "completed" ? "bg-green-500/20 text-green-400 border-0" : "bg-yellow-500/20 text-yellow-400 border-0"}>
                            {transaction.status}
                          </Badge>
                        </div>
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
