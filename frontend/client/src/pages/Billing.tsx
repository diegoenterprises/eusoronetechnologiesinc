/**
 * BILLING PAGE
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
  DollarSign, FileText, Clock, CheckCircle, AlertTriangle,
  Download, Send, Eye, Search, TrendingUp, CreditCard,
  Calendar, Building, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Billing() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const summaryQuery = trpc.billing.getSummary.useQuery();
  const invoicesQuery = trpc.billing.getInvoices.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchTerm || undefined,
  });
  const paymentsQuery = trpc.billing.getPayments.useQuery({ limit: 20 });

  const sendReminderMutation = trpc.billing.sendReminder.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading billing data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "partial": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Invoices</h1>
          <p className="text-slate-400 text-sm">Manage invoices and track payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button className="bg-green-600 hover:bg-green-700"><FileText className="w-4 h-4 mr-2" />New Invoice</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">${(summary?.totalBilled || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Total Billed</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${(summary?.totalPaid || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Collected</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">${(summary?.pending || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">${(summary?.overdue || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Overdue</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.collectionRate || 0}%</p>
            )}
            <p className="text-xs text-slate-400">Collection Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-green-600">Invoices</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-green-600">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search invoices..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {invoicesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : invoicesQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No invoices found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {invoicesQuery.data?.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", invoice.status === "paid" ? "bg-green-500/20" : invoice.status === "overdue" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                          <FileText className={cn("w-5 h-5", invoice.status === "paid" ? "text-green-400" : invoice.status === "overdue" ? "text-red-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-slate-400 flex items-center gap-1"><Building className="w-3 h-3" />{invoice.customerName}</p>
                          <p className="text-xs text-slate-500">Load: {invoice.loadNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-green-400 font-bold">${invoice.amount?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {invoice.dueDate}</p>
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/invoices/${invoice.id}`)}><Eye className="w-4 h-4" /></Button>
                          {invoice.status !== "paid" && (
                            <Button variant="ghost" size="sm" onClick={() => sendReminderMutation.mutate({ invoiceId: invoice.id })} disabled={sendReminderMutation.isPending}>
                              {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-green-400" />Recent Payments</CardTitle></CardHeader>
            <CardContent>
              {paymentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : paymentsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No payments recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentsQuery.data?.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                        <div>
                          <p className="text-white font-medium">{payment.invoiceNumber}</p>
                          <p className="text-sm text-slate-400">{payment.customerName}</p>
                          <p className="text-xs text-slate-500">{payment.method} - {payment.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">${payment.amount?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{payment.date}</p>
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
