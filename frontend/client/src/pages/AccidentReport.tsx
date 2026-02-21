/**
 * ACCIDENT REPORT PAGE
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
  AlertTriangle, FileText, Camera, MapPin, Clock, User,
  Truck, Phone, Shield, CheckCircle, Upload, Eye,
  Calendar, Download, Send, Plus, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AccidentReport() {
  const [activeTab, setActiveTab] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const summaryQuery = (trpc as any).safety.getAccidentSummary.useQuery();
  const reportsQuery = (trpc as any).safety.getAccidentReports.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const pendingQuery = (trpc as any).safety.getPendingReports.useQuery();

  const submitReportMutation = (trpc as any).safety.submitAccidentReport.useMutation({
    onSuccess: () => { toast.success("Report submitted"); reportsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to submit", { description: error.message }),
  });

  const updateStatusMutation = (trpc as any).safety.updateReportStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); reportsQuery.refetch(); pendingQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading accident data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600/20 text-red-400 border-red-500/50";
      case "major": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "minor": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "near_miss": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed": return "bg-green-500/20 text-green-400";
      case "investigating": return "bg-blue-500/20 text-blue-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "open": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Accident Reports</h1>
          <p className="text-slate-400 text-sm">Safety incident tracking and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-2" />New Report</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalReports || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Reports</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.openReports || 0}</p>
            )}
            <p className="text-xs text-slate-400">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.investigating || 0}</p>
            )}
            <p className="text-xs text-slate-400">Investigating</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.closed || 0}</p>
            )}
            <p className="text-xs text-slate-400">Closed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.daysSinceLastIncident || 0}</p>
            )}
            <p className="text-xs text-slate-400">Days Safe</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {pendingQuery.data && pendingQuery.data.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-bold">{pendingQuery.data.length} Reports Pending Review</p>
                  <p className="text-sm text-slate-400">Require immediate attention</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400">Review All</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="reports" className="data-[state=active]:bg-red-600">All Reports</TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-red-600">New Report</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-red-600">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search reports..." className="bg-white/[0.04] border-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-white/[0.04] border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-white/[0.02] border-slate-700">
            <CardContent className="p-0">
              {reportsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : (reportsQuery.data as any)?.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-slate-400">No accident reports found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {(reportsQuery.data as any)?.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 hover:bg-white/[0.06]/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", report.severity === "critical" ? "bg-red-500/20" : report.severity === "major" ? "bg-orange-500/20" : "bg-yellow-500/20")}>
                          <AlertTriangle className={cn("w-5 h-5", report.severity === "critical" ? "text-red-400" : report.severity === "major" ? "text-orange-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{report.reportNumber}</p>
                            <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-400">{report.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.driverName}</span>
                            <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{report.vehicleUnit}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{report.date}</p>
                          <p className="text-xs text-slate-500">{report.time}</p>
                        </div>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          {report.status !== "closed" && (
                            <Button size="sm" variant="outline" className="border-slate-600" onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: "investigating" })} disabled={updateStatusMutation.isPending}>
                              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
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
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Plus className="w-5 h-5 text-red-400" />New Accident Report</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><Label className="text-slate-400">Date of Incident</Label><Input type="date" className="mt-1 bg-white/[0.04] border-slate-600" /></div>
                  <div><Label className="text-slate-400">Time of Incident</Label><Input type="time" className="mt-1 bg-white/[0.04] border-slate-600" /></div>
                  <div><Label className="text-slate-400">Location</Label><Input placeholder="Enter location" className="mt-1 bg-white/[0.04] border-slate-600" /></div>
                  <div>
                    <Label className="text-slate-400">Severity</Label>
                    <Select>
                      <SelectTrigger className="mt-1 bg-white/[0.04] border-slate-600"><SelectValue placeholder="Select severity" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="near_miss">Near Miss</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div><Label className="text-slate-400">Driver</Label><Input placeholder="Driver name" className="mt-1 bg-white/[0.04] border-slate-600" /></div>
                  <div><Label className="text-slate-400">Vehicle Unit</Label><Input placeholder="Vehicle unit number" className="mt-1 bg-white/[0.04] border-slate-600" /></div>
                  <div><Label className="text-slate-400">Description</Label><Textarea placeholder="Describe the incident..." className="mt-1 bg-white/[0.04] border-slate-600" rows={4} /></div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border-2 border-dashed border-slate-600 text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-slate-400">Drag photos here or click to upload</p>
                <Button variant="outline" className="mt-2 border-slate-600"><Upload className="w-4 h-4 mr-2" />Upload Photos</Button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" className="border-slate-600">Save Draft</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => submitReportMutation.mutate({})} disabled={submitReportMutation.isPending}>
                  {submitReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/[0.02] border-slate-700">
              <CardHeader><CardTitle className="text-white">Incidents by Severity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Critical", count: summary?.bySeverity?.critical || 0, color: "bg-red-500" },
                    { label: "Major", count: summary?.bySeverity?.major || 0, color: "bg-orange-500" },
                    { label: "Minor", count: summary?.bySeverity?.minor || 0, color: "bg-yellow-500" },
                    { label: "Near Miss", count: summary?.bySeverity?.nearMiss || 0, color: "bg-blue-500" },
                  ].map((item: any) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className={cn("w-4 h-4 rounded", item.color)} />
                      <span className="text-slate-400 flex-1">{item.label}</span>
                      <span className="text-white font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-slate-700">
              <CardHeader><CardTitle className="text-white">Monthly Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48 bg-slate-700/30 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Chart visualization</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
