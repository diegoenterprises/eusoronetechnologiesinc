/**
 * TRAINING MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, Search, User, CheckCircle, Clock,
  AlertTriangle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrainingManagement() {
  const [search, setSearch] = useState("");

  const trainingsQuery = (trpc as any).training.getAll.useQuery({ search });
  const statsQuery = (trpc as any).training.getStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case "upcoming": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Upcoming</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Training Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage driver training</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Assign Training
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><GraduationCap className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalCourses || 0}</p>}<p className="text-xs text-slate-400">Courses</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{stats?.completionRate}%</p>}<p className="text-xs text-slate-400">Completion</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Clock className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.inProgress || 0}</p>}<p className="text-xs text-slate-400">In Progress</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.overdue || 0}</p>}<p className="text-xs text-slate-400">Overdue</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search training..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-cyan-400" />Training Assignments</CardTitle></CardHeader>
        <CardContent className="p-0">
          {trainingsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (trainingsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><GraduationCap className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No training found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(trainingsQuery.data as any)?.map((training: any) => (
                <div key={training.id} className={cn("p-4", training.status === "overdue" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", training.status === "completed" ? "bg-green-500/20" : training.status === "overdue" ? "bg-red-500/20" : "bg-blue-500/20")}>
                        <GraduationCap className={cn("w-5 h-5", training.status === "completed" ? "text-green-400" : training.status === "overdue" ? "text-red-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{training.courseName}</p>
                          {getStatusBadge(training.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <User className="w-3 h-3" /><span>{training.driverName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>Assigned: {training.assignedDate}</span>
                          <span>Due: {training.dueDate}</span>
                          <span>{training.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="bg-white/[0.04] border-white/[0.06] rounded-lg">View</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={training.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-slate-500">{training.progress}%</span>
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
