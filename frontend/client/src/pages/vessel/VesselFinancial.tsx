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
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MOCK_FREIGHT_RATES = [
  { id: "FR-901", route: "Shanghai → Long Beach", type: "20ft Dry", rate: 2850, currency: "USD", validUntil: "2026-04-30", status: "active" },
  { id: "FR-902", route: "Rotterdam → New York", type: "40ft HC", rate: 4200, currency: "USD", validUntil: "2026-05-15", status: "active" },
  { id: "FR-903", route: "Singapore → Los Angeles", type: "40ft Reefer", rate: 5600, currency: "USD", validUntil: "2026-03-20", status: "expiring_soon" },
  { id: "FR-904", route: "Hamburg → Savannah", type: "20ft Dry", rate: 2100, currency: "USD", validUntil: "2026-06-01", status: "active" },
];

const MOCK_INVOICES = [
  { id: "INV-3001", booking: "VB-2001", customer: "Pacific Trade Co", amount: 28500, status: "paid", date: "2026-03-08" },
  { id: "INV-3002", booking: "VB-2005", customer: "Atlantic Imports LLC", amount: 42000, status: "pending", date: "2026-03-12" },
  { id: "INV-3003", booking: "VB-2009", customer: "Global Freight Inc", amount: 15800, status: "overdue", date: "2026-02-25" },
];

const MOCK_DEMURRAGE = [
  { id: "DEM-V01", container: "MSCU 4421987", port: "Long Beach", daysFree: 5, daysUsed: 8, dailyRate: 150, total: 450, status: "accruing" },
  { id: "DEM-V02", container: "CMAU 7719234", port: "New York/NJ", daysFree: 4, daysUsed: 4, dailyRate: 175, total: 0, status: "within_free" },
  { id: "DEM-V03", container: "HLCU 2203891", port: "Savannah", daysFree: 5, daysUsed: 10, dailyRate: 150, total: 750, status: "billed" },
];

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
          { icon: <TrendingUp className="w-5 h-5" />, label: "Active Rates", value: "3" },
          { icon: <Receipt className="w-5 h-5" />, label: "Open Invoices", value: "$57,800" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Demurrage Accruing", value: "$1,200" },
          { icon: <CheckCircle className="w-5 h-5" />, label: "Collected (MTD)", value: "$128,400" },
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
              <div className="space-y-3">
                {MOCK_FREIGHT_RATES.map((r) => (
                  <div key={r.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono text-sm font-semibold", text)}>{r.id}</span>
                      <p className={cn("text-xs", muted)}>{r.route} • {r.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", text)}>${r.rate.toLocaleString()}</span>
                      <Badge className={STATUS_MAP[r.status]}>{r.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_INVOICES.map((inv) => (
                  <div key={inv.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono text-sm font-semibold", text)}>{inv.id}</span>
                      <p className={cn("text-xs", muted)}>{inv.customer} • Booking {inv.booking} • {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", text)}>${inv.amount.toLocaleString()}</span>
                      <Badge className={STATUS_MAP[inv.status]}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demurrage">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Demurrage & Detention</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_DEMURRAGE.map((d) => (
                  <div key={d.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono text-sm font-semibold", text)}>{d.container}</span>
                      <p className={cn("text-xs", muted)}>{d.port} • {d.daysUsed}/{d.daysFree} free days used • ${d.dailyRate}/day</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", text)}>${d.total.toLocaleString()}</span>
                      <Badge className={STATUS_MAP[d.status]}>{d.status.replace("_", " ")}</Badge>
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
