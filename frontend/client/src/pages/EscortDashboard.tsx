/**
 * ESCORT DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, DollarSign, Star, Clock, MapPin, ArrowRight,
  CheckCircle, FileText, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function EscortDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("jobs");

  const summaryQuery = trpc.escorts.getDashboardSummary.useQuery();
  const jobsQuery = trpc.escorts.getMyJobs.useQuery();
  const certificationsQuery = trpc.escorts.getMyCertifications.useQuery();

  const completeMutation = trpc.escorts.completeJob.useMutation({
    onSuccess: () => { toast.success("Job completed"); jobsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "upcoming": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Upcoming</Badge>;
      case "completed": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Completed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Escort Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your escort jobs and certifications</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/escort/marketplace")}>
          <Car className="w-4 h-4 mr-2" />Find Jobs
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Car className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.activeJobs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.upcomingJobs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.completedJobs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${(summary?.totalEarnings || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.rating || 0}</p>
                )}
                <p className="text-xs text-slate-400">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="jobs" className="data-[state=active]:bg-slate-700 rounded-md">My Jobs</TabsTrigger>
          <TabsTrigger value="certifications" className="data-[state=active]:bg-slate-700 rounded-md">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">My Jobs</CardTitle></CardHeader>
            <CardContent>
              {jobsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : jobsQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Car className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No jobs yet</p>
                  <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/escort/marketplace")}>
                    Browse Available Jobs
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobsQuery.data?.map((job: any) => (
                    <div key={job.id} className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{job.loadNumber}</p>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-sm text-slate-400">{job.position} Position • {job.date}</p>
                        </div>
                        <p className="text-emerald-400 font-bold">${job.pay?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                        <MapPin className="w-3 h-3 text-green-400" />
                        <span>{job.origin?.city}, {job.origin?.state}</span>
                        <ArrowRight className="w-3 h-3" />
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{job.destination?.city}, {job.destination?.state}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                          <Eye className="w-4 h-4 mr-1" />Details
                        </Button>
                        {job.status === "active" && (
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => completeMutation.mutate({ jobId: job.id })} disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">My Certifications</CardTitle></CardHeader>
            <CardContent>
              {certificationsQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : certificationsQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No certifications yet</p>
                  <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg">
                    Add Certification
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {certificationsQuery.data?.map((cert: any) => (
                    <div key={cert.id} className={cn("p-4 rounded-xl border text-center", cert.status === "active" ? "bg-green-500/10 border-green-500/30" : cert.status === "expiring" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
                      <p className="text-white font-bold text-lg mb-1">{cert.state}</p>
                      <p className="text-xs text-slate-400 mb-2">Expires: {cert.expirationDate}</p>
                      <Badge className={cert.status === "active" ? "bg-green-500/20 text-green-400 border-0" : cert.status === "expiring" ? "bg-yellow-500/20 text-yellow-400 border-0" : "bg-red-500/20 text-red-400 border-0"}>
                        {cert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
