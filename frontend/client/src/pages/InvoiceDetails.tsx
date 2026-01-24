/**
 * INVOICE DETAILS PAGE
 * Invoice management and payment tracking for accounting
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, FileText, Calendar, User, Building, Truck,
  Download, Send, CheckCircle, Clock, AlertTriangle, Printer,
  CreditCard, Receipt, ArrowRight, Eye, Edit, MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  status: "completed" | "pending" | "failed";
}

export default function InvoiceDetails() {
  const [activeTab, setActiveTab] = useState("details");

  // Mock invoice data
  const invoice = {
    id: "INV-2025-0145",
    status: "pending",
    type: "carrier",
    createdAt: "2025-01-20",
    dueDate: "2025-02-04",
    paidAt: null,
    loadNumber: "LOAD-45842",
    from: {
      name: "ABC Transport LLC",
      address: "123 Trucking Way",
      city: "Houston",
      state: "TX",
      zip: "77001",
      email: "billing@abctransport.com",
      phone: "(555) 123-4567",
    },
    to: {
      name: "Shell Oil Company",
      address: "456 Energy Blvd",
      city: "Houston",
      state: "TX",
      zip: "77002",
      email: "ap@shell.com",
      phone: "(555) 987-6543",
    },
    subtotal: 2850.00,
    fuelSurcharge: 142.50,
    detention: 150.00,
    discount: 0,
    tax: 0,
    total: 3142.50,
    amountPaid: 0,
    amountDue: 3142.50,
    notes: "Payment due within 15 days of delivery. Late payments subject to 1.5% monthly interest.",
    terms: "Net 15",
  };

  const lineItems: LineItem[] = [
    { id: "li_001", description: "Freight - Houston to Dallas (877 miles)", quantity: 1, rate: 2850.00, amount: 2850.00 },
    { id: "li_002", description: "Fuel Surcharge (5%)", quantity: 1, rate: 142.50, amount: 142.50 },
    { id: "li_003", description: "Detention - Loading (2 hours @ $75/hr)", quantity: 2, rate: 75.00, amount: 150.00 },
  ];

  const payments: PaymentRecord[] = [];

  const activityLog = [
    { id: "act_001", action: "Invoice created", timestamp: "2025-01-20T10:00:00Z", user: "System" },
    { id: "act_002", action: "Invoice sent to customer", timestamp: "2025-01-20T10:05:00Z", user: "Sarah Williams" },
    { id: "act_003", action: "Customer viewed invoice", timestamp: "2025-01-21T14:30:00Z", user: "Shell AP Dept" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "draft": return "bg-slate-500/20 text-slate-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const sendReminder = () => {
    toast.success("Payment reminder sent", {
      description: "Email sent to ap@shell.com",
    });
  };

  const downloadPDF = () => {
    toast.success("Invoice downloaded", {
      description: "PDF saved to downloads",
    });
  };

  const markAsPaid = () => {
    toast.success("Invoice marked as paid");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{invoice.id}</h1>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">
            Load: {invoice.loadNumber} | Created: {invoice.createdAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600" onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600" onClick={sendReminder}>
            <Send className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={markAsPaid}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Paid
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">${invoice.total.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">${invoice.amountPaid.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Amount Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-400">${invoice.amountDue.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Amount Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-purple-400">{invoice.dueDate}</p>
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

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Preview */}
            <Card className="lg:col-span-2 bg-white border-slate-300">
              <CardContent className="p-8">
                {/* Invoice Header */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
                    <p className="text-slate-600">{invoice.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 font-bold">{invoice.from.name}</p>
                    <p className="text-sm text-slate-600">{invoice.from.address}</p>
                    <p className="text-sm text-slate-600">{invoice.from.city}, {invoice.from.state} {invoice.from.zip}</p>
                  </div>
                </div>

                {/* Bill To / Ship To */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Bill To</p>
                    <p className="text-slate-900 font-medium">{invoice.to.name}</p>
                    <p className="text-sm text-slate-600">{invoice.to.address}</p>
                    <p className="text-sm text-slate-600">{invoice.to.city}, {invoice.to.state} {invoice.to.zip}</p>
                  </div>
                  <div className="text-right">
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 uppercase">Invoice Date</p>
                      <p className="text-slate-900">{invoice.createdAt}</p>
                    </div>
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 uppercase">Due Date</p>
                      <p className="text-slate-900">{invoice.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Terms</p>
                      <p className="text-slate-900">{invoice.terms}</p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-xs text-slate-500 uppercase">Description</th>
                      <th className="text-right py-2 text-xs text-slate-500 uppercase">Qty</th>
                      <th className="text-right py-2 text-xs text-slate-500 uppercase">Rate</th>
                      <th className="text-right py-2 text-xs text-slate-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 text-slate-900">{item.description}</td>
                        <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-3 text-right text-slate-600">${item.rate.toFixed(2)}</td>
                        <td className="py-3 text-right text-slate-900">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="text-slate-900">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-600">Discount</span>
                        <span className="text-green-600">-${invoice.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.tax > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-600">Tax</span>
                        <span className="text-slate-900">${invoice.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t border-slate-200 font-bold">
                      <span className="text-slate-900">Total</span>
                      <span className="text-slate-900">${invoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold bg-yellow-50 px-2 -mx-2 rounded">
                      <span className="text-yellow-700">Amount Due</span>
                      <span className="text-yellow-700">${invoice.amountDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-8 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-slate-600">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Send className="w-4 h-4 mr-2" />
                    Resend Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600 text-red-400">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Void Invoice
                  </Button>
                </CardContent>
              </Card>

              {/* Related Load */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Related Load</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{invoice.loadNumber}</p>
                        <p className="text-xs text-slate-500">Houston to Dallas</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Customer Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-white">{invoice.to.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">{invoice.to.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">{invoice.to.phone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Payment History</CardTitle>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No payments recorded</p>
                  <p className="text-sm text-slate-500 mt-1">Record a payment when received</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">${payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{payment.method} - {payment.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{payment.date}</p>
                        <Badge className="bg-green-500/20 text-green-400">{payment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                    <div className="flex-1">
                      <p className="text-white">{activity.action}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        <span>by {activity.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
