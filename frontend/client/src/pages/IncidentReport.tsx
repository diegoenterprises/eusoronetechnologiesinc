/**
 * INCIDENT REPORT PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, FileText, Calendar, MapPin, User,
  Clock, Eye, Plus, Send, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IncidentReport() {
  const [activeTab, setActiveTab] = useState("list");
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const incidentsQuery = trpc.safety.getIncidents.useQuery();
  const summaryQuery = trpc.safety.getIncidentSummary.useQuery();

  const submitMutation = trpc.safety.submitIncident.useMutation({
    onSuccess: () => {
      toast.success("Incident reported");
      setIncidentType("");
      setSeverity("");
      setDescription("");
      setLocation("");
      incidentsQuery.refetch();
      summaryQuery.refetch();
      setActiveTab("list");
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "major": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "minor": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed": return "bg-green-500/20 text-green-400";
      case "investigating": return "bg-blue-500/20 text-blue-400";
      case "open": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const handleSubmit = () => {
    if (!incidentType || !severity || !description || !location) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitMutation.mutate({ type: incidentType, severity, description, location });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Reports</h1>
          <p className="text-slate-400 text-sm">Report and track safety incidents</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700" onClick={() => setActiveTab("new")}>
          <Plus className="w-4 h-4 mr-2" />Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summaryQuery.data?.total || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Incidents</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summaryQuery.data?.open || 0}</p>
            )}
            <p className="text-xs text-slate-400">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summaryQuery.data?.investigating || 0}</p>
            )}
            <p className="text-xs text-slate-400">Investigating</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summaryQuery.data?.closed || 0}</p>
            )}
            <p className="text-xs text-slate-400">Closed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-600">All Incidents</TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-blue-600">Report New</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {incidentsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : incidentsQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No incidents reported</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {incidentsQuery.data?.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", getSeverityColor(incident.severity))}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{incident.type}</p>
                            <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-400">{incident.description?.substring(0, 100)}...</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{incident.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{incident.reportedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />Report New Incident
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Incident Type</Label>
                  <Select value={incidentType} onValueChange={setIncidentType}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="property_damage">Property Damage</SelectItem>
                      <SelectItem value="spill">Spill/Release</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-400">Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Select severity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where did this occur?" className="mt-1 bg-slate-700/50 border-slate-600" />
              </div>
              <div>
                <Label className="text-slate-400">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." className="mt-1 bg-slate-700/50 border-slate-600" rows={5} />
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
