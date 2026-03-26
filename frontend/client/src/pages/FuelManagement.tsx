/**
 * FUEL MANAGEMENT CENTER
 * Comprehensive fuel operations: dashboard, IFTA, optimization, theft detection,
 * fuel cards, DEF tracking, surcharge calculator, efficiency rankings, idling
 * Dark theme with yellow/amber fuel accents
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Fuel, DollarSign, TrendingUp, TrendingDown, MapPin,
  Search, Truck, Calendar, CreditCard, AlertTriangle,
  Shield, BarChart3, Droplets, Clock, Leaf, FileText,
  Calculator, Award, Package, Eye,
  ArrowUpRight, ArrowDownRight, Target, Zap, Receipt, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// ── Reusable Components ──────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, loading }: {
  icon: any; label: string; value: string | number; sub?: string;
  color: string; loading?: boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", color)}>
            <Icon className="w-6 h-6 text-inherit" />
          </div>
          <div className="min-w-0">
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"} truncate`}>{value}</p>
            )}
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="text-center py-16">
      <div className={`p-4 rounded-full ${isLight ? "bg-slate-100" : "bg-slate-700/50"} w-20 h-20 mx-auto mb-4 flex items-center justify-center`}>
        <Icon className="w-10 h-10 text-slate-500" />
      </div>
      <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-lg`}>{message}</p>
    </div>
  );
}

// ── Tab Panels ───────────────────────────────────────────────────────────────

function DashboardPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dashQuery = trpc.fuelManagement.getFuelDashboard.useQuery({});
  const d = dashQuery.data;
  const loading = dashQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total Spend (30d)" value={`$${(d?.totalSpend || 0).toLocaleString()}`}
          color="bg-amber-500/20 text-amber-400" loading={loading}
          sub={d?.trends?.spendChange ? `${d.trends.spendChange > 0 ? "+" : ""}${d.trends.spendChange}% vs prev` : undefined} />
        <KpiCard icon={Fuel} label="Avg MPG" value={d?.avgMpg || 0}
          color="bg-yellow-500/20 text-yellow-400" loading={loading} />
        <KpiCard icon={Target} label="Cost per Mile" value={`$${(d?.fuelCostPerMile || 0).toFixed(2)}`}
          color="bg-orange-500/20 text-orange-400" loading={loading} />
        <KpiCard icon={Fuel} label="Total Gallons" value={(d?.totalGallons || 0).toLocaleString()}
          color="bg-amber-600/20 text-amber-300" loading={loading} />
      </div>

      {/* Monthly Spend + Fuel Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <BarChart3 className="w-5 h-5 text-amber-400" /> Monthly Fuel Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SectionSkeleton rows={3} /> : (
              <div className="space-y-3">
                {(d?.monthlySpend || []).slice(-6).map((m: any) => (
                  <div key={m.month} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{m.month}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className={`flex-1 h-2 ${isLight ? "bg-slate-200" : "bg-slate-700"} rounded-full overflow-hidden`}>
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                          style={{ width: `${Math.min(100, (m.amount / Math.max(1, ...((d?.monthlySpend || []).map((x: any) => x.amount)))) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">${m.amount.toLocaleString()}</span>
                  </div>
                ))}
                {(d?.monthlySpend || []).length === 0 && (
                  <p className="text-slate-500 text-center py-4">No monthly data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Fuel className="w-5 h-5 text-yellow-400" /> Fuel Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SectionSkeleton rows={3} /> : (
              <div className="space-y-4">
                {(d?.fuelTypeBreakdown || []).map((ft: any) => (
                  <div key={ft.type} className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{ft.type}</span>
                      <span className="text-amber-400 font-bold">${ft.cost.toLocaleString()}</span>
                    </div>
                    <div className={`flex items-center justify-between text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      <span>{ft.gallons.toLocaleString()} gallons</span>
                      <span>{d?.totalGallons ? Math.round((ft.gallons / d.totalGallons) * 100) : 0}%</span>
                    </div>
                    <Progress value={d?.totalGallons ? (ft.gallons / d.totalGallons) * 100 : 0}
                      className="mt-2 h-1.5 bg-slate-700 [&>div]:bg-amber-500" />
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

function FuelPricesPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const pricesQuery = trpc.fuelManagement.getFuelPrices.useQuery({});
  const p = pricesQuery.data;

  return (
    <div className="space-y-6">
      {/* National Average */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>National Diesel Average</p>
              {pricesQuery.isLoading ? <Skeleton className="h-10 w-24 mt-1" /> : (
                <p className="text-4xl font-bold text-amber-400">${p?.nationalAverage?.toFixed(2) || "0.00"}</p>
              )}
            </div>
            <div className="p-4 rounded-full bg-amber-500/20">
              <Fuel className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Prices */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <MapPin className="w-5 h-5 text-amber-400" /> Regional Prices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pricesQuery.isLoading ? <SectionSkeleton /> : (
              <div className="space-y-3">
                {(p?.regions || []).map((r: any) => (
                  <div key={r.region} className={`flex items-center justify-between p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"} ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/50"} transition-colors`}>
                    <div>
                      <span className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{r.region}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Low: ${r.low.toFixed(2)}</span>
                        <span>-</span>
                        <span>High: ${r.high.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-400">${r.price.toFixed(2)}</span>
                      {r.change !== 0 && (
                        <span className={cn("flex items-center text-xs", r.change > 0 ? "text-red-400" : "text-green-400")}>
                          {r.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(r.change).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optimization Suggestions */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Zap className="w-5 h-5 text-yellow-400" /> Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pricesQuery.isLoading ? <SectionSkeleton rows={3} /> : (
              <div className="space-y-3">
                {(p?.optimizationSuggestions || []).map((s: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"} border-l-4 border-amber-500`}>
                    <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{s.tip}</p>
                    <p className="text-xs text-amber-400 mt-1 font-medium">
                      Potential savings: ${s.savingsPotential.toFixed(2)}/gal
                    </p>
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

function TransactionsPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const txQuery = trpc.fuelManagement.getFuelTransactions.useQuery({ limit: 50 });
  const txData = txQuery.data;

  const filtered = (txData?.transactions || []).filter((tx: any) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return tx.stationName?.toLowerCase().includes(s) ||
      String(tx.driverId).includes(s) ||
      String(tx.vehicleId).includes(s);
  });

  return (
    <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
            <Receipt className="w-5 h-5 text-amber-400" /> Fuel Transactions
            {txData?.total ? <Badge variant="outline" className="text-amber-400 border-amber-500/30 ml-2">{txData.total}</Badge> : null}
          </CardTitle>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search station, driver, vehicle..."
              className={`pl-9 ${isLight ? "bg-white border-slate-200" : "bg-slate-700/30 border-slate-600/50"} rounded-lg focus:border-amber-500/50`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 max-h-[600px] overflow-y-auto">
        {txQuery.isLoading ? <SectionSkeleton rows={6} /> :
          filtered.length === 0 ? <EmptyState icon={Fuel} message="No transactions found" /> : (
            <div className="divide-y divide-slate-700/50">
              {filtered.map((tx: any) => (
                <div key={tx.id} className={cn(
                  `p-4 ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20"} transition-colors`,
                  tx.flagged && "border-l-4 border-red-500 bg-red-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-full", tx.flagged ? "bg-red-500/20" : "bg-amber-500/20")}>
                        {tx.flagged ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Fuel className="w-5 h-5 text-amber-400" />}
                      </div>
                      <div>
                        <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{tx.stationName}</p>
                        <div className={`flex items-center gap-3 text-sm ${isLight ? "text-slate-500" : "text-slate-400"} mt-0.5`}>
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" />V-{tx.vehicleId}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{tx.date ? new Date(tx.date).toLocaleDateString() : ""}</span>
                        </div>
                        {tx.flagged && tx.flagReason && (
                          <Badge variant="destructive" className="mt-1 text-xs">{tx.flagReason}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${isLight ? "text-slate-900" : "text-white"} font-bold`}>{tx.gallons.toFixed(1)} gal</p>
                      <p className="text-amber-400 font-medium">${tx.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">${tx.pricePerGallon.toFixed(3)}/gal</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function FuelCardsPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const cardsQuery = trpc.fuelManagement.getFuelCardManagement.useQuery({});
  const data = cardsQuery.data;

  return (
    <div className="space-y-6">
      {/* Card Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={CreditCard} label="Total Cards" value={data?.summary?.total || 0}
          color="bg-amber-500/20 text-amber-400" loading={cardsQuery.isLoading} />
        <KpiCard icon={CreditCard} label="Active" value={data?.summary?.active || 0}
          color="bg-green-500/20 text-green-400" loading={cardsQuery.isLoading} />
        <KpiCard icon={CreditCard} label="Suspended" value={data?.summary?.suspended || 0}
          color="bg-red-500/20 text-red-400" loading={cardsQuery.isLoading} />
        <KpiCard icon={DollarSign} label="Total Spent" value={`$${(data?.summary?.totalSpent || 0).toLocaleString()}`}
          color="bg-yellow-500/20 text-yellow-400" loading={cardsQuery.isLoading} />
      </div>

      {/* Cards Grid */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
            <CreditCard className="w-5 h-5 text-amber-400" /> Fuel Card Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cardsQuery.isLoading ? <SectionSkeleton /> :
            (data?.cards || []).length === 0 ? <EmptyState icon={CreditCard} message="No fuel cards found" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data?.cards || []).map((card: any) => (
                  <div key={card.id} className={`p-4 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"} border ${isLight ? "border-slate-200 hover:border-amber-300" : "border-slate-600/30 hover:border-amber-500/30"} transition-colors`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${isLight ? "text-slate-900" : "text-white"} font-mono font-medium`}>{card.cardNumber}</span>
                      <Badge className={cn(
                        "text-xs",
                        card.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        card.status === "suspended" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      )}>{card.status}</Badge>
                    </div>
                    <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{card.driverName}</p>
                    <p className="text-xs text-slate-500 mt-1">{card.cardType?.toUpperCase()}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Daily Limit</span>
                        <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>${card.dailyLimit.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Monthly Limit</span>
                        <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>${card.monthlyLimit.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Monthly Spent</span>
                        <p className="text-amber-400 font-medium">${card.monthlySpent.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Spent</span>
                        <p className="text-amber-400 font-medium">${card.totalSpent.toLocaleString()}</p>
                      </div>
                    </div>
                    <Progress value={card.monthlyLimit > 0 ? (card.monthlySpent / card.monthlyLimit) * 100 : 0}
                      className="mt-3 h-1.5 bg-slate-700 [&>div]:bg-amber-500" />
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function IftaPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(2026);
  const iftaQuery = trpc.fuelManagement.getIftaReporting.useQuery({ quarter, year });
  const iftaData = iftaQuery.data;

  return (
    <div className="space-y-6">
      {/* Quarter Selector */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>Quarter:</span>
            {[1, 2, 3, 4].map(q => (
              <Button key={q} size="sm" variant={quarter === q ? "default" : "outline"}
                className={quarter === q ? "bg-amber-500 hover:bg-amber-600 text-black" : "border-slate-600 text-slate-400 hover:text-white"}
                onClick={() => setQuarter(q)}>
                Q{q}
              </Button>
            ))}
            <span className="text-slate-400 text-sm ml-4">Year:</span>
            <Input type="number" value={year} onChange={(e: any) => setYear(parseInt(e.target.value) || 2026)}
              className={`w-24 ${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-700/30 border-slate-600/50 text-white"}`} />
          </div>
        </CardContent>
      </Card>

      {/* IFTA Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Truck} label="Total Miles" value={(iftaData?.totals?.totalMiles || 0).toLocaleString()}
          color="bg-amber-500/20 text-amber-400" loading={iftaQuery.isLoading} />
        <KpiCard icon={Fuel} label="Total Gallons" value={(iftaData?.totals?.totalGallons || 0).toLocaleString()}
          color="bg-yellow-500/20 text-yellow-400" loading={iftaQuery.isLoading} />
        <KpiCard icon={Target} label="Fleet MPG" value={iftaData?.totals?.fleetMpg || 0}
          color="bg-orange-500/20 text-orange-400" loading={iftaQuery.isLoading} />
        <KpiCard icon={DollarSign} label="Tax Paid" value={`$${(iftaData?.totals?.totalTaxPaid || 0).toLocaleString()}`}
          color="bg-green-500/20 text-green-400" loading={iftaQuery.isLoading} />
        <KpiCard icon={DollarSign} label="Net Due" value={`$${(iftaData?.totals?.netDue || 0).toLocaleString()}`}
          color={(iftaData?.totals?.netDue ?? 0) > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}
          loading={iftaQuery.isLoading} />
      </div>

      {/* Jurisdiction Breakdown */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <FileText className="w-5 h-5 text-amber-400" /> Jurisdiction Breakdown
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                Deadline: {iftaData?.filingDeadline || ""}
              </Badge>
              <Badge className={cn(
                (iftaData?.status as string) === "filed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              )}>{iftaData?.status || "draft"}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {iftaQuery.isLoading ? <SectionSkeleton rows={5} /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="pb-3 pr-4">State</th>
                  <th className="pb-3 pr-4 text-right">Miles</th>
                  <th className="pb-3 pr-4 text-right">Gallons</th>
                  <th className="pb-3 pr-4 text-right">Tax Rate</th>
                  <th className="pb-3 pr-4 text-right">Tax Paid</th>
                  <th className="pb-3 pr-4 text-right">Tax Owed</th>
                  <th className="pb-3 text-right">Net Due</th>
                </tr>
              </thead>
              <tbody>
                {(iftaData?.jurisdictions || []).map((j: any) => (
                  <tr key={j.state} className={`border-b ${isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20"} transition-colors`}>
                    <td className="py-3 pr-4 text-white font-medium">{j.state}</td>
                    <td className="py-3 pr-4 text-right text-slate-300">{j.miles.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-slate-300">{j.gallons.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-slate-400">${j.taxRate.toFixed(3)}</td>
                    <td className="py-3 pr-4 text-right text-green-400">${j.taxPaid.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-right text-slate-300">${j.taxOwed.toFixed(2)}</td>
                    <td className={cn("py-3 text-right font-medium",
                      j.netDue > 0 ? "text-red-400" : "text-green-400"
                    )}>{j.netDue > 0 ? "" : "-"}${Math.abs(j.netDue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SurchargePanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [miles, setMiles] = useState(1000);
  const [mpg, setMpg] = useState(6.0);

  const calcQuery = trpc.fuelManagement.getFuelSurchargeCalculator.useQuery({ miles, avgMpg: mpg });
  const historyQuery = trpc.fuelManagement.getFuelSurchargeHistory.useQuery({});
  const calc = calcQuery.data;

  return (
    <div className="space-y-6">
      {/* Calculator */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
            <Calculator className="w-5 h-5 text-amber-400" /> Fuel Surcharge Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1 block`}>Trip Miles</label>
              <Input type="number" value={miles} onChange={(e: any) => setMiles(parseInt(e.target.value) || 0)}
                className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-700/30 border-slate-600/50 text-white"}`} />
            </div>
            <div>
              <label className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1 block`}>Average MPG</label>
              <Input type="number" step="0.1" value={mpg} onChange={(e: any) => setMpg(parseFloat(e.target.value) || 6)}
                className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-700/30 border-slate-600/50 text-white"}`} />
            </div>
            <div>
              <label className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1 block`}>DOE Index Method</label>
              <div className="h-10 flex items-center">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{calc?.method || "doe_index"}</Badge>
              </div>
            </div>
          </div>

          {calcQuery.isLoading ? <SectionSkeleton rows={2} /> : calc && (
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
              <div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Base Price</p>
                <p className="text-lg font-bold text-white">${calc.baseFuelPrice.toFixed(3)}</p>
              </div>
              <div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Current Price</p>
                <p className="text-lg font-bold text-amber-400">${calc.currentFuelPrice.toFixed(3)}</p>
              </div>
              <div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Surcharge/Mile</p>
                <p className="text-lg font-bold text-yellow-400">${calc.surchargePerMile.toFixed(4)}</p>
              </div>
              <div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Total Surcharge</p>
                <p className="text-2xl font-bold text-amber-400">${calc.totalSurcharge.toFixed(2)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Surcharge History */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
            <TrendingUp className="w-5 h-5 text-amber-400" /> Surcharge History (52 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? <SectionSkeleton rows={3} /> : (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-3 pr-4">Week</th>
                    <th className="pb-3 pr-4 text-right">DOE Price</th>
                    <th className="pb-3 text-right">Surcharge/Mile</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyQuery.data?.history || []).slice(-12).reverse().map((h: any) => (
                    <tr key={h.week} className={`border-b ${isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20"}`}>
                      <td className="py-2 pr-4 text-slate-300">{h.week}</td>
                      <td className="py-2 pr-4 text-right text-white">${h.doePrice.toFixed(3)}</td>
                      <td className="py-2 text-right text-amber-400">${h.surchargePerMile.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EfficiencyPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const rankQuery = trpc.fuelManagement.getFuelEfficiencyRanking.useQuery({});
  const tipsQuery = trpc.fuelManagement.getFuelEfficiencyTips.useQuery();
  const rankData = rankQuery.data;

  return (
    <div className="space-y-6">
      {/* Fleet Average */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>Fleet Average MPG</p>
              {rankQuery.isLoading ? <Skeleton className="h-10 w-16 mt-1" /> : (
                <p className="text-4xl font-bold text-amber-400">{rankData?.fleetAvgMpg || 0}</p>
              )}
            </div>
            <div className="p-4 rounded-full bg-amber-500/20">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rankings */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Award className="w-5 h-5 text-amber-400" /> Efficiency Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankQuery.isLoading ? <SectionSkeleton rows={5} /> :
              (rankData?.rankings || []).length === 0 ? <EmptyState icon={BarChart3} message="No ranking data" /> : (
                <div className="space-y-3">
                  {(rankData?.rankings || []).map((r: any) => (
                    <div key={r.id} className={`flex items-center gap-4 p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"} ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/50"} transition-colors`}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        r.rank === 1 ? "bg-amber-500 text-black" :
                        r.rank === 2 ? "bg-slate-400 text-black" :
                        r.rank === 3 ? "bg-amber-700 text-white" :
                        "bg-slate-600 text-white"
                      )}>#{r.rank}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{r.name}</p>
                        <div className={`flex items-center gap-3 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                          <span>{r.totalGallons} gal</span>
                          <span>${r.totalSpent.toLocaleString()}</span>
                          <span className={r.trend === "improving" ? "text-green-400" : "text-red-400"}>
                            {r.trend === "improving" ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                            {" "}{r.trend}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-400">{r.mpg}</p>
                        <p className="text-xs text-slate-500">MPG</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Zap className="w-5 h-5 text-yellow-400" /> Efficiency Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tipsQuery.isLoading ? <SectionSkeleton rows={5} /> : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {(tipsQuery.data?.tips || []).map((tip: any) => (
                  <div key={tip.id} className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{tip.title}</span>
                      <Badge className={cn("text-xs",
                        tip.priority === "high" ? "bg-red-500/20 text-red-400" :
                        tip.priority === "medium" ? "bg-amber-500/20 text-amber-400" :
                        "bg-slate-500/20 text-slate-400"
                      )}>{tip.priority}</Badge>
                    </div>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{tip.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} border-slate-600`}>{tip.category}</Badge>
                      <span className="text-xs text-amber-400">{tip.impact}</span>
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

function DefPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const defQuery = trpc.fuelManagement.getDefManagement.useQuery({});
  const def = defQuery.data;

  return (
    <div className="space-y-6">
      {/* DEF Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Droplets} label="Total Consumption" value={`${def?.fleetSummary?.totalConsumption || 0} gal`}
          color="bg-blue-500/20 text-blue-400" loading={defQuery.isLoading} />
        <KpiCard icon={Droplets} label="Avg Rate" value={`${def?.fleetSummary?.avgConsumptionRate || 0}%`}
          sub="of diesel" color="bg-cyan-500/20 text-cyan-400" loading={defQuery.isLoading} />
        <KpiCard icon={DollarSign} label="DEF Cost" value={`$${(def?.fleetSummary?.totalCost || 0).toLocaleString()}`}
          color="bg-amber-500/20 text-amber-400" loading={defQuery.isLoading} />
        <KpiCard icon={Package} label="Inventory" value={`${def?.inventory?.onHand || 0} gal`}
          color="bg-green-500/20 text-green-400" loading={defQuery.isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle DEF Levels */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Droplets className="w-5 h-5 text-blue-400" /> Vehicle DEF Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {defQuery.isLoading ? <SectionSkeleton rows={5} /> : (
              <div className="space-y-3">
                {(def?.vehicles || []).map((v: any) => (
                  <div key={v.vehicleId} className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{v.vehicleId}</span>
                      <Badge className={cn("text-xs",
                        v.status === "critical" ? "bg-red-500/20 text-red-400" :
                        v.status === "low" ? "bg-amber-500/20 text-amber-400" :
                        "bg-green-500/20 text-green-400"
                      )}>{v.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={v.defLevel}
                        className={cn("flex-1 h-2 bg-slate-700",
                          v.defLevel < 20 ? "[&>div]:bg-red-500" :
                          v.defLevel < 40 ? "[&>div]:bg-amber-500" :
                          "[&>div]:bg-blue-500"
                        )} />
                      <span className="text-sm font-medium text-white w-12 text-right">{v.defLevel}%</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Last refill: {v.lastRefill}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DEF Alerts + Inventory */}
        <div className="space-y-6">
          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                <AlertTriangle className="w-5 h-5 text-amber-400" /> DEF Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defQuery.isLoading ? <SectionSkeleton rows={2} /> : (
                <div className="space-y-3">
                  {(def?.alerts || []).map((a: any, idx: number) => (
                    <div key={idx} className={cn(
                      "p-3 rounded-xl border-l-4",
                      a.severity === "high" ? "bg-red-500/10 border-red-500" : "bg-amber-500/10 border-amber-500"
                    )}>
                      <p className="text-white text-sm font-medium">{a.vehicleId}</p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{a.message}</p>
                    </div>
                  ))}
                  {(def?.alerts || []).length === 0 && <p className="text-slate-500 text-center py-4">No DEF alerts</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                <Package className="w-5 h-5 text-green-400" /> DEF Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defQuery.isLoading ? <SectionSkeleton rows={2} /> : (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>On Hand</span>
                    <span className={`${isLight ? "text-slate-900" : "text-white"} font-bold`}>{def?.inventory?.onHand || 0} gal</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>Reorder Point</span>
                    <span className={`${isLight ? "text-slate-900" : "text-white"} font-bold`}>{def?.inventory?.reorderPoint || 0} gal</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>Supplier</span>
                    <span className="text-white">{def?.inventory?.supplier || "N/A"}</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                    <span className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm`}>Last Order</span>
                    <span className="text-white">{def?.inventory?.lastOrder || "N/A"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IdlingPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const idlingQuery = trpc.fuelManagement.getIdlingReport.useQuery({});
  const idling = idlingQuery.data;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock} label="Total Idling Hours" value={idling?.fleetSummary?.totalIdlingHours || 0}
          color="bg-amber-500/20 text-amber-400" loading={idlingQuery.isLoading} />
        <KpiCard icon={Fuel} label="Fuel Wasted" value={`${idling?.fleetSummary?.estimatedFuelWasted || 0} gal`}
          color="bg-red-500/20 text-red-400" loading={idlingQuery.isLoading} />
        <KpiCard icon={DollarSign} label="Cost Wasted" value={`$${(idling?.fleetSummary?.estimatedCostWasted || 0).toFixed(2)}`}
          color="bg-orange-500/20 text-orange-400" loading={idlingQuery.isLoading} />
        <KpiCard icon={BarChart3} label="Idling %" value={`${idling?.fleetSummary?.idlingPercentage || 0}%`}
          color="bg-yellow-500/20 text-yellow-400" loading={idlingQuery.isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Clock className="w-5 h-5 text-amber-400" /> Idling by Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {idlingQuery.isLoading ? <SectionSkeleton rows={5} /> : (
              <div className="space-y-3">
                {(idling?.byVehicle || []).map((v: any) => (
                  <div key={v.vehicleId} className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"} ${isLight ? "hover:bg-slate-100" : "hover:bg-slate-700/50"} transition-colors`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{v.driverName}</span>
                        <span className="text-slate-500 text-xs ml-2">{v.vehicleId}</span>
                      </div>
                      <Badge className={cn("text-xs",
                        v.status === "excessive" ? "bg-red-500/20 text-red-400" :
                        v.status === "acceptable" ? "bg-amber-500/20 text-amber-400" :
                        "bg-green-500/20 text-green-400"
                      )}>{v.status}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div><span className="text-slate-500">Hours</span><p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{v.idlingHours}</p></div>
                      <div><span className="text-slate-500">Fuel Wasted</span><p className="text-red-400 font-medium">{v.fuelWasted} gal</p></div>
                      <div><span className="text-slate-500">Cost</span><p className="text-amber-400 font-medium">${v.costWasted.toFixed(2)}</p></div>
                      <div><span className="text-slate-500">Idle %</span><p className={`${isLight ? "text-slate-900" : "text-white"} font-medium`}>{v.pctIdle}%</p></div>
                    </div>
                    <Progress value={v.pctIdle}
                      className={cn("mt-2 h-1.5 bg-slate-700",
                        v.pctIdle > 20 ? "[&>div]:bg-red-500" :
                        v.pctIdle > 10 ? "[&>div]:bg-amber-500" :
                        "[&>div]:bg-green-500"
                      )} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Zap className="w-5 h-5 text-yellow-400" /> Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {idlingQuery.isLoading ? <SectionSkeleton rows={3} /> : (
              <div className="space-y-3">
                {(idling?.recommendations || []).map((r: string, idx: number) => (
                  <div key={idx} className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"} border-l-4 border-amber-500`}>
                    <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{r}</p>
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

function TheftDetectionPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const theftQuery = trpc.fuelManagement.getFuelTheftDetection.useQuery({});
  const theft = theftQuery.data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Shield} label="Total Alerts" value={theft?.summary?.total || 0}
          color="bg-red-500/20 text-red-400" loading={theftQuery.isLoading} />
        <KpiCard icon={AlertTriangle} label="High Severity" value={theft?.summary?.high || 0}
          color="bg-red-600/20 text-red-500" loading={theftQuery.isLoading} />
        <KpiCard icon={Eye} label="Medium Severity" value={theft?.summary?.medium || 0}
          color="bg-amber-500/20 text-amber-400" loading={theftQuery.isLoading} />
        <KpiCard icon={DollarSign} label="Est. Loss" value={`$${(theft?.summary?.estimatedLoss || 0).toLocaleString()}`}
          color="bg-orange-500/20 text-orange-400" loading={theftQuery.isLoading} />
      </div>

      {/* Alerts List */}
      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
            <Shield className="w-5 h-5 text-red-400" /> Fuel Anomaly Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {theftQuery.isLoading ? <SectionSkeleton rows={5} /> :
            (theft?.alerts || []).length === 0 ? <EmptyState icon={Shield} message="No theft alerts detected" /> : (
              <div className="space-y-3">
                {(theft?.alerts || []).map((a: any) => (
                  <div key={a.id} className={cn(
                    "p-4 rounded-xl border-l-4",
                    a.severity === "high" ? "bg-red-500/10 border-red-500" :
                    a.severity === "medium" ? "bg-amber-500/10 border-amber-500" :
                    "bg-slate-700/30 border-slate-500"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={cn("w-5 h-5",
                          a.severity === "high" ? "text-red-400" : "text-amber-400"
                        )} />
                        <div>
                          <p className="text-white font-medium capitalize">{a.type.replace(/_/g, " ")}</p>
                          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{a.stationName} - {a.date ? new Date(a.date).toLocaleDateString() : ""}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs",
                        a.severity === "high" ? "bg-red-500/20 text-red-400" :
                        a.severity === "medium" ? "bg-amber-500/20 text-amber-400" :
                        "bg-slate-500/20 text-slate-400"
                      )}>{a.severity}</Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{a.description}</p>
                    <div className={`flex items-center justify-between text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      <div className="flex items-center gap-4">
                        <span>Vehicle: V-{a.vehicleId}</span>
                        <span>{a.gallons} gallons</span>
                        <span>${a.amount.toFixed(2)}</span>
                      </div>
                      <span className="text-red-400 font-medium">Est. Loss: ${a.estimatedLoss.toFixed(2)}</span>
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

function EmissionsPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const emQuery = trpc.fuelManagement.getEmissionsFromFuel.useQuery({});
  const em = emQuery.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Leaf} label="Total CO2" value={`${(em?.totalCO2tons || 0).toFixed(1)} tons`}
          color="bg-green-500/20 text-green-400" loading={emQuery.isLoading} />
        <KpiCard icon={Leaf} label="CO2 per Mile" value={`${em?.co2PerMile || 0} kg`}
          color="bg-emerald-500/20 text-emerald-400" loading={emQuery.isLoading} />
        <KpiCard icon={Leaf} label="Trees Needed" value={(em?.equivalents?.treesNeeded || 0).toLocaleString()}
          sub="to offset" color="bg-teal-500/20 text-teal-400" loading={emQuery.isLoading} />
        <KpiCard icon={Leaf} label="Home Equivalent" value={em?.equivalents?.homesEquivalent || 0}
          sub="annual homes" color="bg-lime-500/20 text-lime-400" loading={emQuery.isLoading} />
      </div>

      <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
            <Leaf className="w-5 h-5 text-green-400" /> Monthly CO2 Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emQuery.isLoading ? <SectionSkeleton rows={3} /> : (
            <div className="space-y-3">
              {(em?.monthlyTrend || []).map((m: any) => (
                <div key={m.month} className={`flex items-center justify-between p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                  <span className="text-slate-300 text-sm w-12">{m.month}</span>
                  <div className="flex-1 mx-4">
                    <div className={`h-2 ${isLight ? "bg-slate-200" : "bg-slate-700"} rounded-full overflow-hidden`}>
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, (m.co2Tons / Math.max(0.1, ...(em?.monthlyTrend || []).map((x: any) => x.co2Tons))) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-400 w-24 text-right">{m.co2Tons.toFixed(1)} tons</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function FuelManagement() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className={`p-4 md:p-6 space-y-6 ${isLight ? "bg-slate-50 text-slate-900" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Fuel Management Center
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            Comprehensive fuel operations, IFTA compliance, and cost optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/bulk-upload?type=vehicles")} className="gap-1.5">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Fuel className="w-8 h-8 text-amber-400" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/80 border-slate-700/50"} flex-wrap h-auto p-1.5 gap-1`}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="prices" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <DollarSign className="w-4 h-4 mr-1.5" /> Prices
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Receipt className="w-4 h-4 mr-1.5" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <CreditCard className="w-4 h-4 mr-1.5" /> Cards
          </TabsTrigger>
          <TabsTrigger value="ifta" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <FileText className="w-4 h-4 mr-1.5" /> IFTA
          </TabsTrigger>
          <TabsTrigger value="surcharge" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Calculator className="w-4 h-4 mr-1.5" /> Surcharge
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Award className="w-4 h-4 mr-1.5" /> Efficiency
          </TabsTrigger>
          <TabsTrigger value="def" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Droplets className="w-4 h-4 mr-1.5" /> DEF
          </TabsTrigger>
          <TabsTrigger value="idling" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Clock className="w-4 h-4 mr-1.5" /> Idling
          </TabsTrigger>
          <TabsTrigger value="theft" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Shield className="w-4 h-4 mr-1.5" /> Theft
          </TabsTrigger>
          <TabsTrigger value="emissions" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Leaf className="w-4 h-4 mr-1.5" /> Emissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardPanel /></TabsContent>
        <TabsContent value="prices"><FuelPricesPanel /></TabsContent>
        <TabsContent value="transactions"><TransactionsPanel /></TabsContent>
        <TabsContent value="cards"><FuelCardsPanel /></TabsContent>
        <TabsContent value="ifta"><IftaPanel /></TabsContent>
        <TabsContent value="surcharge"><SurchargePanel /></TabsContent>
        <TabsContent value="efficiency"><EfficiencyPanel /></TabsContent>
        <TabsContent value="def"><DefPanel /></TabsContent>
        <TabsContent value="idling"><IdlingPanel /></TabsContent>
        <TabsContent value="theft"><TheftDetectionPanel /></TabsContent>
        <TabsContent value="emissions"><EmissionsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
