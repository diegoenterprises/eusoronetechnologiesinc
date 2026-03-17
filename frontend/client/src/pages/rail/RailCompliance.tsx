/**
 * RAIL COMPLIANCE — V5 Multi-Modal
 * FRA compliance dashboard: status cards, certification tracker,
 * inspection schedule, incident log
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
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

// Mock compliance data — will connect to real tRPC when compliance tables are wired
const COMPLIANCE_AREAS = [
  {
    id: 1,
    name: "Track Safety Standards",
    regulation: "49 CFR Part 213",
    status: "compliant",
    lastAudit: "2026-02-15",
    nextAudit: "2026-08-15",
    score: 96,
  },
  {
    id: 2,
    name: "Freight Car Safety Standards",
    regulation: "49 CFR Part 215",
    status: "compliant",
    lastAudit: "2026-01-20",
    nextAudit: "2026-07-20",
    score: 92,
  },
  {
    id: 3,
    name: "Railroad Communications",
    regulation: "49 CFR Part 220",
    status: "compliant",
    lastAudit: "2026-03-01",
    nextAudit: "2026-09-01",
    score: 100,
  },
  {
    id: 4,
    name: "Hours of Service",
    regulation: "49 CFR Part 228",
    status: "warning",
    lastAudit: "2026-02-28",
    nextAudit: "2026-05-28",
    score: 85,
  },
  {
    id: 5,
    name: "Railroad Operating Rules",
    regulation: "49 CFR Part 217",
    status: "compliant",
    lastAudit: "2026-01-10",
    nextAudit: "2026-07-10",
    score: 94,
  },
  {
    id: 6,
    name: "Hazardous Materials",
    regulation: "49 CFR Part 174",
    status: "compliant",
    lastAudit: "2026-03-05",
    nextAudit: "2026-06-05",
    score: 98,
  },
];

const CERTIFICATIONS = [
  { name: "Engineer Certification", regulation: "49 CFR 240", holders: 12, expiringSoon: 1, status: "active" },
  { name: "Conductor Certification", regulation: "49 CFR 242", holders: 18, expiringSoon: 2, status: "active" },
  { name: "Signal Employee Cert", regulation: "49 CFR 246", holders: 4, expiringSoon: 0, status: "active" },
  { name: "Drug & Alcohol Program", regulation: "49 CFR 219", holders: 34, expiringSoon: 0, status: "active" },
];

const INSPECTIONS = [
  { id: 1, type: "Blue Signal Protection", date: "2026-03-20", inspector: "FRA Region 4", status: "scheduled" },
  { id: 2, type: "Brake System Inspection", date: "2026-03-25", inspector: "Internal QA", status: "scheduled" },
  { id: 3, type: "Track Geometry", date: "2026-02-28", inspector: "FRA Region 4", status: "passed", score: 95 },
  { id: 4, type: "Hazmat Handling Audit", date: "2026-02-15", inspector: "PHMSA", status: "passed", score: 98 },
  { id: 5, type: "Operating Practices", date: "2026-01-30", inspector: "FRA Region 4", status: "passed", score: 91 },
];

const INCIDENTS = [
  { id: 1, date: "2026-03-10", type: "Derailment (minor)", location: "Bailey Yard, NE", severity: "low", status: "closed", description: "Empty car derailed at low speed during switching" },
  { id: 2, date: "2026-02-22", type: "Grade Crossing", location: "Milepost 145.2, KS", severity: "medium", status: "under_review", description: "Gate malfunction — no injuries" },
  { id: 3, date: "2026-01-15", type: "Signal Violation", location: "Roseville Yard, CA", severity: "low", status: "closed", description: "Crew passed restricting signal — retraining completed" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "compliant" || status === "passed" || status === "active")
    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warning")
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function statusBadge(status: string) {
  if (status === "compliant" || status === "passed" || status === "active" || status === "closed")
    return "bg-emerald-500/20 text-emerald-400";
  if (status === "warning" || status === "scheduled" || status === "under_review")
    return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

export default function RailCompliance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("status");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const compliantCount = COMPLIANCE_AREAS.filter(
    (a) => a.status === "compliant"
  ).length;
  const avgScore = Math.round(
    COMPLIANCE_AREAS.reduce((sum, a) => sum + a.score, 0) /
      COMPLIANCE_AREAS.length
  );

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
            {avgScore}%
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Avg Compliance Score
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-blue-500/10">
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {compliantCount}/{COMPLIANCE_AREAS.length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Areas Compliant
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-amber-500/10">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {CERTIFICATIONS.reduce((s, c) => s + c.expiringSoon, 0)}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Certs Expiring Soon
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {INCIDENTS.filter((i) => i.status === "under_review").length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Open Incidents
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
          <TabsTrigger value="incidents">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Incidents
          </TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status">
          <div className="space-y-3">
            {COMPLIANCE_AREAS.map((area) => (
              <Card key={area.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={area.status} />
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
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          area.score >= 95
                            ? "text-emerald-400"
                            : area.score >= 85
                              ? "text-amber-400"
                              : "text-red-400"
                        )}
                      >
                        {area.score}%
                      </span>
                      <Badge className={statusBadge(area.status)}>
                        {area.status}
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={area.score}
                    className={cn(
                      "h-1.5",
                      area.score >= 95
                        ? "[&>div]:bg-emerald-500"
                        : area.score >= 85
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-red-500"
                    )}
                  />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className={isLight ? "text-slate-400" : "text-slate-500"}>
                      Last audit: {area.lastAudit}
                    </span>
                    <span className={isLight ? "text-slate-400" : "text-slate-500"}>
                      Next audit: {area.nextAudit}
                    </span>
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
                          {cert.regulation} — {cert.holders} active holders
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.expiringSoon > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                          {cert.expiringSoon} expiring
                        </Badge>
                      )}
                      <Badge className={statusBadge(cert.status)}>
                        {cert.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections">
          <div className="space-y-3">
            {INSPECTIONS.map((insp) => (
              <Card key={insp.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck
                        className={cn(
                          "w-4 h-4",
                          insp.status === "scheduled"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        )}
                      />
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {insp.type}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {insp.inspector} — {insp.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(insp as any).score && (
                        <span className="text-sm font-bold text-emerald-400">
                          {(insp as any).score}%
                        </span>
                      )}
                      <Badge className={statusBadge(insp.status)}>
                        {insp.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <div className="space-y-3">
            {INCIDENTS.map((inc) => (
              <Card key={inc.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={cn(
                          "w-4 h-4",
                          inc.severity === "high"
                            ? "text-red-400"
                            : inc.severity === "medium"
                              ? "text-amber-400"
                              : "text-yellow-400"
                        )}
                      />
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {inc.type}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {inc.location} — {inc.date}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusBadge(inc.status)}>
                      {inc.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      "text-xs pl-7",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    {inc.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
