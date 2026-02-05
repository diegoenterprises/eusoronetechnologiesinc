/**
 * SAFETY INCIDENT REPORTING PAGE
 * 100% Dynamic - Report and track safety incidents
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Search, Plus, FileText, Calendar,
  User, Truck, MapPin, Clock, CheckCircle, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SafetyIncidentReporting() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showReportForm, setShowReportForm] = useState(false);

  const incidentsQuery = (trpc as any).safety.getIncidents.useQuery({ status: statusFilter, type: typeFilter });
  const statsQuery = (trpc as any).safety.getIncidentStats.useQuery();
  const typesQuery = (trpc as any).safety.getIncidents.useQuery({});

  const submitIncidentMutation = (trpc as any).safety.reportIncident.useMutation({
    onSuccess: () => {
      toast.success("Incident reported");
      incidentsQuery.refetch();
      statsQuery.refetch();
      setShowReportForm(false);
    },
  });

  const incidents = incidentsQuery.data || [];
  const stats = statsQuery.data;
  const incidentTypes = typesQuery.data || [];

  const filteredIncidents = incidents.filter((i: any) =>
    i.description?.toLowerCase().includes(search.toLowerCase()) ||
    i.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Incident Reporting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Report and track safety incidents</p>
        </div>
        <Button
          onClick={() => setShowReportForm(!showReportForm)}
          className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Incidents</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Open</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.open || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Under Review</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.investigating || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Resolved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.resolved || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">This Month</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.thisMonth || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Report Form */}
      {showReportForm && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-400" />
              New Incident Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              submitIncidentMutation.mutate({
                type: formData.get("type") as string,
                severity: formData.get("severity") as string,
                date: formData.get("date") as string,
                location: formData.get("location") as string,
                driverId: formData.get("driverId") as string,
                description: formData.get("description") as string,
              } as any);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select name="type" required>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Incident Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select name="severity" required>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  name="date"
                  type="datetime-local"
                  required
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  name="location"
                  placeholder="Location"
                  required
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
                <Input
                  name="driverId"
                  placeholder="Driver ID or Name"
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
                <Input
                  name="truckNumber"
                  placeholder="Truck/Unit Number"
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
              </div>
              <Textarea
                name="description"
                placeholder="Describe the incident in detail..."
                required
                className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-24"
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReportForm(false)}
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitIncidentMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Submit Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search incidents..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {incidentTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidentsQuery.isLoading ? (
          Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredIncidents.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No incidents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident: any) => (
            <Card key={incident.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              incident.severity === "critical" && "border-l-4 border-red-500",
              incident.severity === "major" && "border-l-4 border-orange-500"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      incident.severity === "critical" ? "bg-red-500/20" :
                      incident.severity === "major" ? "bg-orange-500/20" :
                      incident.severity === "moderate" ? "bg-yellow-500/20" :
                      "bg-slate-600/50"
                    )}>
                      <AlertTriangle className={cn(
                        "w-6 h-6",
                        incident.severity === "critical" ? "text-red-400" :
                        incident.severity === "major" ? "text-orange-400" :
                        incident.severity === "moderate" ? "text-yellow-400" :
                        "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold">#{incident.incidentNumber}</p>
                        <Badge className={cn(
                          "border-0 text-xs",
                          incident.severity === "critical" ? "bg-red-500/20 text-red-400" :
                          incident.severity === "major" ? "bg-orange-500/20 text-orange-400" :
                          incident.severity === "moderate" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {incident.severity}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm">{incident.typeName}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    incident.status === "open" ? "bg-red-500/20 text-red-400" :
                    incident.status === "under_review" ? "bg-yellow-500/20 text-yellow-400" :
                    incident.status === "resolved" ? "bg-green-500/20 text-green-400" :
                    "bg-slate-500/20 text-slate-400"
                  )}>
                    {incident.status?.replace("_", " ")}
                  </Badge>
                </div>

                <p className="text-slate-300 mb-4 line-clamp-2">{incident.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">{incident.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">{incident.location}</span>
                  </div>
                  {incident.driverName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">{incident.driverName}</span>
                    </div>
                  )}
                  {incident.truckNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">#{incident.truckNumber}</span>
                    </div>
                  )}
                </div>

                {incident.injuries && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                    <p className="text-red-400 text-sm font-medium">Injuries Reported: {incident.injuryCount}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Reported by: {incident.reportedBy}</span>
                    <span className="text-slate-600">|</span>
                    <span>{incident.reportedAt}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-cyan-400">
                    <Eye className="w-4 h-4 mr-1" />View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
