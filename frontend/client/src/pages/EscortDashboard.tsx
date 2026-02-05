/**
 * ESCORT DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, DollarSign, Star, Calendar, MapPin,
  Clock, CheckCircle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EscortDashboard() {
  const statsQuery = (trpc as any).escorts.getDashboardStats.useQuery();
  const activeJobsQuery = (trpc as any).escorts.getActiveJobs.useQuery();
  const upcomingQuery = (trpc as any).escorts.getUpcomingJobs.useQuery({ limit: 5 });
  const certificationsQuery = (trpc as any).escorts.getCertificationStatus.useQuery();

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Escort Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your escort operations</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <MapPin className="w-4 h-4 mr-2" />Find Jobs
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Car className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.activeJobs || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Calendar className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.upcoming || 0}</p>}<p className="text-xs text-slate-400">Upcoming</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.earnings?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Earnings</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><Star className="w-6 h-6 text-emerald-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-emerald-400">{stats?.rating}</p>}<p className="text-xs text-slate-400">Rating</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {((activeJobsQuery.data as any)?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Car className="w-5 h-5 text-cyan-400" />Active Job</CardTitle></CardHeader>
          <CardContent>
            {(activeJobsQuery.data as any)?.map((job: any) => (
              <div key={job.id} className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-lg">Job #{job.jobNumber}</p>
                    <p className="text-sm text-slate-400">{job.loadDescription}</p>
                  </div>
                  <Badge className={cn("border-0", job.position === "lead" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{job.position}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500">Route</p>
                    <p className="text-white text-sm">{job.origin} → {job.destination}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500">Pay</p>
                    <p className="text-green-400 font-bold">${job.pay?.toLocaleString()}</p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">View Details</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-yellow-400" />Upcoming Jobs</CardTitle></CardHeader>
          <CardContent className="p-0">
            {upcomingQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (upcomingQuery.data as any)?.length === 0 ? (
              <div className="p-6 text-center"><Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No upcoming jobs</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(upcomingQuery.data as any)?.map((job: any) => (
                  <div key={job.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">#{job.jobNumber}</p>
                        <Badge className={cn("border-0 text-xs", job.position === "lead" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{job.position}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{job.origin} → {job.destination}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{job.startDate} @ {job.startTime}</p>
                    </div>
                    <p className="text-green-400 font-bold">${job.pay}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-green-400" />Certifications</CardTitle></CardHeader>
          <CardContent className="p-0">
            {certificationsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(certificationsQuery.data as any)?.states?.map((state: any) => (
                  <div key={state.code} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm", state.status === "active" ? "bg-green-500/20 text-green-400" : state.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{state.code}</div>
                      <div>
                        <p className="text-white font-medium text-sm">{state.name}</p>
                        <p className="text-xs text-slate-500">Exp: {state.expirationDate}</p>
                      </div>
                    </div>
                    <Badge className={cn("border-0", state.status === "active" ? "bg-green-500/20 text-green-400" : state.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{state.status}</Badge>
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
