/**
 * ESCORT JOB MARKETPLACE PAGE
 * 100% Dynamic - No mock data
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
  MapPin, DollarSign, Clock, Calendar, Shield, Search,
  AlertTriangle, CheckCircle, Eye, Loader2, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortJobMarketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const jobsQuery = trpc.escorts.getAvailableJobs.useQuery({
    state: stateFilter !== "all" ? stateFilter : undefined,
    position: positionFilter !== "all" ? positionFilter : undefined,
    search: searchTerm || undefined,
  });
  const certificationsQuery = trpc.escorts.getMyCertifications.useQuery();

  const acceptJobMutation = trpc.escorts.acceptJob.useMutation({
    onSuccess: () => { toast.success("Job accepted"); jobsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "normal": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "lead": return "bg-purple-500/20 text-purple-400";
      case "chase": return "bg-blue-500/20 text-blue-400";
      case "both": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escort Job Marketplace</h1>
          <p className="text-slate-400 text-sm">Find and accept escort jobs</p>
        </div>
      </div>

      {/* Certifications Summary */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-white font-medium">Your Certifications</p>
                {certificationsQuery.isLoading ? (
                  <Skeleton className="h-4 w-48 mt-1" />
                ) : (
                  <p className="text-sm text-slate-400">
                    {certificationsQuery.data?.filter(c => c.status === "active").length || 0} active certifications
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" className="border-slate-600">Manage Certifications</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search jobs..." className="pl-9 bg-slate-700/50 border-slate-600" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="TX">Texas</SelectItem>
            <SelectItem value="OK">Oklahoma</SelectItem>
            <SelectItem value="LA">Louisiana</SelectItem>
            <SelectItem value="NM">New Mexico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Position" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="chase">Chase</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobsQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : jobsQuery.data?.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No jobs available matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          jobsQuery.data?.map((job) => (
            <Card key={job.id} className={cn("border", getUrgencyColor(job.urgency))}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white font-bold">{job.title}</p>
                      <Badge className={getUrgencyColor(job.urgency)}>{job.urgency}</Badge>
                      <Badge className={getPositionColor(job.position)}>{job.position}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span>{job.origin?.city}, {job.origin?.state}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span>{job.destination?.city}, {job.destination?.state}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{job.startDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{job.duration}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{job.description}</p>
                    {job.requiredCertifications && job.requiredCertifications.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-400">Required: {job.requiredCertifications.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-400">${job.pay?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{job.payType}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="border-slate-600"><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => acceptJobMutation.mutate({ jobId: job.id })} disabled={acceptJobMutation.isPending}>
                        {acceptJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
