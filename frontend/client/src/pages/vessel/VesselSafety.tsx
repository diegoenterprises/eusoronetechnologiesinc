/**
 * VESSEL SAFETY — V5 Multi-Modal
 * Maritime safety: ISM status, safety incidents, drill compliance,
 * emergency procedures
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  Anchor,
  AlertTriangle,
  CheckCircle,
  Activity,
  Flame,
  LifeBuoy,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const ISM_STATUS = {
  smsStatus: "Active",
  docNumber: "DOC-2026-0451",
  lastAudit: "2026-01-15",
  nextAudit: "2026-07-15",
  nonConformities: 0,
  observations: 2,
  score: 97,
};

const MOCK_INCIDENTS = [
  { id: "MI-101", date: "2026-03-05", type: "Slip/Trip/Fall", severity: "minor", location: "Engine Room", status: "closed", description: "Crew member slipped on wet deck — minor bruising, no lost time" },
  { id: "MI-102", date: "2026-02-18", type: "Near Miss", severity: "moderate", location: "Cargo Hold 3", status: "closed", description: "Loose lashing nearly struck crew during cargo operations" },
  { id: "MI-103", date: "2026-01-30", type: "Equipment Failure", severity: "minor", location: "Bridge", status: "closed", description: "Backup radar malfunction — primary radar operational" },
];

const MOCK_DRILLS = [
  { type: "Fire & Explosion", lastConducted: "2026-03-10", nextDue: "2026-04-10", participants: 22, compliance: "compliant" },
  { type: "Abandon Ship", lastConducted: "2026-03-01", nextDue: "2026-04-01", participants: 24, compliance: "compliant" },
  { type: "Man Overboard", lastConducted: "2026-02-15", nextDue: "2026-03-15", participants: 18, compliance: "due" },
  { type: "Oil Spill Response (SOPEP)", lastConducted: "2026-01-20", nextDue: "2026-04-20", participants: 12, compliance: "compliant" },
  { type: "Security (ISPS)", lastConducted: "2026-02-28", nextDue: "2026-05-28", participants: 24, compliance: "compliant" },
];

const EMERGENCY_PROCEDURES = [
  { name: "Muster Stations", status: "posted", lastReview: "2026-03-01" },
  { name: "Emergency Escape Routes", status: "posted", lastReview: "2026-03-01" },
  { name: "SOPEP Plan", status: "current", lastReview: "2026-02-15" },
  { name: "Shipboard Marine Pollution Plan", status: "current", lastReview: "2026-02-15" },
  { name: "Contingency Plan — Collision", status: "current", lastReview: "2026-01-10" },
  { name: "Contingency Plan — Grounding", status: "current", lastReview: "2026-01-10" },
];

const SEVERITY_MAP: Record<string, string> = {
  minor: "bg-yellow-500/20 text-yellow-400",
  moderate: "bg-orange-500/20 text-orange-400",
  major: "bg-red-500/20 text-red-400",
  critical: "bg-red-600/20 text-red-300",
};

const COMPLIANCE_MAP: Record<string, string> = {
  compliant: "bg-green-500/20 text-green-400",
  due: "bg-yellow-500/20 text-yellow-400",
  overdue: "bg-red-500/20 text-red-400",
};

export default function VesselSafety() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("ism");

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
          <h1 className={cn("text-2xl font-bold", text)}>Maritime Safety</h1>
          <p className={cn("text-sm", muted)}>ISM compliance, incidents, drills & emergency procedures</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <CheckCircle className="w-5 h-5" />, label: "ISM Score", value: `${ISM_STATUS.score}%` },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Open Incidents", value: "0" },
          { icon: <Flame className="w-5 h-5" />, label: "Drills Due", value: MOCK_DRILLS.filter(d => d.compliance === "due").length.toString() },
          { icon: <Activity className="w-5 h-5" />, label: "Days LTI-Free", value: "142" },
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
          <TabsTrigger value="ism">ISM</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="drills">Drills</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="ism">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>ISM Code Compliance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    { label: "SMS Status", value: ISM_STATUS.smsStatus },
                    { label: "DOC Number", value: ISM_STATUS.docNumber },
                    { label: "Last Audit", value: ISM_STATUS.lastAudit },
                    { label: "Next Audit", value: ISM_STATUS.nextAudit },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className={cn("text-sm", muted)}>{item.label}</span>
                      <span className={cn("font-medium text-sm", text)}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={cn("text-sm font-medium", text)}>Compliance Score</span>
                    <span className={cn("font-bold", text)}>{ISM_STATUS.score}%</span>
                  </div>
                  <Progress value={ISM_STATUS.score} className="h-3 mb-4" />
                  <div className="flex justify-between text-sm">
                    <span className={muted}>Non-Conformities: <strong className={text}>{ISM_STATUS.nonConformities}</strong></span>
                    <span className={muted}>Observations: <strong className={text}>{ISM_STATUS.observations}</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Safety Incidents</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_INCIDENTS.map((inc) => (
                  <div key={inc.id} className={cn("p-4 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono font-semibold", text)}>{inc.id}</span>
                        <Badge className={SEVERITY_MAP[inc.severity]}>{inc.severity}</Badge>
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

        <TabsContent value="drills">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Safety Drill Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_DRILLS.map((d, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-semibold text-sm", text)}>{d.type}</span>
                      <p className={cn("text-xs", muted)}>Last: {d.lastConducted} • Next: {d.nextDue} • {d.participants} participants</p>
                    </div>
                    <Badge className={COMPLIANCE_MAP[d.compliance]}>{d.compliance}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Emergency Procedures</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EMERGENCY_PROCEDURES.map((p, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-semibold text-sm", text)}>{p.name}</span>
                      <p className={cn("text-xs", muted)}>Last reviewed: {p.lastReview}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">{p.status}</Badge>
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
