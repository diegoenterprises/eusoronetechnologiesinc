/**
 * RAIL SAFETY — V5 Multi-Modal
 * Rail safety & incidents dashboard: safety metrics, incident log,
 * inspection status, and FRA compliance
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  FileText,
  Eye,
  Flame,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MOCK_INCIDENTS = [
  { id: "INC-501", date: "2026-03-12", type: "Derailment", severity: "minor", location: "MP 142.3 Chicago Sub", status: "under_review", description: "Low-speed derailment at switch — no injuries" },
  { id: "INC-502", date: "2026-02-28", type: "Near Miss", severity: "moderate", location: "Grade Crossing #4421", status: "closed", description: "Vehicle violated grade crossing signal" },
  { id: "INC-503", date: "2026-02-15", type: "Equipment Failure", severity: "minor", location: "Houston Yard Track 7", status: "closed", description: "Coupler knuckle failure during switching" },
];

const MOCK_INSPECTIONS = [
  { id: "INS-801", type: "Track Inspection", area: "Chicago Subdivision", date: "2026-03-15", result: "pass", inspector: "J. Rodriguez", defects: 0 },
  { id: "INS-802", type: "Railcar Inspection", area: "Memphis Yard", date: "2026-03-14", result: "conditional", inspector: "K. Nguyen", defects: 2 },
  { id: "INS-803", type: "Signal System", area: "KC to Denver Line", date: "2026-03-10", result: "pass", inspector: "L. Anderson", defects: 0 },
  { id: "INS-804", type: "Bridge Inspection", area: "Mississippi River Bridge", date: "2026-03-08", result: "pass", inspector: "M. Thompson", defects: 0 },
];

const SEVERITY_MAP: Record<string, string> = {
  minor: "bg-yellow-500/20 text-yellow-400",
  moderate: "bg-orange-500/20 text-orange-400",
  major: "bg-red-500/20 text-red-400",
  critical: "bg-red-600/20 text-red-300",
};

const RESULT_MAP: Record<string, string> = {
  pass: "bg-green-500/20 text-green-400",
  conditional: "bg-yellow-500/20 text-yellow-400",
  fail: "bg-red-500/20 text-red-400",
};

const STATUS_MAP: Record<string, string> = {
  under_review: "bg-blue-500/20 text-blue-400",
  closed: "bg-slate-500/20 text-slate-400",
  open: "bg-red-500/20 text-red-400",
};

export default function RailSafety() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("overview");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-red-100 to-orange-100" : "bg-gradient-to-br from-red-500/20 to-orange-500/20")}>
          <Shield className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", text)}>Rail Safety & Incidents</h1>
          <p className={cn("text-sm", muted)}>FRA safety metrics, incident tracking & inspections</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <CheckCircle className="w-5 h-5" />, label: "Days Without Incident", value: "5", color: "text-emerald-400" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Open Incidents", value: "1", color: "text-yellow-400" },
          { icon: <Eye className="w-5 h-5" />, label: "Inspections This Month", value: "4", color: "text-blue-400" },
          { icon: <Activity className="w-5 h-5" />, label: "Safety Score", value: "94%", color: "text-emerald-400" },
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className={cn("border", cardBg)}>
              <CardHeader><CardTitle className={text}>Safety Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Total Incidents (YTD)", value: "3", trend: "down" },
                    { label: "Inspections Passed", value: "12/13", trend: "stable" },
                    { label: "FRA Compliance Rate", value: "98.2%", trend: "up" },
                    { label: "Reportable Accidents", value: "0", trend: "stable" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className={cn("text-sm", muted)}>{item.label}</span>
                      <span className={cn("font-bold", text)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className={cn("border", cardBg)}>
              <CardHeader><CardTitle className={text}>Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_INCIDENTS.slice(0, 2).map((inc) => (
                    <div key={inc.id} className={cn("p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div className="flex items-center justify-between">
                        <span className={cn("font-mono text-sm", text)}>{inc.id}</span>
                        <Badge className={SEVERITY_MAP[inc.severity]}>{inc.severity}</Badge>
                      </div>
                      <p className={cn("text-xs mt-1", muted)}>{inc.type} — {inc.location}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Incident Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_INCIDENTS.map((inc) => (
                  <div key={inc.id} className={cn("p-4 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono font-semibold", text)}>{inc.id}</span>
                        <Badge className={SEVERITY_MAP[inc.severity]}>{inc.severity}</Badge>
                        <Badge className={STATUS_MAP[inc.status]}>{inc.status.replace("_", " ")}</Badge>
                      </div>
                      <span className={cn("text-xs", muted)}>{inc.date}</span>
                    </div>
                    <p className={cn("text-sm", text)}>{inc.description}</p>
                    <p className={cn("text-xs mt-1", muted)}>{inc.type} • {inc.location}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Inspection Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_INSPECTIONS.map((ins) => (
                  <div key={ins.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-semibold text-sm", text)}>{ins.type}</span>
                      <p className={cn("text-xs", muted)}>{ins.area} • {ins.date} • Inspector: {ins.inspector}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ins.defects > 0 && <span className={cn("text-xs", muted)}>{ins.defects} defects</span>}
                      <Badge className={RESULT_MAP[ins.result]}>{ins.result}</Badge>
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
