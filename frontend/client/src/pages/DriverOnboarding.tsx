/**
 * DRIVER ONBOARDING PAGE
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
  UserCheck, Search, CheckCircle, Clock, AlertTriangle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverOnboarding() {
  const [search, setSearch] = useState("");

  const onboardingQuery = (trpc as any).drivers.getOnboarding.useQuery({ search });
  const statsQuery = (trpc as any).drivers.getOnboardingStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "pending_docs": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><FileText className="w-3 h-3 mr-1" />Pending Docs</Badge>;
      case "stalled": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Stalled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Driver Onboarding</h1>
          <p className="text-slate-400 text-sm mt-1">Track onboarding progress</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><UserCheck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
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
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.stalled || 0}</p>}<p className="text-xs text-slate-400">Stalled</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-cyan-400" />Onboarding Progress</CardTitle></CardHeader>
        <CardContent className="p-0">
          {onboardingQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : (onboardingQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><UserCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No onboarding found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(onboardingQuery.data as any)?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4", driver.status === "stalled" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{driver.name?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{driver.name}</p>
                          {getStatusBadge(driver.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Started: {driver.startDate}</span>
                          <span>Step: {driver.currentStep}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">{driver.progress}%</p>
                      <p className="text-xs text-slate-500">Complete</p>
                    </div>
                  </div>
                  <Progress value={driver.progress} className="h-2 mb-2" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {driver.steps?.map((step: any, idx: number) => (
                      <Badge key={idx} className={cn("border-0", step.completed ? "bg-green-500/20 text-green-400" : step.current ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400")}>
                        {step.completed && <CheckCircle className="w-3 h-3 mr-1" />}
                        {step.name}
                      </Badge>
                    ))}
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
