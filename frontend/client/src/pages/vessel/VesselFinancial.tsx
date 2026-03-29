/**
 * VESSEL FINANCIAL — V5 Multi-Modal
 * Maritime billing & financial: Freight rates, invoices, demurrage,
 * and detention charges
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign,
  Anchor,
  FileText,
  Clock,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";



const STATUS_MAP: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  expiring_soon: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  paid: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  overdue: "bg-red-500/20 text-red-400",
  accruing: "bg-orange-500/20 text-orange-400",
  within_free: "bg-blue-500/20 text-blue-400",
  billed: "bg-purple-500/20 text-purple-400",
  settled: "bg-green-500/20 text-green-400",
  in_progress: "bg-blue-500/20 text-blue-400",
};

export default function VesselFinancial() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("rates");
  const finQuery = (trpc as any).vesselShipments.getVesselFinancialSummary.useQuery();
  const settlementsData: any[] = finQuery.data?.settlements || [];
  const demurrageData: any[] = finQuery.data?.demurrage || [];

  // Compute real KPI values from query data
  const kpis = useMemo(() => {
    const demurrageAccruing = demurrageData
      .filter((d: any) => d.status === "accruing" || d.status === "pending")
      .reduce((sum: number, d: any) => sum + parseFloat(d.totalCharge || d.amount || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const collectedMTD = settlementsData
      .filter((s: any) => {
        const settled = s.settledAt || s.paidDate || s.updatedAt;
        if (!settled) return false;
        return new Date(settled) >= monthStart && (s.status === "settled" || s.status === "paid");
      })
      .reduce((sum: number, s: any) => sum + parseFloat(s.loadRate || s.amount || s.totalAmount || 0), 0);

    return { demurrageAccruing, collectedMTD };
  }, [settlementsData, demurrageData]);

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  const fmtCurrency = (val: number) => val > 0 ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "$0";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-teal-100 to-cyan-100" : "bg-gradient-to-br from-teal-500/20 to-cyan-500/20")}>
          <DollarSign className="w-7 h-7 text-teal-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", text)}>Maritime Financial</h1>
          <p className={cn("text-sm", muted)}>Freight rates, invoices & demurrage tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <TrendingUp className="w-5 h-5" />, label: "Settlements", value: settlementsData.length },
          { icon: <Receipt className="w-5 h-5" />, label: "Demurrage Records", value: demurrageData.length },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Demurrage Accruing", value: fmtCurrency(kpis.demurrageAccruing) },
          { icon: <CheckCircle className="w-5 h-5" />, label: "Collected (MTD)", value: fmtCurrency(kpis.collectedMTD) },
        ].map((kpi) => (
          <Card key={kpi.label} className={cn("border", cardBg)}>
            <CardContent className="p-4">
              <div className={cn("p-2 rounded-lg w-fit mb-2", isLight ? "bg-slate-100" : "bg-slate-700/50")}>{kpi.icon}</div>
              <div className={cn("text-xl font-bold", text)}>{kpi.value}</div>
              <div className={cn("text-xs", muted)}>{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="demurrage">Demurrage</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Freight Rates & Settlements</CardTitle></CardHeader>
            <CardContent>
              {finQuery.isLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                  <p className="text-lg font-medium">Loading settlements...</p>
                </div>
              ) : settlementsData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No freight rate records yet</p>
                  <p className="text-sm">Data will appear as vessel operations begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlementsData.map((s: any, i: number) => (
                    <div key={s.id || i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>Settlement #{s.id}</span>
                        <p className={cn("text-xs", muted)}>
                          Status: <Badge className={cn("text-xs ml-1", STATUS_MAP[s.status] || STATUS_MAP.pending)}>{s.status || "pending"}</Badge>
                        </p>
                      </div>
                      <span className={cn("font-bold text-lg", text)}>${parseFloat(s.loadRate || s.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No invoices yet</p>
                <p className="text-sm">Data will appear as vessel operations begin.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demurrage">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Demurrage & Detention</CardTitle></CardHeader>
            <CardContent>
              {finQuery.isLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                  <p className="text-lg font-medium">Loading demurrage records...</p>
                </div>
              ) : demurrageData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No demurrage records yet</p>
                  <p className="text-sm">Data will appear as vessel operations begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {demurrageData.map((d: any, i: number) => (
                    <div key={d.id || i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>Demurrage #{d.id}</span>
                        <p className={cn("text-xs", muted)}>
                          {d.chargeType || "demurrage"} — {d.chargeableDays || 0} chargeable days
                          {d.freeTimeDays ? ` (${d.freeTimeDays} free)` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn("font-bold text-lg", text)}>${parseFloat(d.totalCharge || d.amount || 0).toLocaleString()}</span>
                        <div>
                          <Badge className={cn("text-xs", STATUS_MAP[d.status] || STATUS_MAP.pending)}>
                            {d.status || "pending"}
                          </Badge>
                        </div>
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
