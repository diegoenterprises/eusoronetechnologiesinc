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
import { trpc } from "@/lib/trpc";
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
  const crewQuery = (trpc as any).railShipments.getRailCrew.useQuery({ limit: 50 });
  const allCrew: any[] = crewQuery.data || [];
  const engineers = allCrew.filter((c: any) => c.role === "engineer");
  const conductors = allCrew.filter((c: any) => c.role === "conductor");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  const renderCrewRow = (member: any) => (
    <div key={member.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", text)}>{member.name}</span>
          <Badge className={STATUS_MAP[member.status]}>{member.status.replace("_", " ")}</Badge>
        </div>
        <div className={cn("text-xs mt-1", muted)}>Role: {member.role} • {member.hoursOfServiceCompliant ? "HOS Compliant" : "Non-compliant"}</div>
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
          { icon: <HardHat className="w-5 h-5" />, label: "Engineers", value: engineers.length },
          { icon: <UserCheck className="w-5 h-5" />, label: "Conductors", value: conductors.length },
          { icon: <Award className="w-5 h-5" />, label: "Total Crew", value: allCrew.length },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Non-Compliant", value: allCrew.filter((c: any) => !c.hoursOfServiceCompliant).length },
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
            <CardContent>
              {engineers.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">No records yet</p><p className="text-sm">Data will appear as operations begin.</p></div>
              ) : (
                <div className="space-y-3">{engineers.map(renderCrewRow)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conductors">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Conductors</CardTitle></CardHeader>
            <CardContent>
              {conductors.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">No records yet</p><p className="text-sm">Data will appear as operations begin.</p></div>
              ) : (
                <div className="space-y-3">{conductors.map(renderCrewRow)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Crew Certifications</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No certification records yet</p>
                <p className="text-sm">Certifications will appear as crew records are added.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hos">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Hours of Service Summary</CardTitle></CardHeader>
            <CardContent>
              <p className={cn("text-sm mb-4", muted)}>49 CFR Part 228 — 12-hour on-duty limit, 10-hour undisturbed rest</p>
              {allCrew.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><Clock className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">No HOS records yet</p><p className="text-sm">Data will appear as crew operations begin.</p></div>
              ) : (
                <div className="space-y-3">{allCrew.map(renderCrewRow)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
