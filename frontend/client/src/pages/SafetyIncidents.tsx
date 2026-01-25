/**
 * SAFETY INCIDENTS PAGE - Safety Manager
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Search, Plus, FileText, Clock, CheckCircle,
  XCircle, Calendar, User, Truck, MapPin, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SafetyIncidents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const incidentsQuery = trpc.safety.getIncidents.useQuery({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const statsQuery = trpc.safety.getIncidentStats.useQuery();

  const closeMutation = trpc.safety.closeIncident.useMutation({
    onSuccess: () => {
      toast.success("Incident closed successfully");
      incidentsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to close incident", { description: error.message }),
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case "major":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Major</Badge>;
      case "minor":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Minor</Badge>;
      case "near_miss":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Near Miss</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Open</Badge>;
      case "investigating":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Investigating</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Closed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "accident":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Accident</Badge>;
      case "injury":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Injury</Badge>;
      case "spill":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Spill</Badge>;
      case "equipment":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Equipment</Badge>;
      case "near_miss":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Near Miss</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Safety Incidents
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and investigate safety incidents</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.open || 0}</p>
                    <p className="text-xs text-slate-400">Open Incidents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.investigating || 0}</p>
                    <p className="text-xs text-slate-400">Under Investigation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.thisMonth || 0}</p>
                    <p className="text-xs text-slate-400">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsQuery.data?.resolved || 0}</p>
                    <p className="text-xs text-slate-400">Resolved This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Incident Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search incidents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="spill">Spill</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="near_miss">Near Miss</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
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
          </div>
        </CardHeader>
        <CardContent>
          {incidentsQuery.isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : incidentsQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-slate-400">No incidents found</p>
              <p className="text-slate-500 text-sm">Great job maintaining safety!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidentsQuery.data?.map((incident: any) => (
                <div
                  key={incident.id}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">#{incident.id}</span>
                        {getTypeBadge(incident.type)}
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{incident.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(incident.date).toLocaleDateString()}
                        </span>
                        {incident.driver && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {incident.driver}
                          </span>
                        )}
                        {incident.vehicle && (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {incident.vehicle}
                          </span>
                        )}
                        {incident.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      {incident.status !== "closed" && (
                        <Button
                          size="sm"
                          className="bg-green-600/80 hover:bg-green-600 rounded-lg"
                          onClick={() => closeMutation.mutate({ id: incident.id })}
                          disabled={closeMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Close
                        </Button>
                      )}
                    </div>
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
