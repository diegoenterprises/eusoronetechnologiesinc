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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, DollarSign, Clock, Search, ArrowRight,
  AlertTriangle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortJobMarketplace() {
  const [searchTerm, setSearchTerm] = useState("");

  const jobsQuery = trpc.escorts.getAvailableJobs.useQuery({ limit: 50 });
  const summaryQuery = trpc.escorts.getMarketplaceSummary.useQuery();

  const applyMutation = trpc.escorts.applyForJob.useMutation({
    onSuccess: () => { toast.success("Application submitted"); jobsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent": return <Badge className="bg-red-500/20 text-red-400 border-0">Urgent</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High Priority</Badge>;
      case "normal": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Normal</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{urgency}</Badge>;
    }
  };

  const filteredJobs = jobsQuery.data?.filter((job: any) => {
    return !searchTerm || 
      job.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Escort Job Marketplace
          </h1>
          <p className="text-slate-400 text-sm mt-1">Find and apply for escort jobs</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
          <Car className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">Available</span>
          <span className="text-green-400 font-bold">{summary?.availableJobs || 0}</span>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.availableJobs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.urgentJobs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Urgent</p>
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
                  <p className="text-2xl font-bold text-emerald-400">${summary?.avgPay || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Pay</p>
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
                  <p className="text-2xl font-bold text-purple-400">{summary?.todayJobs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today</p>
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
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by location..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Jobs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {jobsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : filteredJobs?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Car className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No jobs available</p>
              <p className="text-slate-500 text-sm mt-1">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredJobs?.map((job: any) => (
                <div key={job.id} className={cn("p-4", job.urgency === "urgent" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{job.loadNumber}</p>
                        {getUrgencyBadge(job.urgency)}
                      </div>
                      <p className="text-sm text-slate-400">{job.position} Position • {job.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-xl">${job.pay?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{job.distance} miles</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-400" />
                      {job.origin?.city}, {job.origin?.state}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {job.destination?.city}, {job.destination?.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Pickup: {job.pickupTime}</span>
                      <span>•</span>
                      <span>Est. Duration: {job.duration}</span>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" 
                      onClick={() => applyMutation.mutate({ jobId: job.id })}
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Apply Now
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
