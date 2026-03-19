/**
 * RAIL FINANCIAL — V5 Multi-Modal
 * Rail billing & financial management: Rate Quotes, Settlements,
 * Demurrage charges, and Invoice tracking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  Receipt,
  Calculator,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  paid: "bg-green-500/20 text-green-400",
  disputed: "bg-orange-500/20 text-orange-400",
  accruing: "bg-blue-500/20 text-blue-400",
  billed: "bg-purple-500/20 text-purple-400",
};

export default function RailFinancial() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("rates");
  const finQuery = (trpc as any).railShipments.getRailFinancialSummary.useQuery();
  const stlData: any[] = finQuery.data?.settlements || [];
  const demData: any[] = finQuery.data?.demurrage || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-green-100 to-emerald-100" : "bg-gradient-to-br from-green-500/20 to-emerald-500/20")}>
          <DollarSign className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", text)}>Rail Financial</h1>
          <p className={cn("text-sm", muted)}>Rate quotes, settlements, demurrage & invoices</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Calculator className="w-5 h-5" />, label: "Settlements", value: String(stlData.length), accent: "blue" },
          { icon: <CheckCircle className="w-5 h-5" />, label: "Settled", value: String(stlData.filter((s: any) => s.status === "paid" || s.status === "settled").length), accent: "emerald" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Demurrage Records", value: String(demData.length), accent: "amber" },
          { icon: <Receipt className="w-5 h-5" />, label: "Pending", value: String(stlData.filter((s: any) => s.status === "pending").length), accent: "purple" },
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
          <TabsTrigger value="rates">Rate Quotes</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="demurrage">Demurrage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Rate Quotes</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-center py-12", muted)}>
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">No rate quotes yet</p>
                <p className="text-sm mt-1">Rate quotes will appear here once rail shipments are created.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Settlements</CardTitle></CardHeader>
            <CardContent>
              {stlData.length === 0 ? (
                <div className={cn("text-center py-12", muted)}>
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No settlements yet</p>
                  <p className="text-sm mt-1">Settlements will appear here as rail shipments are invoiced.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stlData.map((s: any) => (
                    <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>STL-{s.id}</span>
                        <p className={cn("text-xs", muted)}>Shipment #{s.shipmentId || s.loadId || "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", text)}>${Number(s.amount || 0).toLocaleString()}</span>
                        <Badge className={STATUS_BADGE[s.status] || "bg-slate-500/20 text-slate-400"}>{s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demurrage">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Demurrage Charges</CardTitle></CardHeader>
            <CardContent>
              {demData.length === 0 ? (
                <div className={cn("text-center py-12", muted)}>
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No demurrage charges</p>
                  <p className="text-sm mt-1">Demurrage will be tracked here when railcars exceed free time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {demData.map((d: any) => (
                    <div key={d.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>DEM-{d.id}</span>
                        <p className={cn("text-xs", muted)}>Railcar #{d.railcarId || "—"} • ${Number(d.dailyRate || 75)}/day</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", text)}>${Number(d.totalCharge || d.amount || 0).toLocaleString()}</span>
                        <Badge className={STATUS_BADGE[d.status] || "bg-blue-500/20 text-blue-400"}>{d.status || "accruing"}</Badge>
                      </div>
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
              <div className={cn("text-center py-12", muted)}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">No open invoices</p>
                <p className="text-sm mt-1">Rail invoices will appear here once generated from settlements</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
