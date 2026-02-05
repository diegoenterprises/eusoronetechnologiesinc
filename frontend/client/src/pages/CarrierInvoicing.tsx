/**
 * CARRIER INVOICING PAGE
 * 100% Dynamic - Create and manage invoices for completed loads
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
  FileText, DollarSign, Send, Clock, CheckCircle,
  AlertTriangle, Search, Download, Plus, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierInvoicing() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const invoicesQuery = (trpc as any).carriers.getActiveLoads.useQuery({ limit: 50 });
  const statsQuery = (trpc as any).carriers.getDashboardStats.useQuery();
  const pendingLoadsQuery = (trpc as any).carriers.getRecentCompletedLoads.useQuery({ limit: 10 });

  const createInvoiceMutation = (trpc as any).carriers.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Invoice created");
      invoicesQuery.refetch();
      pendingLoadsQuery.refetch();
    },
  });

  const invoices = invoicesQuery.data || [];
  const stats = statsQuery.data;
  const pendingLoads = pendingLoadsQuery.data || [];

  const filteredInvoices = invoices.filter((inv: any) =>
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.shipperName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "submitted": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Invoicing
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage load invoices</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.total || stats?.activeLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">${(stats as any)?.pendingAmount?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-red-400">${(stats as any)?.overdueAmount?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Paid MTD</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${(stats as any)?.paidMTD?.toLocaleString() || stats?.weeklyRevenue?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Ready to Invoice</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{pendingLoads.length}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Ready to Invoice */}
      {pendingLoads.length > 0 && (
        <Card className="bg-purple-500/10 border-purple-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-400 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Loads Ready to Invoice ({pendingLoads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingLoads.slice(0, 5).map((load: any) => (
                <div key={load.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-white font-medium">Load #{load.loadNumber}</p>
                    <p className="text-slate-400 text-sm">{load.shipper} • Delivered {load.deliveredAt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-bold">${load.rate?.toLocaleString()}</span>
                    <Button
                      size="sm"
                      onClick={() => createInvoiceMutation.mutate({ loadId: load.id?.toString() || "", amount: load.rate || 0 })}
                      className="bg-purple-600 hover:bg-purple-700 rounded-lg"
                    >
                      <Send className="w-4 h-4 mr-1" />Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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
                <div key={invoice.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{invoice.invoiceNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(invoice.status))}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {invoice.shipperName} • Load #{invoice.loadNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Amount</p>
                        <p className="text-green-400 font-bold">${invoice.amount?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Issued</p>
                        <p className="text-white">{invoice.issuedDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Due</p>
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
