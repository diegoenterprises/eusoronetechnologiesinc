/**
 * INVOICE DETAILS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, FileText, Calendar, Building, User, Mail,
  Phone, Download, Printer, Send, CheckCircle, Clock,
  AlertTriangle, CreditCard, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InvoiceDetails() {
  const params = useParams<{ invoiceId: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const invoiceQuery = trpc.billing.getInvoiceById.useQuery({ id: params.invoiceId || "" }, { enabled: !!params.invoiceId });
  const paymentsQuery = trpc.billing.getInvoicePayments.useQuery({ invoiceId: params.invoiceId || "" }, { enabled: !!params.invoiceId });

  const sendReminderMutation = trpc.billing.sendReminder.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const markPaidMutation = trpc.billing.markAsPaid.useMutation({
    onSuccess: () => { toast.success("Invoice marked as paid"); invoiceQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (invoiceQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading invoice</p>
        <Button className="mt-4" onClick={() => invoiceQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const invoice = invoiceQuery.data;

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
      <div className="flex items-start justify-between">
        <div>
          {invoiceQuery.isLoading ? <Skeleton className="h-8 w-48" /> : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{invoice?.invoiceNumber}</h1>
              <Badge className={getStatusColor(invoice?.status || "")}>{invoice?.status}</Badge>
            </div>
          )}
          <p className="text-slate-400 mt-1">
            {invoiceQuery.isLoading ? <Skeleton className="h-4 w-64" /> : `Load: ${invoice?.loadNumber}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Download</Button>
          <Button variant="outline" size="sm" className="border-slate-600"><Printer className="w-4 h-4 mr-2" />Print</Button>
          {invoice?.status !== "paid" && (
            <>
              <Button variant="outline" size="sm" className="border-slate-600" onClick={() => params.invoiceId && sendReminderMutation.mutate({ invoiceId: params.invoiceId })} disabled={sendReminderMutation.isPending}>
                {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send Reminder</>}
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => params.invoiceId && markPaidMutation.mutate({ invoiceId: params.invoiceId })} disabled={markPaidMutation.isPending}>
                {markPaidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Mark Paid</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                {invoiceQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-green-400">${invoice?.amount?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-400" />
              <div>
                {invoiceQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-blue-400">${invoice?.amountPaid?.toLocaleString() || 0}</p>
                )}
                <p className="text-xs text-slate-400">Amount Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(invoice?.amountDue && invoice.amountDue > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className={cn("w-8 h-8", invoice?.amountDue && invoice.amountDue > 0 ? "text-red-400" : "text-green-400")} />
              <div>
                {invoiceQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className={cn("text-2xl font-bold", invoice?.amountDue && invoice.amountDue > 0 ? "text-red-400" : "text-green-400")}>
                    ${invoice?.amountDue?.toLocaleString() || 0}
                  </p>
                )}
                <p className="text-xs text-slate-400">Balance Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              <div>
                {invoiceQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-lg font-bold text-purple-400">{invoice?.dueDate}</p>
                )}
                <p className="text-xs text-slate-400">Due Date</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-green-600">Details</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-green-600">Payments</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-green-600">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Building className="w-5 h-5 text-blue-400" />Bill To</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {invoiceQuery.isLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <p className="text-xl font-bold text-white">{invoice?.billTo?.name}</p>
                    <p className="text-slate-400">{invoice?.billTo?.address}</p>
                    <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span className="text-white">{invoice?.billTo?.phone}</span></div>
                    <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><span className="text-white">{invoice?.billTo?.email}</span></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Invoice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {invoiceQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">Invoice Date</span><span className="text-white">{invoice?.invoiceDate}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Due Date</span><span className="text-white">{invoice?.dueDate}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Payment Terms</span><span className="text-white">{invoice?.paymentTerms}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Load Number</span><span className="text-white">{invoice?.loadNumber}</span></div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card className="mt-6 bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Line Items</CardTitle></CardHeader>
            <CardContent>
              {invoiceQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700 text-sm text-slate-400">
                    <span>Description</span>
                    <span className="text-right">Quantity</span>
                    <span className="text-right">Rate</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    {invoice?.lineItems?.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-4 py-2">
                        <span className="text-white">{item.description}</span>
                        <span className="text-right text-slate-400">{item.quantity}</span>
                        <span className="text-right text-slate-400">${item.rate?.toLocaleString()}</span>
                        <span className="text-right text-white font-medium">${item.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4 bg-slate-700" />
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">${invoice?.subtotal?.toLocaleString()}</span></div>
                    {invoice?.tax && <div className="flex justify-between"><span className="text-slate-400">Tax</span><span className="text-white">${invoice.tax.toLocaleString()}</span></div>}
                    <div className="flex justify-between text-lg font-bold"><span className="text-white">Total</span><span className="text-green-400">${invoice?.amount?.toLocaleString()}</span></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Payment History</CardTitle></CardHeader>
            <CardContent>
              {paymentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
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
                          <p className="text-white font-medium">{payment.method}</p>
                          <p className="text-sm text-slate-400">{payment.reference}</p>
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

        <TabsContent value="activity" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Activity Log</CardTitle></CardHeader>
            <CardContent>
              {invoiceQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : invoice?.activity?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No activity recorded</p>
              ) : (
                <div className="space-y-4">
                  {invoice?.activity?.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        {idx < (invoice?.activity?.length || 0) - 1 && <div className="w-0.5 h-8 bg-slate-700 mt-2" />}
                      </div>
                      <div>
                        <p className="text-white">{event.description}</p>
                        <p className="text-xs text-slate-500">{event.timestamp} by {event.user}</p>
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
