/**
 * ESCORT JOBS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, DollarSign, Clock, CheckCircle, Search,
  Plus, Eye, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EscortJobs() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");

  const jobsQuery = (trpc as any).escorts.getJobs.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).escorts.getJobsSummary.useQuery();

  const acceptMutation = (trpc as any).escorts.acceptJob.useMutation({
    onSuccess: () => { toast.success("Job accepted"); jobsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to accept job", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge className="bg-green-500/20 text-green-400 border-0">Available</Badge>;
      case "assigned": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Assigned</Badge>;
      case "in_progress": return <Badge className="bg-purple-500/20 text-purple-400 border-0">In Progress</Badge>;
      case "completed": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Completed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent": return <Badge className="bg-red-500/20 text-red-400 border-0">Urgent</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High Priority</Badge>;
      default: return null;
    }
  };

  const filteredJobs = (jobsQuery.data as any)?.filter((job: any) => {
    const matchesSearch = !searchTerm || 
      job.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || job.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Escort Jobs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Available escort and pilot car assignments</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Car className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.available || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.assigned || 0}</p>
                )}
                <p className="text-xs text-slate-400">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.inProgress || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Progress</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${(summary?.weeklyEarnings || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search jobs..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="available" className="data-[state=active]:bg-slate-700 rounded-md">Available</TabsTrigger>
          <TabsTrigger value="assigned" className="data-[state=active]:bg-slate-700 rounded-md">Assigned</TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-slate-700 rounded-md">In Progress</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {jobsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredJobs?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Car className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No jobs found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredJobs?.map((job: any) => (
                    <div key={job.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", job.urgency === "urgent" && "bg-red-500/5 border-l-2 border-red-500")}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl", job.status === "available" ? "bg-green-500/20" : job.status === "in_progress" ? "bg-purple-500/20" : "bg-blue-500/20")}>
                            <Car className={cn("w-6 h-6", job.status === "available" ? "text-green-400" : job.status === "in_progress" ? "text-purple-400" : "text-blue-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{job.loadNumber}</p>
                              {getStatusBadge(job.status)}
                              {getUrgencyBadge(job.urgency)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                              <MapPin className="w-3 h-3 text-green-400" />
                              <span>{job.origin?.city}, {job.origin?.state}</span>
                              <span>→</span>
                              <MapPin className="w-3 h-3 text-red-400" />
                              <span>{job.destination?.city}, {job.destination?.state}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {job.startDate}
                              </span>
                              <span>{job.distance} miles</span>
                              <span>Position: {job.position}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-emerald-400 font-bold text-lg">${(job.rate || 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-500">${job.ratePerMile?.toFixed(2)}/mi</p>
                          </div>
                          {job.status === "available" ? (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => acceptMutation.mutate({ jobId: job.id })} disabled={acceptMutation.isPending}>
                              <CheckCircle className="w-4 h-4 mr-1" />Accept
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation(`/escort-jobs/${job.id}`)}>
                              <Eye className="w-4 h-4 mr-1" />View
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
      </Tabs>
    </div>
  );
}
