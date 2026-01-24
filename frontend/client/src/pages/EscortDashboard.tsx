/**
 * ESCORT DASHBOARD PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, DollarSign, Star, Calendar, MapPin, Clock,
  Shield, CheckCircle, AlertTriangle, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortDashboard() {
  const [activeTab, setActiveTab] = useState("active");

  const summaryQuery = trpc.escorts.getDashboardSummary.useQuery();
  const myJobsQuery = trpc.escorts.getMyJobs.useQuery({ status: activeTab !== "all" ? activeTab : undefined });
  const certificationsQuery = trpc.escorts.getMyCertifications.useQuery();

  const completeJobMutation = trpc.escorts.completeJob.useMutation({
    onSuccess: () => { toast.success("Job completed"); myJobsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading dashboard</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": case "in_progress": return "bg-blue-500/20 text-blue-400";
      case "upcoming": return "bg-yellow-500/20 text-yellow-400";
      case "completed": return "bg-green-500/20 text-green-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "expiring": return "bg-yellow-500/20 text-yellow-400";
      case "expired": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escort Dashboard</h1>
          <p className="text-slate-400 text-sm">Manage your escort jobs and certifications</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">Find Jobs</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.activeJobs || 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.upcomingJobs || 0}</p>
            )}
            <p className="text-xs text-slate-400">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.completedJobs || 0}</p>
            )}
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${(summary?.totalEarnings || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.rating || 0}</p>
            )}
            <p className="text-xs text-slate-400">Rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">Active</TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-600">Upcoming</TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-0">
                  {myJobsQuery.isLoading ? (
                    <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
                  ) : myJobsQuery.data?.length === 0 ? (
                    <div className="p-12 text-center">
                      <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No {activeTab} jobs</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {myJobsQuery.data?.map((job) => (
                        <div key={job.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-white font-medium">{job.title}</p>
                                <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-green-400" />{job.origin?.city}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" />{job.destination?.city}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                <Calendar className="w-3 h-3" />{job.date}
                                <Clock className="w-3 h-3 ml-2" />{job.duration}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-bold">${job.pay?.toLocaleString()}</p>
                              <div className="flex gap-1 mt-2">
                                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                                {job.status === "active" && (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => completeJobMutation.mutate({ jobId: job.id })} disabled={completeJobMutation.isPending}>
                                    {completeJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Certifications */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificationsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : certificationsQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No certifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificationsQuery.data?.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">{cert.state}</p>
                      <p className="text-xs text-slate-500">Expires: {cert.expirationDate}</p>
                    </div>
                    <Badge className={getCertStatusColor(cert.status)}>{cert.status}</Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4 border-slate-600">Manage Certifications</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
