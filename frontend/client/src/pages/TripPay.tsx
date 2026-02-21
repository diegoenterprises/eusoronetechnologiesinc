/**
 * TRIP PAY PAGE
 * Driver-facing trip payment breakdown screen.
 * Shows per-trip earnings including line haul, fuel surcharge, accessorials,
 * detention, hazmat premium, and deductions. Pulls from wallet/earnings data.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DollarSign, Truck, MapPin, Clock, ChevronRight,
  RefreshCw, ArrowRight, TrendingUp, Fuel, Shield,
  FileText, Calendar, Package
} from "lucide-react";

export default function TripPay() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const earningsQuery = (trpc as any).wallet?.getEarnings?.useQuery?.() || (trpc as any).drivers?.getEarnings?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const loadsQuery = (trpc as any).loads?.list?.useQuery?.({ limit: 10 }) || { data: [], isLoading: false };

  const earnings = earningsQuery.data;
  const loads: any[] = Array.isArray(loadsQuery.data) ? loadsQuery.data : [];
  const completedLoads = loads.filter((l: any) => l.status === "delivered");
  const isLoading = earningsQuery.isLoading || loadsQuery.isLoading;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const sc = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30");

  // Simulate trip pay breakdown from load data
  const buildTripPay = (load: any) => {
    const rate = Number(load.rate || load.amount || 0);
    const miles = Number(load.distance || load.miles || 0);
    const perMile = miles > 0 ? rate / miles : 0;
    const fuelSurcharge = rate * 0.12;
    const hazmatPremium = (load.hazmatClass || load.cargoType === "hazmat") ? rate * 0.08 : 0;
    const detention = Number(load.detentionCharge || 0);
    const accessorials = Number(load.accessorials || 0);
    const gross = rate + fuelSurcharge + hazmatPremium + detention + accessorials;
    const platformFee = gross * 0.035;
    const insuranceDeduction = gross * 0.02;
    const net = gross - platformFee - insuranceDeduction;
    return { rate, miles, perMile, fuelSurcharge, hazmatPremium, detention, accessorials, gross, platformFee, insuranceDeduction, net };
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Trip Pay
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Per-trip earnings breakdown and payment details
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")}
          onClick={() => earningsQuery.refetch?.()}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <DollarSign className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: `$${(earnings?.totalEarnings || earnings?.total || 0).toLocaleString()}`, label: "Total Earned", color: "text-green-400" },
              { icon: <Truck className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(completedLoads.length), label: "Trips Completed", color: "text-blue-400" },
              { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: completedLoads.length > 0 ? `$${Math.round((earnings?.totalEarnings || 0) / completedLoads.length).toLocaleString()}` : "$0", label: "Avg Per Trip", color: "text-purple-400" },
              { icon: <Calendar className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: earnings?.pendingAmount ? `$${Number(earnings.pendingAmount).toLocaleString()}` : "$0", label: "Pending", color: "text-cyan-400" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.02] border-white/[0.06]")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                    <div>
                      <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trip List */}
          {completedLoads.length === 0 ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
                  <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
                <p className={cn("font-medium text-lg", isLight ? "text-slate-600" : "text-slate-300")}>No Completed Trips Yet</p>
                <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                  Trip pay details will appear here after you complete deliveries
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedLoads.map((load: any) => {
                const pay = buildTripPay(load);
                return (
                  <Card key={load.id} className={cn(cc, "overflow-hidden")}>
                    <CardContent className="p-0">
                      {/* Trip header */}
                      <div className={cn(
                        "flex items-center justify-between px-5 py-4",
                        isLight ? "border-b border-slate-100" : "border-b border-slate-700/30"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2.5 rounded-xl", "bg-green-500/15")}>
                            <Truck className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                              Load #{load.loadNumber || load.id}
                            </p>
                            <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                              {load.origin?.city || "Origin"} → {load.destination?.city || "Destination"}
                              {pay.miles > 0 && ` · ${pay.miles} mi`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                            ${pay.net.toFixed(2)}
                          </p>
                          <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Net Pay</p>
                        </div>
                      </div>

                      {/* Pay breakdown */}
                      <div className="px-5 py-4 space-y-2">
                        {/* Earnings */}
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium mb-1", isLight ? "text-slate-400" : "text-slate-500")}>
                          Earnings
                        </p>
                        {[
                          { label: "Line Haul", amount: pay.rate, show: true },
                          { label: "Fuel Surcharge", amount: pay.fuelSurcharge, show: true },
                          { label: "Hazmat Premium", amount: pay.hazmatPremium, show: pay.hazmatPremium > 0 },
                          { label: "Detention", amount: pay.detention, show: pay.detention > 0 },
                          { label: "Accessorials", amount: pay.accessorials, show: pay.accessorials > 0 },
                        ].filter((item) => item.show).map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-1">
                            <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{item.label}</p>
                            <p className={cn("text-sm font-medium tabular-nums", isLight ? "text-slate-800" : "text-white")}>
                              ${item.amount.toFixed(2)}
                            </p>
                          </div>
                        ))}

                        <div className={cn("my-2 border-t", isLight ? "border-slate-100" : "border-slate-700/30")} />

                        <div className="flex items-center justify-between py-1">
                          <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>Gross Pay</p>
                          <p className={cn("text-sm font-bold tabular-nums", isLight ? "text-slate-800" : "text-white")}>${pay.gross.toFixed(2)}</p>
                        </div>

                        {/* Deductions */}
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium mt-3 mb-1", isLight ? "text-red-400" : "text-red-400/70")}>
                          Deductions
                        </p>
                        {[
                          { label: "Platform Fee (3.5%)", amount: -pay.platformFee },
                          { label: "Insurance (2%)", amount: -pay.insuranceDeduction },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-1">
                            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>{item.label}</p>
                            <p className="text-sm font-medium tabular-nums text-red-400">${item.amount.toFixed(2)}</p>
                          </div>
                        ))}

                        <div className={cn("my-2 border-t-2", isLight ? "border-slate-200" : "border-slate-600")} />

                        {/* Net */}
                        <div className="flex items-center justify-between py-1">
                          <p className={cn("text-base font-bold", isLight ? "text-slate-800" : "text-white")}>Net Pay</p>
                          <p className="text-xl font-black tabular-nums bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                            ${pay.net.toFixed(2)}
                          </p>
                        </div>

                        {pay.perMile > 0 && (
                          <p className={cn("text-xs text-right", isLight ? "text-slate-400" : "text-slate-500")}>
                            ${pay.perMile.toFixed(2)}/mi line haul · ${(pay.net / pay.miles).toFixed(2)}/mi net
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
