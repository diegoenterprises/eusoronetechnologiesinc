/**
 * BILLING PAGE
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
  CreditCard, DollarSign, FileText, Download, Clock,
  CheckCircle, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Billing() {
  const [activeTab, setActiveTab] = useState("invoices");

  const summaryQuery = (trpc as any).billing.getSummary.useQuery();
  const invoicesQuery = (trpc as any).billing.getInvoices.useQuery({ limit: 20 });
  const paymentsQuery = (trpc as any).billing.getPayments.useQuery({ limit: 20 });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0">Paid</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Billing
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage invoices and payment history</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-green-400">${(summary?.totalPaid || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Paid</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-yellow-400">${(summary?.pending || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-red-400">${(summary?.overdue || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.invoiceCount || 0}</p>
                )}
                <p className="text-xs text-slate-400">Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-slate-700 rounded-md">Invoices</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-slate-700 rounded-md">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {invoicesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (invoicesQuery.data as any)?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No invoices</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(invoicesQuery.data as any)?.map((invoice: any) => (
                    <div key={invoice.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", invoice.status === "paid" ? "bg-green-500/20" : invoice.status === "overdue" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                            <FileText className={cn("w-6 h-6", invoice.status === "paid" ? "text-green-400" : invoice.status === "overdue" ? "text-red-400" : "text-yellow-400")} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-slate-400">{invoice.description}</p>
                            <p className="text-xs text-slate-500">{invoice.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-white font-bold">${invoice.amount?.toLocaleString()}</p>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Download className="w-4 h-4" />
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

        <TabsContent value="payments" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {paymentsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (paymentsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No payments</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(paymentsQuery.data as any)?.map((payment: any) => (
                    <div key={payment.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-green-500/20">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{payment.invoiceNumber}</p>
                            <p className="text-sm text-slate-400">{payment.method}</p>
                            <p className="text-xs text-slate-500">{payment.date}</p>
                          </div>
                        </div>
                        <p className="text-green-400 font-bold text-lg">${payment.amount?.toLocaleString()}</p>
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
