/**
 * ACCIDENT REPORTING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, FileText, Camera, MapPin, Clock, User,
  Truck, Send, Eye, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AccidentReporting() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    location: "",
    driverId: "",
    vehicleId: "",
    severity: "",
    description: "",
    injuries: "",
    propertyDamage: "",
    policeReport: "",
  });

  const incidentsQuery = (trpc as any).safety.getIncidents.useQuery({ limit: 20 });
  const summaryQuery = (trpc as any).safety.getIncidentSummary.useQuery();
  const driversQuery = (trpc as any).drivers.list.useQuery({ limit: 100 });
  const vehiclesQuery = (trpc as any).vehicles.list.useQuery({ limit: 100 });

  const submitMutation = (trpc as any).safety.reportIncident.useMutation({
    onSuccess: () => { toast.success("Incident reported"); setShowForm(false); incidentsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to submit report", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "minor": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Minor</Badge>;
      case "moderate": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Moderate</Badge>;
      case "severe": return <Badge className="bg-red-500/20 text-red-400 border-0">Severe</Badge>;
      case "fatal": return <Badge className="bg-red-600/30 text-red-300 border-0">Fatal</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Open</Badge>;
      case "investigating": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Investigating</Badge>;
      case "closed": return <Badge className="bg-green-500/20 text-green-400 border-0">Closed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate(formData);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Accident Reporting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Report and track safety incidents</p>
        </div>
        <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />Report Incident
        </Button>
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
              <div className="p-3 rounded-full bg-purple-500/20">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.investigating || 0}</p>
                )}
                <p className="text-xs text-slate-400">Investigating</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.severe || 0}</p>
                )}
                <p className="text-xs text-slate-400">Severe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.closed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              New Incident Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Date</Label>
                <Input type="date" value={formData.date} onChange={(e: any) => setFormData({ ...formData, date: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Time</Label>
                <Input type="time" value={formData.time} onChange={(e: any) => setFormData({ ...formData, time: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Severity</Label>
                <Select value={formData.severity} onValueChange={(v: any) => setFormData({ ...formData, severity: v })}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Location</Label>
              <Input value={formData.location} onChange={(e: any) => setFormData({ ...formData, location: e.target.value })} placeholder="Address or intersection" className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Driver</Label>
                <Select value={formData.driverId} onValueChange={(v: any) => setFormData({ ...formData, driverId: v })}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {(driversQuery.data as any)?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Vehicle</Label>
                <Select value={formData.vehicleId} onValueChange={(v: any) => setFormData({ ...formData, vehicleId: v })}>
                  <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {(vehiclesQuery.data as any)?.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.unitNumber}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Description</Label>
              <Textarea value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what happened..." className="bg-slate-700/30 border-slate-600/50 rounded-lg min-h-[100px]" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                <Camera className="w-4 h-4 mr-2" />Add Photos
              </Button>
              <div className="flex-1" />
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 rounded-lg" onClick={handleSubmit} disabled={submitMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />Submit Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incidents List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {incidentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (incidentsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No incidents reported</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(incidentsQuery.data as any)?.map((incident: any) => (
                <div key={incident.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", incident.severity === "severe" && "bg-red-500/5 border-l-2 border-red-500")} onClick={() => setLocation(`/incidents/${incident.id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl", incident.severity === "severe" ? "bg-red-500/20" : incident.severity === "moderate" ? "bg-orange-500/20" : "bg-yellow-500/20")}>
                        <AlertTriangle className={cn("w-5 h-5", incident.severity === "severe" ? "text-red-400" : incident.severity === "moderate" ? "text-orange-400" : "text-yellow-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{incident.incidentNumber}</p>
                          {getSeverityBadge(incident.severity)}
                          {getStatusBadge(incident.status)}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1">{incident.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{incident.date}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{incident.driverName}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                      <Eye className="w-4 h-4" />
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
