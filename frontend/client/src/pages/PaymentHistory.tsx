/**
 * PAYMENT HISTORY PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Search, Download, Calendar, CreditCard,
  CheckCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("month");

  const paymentsQuery = (trpc as any).payments.getHistory.useQuery({ type: typeFilter, dateRange, limit: 50 });
  const summaryQuery = (trpc as any).payments.getSummary.useQuery({ dateRange });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0">Completed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Processing</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredPayments = (paymentsQuery.data as any)?.filter((payment: any) =>
    !searchTerm || payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Payment History
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track all payments and transactions</p>
        </div>
        <Button variant="outline" className="bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <ArrowDownLeft className="w-6 h-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${summary?.received?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <ArrowUpRight className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-red-400">${summary?.paid?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Paid Out</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-yellow-400">${summary?.pending?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.transactions || 0}</p>
                )}
                <p className="text-xs text-slate-400">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search payments..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardContent className="p-0">
          {paymentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : filteredPayments?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-white/[0.04] w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No payments found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredPayments?.map((payment: any) => (
                <div key={payment.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", payment.type === "received" ? "bg-green-500/20" : "bg-red-500/20")}>
                        {payment.type === "received" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{payment.description}</p>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{payment.date}</span>
                          <span>Ref: {payment.reference}</span>
                          {payment.loadNumber && <span>Load: {payment.loadNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold text-lg", payment.type === "received" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : "text-red-400")}>
                        {payment.type === "received" ? "+" : "-"}${payment.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">{payment.method}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
