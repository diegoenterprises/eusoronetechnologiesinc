/**
 * ESCORT INCIDENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  AlertTriangle, Search, CheckCircle, Clock, Plus,
  Eye, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EscortIncidents() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");

  const incidentsQuery = trpc.escort.getIncidents.useQuery({ search, severity });
  const statsQuery = trpc.escort.getIncidentStats.useQuery();

  const stats = statsQuery.data;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge className="bg-red-500 text-white border-0">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Medium</Badge>;
      case "low": return <Badge className="bg-green-500/20 text-green-400 border-0">Low</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case "open": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Open</Badge>;
      case "investigating": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Investigating</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Escort Incidents</h1>
          <p className="text-slate-400 text-sm mt-1">Track and report security incidents</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><AlertTriangle className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.open || 0}</p>}<p className="text-xs text-slate-400">Open</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.resolved || 0}</p>}<p className="text-xs text-slate-400">Resolved</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20"><AlertTriangle className="w-6 h-6 text-orange-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-orange-400">{stats?.critical || 0}</p>}<p className="text-xs text-slate-400">Critical</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Incidents</CardTitle></CardHeader>
        <CardContent className="p-0">
          {incidentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : !incidentsQuery.data || (Array.isArray(incidentsQuery.data) && incidentsQuery.data.length === 0) ? (
            <div className="text-center py-16"><AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No incidents found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(incidentsQuery.data) ? incidentsQuery.data : []).map((incident: any) => (
                <div key={incident.id} className={cn("p-4", incident.severity === "critical" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{incident.title}</p>
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      <p className="text-sm text-slate-400">{incident.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span>Job #{incident.jobNumber}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>
                    <span>Date: {incident.date}</span>
                    <span>Reported by: {incident.reportedBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-700/50 text-slate-300 border-0">{incident.type}</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                      <Eye className="w-4 h-4 mr-1" />View Details
                    </Button>
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
