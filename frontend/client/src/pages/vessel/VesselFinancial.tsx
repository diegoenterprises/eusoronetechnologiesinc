/**
 * VESSEL FINANCIAL — V5 Multi-Modal
 * Maritime billing & financial: Freight rates, invoices, demurrage,
 * and detention charges
 */

import React, { useState } from "react";
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
};

export default function VesselFinancial() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("rates");
  const finQuery = (trpc as any).vesselShipments.getVesselFinancialSummary.useQuery();
  const settlementsData: any[] = finQuery.data?.settlements || [];
  const demurrageData: any[] = finQuery.data?.demurrage || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

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
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Demurrage Accruing", value: "$0" },
          { icon: <CheckCircle className="w-5 h-5" />, label: "Collected (MTD)", value: "$0" },
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
            <CardHeader><CardTitle className={text}>Freight Rates</CardTitle></CardHeader>
            <CardContent>
              {settlementsData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No freight rate records yet</p>
                  <p className="text-sm">Data will appear as vessel operations begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlementsData.map((s: any, i: number) => (
                    <div key={s.id || i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>Settlement #{s.id}</span>
                        <p className={cn("text-xs", muted)}>Status: {s.status || "pending"}</p>
                      </div>
                      <span className={cn("font-bold", text)}>${parseFloat(s.loadRate || 0).toLocaleString()}</span>
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
              {demurrageData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No demurrage records yet</p>
                  <p className="text-sm">Data will appear as vessel operations begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {demurrageData.map((d: any, i: number) => (
                    <div key={d.id || i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>Demurrage #{d.id}</span>
                        <p className={cn("text-xs", muted)}>{d.chargeType || "demurrage"} • {d.chargeableDays || 0} days</p>
                      </div>
                      <span className={cn("font-bold", text)}>${parseFloat(d.totalCharge || 0).toLocaleString()}</span>
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
