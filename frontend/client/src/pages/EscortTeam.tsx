/**
 * ESCORT TEAM PAGE — Convoy Crew Management
 * Shows the escort's active/upcoming convoy teams: fellow escorts,
 * the hauling driver, carrier, positions, and quick-contact actions.
 * 100% Dynamic — tRPC-backed, zero mock data.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, Phone, Mail, MapPin, Truck, Car, Shield,
  Navigation, Clock, ChevronRight, User, Radio,
  ArrowRight, CircleDot, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const positionLabel: Record<string, string> = {
  lead: "Lead Pilot",
  chase: "Rear Chase",
  both: "Lead & Rear",
};

const positionColor: Record<string, string> = {
  lead: "bg-blue-500/20 text-blue-400",
  chase: "bg-purple-500/20 text-purple-400",
  both: "bg-orange-500/20 text-orange-400",
};

const statusColor: Record<string, string> = {
  escorting: "bg-cyan-500/20 text-cyan-400",
  accepted: "bg-green-500/20 text-green-400",
  en_route: "bg-yellow-500/20 text-yellow-400",
  on_site: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-slate-500/20 text-slate-400",
};

const statusLabel: Record<string, string> = {
  escorting: "Escorting",
  accepted: "Accepted",
  en_route: "En Route",
  on_site: "On Site",
  pending: "Pending",
};

export default function EscortTeam() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const teamQuery = (trpc as any).escorts.getMyTeam.useQuery();
  const teams = teamQuery.data || [];

  const activeTeams = teams.filter((t: any) => ["escorting", "en_route", "on_site"].includes(t.myStatus));
  const upcomingTeams = teams.filter((t: any) => ["accepted", "pending"].includes(t.myStatus));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          My Team
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Your convoy crews — escorts, drivers, and carriers on your active & upcoming assignments
        </p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Radio className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {teamQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{activeTeams.length}</p>
                )}
                <p className="text-xs text-slate-400">Active Crews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {teamQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (
                  <p className="text-2xl font-bold text-blue-400">{upcomingTeams.length}</p>
                )}
                <p className="text-xs text-slate-400">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {teamQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (
                  <p className="text-2xl font-bold text-green-400">
                    {teams.reduce((sum: number, t: any) => sum + (t.totalEscorts || 0) + (t.driver ? 1 : 0), 0)}
                  </p>
                )}
                <p className="text-xs text-slate-400">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {teamQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (
                  <p className="text-2xl font-bold text-purple-400">{teams.length}</p>
                )}
                <p className="text-xs text-slate-400">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Crews */}
      {teamQuery.isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : teams.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="text-center py-20">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">No Active Teams</p>
            <p className="text-slate-400 text-sm mt-1">
              When you're assigned to a convoy, your team will appear here
            </p>
            <Button
              className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
              onClick={() => window.location.href = "/escort/jobs"}
            >
              Browse Available Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Teams */}
          {activeTeams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-cyan-400 animate-pulse" />
                Active Crews
              </h2>
              {activeTeams.map((team: any) => (
                <TeamCard
                  key={team.assignmentId}
                  team={team}
                  expanded={expandedId === team.assignmentId}
                  onToggle={() => setExpandedId(expandedId === team.assignmentId ? null : team.assignmentId)}
                  isActive
                />
              ))}
            </div>
          )}

          {/* Upcoming Teams */}
          {upcomingTeams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Upcoming Crews
              </h2>
              {upcomingTeams.map((team: any) => (
                <TeamCard
                  key={team.assignmentId}
                  team={team}
                  expanded={expandedId === team.assignmentId}
                  onToggle={() => setExpandedId(expandedId === team.assignmentId ? null : team.assignmentId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamCard({ team, expanded, onToggle, isActive }: {
  team: any;
  expanded: boolean;
  onToggle: () => void;
  isActive?: boolean;
}) {
  const allContacts = [
    ...(team.teamMembers || []).filter((m: any) => !m.isMe).map((m: any) => ({
      ...m, role: "escort", icon: <Car className="w-4 h-4" />,
      roleLabel: positionLabel[m.position] || "Escort",
      roleColor: "text-blue-400",
    })),
    ...(team.driver ? [{
      ...team.driver, role: "driver", icon: <Truck className="w-4 h-4" />,
      roleLabel: "Hauling Driver", roleColor: "text-cyan-400",
    }] : []),
    ...(team.carrier ? [{
      ...team.carrier, role: "carrier", icon: <Package className="w-4 h-4" />,
      roleLabel: "Carrier", roleColor: "text-orange-400",
    }] : []),
  ];

  const mePosition = team.myPosition || "lead";

  return (
    <Card className={cn(
      "border rounded-xl transition-all",
      isActive
        ? "bg-slate-800/70 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
        : "bg-slate-800/50 border-slate-700/50",
    )}>
      {/* Collapsed Header */}
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                isActive ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-slate-700",
              )}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold">{team.loadNumber}</p>
                  <Badge className={cn("border-0 text-xs", statusColor[team.myStatus] || statusColor.pending)}>
                    {statusLabel[team.myStatus] || team.myStatus}
                  </Badge>
                  <Badge className={cn("border-0 text-xs", positionColor[mePosition] || positionColor.lead)}>
                    {positionLabel[mePosition] || mePosition}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-400 mt-0.5">
                  <MapPin className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span className="truncate">{team.origin}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="truncate">{team.destination}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden md:block">
                <p className="text-sm text-slate-500">{allContacts.length} team member{allContacts.length !== 1 ? "s" : ""}</p>
                {team.distance > 0 && <p className="text-xs text-slate-600">{team.distance} mi</p>}
              </div>
              <ChevronRight className={cn(
                "w-5 h-5 text-slate-500 transition-transform",
                expanded && "rotate-90",
              )} />
            </div>
          </div>
        </CardHeader>
      </button>

      {/* Expanded Body */}
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Convoy Status */}
          {team.convoy && (
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <p className="text-sm text-white font-medium">Convoy #{team.convoy.id}</p>
                <Badge className={cn("border-0 text-xs",
                  team.convoy.status === "active" ? "bg-green-500/20 text-green-400" :
                  team.convoy.status === "forming" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-slate-500/20 text-slate-400"
                )}>{team.convoy.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><span className="text-slate-500">Max Speed</span><p className="text-white font-medium">{team.convoy.maxSpeedMph || 45} mph</p></div>
                <div><span className="text-slate-500">Lead Gap</span><p className="text-white font-medium">{team.convoy.targetLeadDistance || 800}m</p></div>
                <div><span className="text-slate-500">Rear Gap</span><p className="text-white font-medium">{team.convoy.targetRearDistance || 500}m</p></div>
              </div>
            </div>
          )}

          {/* My Position Card */}
          <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white font-medium">Your Position</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("border-0", positionColor[mePosition])}>{positionLabel[mePosition]}</Badge>
                {team.myRate > 0 && (
                  <span className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                    ${team.myRate.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      {team.myRateType === "per_mile" ? "/mi" : team.myRateType === "per_hour" ? "/hr" : "flat"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Team Members */}
          {allContacts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 font-medium">Team Members</p>
              {allContacts.map((member: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      member.role === "driver" ? "bg-cyan-500/20" :
                      member.role === "carrier" ? "bg-orange-500/20" : "bg-blue-500/20",
                    )}>
                      <span className={member.roleColor}>{member.icon}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{member.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{member.roleLabel}</span>
                        {member.position && member.role === "escort" && (
                          <Badge className={cn("border-0 text-[10px] py-0 px-1.5", positionColor[member.position])}>
                            {positionLabel[member.position] || member.position}
                          </Badge>
                        )}
                        {member.status && member.role === "escort" && (
                          <Badge className={cn("border-0 text-[10px] py-0 px-1.5", statusColor[member.status])}>
                            {statusLabel[member.status] || member.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {member.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                        onClick={(e) => { e.stopPropagation(); window.open(`tel:${member.phone}`); }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {member.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                        onClick={(e) => { e.stopPropagation(); window.open(`mailto:${member.email}`); }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No other team members assigned yet</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 rounded-lg gap-1.5"
              onClick={() => window.location.href = "/escort/active-trip"}
            >
              <Navigation className="w-3.5 h-3.5" />
              Active Trip
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg gap-1.5"
              onClick={() => window.location.href = `/loads/${team.loadId}`}
            >
              <Truck className="w-3.5 h-3.5" />
              Load Details
            </Button>
            {team.convoy && (
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg gap-1.5"
                onClick={() => window.location.href = "/convoys"}
              >
                <Shield className="w-3.5 h-3.5" />
                Convoy Panel
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
