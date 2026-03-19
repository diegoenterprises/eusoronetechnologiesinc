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
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";


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
  const complianceQuery = (trpc as any).vesselShipments.getVesselCompliance.useQuery({ vesselId: undefined });
  const crewData: any[] = complianceQuery.data?.crew || [];
  const inspections: any[] = complianceQuery.data?.inspections || [];

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
          { icon: <Users className="w-5 h-5" />, label: "Crew Records", value: crewData.length },
          { icon: <Award className="w-5 h-5" />, label: "Inspections", value: inspections.length },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Certs Expiring", value: 0 },
          { icon: <Shield className="w-5 h-5" />, label: "Drills Due", value: 0 },
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
              <div className="text-center py-12 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No crew manifest records yet</p>
                <p className="text-sm">Data will appear as vessel operations begin.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>STCW Certifications</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No certifications recorded yet</p>
                <p className="text-sm">Data will appear as vessel operations begin.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watch">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Watch Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No watch schedule records yet</p>
                <p className="text-sm">Data will appear as vessel operations begin.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drills">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Safety Drills</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No drill records yet</p>
                <p className="text-sm">Data will appear as vessel operations begin.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
