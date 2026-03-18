/**
 * VESSEL CREW — V5 Multi-Modal
 * Maritime crew management: Manifest, STCW certifications,
 * watch schedules, drill records
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  Anchor,
  Award,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Ship,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MOCK_MANIFEST = [
  { id: 1, name: "Capt. Robert Hayes", rank: "Master", cert: "STCW II/2", nationality: "US", embarkDate: "2026-01-15", status: "on_board" },
  { id: 2, name: "Chen Wei", rank: "Chief Officer", cert: "STCW II/2", nationality: "SG", embarkDate: "2026-01-15", status: "on_board" },
  { id: 3, name: "Maria Santos", rank: "Chief Engineer", cert: "STCW III/2", nationality: "PH", embarkDate: "2026-02-01", status: "on_board" },
  { id: 4, name: "Erik Johansson", rank: "2nd Officer", cert: "STCW II/1", nationality: "SE", embarkDate: "2026-01-15", status: "on_board" },
  { id: 5, name: "Raj Patel", rank: "3rd Engineer", cert: "STCW III/1", nationality: "IN", embarkDate: "2026-02-01", status: "on_shore_leave" },
];

const MOCK_CERTS = [
  { name: "STCW Basic Safety Training", holder: "All Crew", validUntil: "2027-12-31", status: "valid" },
  { name: "Advanced Firefighting", holder: "Capt. Hayes", validUntil: "2026-06-15", status: "valid" },
  { name: "Medical First Aid", holder: "M. Santos", validUntil: "2026-04-01", status: "expiring_soon" },
  { name: "GMDSS Operator", holder: "E. Johansson", validUntil: "2027-09-30", status: "valid" },
  { name: "Proficiency in Survival Craft", holder: "Chen Wei", validUntil: "2027-05-15", status: "valid" },
];

const MOCK_WATCHES = [
  { watch: "0000-0400", officer: "E. Johansson (2/O)", engineer: "R. Patel (3/E)", status: "completed" },
  { watch: "0400-0800", officer: "Chen Wei (C/O)", engineer: "M. Santos (C/E)", status: "active" },
  { watch: "0800-1200", officer: "Capt. Hayes", engineer: "—", status: "upcoming" },
  { watch: "1200-1600", officer: "E. Johansson (2/O)", engineer: "R. Patel (3/E)", status: "upcoming" },
];

const MOCK_DRILLS = [
  { type: "Fire Drill", lastDate: "2026-03-10", nextDue: "2026-04-10", status: "completed" },
  { type: "Abandon Ship", lastDate: "2026-03-01", nextDue: "2026-04-01", status: "completed" },
  { type: "Man Overboard", lastDate: "2026-02-15", nextDue: "2026-03-15", status: "due" },
  { type: "Oil Spill Response", lastDate: "2026-01-20", nextDue: "2026-04-20", status: "completed" },
];

const STATUS_MAP: Record<string, string> = {
  on_board: "bg-emerald-500/20 text-emerald-400",
  on_shore_leave: "bg-blue-500/20 text-blue-400",
  disembarked: "bg-slate-500/20 text-slate-400",
  valid: "bg-green-500/20 text-green-400",
  expiring_soon: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-green-500/20 text-green-400",
  upcoming: "bg-slate-500/20 text-slate-400",
  due: "bg-yellow-500/20 text-yellow-400",
};

export default function VesselCrew() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("manifest");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-cyan-100 to-blue-100" : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20")}>
          <Users className="w-7 h-7 text-cyan-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", text)}>Maritime Crew Management</h1>
          <p className={cn("text-sm", muted)}>Manifest, certifications, watch schedule & drills</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Users className="w-5 h-5" />, label: "Crew On Board", value: MOCK_MANIFEST.filter(m => m.status === "on_board").length },
          { icon: <Award className="w-5 h-5" />, label: "Valid Certs", value: MOCK_CERTS.filter(c => c.status === "valid").length },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Certs Expiring", value: MOCK_CERTS.filter(c => c.status === "expiring_soon").length },
          { icon: <Shield className="w-5 h-5" />, label: "Drills Due", value: MOCK_DRILLS.filter(d => d.status === "due").length },
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
          <TabsTrigger value="manifest">Manifest</TabsTrigger>
          <TabsTrigger value="certs">Certifications</TabsTrigger>
          <TabsTrigger value="watch">Watch Schedule</TabsTrigger>
          <TabsTrigger value="drills">Drills</TabsTrigger>
        </TabsList>

        <TabsContent value="manifest">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Crew Manifest</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_MANIFEST.map((m) => (
                  <div key={m.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold", text)}>{m.name}</span>
                        <Badge className={STATUS_MAP[m.status]}>{m.status.replace("_", " ")}</Badge>
                      </div>
                      <p className={cn("text-xs mt-1", muted)}>{m.rank} • {m.cert} • {m.nationality} • Embarked {m.embarkDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>STCW Certifications</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_CERTS.map((c, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-semibold text-sm", text)}>{c.name}</span>
                      <p className={cn("text-xs", muted)}>{c.holder} • Valid until {c.validUntil}</p>
                    </div>
                    <Badge className={STATUS_MAP[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watch">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Watch Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_WATCHES.map((w, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-mono font-semibold", text)}>{w.watch}</span>
                      <p className={cn("text-xs mt-1", muted)}>OOW: {w.officer} • Engineer: {w.engineer}</p>
                    </div>
                    <Badge className={STATUS_MAP[w.status]}>{w.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drills">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Safety Drills</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_DRILLS.map((d, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-semibold text-sm", text)}>{d.type}</span>
                      <p className={cn("text-xs", muted)}>Last: {d.lastDate} • Next due: {d.nextDue}</p>
                    </div>
                    <Badge className={STATUS_MAP[d.status]}>{d.status}</Badge>
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
