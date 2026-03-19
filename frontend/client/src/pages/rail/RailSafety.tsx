/**
 * RAIL SAFETY — V5 Multi-Modal
 * Rail safety & incidents dashboard: safety metrics, incident log,
 * inspection status, and FRA compliance
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
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
  const complianceQuery = (trpc as any).railShipments.getRailCompliance.useQuery();
  const inspections: any[] = complianceQuery.data?.inspections || [];
  const hazmatPermits: any[] = complianceQuery.data?.hazmatPermits || [];

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
          { icon: <CheckCircle className="w-5 h-5" />, label: "Inspections", value: String(inspections.length), color: "text-emerald-400" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Failed Inspections", value: String(inspections.filter((i: any) => i.result === "fail").length), color: "text-yellow-400" },
          { icon: <Eye className="w-5 h-5" />, label: "Passed", value: String(inspections.filter((i: any) => i.result === "pass").length), color: "text-blue-400" },
          { icon: <Activity className="w-5 h-5" />, label: "Hazmat Permits", value: String(hazmatPermits.length), color: "text-emerald-400" },
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
                    { label: "Total Inspections", value: String(inspections.length) },
                    { label: "Inspections Passed", value: `${inspections.filter((i: any) => i.result === "pass").length}/${inspections.length}` },
                    { label: "Hazmat Permits Active", value: String(hazmatPermits.length) },
                    { label: "Failed Inspections", value: String(inspections.filter((i: any) => i.result === "fail").length) },
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
                {inspections.length === 0 ? (
                  <div className={cn("text-center py-8", muted)}>
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspections.slice(0, 3).map((ins: any) => (
                      <div key={ins.id} className={cn("p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                        <div className="flex items-center justify-between">
                          <span className={cn("font-mono text-sm", text)}>INS-{ins.id}</span>
                          <Badge className={RESULT_MAP[ins.result] || "bg-slate-500/20 text-slate-400"}>{ins.result || "pending"}</Badge>
                        </div>
                        <p className={cn("text-xs mt-1", muted)}>{ins.inspectionType || "Inspection"} — Railcar #{ins.railcarId || "—"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Incident Log</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-center py-12", muted)}>
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">No incidents recorded</p>
                <p className="text-sm mt-1">Incidents will appear here when reported.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Inspection Records</CardTitle></CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className={cn("text-center py-12", muted)}>
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No inspection records yet</p>
                  <p className="text-sm mt-1">Inspections will appear here as they are completed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.map((ins: any) => (
                    <div key={ins.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-semibold text-sm", text)}>{ins.inspectionType || "Inspection"}</span>
                        <p className={cn("text-xs", muted)}>Railcar #{ins.railcarId || "—"} • {ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString() : "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={RESULT_MAP[ins.result] || "bg-slate-500/20 text-slate-400"}>{ins.result || "pending"}</Badge>
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
