/**
 * SETTLEMENT DETAILS PAGE
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
  DollarSign, FileText, Calendar, User, Truck, Download,
  CheckCircle, Clock, AlertTriangle, CreditCard, Building,
  TrendingUp, Eye, Printer, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettlementDetails() {
  const params = useParams<{ settlementId: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const settlementQuery = (trpc as any).earnings.getSettlementById.useQuery(
    { id: params.settlementId || "" },
    { enabled: !!params.settlementId }
  );
  const historyQuery = (trpc as any).earnings.getSettlementHistory.useQuery({ driverId: (settlementQuery.data as any)?.driverId || "" }, { enabled: !!(settlementQuery.data as any)?.driverId });

  const approveMutation = (trpc as any).earnings.approveSettlement.useMutation({
    onSuccess: () => { toast.success("Settlement approved"); settlementQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to approve", { description: error.message }),
  });

  const processPaymentMutation = (trpc as any).earnings.processPayment.useMutation({
    onSuccess: () => { toast.success("Payment initiated"); settlementQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to process payment", { description: error.message }),
  });

  if (settlementQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading settlement</p>
        <Button className="mt-4" onClick={() => settlementQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const settlement = settlementQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "approved": return "bg-blue-500/20 text-blue-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {settlementQuery.isLoading ? <Skeleton className="h-8 w-48" /> : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{settlement?.id}</h1>
              <Badge className={getStatusColor(settlement?.status || "")}>{settlement?.status}</Badge>
            </div>
          )}
          <p className="text-slate-400 mt-1">
            {settlementQuery.isLoading ? <Skeleton className="h-4 w-64" /> : `Pay Period: ${settlement?.periodStart} to ${settlement?.periodEnd}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />Download
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600">
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          {settlement?.status === "pending" && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => params.settlementId && approveMutation.mutate({ settlementId: params.settlementId })} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Approve</>}
            </Button>
          )}
          {settlement?.status === "approved" && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => params.settlementId && processPaymentMutation.mutate({ settlementId: params.settlementId })} disabled={processPaymentMutation.isPending}>
              {processPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4 mr-2" />Process Payment</>}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                {settlementQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${settlement?.grossRevenue?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Gross Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-400" />
              <div>
                {settlementQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-blue-400">${settlement?.driverPay?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Driver Pay ({settlement?.payRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                {settlementQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-red-400">-${Math.abs(settlement?.totalDeductions || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-400" />
              <div>
                {settlementQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-purple-400">${settlement?.netPay?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Info */}
      <Card className="bg-white/[0.02] border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                {settlementQuery.isLoading ? <Skeleton className="h-6 w-32" /> : (
                  <>
                    <p className="text-white font-bold">{settlement?.driverName}</p>
                    <p className="text-sm text-slate-400">Pay Type: {settlement?.payType}</p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Payment Method</p>
              {settlementQuery.isLoading ? <Skeleton className="h-5 w-24" /> : (
                <p className="text-white font-medium">{settlement?.paymentMethod}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-green-600">Details</TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-green-600">Loads</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/[0.02] border-slate-700">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {settlementQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {settlement?.revenueItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                        <div>
                          <p className="text-white">{item.description}</p>
                          <p className="text-xs text-slate-500">{item.category} - {item.date}</p>
                        </div>
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-medium">+${item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                    <Separator className="my-4 bg-slate-700" />
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Revenue</span>
                      <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${settlement?.grossRevenue?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-slate-700">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />Deductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {settlementQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {settlement?.deductionItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                        <div>
                          <p className="text-white">{item.description}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <p className="text-red-400 font-medium">-${Math.abs(item.amount).toLocaleString()}</p>
                      </div>
                    ))}
                    <Separator className="my-4 bg-slate-700" />
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Deductions</span>
                      <span className="text-red-400 font-bold">-${Math.abs(settlement?.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Net Pay Summary */}
          <Card className="mt-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400">Net Pay</p>
                  {settlementQuery.isLoading ? <Skeleton className="h-12 w-32" /> : (
                    <p className="text-4xl font-bold text-purple-400">${settlement?.netPay?.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loads" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader><CardTitle className="text-white">Loads in This Period</CardTitle></CardHeader>
            <CardContent>
              {settlementQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : settlement?.loads?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No loads in this period</p>
              ) : (
                <div className="space-y-3">
                  {settlement?.loads?.map((load: any) => (
                    <div key={load.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Truck className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-slate-400">{load.route}</p>
                          <p className="text-xs text-slate-500">{load.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${load.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Driver: ${load.driverPay.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader><CardTitle className="text-white">Previous Settlements</CardTitle></CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (historyQuery.data as any)?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No previous settlements</p>
              ) : (
                <div className="space-y-3">
                  {(historyQuery.data as any)?.map((stl: any) => (
                    <div key={stl.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-white/[0.04] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{stl.id}</p>
                          <p className="text-sm text-slate-400">{stl.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${stl.netPay.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Paid {stl.paidDate}</p>
                        </div>
                        <Badge className={getStatusColor(stl.status)}>{stl.status}</Badge>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
