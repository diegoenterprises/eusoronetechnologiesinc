/**
 * FACTORING SERVICES PAGE
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
  Banknote, Search, DollarSign, Clock, CheckCircle,
  TrendingUp, FileText, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FactoringServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const invoicesQuery = trpc.factoring.getInvoices.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 });
  const summaryQuery = trpc.factoring.getSummary.useQuery();
  const ratesQuery = trpc.factoring.getRates.useQuery();

  const submitMutation = trpc.factoring.submitInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice submitted for factoring"); invoicesQuery.refetch(); },
    onError: (error) => toast.error("Failed to submit invoice", { description: error.message }),
  });

  const summary = summaryQuery.data;
  const rates = ratesQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>;
      case "funded": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Funded</Badge>;
      case "collected": return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Collected</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredInvoices = invoicesQuery.data?.filter((invoice: any) =>
    !searchTerm || invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.customer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Factoring Services
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quick pay and invoice factoring</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Banknote className="w-4 h-4 mr-2" />Submit Invoice
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${summary?.totalFunded?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Funded</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-yellow-400">${summary?.pending?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.invoicesFactored || 0}</p>
                )}
                <p className="text-xs text-slate-400">Invoices Factored</p>
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
                {ratesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{rates?.currentRate}%</p>
                )}
                <p className="text-xs text-slate-400">Current Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Pay Info */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-lg mb-1">Get Paid in 24 Hours</p>
              <p className="text-slate-400 text-sm">Submit your invoices and receive funding within 24 hours</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">{rates?.advanceRate}%</p>
                <p className="text-xs text-slate-500">Advance Rate</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-500" />
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">24h</p>
                <p className="text-xs text-slate-500">Funding Time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search invoices..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="funded">Funded</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Factored Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredInvoices?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Banknote className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No invoices found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredInvoices?.map((invoice: any) => (
                <div key={invoice.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-slate-400">{invoice.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${invoice.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Invoice Amount</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>Submitted: {invoice.submittedDate}</span>
                      {invoice.fundedDate && <span>Funded: {invoice.fundedDate}</span>}
                    </div>
                    {invoice.status === "funded" && (
                      <span className="text-emerald-400">Funded: ${invoice.fundedAmount?.toLocaleString()}</span>
                    )}
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
