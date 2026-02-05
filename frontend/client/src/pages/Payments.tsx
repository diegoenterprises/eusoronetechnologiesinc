/**
 * PAYMENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  DollarSign, Clock, CheckCircle, TrendingUp, Search,
  FileText, Download, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Payments() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const transactionsQuery = (trpc as any).payments.getTransactions.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).payments.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0">Completed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredTransactions = (transactionsQuery.data as any)?.filter((t: any) => {
    const matchesSearch = !searchTerm || 
      t.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || t.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Payments & Invoices
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your payment history and download invoices</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-green-400">${(summary?.totalPaid || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">{summary?.paidCount || 0} transactions</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-yellow-400">${(summary?.pending || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">{summary?.pendingCount || 0} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-purple-400">${(summary?.thisMonth || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">{summary?.thisMonthCount || 0} total transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search by load number, carrier, or invoice number..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-slate-700 rounded-md">Completed</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {transactionsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : filteredTransactions?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No transactions found</p>
                  <p className="text-slate-500 text-sm mt-1">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredTransactions?.map((transaction: any) => (
                    <div key={transaction.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", transaction.status === "completed" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                            <DollarSign className={cn("w-6 h-6", transaction.status === "completed" ? "text-green-400" : "text-yellow-400")} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{transaction.loadNumber || `Load #${transaction.id?.slice(0, 6)}`}</p>
                            <p className="text-sm text-slate-400">{transaction.carrierName || transaction.description}</p>
                            <p className="text-xs text-slate-500">{transaction.date} • {transaction.invoiceNumber || "INV-" + transaction.id?.slice(0, 6)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={cn("text-xl font-bold", transaction.status === "completed" ? "text-green-400" : "text-yellow-400")}>
                              ${Number(transaction.amount || 0).toLocaleString()}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
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
