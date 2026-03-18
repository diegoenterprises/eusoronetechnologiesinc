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

const MOCK_RATE_QUOTES = [
  { id: "RQ-4001", origin: "Chicago IL", destination: "St Louis MO", commodity: "Grain", rate: 3250, status: "active", validUntil: "2026-04-15" },
  { id: "RQ-4002", origin: "Houston TX", destination: "Memphis TN", commodity: "Chemicals", rate: 4800, status: "pending", validUntil: "2026-04-01" },
  { id: "RQ-4003", origin: "Kansas City MO", destination: "Denver CO", commodity: "Auto Parts", rate: 2900, status: "expired", validUntil: "2026-03-10" },
];

const MOCK_SETTLEMENTS = [
  { id: "STL-7001", shipment: "RSH-3001", carrier: "BNSF Railway", amount: 12500, status: "paid", date: "2026-03-10" },
  { id: "STL-7002", shipment: "RSH-3005", carrier: "Union Pacific", amount: 8900, status: "pending", date: "2026-03-14" },
  { id: "STL-7003", shipment: "RSH-3008", carrier: "CSX Transport", amount: 15200, status: "disputed", date: "2026-03-12" },
];

const MOCK_DEMURRAGE = [
  { id: "DEM-201", car: "BNSF 442718", location: "Chicago Yard", daysHeld: 4, dailyRate: 75, total: 300, status: "accruing" },
  { id: "DEM-202", car: "UP 519203", location: "Houston Terminal", daysHeld: 2, dailyRate: 75, total: 150, status: "accruing" },
  { id: "DEM-203", car: "CSX 338901", location: "Memphis Yard", daysHeld: 6, dailyRate: 75, total: 450, status: "billed" },
];

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
          { icon: <Calculator className="w-5 h-5" />, label: "Active Quotes", value: "12", accent: "blue" },
          { icon: <CheckCircle className="w-5 h-5" />, label: "Settled This Month", value: "$84,200", accent: "emerald" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Demurrage Accruing", value: "$1,950", accent: "amber" },
          { icon: <Receipt className="w-5 h-5" />, label: "Open Invoices", value: "8", accent: "purple" },
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
              <div className="space-y-3">
                {MOCK_RATE_QUOTES.map((q) => (
                  <div key={q.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono text-sm font-semibold", text)}>{q.id}</span>
                      <p className={cn("text-xs", muted)}>{q.origin} → {q.destination} • {q.commodity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", text)}>${q.rate.toLocaleString()}</span>
                      <Badge className={STATUS_BADGE[q.status]}>{q.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Settlements</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_SETTLEMENTS.map((s) => (
                  <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono text-sm font-semibold", text)}>{s.id}</span>
                      <p className={cn("text-xs", muted)}>{s.carrier} • Shipment {s.shipment}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", text)}>${s.amount.toLocaleString()}</span>
                      <Badge className={STATUS_BADGE[s.status]}>{s.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demurrage">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Demurrage Charges</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_DEMURRAGE.map((d) => (
                  <div key={d.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono text-sm font-semibold", text)}>{d.car}</span>
                      <p className={cn("text-xs", muted)}>{d.location} • {d.daysHeld} days @ ${d.dailyRate}/day</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", text)}>${d.total}</span>
                      <Badge className={STATUS_BADGE[d.status]}>{d.status}</Badge>
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
