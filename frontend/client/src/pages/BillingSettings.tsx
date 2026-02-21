/**
 * BILLING SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, DollarSign, Calendar, Download, Plus,
  CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BillingSettings() {
  // Real Stripe data
  const subscriptionQuery = (trpc as any).stripe.getSubscription.useQuery();
  const paymentMethodsQuery = (trpc as any).stripe.listPaymentMethods.useQuery();
  const invoicesQuery = (trpc as any).stripe.listInvoices.useQuery({ limit: 10 });
  const usageQuery = (trpc as any).billing.getUsage.useQuery();

  const subscription = subscriptionQuery.data;
  const usage = usageQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "past_due": return <Badge className="bg-red-500/20 text-red-400 border-0">Past Due</Badge>;
      case "cancelled": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Billing Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your subscription and payments</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-2xl font-bold text-white">{subscription?.planName}</p>
                  {getStatusBadge(subscription?.status || "active")}
                </div>
                <p className="text-slate-400">${subscription?.price}/month • Renews {subscription?.renewalDate}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                  Change Plan
                </Button>
                <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {usageQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              {usage?.items?.map((item: any) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-slate-400">{item.used} / {item.limit}</span>
                  </div>
                  <Progress value={(item.used / item.limit) * 100} className={cn("h-2", (item.used / item.limit) > 0.9 && "[&>div]:bg-red-500")} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Payment Methods
              </CardTitle>
              <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                <Plus className="w-4 h-4 mr-1" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentMethodsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (paymentMethodsQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No payment methods</p>
            ) : (
              <div className="space-y-3">
                {(paymentMethodsQuery.data as any)?.map((method: any) => (
                  <div key={method.id} className={cn("p-4 rounded-xl flex items-center justify-between", method.isDefault ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-white font-medium">{method.brand} •••• {method.last4}</p>
                        <p className="text-xs text-slate-500">Expires {method.expMonth}/{method.expYear}</p>
                      </div>
                    </div>
                    {method.isDefault && <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Default</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (invoicesQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No invoices</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(invoicesQuery.data as any)?.map((invoice: any) => (
                  <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                    <div>
                      <p className="text-white font-medium">{invoice.number}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />{invoice.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-medium">${invoice.amount?.toLocaleString()}</p>
                        {invoice.status === "paid" ? (
                          <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Paid</span>
                        ) : (
                          <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Unpaid</span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
