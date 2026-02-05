/**
 * SAFETY INCIDENT TRACKING PAGE
 * 100% Dynamic - Track and manage safety incidents
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Search, Plus, FileText, User,
  Calendar, Clock, MapPin, CheckCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyIncidentTracking() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const incidentsQuery = trpc.safety.getIncidents.useQuery({ type: typeFilter, status: statusFilter });
  const statsQuery = trpc.safety.getIncidentStats.useQuery();

  const incidents = incidentsQuery.data || [];
  const stats = statsQuery.data;

  const filteredIncidents = incidents.filter((i: any) =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.reportedBy?.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "injury": return "bg-red-500/20 text-red-400";
      case "near_miss": return "bg-yellow-500/20 text-yellow-400";
      case "property_damage": return "bg-orange-500/20 text-orange-400";
      case "environmental": return "bg-purple-500/20 text-purple-400";
      case "security": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-cyan-500/20 text-cyan-400";
      case "investigating": return "bg-yellow-500/20 text-yellow-400";
      case "resolved": return "bg-green-500/20 text-green-400";
      case "closed": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Incident Tracking
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage safety incidents</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total YTD</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalYTD || stats?.yearToDate || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Open</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.open || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Injuries</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.injuries || stats?.severe || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Near Misses</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.nearMisses || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Resolved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.resolved || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incidents..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="injury">Injury</SelectItem>
                <SelectItem value="near_miss">Near Miss</SelectItem>
                <SelectItem value="property_damage">Property Damage</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {incidentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No incidents found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredIncidents.map((incident: any) => (
                <div key={incident.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  incident.type === "injury" && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        incident.type === "injury" ? "bg-red-500/20" :
                        incident.type === "near_miss" ? "bg-yellow-500/20" :
                        "bg-orange-500/20"
                      )}>
                        <AlertTriangle className={cn(
                          "w-6 h-6",
                          incident.type === "injury" ? "text-red-400" :
                          incident.type === "near_miss" ? "text-yellow-400" :
                          "text-orange-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{incident.incidentNumber}</p>
                          <Badge className={cn("border-0", getTypeColor(incident.type))}>
                            {incident.type?.replace("_", " ")}
                          </Badge>
                          <Badge className={cn("border-0", getStatusColor(incident.status))}>
                            {incident.status}
                          </Badge>
                        </div>
                        <p className="text-slate-300 mt-1">{incident.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><User className="w-3 h-3" />Reported By</p>
                        <p className="text-white">{incident.reportedBy}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</p>
                        <p className="text-white">{incident.incidentDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Location</p>
                        <p className="text-white truncate max-w-[100px]">{incident.location}</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />View
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm line-clamp-2">{incident.description}</p>
                    {incident.correctiveActions && incident.correctiveActions.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-500 text-xs">Corrective Actions:</span>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
                          {incident.correctiveActions.filter((a: any) => a.completed).length}/{incident.correctiveActions.length} completed
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
