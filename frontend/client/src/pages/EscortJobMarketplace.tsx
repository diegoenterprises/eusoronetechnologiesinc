/**
 * ESCORT JOB MARKETPLACE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  Car, MapPin, Clock, DollarSign, Search,
  Calendar, AlertTriangle, CheckCircle, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortJobMarketplace() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const jobsQuery = (trpc as any).escorts.getAvailableJobs.useQuery({ filter, search });
  const statsQuery = (trpc as any).escorts.getMarketplaceStats.useQuery();

  const applyMutation = (trpc as any).escorts.applyForJob.useMutation({
    onSuccess: () => { toast.success("Application submitted"); jobsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Urgent</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High Priority</Badge>;
      case "normal": return <Badge className="bg-green-500/20 text-green-400 border-0">Normal</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{urgency}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "lead": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Lead</Badge>;
      case "chase": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Chase</Badge>;
      case "both": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Lead/Chase</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{position}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Escort Job Marketplace
          </h1>
          <p className="text-slate-400 text-sm mt-1">Find and apply for escort jobs</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.available || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.urgent || 0}</p>
                )}
                <p className="text-xs text-slate-400">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${stats?.avgRate || 0}/hr</p>
                )}
                <p className="text-xs text-slate-400">Avg Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.myApplications || 0}</p>
                )}
                <p className="text-xs text-slate-400">My Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search by location..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="lead">Lead Position</SelectItem>
            <SelectItem value="chase">Chase Position</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Car className="w-5 h-5 text-cyan-400" />
            Available Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (jobsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No jobs available</p>
              <p className="text-sm text-slate-500 mt-1">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(jobsQuery.data as any)?.map((job: any) => (
                <div key={job.id} className={cn("p-4", job.urgency === "urgent" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold text-lg">{job.title}</p>
                        {getUrgencyBadge(job.urgency)}
                        {getPositionBadge(job.position)}
                      </div>
                      <p className="text-sm text-slate-400">{job.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${job.rate}/hr</p>
                      <p className="text-xs text-slate-500">Est. {job.estimatedHours}h</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{job.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Navigation className="w-4 h-4" />
                      <span>{job.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>{job.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{job.startTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Posted: {job.postedAt}</span>
                      <span>|</span>
                      <span>{job.applicants} applicants</span>
                    </div>
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => applyMutation.mutate({ jobId: job.id })} disabled={job.applied}>
                      {job.applied ? <><CheckCircle className="w-4 h-4 mr-2" />Applied</> : "Apply Now"}
                    </Button>
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
