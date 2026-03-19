/**
 * RAIL COMPLIANCE — V5 Multi-Modal
 * FRA compliance dashboard: live data from tRPC + static regulation reference
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Award,
  Calendar,
  Clock,
  ClipboardCheck,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// Static regulation reference (these don't come from DB)
const COMPLIANCE_AREAS = [
  { id: 1, name: "Track Safety Standards", regulation: "49 CFR Part 213" },
  { id: 2, name: "Freight Car Safety Standards", regulation: "49 CFR Part 215" },
  { id: 3, name: "Railroad Communications", regulation: "49 CFR Part 220" },
  { id: 4, name: "Hours of Service", regulation: "49 CFR Part 228" },
  { id: 5, name: "Railroad Operating Rules", regulation: "49 CFR Part 217" },
  { id: 6, name: "Hazardous Materials", regulation: "49 CFR Part 174" },
];

const CERTIFICATIONS = [
  { name: "Engineer Certification", regulation: "49 CFR 240" },
  { name: "Conductor Certification", regulation: "49 CFR 242" },
  { name: "Signal Employee Cert", regulation: "49 CFR 246" },
  { name: "Drug & Alcohol Program", regulation: "49 CFR 219" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "compliant" || status === "passed" || status === "active" || status === "pass")
    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warning")
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function statusBadge(status: string) {
  if (status === "compliant" || status === "passed" || status === "active" || status === "closed" || status === "pass")
    return "bg-emerald-500/20 text-emerald-400";
  if (status === "warning" || status === "scheduled" || status === "under_review")
    return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

export default function RailCompliance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("status");

  // Live data from tRPC
  const complianceQuery = trpc.railShipments.getRailCompliance.useQuery({});

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const inspections: any[] = complianceQuery.data?.inspections || [];
  const hazmatPermits: any[] = complianceQuery.data?.hazmatPermits || [];
  const complianceStatus = complianceQuery.data?.status || "unknown";
  const totalInspections = complianceQuery.data?.totalInspections || 0;
  const failedCount = complianceQuery.data?.failedCount || 0;

  const passedCount = inspections.filter((i: any) => i.result === "pass" || i.result === "passed").length;
  const avgScore = totalInspections > 0 ? Math.round(((totalInspections - failedCount) / totalInspections) * 100) : 0;

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Rail Compliance
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            FRA regulatory compliance dashboard
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {complianceQuery.isLoading ? <Skeleton className="h-8 w-16" /> : `${avgScore}%`}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Inspection Pass Rate
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-blue-500/10">
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {complianceQuery.isLoading ? <Skeleton className="h-8 w-16" /> : complianceStatus}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Overall Status
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-amber-500/10">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {complianceQuery.isLoading ? <Skeleton className="h-8 w-16" /> : hazmatPermits.length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hazmat Permits
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {complianceQuery.isLoading ? <Skeleton className="h-8 w-16" /> : failedCount}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Failed Inspections
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="status">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Status
          </TabsTrigger>
          <TabsTrigger value="certs">
            <Award className="w-3.5 h-3.5 mr-1" />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="inspections">
            <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="hazmat">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Hazmat Permits
          </TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status">
          <div className="space-y-3">
            {COMPLIANCE_AREAS.map((area) => (
              <Card key={area.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={complianceStatus} />
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {area.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {area.regulation}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusBadge(complianceStatus)}>
                      {complianceStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certs">
          <div className="space-y-3">
            {CERTIFICATIONS.map((cert, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 text-amber-400" />
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {cert.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {cert.regulation}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusBadge("active")}>active</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inspections Tab — live from DB */}
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
                        <ClipboardCheck
                          className={cn(
                            "w-4 h-4",
                            insp.result === "pass"
                              ? "text-emerald-400"
                              : insp.result === "fail" || insp.result === "out_of_service"
                                ? "text-red-400"
                                : "text-amber-400"
                          )}
                        />
                        <div>
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isLight ? "text-slate-900" : "text-white"
                            )}
                          >
                            {insp.inspectionType || insp.type || "Inspection"}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isLight ? "text-slate-500" : "text-slate-400"
                            )}
                          >
                            {insp.inspector || "Inspector"} — {insp.inspectionDate ? new Date(insp.inspectionDate).toLocaleDateString() : "N/A"}
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

        {/* Hazmat Permits Tab — live from DB */}
        <TabsContent value="hazmat">
          <div className="space-y-3">
            {complianceQuery.isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : hazmatPermits.length === 0 ? (
              <Card className={cardBg}>
                <CardContent className="p-8 text-center">
                  <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>No hazmat permits found</p>
                </CardContent>
              </Card>
            ) : (
              hazmatPermits.map((permit: any) => (
                <Card key={permit.id} className={cardBg}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <div>
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isLight ? "text-slate-900" : "text-white"
                            )}
                          >
                            {permit.permitNumber || `Permit #${permit.id}`}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isLight ? "text-slate-500" : "text-slate-400"
                            )}
                          >
                            Class: {permit.hazmatClass || "N/A"} — Expires: {permit.expiresAt ? new Date(permit.expiresAt).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusBadge(permit.status || "active")}>
                        {permit.status || "active"}
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
