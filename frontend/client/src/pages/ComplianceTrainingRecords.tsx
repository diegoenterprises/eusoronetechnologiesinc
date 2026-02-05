/**
 * COMPLIANCE TRAINING RECORDS PAGE
 * 100% Dynamic - Track driver training and certifications
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
  GraduationCap, Search, User, Calendar, CheckCircle,
  AlertTriangle, Clock, FileText, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceTrainingRecords() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const recordsQuery = (trpc as any).compliance.getTrainingRecords.useQuery({ status: statusFilter, type: typeFilter });
  const statsQuery = (trpc as any).compliance.getDashboardStats.useQuery();

  const records = (recordsQuery.data as any)?.records || [];
  const stats = statsQuery.data as any;

  const filteredRecords = records.filter((r: any) =>
    r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    r.trainingName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-cyan-500/20 text-cyan-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "due_soon": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Training Records
          </h1>
          <p className="text-slate-400 text-sm mt-1">Driver training and certification tracking</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Assign Training
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
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Due Soon</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.dueSoon || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Expired</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>
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
                placeholder="Search by driver or training..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Training Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hazmat">Hazmat</SelectItem>
                <SelectItem value="defensive_driving">Defensive Driving</SelectItem>
                <SelectItem value="hos">HOS Compliance</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="csa">CSA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="due_soon">Due Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {recordsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No training records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredRecords.map((record: any) => (
                <div key={record.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{record.driverName}</p>
                        <p className="text-slate-400 text-sm">{record.trainingName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center w-32">
                        <p className="text-slate-400 text-xs mb-1">Progress</p>
                        <Progress value={record.progress} className="h-2" />
                        <p className="text-white text-xs mt-1">{record.progress}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Assigned</p>
                        <p className="text-white">{record.assignedDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Due</p>
                        <p className={cn(
                          record.status === "expired" ? "text-red-400" :
                          record.status === "due_soon" ? "text-yellow-400" : "text-white"
                        )}>
                          {record.dueDate}
                        </p>
                      </div>
                      <Badge className={cn("border-0", getStatusColor(record.status))}>
                        {record.status.replace("_", " ")}
                      </Badge>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {record.completedDate && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-4 text-sm">
                      <span className="text-slate-400">Completed: {record.completedDate}</span>
                      {record.score && (
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          Score: {record.score}%
                        </Badge>
                      )}
                      {record.certificateNumber && (
                        <span className="text-slate-500">Cert# {record.certificateNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
