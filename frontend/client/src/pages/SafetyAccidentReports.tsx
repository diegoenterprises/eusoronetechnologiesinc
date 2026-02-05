/**
 * SAFETY ACCIDENT REPORTS PAGE
 * 100% Dynamic - Manage and track accident reports
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
  AlertTriangle, Search, Plus, FileText, User, Truck,
  Calendar, Clock, MapPin, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyAccidentReports() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const reportsQuery = (trpc as any).safety.getAccidentReports.useQuery({ status: statusFilter !== "all" ? statusFilter : undefined });
  const statsQuery = (trpc as any).safety.getAccidentStats.useQuery();

  const reports = reportsQuery.data || [];
  const stats = statsQuery.data;

  const filteredReports = reports.filter((r: any) =>
    r.reportNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor": return "bg-yellow-500/20 text-yellow-400";
      case "moderate": return "bg-orange-500/20 text-orange-400";
      case "major": return "bg-red-500/20 text-red-400";
      case "fatal": return "bg-red-600/30 text-red-300";
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
            Accident Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Incident tracking and investigation</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Report
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
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total YTD</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.thisYear || 0}</p>
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
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Investigating</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.investigating || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Major</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.closed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Days Safe</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.avgResolutionDays || 0}</p>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search reports..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
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

      {/* Reports List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {reportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No accident reports found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredReports.map((report: any) => (
                <div key={report.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  report.severity === "major" || report.severity === "fatal" ? "border-l-4 border-red-500" : ""
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        report.severity === "fatal" ? "bg-red-600/30" :
                        report.severity === "major" ? "bg-red-500/20" :
                        report.severity === "moderate" ? "bg-orange-500/20" : "bg-yellow-500/20"
                      )}>
                        <AlertTriangle className={cn(
                          "w-6 h-6",
                          report.severity === "fatal" ? "text-red-300" :
                          report.severity === "major" ? "text-red-400" :
                          report.severity === "moderate" ? "text-orange-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{report.reportNumber}</p>
                          <Badge className={cn("border-0", getSeverityColor(report.severity))}>
                            {report.severity}
                          </Badge>
                          <Badge className={cn("border-0", getStatusColor(report.status))}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{report.incidentType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><User className="w-3 h-3" />Driver</p>
                        <p className="text-white">{report.driverName}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Truck className="w-3 h-3" />Unit</p>
                        <p className="text-white">{report.unitNumber}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date</p>
                        <p className="text-white">{report.incidentDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Location</p>
                        <p className="text-white truncate max-w-[120px]">{report.location}</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />View
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {report.injuries > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                          {report.injuries} injuries
                        </Badge>
                      )}
                      {report.vehicleDamage && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">
                          Vehicle damage
                        </Badge>
                      )}
                      {report.thirdPartyInvolved && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                          Third party involved
                        </Badge>
                      )}
                      {report.photosCount > 0 && (
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Camera className="w-3 h-3" />{report.photosCount} photos
                        </span>
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
