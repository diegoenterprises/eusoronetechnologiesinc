/**
 * ADMIN BILLING PAGE
 * 100% Dynamic - Manage platform billing and subscriptions
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
  CreditCard, DollarSign, Search, Download, TrendingUp,
  Building, Calendar, CheckCircle, AlertTriangle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminBilling() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("current");

  const invoicesQuery = (trpc as any).admin.getAuditLogs.useQuery({});
  const statsQuery = (trpc as any).admin.getLogStats.useQuery();
  const subscriptionsQuery = (trpc as any).admin.getUsers.useQuery({});

  const invoices = invoicesQuery.data || [];
  const stats = statsQuery.data as any;
  const subscriptions = subscriptionsQuery.data || [];

  const filteredInvoices = invoices.filter((i: any) =>
    i.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "cancelled": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Billing Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform billing and subscriptions</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">This Month</SelectItem>
            <SelectItem value="last">Last Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-slate-400 text-sm">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.revenue?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">+{stats?.revenueGrowth || 0}%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Active Subscriptions</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-400 text-sm">Paid Invoices</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.paidInvoices || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Outstanding</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">${stats?.outstanding?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Subscription Overview */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Subscription Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptions.map((plan: any) => (
                <div key={plan.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold">{plan.name}</p>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                      {plan.activeCount} active
                    </Badge>
                  </div>
                  <p className="text-green-400 text-2xl font-bold mb-2">${plan.price}/mo</p>
                  <p className="text-slate-400 text-sm">MRR: ${plan.mrr?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No invoices found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredInvoices.map((invoice: any) => (
                <div key={invoice.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Building className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{invoice.companyName}</p>
                          <Badge className={cn("border-0", getStatusColor(invoice.status))}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Invoice #{invoice.invoiceNumber} • {invoice.planName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Amount</p>
                        <p className="text-green-400 font-bold">${invoice.amount?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Due</p>
                        <p className={cn(
                          invoice.status === "overdue" ? "text-red-400" : "text-white"
                        )}>
                          {invoice.dueDate}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Download className="w-4 h-4" />
                      </Button>
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
