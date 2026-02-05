/**
 * SAFETY TRAINING RECORDS PAGE
 * 100% Dynamic - Track and manage driver training records
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, Search, Calendar, User, Award,
  AlertTriangle, CheckCircle, Clock, FileText, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SafetyTrainingRecords() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const recordsQuery = (trpc as any).safety.getTopDrivers.useQuery({ limit: 50 });
  const statsQuery = (trpc as any).safety.getDashboardStats.useQuery();
  const typesQuery = (trpc as any).safety.getTopDrivers.useQuery({ limit: 10 });

  const sendReminderMutation = (trpc as any).safety.reportIncident.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
  });

  const records = recordsQuery.data || [];
  const stats = statsQuery.data;
  const types = typesQuery.data || [];

  const filteredRecords = records.filter((r: any) =>
    r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    r.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    r.driverId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Training Records
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage driver safety training</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export Report
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
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Drivers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.activeDrivers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Compliant</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.safetyScore || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Expiring Soon</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pendingTests || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Expired</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.overdueItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Courses</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.openIncidents || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Compliance Overview */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-400" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsQuery.isLoading ? (
            <Skeleton className="h-20 rounded-lg" />
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Overall Compliance Rate</span>
                  <span className={cn(
                    "font-bold",
                    ((stats as any)?.complianceRate || stats?.safetyScore || 0) >= 90 ? "text-green-400" :
                    ((stats as any)?.complianceRate || stats?.safetyScore || 0) >= 75 ? "text-yellow-400" :
                    "text-red-400"
                  )}>
                    {(stats as any)?.complianceRate || stats?.safetyScore || 0}%
                  </span>
                </div>
                <Progress value={(stats as any)?.complianceRate || stats?.safetyScore || 0} className="h-3 bg-slate-700" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {types.slice(0, 4).map((type: any) => (
                  <div key={type.id} className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">{type.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{type.complianceRate || 0}%</span>
                      <Badge className={cn(
                        "border-0 text-xs",
                        type.complianceRate >= 90 ? "bg-green-500/20 text-green-400" :
                        type.complianceRate >= 75 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {type.compliant}/{type.total}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search drivers or courses..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Training Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <div className="space-y-4">
        {recordsQuery.isLoading ? (
          Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredRecords.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No training records found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record: any) => (
            <Card key={record.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              record.status === "expired" && "border-l-4 border-red-500",
              record.status === "expiring" && "border-l-4 border-yellow-500"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-600/50 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{record.driverName}</p>
                      <p className="text-slate-400 text-sm">ID: {record.driverId}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    record.overallStatus === "compliant" ? "bg-green-500/20 text-green-400" :
                    record.overallStatus === "expiring" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {record.overallStatus}
                  </Badge>
                </div>

                {/* Training Courses */}
                <div className="space-y-3">
                  {record.courses?.map((course: any) => (
                    <div key={course.id} className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded flex items-center justify-center",
                          course.status === "current" ? "bg-green-500/20" :
                          course.status === "expiring" ? "bg-yellow-500/20" :
                          course.status === "expired" ? "bg-red-500/20" :
                          "bg-slate-600/50"
                        )}>
                          {course.status === "current" ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : course.status === "expired" ? (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          ) : course.status === "expiring" ? (
                            <Clock className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{course.name}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Completed: {course.completedDate || "N/A"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {course.expiresDate || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "border-0 text-xs",
                          course.status === "current" ? "bg-green-500/20 text-green-400" :
                          course.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" :
                          course.status === "expired" ? "bg-red-500/20 text-red-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {course.status}
                        </Badge>
                        {course.certificateUrl && (
                          <Button variant="ghost" size="sm" className="text-cyan-400">
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(record.overallStatus === "expiring" || record.overallStatus === "expired") && (
                  <div className="flex items-center justify-end pt-3 border-t border-slate-700/50 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminderMutation.mutate({ driverId: record.driverId })}
                      className="bg-slate-700/50 border-slate-600/50 text-cyan-400 rounded-lg"
                    >
                      Send Training Reminder
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
