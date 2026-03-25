/**
 * ESCORT JOB MARKETPLACE PAGE
 * GAP-081: Escort Job Matching Enhancement
 * Shows only loads that require escort services (requiresEscort=true OR oversized cargo).
 * Displays load number, cargo type, hazmat class, weight, escort positions, applicants.
 * Match scoring based on escort's certifications and state coverage.
 */

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, DollarSign, Search, Package,
  Calendar, AlertTriangle, CheckCircle, Navigation,
  Users, Shield, Weight, ArrowRight, Sparkles, Star, Target
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

type SortKey = "newest" | "match" | "pay_desc" | "distance_asc" | "urgency";

export default function EscortJobMarketplace() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("match");

  const jobsQuery = (trpc as any).escorts.getAvailableJobs.useQuery({ filter, search });
  const statsQuery = (trpc as any).escorts.getMarketplaceStats.useQuery();
  const certsQuery = (trpc as any).escorts?.getMyCertifications?.useQuery?.() || { data: null };

  const applyMutation = (trpc as any).escorts.applyForJob.useMutation({
    onSuccess: () => { toast.success("Application submitted"); jobsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;
  const jobs: any[] = jobsQuery.data || [];

  const myCerts: any[] = Array.isArray(certsQuery.data) ? certsQuery.data : [];
  const certifiedStates = useMemo(() => new Set(myCerts.filter((c: any) => c.status === "valid" || c.status === "active").map((c: any) => (c.state || "").toUpperCase().trim())), [myCerts]);

  const getMatchScore = useCallback((job: any) => {
    let score = 0;
    const originState = (job.originState || "").toUpperCase().trim();
    const destState = (job.destState || "").toUpperCase().trim();
    if (originState && certifiedStates.has(originState)) score += 40;
    if (destState && certifiedStates.has(destState)) score += 30;
    if (job.positionsOpen > 0) score += 15;
    if (job.urgency === "urgent") score += 10;
    if (!job.hazmatClass) score += 5;
    return Math.min(score, 100);
  }, [certifiedStates]);

  const getMatchTier = (score: number) => {
    if (score >= 70) return { label: "Great Match", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" };
    if (score >= 40) return { label: "Good Match", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" };
    if (score > 0) return { label: "Partial Match", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" };
    return { label: "Low Match", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30" };
  };

  // Client-side filter + sort
  const filteredJobs = useMemo(() => {
    let result = filter === "all" ? jobs
      : filter === "urgent" ? jobs.filter((j: any) => j.urgency === "urgent")
      : filter === "open" ? jobs.filter((j: any) => j.positionsOpen > 0)
      : filter === "filled" ? jobs.filter((j: any) => j.urgency === "filled")
      : filter === "matched" ? jobs.filter((j: any) => getMatchScore(j) >= 40)
      : jobs;
    result = [...result].sort((a: any, b: any) => {
      switch (sortKey) {
        case "match": return getMatchScore(b) - getMatchScore(a);
        case "pay_desc": return (b.escortPay || 0) - (a.escortPay || 0);
        case "distance_asc": return (a.distance || 9999) - (b.distance || 9999);
        case "urgency": {
          const u = (j: any) => j.urgency === "urgent" ? 0 : j.urgency === "filled" ? 2 : 1;
          return u(a) - u(b);
        }
        default: return new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
      }
    });
    return result;
  }, [jobs, filter, sortKey, getMatchScore]);

  const matchedCount = useMemo(() => jobs.filter((j: any) => getMatchScore(j) >= 40).length, [jobs, getMatchScore]);

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/20 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><Sparkles className="w-6 h-6 text-emerald-400" /></div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{matchedCount}</p>
                <p className="text-xs text-slate-400">Matched Jobs</p>
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
            <SelectItem value="matched">Best Matches</SelectItem>
            <SelectItem value="urgent">Urgent Only</SelectItem>
            <SelectItem value="open">Positions Open</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort:</span>
        {([
          { id: "match" as SortKey, label: "Best Match" },
          { id: "newest" as SortKey, label: "Newest" },
          { id: "pay_desc" as SortKey, label: "Highest Pay" },
          { id: "distance_asc" as SortKey, label: "Shortest Distance" },
          { id: "urgency" as SortKey, label: "Most Urgent" },
        ]).map((s) => (
          <button key={s.id} onClick={() => setSortKey(s.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all", sortKey === s.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
            {s.label}
          </button>
        ))}
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
                        {(() => { const ms = getMatchScore(job); const tier = getMatchTier(ms); return ms > 0 ? (
                          <Badge className={cn("border text-xs flex items-center gap-1", tier.bg, tier.color, tier.border)}>
                            <Sparkles className="w-3 h-3" />{tier.label} ({ms}%)
                          </Badge>
                        ) : null; })()}
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
                      <p className="text-xs uppercase tracking-wider text-slate-500">Pickup</p>
                      <p className="text-sm text-white font-medium">{fmtDate(job.pickupDate)}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Weight</p>
                      <p className="text-sm text-white font-medium">
                        {job.weight > 0 ? `${job.weight.toLocaleString()} lbs` : "--"}
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Escorts Needed</p>
                      <p className="text-sm text-white font-medium">
                        {job.positionsFilled}/{job.escortsNeeded}
                        <span className="text-slate-500 ml-1">filled</span>
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Applicants</p>
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
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-xs">
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
