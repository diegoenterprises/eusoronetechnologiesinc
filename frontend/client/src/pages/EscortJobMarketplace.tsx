/**
 * ESCORT JOB MARKETPLACE PAGE
 * Shows only loads that require escort services (requiresEscort=true OR oversized cargo).
 * Displays load number, cargo type, hazmat class, weight, escort positions, applicants.
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
  Car, MapPin, DollarSign, Search, Package,
  Calendar, AlertTriangle, CheckCircle, Navigation,
  Users, Shield, Weight, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function fmtDate(iso: string) {
  if (!iso) return "--";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return "--"; }
}
function fmtDateShort(iso: string) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return ""; }
}

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
  const jobs: any[] = jobsQuery.data || [];

  // Client-side filter
  const filteredJobs = filter === "all" ? jobs
    : filter === "urgent" ? jobs.filter((j: any) => j.urgency === "urgent")
    : filter === "open" ? jobs.filter((j: any) => j.positionsOpen > 0)
    : filter === "filled" ? jobs.filter((j: any) => j.urgency === "filled")
    : jobs;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Escort Job Marketplace
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Loads requiring escort/pilot car services — oversized, hazmat, or shipper-requested
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Car className="w-6 h-6 text-blue-400" /></div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.available || 0}</p>
                )}
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.urgent || 0}</p>
                )}
                <p className="text-xs text-slate-400">Urgent (&lt;48h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">
                    {stats?.avgPay ? `$${stats.avgPay}` : "--"}
                  </p>
                )}
                <p className="text-xs text-slate-400">Avg Escort Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><CheckCircle className="w-6 h-6 text-cyan-400" /></div>
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
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search by load number or city..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="urgent">Urgent Only</SelectItem>
            <SelectItem value="open">Positions Open</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Car className="w-5 h-5 text-cyan-400" />
            Available Escort Jobs
            {!jobsQuery.isLoading && <span className="text-sm font-normal text-slate-500">({filteredJobs.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No escort jobs available</p>
              <p className="text-sm text-slate-500 mt-1">
                Only loads flagged as requiring escort services appear here.
                Check back when oversized or hazmat loads are posted.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredJobs.map((job: any) => (
                <div key={job.id} className={cn(
                  "p-5",
                  job.urgency === "urgent" && "bg-red-500/5 border-l-2 border-red-500",
                  job.urgency === "filled" && "opacity-60",
                )}>
                  {/* Row 1: Load number, badges, distance */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-base">{job.loadNumber || `Job #${job.id}`}</span>
                        {job.urgency === "urgent" && (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Urgent</Badge>
                        )}
                        {job.cargoType && (
                          <Badge className={cn("border-0 text-xs",
                            job.cargoType === "oversized" ? "bg-orange-500/20 text-orange-400"
                            : job.cargoType === "hazmat" ? "bg-red-500/20 text-red-400"
                            : "bg-slate-600/30 text-slate-300",
                          )}>
                            {job.cargoType === "oversized" ? "Oversized" : job.cargoType}
                          </Badge>
                        )}
                        {job.hazmatClass && (
                          <Badge className="bg-red-600/20 text-red-400 border-0 text-xs">
                            <Shield className="w-3 h-3 mr-1" />Hazmat {job.hazmatClass}
                          </Badge>
                        )}
                        {job.urgency === "filled" && (
                          <Badge className="bg-slate-500/20 text-slate-400 border-0 text-xs">Positions Filled</Badge>
                        )}
                      </div>
                      {job.commodityName && (
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" /> {job.commodityName}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-lg font-bold text-slate-300">
                        {job.distance > 0 ? `${Math.round(job.distance)} mi` : "--"}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Route */}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-white font-medium">{job.origin}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                    <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-white font-medium">{job.destination}</span>
                  </div>

                  {/* Row 3: Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Pickup</p>
                      <p className="text-sm text-white font-medium">{fmtDate(job.pickupDate)}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Weight</p>
                      <p className="text-sm text-white font-medium">
                        {job.weight > 0 ? `${job.weight.toLocaleString()} lbs` : "--"}
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Escorts Needed</p>
                      <p className="text-sm text-white font-medium">
                        {job.positionsFilled}/{job.escortsNeeded}
                        <span className="text-slate-500 ml-1">filled</span>
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Applicants</p>
                      <p className="text-sm text-white font-medium">{job.applicants}</p>
                    </div>
                  </div>

                  {/* Row 4: Special instructions (if any) */}
                  {job.specialInstructions && (
                    <p className="text-xs text-slate-400 italic mb-3 line-clamp-2 bg-slate-700/20 rounded px-3 py-2">
                      {job.specialInstructions}
                    </p>
                  )}

                  {/* Row 5: Footer — posted date + apply button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Posted {fmtDateShort(job.postedAt)}</span>
                      {job.positionsOpen > 0 && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                          {job.positionsOpen} position{job.positionsOpen > 1 ? "s" : ""} open
                        </Badge>
                      )}
                    </div>
                    {job.applied ? (
                      <Button variant="outline" className="border-cyan-500/30 text-cyan-400 rounded-lg" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />Applied
                      </Button>
                    ) : job.urgency === "filled" ? (
                      <Button variant="outline" className="border-slate-600 text-slate-500 rounded-lg" disabled>
                        Filled
                      </Button>
                    ) : (
                      <Button
                        className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
                        onClick={() => applyMutation.mutate({ jobId: job.id })}
                        disabled={applyMutation.isPending}
                      >
                        Apply Now
                      </Button>
                    )}
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
