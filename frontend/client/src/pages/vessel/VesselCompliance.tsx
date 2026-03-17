/**
 * VESSEL COMPLIANCE — V5 Multi-Modal
 * Maritime compliance dashboard: ISM Code, ISPS Code, SOLAS certs,
 * MARPOL compliance, crew certs (STCW), PSC inspection records
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

// Mock compliance data for maritime regulations
const ISM_STATUS = {
  docHolder: "EusoTrip Maritime LLC",
  docNumber: "DOC-2026-0451",
  issuedBy: "Panama Maritime Authority",
  validUntil: "2028-06-30",
  lastAudit: "2026-01-15",
  status: "compliant",
  score: 97,
};

const ISPS_STATUS = {
  facilityLevel: "MARSEC Level 1",
  csoName: "Capt. Robert Hayes",
  lastDrill: "2026-02-28",
  nextDrill: "2026-05-28",
  status: "compliant",
  score: 95,
};

const SOLAS_CERTS = [
  { name: "Safety Construction Certificate", validUntil: "2027-12-15", status: "valid" },
  { name: "Safety Equipment Certificate", validUntil: "2027-12-15", status: "valid" },
  { name: "Safety Radio Certificate", validUntil: "2027-06-30", status: "valid" },
  { name: "Load Line Certificate", validUntil: "2027-12-15", status: "valid" },
  { name: "IOPP Certificate", validUntil: "2027-12-15", status: "valid" },
  { name: "Tonnage Certificate", validUntil: "2028-01-01", status: "valid" },
  { name: "VGM Compliance", validUntil: "2026-12-31", status: "expiring_soon" },
];

const MARPOL_COMPLIANCE = [
  { annex: "Annex I", title: "Oil Pollution Prevention", status: "compliant", lastInspection: "2026-02-01" },
  { annex: "Annex II", title: "Noxious Liquid Substances", status: "compliant", lastInspection: "2026-02-01" },
  { annex: "Annex III", title: "Harmful Substances in Packaged Form", status: "compliant", lastInspection: "2026-01-15" },
  { annex: "Annex IV", title: "Sewage Pollution", status: "compliant", lastInspection: "2026-02-15" },
  { annex: "Annex V", title: "Garbage Pollution", status: "compliant", lastInspection: "2026-02-15" },
  { annex: "Annex VI", title: "Air Pollution (SOx/NOx/GHG)", status: "warning", lastInspection: "2026-03-01" },
];

const STCW_CERTS = [
  { crewMember: "Capt. James Mitchell", cert: "Master Mariner (Unlimited)", stcwCode: "II/2", validUntil: "2028-03-15", status: "valid" },
  { crewMember: "C/O Sarah Williams", cert: "Chief Mate (Unlimited)", stcwCode: "II/2", validUntil: "2027-09-30", status: "valid" },
  { crewMember: "C/E Robert Chen", cert: "Chief Engineer (Unlimited)", stcwCode: "III/2", validUntil: "2027-11-15", status: "valid" },
  { crewMember: "2/O David Kim", cert: "OOW Navigation", stcwCode: "II/1", validUntil: "2026-06-15", status: "expiring_soon" },
  { crewMember: "3/E Maria Santos", cert: "OOW Engineering", stcwCode: "III/1", validUntil: "2028-01-01", status: "valid" },
];

const PSC_INSPECTIONS = [
  { port: "Los Angeles, USA", date: "2026-02-20", authority: "USCG", deficiencies: 0, detained: false, status: "clear" },
  { port: "Rotterdam, Netherlands", date: "2025-11-15", authority: "Paris MoU", deficiencies: 1, detained: false, status: "minor_deficiency" },
  { port: "Singapore", date: "2025-08-22", authority: "Tokyo MoU", deficiencies: 0, detained: false, status: "clear" },
];

function statusBadge(status: string) {
  if (status === "compliant" || status === "valid" || status === "clear") return "bg-emerald-500/20 text-emerald-400";
  if (status === "warning" || status === "expiring_soon" || status === "minor_deficiency") return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "compliant" || status === "valid" || status === "clear") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "warning" || status === "expiring_soon") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

export default function VesselCompliance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("overview");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  const totalCerts = SOLAS_CERTS.length + STCW_CERTS.length;
  const expiring = [...SOLAS_CERTS, ...STCW_CERTS].filter((c) => c.status === "expiring_soon").length;

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
          { icon: <Shield className="w-5 h-5 text-emerald-400" />, label: "ISM Score", value: `${ISM_STATUS.score}%`, color: "bg-emerald-500" },
          { icon: <Anchor className="w-5 h-5 text-blue-400" />, label: "ISPS Level", value: "MARSEC 1", color: "bg-blue-500" },
          { icon: <Award className="w-5 h-5 text-amber-400" />, label: "Certs Expiring", value: expiring, color: "bg-amber-500" },
          { icon: <ClipboardCheck className="w-5 h-5 text-cyan-400" />, label: "PSC Clear Rate", value: "100%", color: "bg-cyan-500" },
        ].map((kpi, i) => (
          <div key={i} className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
            <div className={cn("p-2 rounded-lg w-fit mb-2", `${kpi.color}/10`)}>{kpi.icon}</div>
            <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{kpi.value}</div>
            <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><Shield className="w-3.5 h-3.5 mr-1" />ISM/ISPS</TabsTrigger>
          <TabsTrigger value="solas"><Ship className="w-3.5 h-3.5 mr-1" />SOLAS</TabsTrigger>
          <TabsTrigger value="marpol"><Leaf className="w-3.5 h-3.5 mr-1" />MARPOL</TabsTrigger>
          <TabsTrigger value="stcw"><Users className="w-3.5 h-3.5 mr-1" />STCW</TabsTrigger>
          <TabsTrigger value="psc"><ClipboardCheck className="w-3.5 h-3.5 mr-1" />PSC</TabsTrigger>
        </TabsList>

        {/* ISM/ISPS Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={cardBg}>
              <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Shield className="w-4 h-4 text-emerald-400" /> ISM Code</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[["DOC Holder", ISM_STATUS.docHolder], ["DOC Number", ISM_STATUS.docNumber], ["Issued By", ISM_STATUS.issuedBy], ["Valid Until", ISM_STATUS.validUntil], ["Last Audit", ISM_STATUS.lastAudit]].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span>
                    <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{v}</span>
                  </div>
                ))}
                <Progress value={ISM_STATUS.score} className="h-2 mt-2 [&>div]:bg-emerald-500" />
              </CardContent>
            </Card>
            <Card className={cardBg}>
              <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Anchor className="w-4 h-4 text-blue-400" /> ISPS Code</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[["Facility Level", ISPS_STATUS.facilityLevel], ["CSO", ISPS_STATUS.csoName], ["Last Drill", ISPS_STATUS.lastDrill], ["Next Drill", ISPS_STATUS.nextDrill]].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span>
                    <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{v}</span>
                  </div>
                ))}
                <Progress value={ISPS_STATUS.score} className="h-2 mt-2 [&>div]:bg-blue-500" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SOLAS Tab */}
        <TabsContent value="solas">
          <div className="space-y-3">
            {SOLAS_CERTS.map((cert, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={cert.status} />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{cert.name}</div>
                        <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Valid until: {cert.validUntil}</div>
                      </div>
                    </div>
                    <Badge className={statusBadge(cert.status)}>{cert.status.replace(/_/g, " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* MARPOL Tab */}
        <TabsContent value="marpol">
          <div className="space-y-3">
            {MARPOL_COMPLIANCE.map((m, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={m.status} />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{m.annex}: {m.title}</div>
                        <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Last inspection: {m.lastInspection}</div>
                      </div>
                    </div>
                    <Badge className={statusBadge(m.status)}>{m.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* STCW Tab */}
        <TabsContent value="stcw">
          <div className="space-y-3">
            {STCW_CERTS.map((c, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={c.status} />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{c.crewMember}</div>
                        <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{c.cert} (STCW {c.stcwCode}) — Valid until: {c.validUntil}</div>
                      </div>
                    </div>
                    <Badge className={statusBadge(c.status)}>{c.status.replace(/_/g, " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PSC Tab */}
        <TabsContent value="psc">
          <div className="space-y-3">
            {PSC_INSPECTIONS.map((p, i) => (
              <Card key={i} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={p.status} />
                      <div>
                        <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{p.port}</div>
                        <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{p.authority} — {p.date} — {p.deficiencies} deficiencies</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.detained && <Badge className="bg-red-500/20 text-red-400">Detained</Badge>}
                      <Badge className={statusBadge(p.status)}>{p.status.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
