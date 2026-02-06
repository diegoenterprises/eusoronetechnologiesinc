/**
 * BROKER COMMISSION DETAIL PAGE
 * 100% Dynamic - View commission breakdown and payment status
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  DollarSign, TrendingUp, ChevronLeft, Download,
  Truck, MapPin, Calendar, CheckCircle, Clock,
  Percent, FileText, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerCommissionDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/broker/commission/:loadId");
  const loadId = params?.loadId;

  const commissionQuery = (trpc as any).brokers.getCommissions.useQuery({});
  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });

  const commission = (commissionQuery.data as any)?.[0];
  const load = loadQuery.data as any;

  if (commissionQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/broker/commission-report")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Commission Detail
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Commission Summary */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Your Commission</p>
              <p className="text-5xl font-bold text-green-400">${commission?.amount?.toLocaleString()}</p>
              <Badge className={cn(
                "border-0 mt-2",
                commission?.paid ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              )}>
                {commission?.paid ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                {commission?.paid ? "Paid" : "Pending"}
              </Badge>
            </div>
            <div className="text-right">
              <div className="p-4 rounded-full bg-green-500/20">
                <Percent className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-green-400 font-bold text-2xl mt-2">{commission?.rate}%</p>
              <p className="text-slate-400 text-sm">Commission Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Reference */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" />
            Load Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-white font-bold">{load?.origin?.city}</p>
              <p className="text-slate-400 text-sm">{load?.origin?.state}</p>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 to-red-400" />
            <div className="text-center">
              <p className="text-white font-bold">{load?.destination?.city}</p>
              <p className="text-slate-400 text-sm">{load?.destination?.state}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs">Shipper</p>
              <p className="text-white font-medium">{load?.shipper?.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs">Carrier</p>
              <p className="text-white font-medium">{load?.carrier?.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs">Pickup</p>
              <p className="text-white font-medium">{load?.pickupDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs">Delivery</p>
              <p className="text-white font-medium">{load?.deliveryDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
            <span className="text-slate-300">Customer Rate</span>
            <span className="text-white font-bold text-lg">${commission?.customerRate?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
            <span className="text-slate-300">Carrier Rate</span>
            <span className="text-white font-bold text-lg">${commission?.carrierRate?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10">
            <span className="text-cyan-400">Gross Margin</span>
            <span className="text-cyan-400 font-bold text-lg">
              ${((commission?.customerRate || 0) - (commission?.carrierRate || 0)).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
            <span className="text-green-400 font-medium">Your Commission ({commission?.rate}%)</span>
            <span className="text-green-400 font-bold text-xl">${commission?.amount?.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Invoice Date</p>
              <p className="text-white font-medium">{commission?.invoiceDate}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Payment Date</p>
              <p className="text-white font-medium">{commission?.paymentDate || "Pending"}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Payment Method</p>
              <p className="text-white font-medium">{commission?.paymentMethod || "Direct Deposit"}</p>
            </div>
          </div>

          {!commission?.paid && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 text-sm">Payment Progress</span>
                <span className="text-yellow-400 text-sm">{commission?.paymentProgress || 0}%</span>
              </div>
              <Progress value={commission?.paymentProgress || 0} className="h-2" />
              <p className="text-slate-400 text-xs mt-2">
                Est. payment: {commission?.estimatedPaymentDate}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
