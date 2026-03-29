/**
 * VESSEL CREW — V5 Multi-Modal
 * Maritime crew management: Manifest, STCW certifications,
 * watch schedules, drill records
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
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
  pending: "bg-yellow-500/20 text-yellow-400",
};

const ROLE_LABELS: Record<string, string> = {
  VESSEL_SHIPPER: "Vessel Shipper",
  VESSEL_OPERATOR: "Vessel Operator",
  PORT_MASTER: "Port Master",
  SHIP_CAPTAIN: "Ship Captain",
  VESSEL_BROKER: "Vessel Broker",
  CUSTOMS_BROKER: "Customs Broker",
};

export default function VesselCrew() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("manifest");
  const [search, setSearch] = useState("");

  const crewQuery = (trpc as any).vesselShipments.getVesselCrew.useQuery({ search: search || undefined });
  const crewData: any[] = crewQuery.data?.crew || [];
  const certsData: any[] = crewQuery.data?.certifications || [];
  const expiringCount: number = crewQuery.data?.expiringCount || 0;

  const expiredCerts = certsData.filter((c: any) => c.status === "expired");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const inputBg = isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-600";

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
          { icon: <Users className="w-5 h-5" />, label: "Crew Members", value: crewData.length },
          { icon: <Award className="w-5 h-5" />, label: "Certifications", value: certsData.length },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Certs Expiring", value: expiringCount },
          { icon: <Shield className="w-5 h-5" />, label: "Expired Certs", value: expiredCerts.length },
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={text}>Crew Manifest</CardTitle>
                <div className="relative w-64">
                  <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
                  <Input
                    placeholder="Search crew..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn("pl-9 h-9 text-sm", inputBg, text)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {crewQuery.isLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <Ship className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                  <p className="text-lg font-medium">Loading crew manifest...</p>
                </div>
              ) : crewData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No crew members found</p>
                  <p className="text-sm">Users with vessel roles in your company will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={cn("grid grid-cols-5 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider", muted)}>
                    <span>Name</span>
                    <span>Role</span>
                    <span>Email</span>
                    <span>Phone</span>
                    <span>Status</span>
                  </div>
                  {crewData.map((member: any) => (
                    <div key={member.id} className={cn("grid grid-cols-5 gap-4 items-center px-3 py-3 rounded-lg border", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                      <div className="flex items-center gap-2">
                        {member.profilePicture ? (
                          <img src={member.profilePicture} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", isLight ? "bg-cyan-100 text-cyan-700" : "bg-cyan-500/20 text-cyan-400")}>
                            {(member.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={cn("font-medium text-sm truncate", text)}>{member.name || "Unnamed"}</span>
                      </div>
                      <Badge className={cn("text-xs w-fit", isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400")}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                      <span className={cn("text-sm truncate", muted)}>{member.email || "—"}</span>
                      <span className={cn("text-sm", muted)}>{member.phone || "—"}</span>
                      <Badge className={member.isActive ? STATUS_MAP.active : STATUS_MAP.expired}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>STCW Certifications</CardTitle></CardHeader>
            <CardContent>
              {crewQuery.isLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                  <p className="text-lg font-medium">Loading certifications...</p>
                </div>
              ) : certsData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No certifications recorded yet</p>
                  <p className="text-sm">Crew certifications will appear once added to the system.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={cn("grid grid-cols-5 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider", muted)}>
                    <span>Certification</span>
                    <span>Type</span>
                    <span>Holder</span>
                    <span>Expiry</span>
                    <span>Status</span>
                  </div>
                  {certsData.map((cert: any) => {
                    const holder = crewData.find((c: any) => c.id === cert.userId);
                    const isExpiring = cert.expiryDate && (() => {
                      const days = (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                      return days > 0 && days <= 90;
                    })();
                    return (
                      <div key={cert.id} className={cn("grid grid-cols-5 gap-4 items-center px-3 py-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                        <span className={cn("font-medium text-sm", text)}>{cert.name}</span>
                        <span className={cn("text-sm", muted)}>{cert.type}</span>
                        <span className={cn("text-sm", muted)}>{holder?.name || `User #${cert.userId}`}</span>
                        <span className={cn("text-sm font-mono", muted)}>
                          {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : "N/A"}
                        </span>
                        <Badge className={cn("text-xs w-fit", isExpiring ? STATUS_MAP.expiring_soon : STATUS_MAP[cert.status] || STATUS_MAP.active)}>
                          {isExpiring ? "Expiring Soon" : (cert.status || "active")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
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
