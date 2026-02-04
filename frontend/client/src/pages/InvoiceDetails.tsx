/**
 * INVOICE DETAILS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, DollarSign, ArrowLeft, Download, Send,
  CheckCircle, Clock, Building, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function InvoiceDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const invoiceId = params.id as string;

  const invoiceQuery = trpc.payments.getInvoice.useQuery({ id: invoiceId });
  const invoice = invoiceQuery.data;

  const sendMutation = trpc.payments.sendInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice sent"); invoiceQuery.refetch(); },
    onError: (error) => toast.error("Failed to send invoice", { description: error.message }),
  });

  const markPaidMutation = trpc.payments.markInvoicePaid.useMutation({
    onSuccess: () => { toast.success("Invoice marked as paid"); invoiceQuery.refetch(); },
    onError: (error) => toast.error("Failed to update invoice", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Draft</Badge>;
      case "sent": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Sent</Badge>;
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0">Paid</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  if (invoiceQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg">Invoice not found</p>
          <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation("/billing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation("/billing")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">Created {invoice.createdAt}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Download
          </Button>
          {invoice.status === "draft" && (
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => sendMutation.mutate({ invoiceId: invoice.id })} disabled={sendMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />Send Invoice
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={() => markPaidMutation.mutate({ invoiceId: invoice.id })} disabled={markPaidMutation.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />Mark Paid
            </Button>
          )}
        </div>
      </div>

      {/* Amount Card */}
      <Card className={cn("rounded-xl", invoice.status === "paid" ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30" : invoice.status === "overdue" ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30" : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30")}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-white">${(invoice.total || 0).toLocaleString()}</p>
              {invoice.status === "overdue" && (
                <p className="text-red-400 text-sm mt-1">Overdue by {invoice.daysOverdue} days</p>
              )}
            </div>
            <div className={cn("p-4 rounded-full", invoice.status === "paid" ? "bg-green-500/20" : invoice.status === "overdue" ? "bg-red-500/20" : "bg-cyan-500/20")}>
              <DollarSign className={cn("w-10 h-10", invoice.status === "paid" ? "text-green-400" : invoice.status === "overdue" ? "text-red-400" : "text-cyan-400")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill To */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-cyan-400" />
              Bill To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <p className="text-white font-medium">{invoice.billTo?.name}</p>
              <p className="text-sm text-slate-400">{invoice.billTo?.address}</p>
              <p className="text-sm text-slate-400">{invoice.billTo?.city}, {invoice.billTo?.state} {invoice.billTo?.zip}</p>
              <p className="text-sm text-slate-400 mt-2">{invoice.billTo?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Invoice Date</p>
                <p className="text-white font-medium">{invoice.invoiceDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Due Date</p>
                <p className={cn("font-medium", invoice.status === "overdue" ? "text-red-400" : "text-white")}>{invoice.dueDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Terms</p>
                <p className="text-white font-medium">{invoice.terms || "Net 30"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30">
                <p className="text-xs text-slate-500">Reference</p>
                <p className="text-white font-medium">{invoice.reference || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.lineItems?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No line items</p>
            ) : (
              <div className="space-y-3">
                {invoice.lineItems?.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.description}</p>
                      <p className="text-sm text-slate-400">{item.loadNumber && `Load: ${item.loadNumber}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${(item.amount || 0).toLocaleString()}</p>
                      {item.weight && item.rate && (
                        <p className="text-xs text-slate-500">{item.weight} x ${item.rate}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Totals */}
                <div className="border-t border-slate-700/50 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${(invoice.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Tax</span>
                      <span>${(invoice.tax || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${(invoice.discount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-700/50">
                    <span>Total</span>
                    <span>${(invoice.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
