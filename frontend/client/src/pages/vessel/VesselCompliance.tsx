/**
 * VESSEL COMPLIANCE — V5 Multi-Modal
 * Maritime compliance dashboard: live data from tRPC + static regulation reference
 * ISM Code, ISPS Code, SOLAS certs, MARPOL compliance, crew certs (STCW), PSC inspection records
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Award,
  Anchor,
  Leaf,
  Users,
  ClipboardCheck,
  Ship,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// Static regulation reference for MARPOL
const MARPOL_COMPLIANCE = [
  { annex: "Annex I", title: "Oil Pollution Prevention" },
  { annex: "Annex II", title: "Noxious Liquid Substances" },
  { annex: "Annex III", title: "Harmful Substances in Packaged Form" },
  { annex: "Annex IV", title: "Sewage Pollution" },
  { annex: "Annex V", title: "Garbage Pollution" },
  { annex: "Annex VI", title: "Air Pollution (SOx/NOx/GHG)" },
];

function statusBadge(status: string) {
  if (status === "compliant" || status === "valid" || status === "clear" || status === "pass") return "bg-emerald-500/20 text-emerald-400";
  if (status === "warning" || status === "expiring_soon" || status === "minor_deficiency") return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "compliant" || status === "valid" || status === "clear" || status === "pass") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warning" || status === "expiring_soon") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

export default function VesselCompliance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("overview");

  // Live data from tRPC
  const complianceQuery = trpc.vesselShipments.getVesselCompliance.useQuery({});

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  const inspections: any[] = complianceQuery.data?.inspections || [];
  const ispsRecords: any[] = complianceQuery.data?.ispsRecords || [];
  const insurance: any[] = complianceQuery.data?.insurance || [];
  const complianceStatus = complianceQuery.data?.status || "unknown";
  const totalInspections = complianceQuery.data?.totalInspections || 0;
  const failedCount = complianceQuery.data?.failedCount || 0;

  const passRate = totalInspections > 0 ? Math.round(((totalInspections - failedCount) / totalInspections) * 100) : 0;

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/10"><Shield className="w-6 h-6 text-emerald-400" /></div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Vessel Compliance</h1>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>IMO maritime regulatory compliance</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Shield className="w-5 h-5 text-emerald-400" />, label: "Compliance Status", value: complianceQuery.isLoading ? null : complianceStatus, color: "bg-emerald-500" },
          { icon: <Anchor className="w-5 h-5 text-blue-400" />, label: "ISPS Records", value: complianceQuery.isLoading ? null : ispsRecords.length, color: "bg-blue-500" },
          { icon: <Award className="w-5 h-5 text-amber-400" />, label: "Inspection Pass Rate", value: complianceQuery.isLoading ? null : `${passRate}%`, color: "bg-amber-500" },
          { icon: <ClipboardCheck className="w-5 h-5 text-cyan-400" />, label: "Insurance Policies", value: complianceQuery.isLoading ? null : insurance.length, color: "bg-cyan-500" },
        ].map((kpi, i) => (
          <div key={i} className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
            <div className={cn("p-2 rounded-lg w-fit mb-2", `${kpi.color}/10`)}>{kpi.icon}</div>
            <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
              {kpi.value === null ? <Skeleton className="h-8 w-16" /> : kpi.value}
            </div>
            <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><Shield className="w-3.5 h-3.5 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="inspections"><ClipboardCheck className="w-3.5 h-3.5 mr-1" />Inspections</TabsTrigger>
          <TabsTrigger value="isps"><Anchor className="w-3.5 h-3.5 mr-1" />ISPS</TabsTrigger>
          <TabsTrigger value="marpol"><Leaf className="w-3.5 h-3.5 mr-1" />MARPOL</TabsTrigger>
          <TabsTrigger value="insurance"><Ship className="w-3.5 h-3.5 mr-1" />Insurance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={cardBg}>
              <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Shield className="w-4 h-4 text-emerald-400" /> Compliance Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  ["Status", complianceStatus],
                  ["Total Inspections", totalInspections],
                  ["Failed Inspections", failedCount],
                  ["Pass Rate", `${passRate}%`],
                  ["ISPS Records", ispsRecords.length],
                  ["Insurance Policies", insurance.length],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span>
                    <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{complianceQuery.isLoading ? <Skeleton className="h-4 w-12 inline-block" /> : v}</span>
                  </div>
                ))}
                <Progress value={passRate} className="h-2 mt-2 [&>div]:bg-emerald-500" />
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Leaf className="w-4 h-4 text-green-400" /> MARPOL Reference</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {MARPOL_COMPLIANCE.map((m, i) => (
                  <div key={i} className="flex justify-between">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{m.annex}</span>
                    <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{m.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inspections Tab -- live from DB */}
        <TabsContent value="inspections">
          <div className="space-y-3">
            {complianceQuery.isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : inspections.length === 0 ? (
              <Card className={cardBg}>
                <CardContent className="p-8 text-center">
                  <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>No inspection records found</p>
                </CardContent>
              </Card>
            ) : (
              inspections.map((insp: any) => (
                <Card key={insp.id} className={cardBg}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={insp.result || "unknown"} />
                        <div>
                          <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>
                            {insp.inspectionType || insp.type || "Inspection"}
                          </div>
                          <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                            {insp.authority || insp.inspector || "Authority"} — {insp.inspectionDate ? new Date(insp.inspectionDate).toLocaleDateString() : "N/A"}
                            {insp.deficiencies ? ` — ${insp.deficiencies} deficiencies` : ""}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusBadge(insp.result || "unknown")}>
                        {insp.result || "pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ISPS Tab -- live from DB */}
        <TabsContent value="isps">
          <div className="space-y-3">
            {complianceQuery.isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : ispsRecords.length === 0 ? (
              <Card className={cardBg}>
                <CardContent className="p-8 text-center">
                  <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>No ISPS records found</p>
                </CardContent>
              </Card>
            ) : (
              ispsRecords.map((rec: any) => (
                <Card key={rec.id} className={cardBg}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Anchor className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>
                            {rec.securityLevel || rec.recordType || `ISPS Record #${rec.id}`}
                          </div>
                          <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                            {rec.issuedDate ? new Date(rec.issuedDate).toLocaleDateString() : ""} — Valid until: {rec.expiryDate ? new Date(rec.expiryDate).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusBadge(rec.status || "valid")}>
                        {rec.status || "valid"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* MARPOL Tab -- static reference */}
        <TabsContent value="marpol">
          <div className="space-y-3">
            {MARPOL_COMPLIANCE.map((m, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={complianceStatus} />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{m.annex}: {m.title}</div>
                      </div>
                    </div>
                    <Badge className={statusBadge(complianceStatus)}>{complianceStatus}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insurance Tab -- live from DB */}
        <TabsContent value="insurance">
          <div className="space-y-3">
            {complianceQuery.isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : insurance.length === 0 ? (
              <Card className={cardBg}>
                <CardContent className="p-8 text-center">
                  <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>No insurance records found</p>
                </CardContent>
              </Card>
            ) : (
              insurance.map((ins: any) => (
                <Card key={ins.id} className={cardBg}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ship className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>
                            {ins.policyNumber || ins.insuranceType || `Policy #${ins.id}`}
                          </div>
                          <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                            {ins.provider || "Provider"} — Expires: {ins.expiryDate ? new Date(ins.expiryDate).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusBadge(ins.status || "active")}>
                        {ins.status || "active"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
