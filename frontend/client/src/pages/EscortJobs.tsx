/**
 * ESCORT JOBS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, Clock, Calendar, DollarSign, Star, Shield,
  Phone, Navigation, CheckCircle, AlertTriangle, Search,
  ChevronRight, User, FileText, TrendingUp, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortJobs() {
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("all");

  const summaryQuery = trpc.escorts.getDashboardSummary.useQuery();
  const availableJobsQuery = trpc.escorts.getAvailableJobs.useQuery({
    state: filterState !== "all" ? filterState : undefined,
  });
  const myJobsQuery = trpc.escorts.getMyJobs.useQuery({});
  const certificationsQuery = trpc.escorts.getMyCertifications.useQuery();

  const acceptJobMutation = trpc.escorts.acceptJob.useMutation({
    onSuccess: () => {
      toast.success("Job accepted!", { description: "Carrier has been notified" });
      availableJobsQuery.refetch();
      myJobsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to accept job", { description: error.message });
    },
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading escort data</p>
        <p className="text-sm text-slate-500 mt-2">{summaryQuery.error.message}</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "lead": return "bg-blue-500/20 text-blue-400";
      case "chase": return "bg-purple-500/20 text-purple-400";
      case "both": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escort Jobs</h1>
          <p className="text-slate-400 text-sm">Find and manage pilot car assignments</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <FileText className="w-4 h-4 mr-2" />
          My Certifications
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-white">{summaryQuery.data?.completedThisMonth ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Jobs Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${summaryQuery.data?.monthlyEarnings?.toLocaleString() ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Monthly Earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <p className="text-2xl font-bold text-yellow-400">{summaryQuery.data?.rating ?? 0}</p>
              </div>
            )}
            <p className="text-xs text-slate-400">Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summaryQuery.data?.activeJobs ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Active Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{summaryQuery.data?.certifications?.expiringSoon ?? 0}</p>
            )}
            <p className="text-xs text-slate-400">Expiring Certs</p>
          </CardContent>
        </Card>
      </div>

      {/* Certifications Quick View */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            State Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificationsQuery.isLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-24" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {certificationsQuery.data?.map((cert) => (
                <Badge key={cert.state} className={cn("px-3 py-1", getCertStatusColor(cert.status))}>
                  {cert.state} - {cert.status === "active" ? `Exp ${cert.expirationDate}` : cert.status}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="available" className="data-[state=active]:bg-purple-600">
            Available Jobs ({availableJobsQuery.data?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="my-jobs" className="data-[state=active]:bg-purple-600">
            My Jobs ({myJobsQuery.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location..."
                className="pl-9 bg-slate-700/50 border-slate-600"
              />
            </div>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="LA">Louisiana</SelectItem>
                <SelectItem value="OK">Oklahoma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {availableJobsQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          ) : availableJobsQuery.data?.jobs?.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No available jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {availableJobsQuery.data?.jobs?.map((job) => (
                <Card key={job.id} className={cn(
                  "bg-slate-800/50 border-slate-700 transition-all hover:border-slate-600",
                  job.urgency === "high" && "border-orange-500/50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getPositionBadge(job.position)}>
                            {job.position === "both" ? "Lead + Chase" : job.position}
                          </Badge>
                          {job.urgency === "high" && (
                            <Badge className="bg-orange-500/20 text-orange-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-white font-medium mb-2">{job.title}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="text-white">{job.origin.city}, {job.origin.state}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span className="text-white">{job.destination.city}, {job.destination.state}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />{job.estimatedDuration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />{job.startDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />{job.carrier}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-green-400">${job.pay}</p>
                        <Button
                          className="mt-3 bg-purple-600 hover:bg-purple-700"
                          onClick={() => acceptJobMutation.mutate({ jobId: job.id })}
                          disabled={acceptJobMutation.isPending}
                        >
                          {acceptJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept Job"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Jobs Tab */}
        <TabsContent value="my-jobs" className="mt-6">
          {myJobsQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          ) : myJobsQuery.data?.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No active jobs</p>
                <p className="text-sm text-slate-500 mt-1">Browse available jobs to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myJobsQuery.data?.map((job) => (
                <Card key={job.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={job.status === "in_progress" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}>
                            {job.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPositionBadge(job.position)}>{job.position}</Badge>
                        </div>
                        <p className="text-white font-medium mb-2">{job.title}</p>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />{job.startDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />{job.carrier}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-slate-600">
                          <Phone className="w-4 h-4 mr-2" />Call
                        </Button>
                        <Button variant="outline" className="border-slate-600">
                          <Navigation className="w-4 h-4 mr-2" />Navigate
                        </Button>
                        {job.status === "assigned" && (
                          <Button className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />Start Job
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
