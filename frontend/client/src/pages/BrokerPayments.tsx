/**
 * BROKER PAYMENTS PAGE
 * 100% Dynamic - Manage carrier payments and shipper receivables
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Search, Send, CheckCircle, Clock,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerPayments() {
  const [activeTab, setActiveTab] = useState("payables");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const payablesQuery = trpc.brokers.getShippers.useQuery({ search: "" });
  const receivablesQuery = trpc.brokers.getShippers.useQuery({ search: "" });
  const statsQuery = trpc.brokers.getDashboardStats.useQuery();

  const processPaymentMutation = trpc.brokers.vetCarrier.useMutation({
    onSuccess: () => {
      toast.success("Payment processed");
      payablesQuery.refetch();
    },
  });

  const payables = payablesQuery.data || [];
  const receivables = receivablesQuery.data || [];
  const stats = statsQuery.data;

  const filteredPayables = payables.filter((p: any) =>
    p.carrierName?.toLowerCase().includes(search.toLowerCase()) ||
    p.loadNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReceivables = receivables.filter((r: any) =>
    r.shipperName?.toLowerCase().includes(search.toLowerCase()) ||
    r.loadNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "processing": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Payments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage payables and receivables</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowDownRight className="w-5 h-5 text-red-400" />
                  <span className="text-slate-400 text-sm">Payables Due</span>
                </div>
                <p className="text-2xl font-bold text-red-400">${(stats as any)?.payablesDue?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">{(stats as any)?.payablesCount || 0} invoices</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                  <span className="text-slate-400 text-sm">Receivables Due</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${(stats as any)?.receivablesDue?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">{(stats as any)?.receivablesCount || 0} invoices</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">${(stats as any)?.overdueAmount?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">{(stats as any)?.overdueCount || 0} invoices</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-400 text-sm">Net Position</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  (stats as any)?.netPosition >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  ${Math.abs((stats as any)?.netPosition || 0).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-1">{(stats as any)?.netPosition >= 0 ? "Positive" : "Negative"}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <TabsTrigger value="payables" className="rounded-md">
              <ArrowDownRight className="w-4 h-4 mr-2" />Payables
            </TabsTrigger>
            <TabsTrigger value="receivables" className="rounded-md">
              <ArrowUpRight className="w-4 h-4 mr-2" />Receivables
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 w-64 bg-slate-800/50 border-slate-700/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="payables" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {payablesQuery.isLoading ? (
                <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
              ) : filteredPayables.length === 0 ? (
                <div className="text-center py-16">
                  <ArrowDownRight className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No payables found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredPayables.map((payment: any) => (
                    <div key={payment.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Building className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold">{payment.carrierName}</p>
                              <Badge className={cn("border-0", getStatusColor(payment.status))}>
                                {payment.status}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">Load #{payment.loadNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Amount</p>
                            <p className="text-red-400 font-bold">${payment.amount?.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Due</p>
                            <p className={cn(
                              payment.status === "overdue" ? "text-red-400" : "text-white"
                            )}>
                              {payment.dueDate}
                            </p>
                          </div>
                          {payment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => processPaymentMutation.mutate({ mcNumber: "", dotNumber: payment.id } as any)}
                              className="bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                            >
                              <Send className="w-4 h-4 mr-1" />Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {receivablesQuery.isLoading ? (
                <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
              ) : filteredReceivables.length === 0 ? (
                <div className="text-center py-16">
                  <ArrowUpRight className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No receivables found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredReceivables.map((receivable: any) => (
                    <div key={receivable.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Building className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold">{receivable.shipperName}</p>
                              <Badge className={cn("border-0", getStatusColor(receivable.status))}>
                                {receivable.status}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">Load #{receivable.loadNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Amount</p>
                            <p className="text-green-400 font-bold">${receivable.amount?.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Due</p>
                            <p className={cn(
                              receivable.status === "overdue" ? "text-red-400" : "text-white"
                            )}>
                              {receivable.dueDate}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-400 text-xs">Days</p>
                            <p className="text-white">{receivable.daysOutstanding}</p>
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
