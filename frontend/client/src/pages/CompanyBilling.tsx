/**
 * COMPANY BILLING PAGE
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
  CreditCard, DollarSign, Calendar, Download,
  TrendingUp, AlertTriangle, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function CompanyBilling() {
  const [, setLocation] = useLocation();

  const billingQuery = trpc.company.getBilling.useQuery();
  const invoicesQuery = trpc.company.getRecentInvoices.useQuery({ limit: 5 });

  const billing = billingQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Company Billing
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage billing and payments</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation("/settings/billing/history")}>
          View Full History
        </Button>
      </div>

      {/* Current Plan */}
      {billingQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-cyan-500/20">
                  <CreditCard className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-2xl font-bold">{billing?.planName}</p>
                    <Badge className="bg-green-500/20 text-green-400 border-0">{billing?.status}</Badge>
                  </div>
                  <p className="text-slate-400">${billing?.monthlyPrice}/month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Next billing date</p>
                <p className="text-white font-medium flex items-center gap-1"><Calendar className="w-4 h-4" />{billing?.nextBillingDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {billingQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${billing?.currentBalance?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Current Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {billingQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-blue-400">${billing?.monthToDate?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Month to Date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {billingQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{billing?.paymentMethod}</p>
                )}
                <p className="text-xs text-slate-400">Payment Method</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {billingQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{billing?.pendingCharges || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending Charges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Usage This Period</CardTitle>
        </CardHeader>
        <CardContent>
          {billingQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              {billing?.usage?.map((item: any) => (
                <div key={item.name} className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{item.name}</span>
                    <span className="text-slate-400">{item.used} / {item.limit}</span>
                  </div>
                  <Progress value={(item.used / item.limit) * 100} className={cn("h-2", item.used / item.limit > 0.9 && "[&>div]:bg-red-500")} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : invoicesQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {invoicesQuery.data?.map((invoice: any) => (
                <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <div>
                    <p className="text-white font-medium">{invoice.number}</p>
                    <p className="text-xs text-slate-500">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={cn(invoice.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400", "border-0")}>
                      {invoice.status === "paid" ? <CheckCircle className="w-3 h-3 mr-1" /> : null}{invoice.status}
                    </Badge>
                    <p className="text-emerald-400 font-bold">${invoice.amount?.toLocaleString()}</p>
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
  );
}
