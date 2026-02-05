/**
 * INCIDENT REPORT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, FileText, Send, Loader2, Clock, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IncidentReport() {
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const recentQuery = (trpc as any).safety.getRecentIncidents.useQuery({ limit: 5 });
  const summaryQuery = (trpc as any).safety.getIncidentSummary.useQuery();

  const submitMutation = (trpc as any).safety.reportIncident.useMutation({
    onSuccess: () => {
      toast.success("Incident reported successfully");
      setIncidentType("");
      setSeverity("");
      setDescription("");
      setLocation("");
      recentQuery.refetch();
      summaryQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to submit", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const handleSubmit = () => {
    if (!incidentType || !severity || !description) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitMutation.mutate({ type: incidentType, severity, description, location });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge className="bg-green-500/20 text-green-400 border-0">Resolved</Badge>;
      case "investigating": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Investigating</Badge>;
      case "open": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Open</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Incident Report
          </h1>
          <p className="text-slate-400 text-sm mt-1">Report and track safety incidents</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.open || 0}</p>
                )}
                <p className="text-xs text-slate-400">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.critical || 0}</p>
                )}
                <p className="text-xs text-slate-400">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.resolved || 0}</p>
                )}
                <p className="text-xs text-slate-400">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Form */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Report New Incident
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Incident Type *</label>
                <Select value={incidentType} onValueChange={setIncidentType}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="property_damage">Property Damage</SelectItem>
                    <SelectItem value="spill">Spill/Leak</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Severity *</label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Location</label>
                <Input value={location} onChange={(e: any) => setLocation(e.target.value)} placeholder="Enter location" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-sm">Description *</label>
                <Textarea value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Describe the incident in detail..." className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50 min-h-[120px]" />
              </div>

              <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-xl h-12" onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Submit Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (recentQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-slate-400">No recent incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(recentQuery.data as any)?.map((incident: any) => (
                  <div key={incident.id} className={cn("p-4 rounded-xl border", incident.severity === "critical" || incident.severity === "high" ? "bg-red-500/10 border-red-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{incident.type}</p>
                      {getStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{incident.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{incident.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
