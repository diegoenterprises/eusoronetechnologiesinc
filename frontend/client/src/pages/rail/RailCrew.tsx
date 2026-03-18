/**
 * RAIL CREW — V5 Multi-Modal
 * Crew management: Engineers, Conductors, Certifications, HOS tracking
 * Queries railCrewAssignments when available
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  HardHat,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const MOCK_ENGINEERS = [
  { id: 1, name: "James Mitchell", license: "ENG-2024-4421", status: "on_duty", hoursToday: 6.5, maxHours: 12, territory: "Chicago Sub" },
  { id: 2, name: "Sarah Williams", license: "ENG-2024-4455", status: "resting", hoursToday: 0, maxHours: 12, territory: "Kansas City Sub" },
  { id: 3, name: "Michael Torres", license: "ENG-2023-3901", status: "on_duty", hoursToday: 10.1, maxHours: 12, territory: "Houston Sub" },
];

const MOCK_CONDUCTORS = [
  { id: 1, name: "Robert Chen", license: "CON-2024-7802", status: "on_duty", hoursToday: 9.2, maxHours: 12, territory: "Chicago Sub" },
  { id: 2, name: "Diana Reyes", license: "CON-2024-7815", status: "available", hoursToday: 0, maxHours: 12, territory: "Memphis Sub" },
  { id: 3, name: "Kevin Park", license: "CON-2023-6901", status: "on_duty", hoursToday: 3.8, maxHours: 12, territory: "Houston Sub" },
];

const MOCK_CERTS = [
  { name: "Operating Rules Qualification", holder: "James Mitchell", validUntil: "2027-06-15", status: "valid" },
  { name: "Air Brake Proficiency", holder: "Robert Chen", validUntil: "2026-04-01", status: "expiring_soon" },
  { name: "Hazmat Transportation", holder: "Sarah Williams", validUntil: "2027-12-31", status: "valid" },
  { name: "Physical Fitness (FRA)", holder: "Michael Torres", validUntil: "2026-09-30", status: "valid" },
  { name: "Operating Rules Qualification", holder: "Diana Reyes", validUntil: "2026-03-20", status: "expiring_soon" },
];

const STATUS_MAP: Record<string, string> = {
  on_duty: "bg-emerald-500/20 text-emerald-400",
  resting: "bg-blue-500/20 text-blue-400",
  available: "bg-cyan-500/20 text-cyan-400",
  valid: "bg-green-500/20 text-green-400",
  expiring_soon: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
};

export default function RailCrew() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("engineers");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  const renderCrewRow = (member: typeof MOCK_ENGINEERS[0]) => (
    <div key={member.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", text)}>{member.name}</span>
          <Badge className={STATUS_MAP[member.status]}>{member.status.replace("_", " ")}</Badge>
        </div>
        <p className={cn("text-xs mt-1", muted)}>License: {member.license} • {member.territory}</p>
      </div>
      <div className="w-32">
        <div className="flex justify-between text-xs mb-1">
          <span className={muted}>{member.hoursToday}h</span>
          <span className={muted}>{member.maxHours}h</span>
        </div>
        <Progress value={(member.hoursToday / member.maxHours) * 100} className="h-2" />
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-indigo-100 to-blue-100" : "bg-gradient-to-br from-indigo-500/20 to-blue-500/20")}>
          <Users className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", text)}>Rail Crew Management</h1>
          <p className={cn("text-sm", muted)}>Engineers, conductors, certifications & HOS</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <HardHat className="w-5 h-5" />, label: "Engineers", value: MOCK_ENGINEERS.length },
          { icon: <UserCheck className="w-5 h-5" />, label: "Conductors", value: MOCK_CONDUCTORS.length },
          { icon: <Award className="w-5 h-5" />, label: "Valid Certs", value: MOCK_CERTS.filter(c => c.status === "valid").length },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Expiring Soon", value: MOCK_CERTS.filter(c => c.status === "expiring_soon").length },
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
          <TabsTrigger value="engineers">Engineers</TabsTrigger>
          <TabsTrigger value="conductors">Conductors</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="hos">HOS Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="engineers">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Locomotive Engineers</CardTitle></CardHeader>
            <CardContent><div className="space-y-3">{MOCK_ENGINEERS.map(renderCrewRow)}</div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conductors">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Conductors</CardTitle></CardHeader>
            <CardContent><div className="space-y-3">{MOCK_CONDUCTORS.map(renderCrewRow)}</div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Crew Certifications</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_CERTS.map((cert, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                    <div>
                      <span className={cn("font-semibold text-sm", text)}>{cert.name}</span>
                      <p className={cn("text-xs", muted)}>{cert.holder} • Valid until {cert.validUntil}</p>
                    </div>
                    <Badge className={STATUS_MAP[cert.status]}>{cert.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hos">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Hours of Service Summary</CardTitle></CardHeader>
            <CardContent>
              <p className={cn("text-sm mb-4", muted)}>49 CFR Part 228 — 12-hour on-duty limit, 10-hour undisturbed rest</p>
              <div className="space-y-3">
                {[...MOCK_ENGINEERS, ...MOCK_CONDUCTORS].map((m) => renderCrewRow(m))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
